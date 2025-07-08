import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import Message from "./models/Message";
import Room from "./models/Room";
import User from "./models/User";
import DirectMessage from "./models/DirectMessage";
import FriendRequest from "./models/FriendRequest";
import Friendship from "./models/Friendship";
import Notification from "./models/Notification";
import { Types } from "mongoose";

interface RoomData {
  users: Set<string>; // Set of user IDs in the room
  sockets: Set<string>; // Set of socket IDs in the room
  lastUpdate: number; // Timestamp of last update
}

// Enhanced room tracking system
const rooms: Record<string, RoomData> = {};
// Track socket-to-user mapping for quick lookups
const socketToUser: Record<string, string> = {};
// Track user's active sockets
const userSockets: Record<string, Set<string>> = {};
// Track online users for friends status
const onlineUsers: Set<string> = new Set();

// Inactivity timeout configuration (in milliseconds)
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 5 seconds for testing
const WARNING_TIME = 30 * 60 * 1000; // 2 seconds warning before disconnect
// Track user activity timestamps
const userActivity: Record<string, number> = {};
// Track warning timers
const warningTimers: Record<string, NodeJS.Timeout> = {};
// Track disconnect timers
const disconnectTimers: Record<string, NodeJS.Timeout> = {};

const getRoomUserCount = (roomId: string): number => {
  return rooms[roomId]?.users.size || 0;
};

const updateRoomData = async (io: Server, roomId: string) => {
  if (!rooms[roomId]) return;

  const userIds = Array.from(rooms[roomId].users);
  const users = await User.find({ _id: { $in: userIds } })
    .select("_id username avatar")
    .sort({ username: 1 });

  // Update all clients about the room's user count
  io.emit("roomUserCount", { roomId, count: userIds.length });

  // Update users in the room about the detailed user list
  io.to(roomId).emit("roomUsersUpdate", { users });
};

const getAllRoomCounts = async (): Promise<Record<string, number>> => {
  const counts: Record<string, number> = {};
  const publicRooms = (await Room.find({ visibility: "public" }).select(
    "_id"
  )) as { _id: Types.ObjectId }[];

  publicRooms.forEach((room) => {
    const roomId = room._id.toString();
    counts[roomId] = getRoomUserCount(roomId);
  });

  return counts;
};

const broadcastAllRoomCounts = async (io: Server) => {
  const counts = await getAllRoomCounts();
  io.emit("allRoomCounts", counts);
};

// Inactivity management functions
const updateUserActivity = (
  userId: string,
  io: Server,
  action: string = "unknown"
) => {
  // // console.log(
  // //   `[DEBUG] 🚀 updateUserActivity CALLED for ${userId} with action: ${action}`
  // );
  // console.log(
  //   `[Inactivity] User ${userId} activity: ${action} at ${new Date().toISOString()}`
  // );
  userActivity[userId] = Date.now();

  // Clear existing timers
  if (warningTimers[userId]) {
    // console.log(
    //   `[Inactivity] Clearing existing warning timer for user ${userId}`
    // );
    clearTimeout(warningTimers[userId]);
    delete warningTimers[userId];
  }
  if (disconnectTimers[userId]) {
    // console.log(
    //   `[Inactivity] Clearing existing disconnect timer for user ${userId}`
    // );
    clearTimeout(disconnectTimers[userId]);
    delete disconnectTimers[userId];
  }

  // Set warning timer (warn before disconnect)
  // console.log(
  //   `[Inactivity] Setting warning timer for user ${userId} - will warn in ${
  //     (INACTIVITY_TIMEOUT - WARNING_TIME) / 1000
  //   }s`
  // );
  warningTimers[userId] = setTimeout(() => {
    //console.log(`[Inactivity] ⚠️  WARNING TIMER FIRED for user ${userId}`);
    const userSocketIds = Array.from(userSockets[userId] || []);
    // console.log(
    //   `[Inactivity] Sending warning to user ${userId}, sockets: ${userSocketIds.length}`
    // );
    userSocketIds.forEach((socketId) => {
      io.to(socketId).emit("inactivityWarning", {
        message: "You will be disconnected due to inactivity",
        timeLeft: WARNING_TIME,
      });
    });
    // console.log(`[Socket] Inactivity warning sent to user: ${userId}`);
  }, INACTIVITY_TIMEOUT - WARNING_TIME);

  // Set disconnect timer
  // console.log(
  //   `[Inactivity] Setting disconnect timer for user ${userId} - will disconnect in ${
  //     INACTIVITY_TIMEOUT / 1000
  //   }s`
  // );
  disconnectTimers[userId] = setTimeout(() => {
    //console.log(`[Inactivity] 🔥 DISCONNECT TIMER FIRED for user ${userId}`);
    const userSocketIds = Array.from(userSockets[userId] || []);
    // console.log(
    //   `[Inactivity] Forcibly disconnecting user ${userId}, sockets: ${userSocketIds.length}`
    // );
    userSocketIds.forEach((socketId) => {
      io.to(socketId).emit("inactivityDisconnect", {
        message: "Disconnected due to inactivity",
      });
      io.sockets.sockets.get(socketId)?.disconnect(true);
    });
    // console.log(`[Socket] User disconnected due to inactivity: ${userId}`);

    // Clean up
    delete userActivity[userId];
    delete warningTimers[userId];
    delete disconnectTimers[userId];
  }, INACTIVITY_TIMEOUT);
};

const cleanupUserTimers = (userId: string) => {
  if (warningTimers[userId]) {
    clearTimeout(warningTimers[userId]);
    delete warningTimers[userId];
  }
  if (disconnectTimers[userId]) {
    clearTimeout(disconnectTimers[userId]);
    delete disconnectTimers[userId];
  }
  delete userActivity[userId];
};

// Helper function to get user's friends
const getUserFriends = async (userId: string): Promise<string[]> => {
  try {
    const friendships = await Friendship.find({
      $or: [{ user1: userId }, { user2: userId }],
    });

    return friendships.map((friendship) => {
      return friendship.user1.toString() === userId
        ? friendship.user2.toString()
        : friendship.user1.toString();
    });
  } catch (error) {
    console.error("Error getting user friends:", error);
    return [];
  }
};

// Helper function to broadcast to user's friends
const broadcastToFriends = async (
  io: Server,
  userId: string,
  event: string,
  data: any
) => {
  try {
    const friends = await getUserFriends(userId);
    friends.forEach((friendId) => {
      const friendSockets = Array.from(userSockets[friendId] || []);
      friendSockets.forEach((socketId) => {
        io.to(socketId).emit(event, data);
      });
    });
  } catch (error) {
    console.error("Error broadcasting to friends:", error);
  }
};

// Helper function to send notification
const sendNotificationToUser = (
  io: Server,
  userId: string,
  notification: any
) => {
  const userSocketList = Array.from(userSockets[userId] || []);
  userSocketList.forEach((socketId) => {
    io.to(socketId).emit("newNotification", notification);
  });
};

export const setupSocket = (io: Server) => {
  // Add periodic debugging to check timer status
  // setInterval(() => {
  //   console.log(`[DEBUG] Timer Status Check:`, {
  //     activeUsers: Object.keys(userSockets).length,
  //     warningTimers: Object.keys(warningTimers).length,
  //     disconnectTimers: Object.keys(disconnectTimers).length,
  //     userActivity: Object.keys(userActivity).length,
  //   });

  //   // Show remaining time for each user
  //   Object.keys(userActivity).forEach((userId) => {
  //     const lastActivity = userActivity[userId];
  //     const timeSinceActivity = Date.now() - lastActivity;
  //     const timeUntilWarning =
  //       INACTIVITY_TIMEOUT - WARNING_TIME - timeSinceActivity;
  //     const timeUntilDisconnect = INACTIVITY_TIMEOUT - timeSinceActivity;

  //     console.log(
  //    //  `[DEBUG] User ${userId}: ${timeSinceActivity}ms since activity, ${timeUntilWarning}ms until warning, ${timeUntilDisconnect}ms until disconnect`
  //     );
  //   });
  // }, 5000); // Every 5 seconds

  io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie || "";
    const cookies = cookie.parse(rawCookie);
    const token = cookies.token;

    if (!token) return next(new Error("No token provided"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      const userId = decoded.id.toString();
      socket.data.userId = decoded.id;
      socketToUser[socket.id] = userId;

      if (!userSockets[userId]) {
        userSockets[userId] = new Set();
      }
      userSockets[userId].add(socket.id);

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);
    const userId = socketToUser[socket.id];
    if (!userId) {
      console.log(`[Socket] ERROR: No userId found for socket ${socket.id}`);
      return;
    }

    console.log(`[Socket] User ${userId} connected with socket ${socket.id}`);

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);
    console.log(`[Socket] User ${userId} joined room: user:${userId}`);

    // Initialize user activity tracking - this starts the inactivity timer
    updateUserActivity(userId, io, "connection");

    // Send initial room counts to the newly connected user
    getAllRoomCounts().then((counts) => {
      console.log(`[Socket] Sending initial room counts to user ${userId}`);
      socket.emit("allRoomCounts", counts);
    });

    // Add user to online users set and broadcast status to friends
    onlineUsers.add(userId);
    broadcastToFriends(io, userId, "friendOnlineStatusUpdate", {
      userId,
      isOnline: true,
    });

    // Friend system event handlers
    socket.on("sendFriendRequest", async ({ recipientId }) => {
      updateUserActivity(userId, io, "sendFriendRequest");
      try {
        if (!recipientId || recipientId === userId) return;

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
          $or: [
            { sender: userId, recipient: recipientId },
            { sender: recipientId, recipient: userId },
          ],
        });

        if (existingRequest) {
          socket.emit("friendRequestError", {
            message: "Friend request already exists",
          });
          return;
        }

        // Check if already friends
        const existingFriendship = await Friendship.findOne({
          $or: [
            { user1: userId, user2: recipientId },
            { user1: recipientId, user2: userId },
          ],
        });

        if (existingFriendship) {
          socket.emit("friendRequestError", { message: "Already friends" });
          return;
        }

        // Create friend request
        const friendRequest = await FriendRequest.create({
          sender: userId,
          recipient: recipientId,
        });

        const populated = await friendRequest.populate([
          { path: "sender", select: "username avatar" },
          { path: "recipient", select: "username avatar" },
        ]);

        // Create notification for recipient
        const notification = await Notification.create({
          recipient: recipientId,
          type: "friend_request",
          title: "New Friend Request",
          message: `${
            (populated.sender as any).username
          } sent you a friend request`,
          data: {
            friendRequestId: friendRequest._id,
            requesterId: userId,
            requesterUsername: (populated.sender as any).username,
            requesterAvatar: (populated.sender as any).avatar,
          },
        });

        // Send real-time updates
        const recipientSockets = Array.from(userSockets[recipientId] || []);
        recipientSockets.forEach((socketId) => {
          io.to(socketId).emit("newFriendRequest", populated);
        });

        // Send notification
        sendNotificationToUser(io, recipientId, notification);

        // Confirm to sender
        socket.emit("friendRequestSent", { recipientId });

        console.log(
          `[FriendRequest] Request sent from ${userId} to ${recipientId}`
        );
      } catch (error) {
        console.error("[Socket] Error in sendFriendRequest:", error);
        socket.emit("friendRequestError", {
          message: "Failed to send friend request",
        });
      }
    });

    socket.on("acceptFriendRequest", async ({ requestId }) => {
      updateUserActivity(userId, io, "acceptFriendRequest");
      try {
        if (!requestId) return;

        const friendRequest = await FriendRequest.findById(requestId).populate([
          { path: "sender", select: "username avatar" },
          { path: "recipient", select: "username avatar" },
        ]);

        if (
          !friendRequest ||
          (friendRequest.recipient as any)._id.toString() !== userId
        ) {
          socket.emit("friendRequestError", {
            message: "Invalid friend request",
          });
          return;
        }

        if (friendRequest.status !== "pending") {
          socket.emit("friendRequestError", {
            message: "Friend request already processed",
          });
          return;
        }

        // Update request status
        friendRequest.status = "accepted";
        await friendRequest.save();

        // Create friendship
        const friendship = await Friendship.create({
          user1: (friendRequest.sender as any)._id,
          user2: (friendRequest.recipient as any)._id,
        });

        // Create notification for requester
        const notification = await Notification.create({
          recipient: (friendRequest.sender as any)._id,
          type: "friend_accepted",
          title: "Friend Request Accepted",
          message: `${
            (friendRequest.recipient as any).username
          } accepted your friend request`,
          data: {
            friendshipId: friendship._id,
            friendId: userId,
            friendUsername: (friendRequest.recipient as any).username,
            friendAvatar: (friendRequest.recipient as any).avatar,
          },
        });

        // Send real-time updates
        const requesterSockets = Array.from(
          userSockets[(friendRequest.sender as any)._id.toString()] || []
        );
        const recipientSockets = Array.from(userSockets[userId] || []);

        [...requesterSockets, ...recipientSockets].forEach((socketId) => {
          io.to(socketId).emit("friendRequestAccepted", {
            requestId,
            friendship,
            requester: friendRequest.sender,
            recipient: friendRequest.recipient,
          });
        });

        // Send notification to requester
        sendNotificationToUser(
          io,
          (friendRequest.sender as any)._id.toString(),
          notification
        );

        console.log(
          `[FriendRequest] Request ${requestId} accepted by ${userId}`
        );
      } catch (error) {
        console.error("[Socket] Error in acceptFriendRequest:", error);
        socket.emit("friendRequestError", {
          message: "Failed to accept friend request",
        });
      }
    });

    socket.on("rejectFriendRequest", async ({ requestId }) => {
      updateUserActivity(userId, io, "rejectFriendRequest");
      try {
        if (!requestId) return;

        const friendRequest = await FriendRequest.findById(requestId).populate([
          { path: "sender", select: "username avatar" },
          { path: "recipient", select: "username avatar" },
        ]);

        if (
          !friendRequest ||
          (friendRequest.recipient as any)._id.toString() !== userId
        ) {
          socket.emit("friendRequestError", {
            message: "Invalid friend request",
          });
          return;
        }

        if (friendRequest.status !== "pending") {
          socket.emit("friendRequestError", {
            message: "Friend request already processed",
          });
          return;
        }

        // Update request status
        friendRequest.status = "rejected";
        await friendRequest.save();

        // Send real-time updates
        const requesterSockets = Array.from(
          userSockets[(friendRequest.sender as any)._id.toString()] || []
        );
        const recipientSockets = Array.from(userSockets[userId] || []);

        [...requesterSockets, ...recipientSockets].forEach((socketId) => {
          io.to(socketId).emit("friendRequestRejected", {
            requestId,
            requester: friendRequest.sender,
            recipient: friendRequest.recipient,
          });
        });

        console.log(
          `[FriendRequest] Request ${requestId} rejected by ${userId}`
        );
      } catch (error) {
        console.error("[Socket] Error in rejectFriendRequest:", error);
        socket.emit("friendRequestError", {
          message: "Failed to reject friend request",
        });
      }
    });

    socket.on("endFriendship", async ({ friendshipId, friendId }) => {
      updateUserActivity(userId, io, "endFriendship");
      try {
        if (!friendshipId || !friendId) return;

        const friendship = await Friendship.findById(friendshipId);
        if (!friendship) {
          socket.emit("friendshipError", { message: "Friendship not found" });
          return;
        }

        // Verify user is part of this friendship
        const isParticipant =
          friendship.user1.toString() === userId ||
          friendship.user2.toString() === userId;
        if (!isParticipant) {
          socket.emit("friendshipError", {
            message: "Not authorized to end this friendship",
          });
          return;
        }

        // Delete the friendship
        await Friendship.findByIdAndDelete(friendshipId);

        // Send real-time updates to both users
        const user1Sockets = Array.from(
          userSockets[friendship.user1.toString()] || []
        );
        const user2Sockets = Array.from(
          userSockets[friendship.user2.toString()] || []
        );

        [...user1Sockets, ...user2Sockets].forEach((socketId) => {
          io.to(socketId).emit("friendshipEnded", {
            friendshipId,
            endedBy: userId,
          });
        });

        console.log(
          `[Friendship] Friendship ${friendshipId} ended by ${userId}`
        );
      } catch (error) {
        console.error("[Socket] Error in endFriendship:", error);
        socket.emit("friendshipError", { message: "Failed to end friendship" });
      }
    });

    // Notification event handlers
    socket.on("markNotificationAsRead", async ({ notificationId }) => {
      try {
        if (!notificationId) return;

        const notification = await Notification.findById(notificationId);
        if (
          !notification ||
          (notification.recipient as any).toString() !== userId
        ) {
          return;
        }

        notification.read = true;
        await notification.save();

        socket.emit("notificationMarkedAsRead", { notificationId });
        console.log(
          `[Notification] Marked as read: ${notificationId} by ${userId}`
        );
      } catch (error) {
        console.error("[Socket] Error in markNotificationAsRead:", error);
      }
    });

    socket.on("markAllNotificationsAsRead", async () => {
      try {
        await Notification.updateMany(
          { recipient: userId, read: false },
          { read: true }
        );

        socket.emit("allNotificationsMarkedAsRead");
        console.log(
          `[Notification] All notifications marked as read by ${userId}`
        );
      } catch (error) {
        console.error("[Socket] Error in markAllNotificationsAsRead:", error);
      }
    });

    socket.on("deleteNotification", async ({ notificationId }) => {
      try {
        if (!notificationId) return;

        const notification = await Notification.findById(notificationId);
        if (
          !notification ||
          (notification.recipient as any).toString() !== userId
        ) {
          return;
        }

        await Notification.findByIdAndDelete(notificationId);
        socket.emit("notificationDeleted", { notificationId });
        console.log(`[Notification] Deleted: ${notificationId} by ${userId}`);
      } catch (error) {
        console.error("[Socket] Error in deleteNotification:", error);
      }
    });

    // Get online friends status
    socket.on("getOnlineFriends", async (callback) => {
      try {
        const friends = await getUserFriends(userId);
        const onlineFriends = friends.filter((friendId) =>
          onlineUsers.has(friendId)
        );

        const onlineFriendsData = await User.find({
          _id: { $in: onlineFriends },
        }).select("_id username avatar");

        callback({ onlineFriends: onlineFriendsData });
      } catch (error) {
        console.error("[Socket] Error in getOnlineFriends:", error);
        callback({ onlineFriends: [] });
      }
    });

    socket.on("joinRoom", async (roomId: string) => {
      updateUserActivity(userId, io, "joinRoom"); // Track meaningful activity
      try {
        // Check if room exists and user has permission
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // For private and secret rooms, user must have already joined via API
        // We cannot validate passwords here as they are not stored in socket session
        // So we rely on the HTTP API join endpoints for authentication
        if (room.visibility !== "public") {
          // For non-public rooms, we could add additional checks here
          // For now, we allow socket connection if they reach this point
          console.log(
            `[Socket] User ${userId} joining ${room.visibility} room ${roomId}`
          );
        }

        // Initialize room data if needed
        if (!rooms[roomId]) {
          rooms[roomId] = {
            users: new Set(),
            sockets: new Set(),
            lastUpdate: Date.now(),
          };
        }

        // Add user and socket to room
        rooms[roomId].users.add(userId);
        rooms[roomId].sockets.add(socket.id);
        rooms[roomId].lastUpdate = Date.now();

        // Join the Socket.IO room
        socket.join(roomId);

        // Update all clients
        await updateRoomData(io, roomId);
        await broadcastAllRoomCounts(io);
      } catch (error) {
        console.error("[Socket] Error in joinRoom:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("leaveRoom", async (roomId: string) => {
      updateUserActivity(userId, io, "leaveRoom"); // Track meaningful activity
      try {
        if (!rooms[roomId]) return;

        // Remove socket from room
        rooms[roomId].sockets.delete(socket.id);

        // Only remove user if they have no more sockets in the room
        const hasOtherSocketsInRoom = Array.from(
          userSockets[userId] || []
        ).some((socketId) => rooms[roomId].sockets.has(socketId));

        if (!hasOtherSocketsInRoom) {
          rooms[roomId].users.delete(userId);
        }

        // Clean up empty rooms
        if (rooms[roomId].users.size === 0) {
          delete rooms[roomId];
        } else {
          rooms[roomId].lastUpdate = Date.now();
        }

        socket.leave(roomId);

        // Update all clients
        await updateRoomData(io, roomId);
        await broadcastAllRoomCounts(io);
      } catch (error) {
        console.error("[Socket] Error in leaveRoom:", error);
      }
    });

    socket.on("getRoomUsers", async (roomId: string, callback) => {
      // Don't track this as meaningful activity - just a data request
      try {
        if (!rooms[roomId]) {
          callback({ users: [] });
          return;
        }

        const userIds = Array.from(rooms[roomId].users);
        const users = await User.find({ _id: { $in: userIds } })
          .select("_id username avatar")
          .sort({ username: 1 });

        callback({ users });
      } catch (error) {
        console.error("[Socket] Error in getRoomUsers:", error);
        callback({ users: [] });
      }
    });

    socket.on("getPublicRoomsUserCounts", async (callback) => {
      // Don't track this as meaningful activity - just a data request
      try {
        const counts = await getAllRoomCounts();
        callback(counts);
      } catch (error) {
        console.error("[Socket] Error in getPublicRoomsUserCounts:", error);
        callback({});
      }
    });

    // Note: We intentionally DO NOT handle "userActivity" events from frontend
    // because mouse movements, clicks, etc. should NOT reset the inactivity timer
    // Only meaningful actions like joining rooms, sending messages should reset it

    socket.on("disconnect", async () => {
      try {
        const userId = socketToUser[socket.id];
        if (!userId) return;
        console.log(
          `[Socket] User disconnected: ${userId}, socket: ${socket.id}`
        );

        // Clean up user timers if this is the last socket for this user
        if (userSockets[userId] && userSockets[userId].size === 1) {
          cleanupUserTimers(userId);
          // Remove from online users and notify friends
          onlineUsers.delete(userId);
          broadcastToFriends(io, userId, "friendOnlineStatusUpdate", {
            userId,
            isOnline: false,
          });
        }

        // Clean up user sockets tracking
        if (userSockets[userId]) {
          userSockets[userId].delete(socket.id);
          if (userSockets[userId].size === 0) {
            delete userSockets[userId];
          }
        }

        // Clean up all rooms this socket was in
        for (const [roomId, room] of Object.entries(rooms)) {
          if (room.sockets.has(socket.id)) {
            room.sockets.delete(socket.id);

            // Only remove user if they have no more sockets in the room
            const hasOtherSocketsInRoom = Array.from(
              userSockets[userId] || []
            ).some((socketId) => room.sockets.has(socketId));

            if (!hasOtherSocketsInRoom) {
              room.users.delete(userId);
            }

            // Clean up empty rooms
            if (room.users.size === 0) {
              delete rooms[roomId];
            } else {
              room.lastUpdate = Date.now();
              await updateRoomData(io, roomId);
            }
          }
        }

        delete socketToUser[socket.id];
        await broadcastAllRoomCounts(io);
      } catch (error) {
        console.error("[Socket] Error in disconnect:", error);
      }
    });

    // Handle messages
    socket.on("sendMessage", async ({ roomId, message, imageUrl }) => {
      updateUserActivity(userId, io, "sendMessage"); // Track meaningful activity
      try {
        if ((!message?.trim() && !imageUrl) || !rooms[roomId]) return;

        const room = await Room.findById(roomId);
        if (!room) return;

        const msg = await Message.create({
          room: roomId,
          sender: userId,
          content: message,
          imageUrl,
        });

        const populated = await msg.populate("sender", "username avatar");
        io.to(roomId).emit("newMessage", populated);
      } catch (error) {
        console.error("[Socket] Error in sendMessage:", error);
      }
    });

    // Handle user activity (for "Stay Connected" button)
    socket.on("userActivity", () => {
      updateUserActivity(userId, io, "userActivity"); // Reset inactivity timer
      console.log(
        `[Inactivity] User ${userId} requested session extension via userActivity event`
      );
    });

    // Handle direct messages
    socket.on(
      "sendDirectMessage",
      async ({ recipientId, message, imageUrl }) => {
        updateUserActivity(userId, io, "sendDirectMessage"); // Track meaningful activity
        try {
          if ((!message?.trim() && !imageUrl) || !recipientId) return;

          // Verify recipient exists and is a friend
          const recipient = await User.findById(recipientId);
          if (!recipient) return;

          // Check if users are friends
          const friendship = await Friendship.findOne({
            $or: [
              { user1: userId, user2: recipientId },
              { user1: recipientId, user2: userId },
            ],
          });

          if (!friendship) {
            socket.emit("directMessageError", {
              message: "Can only send direct messages to friends",
            });
            return;
          }

          // Create direct message
          const dm = await DirectMessage.create({
            sender: userId,
            recipient: recipientId,
            content: message,
            imageUrl,
          });

          const populated = await dm.populate([
            { path: "sender", select: "username avatar" },
            { path: "recipient", select: "username avatar" },
          ]);

          // Send to both sender and recipient if they're online
          const senderSockets = Array.from(userSockets[userId] || []);
          const recipientSockets = Array.from(userSockets[recipientId] || []);

          [...senderSockets, ...recipientSockets].forEach((socketId) => {
            io.to(socketId).emit("newDirectMessage", populated);
          });

          console.log(
            `[DirectMessage] Message sent from ${userId} to ${recipientId}`
          );
        } catch (error) {
          console.error("[Socket] Error in sendDirectMessage:", error);
        }
      }
    );
  });
};
