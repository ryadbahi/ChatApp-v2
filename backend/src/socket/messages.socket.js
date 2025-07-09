"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMessageEvents = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const Room_1 = __importDefault(require("../models/Room"));
const inactivity_socket_1 = require("./inactivity.socket");
const registerMessageEvents = (socket, io, userId, userSockets) => {
    socket.on("sendMessage", async ({ roomId, message, imageUrl }) => {
        (0, inactivity_socket_1.updateUserActivity)(userId, io, userSockets, "sendMessage");
        try {
            if ((!message?.trim() && !imageUrl) || !roomId)
                return;
            const room = await Room_1.default.findById(roomId);
            if (!room)
                return;
            const msg = await Message_1.default.create({
                room: roomId,
                sender: userId,
                content: message,
                imageUrl,
            });
            const populated = await msg.populate("sender", "username avatar");
            io.to(roomId).emit("newMessage", populated);
        }
        catch (error) {
            console.error("[Socket] Error in sendMessage:", error);
        }
    });
};
exports.registerMessageEvents = registerMessageEvents;
