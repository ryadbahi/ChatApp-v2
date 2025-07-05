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
import { setupSocket } from "./socket"; // 👈 socket logic separated

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend
    credentials: true,
  },
});

// 🧠 Setup socket logic (auth, events, etc.)
setupSocket(io);

// ✅ Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

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
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/yourdb"; // Fallback URI

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
