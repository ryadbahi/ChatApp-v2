"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
// Get user's notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        // Get the latest 10 notifications
        const notifications = await Notification_1.default.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json({
            success: true,
            data: { notifications },
        });
    }
    catch (error) {
        console.error("Error in getNotifications:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
exports.getNotifications = getNotifications;
// Mark notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const notification = await Notification_1.default.findOneAndUpdate({ _id: notificationId, recipient: userId }, { read: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ msg: "Notification not found" });
        }
        // Auto-archive old notifications if more than 10 exist
        const totalNotifications = await Notification_1.default.countDocuments({
            recipient: userId,
        });
        if (totalNotifications > 10) {
            const oldNotifications = await Notification_1.default.find({
                recipient: userId,
                read: true,
            })
                .sort({ createdAt: 1 })
                .limit(totalNotifications - 10);
            const oldIds = oldNotifications.map((n) => n._id);
            await Notification_1.default.deleteMany({ _id: { $in: oldIds } });
        }
        res.json({
            success: true,
            data: { notification },
        });
    }
    catch (error) {
        console.error("Error in markNotificationAsRead:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        await Notification_1.default.updateMany({ recipient: userId, read: false }, { read: true });
        // Auto-archive old notifications if more than 10 exist
        const totalNotifications = await Notification_1.default.countDocuments({
            recipient: userId,
        });
        if (totalNotifications > 10) {
            const oldNotifications = await Notification_1.default.find({
                recipient: userId,
                read: true,
            })
                .sort({ createdAt: 1 })
                .limit(totalNotifications - 10);
            const oldIds = oldNotifications.map((n) => n._id);
            await Notification_1.default.deleteMany({ _id: { $in: oldIds } });
        }
        res.json({
            success: true,
            message: "All notifications marked as read",
        });
    }
    catch (error) {
        console.error("Error in markAllNotificationsAsRead:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Delete a notification
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const notification = await Notification_1.default.findOneAndDelete({
            _id: notificationId,
            recipient: userId,
        });
        if (!notification) {
            return res.status(404).json({ msg: "Notification not found" });
        }
        res.json({
            success: true,
            message: "Notification deleted",
        });
    }
    catch (error) {
        console.error("Error in deleteNotification:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
exports.deleteNotification = deleteNotification;
// Get unread notification count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const unreadCount = await Notification_1.default.countDocuments({
            recipient: userId,
            read: false,
        });
        res.json({
            success: true,
            data: { unreadCount },
        });
    }
    catch (error) {
        console.error("Error in getUnreadCount:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
exports.getUnreadCount = getUnreadCount;
