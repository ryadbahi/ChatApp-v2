// filepath: d:\GoMyCode\00- Project\ChatApp v2\frontend\src\types.ts
export interface User {
  _id: string;
  username: string;
  avatar?: string;
}

export interface Friend extends User {
  friendshipId: string;
  friendsSince: string;
}

export interface Room {
  _id: string;
  name: string;
  visibility: "public" | "private" | "secret";
  createdBy: User;
  createdAt: string;
}

export interface CreateRoomData {
  name: string;
  visibility: "public" | "private" | "secret";
}

export interface Message {
  _id: string;
  content: string;
  imageUrl?: string;
  sender: User;
  room: string; // Room ID
  createdAt: string;
}

export interface FriendRequest {
  _id: string;
  sender: User;
  recipient: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  _id: string;
  user1: User;
  user2: User;
  createdAt: string;
}

export interface DirectMessage {
  _id: string;
  sender: User;
  recipient: User;
  content: string;
  imageUrl?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
}

export interface DMThread {
  otherUser: User;
  lastMessage?: DirectMessage;
  unreadCount: number;
}
