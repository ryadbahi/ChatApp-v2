import axios from "./axios";
import type { FriendRequest, Friend } from "../types/types";

export interface FriendsApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface FriendRequestsResponse extends FriendsApiResponse {
  data?: {
    sent: FriendRequest[];
    received: FriendRequest[];
  };
}

export interface FriendsListResponse extends FriendsApiResponse {
  data?: Friend[];
}

export interface FriendStatusResponse extends FriendsApiResponse {
  data?: {
    status: "none" | "pending" | "friends";
    requestId?: string;
    friendshipId?: string;
  };
}

// Send a friend request
export const sendFriendRequest = async (
  recipientId: string
): Promise<FriendsApiResponse> => {
  const response = await axios.post("/api/friends/request", { recipientId });
  return response.data;
};

// Accept a friend request
export const acceptFriendRequest = async (
  requestId: string
): Promise<FriendsApiResponse> => {
  const response = await axios.post(`/api/friends/accept/${requestId}`);
  return response.data;
};

// Reject a friend request
export const rejectFriendRequest = async (
  requestId: string
): Promise<FriendsApiResponse> => {
  const response = await axios.post(`/api/friends/reject/${requestId}`);
  return response.data;
};

// End a friendship
export const endFriendship = async (
  friendId: string
): Promise<FriendsApiResponse> => {
  const response = await axios.delete(`/api/friends/end/${friendId}`);
  return response.data;
};

// Get user's friends list
export const getFriends = async (): Promise<FriendsListResponse> => {
  const response = await axios.get("/api/friends");
  return response.data;
};

// Get pending friend requests (sent and received)
export const getFriendRequests = async (): Promise<FriendRequestsResponse> => {
  const response = await axios.get("/api/friends/requests");
  return response.data;
};

// Check friendship status with another user
export const getFriendStatus = async (
  userId: string
): Promise<FriendStatusResponse> => {
  const response = await axios.get(`/api/friends/status/${userId}`);
  return response.data;
};

// Debug: Clear friend requests between users (for testing)
export const clearFriendRequestsBetweenUsers = async (
  user1Id: string,
  user2Id: string
): Promise<FriendsApiResponse> => {
  const response = await axios.post("/api/friends/clear", { user1Id, user2Id });
  return response.data;
};
