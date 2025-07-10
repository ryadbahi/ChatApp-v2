import React from "react";
import type { DMThread, User } from "../../../types/types";

interface DMThreadItemProps {
  thread: DMThread;
  currentUser: User;
  onOpenDM: (user: User) => void;
  onClose: () => void;
}

const DMThreadItem: React.FC<DMThreadItemProps> = ({
  thread,
  currentUser,
  onOpenDM,
  onClose,
}) => {
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
    <div
      onClick={() => {
        onOpenDM(thread.otherUser);
        onClose();
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
                {thread.otherUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {thread.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
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
                {formatLastMessageTime(thread.lastMessage.createdAt)}
              </span>
            )}
          </div>

          {thread.lastMessage && (
            <div className="flex items-center gap-1 mt-1">
              {thread.lastMessage.sender._id === currentUser._id && (
                <span className="text-white/50 text-xs">You: </span>
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
              {thread.lastMessage.sender._id === currentUser._id &&
                thread.lastMessage.readAt && (
                  <span className="text-green-400 text-xs ml-auto">✓✓</span>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DMThreadItem;
