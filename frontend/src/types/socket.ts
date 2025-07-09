import type { User, FriendRequest, Friendship, Notification } from "./types";

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
  directMessagesRead: (data: { senderId: string; readAt: string }) => void;
  allDirectMessagesRead: (data: { readerId: string; readAt: string }) => void;
  directMessageError: (data: { message: string }) => void;

  // Friends system events
  newFriendRequest: (request: FriendRequest) => void;
  friendRequestSent: (data: { recipientId: string }) => void;
  friendRequestError: (data: { message: string }) => void;
  friendRequestAccepted: (data: {
    requestId: string;
    friendship: Friendship;
    requester: User;
    recipient: User;
  }) => void;
  friendRequestRejected: (data: {
    requestId: string;
    requester: User;
    recipient: User;
  }) => void;
  friendshipCreated: (data: { friendship: Friendship }) => void;
  friendshipEnded: (data: { friendshipId: string; endedBy: string }) => void;
  friendshipError: (data: { message: string }) => void;
  friendOnlineStatusUpdate: (data: {
    userId: string;
    isOnline: boolean;
  }) => void;

  // Notifications events
  newNotification: (notification: Notification) => void;
  notificationMarkedAsRead: (data: { notificationId: string }) => void;
  allNotificationsMarkedAsRead: () => void;
  notificationDeleted: (data: { notificationId: string }) => void;
}

export interface ClientToServerEvents {
  sendMessage: (payload: {
    roomId: string;
    message: string;
    imageUrl?: string;
  }) => void;
  joinRoom: (payload: { roomId: string }) => void;
  leaveRoom: (payload: { roomId: string }) => void;
  getRoomUsers: (
    payload: { roomId: string },
    callback: (data: { users: User[] }) => void
  ) => void;
  getPublicRoomsUserCounts: (
    callback: (data: Record<string, number>) => void
  ) => void;
  userActivity: () => void;
  sendDirectMessage: (payload: {
    receiverId: string;
    content: string;
    imageUrl?: string;
  }) => void;
  markDirectMessageAsRead: (payload: { messageId: string }) => void;
  markAllDirectMessagesAsRead: (payload: { senderId: string }) => void;

  // Friends system events
  sendFriendRequest: (payload: { recipientId: string }) => void;
  acceptFriendRequest: (payload: { requestId: string }) => void;
  rejectFriendRequest: (payload: { requestId: string }) => void;
  endFriendship: (payload: { friendshipId: string; friendId: string }) => void;
  getOnlineFriends: (
    callback: (data: { onlineFriends: User[] }) => void
  ) => void;

  // Notifications events
  markNotificationAsRead: (payload: { notificationId: string }) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (payload: { notificationId: string }) => void;
}
