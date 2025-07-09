"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmFriendRequestSent = exports.notifyFriendRequest = exports.sendNotificationToUser = exports.broadcastToFriends = exports.getUserFriends = void 0;
const index_1 = require("../index");
const Friendship_1 = __importDefault(require("../models/Friendship"));
// Get user's socket IDs
const getUserSockets = (userSockets, userId) => {
    return Array.from(userSockets[userId] || []);
};
// Helper function to get user's friends
const getUserFriends = async (userId) => {
    try {
        const friendships = await Friendship_1.default.find({
            $or: [{ user1: userId }, { user2: userId }],
        });
        return friendships.map((friendship) => {
            return friendship.user1.toString() === userId
                ? friendship.user2.toString()
                : friendship.user1.toString();
        });
    }
    catch (error) {
        console.error("Error getting user friends:", error);
        return [];
    }
};
exports.getUserFriends = getUserFriends;
// Broadcast to user's friends
const broadcastToFriends = async (userId, event, data) => {
    if (!index_1.globalSocketIO)
        return;
    try {
        const friends = await (0, exports.getUserFriends)(userId);
        friends.forEach((friendId) => {
            index_1.globalSocketIO.to(`user:${friendId}`).emit(event, data);
        });
    }
    catch (error) {
        console.error("Error broadcasting to friends:", error);
    }
};
exports.broadcastToFriends = broadcastToFriends;
// Send notification to specific user
const sendNotificationToUser = (userId, notification) => {
    console.log("[SocketNotification] sendNotificationToUser called", {
        globalSocketIOExists: !!index_1.globalSocketIO,
        userId,
        notificationType: notification.type,
        title: notification.title,
    });
    if (!index_1.globalSocketIO) {
        console.error("[SocketNotification] globalSocketIO is null or undefined!");
        return;
    }
    console.log(`[SocketNotification] Emitting to room: user:${userId}`);
    index_1.globalSocketIO.to(`user:${userId}`).emit("newNotification", notification);
    console.log("[SocketNotification] Notification emitted successfully");
};
exports.sendNotificationToUser = sendNotificationToUser;
// Send real-time friend request to recipient
const notifyFriendRequest = (recipientId, friendRequest) => {
    console.log("[SocketNotification] notifyFriendRequest called", {
        globalSocketIOExists: !!index_1.globalSocketIO,
        recipientId,
        requestId: friendRequest._id,
    });
    if (!index_1.globalSocketIO) {
        console.error("[SocketNotification] globalSocketIO is null or undefined!");
        return;
    }
    console.log(`[SocketNotification] Emitting friend request to room: user:${recipientId}`);
    index_1.globalSocketIO
        .to(`user:${recipientId}`)
        .emit("newFriendRequest", friendRequest);
    console.log("[SocketNotification] Friend request emitted successfully");
};
exports.notifyFriendRequest = notifyFriendRequest;
// Confirm friend request sent to sender
const confirmFriendRequestSent = (senderId, recipientId) => {
    console.log("[SocketNotification] confirmFriendRequestSent called", {
        globalSocketIOExists: !!index_1.globalSocketIO,
        senderId,
        recipientId,
    });
    if (!index_1.globalSocketIO) {
        console.error("[SocketNotification] globalSocketIO is null or undefined!");
        return;
    }
    console.log(`[SocketNotification] Confirming friend request sent to room: user:${senderId}`);
    index_1.globalSocketIO
        .to(`user:${senderId}`)
        .emit("friendRequestSent", { recipientId });
    console.log("[SocketNotification] Friend request confirmation emitted successfully");
};
exports.confirmFriendRequestSent = confirmFriendRequestSent;
