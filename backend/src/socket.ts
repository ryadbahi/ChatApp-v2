import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie"; // ✅ important ici
import Message from "./models/Message";
import Room from "./models/Room";
import { Types } from "mongoose";

export const setupSocket = (io: Server) => {
  io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie || "";
    const cookies = cookie.parse(rawCookie); // ✅ maintenant ça marche
    const token = cookies.token;

    console.log("🛂 Token from cookie:", token);

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

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    socket.onAny((event, payload) => {
      console.log(`📨 Event received: '${event}'`, payload);
    });

    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
      console.log(`🟢 Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("sendMessage", async ({ roomId, message }) => {
      const userId = socket.data.userId;
      if (!message?.trim()) return;

      const room = await Room.findById(roomId);
      if (!room) return;

      const msg = await Message.create({
        room: roomId,
        sender: userId,
        content: message,
      });

      const populated = await msg.populate("sender", "username avatar");

      console.log("[📣] Broadcasting new message to room:", roomId);
      io.to(roomId).emit("newMessage", populated);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};
