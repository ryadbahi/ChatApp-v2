import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notifications.controller";

const router = Router();

// All notification routes require authentication
router.use(protect);

// GET /api/notifications - Get user's notifications
router.get("/", getNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get("/unread-count", getUnreadCount);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put("/:notificationId/read", markNotificationAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put("/read-all", markAllNotificationsAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete("/:notificationId", deleteNotification);

export default router;
