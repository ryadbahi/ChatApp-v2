import React, { useState, useEffect } from "react";
import { FaUserPlus, FaClock, FaComments } from "react-icons/fa";
import { motion } from "framer-motion";
import { sendFriendRequest, getFriendStatus } from "../api/friends";
import { socket } from "../socket";
import type { User } from "../types/types";

interface FriendRequestButtonProps {
  user: User;
  currentUserId: string;
  className?: string;
}

type FriendStatus = "none" | "pending" | "friends" | "loading";

const FriendRequestButton: React.FC<FriendRequestButtonProps> = ({
  user,
  currentUserId,
  className = "",
}) => {
  const [status, setStatus] = useState<FriendStatus>("loading");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFriendStatus();
  }, [user._id]);

  useEffect(() => {
    // Listen for real-time friend status updates
    const handleFriendRequestSent = ({
      recipientId,
    }: {
      recipientId: string;
    }) => {
      if (recipientId === user._id) {
        setStatus("pending");
      }
    };

    const handleFriendRequestAccepted = ({
      requester,
      recipient,
    }: {
      requester: User;
      recipient: User;
    }) => {
      if (requester._id === user._id || recipient._id === user._id) {
        setStatus("friends");
      }
    };

    const handleFriendRequestRejected = ({
      requester,
      recipient,
    }: {
      requester: User;
      recipient: User;
    }) => {
      if (requester._id === user._id || recipient._id === user._id) {
        setStatus("none");
      }
    };

    const handleFriendshipEnded = ({ endedBy }: { endedBy: string }) => {
      if (endedBy === user._id || endedBy === currentUserId) {
        setStatus("none");
      }
    };

    socket.on("friendRequestSent", handleFriendRequestSent);
    socket.on("friendRequestAccepted", handleFriendRequestAccepted);
    socket.on("friendRequestRejected", handleFriendRequestRejected);
    socket.on("friendshipEnded", handleFriendshipEnded);

    return () => {
      socket.off("friendRequestSent", handleFriendRequestSent);
      socket.off("friendRequestAccepted", handleFriendRequestAccepted);
      socket.off("friendRequestRejected", handleFriendRequestRejected);
      socket.off("friendshipEnded", handleFriendshipEnded);
    };
  }, [user._id, currentUserId]);

  const checkFriendStatus = async () => {
    try {
      setStatus("loading");
      const result = await getFriendStatus(user._id);
      if (result.success && result.data) {
        setStatus(result.data.status);
      } else {
        setStatus("none");
      }
    } catch (error) {
      console.error("Failed to check friend status:", error);
      setStatus("none");
    }
  };

  const handleSendFriendRequest = async () => {
    if (loading || status !== "none") return;

    try {
      setLoading(true);
      const result = await sendFriendRequest(user._id);

      if (result.success) {
        socket.emit("sendFriendRequest", { recipientId: user._id });
        setStatus("pending");
      } else {
        console.error("Failed to send friend request:", result.message);
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectMessage = () => {
    // This will be handled by the parent component
    // For now, we'll emit a custom event that the parent can listen to
    window.dispatchEvent(
      new CustomEvent("openDirectMessage", {
        detail: { userId: user._id },
      })
    );
  };

  if (status === "loading") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      </div>
    );
  }

  if (status === "friends") {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDirectMessage}
        className={`flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-md hover:bg-green-500/30 transition-colors text-sm ${className}`}
      >
        <FaComments className="text-xs" />
        <span>Message</span>
      </motion.button>
    );
  }

  if (status === "pending") {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-md text-sm ${className}`}
      >
        <FaClock className="text-xs" />
        <span>Pending</span>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSendFriendRequest}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-300"></div>
      ) : (
        <FaUserPlus className="text-xs" />
      )}
      <span>Add Friend</span>
    </motion.button>
  );
};

export default FriendRequestButton;
