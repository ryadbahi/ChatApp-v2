import React, { useState, useEffect } from "react";
import {
  FaUserFriends,
  FaUserPlus,
  FaCheck,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  endFriendship,
} from "../api/friends";
import type { User, Friend, FriendRequest } from "../types/types";
import { socket } from "../socket";

interface FriendsListProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDM: (user: User) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({
  isOpen,
  onClose,
  onOpenDM,
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
      console.log(
        "[FriendsList] Received new friend request via socket:",
        request
      );
      setFriendRequests((prev) => {
        // Check if request already exists to avoid duplicates
        const exists = prev.received.some((r) => r._id === request._id);
        if (exists) {
          console.log(
            "[FriendsList] Friend request already exists, not adding duplicate"
          );
          return prev;
        }

        console.log("[FriendsList] Adding new friend request to state");
        return {
          ...prev,
          received: [...prev.received, request],
        };
      });
    };

    const handleFriendRequestAccepted = () => {
      console.log("[FriendsList] Friend request accepted, refreshing data");
      // Refresh friends list
      loadFriendsData();
    };

    const handleFriendshipCreated = () => {
      console.log("[FriendsList] Friendship created, refreshing data");
      // Refresh friends list when new friendship is created
      loadFriendsData();
    };

    const handleFriendRequestRejected = ({
      requestId,
    }: {
      requestId: string;
    }) => {
      console.log("[FriendsList] Friend request rejected:", requestId);
      setFriendRequests((prev) => ({
        sent: prev.sent.filter((req) => req._id !== requestId),
        received: prev.received.filter((req) => req._id !== requestId),
      }));
    };

    const handleFriendshipEnded = () => {
      // Refresh friends list
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
        setOnlineFriends(new Set(onlineFriends.map((f) => f._id)));
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
  }, [socket]);

  const loadFriendsData = async () => {
    setLoading(true);
    try {
      console.log("[FriendsList] Loading friends data...");

      const [friendsRes, requestsRes] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ]);

      console.log("[FriendsList] Friends response:", friendsRes);
      console.log("[FriendsList] Requests response:", requestsRes);

      // Handle friends response
      if (
        friendsRes.success &&
        friendsRes.data &&
        Array.isArray(friendsRes.data)
      ) {
        console.log("[FriendsList] Setting friends:", friendsRes.data);
        setFriends(friendsRes.data);
      } else {
        console.log("[FriendsList] No friends found or invalid response");
        setFriends([]); // Ensure it's always an array
      }

      // Handle friend requests response - data should be { sent: [], received: [] }
      if (
        requestsRes.success &&
        requestsRes.data &&
        typeof requestsRes.data === "object" &&
        Array.isArray(requestsRes.data.sent) &&
        Array.isArray(requestsRes.data.received)
      ) {
        console.log("[FriendsList] Setting friend requests:", requestsRes.data);
        setFriendRequests(requestsRes.data);
      } else {
        console.log(
          "[FriendsList] No friend requests found or invalid response"
        );
        setFriendRequests({ sent: [], received: [] }); // Ensure it's always the correct structure
      }
    } catch (error) {
      console.error("Failed to load friends data:", error);
      setFriends([]); // Ensure it's always an array on error
      setFriendRequests({ sent: [], received: [] }); // Ensure it's always the correct structure on error
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
        setFriendRequests((prev) => ({
          ...prev,
          received: prev.received.filter((req) => req._id !== requestId),
        }));
      }
    } catch (error) {
      console.error("Failed to reject friend request:", error);
    }
  };

  const handleEndFriendship = async (
    friendId: string,
    friendshipId?: string
  ) => {
    if (
      !confirm(
        "Are you sure you want to end this friendship? You will no longer be able to DM or see online status."
      )
    ) {
      return;
    }

    try {
      const result = await endFriendship(friendId);
      if (result.success) {
        // Only emit socket event if we have both IDs
        if (friendshipId) {
          socket?.emit("endFriendship", { friendshipId, friendId });
        }
        setFriends((prev) => prev.filter((friend) => friend._id !== friendId));
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <FaUserFriends className="text-xl text-white" />
              <h2 className="text-xl font-bold text-white">Friends</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "friends"
                  ? "text-white bg-white/10 border-b-2 border-purple-400"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === "requests"
                  ? "text-white bg-white/10 border-b-2 border-purple-400"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Requests
              {friendRequests.received.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {friendRequests.received.length}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : activeTab === "friends" ? (
              <div className="p-4 space-y-3">
                {!Array.isArray(friends) || friends.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    <FaUserFriends className="text-4xl mx-auto mb-3 opacity-50" />
                    <p>No friends yet</p>
                    <p className="text-sm">Start connecting with people!</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend._id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
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
                              onlineFriends.has(friend._id)
                                ? "bg-green-500"
                                : "bg-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {friend.username}
                          </p>
                          <p className="text-xs text-white/60">
                            {onlineFriends.has(friend._id)
                              ? "Online"
                              : "Offline"}
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
                          onClick={() =>
                            handleEndFriendship(friend._id, friend.friendshipId)
                          }
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md transition-colors"
                          title="End friendship"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {(!Array.isArray(friendRequests.received) ||
                  friendRequests.received.length === 0) &&
                (!Array.isArray(friendRequests.sent) ||
                  friendRequests.sent.length === 0) ? (
                  <div className="text-center text-white/60 py-8">
                    <FaUserPlus className="text-4xl mx-auto mb-3 opacity-50" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <>
                    {/* Received requests */}
                    {Array.isArray(friendRequests.received) &&
                      friendRequests.received.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-white/80 mb-2">
                            Received
                          </h3>
                          {friendRequests.received.map((request) => (
                            <div
                              key={request._id}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {request.sender.avatar ? (
                                  <img
                                    src={request.sender.avatar}
                                    alt={request.sender.username}
                                    className="w-10 h-10 rounded-full border-2 border-white/20"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center border-2 border-white/20">
                                    <span className="text-white text-sm font-medium">
                                      {request.sender.username
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="text-white font-medium">
                                    {request.sender.username}
                                  </p>
                                  <p className="text-xs text-white/60">
                                    wants to be friends
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleAcceptRequest(request._id)
                                  }
                                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-md transition-colors"
                                  title="Accept"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  onClick={() =>
                                    handleRejectRequest(request._id)
                                  }
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md transition-colors"
                                  title="Reject"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Sent requests */}
                    {Array.isArray(friendRequests.sent) &&
                      friendRequests.sent.length > 0 && (
                        <div
                          className={
                            Array.isArray(friendRequests.received) &&
                            friendRequests.received.length > 0
                              ? "mt-6"
                              : ""
                          }
                        >
                          <h3 className="text-sm font-medium text-white/80 mb-2">
                            Sent
                          </h3>
                          {friendRequests.sent.map((request) => (
                            <div
                              key={request._id}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {request.recipient.avatar ? (
                                  <img
                                    src={request.recipient.avatar}
                                    alt={request.recipient.username}
                                    className="w-10 h-10 rounded-full border-2 border-white/20"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center border-2 border-white/20">
                                    <span className="text-white text-sm font-medium">
                                      {request.recipient.username
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="text-white font-medium">
                                    {request.recipient.username}
                                  </p>
                                  <p className="text-xs text-white/60">
                                    request pending
                                  </p>
                                </div>
                              </div>
                              <div className="text-yellow-400 text-sm">
                                Pending
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FriendsList;
