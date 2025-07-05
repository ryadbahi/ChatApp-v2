import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import Message from "./models/Message";
import Room from "./models/Room";
import User from "./models/User";
import { Types } from "mongoose";

interface RoomData {
  users: Set<string>; // Set of user IDs in the room
  sockets: Set<string>; // Set of socket IDs in the room
  lastUpdate: number; // Timestamp of last update
}

// Enhanced room tracking system
const rooms: Record<string, RoomData> = {};
// Track socket-to-user mapping for quick lookups
const socketToUser: Record<string, string> = {};
// Track user's active sockets
const userSockets: Record<string, Set<string>> = {};

const getRoomUserCount = (roomId: string): number => {
  return rooms[roomId]?.users.size || 0;
};

const updateRoomData = async (io: Server, roomId: string) => {
  if (!rooms[roomId]) return;

  const userIds = Array.from(rooms[roomId].users);
  const users = await User.find({ _id: { $in: userIds } })
    .select("_id username avatar")
    .sort({ username: 1 });

  // Update all clients about the room's user count
  io.emit("roomUserCount", { roomId, count: userIds.length });

  // Update users in the room about the detailed user list
  io.to(roomId).emit("roomUsersUpdate", { users });
};

const getAllRoomCounts = async (): Promise<Record<string, number>> => {
  const counts: Record<string, number> = {};
  const publicRooms = (await Room.find({ visibility: "public" }).select(
    "_id"
  )) as { _id: Types.ObjectId }[];

  publicRooms.forEach((room) => {
    const roomId = room._id.toString();
    counts[roomId] = getRoomUserCount(roomId);
  });

  return counts;
};

const broadcastAllRoomCounts = async (io: Server) => {
  const counts = await getAllRoomCounts();
  io.emit("allRoomCounts", counts);
};

export const setupSocket = (io: Server) => {
  io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie || "";
    const cookies = cookie.parse(rawCookie);
    const token = cookies.token;

    if (!token) return next(new Error("No token provided"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      const userId = decoded.id.toString();
      socket.data.userId = decoded.id;
      socketToUser[socket.id] = userId;

      if (!userSockets[userId]) {
        userSockets[userId] = new Set();
      }
      userSockets[userId].add(socket.id);

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socketToUser[socket.id];
    if (!userId) return;

    // Send initial room counts to the newly connected user
    getAllRoomCounts().then((counts) => {
      socket.emit("allRoomCounts", counts);
    });

    socket.on("joinRoom", async (roomId: string) => {
      try {
        // Check if room exists and user has permission
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // For private and secret rooms, user must have already joined via API
        // We cannot validate passwords here as they are not stored in socket session
        // So we rely on the HTTP API join endpoints for authentication
        if (room.visibility !== "public") {
          // For non-public rooms, we could add additional checks here
          // For now, we allow socket connection if they reach this point
          console.log(
            `[Socket] User ${userId} joining ${room.visibility} room ${roomId}`
          );
        }

        // Initialize room data if needed
        if (!rooms[roomId]) {
          rooms[roomId] = {
            users: new Set(),
            sockets: new Set(),
            lastUpdate: Date.now(),
          };
        }

        // Add user and socket to room
        rooms[roomId].users.add(userId);
        rooms[roomId].sockets.add(socket.id);
        rooms[roomId].lastUpdate = Date.now();

        // Join the Socket.IO room
        socket.join(roomId);

        // Update all clients
        await updateRoomData(io, roomId);
        await broadcastAllRoomCounts(io);
      } catch (error) {
        console.error("[Socket] Error in joinRoom:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("leaveRoom", async (roomId: string) => {
      try {
        if (!rooms[roomId]) return;

        // Remove socket from room
        rooms[roomId].sockets.delete(socket.id);

        // Only remove user if they have no more sockets in the room
        const hasOtherSocketsInRoom = Array.from(
          userSockets[userId] || []
        ).some((socketId) => rooms[roomId].sockets.has(socketId));

        if (!hasOtherSocketsInRoom) {
          rooms[roomId].users.delete(userId);
        }

        // Clean up empty rooms
        if (rooms[roomId].users.size === 0) {
          delete rooms[roomId];
        } else {
          rooms[roomId].lastUpdate = Date.now();
        }

        socket.leave(roomId);

        // Update all clients
        await updateRoomData(io, roomId);
        await broadcastAllRoomCounts(io);
      } catch (error) {
        console.error("[Socket] Error in leaveRoom:", error);
      }
    });

    socket.on("getRoomUsers", async (roomId: string, callback) => {
      try {
        if (!rooms[roomId]) {
          callback({ users: [] });
          return;
        }

        const userIds = Array.from(rooms[roomId].users);
        const users = await User.find({ _id: { $in: userIds } })
          .select("_id username avatar")
          .sort({ username: 1 });

        callback({ users });
      } catch (error) {
        console.error("[Socket] Error in getRoomUsers:", error);
        callback({ users: [] });
      }
    });

    socket.on("getPublicRoomsUserCounts", async (callback) => {
      try {
        const counts = await getAllRoomCounts();
        callback(counts);
      } catch (error) {
        console.error("[Socket] Error in getPublicRoomsUserCounts:", error);
        callback({});
      }
    });

    socket.on("disconnect", async () => {
      try {
        const userId = socketToUser[socket.id];
        if (!userId) return;

        // Clean up user sockets tracking
        if (userSockets[userId]) {
          userSockets[userId].delete(socket.id);
          if (userSockets[userId].size === 0) {
            delete userSockets[userId];
          }
        }

        // Clean up all rooms this socket was in
        for (const [roomId, room] of Object.entries(rooms)) {
          if (room.sockets.has(socket.id)) {
            room.sockets.delete(socket.id);

            // Only remove user if they have no more sockets in the room
            const hasOtherSocketsInRoom = Array.from(
              userSockets[userId] || []
            ).some((socketId) => room.sockets.has(socketId));

            if (!hasOtherSocketsInRoom) {
              room.users.delete(userId);
            }

            // Clean up empty rooms
            if (room.users.size === 0) {
              delete rooms[roomId];
            } else {
              room.lastUpdate = Date.now();
              await updateRoomData(io, roomId);
            }
          }
        }

        delete socketToUser[socket.id];
        await broadcastAllRoomCounts(io);
      } catch (error) {
        console.error("[Socket] Error in disconnect:", error);
      }
    });

    // Handle messages
    socket.on("sendMessage", async ({ roomId, message, imageUrl }) => {
      try {
        if ((!message?.trim() && !imageUrl) || !rooms[roomId]) return;

        const room = await Room.findById(roomId);
        if (!room) return;

        const msg = await Message.create({
          room: roomId,
          sender: userId,
          content: message,
          imageUrl,
        });

        const populated = await msg.populate("sender", "username avatar");
        io.to(roomId).emit("newMessage", populated);
      } catch (error) {
        console.error("[Socket] Error in sendMessage:", error);
      }
    });
  });
};
