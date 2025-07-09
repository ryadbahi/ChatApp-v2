"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const directMessage_controller_1 = require("../controllers/directMessage.controller");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.protect);
// Get direct messages between two users
router.get("/:otherUserId", directMessage_controller_1.getDirectMessages);
// Send a direct message
router.post("/", directMessage_controller_1.sendDirectMessage);
// Mark messages as read
router.put("/:otherUserId/read", directMessage_controller_1.markMessagesAsRead);
// Get unread message count
router.get("/unread/count", directMessage_controller_1.getUnreadMessageCount);
// Get recent conversations
router.get("/conversations/recent", directMessage_controller_1.getRecentConversations);
exports.default = router;
