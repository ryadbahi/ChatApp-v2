"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notifications_controller_1 = require("../controllers/notifications.controller");
const router = (0, express_1.Router)();
// All notification routes require authentication
router.use(auth_middleware_1.protect);
// GET /api/notifications - Get user's notifications
router.get("/", notifications_controller_1.getNotifications);
// GET /api/notifications/unread-count - Get unread notification count
router.get("/unread-count", notifications_controller_1.getUnreadCount);
// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put("/:notificationId/read", notifications_controller_1.markNotificationAsRead);
// PUT /api/notifications/read-all - Mark all notifications as read
router.put("/read-all", notifications_controller_1.markAllNotificationsAsRead);
// DELETE /api/notifications/:notificationId - Delete notification
router.delete("/:notificationId", notifications_controller_1.deleteNotification);
exports.default = router;
