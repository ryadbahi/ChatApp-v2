import { Server } from "socket.io";

import { registerSocketAuthMiddleware } from "./middleware.socket";
import { updateUserActivity, cleanupUserTimers } from "./inactivity.socket";
import * as roomHandlers from "./rooms.socket";
import { registerFriendEvents } from "./friends.socket";
import { registerNotificationEvents } from "./notifications.socket";
import { registerMessageEvents } from "./messages.socket";
import { registerDirectMessageEvents } from "./directMessages.socket";
import { getUserFriends, broadcastToFriends } from "./utils.socket";

// Global user socket tracking
const socketToUser: Record<string, string> = {};
const userSockets: Record<string, Set<string>> = {};

export function setupSocket(io: Server) {
  registerSocketAuthMiddleware(io, socketToUser, userSockets);

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    console.log(`[Socket] User ${userId} connected with socket ${socket.id}`);

    socket.join(`user:${userId}`);
    updateUserActivity(userId, io, userSockets);

    // Register all event handlers
    registerFriendEvents(socket, io, userId, userSockets);
    registerNotificationEvents(socket, io, userId);
    registerMessageEvents(socket, io, userId, userSockets);
    registerDirectMessageEvents(socket, io, userId, userSockets);
    registerRoomEvents(socket, io, userId, userSockets, socketToUser);

    // Broadcast initial data
    roomHandlers.broadcastAllRoomCounts(io);
    broadcastToFriends(
      io,
      userId,
      "friendOnlineStatusUpdate",
      {
        userId,
        isOnline: true,
      },
      userSockets
    );

    socket.on("userActivity", () =>
      updateUserActivity(userId, io, userSockets)
    );

    socket.on("disconnect", async () => {
      console.log(`[Socket] User ${userId} disconnected socket ${socket.id}`);

      // Clean up rooms first
      await roomHandlers.cleanupSocketFromRooms(
        io,
        socket.id,
        userId,
        userSockets,
        socketToUser
      );

      // Remove socket from tracking
      delete socketToUser[socket.id];
      if (userSockets[userId]) {
        userSockets[userId].delete(socket.id);
        if (userSockets[userId].size === 0) {
          delete userSockets[userId];
          cleanupUserTimers(userId);

          // Broadcast offline status only when user has no more sockets
          broadcastToFriends(
            io,
            userId,
            "friendOnlineStatusUpdate",
            {
              userId,
              isOnline: false,
            },
            userSockets
          );
        }
      }
    });
  });
}

// Register room-related socket events
function registerRoomEvents(
  socket: any,
  io: Server,
  userId: string,
  userSockets: Record<string, Set<string>>,
  socketToUser: Record<string, string>
) {
  socket.on("joinRoom", async ({ roomId }: { roomId: string }) => {
    if (!roomId || roomId === "undefined") {
      console.log(
        `[Socket] User ${userId} tried to join invalid room: ${roomId}`
      );
      return;
    }
    console.log(`[Socket] User ${userId} joining room ${roomId}`);
    await roomHandlers.handleJoinRoom(socket, io, roomId, userId);
  });

  socket.on("leaveRoom", async ({ roomId }: { roomId: string }) => {
    if (!roomId || roomId === "undefined") {
      console.log(
        `[Socket] User ${userId} tried to leave invalid room: ${roomId}`
      );
      return;
    }
    console.log(`[Socket] User ${userId} leaving room ${roomId}`);
    await roomHandlers.handleLeaveRoom(socket, io, roomId, userId, userSockets);
  });

  socket.on("getRoomCounts", async () => {
    const counts = await roomHandlers.getAllRoomCounts();
    socket.emit("allRoomCounts", counts);
  });

  socket.on(
    "getRoomUsers",
    async ({ roomId }: { roomId: string }, callback: any) => {
      if (!roomId || roomId === "undefined") {
        console.log(
          `[Socket] User ${userId} tried to get users for invalid room: ${roomId}`
        );
        if (typeof callback === "function") {
          callback({ users: [] });
        }
        return;
      }
      console.log(
        `[Socket] User ${userId} requesting users for room ${roomId}`
      );
      const users = await roomHandlers.getRoomUsers(roomId);
      if (typeof callback === "function") {
        callback({ users });
      }
    }
  );
}
