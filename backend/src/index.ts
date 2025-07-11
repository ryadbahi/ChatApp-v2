// src/index.ts
import express from "express";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.route";
import roomRoutes from "./routes/room.route";
import messageRoutes from "./routes/message.route";
import { errorHandler } from "./middlewares/errorHandler";
import { setupSocket } from "./socket/socket"; // 👈 socket logic separated

// Global socket instance for use in controllers
export let globalSocketIO: Server;

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "https://chat-app-v2-1owv215r9-ryadbahis-projects.vercel.app"
];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Make socket instance globally available BEFORE setup
globalSocketIO = io;

// 🧠 Setup socket logic (auth, events, etc.)
setupSocket(io);

// ✅ Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

// Friends routes
import friendsRoutes from "./routes/friends.route";
app.use("/api/friends", friendsRoutes);

// Notifications routes
import notificationsRoutes from "./routes/notifications.route";
app.use("/api/notifications", notificationsRoutes);

// Direct Messages routes
import directMessageRoutes from "./routes/directMessage.route";
app.use("/api/direct-messages", directMessageRoutes);

// Image/GIF upload route
import uploadRoute from "./routes/upload.route";
app.use("/api/upload", uploadRoute);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("API is running");
});

// ✅ Global error handler
app.use(errorHandler);

// ✅ DB + server startup
const PORT: number = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGODB_URI || "PLACEHOLDER_MONGO_URI";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Handle server errors
server.on("error", (error) => {
  console.error("Server error:", error);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
