"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomUsers = exports.cleanupSocketFromRooms = exports.handleLeaveRoom = exports.handleJoinRoom = exports.broadcastAllRoomCounts = exports.getAllRoomCounts = exports.updateRoomData = exports.getRoomUserCount = void 0;
const Room_1 = __importDefault(require("../models/Room"));
const User_1 = __importDefault(require("../models/User"));
const rooms = {};
// Get current user count for a room
const getRoomUserCount = (roomId) => {
    return rooms[roomId]?.users.size || 0;
};
exports.getRoomUserCount = getRoomUserCount;
// Update users in a room with the latest user list
const updateRoomData = async (io, roomId) => {
    if (!rooms[roomId])
        return;
    const userIds = Array.from(rooms[roomId].users);
    const users = await User_1.default.find({ _id: { $in: userIds } })
        .select("_id username avatar")
        .sort({ username: 1 });
    io.emit("roomUserCount", { roomId, count: userIds.length });
    io.to(roomId).emit("roomUsersUpdate", { users });
};
exports.updateRoomData = updateRoomData;
// Fetch all public room user counts
const getAllRoomCounts = async () => {
    const counts = {};
    const publicRooms = (await Room_1.default.find({ visibility: "public" }).select("_id"));
    publicRooms.forEach((room) => {
        const id = room._id.toString();
        counts[id] = (0, exports.getRoomUserCount)(id);
    });
    return counts;
};
exports.getAllRoomCounts = getAllRoomCounts;
// Broadcast all room counts
const broadcastAllRoomCounts = async (io) => {
    const counts = await (0, exports.getAllRoomCounts)();
    io.emit("allRoomCounts", counts);
};
exports.broadcastAllRoomCounts = broadcastAllRoomCounts;
// Called when user joins a room
const handleJoinRoom = async (socket, io, roomId, userId) => {
    const room = await Room_1.default.findById(roomId);
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
    await (0, exports.updateRoomData)(io, roomId);
    await (0, exports.broadcastAllRoomCounts)(io);
};
exports.handleJoinRoom = handleJoinRoom;
// Called when user leaves a room
const handleLeaveRoom = async (socket, io, roomId, userId, userSockets) => {
    if (!rooms[roomId])
        return;
    rooms[roomId].sockets.delete(socket.id);
    const hasOtherSockets = Array.from(userSockets[userId] || []).some((id) => rooms[roomId].sockets.has(id));
    if (!hasOtherSockets) {
        rooms[roomId].users.delete(userId);
    }
    if (rooms[roomId].users.size === 0) {
        delete rooms[roomId];
    }
    else {
        rooms[roomId].lastUpdate = Date.now();
    }
    socket.leave(roomId);
    await (0, exports.updateRoomData)(io, roomId);
    await (0, exports.broadcastAllRoomCounts)(io);
};
exports.handleLeaveRoom = handleLeaveRoom;
// Clean up rooms after disconnect
const cleanupSocketFromRooms = async (io, socketId, userId, userSockets, socketToUser) => {
    for (const [roomId, room] of Object.entries(rooms)) {
        if (room.sockets.has(socketId)) {
            room.sockets.delete(socketId);
            const hasOtherSockets = Array.from(userSockets[userId] || []).some((id) => room.sockets.has(id));
            if (!hasOtherSockets) {
                room.users.delete(userId);
            }
            if (room.users.size === 0) {
                delete rooms[roomId];
            }
            else {
                room.lastUpdate = Date.now();
                await (0, exports.updateRoomData)(io, roomId);
            }
        }
    }
    delete socketToUser[socketId];
    await (0, exports.broadcastAllRoomCounts)(io);
};
exports.cleanupSocketFromRooms = cleanupSocketFromRooms;
// Get users in a specific room
const getRoomUsers = async (roomId) => {
    if (!rooms[roomId])
        return [];
    const userIds = Array.from(rooms[roomId].users);
    const users = await User_1.default.find({ _id: { $in: userIds } })
        .select("_id username avatar")
        .sort({ username: 1 });
    return users;
};
exports.getRoomUsers = getRoomUsers;
