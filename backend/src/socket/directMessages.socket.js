"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDirectMessageEvents = void 0;
const DirectMessage_1 = __importDefault(require("../models/DirectMessage"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const notifications_socket_1 = require("./notifications.socket");
const inactivity_socket_1 = require("./inactivity.socket");
const registerDirectMessageEvents = (socket, io, userId, userSockets) => {
    socket.on("sendDirectMessage", async ({ receiverId, content, imageUrl }) => {
        (0, inactivity_socket_1.updateUserActivity)(userId, io, userSockets, "sendDirectMessage");
        try {
            if ((!content?.trim() && !imageUrl) || !receiverId) {
                return;
            }
            const directMessage = await DirectMessage_1.default.create({
                sender: userId,
                recipient: receiverId,
                content: content || "",
                imageUrl,
            });
            const populated = await directMessage.populate([
                { path: "sender", select: "username avatar" },
                { path: "recipient", select: "username avatar" },
            ]);
            // Send to sender
            const senderSockets = Array.from(userSockets[userId] || []);
            senderSockets.forEach((socketId) => {
                io.to(socketId).emit("newDirectMessage", populated);
            });
            // Send to receiver
            const receiverSockets = Array.from(userSockets[receiverId] || []);
            receiverSockets.forEach((socketId) => {
                io.to(socketId).emit("newDirectMessage", populated);
            });
            // Create notification for receiver if they're not online
            if (receiverSockets.length === 0) {
                const sender = await User_1.default.findById(userId).select("username avatar");
                if (sender) {
                    const notification = await Notification_1.default.create({
                        recipient: receiverId,
                        type: "direct_message",
                        title: "New Message",
                        message: `${sender.username} sent you a message`,
                        data: {
                            senderId: userId,
                            senderUsername: sender.username,
                            senderAvatar: sender.avatar,
                            messageId: directMessage._id,
                        },
                    });
                    (0, notifications_socket_1.sendNotificationToUser)(io, receiverId, notification, userSockets);
                }
            }
        }
        catch (error) {
            console.error("[Socket] Error in sendDirectMessage:", error);
        }
    });
    socket.on("markDirectMessageAsRead", async ({ messageId }) => {
        try {
            if (!messageId)
                return;
            const message = await DirectMessage_1.default.findById(messageId);
            if (!message || message.recipient.toString() !== userId) {
                return;
            }
            message.readAt = new Date();
            await message.save();
            // Notify sender that message was read
            const senderSockets = Array.from(userSockets[message.sender.toString()] || []);
            senderSockets.forEach((socketId) => {
                io.to(socketId).emit("directMessageRead", {
                    messageId,
                    readAt: message.readAt,
                    readBy: userId,
                });
            });
            // Emit to all user's sockets that DMs were read
            const userSocketsList = Array.from(userSockets[userId] || []);
            userSocketsList.forEach((socketId) => {
                io.to(socketId).emit("directMessagesRead", {
                    senderId: message.sender.toString(),
                    readAt: message.readAt,
                });
            });
        }
        catch (error) {
            console.error("[Socket] Error in markDirectMessageAsRead:", error);
        }
    });
    socket.on("markAllDirectMessagesAsRead", async ({ senderId }) => {
        try {
            if (!senderId)
                return;
            await DirectMessage_1.default.updateMany({ sender: senderId, recipient: userId, readAt: null }, { readAt: new Date() });
            // Notify sender that all messages were read
            const senderSockets = Array.from(userSockets[senderId] || []);
            const readAt = new Date();
            senderSockets.forEach((socketId) => {
                io.to(socketId).emit("allDirectMessagesRead", {
                    readerId: userId,
                    readAt,
                });
            });
            // Emit to all user's sockets that DMs were read
            const userSocketsList = Array.from(userSockets[userId] || []);
            userSocketsList.forEach((socketId) => {
                io.to(socketId).emit("directMessagesRead", {
                    senderId,
                    readAt,
                });
            });
        }
        catch (error) {
            console.error("[Socket] Error in markAllDirectMessagesAsRead:", error);
        }
    });
};
exports.registerDirectMessageEvents = registerDirectMessageEvents;
