"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationToUser = exports.broadcastToFriends = exports.getUserFriends = void 0;
const Friendship_1 = __importDefault(require("../models/Friendship"));
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
// Helper function to broadcast to user's friends
const broadcastToFriends = async (io, userId, event, data, userSockets) => {
    try {
        const friends = await (0, exports.getUserFriends)(userId);
        friends.forEach((friendId) => {
            const sockets = Array.from(userSockets[friendId] || []);
            sockets.forEach((socketId) => {
                io.to(socketId).emit(event, data);
            });
        });
    }
    catch (error) {
        console.error("Error broadcasting to friends:", error);
    }
};
exports.broadcastToFriends = broadcastToFriends;
// Helper function to send notification
const sendNotificationToUser = (io, userId, notification, userSockets) => {
    const sockets = Array.from(userSockets[userId] || []);
    sockets.forEach((socketId) => {
        io.to(socketId).emit("newNotification", notification);
    });
};
exports.sendNotificationToUser = sendNotificationToUser;
