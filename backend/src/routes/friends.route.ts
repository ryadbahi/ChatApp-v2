import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  endFriendship,
  getFriends,
  getFriendRequests,
  getFriendshipStatus,
  clearFriendRequestsBetweenUsers,
} from "../controllers/friends.controller";

const router = Router();

// All friend routes require authentication
router.use(protect);

// POST /api/friends/request - Send friend request
router.post("/request", sendFriendRequest);

// POST /api/friends/accept/:requestId - Accept friend request
router.post("/accept/:requestId", acceptFriendRequest);

// POST /api/friends/reject/:requestId - Reject friend request
router.post("/reject/:requestId", rejectFriendRequest);

// DELETE /api/friends/end/:friendId - End friendship
router.delete("/end/:friendId", endFriendship);

// GET /api/friends - Get user's friends list
router.get("/", getFriends);

// GET /api/friends/requests - Get pending friend requests
router.get("/requests", getFriendRequests);

// GET /api/friends/status/:otherUserId - Check friendship status
router.get("/status/:otherUserId", getFriendshipStatus);

// DEBUG: Clear friend requests between users (for testing)
router.post("/clear", clearFriendRequestsBetweenUsers);

export default router;
