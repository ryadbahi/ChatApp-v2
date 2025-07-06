import axios from "./axios";

export interface DirectMessage {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  recipient: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

export interface DirectMessageContact {
  _id: string;
  username: string;
  avatar?: string;
  lastMessage: DirectMessage;
  unreadCount: number;
}

export interface User {
  _id: string;
  username: string;
  avatar?: string;
}

// Get direct messages with a specific user
export const getDirectMessages = async (otherUserId: string) => {
  const response = await axios.get(`/direct-messages/${otherUserId}`);
  return response.data;
};

// Get list of contacts (users with message history)
export const getDirectMessageContacts = async () => {
  const response = await axios.get("/direct-messages/contacts");
  return response.data;
};

// Mark messages as read
export const markMessagesAsRead = async (otherUserId: string) => {
  const response = await axios.put(`/direct-messages/${otherUserId}/read`);
  return response.data;
};

// Search users for direct messaging
export const searchUsersForDM = async (query: string) => {
  const response = await axios.get(
    `/direct-messages/search-users?query=${encodeURIComponent(query)}`
  );
  return response.data;
};
