// src/socket.ts
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "./models/Message";
import Room from "./models/Room";
import { Types } from "mongoose";

export const setupSocket = (io: Server) => {
  // ✅ Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    console.log("🛂 Token received in handshake:", token);
    if (!token) {
      console.warn("[Socket] ❌ No token provided");
      return next(new Error("No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      socket.data.userId = new Types.ObjectId(decoded.id);
      console.log("🔐 Authenticated socket for user:", decoded.id);
      next();
    } catch (err) {
      console.error("[Socket] ❌ Invalid token");
      next(new Error("Invalid token"));
    }
  });

  // ✅ On connection
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // 🔍 Log all incoming events
    socket.onAny((event, payload) => {
      console.log(`📨 Event received: '${event}'`, payload);
    });

    // ✅ Join a room
    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
      console.log(`🟢 Socket ${socket.id} joined room ${roomId}`);
    });

    // ✅ Send a message
    socket.on("sendMessage", async ({ roomId, message }) => {
      const userId = socket.data.userId;

      if (!message?.trim()) {
        console.warn("[Socket] ❗ Empty message discarded");
        return;
      }

      const room = await Room.findById(roomId);
      if (!room || !room.members.some((member) => member.equals(userId))) {
        console.warn("[Socket] ⛔ Access denied: not a member of room", roomId);
        return;
      }

      console.log("✅ Message accepted:", message);

      const msg = await Message.create({
        room: roomId,
        sender: userId,
        content: message,
      });

      const populated = await msg.populate("sender", "username avatar");

      console.log("[📣] Broadcasting new message to room:", roomId);
      io.to(roomId).emit("newMessage", populated);
    });

    // ✅ On disconnect
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};
