import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import type { FriendRequest } from "../../../types/types";

interface FriendRequestItemProps {
  request: FriendRequest;
  type: "received" | "sent";
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  request,
  type,
  onAccept,
  onReject,
}) => {
  const user = type === "received" ? request.sender : request.recipient;

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div className="flex items-center gap-3">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-10 h-10 rounded-full border-2 border-white/20"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center border-2 border-white/20">
            <span className="text-white text-sm font-medium">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="text-white font-medium">{user.username}</p>
          <p className="text-xs text-white/60">
            {type === "received" ? "wants to be friends" : "request pending"}
          </p>
        </div>
      </div>

      {type === "received" ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAccept?.(request._id)}
            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-md transition-colors"
            title="Accept"
          >
            <FaCheck />
          </button>
          <button
            onClick={() => onReject?.(request._id)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md transition-colors"
            title="Reject"
          >
            <FaTimes />
          </button>
        </div>
      ) : (
        <div className="text-yellow-400 text-sm">Pending</div>
      )}
    </div>
  );
};

export default FriendRequestItem;
