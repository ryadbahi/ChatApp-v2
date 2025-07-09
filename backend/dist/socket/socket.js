"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
const middleware_socket_1 = require("./middleware.socket");
const inactivity_socket_1 = require("./inactivity.socket");
const roomHandlers = __importStar(require("./rooms.socket"));
const friends_socket_1 = require("./friends.socket");
const notifications_socket_1 = require("./notifications.socket");
const messages_socket_1 = require("./messages.socket");
const directMessages_socket_1 = require("./directMessages.socket");
const utils_socket_1 = require("./utils.socket");
// Global user socket tracking
const socketToUser = {};
const userSockets = {};
function setupSocket(io) {
    (0, middleware_socket_1.registerSocketAuthMiddleware)(io, socketToUser, userSockets);
    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        console.log(`[Socket] User ${userId} connected with socket ${socket.id}`);
        socket.join(`user:${userId}`);
        (0, inactivity_socket_1.updateUserActivity)(userId, io, userSockets);
        // Register all event handlers
        (0, friends_socket_1.registerFriendEvents)(socket, io, userId, userSockets);
        (0, notifications_socket_1.registerNotificationEvents)(socket, io, userId);
        (0, messages_socket_1.registerMessageEvents)(socket, io, userId, userSockets);
        (0, directMessages_socket_1.registerDirectMessageEvents)(socket, io, userId, userSockets);
        registerRoomEvents(socket, io, userId, userSockets, socketToUser);
        // Broadcast initial data
        roomHandlers.broadcastAllRoomCounts(io);
        (0, utils_socket_1.broadcastToFriends)(io, userId, "friendOnlineStatusUpdate", {
            userId,
            isOnline: true,
        }, userSockets);
        socket.on("userActivity", () => (0, inactivity_socket_1.updateUserActivity)(userId, io, userSockets));
        socket.on("disconnect", async () => {
            console.log(`[Socket] User ${userId} disconnected socket ${socket.id}`);
            // Clean up rooms first
            await roomHandlers.cleanupSocketFromRooms(io, socket.id, userId, userSockets, socketToUser);
            // Remove socket from tracking
            delete socketToUser[socket.id];
            if (userSockets[userId]) {
                userSockets[userId].delete(socket.id);
                if (userSockets[userId].size === 0) {
                    delete userSockets[userId];
                    (0, inactivity_socket_1.cleanupUserTimers)(userId);
                    // Broadcast offline status only when user has no more sockets
                    (0, utils_socket_1.broadcastToFriends)(io, userId, "friendOnlineStatusUpdate", {
                        userId,
                        isOnline: false,
                    }, userSockets);
                }
            }
        });
    });
}
// Register room-related socket events
function registerRoomEvents(socket, io, userId, userSockets, socketToUser) {
    socket.on("joinRoom", async ({ roomId }) => {
        if (!roomId || roomId === "undefined") {
            console.log(`[Socket] User ${userId} tried to join invalid room: ${roomId}`);
            return;
        }
        console.log(`[Socket] User ${userId} joining room ${roomId}`);
        await roomHandlers.handleJoinRoom(socket, io, roomId, userId);
    });
    socket.on("leaveRoom", async ({ roomId }) => {
        if (!roomId || roomId === "undefined") {
            console.log(`[Socket] User ${userId} tried to leave invalid room: ${roomId}`);
            return;
        }
        console.log(`[Socket] User ${userId} leaving room ${roomId}`);
        await roomHandlers.handleLeaveRoom(socket, io, roomId, userId, userSockets);
    });
    socket.on("getRoomCounts", async () => {
        const counts = await roomHandlers.getAllRoomCounts();
        socket.emit("allRoomCounts", counts);
    });
    socket.on("getRoomUsers", async ({ roomId }, callback) => {
        if (!roomId || roomId === "undefined") {
            console.log(`[Socket] User ${userId} tried to get users for invalid room: ${roomId}`);
            if (typeof callback === "function") {
                callback({ users: [] });
            }
            return;
        }
        console.log(`[Socket] User ${userId} requesting users for room ${roomId}`);
        const users = await roomHandlers.getRoomUsers(roomId);
        if (typeof callback === "function") {
            callback({ users });
        }
    });
}
