import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  getMessages,
  sendMessage,
  getDirectMessages,
  getDMThreads,
  markDirectMessagesAsRead,
  sendDirectMessage,
} from "../controllers/message.controller";

const router = Router();

// Room messages
router.get("/:roomId", protect, getMessages);
router.post("/:roomId", protect, sendMessage);

// Direct messages
router.get("/dm/threads", protect, getDMThreads);
router.get("/dm/:otherUserId", protect, getDirectMessages);
router.post("/dm/:otherUserId", protect, sendDirectMessage);
router.put("/dm/:otherUserId/read", protect, markDirectMessagesAsRead);

export default router;
