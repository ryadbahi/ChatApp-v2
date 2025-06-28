import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  createRoom,
  getUserRooms,
  joinRoom,
} from "../controllers/room.controller";

const router = Router();

router.post("/", protect, createRoom); // Create room
router.get("/", protect, getUserRooms); // Get rooms user is in
router.post("/:id/join", protect, joinRoom); // Join room

export default router;
