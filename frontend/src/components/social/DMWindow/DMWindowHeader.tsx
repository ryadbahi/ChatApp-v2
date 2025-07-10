import React from "react";
import { FaTimes, FaMinus } from "react-icons/fa";
import type { User } from "../../../types/types";

interface DMWindowHeaderProps {
  otherUser: User;
  isOnline: boolean;
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

const DMWindowHeader: React.FC<DMWindowHeaderProps> = ({
  otherUser,
  isOnline,
  isMinimized,
  onMinimize,
  onClose,
}) => (
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
          <span
            className={`inline-block w-2 h-2 rounded-full ml-1 ${
              isOnline ? "bg-green-400" : "bg-gray-300"
            }`}
            title={isOnline ? "Online" : "Offline"}
          />
        </div>
        <p className="text-white/60 text-xs">Direct Message</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onMinimize}
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
);

export default DMWindowHeader;
