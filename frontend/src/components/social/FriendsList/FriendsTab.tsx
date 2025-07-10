import React from "react";
import { FaUserFriends } from "react-icons/fa";
import FriendItem from "./FriendItem";
import type { Friend, User } from "../../../types/types";

interface FriendsTabProps {
  friends: Friend[];
  onlineFriends: Set<string>;
  onOpenDM: (user: User) => void;
  onEndFriendship: (friendId: string, friendshipId: string) => void;
  loading: boolean;
}

const FriendsTab: React.FC<FriendsTabProps> = ({
  friends,
  onlineFriends,
  onOpenDM,
  onEndFriendship,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!Array.isArray(friends) || friends.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        <FaUserFriends className="text-4xl mx-auto mb-3 opacity-50" />
        <p>No friends yet</p>
        <p className="text-sm">Start connecting with people!</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {friends.map((friend) => (
        <FriendItem
          key={friend._id}
          friend={friend}
          isOnline={onlineFriends.has(friend._id)}
          onOpenDM={onOpenDM}
          onEndFriendship={onEndFriendship}
        />
      ))}
    </div>
  );
};

export default FriendsTab;
