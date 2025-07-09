"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const friends_controller_1 = require("../controllers/friends.controller");
const router = (0, express_1.Router)();
// All friend routes require authentication
router.use(auth_middleware_1.protect);
// POST /api/friends/request - Send friend request
router.post("/request", friends_controller_1.sendFriendRequest);
// POST /api/friends/accept/:requestId - Accept friend request
router.post("/accept/:requestId", friends_controller_1.acceptFriendRequest);
// POST /api/friends/reject/:requestId - Reject friend request
router.post("/reject/:requestId", friends_controller_1.rejectFriendRequest);
// DELETE /api/friends/end/:friendId - End friendship
router.delete("/end/:friendId", friends_controller_1.endFriendship);
// GET /api/friends - Get user's friends list
router.get("/", friends_controller_1.getFriends);
// GET /api/friends/requests - Get pending friend requests
router.get("/requests", friends_controller_1.getFriendRequests);
// GET /api/friends/status/:otherUserId - Check friendship status
router.get("/status/:otherUserId", friends_controller_1.getFriendshipStatus);
// DEBUG: Clear friend requests between users (for testing)
router.post("/clear", friends_controller_1.clearFriendRequestsBetweenUsers);
exports.default = router;
