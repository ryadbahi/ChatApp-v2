"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNotificationEvents = exports.sendNotificationToUser = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const sendNotificationToUser = (io, userId, notification, userSockets) => {
    const sockets = Array.from(userSockets[userId] || []);
    sockets.forEach((socketId) => {
        io.to(socketId).emit("newNotification", notification);
    });
};
exports.sendNotificationToUser = sendNotificationToUser;
const registerNotificationEvents = (socket, io, userId) => {
    socket.on("markNotificationAsRead", async ({ notificationId }) => {
        try {
            if (!notificationId)
                return;
            const notif = await Notification_1.default.findById(notificationId);
            if (!notif || notif.recipient.toString() !== userId) {
                return;
            }
            notif.read = true;
            await notif.save();
            socket.emit("notificationMarkedAsRead", { notificationId });
        }
        catch (error) {
            console.error("[Socket] Error in markNotificationAsRead:", error);
        }
    });
    socket.on("markAllNotificationsAsRead", async () => {
        try {
            await Notification_1.default.updateMany({ recipient: userId, read: false }, { read: true });
            socket.emit("allNotificationsMarkedAsRead");
        }
        catch (error) {
            console.error("[Socket] Error in markAllNotificationsAsRead:", error);
        }
    });
    socket.on("deleteNotification", async ({ notificationId }) => {
        try {
            if (!notificationId)
                return;
            const notif = await Notification_1.default.findById(notificationId);
            if (!notif || notif.recipient.toString() !== userId) {
                return;
            }
            await Notification_1.default.findByIdAndDelete(notificationId);
            socket.emit("notificationDeleted", { notificationId });
        }
        catch (error) {
            console.error("[Socket] Error in deleteNotification:", error);
        }
    });
};
exports.registerNotificationEvents = registerNotificationEvents;
