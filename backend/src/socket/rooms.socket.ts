import { Server } from "socket.io";
import { Types } from "mongoose";
import Room from "../models/Room";
import User from "../models/User";

// Room tracking structure
export interface RoomData {
  users: Set<string>;
  sockets: Set<string>;
  lastUpdate: number;
}

const rooms: Record<string, RoomData> = {};

// Get current user count for a room
export const getRoomUserCount = (roomId: string): number => {
  return rooms[roomId]?.users.size || 0;
};

// Update users in a room with the latest user list
export const updateRoomData = async (io: Server, roomId: string) => {
  if (!rooms[roomId]) return;

  const userIds = Array.from(rooms[roomId].users);
  const users = await User.find({ _id: { $in: userIds } })
    .select("_id username avatar")
    .sort({ username: 1 });

  io.emit("roomUserCount", { roomId, count: userIds.length });
  io.to(roomId).emit("roomUsersUpdate", { users });
};

// Fetch all public room user counts
export const getAllRoomCounts = async (): Promise<Record<string, number>> => {
  const counts: Record<string, number> = {};
  const publicRooms = (await Room.find({ visibility: "public" }).select(
    "_id"
  )) as { _id: Types.ObjectId }[];

  publicRooms.forEach((room) => {
    const id = room._id.toString();
    counts[id] = getRoomUserCount(id);
  });

  return counts;
};

// Broadcast all room counts
export const broadcastAllRoomCounts = async (io: Server) => {
  const counts = await getAllRoomCounts();
  io.emit("allRoomCounts", counts);
};

// Called when user joins a room
export const handleJoinRoom = async (
  socket: any,
  io: Server,
  roomId: string,
  userId: string
) => {
  const room = await Room.findById(roomId);
  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }

  if (!rooms[roomId]) {
    rooms[roomId] = {
      users: new Set(),
      sockets: new Set(),
      lastUpdate: Date.now(),
    };
  }

  rooms[roomId].users.add(userId);
  rooms[roomId].sockets.add(socket.id);
  rooms[roomId].lastUpdate = Date.now();

  socket.join(roomId);

  await updateRoomData(io, roomId);
  await broadcastAllRoomCounts(io);
};

// Called when user leaves a room
export const handleLeaveRoom = async (
  socket: any,
  io: Server,
  roomId: string,
  userId: string,
  userSockets: Record<string, Set<string>>
) => {
  if (!rooms[roomId]) return;

  rooms[roomId].sockets.delete(socket.id);

  const hasOtherSockets = Array.from(userSockets[userId] || []).some((id) =>
    rooms[roomId].sockets.has(id)
  );

  if (!hasOtherSockets) {
    rooms[roomId].users.delete(userId);
  }

  if (rooms[roomId].users.size === 0) {
    delete rooms[roomId];
  } else {
    rooms[roomId].lastUpdate = Date.now();
  }

  socket.leave(roomId);

  await updateRoomData(io, roomId);
  await broadcastAllRoomCounts(io);
};

// Clean up rooms after disconnect
export const cleanupSocketFromRooms = async (
  io: Server,
  socketId: string,
  userId: string,
  userSockets: Record<string, Set<string>>,
  socketToUser: Record<string, string>
) => {
  for (const [roomId, room] of Object.entries(rooms)) {
    if (room.sockets.has(socketId)) {
      room.sockets.delete(socketId);

      const hasOtherSockets = Array.from(userSockets[userId] || []).some((id) =>
        room.sockets.has(id)
      );

      if (!hasOtherSockets) {
        room.users.delete(userId);
      }

      if (room.users.size === 0) {
        delete rooms[roomId];
      } else {
        room.lastUpdate = Date.now();
        await updateRoomData(io, roomId);
      }
    }
  }

  delete socketToUser[socketId];
  await broadcastAllRoomCounts(io);
};

// Get users in a specific room
export const getRoomUsers = async (roomId: string) => {
  if (!rooms[roomId]) return [];

  const userIds = Array.from(rooms[roomId].users);
  const users = await User.find({ _id: { $in: userIds } })
    .select("_id username avatar")
    .sort({ username: 1 });

  return users;
};
