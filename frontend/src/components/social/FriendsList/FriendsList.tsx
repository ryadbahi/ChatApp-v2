import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  endFriendship,
} from "../../../api/friends";
import type { User, Friend, FriendRequest } from "../../../types/types";
import { socket } from "../../../socket";
import FriendsListHeader from "./FriendsListHeader";
import FriendsTab from "./FriendsTab";
import RequestsTab from "./RequestsTab";

interface FriendsListProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDM: (user: User) => void;
  onOnlineFriendsChange?: (ids: string[]) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({
  isOpen,
  onClose,
  onOpenDM,
  onOnlineFriendsChange,
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }>({ sent: [], received: [] });
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  useEffect(() => {
    if (isOpen) {
      loadFriendsData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!socket) return;

    // Listen for online status updates
    const handleOnlineStatusUpdate = ({
      userId,
      isOnline,
    }: {
      userId: string;
      isOnline: boolean;
    }) => {
      setOnlineFriends((prev) => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };

    // Listen for friend request events
    const handleNewFriendRequest = (request: FriendRequest) => {
      setFriendRequests((prev) => ({
        ...prev,
        received: [...prev.received, request],
      }));
    };

    const handleFriendRequestAccepted = () => {
      loadFriendsData();
    };

    const handleFriendshipCreated = () => {
      loadFriendsData();
    };

    const handleFriendRequestRejected = ({
      requestId,
    }: {
      requestId: string;
    }) => {
      setFriendRequests((prev) => ({
        sent: prev.sent.filter((req) => req._id !== requestId),
        received: prev.received.filter((req) => req._id !== requestId),
      }));
    };

    const handleFriendshipEnded = () => {
      loadFriendsData();
    };

    socket.on("friendOnlineStatusUpdate", handleOnlineStatusUpdate);
    socket.on("newFriendRequest", handleNewFriendRequest);
    socket.on("friendRequestAccepted", handleFriendRequestAccepted);
    socket.on("friendshipCreated", handleFriendshipCreated);
    socket.on("friendRequestRejected", handleFriendRequestRejected);
    socket.on("friendshipEnded", handleFriendshipEnded);

    // Get initial online friends
    socket.emit(
      "getOnlineFriends",
      ({ onlineFriends }: { onlineFriends: User[] }) => {
        const newSet = new Set(onlineFriends.map((f) => f._id));
        setOnlineFriends(newSet);
      }
    );

    return () => {
      socket.off("friendOnlineStatusUpdate", handleOnlineStatusUpdate);
      socket.off("newFriendRequest", handleNewFriendRequest);
      socket.off("friendRequestAccepted", handleFriendRequestAccepted);
      socket.off("friendshipCreated", handleFriendshipCreated);
      socket.off("friendRequestRejected", handleFriendRequestRejected);
      socket.off("friendshipEnded", handleFriendshipEnded);
    };
  }, [socket, onOnlineFriendsChange]);

  // Notify parent when onlineFriends changes
  useEffect(() => {
    if (typeof onOnlineFriendsChange === "function") {
      onOnlineFriendsChange(Array.from(onlineFriends));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineFriends]);

  const loadFriendsData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ]);

      // Handle friends response
      if (
        friendsRes.success &&
        friendsRes.data &&
        Array.isArray(friendsRes.data)
      ) {
        setFriends(friendsRes.data);
      } else {
        setFriends([]);
      }

      // Handle friend requests response
      if (
        requestsRes.success &&
        requestsRes.data &&
        typeof requestsRes.data === "object" &&
        Array.isArray(requestsRes.data.sent) &&
        Array.isArray(requestsRes.data.received)
      ) {
        setFriendRequests(requestsRes.data);
      } else {
        setFriendRequests({ sent: [], received: [] });
      }
    } catch (error) {
      console.error("Failed to load friends data:", error);
      setFriends([]);
      setFriendRequests({ sent: [], received: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        socket?.emit("acceptFriendRequest", { requestId });
        loadFriendsData();
      }
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const result = await rejectFriendRequest(requestId);
      if (result.success) {
        socket?.emit("rejectFriendRequest", { requestId });
        loadFriendsData();
      }
    } catch (error) {
      console.error("Failed to reject friend request:", error);
    }
  };

  const handleEndFriendship = async (
    friendId: string,
    friendshipId: string
  ) => {
    try {
      const result = await endFriendship(friendshipId);
      if (result.success) {
        socket?.emit("endFriendship", { friendId, friendshipId });
        loadFriendsData();
      }
    } catch (error) {
      console.error("Failed to end friendship:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 overflow-hidden"
        >
          {/* Header */}
          <FriendsListHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={onClose}
            receivedRequestsCount={friendRequests.received.length}
          />

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === "friends" ? (
              <FriendsTab
                friends={friends}
                onlineFriends={onlineFriends}
                onOpenDM={onOpenDM}
                onEndFriendship={handleEndFriendship}
                loading={loading}
              />
            ) : (
              <RequestsTab
                friendRequests={friendRequests}
                onAcceptRequest={handleAcceptRequest}
                onRejectRequest={handleRejectRequest}
                loading={loading}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FriendsList;
