import { Request, Response } from "express";
import DirectMessage from "../models/DirectMessage";
import User from "../models/User";

// Get direct messages between two users
export const getDirectMessages = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { otherUserId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Get messages between the two users
    const messages = await DirectMessage.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId },
      ],
    })
      .populate("sender", "username avatar")
      .populate("recipient", "username avatar")
      .sort({ createdAt: 1 })
      .limit(100); // Limit to last 100 messages

    res.json({
      success: true,
      data: {
        messages,
        otherUser: {
          _id: otherUser._id,
          username: otherUser.username,
          avatar: otherUser.avatar,
        },
      },
    });
  } catch (error) {
    console.error("Error in getDirectMessages:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get list of users who have exchanged messages with current user
export const getDirectMessageContacts = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Get unique contacts (users who have sent or received messages from current user)
    const contacts = await DirectMessage.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$recipient", "$sender"],
          },
          lastMessage: { $last: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", userId] },
                    { $eq: ["$readAt", null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: "$user._id",
          username: "$user.username",
          avatar: "$user.avatar",
          lastMessage: "$lastMessage",
          unreadCount: "$unreadCount",
        },
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    res.json({
      success: true,
      data: { contacts },
    });
  } catch (error) {
    console.error("Error in getDirectMessageContacts:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { otherUserId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Mark all unread messages from the other user as read
    await DirectMessage.updateMany(
      {
        sender: otherUserId,
        recipient: userId,
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
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Search users for direct messaging
export const searchUsersForDM = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { query } = req.query;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    if (!query || typeof query !== "string") {
      return res.status(400).json({ msg: "Search query is required" });
    }

    // Search users by username (excluding current user)
    const users = await User.find({
      _id: { $ne: userId },
      username: { $regex: query, $options: "i" },
    })
      .select("_id username avatar")
      .limit(20);

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error("Error in searchUsersForDM:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
