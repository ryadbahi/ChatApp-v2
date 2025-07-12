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
import { Request, Response, NextFunction } from "express";
import { setupSocket } from "./socket/socket"; // 👈 socket logic separated

// Global socket instance for use in controllers
export let globalSocketIO: Server;

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "https://chat-app-v2-1owv215r9-ryadbahis-projects.vercel.app",
  "https://chat-app-v2-eosin.vercel.app",
  "https://chat-app-v2-ryadbahis-projects.vercel.app",
  "https://chat-app-v2-git-main-ryadbahis-projects.vercel.app",
  "http://ryadbah.me/ChatApp-v2/",
  "https://dainty-swan-ed509d.netlify.app", // GitHub Pages domain
];
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman)
      if (!origin) return callback(null, true);

      // Check if origin is in allowedOrigins OR is a vercel.app domain
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

// Make socket instance globally available BEFORE setup
globalSocketIO = io;

// 🧠 Setup socket logic (auth, events, etc.)
setupSocket(io);

// ✅ Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman)
      if (!origin) return callback(null, true);

      // Check if origin is in allowedOrigins OR is a vercel.app domain
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
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
  res.send(`
    <html>
      <head>
        <title>AuraRooms Backend Wakeup</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f8fafc; color: #222; padding: 2rem; }
          .container { max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 2rem; }
          h1 { color: #6366f1; }
          a { color: #2563eb; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to AuraRooms Backend</h1>
          <p>
            <strong>Note:</strong> The backend is hosted on Render and may be sleeping.<br>
            To wake it up, please visit this page first.<br>
            <a href="https://chatapp-v2-voa9.onrender.com/" target="_blank">https://chatapp-v2-voa9.onrender.com/</a>
          </p>
          <p>
            Once you see the message above, return to the frontend:<br>
            <a href="https://chat-app-v2-seven.vercel.app" target="_blank">https://chat-app-v2-seven.vercel.app</a>
          </p>
          <hr>
          <small>Powered by AuraRooms &middot; Backend API is running</small>
        </div>
      </body>
    </html>
  `);
});

// ✅ Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const origin =
    typeof req.headers.origin === "string" ? req.headers.origin : "";

  // Allow any vercel.app domain or domains in allowedOrigins
  const isAllowed =
    allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");

  res.header("Access-Control-Allow-Origin", isAllowed ? origin : "");
  res.header("Access-Control-Allow-Credentials", "true");
  // If response already sent, just return
  if (res.headersSent) return next(err);
  // Send error response with status code and message
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || "Internal Server Error",
      code: err.code || "SERVER_ERROR",
      status,
    },
  });
});

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
