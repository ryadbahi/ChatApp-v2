import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { socket } from "../../../socket";
import {
  getDirectMessages,
  markDirectMessagesAsRead,
} from "../../../api/directMessages";
import type { User } from "../../../types/types";
import type { DirectMessage } from "../../../types/socket";
import DMWindowHeader from "./DMWindowHeader";
import DMWindowMessages from "./DMWindowMessages";
import DMWindowInput from "./DMWindowInput";
import DMWindowMinimized from "./DMWindowMinimized";

interface DMWindowProps {
  otherUser: User;
  currentUser: User;
  onClose: () => void;
  isVisible: boolean;
  onlineUserIds?: Set<string>;
}

const DMWindow: React.FC<DMWindowProps> = ({
  otherUser,
  currentUser,
  onClose,
  isVisible,
  onlineUserIds,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [x, setX] = useState(window.innerWidth - 350 - 200);
  const [y, setY] = useState(window.innerHeight - 500 - 125);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isVisibleRef = useRef(isVisible);
  const isMinimizedRef = useRef(isMinimized);

  useEffect(() => {
    isVisibleRef.current = isVisible;
    isMinimizedRef.current = isMinimized;
  }, [isVisible, isMinimized]);

  useEffect(() => {
    if (isVisible) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [isVisible, otherUser._id]);

  useEffect(() => {
    const handleNewDirectMessage = (message: DirectMessage) => {
      if (
        (message.sender._id === otherUser._id &&
          message.recipient._id === currentUser._id) ||
        (message.sender._id === currentUser._id &&
          message.recipient._id === otherUser._id)
      ) {
        setMessages((prev) => [...prev, message]);
        if (message.sender._id === otherUser._id) {
          if (isVisibleRef.current && !isMinimizedRef.current) {
            markMessagesAsRead();
          }
        }
      }
    };
    const handleDirectMessagesRead = ({
      senderId,
      readAt,
    }: {
      senderId: string;
      readAt: string;
    }) => {
      if (senderId === otherUser._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender._id === senderId && !msg.readAt
              ? { ...msg, readAt }
              : msg
          )
        );
      }
    };
    const handleAllDirectMessagesRead = ({
      readerId,
      readAt,
    }: {
      readerId: string;
      readAt: string;
    }) => {
      if (readerId === otherUser._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender._id === currentUser._id && !msg.readAt
              ? { ...msg, readAt }
              : msg
          )
        );
      }
    };
    socket.on("newDirectMessage", handleNewDirectMessage);
    socket.on("directMessagesRead", handleDirectMessagesRead);
    socket.on("allDirectMessagesRead", handleAllDirectMessagesRead);
    return () => {
      socket.off("newDirectMessage", handleNewDirectMessage);
      socket.off("directMessagesRead", handleDirectMessagesRead);
      socket.off("allDirectMessagesRead", handleAllDirectMessagesRead);
    };
  }, [otherUser._id, currentUser._id]);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, isMinimized]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const result = await getDirectMessages(otherUser._id, 1, 20);
      if (result.success && result.data) {
        setMessages(result.data.messages);
        setHasMore(result.data.hasMore);
      }
    } catch (error) {
      console.error("Failed to load direct messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loading || !hasMore) return;
    try {
      setLoading(true);
      const nextPage = page + 1;
      const result = await getDirectMessages(otherUser._id, nextPage, 20);
      if (result.success && result.data) {
        setMessages((prev) => [...result.data!.messages, ...prev]);
        setHasMore(result.data.hasMore);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await markDirectMessagesAsRead(otherUser._id);
      socket.emit("markAllDirectMessagesAsRead", { senderId: otherUser._id });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore) {
      loadMoreMessages();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (
    currentMessage: DirectMessage,
    previousMessage?: DirectMessage
  ) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    return currentDate !== previousDate;
  };

  const isOnline = !!onlineUserIds && onlineUserIds.has(otherUser._id);
  if (!isVisible) return null;

  return (
    <Rnd
      size={{ width: isMinimized ? 300 : 500, height: isMinimized ? 60 : 600 }}
      position={{ x, y }}
      onDragStart={() => setIsDragging(true)}
      onDragStop={(_e, d) => {
        setIsDragging(false);
        setX(d.x);
        setY(d.y);
      }}
      onResizeStart={() => setIsResizing(true)}
      onResizeStop={(_e, _direction, _ref, _delta, position) => {
        setIsResizing(false);
        setX(position.x);
        setY(position.y);
      }}
      minWidth={isMinimized ? 100 : 500}
      minHeight={isMinimized ? 60 : 400}
      maxWidth={600}
      maxHeight={700}
      bounds="window"
      dragHandleClassName="dm-window-header"
      className={`z-50 ${
        isDragging || isResizing ? "" : "transition-all duration-300"
      }`}
    >
      <div className="h-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-xl overflow-hidden flex flex-col transition-all duration-300">
        {/* Header */}
        <DMWindowHeader
          otherUser={otherUser}
          isOnline={isOnline}
          isMinimized={isMinimized}
          onMinimize={() => setIsMinimized((v) => !v)}
          onClose={onClose}
        />
        {/* Minimized view */}
        {isMinimized ? (
          <DMWindowMinimized
            otherUser={otherUser}
            isOnline={isOnline}
            onRestore={() => setIsMinimized(false)}
          />
        ) : (
          <>
            <DMWindowMessages
              messages={messages}
              currentUser={currentUser}
              formatDate={formatDate}
              formatTime={formatTime}
              shouldShowDateSeparator={shouldShowDateSeparator}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              handleScroll={handleScroll}
              loading={loading}
              page={page}
              hasMore={hasMore}
              loadMoreMessages={loadMoreMessages}
            />
            <DMWindowInput
              onSend={(content, imageUrl) => {
                if (
                  imageUrl &&
                  (!content || content === "<br>" || content.trim() === "")
                ) {
                  socket.emit("sendDirectMessage", {
                    receiverId: otherUser._id,
                    content: "",
                    imageUrl,
                  });
                  setTimeout(() => scrollToBottom(), 300);
                } else if (
                  content &&
                  content !== "<br>" &&
                  content.trim() !== ""
                ) {
                  socket.emit("sendDirectMessage", {
                    receiverId: otherUser._id,
                    content: content,
                  });
                  setTimeout(() => scrollToBottom(), 300);
                }
              }}
            />
          </>
        )}
      </div>
    </Rnd>
  );
};

export default DMWindow;
