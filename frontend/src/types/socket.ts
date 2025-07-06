import type { User } from "./types";

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

export interface ServerToClientEvents {
  newMessage: (msg: any) => void;
  roomUsersUpdate: (data: { users: User[] }) => void;
  roomUserCount: (data: { roomId: string; count: number }) => void;
  allRoomCounts: (counts: Record<string, number>) => void;
  inactivityWarning: (data: { message: string; timeLeft: number }) => void;
  inactivityDisconnect: (data: { message: string }) => void;
  error: (data: { message: string }) => void;
  newDirectMessage: (message: DirectMessage) => void;
  directMessagesRead: (data: { readByUserId: string }) => void;
}

export interface ClientToServerEvents {
  sendMessage: (payload: {
    roomId: string;
    message: string;
    imageUrl?: string;
  }) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  getRoomUsers: (
    roomId: string,
    callback: (data: { users: User[] }) => void
  ) => void;
  getPublicRoomsUserCounts: (
    callback: (data: Record<string, number>) => void
  ) => void;
  userActivity: () => void;
  sendDirectMessage: (payload: {
    recipientId: string;
    message: string;
    imageUrl?: string;
  }) => void;
  markDirectMessageAsRead: (payload: { otherUserId: string }) => void;
}
