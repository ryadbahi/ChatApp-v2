import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  getDirectMessages,
  getDirectMessageContacts,
  markMessagesAsRead,
  searchUsersForDM,
} from "../controllers/directMessage.controller";

const router = Router();

// All direct message routes require authentication
router.use(protect);

// GET /api/direct-messages/contacts - Get list of contacts (users with message history)
router.get("/contacts", getDirectMessageContacts);

// GET /api/direct-messages/search-users - Search users for direct messaging
router.get("/search-users", searchUsersForDM);

// GET /api/direct-messages/:otherUserId - Get direct messages with a specific user
router.get("/:otherUserId", getDirectMessages);

// PUT /api/direct-messages/:otherUserId/read - Mark messages as read
router.put("/:otherUserId/read", markMessagesAsRead);

export default router;
