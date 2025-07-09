import { globalSocketIO } from "../index";
import Friendship from "../models/Friendship";

// Get user's socket IDs
const getUserSockets = (
  userSockets: Record<string, Set<string>>,
  userId: string
): string[] => {
  return Array.from(userSockets[userId] || []);
};

// Helper function to get user's friends
export const getUserFriends = async (userId: string): Promise<string[]> => {
  try {
    const friendships = await Friendship.find({
      $or: [{ user1: userId }, { user2: userId }],
    });

    return friendships.map((friendship) => {
      return friendship.user1.toString() === userId
        ? friendship.user2.toString()
        : friendship.user1.toString();
    });
  } catch (error) {
    console.error("Error getting user friends:", error);
    return [];
  }
};

// Broadcast to user's friends
export const broadcastToFriends = async (
  userId: string,
  event: string,
  data: any
) => {
  if (!globalSocketIO) return;

  try {
    const friends = await getUserFriends(userId);
    friends.forEach((friendId) => {
      globalSocketIO.to(`user:${friendId}`).emit(event, data);
    });
  } catch (error) {
    console.error("Error broadcasting to friends:", error);
  }
};

// Send notification to specific user
export const sendNotificationToUser = (userId: string, notification: any) => {
  console.log("[SocketNotification] sendNotificationToUser called", {
    globalSocketIOExists: !!globalSocketIO,
    userId,
    notificationType: notification.type,
    title: notification.title,
  });

  if (!globalSocketIO) {
    console.error("[SocketNotification] globalSocketIO is null or undefined!");
    return;
  }

  console.log(`[SocketNotification] Emitting to room: user:${userId}`);
  globalSocketIO.to(`user:${userId}`).emit("newNotification", notification);
  console.log("[SocketNotification] Notification emitted successfully");
};

// Send real-time friend request to recipient
export const notifyFriendRequest = (
  recipientId: string,
  friendRequest: any
) => {
  console.log("[SocketNotification] notifyFriendRequest called", {
    globalSocketIOExists: !!globalSocketIO,
    recipientId,
    requestId: friendRequest._id,
  });

  if (!globalSocketIO) {
    console.error("[SocketNotification] globalSocketIO is null or undefined!");
    return;
  }

  console.log(
    `[SocketNotification] Emitting friend request to room: user:${recipientId}`
  );
  globalSocketIO
    .to(`user:${recipientId}`)
    .emit("newFriendRequest", friendRequest);
  console.log("[SocketNotification] Friend request emitted successfully");
};

// Confirm friend request sent to sender
export const confirmFriendRequestSent = (
  senderId: string,
  recipientId: string
) => {
  console.log("[SocketNotification] confirmFriendRequestSent called", {
    globalSocketIOExists: !!globalSocketIO,
    senderId,
    recipientId,
  });

  if (!globalSocketIO) {
    console.error("[SocketNotification] globalSocketIO is null or undefined!");
    return;
  }

  console.log(
    `[SocketNotification] Confirming friend request sent to room: user:${senderId}`
  );
  globalSocketIO
    .to(`user:${senderId}`)
    .emit("friendRequestSent", { recipientId });
  console.log(
    "[SocketNotification] Friend request confirmation emitted successfully"
  );
};
