import { Request, Response } from "express";
import Notification from "../models/Notification";

// Get user's notifications
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Get the latest 10 notifications
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    // Auto-archive old notifications if more than 10 exist
    const totalNotifications = await Notification.countDocuments({
      recipient: userId,
    });
    if (totalNotifications > 10) {
      const oldNotifications = await Notification.find({
        recipient: userId,
        read: true,
      })
        .sort({ createdAt: 1 })
        .limit(totalNotifications - 10);

      const oldIds = oldNotifications.map((n) => n._id);
      await Notification.deleteMany({ _id: { $in: oldIds } });
    }

    res.json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    // Auto-archive old notifications if more than 10 exist
    const totalNotifications = await Notification.countDocuments({
      recipient: userId,
    });
    if (totalNotifications > 10) {
      const oldNotifications = await Notification.find({
        recipient: userId,
        read: true,
      })
        .sort({ createdAt: 1 })
        .limit(totalNotifications - 10);

      const oldIds = oldNotifications.map((n) => n._id);
      await Notification.deleteMany({ _id: { $in: oldIds } });
    }

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete a notification
export const deleteNotification = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const notification = await Notification.findOneAndDelete({
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
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get unread notification count
export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
