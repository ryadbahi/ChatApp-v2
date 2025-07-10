import React from "react";
import type { DirectMessage } from "../../../types/socket";
import type { User } from "../../../types/types";

interface DMWindowMessagesProps {
  messages: DirectMessage[];
  currentUser: User;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  shouldShowDateSeparator: (
    current: DirectMessage,
    prev?: DirectMessage
  ) => boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  loading: boolean;
  page: number;
  hasMore: boolean;
  loadMoreMessages: () => void;
}

const DMWindowMessages: React.FC<DMWindowMessagesProps> = ({
  messages,
  currentUser,
  formatDate,
  formatTime,
  shouldShowDateSeparator,
  messagesEndRef,
  messagesContainerRef,
  handleScroll,
  loading,
  page,
  hasMore,
  loadMoreMessages,
}) => (
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
      const handleImgLoad = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };
      const isImageUrl = (url: string) =>
        /\.(gif|jpe?g|png|webp|bmp|svg)(\?.*)?$/i.test(url) ||
        /tenor\.com\//i.test(url);
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
            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] ${isOwnMessage ? "order-2" : "order-1"}`}
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
                    alt="Shared media"
                    className="w-40 h-40 object-contain rounded-lg mb-2"
                    onLoad={handleImgLoad}
                  />
                )}
                {message.content && isImageUrl(message.content.trim()) ? (
                  <img
                    src={message.content.trim()}
                    alt="GIF"
                    className="w-40 h-40 object-contain rounded-lg mb-2"
                    onLoad={handleImgLoad}
                  />
                ) : message.content ? (
                  <p
                    className="text-sm break-words"
                    dangerouslySetInnerHTML={{ __html: message.content }}
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
);

export default DMWindowMessages;
