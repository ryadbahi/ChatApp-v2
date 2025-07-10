import React from "react";
import { FaUserPlus } from "react-icons/fa";
import FriendRequestItem from "./FriendRequestItem";
import type { FriendRequest } from "../../../types/types";

interface RequestsTabProps {
  friendRequests: {
    sent: FriendRequest[];
    received: FriendRequest[];
  };
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  loading: boolean;
}

const RequestsTab: React.FC<RequestsTabProps> = ({
  friendRequests,
  onAcceptRequest,
  onRejectRequest,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const hasRequests =
    (Array.isArray(friendRequests.received) &&
      friendRequests.received.length > 0) ||
    (Array.isArray(friendRequests.sent) && friendRequests.sent.length > 0);

  if (!hasRequests) {
    return (
      <div className="text-center text-white/60 py-8">
        <FaUserPlus className="text-4xl mx-auto mb-3 opacity-50" />
        <p>No pending requests</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Received requests */}
      {Array.isArray(friendRequests.received) &&
        friendRequests.received.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-white/80 mb-2">Received</h3>
            {friendRequests.received.map((request) => (
              <div key={request._id} className="mb-2">
                <FriendRequestItem
                  request={request}
                  type="received"
                  onAccept={onAcceptRequest}
                  onReject={onRejectRequest}
                />
              </div>
            ))}
          </div>
        )}

      {/* Sent requests */}
      {Array.isArray(friendRequests.sent) && friendRequests.sent.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-2">Sent</h3>
          {friendRequests.sent.map((request) => (
            <div key={request._id} className="mb-2">
              <FriendRequestItem request={request} type="sent" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestsTab;
