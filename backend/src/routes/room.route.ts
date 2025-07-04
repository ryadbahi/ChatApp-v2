import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { joinRoomLimiter } from "../middlewares/rateLimit.middleware";
import {
  createRoom,
  getUserRooms,
  joinRoom,
  getRoomById,
  deleteRoom,
  editRoom,
  searchRooms,
  getCreatedRooms,
  joinSecretRoomByName,
} from "../controllers/room.controller";

const router = Router();

// Room CRUD operations
router.post("/", protect, createRoom); // Create a new room
router.get("/", protect, getUserRooms); // Get list of public/private rooms
router.get("/search", protect, searchRooms); // Search rooms by name
router.get("/created", protect, getCreatedRooms); // Get rooms created by user
router.get("/:id", protect, getRoomById); // Get single room by ID
router.put("/:id", protect, editRoom); // Edit room (creator only)
router.delete("/:id", protect, deleteRoom); // Delete room (creator only)

// Room access (with rate limiting)
router.post("/join-secret", protect, joinRoomLimiter, joinSecretRoomByName); // Join secret room by name and password
router.post("/:id/join", protect, joinRoomLimiter, joinRoom); // Join/access room with credentials

export default router;
