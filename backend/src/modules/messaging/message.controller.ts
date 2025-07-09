import { Request, Response } from "express";
import Message from "../models/Message";
import Room from "../models/Room";
import DirectMessage from "../models/DirectMessage";
import User from "../models/User";
import Friendship from "../models/Friendship";
import { asyncHandler } from "../utils/asyncHandler";

// GET /api/messages/:roomId
export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const roomId = req.params.roomId;

    if (!req.userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    // ✅ TODO: Add pagination here if time allows (infinite scroll style)
    // Load messages in batches (e.g. limit 20), and fetch older ones using createdAt

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .populate("sender", "username avatar");

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch messages" });
  }
};

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { content, imageUrl } = req.body;
    const roomId = req.params.roomId;

    if (!req.userId) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    if (!content && !imageUrl) {
      res.status(400).json({ msg: "Message must contain text or an image" });
      return;
    }

    const room = await Room.findById(roomId);

    if (!room) {
      res.status(404).json({ msg: "Room not found" });
      return;
    }

    // ✅ Create message
    const message = await Message.create({
      room: roomId,
      sender: req.userId,
      content,
      imageUrl,
    });

    const populated = await message.populate("sender", "username avatar");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ msg: "Failed to send message" });
  }
};

// Get direct messages between current user and another user
export const getDirectMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if users are friends
    const friendship = await Friendship.findOne({
      $or: [
        { user1: currentUserId, user2: otherUserId },
        { user1: otherUserId, user2: currentUserId },
      ],
    });

    if (!friendship) {
      res.status(403).json({
        success: false,
        message: "Can only view messages with friends",
      });
      return;
    }

    // Get messages between the two users
    const messages = await DirectMessage.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId },
      ],
    })
      .populate("sender", "username avatar")
      .populate("recipient", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1); // Get one extra to check if there are more

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }

    res.json({
      success: true,
      data: {
        messages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error getting direct messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get direct messages",
    });
  }
};

// Get DM threads (conversations) for current user
export const getDMThreads = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Get all friendships for the current user
    const friendships = await Friendship.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
    });

    if (friendships.length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    // Get friend IDs
    const friendIds = friendships.map((friendship) => {
      return friendship.user1.toString() === currentUserId.toString()
        ? friendship.user2
        : friendship.user1;
    });

    // Get the latest message for each friend
    const threads = await Promise.all(
      friendIds.map(async (friendId) => {
        // Get the latest message between current user and this friend
        const lastMessage = await DirectMessage.findOne({
          $or: [
            { sender: currentUserId, recipient: friendId },
            { sender: friendId, recipient: currentUserId },
          ],
        })
          .populate("sender", "username avatar")
          .populate("recipient", "username avatar")
          .sort({ createdAt: -1 });

        // Count unread messages from this friend
        const unreadCount = await DirectMessage.countDocuments({
          sender: friendId,
          recipient: currentUserId,
          readAt: null,
        });

        // Get friend info
        const friend = await User.findById(friendId).select("username avatar");

        return {
          otherUser: friend,
          lastMessage,
          unreadCount,
        };
      })
    );

    // Filter out threads with no messages and sort by last message time
    const filteredThreads = threads
      .filter((thread) => thread.lastMessage)
      .sort((a, b) => {
        const aTime = new Date(a.lastMessage!.createdAt).getTime();
        const bTime = new Date(b.lastMessage!.createdAt).getTime();
        return bTime - aTime;
      });

    res.json({
      success: true,
      data: filteredThreads,
    });
  } catch (error) {
    console.error("Error getting DM threads:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get DM threads",
    });
  }
};

// Send a direct message
export const sendDirectMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { otherUserId } = req.params;
    const { content, imageUrl } = req.body;
    const currentUserId = req.userId;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!content && !imageUrl) {
      res.status(400).json({
        success: false,
        message: "Message must contain text or an image",
      });
      return;
    }

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if users are friends
    const friendship = await Friendship.findOne({
      $or: [
        { user1: currentUserId, user2: otherUserId },
        { user1: otherUserId, user2: currentUserId },
      ],
    });

    if (!friendship) {
      res.status(403).json({
        success: false,
        message: "Can only send messages to friends",
      });
      return;
    }

    // Create the direct message
    const message = await DirectMessage.create({
      sender: currentUserId,
      recipient: otherUserId,
      content,
      imageUrl,
    });

    const populatedMessage = await message.populate([
      { path: "sender", select: "username avatar" },
      { path: "recipient", select: "username avatar" },
    ]);

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send direct message",
    });
  }
};

// Mark direct messages as read
export const markDirectMessagesAsRead = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { otherUserId } = req.params;
    const currentUserId = req.userId;

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if users are friends
    const friendship = await Friendship.findOne({
      $or: [
        { user1: currentUserId, user2: otherUserId },
        { user1: otherUserId, user2: currentUserId },
      ],
    });

    if (!friendship) {
      res.status(403).json({
        success: false,
        message: "Can only mark messages as read with friends",
      });
      return;
    }

    // Mark all unread messages from the other user as read
    await DirectMessage.updateMany(
      {
        sender: otherUserId,
        recipient: currentUserId,
        readAt: null,
      },
      {
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: "Messages marked as read",
    });
  }
);
