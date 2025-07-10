import React from "react";
import type { User } from "../../../types/types";

interface DMWindowMinimizedProps {
  otherUser: User;
  isOnline: boolean;
  onRestore: () => void;
}

const DMWindowMinimized: React.FC<DMWindowMinimizedProps> = ({
  otherUser,
  isOnline,
  onRestore,
}) => (
  <div
    className="flex items-center justify-center w-full h-full cursor-pointer bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-xl"
    onClick={onRestore}
    title={`Click to restore chat with ${otherUser.username}`}
  >
    {otherUser.avatar ? (
      <img
        src={otherUser.avatar}
        alt={otherUser.username}
        className="w-10 h-10 rounded-full border-2 border-white/20"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center border-2 border-white/20">
        <span className="text-white text-lg font-medium">
          {otherUser.username.charAt(0).toUpperCase()}
        </span>
      </div>
    )}
    <span
      className={`ml-2 w-3 h-3 rounded-full border-2 border-white ${
        isOnline ? "bg-green-400" : "bg-gray-400"
      }`}
      title={isOnline ? "Online" : "Offline"}
    />
  </div>
);

export default DMWindowMinimized;
