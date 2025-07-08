import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  getDirectMessages,
  sendDirectMessage,
  markMessagesAsRead,
  getUnreadMessageCount,
  getRecentConversations,
} from "../controllers/directMessage.controller";

const router = Router();

// All routes require authentication
router.use(protect);

// Get direct messages between two users
router.get("/:otherUserId", getDirectMessages);

// Send a direct message
router.post("/", sendDirectMessage);

// Mark messages as read
router.put("/:otherUserId/read", markMessagesAsRead);

// Get unread message count
router.get("/unread/count", getUnreadMessageCount);

// Get recent conversations
router.get("/conversations/recent", getRecentConversations);

export default router;
