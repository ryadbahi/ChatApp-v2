import { Request, Response } from "express";
import DirectMessage from "../models/DirectMessage";
import User from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";

// Get direct messages between two users
export const getDirectMessages = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.userId;
    const { otherUserId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    if (!otherUserId) {
      return res.status(400).json({ msg: "Other user ID is required" });
    }

    try {
      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Get total count for hasMore calculation
      const totalMessages = await DirectMessage.countDocuments({
        $or: [
          { sender: userId, recipient: otherUserId },
          { sender: otherUserId, recipient: userId },
        ],
      });

      // Get messages between the two users with pagination
      // Sort by createdAt descending to get newest first, then reverse for oldest first display
      const messages = await DirectMessage.find({
        $or: [
          { sender: userId, recipient: otherUserId },
          { sender: otherUserId, recipient: userId },
        ],
      })
        .populate("sender", "username avatar")
        .populate("recipient", "username avatar")
        .sort({ createdAt: -1 }) // Get newest first
        .skip(skip)
        .limit(limit);

      // Reverse to show oldest first (chronological order)
      const orderedMessages = messages.reverse();

      // Calculate if there are more messages
      const hasMore = skip + messages.length < totalMessages;

      res.json({
        success: true,
        data: {
          messages: orderedMessages,
          hasMore,
          total: totalMessages,
          page,
          limit,
        },
      });
    } catch (error) {
      console.error("Error fetching direct messages:", error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// Send a direct message
export const sendDirectMessage = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const senderId = req.userId;
    const { recipientId, content, imageUrl } = req.body;

    if (!senderId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    if (!recipientId) {
      return res.status(400).json({ msg: "Recipient ID is required" });
    }

    if (!content && !imageUrl) {
      return res
        .status(400)
        .json({ msg: "Message content or image is required" });
    }

    try {
      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ msg: "Recipient not found" });
      }

      // Create the direct message
      const directMessage = new DirectMessage({
        sender: senderId,
        recipient: recipientId,
        content: content || "",
        imageUrl: imageUrl || undefined,
      });

      await directMessage.save();

      // Populate sender and recipient data
      await directMessage.populate("sender", "username avatar");
      await directMessage.populate("recipient", "username avatar");

      res.status(201).json({
        success: true,
        data: directMessage,
      });
    } catch (error) {
      console.error("Error sending direct message:", error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// Mark messages as read
export const markMessagesAsRead = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.userId;
    const { otherUserId } = req.params;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    if (!otherUserId) {
      return res.status(400).json({ msg: "Other user ID is required" });
    }

    try {
      // Mark all unread messages from otherUserId to userId as read
      await DirectMessage.updateMany(
        {
          sender: otherUserId,
          recipient: userId,
          readAt: { $exists: false },
        },
        {
          readAt: new Date(),
        }
      );

      res.json({
        success: true,
        msg: "Messages marked as read",
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// Get unread message count
export const getUnreadMessageCount = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    try {
      const unreadCount = await DirectMessage.countDocuments({
        recipient: userId,
        readAt: { $exists: false },
      });

      res.json({
        success: true,
        data: { unreadCount },
      });
    } catch (error) {
      console.error("Error getting unread message count:", error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// Get recent conversations
export const getRecentConversations = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    try {
      // Get the most recent message for each unique conversation
      const conversations = await DirectMessage.aggregate([
        {
          $match: {
            $or: [{ sender: userId }, { recipient: userId }],
          },
        },
        {
          $addFields: {
            otherUser: {
              $cond: {
                if: { $eq: ["$sender", userId] },
                then: "$recipient",
                else: "$sender",
              },
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: "$otherUser",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$recipient", userId] },
                      { $eq: [{ $ifNull: ["$readAt", null] }, null] },
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "otherUserData",
          },
        },
        {
          $unwind: "$otherUserData",
        },
        {
          $lookup: {
            from: "users",
            localField: "lastMessage.sender",
            foreignField: "_id",
            as: "senderData",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "lastMessage.recipient",
            foreignField: "_id",
            as: "recipientData",
          },
        },
        {
          $project: {
            _id: 1,
            otherUser: {
              _id: "$otherUserData._id",
              username: "$otherUserData.username",
              avatar: "$otherUserData.avatar",
            },
            lastMessage: {
              _id: "$lastMessage._id",
              sender: { $arrayElemAt: ["$senderData", 0] },
              recipient: { $arrayElemAt: ["$recipientData", 0] },
              content: "$lastMessage.content",
              imageUrl: "$lastMessage.imageUrl",
              readAt: "$lastMessage.readAt",
              createdAt: "$lastMessage.createdAt",
              updatedAt: "$lastMessage.updatedAt",
            },
            unreadCount: 1,
          },
        },
        {
          $sort: { "lastMessage.createdAt": -1 },
        },
      ]);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      console.error("Error getting recent conversations:", error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);
