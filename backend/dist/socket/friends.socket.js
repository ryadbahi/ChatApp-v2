"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFriendEvents = void 0;
const FriendRequest_1 = __importDefault(require("../models/FriendRequest"));
const Friendship_1 = __importDefault(require("../models/Friendship"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const notifications_socket_1 = require("./notifications.socket");
const utils_socket_1 = require("./utils.socket");
// Registers all friend-related handlers
const registerFriendEvents = (socket, io, userId, userSockets) => {
    // Handler for getting online friends
    socket.on("getOnlineFriends", async (callback) => {
        try {
            const friends = await (0, utils_socket_1.getUserFriends)(userId);
            const onlineUsers = await User_1.default.find({
                _id: { $in: friends },
            }).select("_id username avatar");
            // Filter only those who have active sockets
            const onlineFriends = onlineUsers.filter((user) => userSockets[user._id.toString()] &&
                userSockets[user._id.toString()].size > 0);
            if (typeof callback === "function") {
                callback({ onlineFriends });
            }
        }
        catch (error) {
            console.error("Error getting online friends:", error);
            if (typeof callback === "function") {
                callback({ onlineFriends: [] });
            }
        }
    });
    socket.on("sendFriendRequest", async ({ recipientId }) => {
        try {
            if (!recipientId || recipientId === userId)
                return;
            const existingRequest = await FriendRequest_1.default.findOne({
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
            const existingFriendship = await Friendship_1.default.findOne({
                $or: [
                    { user1: userId, user2: recipientId },
                    { user1: recipientId, user2: userId },
                ],
            });
            if (existingFriendship) {
                socket.emit("friendRequestError", { message: "Already friends" });
                return;
            }
            const friendRequest = await FriendRequest_1.default.create({
                sender: userId,
                recipient: recipientId,
            });
            const populated = await friendRequest.populate([
                { path: "sender", select: "username avatar" },
                { path: "recipient", select: "username avatar" },
            ]);
            const notification = await Notification_1.default.create({
                recipient: recipientId,
                type: "friend_request",
                title: "New Friend Request",
                message: `${populated.sender.username} sent you a friend request`,
                data: {
                    friendRequestId: friendRequest._id,
                    requesterId: userId,
                    requesterUsername: populated.sender.username,
                    requesterAvatar: populated.sender.avatar,
                },
            });
            const recipientSockets = Array.from(userSockets[recipientId] || []);
            recipientSockets.forEach((socketId) => {
                io.to(socketId).emit("newFriendRequest", populated);
            });
            (0, notifications_socket_1.sendNotificationToUser)(io, recipientId, notification, userSockets);
            socket.emit("friendRequestSent", { recipientId });
        }
        catch (err) {
            console.error("[Socket] sendFriendRequest error:", err);
            socket.emit("friendRequestError", {
                message: "Failed to send friend request",
            });
        }
    });
    socket.on("acceptFriendRequest", async ({ requestId }) => {
        try {
            const request = await FriendRequest_1.default.findById(requestId).populate([
                { path: "sender", select: "username avatar" },
                { path: "recipient", select: "username avatar" },
            ]);
            if (!request ||
                request.recipient._id.toString() !== userId ||
                request.status !== "pending") {
                socket.emit("friendRequestError", { message: "Invalid request" });
                return;
            }
            request.status = "accepted";
            await request.save();
            const friendship = await Friendship_1.default.create({
                user1: request.sender,
                user2: request.recipient,
            });
            const notification = await Notification_1.default.create({
                recipient: request.sender,
                type: "friend_accepted",
                title: "Friend Request Accepted",
                message: `${request.recipient.username} accepted your request`,
                data: {
                    friendshipId: friendship._id,
                    friendId: userId,
                    friendUsername: request.recipient.username,
                    friendAvatar: request.recipient.avatar,
                },
            });
            const requesterId = request.sender._id.toString();
            const senderSockets = Array.from(userSockets[requesterId] || []);
            const recipientSockets = Array.from(userSockets[userId] || []);
            [...senderSockets, ...recipientSockets].forEach((sid) => {
                io.to(sid).emit("friendRequestAccepted", {
                    requestId,
                    friendship,
                    requester: request.sender,
                    recipient: request.recipient,
                });
            });
            (0, notifications_socket_1.sendNotificationToUser)(io, requesterId, notification, userSockets);
        }
        catch (err) {
            console.error("[Socket] acceptFriendRequest error:", err);
            socket.emit("friendRequestError", {
                message: "Failed to accept request",
            });
        }
    });
    socket.on("rejectFriendRequest", async ({ requestId }) => {
        try {
            const request = await FriendRequest_1.default.findById(requestId);
            if (!request ||
                request.recipient.toString() !== userId ||
                request.status !== "pending") {
                socket.emit("friendRequestError", { message: "Invalid request" });
                return;
            }
            request.status = "rejected";
            await request.save();
            const senderSockets = Array.from(userSockets[request.sender.toString()] || []);
            senderSockets.forEach((sid) => {
                io.to(sid).emit("friendRequestRejected", {
                    requestId,
                    recipientId: userId,
                });
            });
        }
        catch (err) {
            console.error("[Socket] rejectFriendRequest error:", err);
            socket.emit("friendRequestError", {
                message: "Failed to reject request",
            });
        }
    });
    socket.on("endFriendship", async ({ friendshipId, friendId, }) => {
        try {
            const friendship = await Friendship_1.default.findById(friendshipId);
            if (!friendship ||
                (friendship.user1.toString() !== userId &&
                    friendship.user2.toString() !== userId)) {
                socket.emit("friendshipError", { message: "Not allowed" });
                return;
            }
            await Friendship_1.default.findByIdAndDelete(friendshipId);
            const user1Sockets = Array.from(userSockets[friendship.user1.toString()] || []);
            const user2Sockets = Array.from(userSockets[friendship.user2.toString()] || []);
            [...user1Sockets, ...user2Sockets].forEach((sid) => {
                io.to(sid).emit("friendshipEnded", {
                    friendshipId,
                    endedBy: userId,
                });
            });
        }
        catch (err) {
            console.error("[Socket] endFriendship error:", err);
            socket.emit("friendshipError", {
                message: "Failed to end friendship",
            });
        }
    });
};
exports.registerFriendEvents = registerFriendEvents;
