import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTrash, FaCheck, FaCheckDouble } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../api/notifications";
import type { Notification } from "../../types/types";
import { socket } from "../../socket";

interface NotificationsMenuProps {
  className?: string;
}

const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    // Listen for real-time notifications
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]); // Keep max 10
      setUnreadCount((prev) => prev + 1);
    };

    const handleNotificationMarkedAsRead = ({
      notificationId,
    }: {
      notificationId: string;
    }) => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleAllNotificationsMarkedAsRead = () => {
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    };

    const handleNotificationDeleted = ({
      notificationId,
    }: {
      notificationId: string;
    }) => {
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationMarkedAsRead", handleNotificationMarkedAsRead);
    socket.on(
      "allNotificationsMarkedAsRead",
      handleAllNotificationsMarkedAsRead
    );
    socket.on("notificationDeleted", handleNotificationDeleted);

    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationMarkedAsRead", handleNotificationMarkedAsRead);
      socket.off(
        "allNotificationsMarkedAsRead",
        handleAllNotificationsMarkedAsRead
      );
      socket.off("notificationDeleted", handleNotificationDeleted);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await getNotifications();
      if (result.success && result.data && Array.isArray(result.data)) {
        setNotifications(result.data);
      } else {
        setNotifications([]); // Ensure it's always an array
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]); // Ensure it's always an array on error
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const result = await getUnreadNotificationsCount();
      if (result.success && result.data) {
        setUnreadCount(result.data.count);
      }
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        socket.emit("markNotificationAsRead", { notificationId });
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        socket.emit("markAllNotificationsAsRead");
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId);
      if (result.success) {
        socket.emit("deleteNotification", { notificationId });
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return "👋";
      case "friend_accepted":
      case "friend_request_accepted":
        return "🎉";
      case "direct_message":
        return "💬";
      default:
        return "📢";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center gap-2 text-white hover:text-pink-300 transition-colors"
        title="Notifications"
      >
        <FaBell className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="text-sm opacity-90 group-hover:opacity-100 transition-opacity hidden sm:inline">
          Notifications
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">
                Notifications
              </h3>
              {Array.isArray(notifications) &&
                notifications.some((n) => !n.read) && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 transition-colors"
                    title="Mark all as read"
                  >
                    <FaCheckDouble />
                    Mark all read
                  </button>
                )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <FaBell className="text-3xl mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                  <p className="text-xs">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-white/5 transition-colors ${
                        !notification.read ? "bg-white/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-white/70 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-white/50 mt-2">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-colors"
                              title="Mark as read"
                            >
                              <FaCheck className="text-xs" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteNotification(notification._id)
                            }
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsMenu;
