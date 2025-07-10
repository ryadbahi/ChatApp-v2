import React from "react";
import { FaTrash } from "react-icons/fa";
import type { User } from "../../../types/types";

interface FriendItemProps {
  friend: User & { friendshipId: string };
  isOnline: boolean;
  onOpenDM: (user: User) => void;
  onEndFriendship: (friendId: string, friendshipId: string) => void;
}

const FriendItem: React.FC<FriendItemProps> = ({
  friend,
  isOnline,
  onOpenDM,
  onEndFriendship,
}) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
    <div className="flex items-center gap-3">
      <div className="relative">
        {friend.avatar ? (
          <img
            src={friend.avatar}
            alt={friend.username}
            className="w-10 h-10 rounded-full border-2 border-white/20"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center border-2 border-white/20">
            <span className="text-white text-sm font-medium">
              {friend.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Online indicator */}
        <div
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
            isOnline ? "bg-green-500" : "bg-gray-500"
          }`}
        />
      </div>
      <div>
        <p className="text-white font-medium">{friend.username}</p>
        <p className="text-xs text-white/60">
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onOpenDM(friend)}
        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/30 transition-colors text-sm"
      >
        Message
      </button>
      <button
        onClick={() => onEndFriendship(friend._id, friend.friendshipId)}
        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md transition-colors"
        title="End friendship"
      >
        <FaTrash className="text-sm" />
      </button>
    </div>
  </div>
);

export default FriendItem;
