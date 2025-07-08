import { Request, Response } from "express";
import FriendRequest from "../models/FriendRequest";
import Friendship from "../models/Friendship";
import Notification from "../models/Notification";
import User from "../models/User";
import { Types } from "mongoose";
import {
  sendNotificationToUser,
  notifyFriendRequest,
  confirmFriendRequestSent,
} from "../utils/socketNotifications";
import { globalSocketIO } from "../index";

// Send a friend request
export const sendFriendRequest = async (
  req: Request,
  res: Response
): Promise<any> => {
  console.log("[Friends] 🚀 sendFriendRequest HTTP endpoint called", {
    body: req.body,
    userId: req.userId,
    timestamp: new Date().toISOString(),
  });

  try {
    const { recipientId } = req.body;
    const senderId = req.userId;

    console.log("[Friends] Processing friend request", {
      senderId: senderId?.toString(),
      recipientId,
      senderType: typeof senderId,
      recipientType: typeof recipientId,
    });

    if (!senderId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    if (!recipientId) {
      return res.status(400).json({ msg: "Recipient ID is required" });
    }

    // Validate ObjectIds
    if (!Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ msg: "Invalid recipient ID format" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Can't send request to yourself
    if (senderId.toString() === recipientId) {
      return res
        .status(400)
        .json({ msg: "Cannot send friend request to yourself" });
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findOne({
      $or: [
        { user1: senderId, user2: recipientId },
        { user1: recipientId, user2: senderId },
      ],
    });

    if (existingFriendship) {
      return res.status(400).json({ msg: "Already friends with this user" });
    }

    // Check if friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    });

    if (existingRequest) {
      // Return success with the existing request (idempotent behavior)
      const populatedExistingRequest = await existingRequest.populate([
        { path: "sender", select: "username avatar" },
        { path: "recipient", select: "username avatar" },
      ]);

      return res.status(200).json({
        success: true,
        message: "Friend request already exists",
        data: { friendRequest: populatedExistingRequest },
      });
    }

    // Create friend request
    const friendRequest = await FriendRequest.create({
      sender: senderId,
      recipient: recipientId,
    });

    const populatedRequest = await friendRequest.populate([
      { path: "sender", select: "username avatar" },
      { path: "recipient", select: "username avatar" },
    ]);

    // Create notification for recipient
    const sender = await User.findById(senderId).select("username");
    const notification = await Notification.create({
      recipient: recipientId,
      type: "friend_request",
      title: "New Friend Request",
      message: `${sender?.username} sent you a friend request`,
      data: {
        senderId: senderId.toString(),
        senderUsername: sender?.username,
        requestId: friendRequest._id.toString(),
      },
    });

    console.log(
      "[Friends] Friend request created successfully, notifying recipient...",
      {
        requestId: friendRequest._id,
        senderId: senderId.toString(),
        recipientId,
        senderUsername: sender?.username,
      }
    );

    // Send real-time notification to recipient
    sendNotificationToUser(recipientId, notification);
    notifyFriendRequest(recipientId, populatedRequest);

    // Confirm to sender that request was sent
    confirmFriendRequestSent(senderId.toString(), recipientId);

    console.log("[Friends] Real-time notifications sent for friend request");

    res.status(201).json({
      success: true,
      data: { friendRequest: populatedRequest },
    });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { requestId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId).populate([
      { path: "sender", select: "username avatar" },
      { path: "recipient", select: "username avatar" },
    ]);

    if (!friendRequest) {
      return res.status(404).json({ msg: "Friend request not found" });
    }

    // Only the recipient can accept
    if (friendRequest.recipient._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ msg: "Not authorized to accept this request" });
    }

    // Create friendship
    const friendship = await Friendship.create({
      user1: friendRequest.sender._id,
      user2: friendRequest.recipient._id,
    });

    // Delete the friend request
    await FriendRequest.findByIdAndDelete(requestId);

    // Create notification for sender
    const recipient = await User.findById(userId).select("username");
    const acceptanceNotification = await Notification.create({
      recipient: friendRequest.sender._id,
      type: "friend_accepted",
      title: "Friend Request Accepted",
      message: `${recipient?.username} accepted your friend request`,
      data: {
        userId: userId.toString(),
        username: recipient?.username,
        friendshipId: friendship._id.toString(),
      },
    });

    // Remove the friend request notification
    await Notification.deleteOne({
      recipient: userId,
      type: "friend_request",
      "data.requestId": requestId,
    });

    console.log("[Friends] Friend request accepted, notifying sender", {
      requestId,
      acceptedBy: recipient?.username,
      notifyingUser: friendRequest.sender._id.toString(),
    });

    // Send real-time notification to sender about acceptance
    sendNotificationToUser(
      friendRequest.sender._id.toString(),
      acceptanceNotification
    );

    // Emit friendship created event to both users
    globalSocketIO
      ?.to(`user:${friendRequest.sender._id}`)
      .emit("friendshipCreated", {
        friendship: {
          ...friendship.toObject(),
          friend: friendRequest.recipient,
        },
      });
    globalSocketIO?.to(`user:${userId}`).emit("friendshipCreated", {
      friendship: {
        ...friendship.toObject(),
        friend: friendRequest.sender,
      },
    });

    console.log("[Friends] Real-time notifications sent for friend acceptance");

    res.json({
      success: true,
      data: { friendship },
    });
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Reject a friend request
export const rejectFriendRequest = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { requestId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId).populate([
      { path: "sender", select: "username avatar" },
      { path: "recipient", select: "username avatar" },
    ]);

    if (!friendRequest) {
      return res.status(404).json({ msg: "Friend request not found" });
    }

    // Only the recipient can reject
    if (friendRequest.recipient._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ msg: "Not authorized to reject this request" });
    }

    console.log("[Friends] Friend request rejected, notifying sender", {
      requestId,
      rejectedBy: (friendRequest.recipient as any).username,
      notifyingUser: friendRequest.sender._id.toString(),
    });

    // Delete the friend request
    await FriendRequest.findByIdAndDelete(requestId);

    // Remove the friend request notification
    await Notification.deleteOne({
      recipient: userId,
      type: "friend_request",
      "data.requestId": requestId,
    });

    // Notify sender about rejection via socket
    globalSocketIO
      ?.to(`user:${friendRequest.sender._id}`)
      .emit("friendRequestRejected", {
        requestId,
        rejectedBy: {
          id: friendRequest.recipient._id,
          username: (friendRequest.recipient as any).username,
        },
      });

    console.log("[Friends] Real-time notification sent for friend rejection");

    res.json({
      success: true,
      message: "Friend request rejected",
    });
  } catch (error) {
    console.error("Error in rejectFriendRequest:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// End a friendship
export const endFriendship = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { friendId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Find and delete the friendship
    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { user1: userId, user2: friendId },
        { user1: friendId, user2: userId },
      ],
    });

    if (!friendship) {
      return res.status(404).json({ msg: "Friendship not found" });
    }

    res.json({
      success: true,
      message: "Friendship ended",
    });
  } catch (error) {
    console.error("Error in endFriendship:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get user's friends list
export const getFriends = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, msg: "User not authenticated" });
    }

    console.log("[Friends] getFriends called for user:", userId);

    // Find all friendships involving this user
    const friendships = await Friendship.find({
      $or: [{ user1: userId }, { user2: userId }],
    }).populate([
      { path: "user1", select: "username avatar createdAt" },
      { path: "user2", select: "username avatar createdAt" },
    ]);

    console.log("[Friends] Found friendships:", friendships.length);

    // Extract friends (the other user in each friendship)
    const friends = friendships.map((friendship) => {
      const friend =
        friendship.user1._id.toString() === userId.toString()
          ? friendship.user2
          : friendship.user1;

      return {
        ...(friend as any).toObject(),
        friendshipId: friendship._id,
        friendsSince: friendship.createdAt,
      };
    });

    console.log("[Friends] Returning friends list:", friends.length);

    res.json({
      success: true,
      data: friends, // Return direct array, not { friends: [] }
    });
  } catch (error) {
    console.error("Error in getFriends:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Get pending friend requests (sent and received)
export const getFriendRequests = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, msg: "User not authenticated" });
    }

    console.log("[Friends] getFriendRequests called for user:", userId);

    // Get received requests
    const receivedRequests = await FriendRequest.find({
      recipient: userId,
      status: "pending",
    }).populate("sender", "username avatar");

    console.log("[Friends] Found received requests:", receivedRequests.length);

    // Get sent requests
    const sentRequests = await FriendRequest.find({
      sender: userId,
      status: "pending",
    }).populate("recipient", "username avatar");

    console.log("[Friends] Found sent requests:", sentRequests.length);

    // Get ALL requests for debugging
    const allUserRequests = await FriendRequest.find({
      $or: [{ sender: userId }, { recipient: userId }],
    }).populate(["sender", "recipient"], "username avatar");

    console.log(
      "[Friends] All requests involving user (debug):",
      allUserRequests.map((req) => ({
        id: req._id,
        from: (req.sender as any).username,
        to: (req.recipient as any).username,
        status: req.status,
      }))
    );

    const result = {
      sent: sentRequests,
      received: receivedRequests,
    };

    console.log("[Friends] Returning friend requests:", result);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getFriendRequests:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Check friendship status between two users
export const getFriendshipStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { otherUserId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Check if they're friends
    const friendship = await Friendship.findOne({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId },
      ],
    });

    if (friendship) {
      return res.json({
        success: true,
        data: { status: "friends", friendshipId: friendship._id },
      });
    }

    // Check for pending friend request
    const sentRequest = await FriendRequest.findOne({
      sender: userId,
      recipient: otherUserId,
      status: "pending",
    });

    if (sentRequest) {
      return res.json({
        success: true,
        data: { status: "request_sent", requestId: sentRequest._id },
      });
    }

    const receivedRequest = await FriendRequest.findOne({
      sender: otherUserId,
      recipient: userId,
      status: "pending",
    });

    if (receivedRequest) {
      return res.json({
        success: true,
        data: { status: "request_received", requestId: receivedRequest._id },
      });
    }

    res.json({
      success: true,
      data: { status: "none" },
    });
  } catch (error) {
    console.error("Error in getFriendshipStatus:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Debug: Clear existing friend requests between users (for testing)
export const clearFriendRequestsBetweenUsers = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { user1Id, user2Id } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Delete any friend requests between the two users
    const deletedRequests = await FriendRequest.deleteMany({
      $or: [
        { sender: user1Id, recipient: user2Id },
        { sender: user2Id, recipient: user1Id },
      ],
    });

    // Also delete any friendships
    const deletedFriendships = await Friendship.deleteMany({
      $or: [
        { user1: user1Id, user2: user2Id },
        { user1: user2Id, user2: user1Id },
      ],
    });

    res.json({
      success: true,
      message: `Cleared ${deletedRequests.deletedCount} friend requests and ${deletedFriendships.deletedCount} friendships`,
    });
  } catch (error) {
    console.error("Error clearing friend requests:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
