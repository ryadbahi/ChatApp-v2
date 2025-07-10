import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDMThreads } from "../../../api/directMessages";
import { socket } from "../../../socket";
import type { DMThread, User } from "../../../types/types";
import type { DirectMessage } from "../../../types/socket";
import DMThreadsMenuButton from "./DMThreadsMenuButton";
import DMThreadsMenuHeader from "./DMThreadsMenuHeader";
import DMThreadsMenuContent from "./DMThreadsMenuContent";

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

    const handleDirectMessagesRead = ({ senderId }: { senderId: string }) => {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.otherUser._id === senderId
            ? { ...thread, unreadCount: 0 }
            : thread
        )
      );
    };

    const handleAllDirectMessagesRead = ({
      readerId,
    }: {
      readerId: string;
    }) => {
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.otherUser._id === readerId && thread.lastMessage) {
            return {
              ...thread,
              lastMessage: {
                ...thread.lastMessage,
                readAt: new Date().toISOString(),
              },
            };
          }
          return thread;
        })
      );
    };

    socket.on("newDirectMessage", handleNewDirectMessage);
    socket.on("directMessagesRead", handleDirectMessagesRead);
    socket.on("allDirectMessagesRead", handleAllDirectMessagesRead);

    return () => {
      socket.off("newDirectMessage", handleNewDirectMessage);
      socket.off("directMessagesRead", handleDirectMessagesRead);
      socket.off("allDirectMessagesRead", handleAllDirectMessagesRead);
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

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <DMThreadsMenuButton
        totalUnreadCount={totalUnreadCount}
        onToggle={() => setIsOpen(!isOpen)}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 z-50 overflow-hidden"
          >
            {/* Header */}
            <DMThreadsMenuHeader onClose={() => setIsOpen(false)} />

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              <DMThreadsMenuContent
                threads={threads}
                currentUser={currentUser}
                loading={loading}
                onOpenDM={onOpenDM}
                onClose={() => setIsOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DMThreadsMenu;
