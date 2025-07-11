import React, { useState, useRef, useEffect } from "react";
import {
  FaUserPlus,
  FaCommentDots,
  FaUserCheck,
  FaTimes,
  FaClock,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { sendFriendRequest, getFriends } from "../../api/friends";
import { useAuth } from "../../context/AuthContext";
import type { User } from "../../types/types";

interface UserActionDropdownProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onOpenDM?: (userId: string) => void;
}

const UserActionDropdown: React.FC<UserActionDropdownProps> = ({
  user,
  isOpen,
  onClose,
  onOpenDM,
}) => {
  const { user: currentUser } = useAuth();
  const [friendshipStatus, setFriendshipStatus] = useState<
    "none" | "pending" | "friends" | "loading"
  >("loading");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user._id !== currentUser?.id) {
      checkFriendshipStatus();
    }
  }, [isOpen, user._id, currentUser?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const checkFriendshipStatus = async () => {
    try {
      console.log(
        "[UserActionDropdown] Checking friendship status for user:",
        user._id
      );

      const response = await getFriends();
      console.log("[UserActionDropdown] Friends response:", response);

      if (response.success && response.data && Array.isArray(response.data)) {
        const isFriend = response.data.some(
          (friend: User) => friend._id === user._id
        );
        console.log(
          "[UserActionDropdown] Is friend?",
          isFriend,
          "Friends list:",
          response.data.map((f: User) => f.username)
        );
        setFriendshipStatus(isFriend ? "friends" : "none");
      } else {
        console.log("[UserActionDropdown] No friends data or invalid response");
        setFriendshipStatus("none");
      }
    } catch (error) {
      console.error("Error checking friendship status:", error);
      setFriendshipStatus("none");
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      console.log("[UserActionDropdown] Sending friend request to:", user._id);
      setFriendshipStatus("loading");

      const response = await sendFriendRequest(user._id);
      console.log("[UserActionDropdown] Friend request response:", response);

      if (response.success) {
        console.log("[UserActionDropdown] Friend request sent successfully");
        setFriendshipStatus("pending");
      } else {
        console.log(
          "[UserActionDropdown] Friend request failed:",
          response.message
        );
        // Check if it's because request already exists
        if (
          response.message?.includes("already exists") ||
          response.message?.includes("Already")
        ) {
          setFriendshipStatus("pending");
        } else {
          setFriendshipStatus("none");
          console.error("Friend request failed:", response.message);
        }
      }
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      // Check if it's a 400 error about already existing request
      if (
        error.response?.status === 400 &&
        (error.response?.data?.msg?.includes("already exists") ||
          error.response?.data?.msg?.includes("Already"))
      ) {
        console.log(
          "[UserActionDropdown] Friend request already exists, setting to pending"
        );
        setFriendshipStatus("pending");
      } else {
        setFriendshipStatus("none");
      }
    }
    onClose();
  };

  const handleOpenDM = () => {
    if (onOpenDM) {
      onOpenDM(user._id);
    }
    onClose();
  };

  if (!isOpen || user._id === currentUser?.id) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-1 min-w-[180px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-white/20 mb-2">
          <div className="flex items-center gap-2">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-white font-medium text-sm">
              {user.username}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/80 p-1"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-1">
          {/* Send Direct Message */}
          {friendshipStatus === "friends" && (
            <button
              onClick={handleOpenDM}
              className="w-full flex items-center gap-3 p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FaCommentDots className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Send Message</span>
            </button>
          )}

          {/* Friend Request Actions */}
          {friendshipStatus === "none" && (
            <button
              onClick={handleSendFriendRequest}
              className="w-full flex items-center gap-3 p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FaUserPlus className="w-4 h-4 text-green-400" />
              <span className="text-sm">Send Friend Request</span>
            </button>
          )}

          {friendshipStatus === "pending" && (
            <div className="w-full flex items-center gap-3 p-2 text-white/60">
              <FaClock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">Friend Request Sent</span>
            </div>
          )}

          {friendshipStatus === "friends" && (
            <div className="w-full flex items-center gap-3 p-2 text-white/60">
              <FaUserCheck className="w-4 h-4 text-green-400" />
              <span className="text-sm">Friends</span>
            </div>
          )}

          {friendshipStatus === "loading" && (
            <div className="w-full flex items-center gap-3 p-2 text-white/60">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserActionDropdown;
