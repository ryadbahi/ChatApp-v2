import React from "react";
import { FaComments } from "react-icons/fa";
import DMThreadItem from "./DMThreadItem";
import type { DMThread, User } from "../../../types/types";

interface DMThreadsMenuContentProps {
  threads: DMThread[];
  currentUser: User;
  loading: boolean;
  onOpenDM: (user: User) => void;
  onClose: () => void;
}

const DMThreadsMenuContent: React.FC<DMThreadsMenuContentProps> = ({
  threads,
  currentUser,
  loading,
  onOpenDM,
  onClose,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        <FaComments className="text-3xl mx-auto mb-2 opacity-50" />
        <p>No messages yet</p>
        <p className="text-xs">Start a conversation with a friend!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/10">
      {threads.map((thread) => (
        <DMThreadItem
          key={thread.otherUser._id}
          thread={thread}
          currentUser={currentUser}
          onOpenDM={onOpenDM}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

export default DMThreadsMenuContent;
