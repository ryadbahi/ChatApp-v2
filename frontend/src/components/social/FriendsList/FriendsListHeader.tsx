import React from "react";
import { FaUserFriends, FaUserPlus } from "react-icons/fa";

interface FriendsListHeaderProps {
  activeTab: "friends" | "requests";
  onTabChange: (tab: "friends" | "requests") => void;
  onClose: () => void;
  receivedRequestsCount: number;
}

const FriendsListHeader: React.FC<FriendsListHeaderProps> = ({
  activeTab,
  onTabChange,
  onClose,
  receivedRequestsCount,
}) => (
  <div className="flex items-center justify-between p-4 border-b border-white/20">
    <div className="flex items-center gap-4">
      <h3 className="text-lg font-semibold text-white">Friends</h3>
      <div className="flex bg-white/10 rounded-lg p-1">
        <button
          onClick={() => onTabChange("friends")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            activeTab === "friends"
              ? "bg-purple-500/30 text-white"
              : "text-white/70 hover:text-white"
          }`}
        >
          <FaUserFriends />
          <span>Friends</span>
        </button>
        <button
          onClick={() => onTabChange("requests")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors relative ${
            activeTab === "requests"
              ? "bg-purple-500/30 text-white"
              : "text-white/70 hover:text-white"
          }`}
        >
          <FaUserPlus />
          <span>Requests</span>
          {receivedRequestsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {receivedRequestsCount > 9 ? "9+" : receivedRequestsCount}
            </span>
          )}
        </button>
      </div>
    </div>
    <button
      onClick={onClose}
      className="text-white/70 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
    >
      ×
    </button>
  </div>
);

export default FriendsListHeader;
