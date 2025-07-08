import axios from "./axios";
import type { DirectMessage, DMThread } from "../types/types";

export interface DirectMessageApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface DirectMessagesResponse extends DirectMessageApiResponse {
  data?: {
    messages: DirectMessage[];
    hasMore: boolean;
  };
}

export interface DMThreadsResponse extends DirectMessageApiResponse {
  data?: DMThread[];
}

// Get direct messages with a specific user
export const getDirectMessages = async (
  otherUserId: string,
  page: number = 1,
  limit: number = 20
): Promise<DirectMessagesResponse> => {
  const response = await axios.get(`/api/direct-messages/${otherUserId}`, {
    params: { page, limit },
  });
  return response.data;
};

// Send a direct message
export const sendDirectMessage = async (
  recipientId: string,
  content: string,
  imageUrl?: string
): Promise<DirectMessageApiResponse> => {
  const response = await axios.post(`/api/direct-messages`, {
    recipientId,
    content,
    imageUrl,
  });
  return response.data;
};

// Get all DM threads for the current user
export const getDMThreads = async (): Promise<DMThreadsResponse> => {
  const response = await axios.get("/api/direct-messages/conversations/recent");
  return response.data;
};

// Mark direct messages as read
export const markDirectMessagesAsRead = async (
  otherUserId: string
): Promise<DirectMessageApiResponse> => {
  const response = await axios.put(`/api/direct-messages/${otherUserId}/read`);
  return response.data;
};

// Alias for backward compatibility
export const markMessagesAsRead = markDirectMessagesAsRead;

// Get contacts (friends) for direct messaging
export const getDirectMessageContacts =
  async (): Promise<DirectMessageApiResponse> => {
    const response = await axios.get("/api/friends");
    return response.data;
  };

// Search users for direct messaging (friends only)
export const searchUsersForDM = async (
  query: string
): Promise<DirectMessageApiResponse> => {
  const response = await axios.get("/api/friends/search", {
    params: { query },
  });
  return response.data;
};
