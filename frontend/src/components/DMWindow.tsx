import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import {
  FaTimes,
  FaMinus,
  FaPaperPlane,
  FaImage,
  FaSmile,
} from "react-icons/fa";
import {
  getDirectMessages,
  markDirectMessagesAsRead,
} from "../api/directMessages";
import { socket } from "../socket";
import type { User } from "../types/types";
import type { DirectMessage } from "../types/socket";

interface DMWindowProps {
  otherUser: User;
  currentUser: User;
  onClose: () => void;
  isVisible: boolean;
}

const DMWindow: React.FC<DMWindowProps> = ({
  otherUser,
  currentUser,
  onClose,
  isVisible,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      loadMessages();
      markMessagesAsRead();
      inputRef.current?.focus();
    }
  }, [isVisible, otherUser._id]);

  useEffect(() => {
    // Listen for new direct messages
    const handleNewDirectMessage = (message: DirectMessage) => {
      if (
        (message.sender._id === otherUser._id &&
          message.recipient._id === currentUser._id) ||
        (message.sender._id === currentUser._id &&
          message.recipient._id === otherUser._id)
      ) {
        setMessages((prev) => [...prev, message]);
        if (message.sender._id === otherUser._id && isVisible && !isMinimized) {
          markMessagesAsRead();
        }
      }
    };

    const handleDirectMessagesRead = ({
      readByUserId,
    }: {
      readByUserId: string;
    }) => {
      if (readByUserId === otherUser._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender._id === currentUser._id && !msg.readAt
              ? { ...msg, readAt: new Date().toISOString() }
              : msg
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
  }, [otherUser._id, currentUser._id, isVisible, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const result = await getDirectMessages(otherUser._id, 1, 20);
      if (result.success && result.data) {
        setMessages(result.data.messages.reverse()); // Reverse to show newest at bottom
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
        setMessages((prev) => [...result.data!.messages.reverse(), ...prev]);
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
      socket.emit("markDirectMessageAsRead", { otherUserId: otherUser._id });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    socket.emit("sendDirectMessage", {
      recipientId: otherUser._id,
      message: messageContent,
    });
  };

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

  if (!isVisible) return null;

  return (
    <Rnd
      default={{
        x: window.innerWidth - 400 - 20,
        y: window.innerHeight - 500 - 20,
        width: 400,
        height: isMinimized ? 50 : 500,
      }}
      minWidth={300}
      minHeight={isMinimized ? 50 : 400}
      maxWidth={600}
      maxHeight={700}
      bounds="window"
      dragHandleClassName="dm-window-header"
      className="z-50"
    >
      <div className="h-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="dm-window-header flex items-center justify-between p-3 bg-white/5 border-b border-white/20 cursor-move">
          <div className="flex items-center gap-3">
            {otherUser.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.username}
                className="w-8 h-8 rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center border-2 border-white/20">
                <span className="text-white text-sm font-medium">
                  {otherUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-white font-medium text-sm">
                {otherUser.username}
              </h3>
              <p className="text-white/60 text-xs">Direct Message</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              title={isMinimized ? "Restore" : "Minimize"}
            >
              <FaMinus className="text-xs" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Close"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        {!isMinimized && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-3 space-y-2"
            >
              {loading && page === 1 && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}

              {hasMore && page > 1 && (
                <div className="text-center py-2">
                  <button
                    onClick={loadMoreMessages}
                    disabled={loading}
                    className="text-white/60 hover:text-white text-xs transition-colors"
                  >
                    {loading ? "Loading..." : "Load more messages"}
                  </button>
                </div>
              )}

              {messages.map((message, index) => {
                const isOwnMessage = message.sender._id === currentUser._id;
                const previousMessage = messages[index - 1];
                const showDateSeparator = shouldShowDateSeparator(
                  message,
                  previousMessage
                );

                return (
                  <div key={message._id}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-white/10 text-white/60 text-xs px-3 py-1 rounded-full">
                          {formatDate(message.createdAt)}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          isOwnMessage ? "order-2" : "order-1"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-lg ${
                            isOwnMessage
                              ? "bg-purple-500/30 text-white border border-purple-400/30"
                              : "bg-white/10 text-white border border-white/20"
                          }`}
                        >
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="Shared image"
                              className="max-w-full h-auto rounded-lg mb-2"
                            />
                          )}
                          <p className="text-sm break-words">
                            {message.content}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-1 text-xs text-white/50 ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>{formatTime(message.createdAt)}</span>
                          {isOwnMessage && message.readAt && (
                            <span className="text-green-400">✓✓</span>
                          )}
                          {isOwnMessage && !message.readAt && (
                            <span className="text-white/50">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-white/20"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${otherUser.username}...`}
                  className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50"
                />
                <button
                  type="button"
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Add image"
                >
                  <FaImage className="text-sm" />
                </button>
                <button
                  type="button"
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Add emoji"
                >
                  <FaSmile className="text-sm" />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <FaPaperPlane className="text-sm" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Rnd>
  );
};

export default DMWindow;
