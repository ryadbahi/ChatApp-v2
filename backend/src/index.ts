// src/index.ts
import express from "express";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.route";
import { errorHandler } from "./middlewares/errorHandler";
import roomRoute from "./routes/room.route";
import messageRoute from "./routes/message.route";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.user = decoded; // You can access it later via socket.data.user
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// ✅ Socket.io Events
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Join a chat room
  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);
    console.log(`🟢 Socket ${socket.id} joined room ${roomId}`);
  });

  // Receive and broadcast message to the same room
  socket.on("sendMessage", ({ roomId, message }) => {
    console.log(`💬 Message in room ${roomId}:`, message);
    socket.to(roomId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoute);
app.use("/api/messages", messageRoute);

// ✅ Default test route
app.get("/", (req, res) => {
  res.send("API is running");
});

// ✅ Error handler
app.use(errorHandler);

// ✅ Connect to DB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI!;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));
