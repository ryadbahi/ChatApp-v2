"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markDirectMessagesAsRead = exports.sendDirectMessage = exports.getDMThreads = exports.getDirectMessages = exports.sendMessage = exports.getMessages = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const Room_1 = __importDefault(require("../models/Room"));
const DirectMessage_1 = __importDefault(require("../models/DirectMessage"));
const User_1 = __importDefault(require("../models/User"));
const Friendship_1 = __importDefault(require("../models/Friendship"));
const asyncHandler_1 = require("../utils/asyncHandler");
// GET /api/messages/:roomId
const getMessages = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        if (!req.userId) {
            res.status(401).json({ msg: "Unauthorized" });
            return;
        }
        // ✅ TODO: Add pagination here if time allows (infinite scroll style)
        // Load messages in batches (e.g. limit 20), and fetch older ones using createdAt
        const room = await Room_1.default.findById(roomId);
        if (!room) {
            res.status(404).json({ msg: "Room not found" });
            return;
        }
        const messages = await Message_1.default.find({ room: roomId })
            .sort({ createdAt: 1 })
            .populate("sender", "username avatar");
        res.status(200).json(messages);
    }
    catch (err) {
        res.status(500).json({ msg: "Failed to fetch messages" });
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
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
        const room = await Room_1.default.findById(roomId);
        if (!room) {
            res.status(404).json({ msg: "Room not found" });
            return;
        }
        // ✅ Create message
        const message = await Message_1.default.create({
            room: roomId,
            sender: req.userId,
            content,
            imageUrl,
        });
        const populated = await message.populate("sender", "username avatar");
        res.status(201).json(populated);
    }
    catch (err) {
        res.status(500).json({ msg: "Failed to send message" });
    }
};
exports.sendMessage = sendMessage;
// Get direct messages between current user and another user
const getDirectMessages = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const currentUserId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        if (!currentUserId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Verify the other user exists
        const otherUser = await User_1.default.findById(otherUserId);
        if (!otherUser) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        // Check if users are friends
        const friendship = await Friendship_1.default.findOne({
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
        const messages = await DirectMessage_1.default.find({
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
    }
    catch (error) {
        console.error("Error getting direct messages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get direct messages",
        });
    }
};
exports.getDirectMessages = getDirectMessages;
// Get DM threads (conversations) for current user
const getDMThreads = async (req, res) => {
    try {
        const currentUserId = req.userId;
        if (!currentUserId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Get all friendships for the current user
        const friendships = await Friendship_1.default.find({
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
        const threads = await Promise.all(friendIds.map(async (friendId) => {
            // Get the latest message between current user and this friend
            const lastMessage = await DirectMessage_1.default.findOne({
                $or: [
                    { sender: currentUserId, recipient: friendId },
                    { sender: friendId, recipient: currentUserId },
                ],
            })
                .populate("sender", "username avatar")
                .populate("recipient", "username avatar")
                .sort({ createdAt: -1 });
            // Count unread messages from this friend
            const unreadCount = await DirectMessage_1.default.countDocuments({
                sender: friendId,
                recipient: currentUserId,
                readAt: null,
            });
            // Get friend info
            const friend = await User_1.default.findById(friendId).select("username avatar");
            return {
                otherUser: friend,
                lastMessage,
                unreadCount,
            };
        }));
        // Filter out threads with no messages and sort by last message time
        const filteredThreads = threads
            .filter((thread) => thread.lastMessage)
            .sort((a, b) => {
            const aTime = new Date(a.lastMessage.createdAt).getTime();
            const bTime = new Date(b.lastMessage.createdAt).getTime();
            return bTime - aTime;
        });
        res.json({
            success: true,
            data: filteredThreads,
        });
    }
    catch (error) {
        console.error("Error getting DM threads:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get DM threads",
        });
    }
};
exports.getDMThreads = getDMThreads;
// Send a direct message
const sendDirectMessage = async (req, res) => {
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
        const otherUser = await User_1.default.findById(otherUserId);
        if (!otherUser) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        // Check if users are friends
        const friendship = await Friendship_1.default.findOne({
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
        const message = await DirectMessage_1.default.create({
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
    }
    catch (error) {
        console.error("Error sending direct message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send direct message",
        });
    }
};
exports.sendDirectMessage = sendDirectMessage;
// Mark direct messages as read
exports.markDirectMessagesAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { otherUserId } = req.params;
    const currentUserId = req.userId;
    // Verify the other user exists
    const otherUser = await User_1.default.findById(otherUserId);
    if (!otherUser) {
        res.status(404).json({
            success: false,
            message: "User not found",
        });
        return;
    }
    // Check if users are friends
    const friendship = await Friendship_1.default.findOne({
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
    await DirectMessage_1.default.updateMany({
        sender: otherUserId,
        recipient: currentUserId,
        readAt: null,
    }, {
        readAt: new Date(),
    });
    res.json({
        success: true,
        message: "Messages marked as read",
    });
});
