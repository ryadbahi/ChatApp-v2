import { Server } from "socket.io";
import Friendship from "../models/Friendship";
import User from "../models/User";

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

// Helper function to broadcast to user's friends

export const broadcastToFriends = async (
  io: Server,
  userId: string,
  event: string,
  data: any,
  userSockets: Record<string, Set<string>>
) => {
  try {
    const friends = await getUserFriends(userId);
    friends.forEach((friendId) => {
      const sockets = Array.from(userSockets[friendId] || []);
      sockets.forEach((socketId: string) => {
        io.to(socketId).emit(event, data);
      });
    });
  } catch (error) {
    console.error("Error broadcasting to friends:", error);
  }
};

// Helper function to send notification

export const sendNotificationToUser = (
  io: Server,
  userId: string,
  notification: any,
  userSockets: Record<string, Set<string>>
) => {
  const sockets = Array.from(userSockets[userId] || []);
  sockets.forEach((socketId: string) => {
    io.to(socketId).emit("newNotification", notification);
  });
};
