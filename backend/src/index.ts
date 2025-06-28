// src/index.ts
import express from "express";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.route";
import multer from "multer";
import { errorHandler } from "./middlewares/errorHandler";
import roomRoute from "./routes/room.route";
import messageRoute from "./routes/message.route";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    credentials: true,
  },
});

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoute);
app.use("/api/messages", messageRoute);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI!;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection failed:", err));

// Temporary route
app.get("/", (req, res) => {
  res.send("API is running");
});

app.use(errorHandler); // Register after all routes
