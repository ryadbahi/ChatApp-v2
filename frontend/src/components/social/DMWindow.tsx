import React, { useState, useEffect, useRef } from "react";
import RichMessageInput from "../messaging/RichMessageInput";
import { Rnd } from "react-rnd";
import { FaTimes, FaMinus } from "react-icons/fa";
import {
  getDirectMessages,
  markDirectMessagesAsRead,
} from "../../api/directMessages";
import { socket } from "../../socket";
import type { User } from "../../types/types";
import type { DirectMessage } from "../../types/socket";

interface DMWindowProps {
  otherUser: User;
  currentUser: User;
  onClose: () => void;
  isVisible: boolean;
  onlineUserIds?: Set<string>; // Pass online user ids for status
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
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(isVisible);
  const isMinimizedRef = useRef(isMinimized);
  // Remove inputRef

  // Update refs when props change
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
    // Listen for new direct messages
    const handleNewDirectMessage = (message: DirectMessage) => {
      if (
        (message.sender._id === otherUser._id &&
          message.recipient._id === currentUser._id) ||
        (message.sender._id === currentUser._id &&
          message.recipient._id === otherUser._id)
      ) {
        setMessages((prev) => [...prev, message]);
        if (message.sender._id === otherUser._id) {
          // Use refs to get current values without stale closure
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
      // This event is received by the reader (me) when I mark messages as read
      if (senderId === otherUser._id) {
        // Update my local state to reflect that I've read messages from this sender
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
      // This event is received by the sender (me) when the recipient reads my messages
      if (readerId === otherUser._id) {
        // Update my local state to show that the other user has read my messages
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
  }, [otherUser._id, currentUser._id]); // Removed isVisible and isMinimized from deps

  // Scroll to bottom on new messages or when restoring from minimized
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
        setMessages(result.data.messages); // Keep order: oldest at top, newest at bottom
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

  // UseCallback to avoid stale closure
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Removed handleSendMessage and newMessage/setNewMessage

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

  // Online status logic: always compute in render to ensure reactivity
  const isOnline = !!onlineUserIds && onlineUserIds.has(otherUser._id);

  if (!isVisible) return null;

  return (
    <Rnd
      default={{
        x: window.innerWidth - 350 - 200,
        y: window.innerHeight - 500 - 125,
        width: 400,
        height: isMinimized ? 50 : 600,
      }}
      minWidth={500}
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
              <div className="flex items-center gap-2">
                <h3 className="text-white font-medium text-sm">
                  {otherUser.username}
                </h3>
                {isOnline !== undefined && (
                  <span
                    className={`inline-block w-2 h-2 rounded-full ml-1 ${
                      isOnline ? "bg-green-400" : "bg-gray-300"
                    }`}
                    title={isOnline ? "Online" : "Offline"}
                  />
                )}
              </div>
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

        {/* Only render messages and input if not minimized */}
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

                // Helper: call scrollToBottom on image load
                const handleImgLoad = () => {
                  scrollToBottom();
                };

                // Helper: check if a string is an image/gif URL (robust)
                const isImageUrl = (url: string) => {
                  return (
                    /\.(gif|jpe?g|png|webp|bmp|svg)(\?.*)?$/i.test(url) ||
                    /tenor\.com\//i.test(url)
                  );
                };

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
                          {/* Show GIF or image if present */}
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="Shared media"
                              className="w-40 h-40 object-contain rounded-lg mb-2"
                              onLoad={handleImgLoad}
                            />
                          )}
                          {/* If content is a GIF/image URL, render as image, else as HTML/text */}
                          {message.content &&
                          isImageUrl(message.content.trim()) ? (
                            <img
                              src={message.content.trim()}
                              alt="GIF"
                              className="w-40 h-40 object-contain rounded-lg mb-2"
                              onLoad={handleImgLoad}
                            />
                          ) : message.content ? (
                            <p
                              className="text-sm break-words"
                              dangerouslySetInnerHTML={{
                                __html: message.content,
                              }}
                            />
                          ) : null}
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

            {/* Input Area: Use RichMessageInput for emoji and image support */}
            <div className="p-3 border-t border-white/20">
              <RichMessageInput
                onSend={(content, imageUrl) => {
                  // If imageUrl is present and content is empty, it's an uploaded image
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
                    // If content is a GIF URL or text, send as message only
                    socket.emit("sendDirectMessage", {
                      receiverId: otherUser._id,
                      content: content,
                    });
                    setTimeout(() => scrollToBottom(), 300);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Rnd>
  );
};

export default DMWindow;
