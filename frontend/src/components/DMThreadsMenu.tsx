import React, { useState, useEffect, useRef } from "react";
import { FaComments } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { getDMThreads } from "../api/directMessages";
import { socket } from "../socket";
import type { DMThread, User } from "../types/types";
import type { DirectMessage } from "../types/socket";

interface DMThreadsMenuProps {
  currentUser: User;
  onOpenDM: (otherUser: User) => void;
  className?: string;
}

const DMThreadsMenu: React.FC<DMThreadsMenuProps> = ({
  currentUser,
  onOpenDM,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState<DMThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDMThreads();
  }, []);

  useEffect(() => {
    // Listen for new direct messages to update threads
    const handleNewDirectMessage = (message: DirectMessage) => {
      const otherUserId =
        message.sender._id === currentUser._id
          ? message.recipient._id
          : message.sender._id;

      const otherUser =
        message.sender._id === currentUser._id
          ? message.recipient
          : message.sender;

      setThreads((prev) => {
        const existingIndex = prev.findIndex(
          (thread) => thread.otherUser._id === otherUserId
        );

        if (existingIndex >= 0) {
          // Update existing thread
          const updatedThreads = [...prev];
          updatedThreads[existingIndex] = {
            ...updatedThreads[existingIndex],
            lastMessage: {
              _id: message._id,
              sender: message.sender,
              recipient: message.recipient,
              content: message.content,
              imageUrl: message.imageUrl,
              readAt: message.readAt,
              createdAt: message.createdAt,
              updatedAt: message.updatedAt,
            },
            unreadCount:
              message.sender._id !== currentUser._id
                ? updatedThreads[existingIndex].unreadCount + 1
                : updatedThreads[existingIndex].unreadCount,
          };

          // Move to top
          const [movedThread] = updatedThreads.splice(existingIndex, 1);
          return [movedThread, ...updatedThreads];
        } else {
          // Create new thread
          const newThread: DMThread = {
            otherUser: {
              _id: otherUser._id,
              username: otherUser.username,
              avatar: otherUser.avatar || "",
            },
            lastMessage: {
              _id: message._id,
              sender: message.sender,
              recipient: message.recipient,
              content: message.content,
              imageUrl: message.imageUrl,
              readAt: message.readAt,
              createdAt: message.createdAt,
              updatedAt: message.updatedAt,
            },
            unreadCount: message.sender._id !== currentUser._id ? 1 : 0,
          };

          return [newThread, ...prev];
        }
      });
    };

    const handleDirectMessagesRead = ({
      readByUserId,
    }: {
      readByUserId: string;
    }) => {
      if (readByUserId === currentUser._id) {
        // Current user read messages, update unread count
        setThreads((prev) =>
          prev.map((thread) =>
            thread.lastMessage?.sender._id !== currentUser._id
              ? { ...thread, unreadCount: 0 }
              : thread
          )
        );
      }
    };

    socket.on("newDirectMessage", handleNewDirectMessage);
    socket.on("directMessagesRead", handleDirectMessagesRead);

    return () => {
      socket.off("newDirectMessage", handleNewDirectMessage);
      socket.off("directMessagesRead", handleDirectMessagesRead);
    };
  }, [currentUser._id]);

  useEffect(() => {
    // Calculate total unread count
    const count = threads.reduce(
      (total, thread) => total + thread.unreadCount,
      0
    );
    setTotalUnreadCount(count);
  }, [threads]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDMThreads = async () => {
    try {
      setLoading(true);
      const result = await getDMThreads();
      if (result.success && result.data) {
        setThreads(result.data);
      }
    } catch (error) {
      console.error("Failed to load DM threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const truncateMessage = (message: string, maxLength: number = 30) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center gap-2 text-white hover:text-pink-300 transition-colors"
        title="Direct Messages"
      >
        <FaComments className="text-2xl" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
        <span className="text-sm opacity-90 group-hover:opacity-100 transition-opacity hidden sm:inline">
          Messages
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
                Direct Messages
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white text-xl leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <FaComments className="text-3xl mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-xs">Start a conversation with a friend!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {threads.map((thread) => (
                    <div
                      key={thread.otherUser._id}
                      onClick={() => {
                        onOpenDM(thread.otherUser);
                        setIsOpen(false);
                      }}
                      className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {thread.otherUser.avatar ? (
                            <img
                              src={thread.otherUser.avatar}
                              alt={thread.otherUser.username}
                              className="w-12 h-12 rounded-full border-2 border-white/20"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center border-2 border-white/20">
                              <span className="text-white text-lg font-medium">
                                {thread.otherUser.username
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                          )}
                          {thread.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {thread.unreadCount > 9
                                ? "9+"
                                : thread.unreadCount}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-medium truncate">
                              {thread.otherUser.username}
                            </h4>
                            {thread.lastMessage && (
                              <span className="text-xs text-white/50 flex-shrink-0">
                                {formatLastMessageTime(
                                  thread.lastMessage.createdAt
                                )}
                              </span>
                            )}
                          </div>

                          {thread.lastMessage && (
                            <div className="flex items-center gap-1 mt-1">
                              {thread.lastMessage.sender._id ===
                                currentUser._id && (
                                <span className="text-white/50 text-xs">
                                  You:{" "}
                                </span>
                              )}
                              <p
                                className={`text-sm truncate ${
                                  thread.unreadCount > 0
                                    ? "text-white font-medium"
                                    : "text-white/70"
                                }`}
                              >
                                {thread.lastMessage.imageUrl
                                  ? "📷 Image"
                                  : truncateMessage(thread.lastMessage.content)}
                              </p>
                              {thread.lastMessage.sender._id ===
                                currentUser._id &&
                                thread.lastMessage.readAt && (
                                  <span className="text-green-400 text-xs ml-auto">
                                    ✓✓
                                  </span>
                                )}
                            </div>
                          )}
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

export default DMThreadsMenu;
