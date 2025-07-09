import { Server } from "socket.io";
import DirectMessage from "../models/DirectMessage";
import User from "../models/User";
import Notification from "../models/Notification";
import { sendNotificationToUser } from "./notifications.socket";
import { updateUserActivity } from "./inactivity.socket";

interface SendDirectMessagePayload {
  receiverId: string;
  content?: string;
  imageUrl?: string;
}

export const registerDirectMessageEvents = (
  socket: any,
  io: Server,
  userId: string,
  userSockets: Record<string, Set<string>>
) => {
  socket.on(
    "sendDirectMessage",
    async ({ receiverId, content, imageUrl }: SendDirectMessagePayload) => {
      updateUserActivity(userId, io, userSockets, "sendDirectMessage");

      try {
        if ((!content?.trim() && !imageUrl) || !receiverId) {
          return;
        }

        const directMessage = await DirectMessage.create({
          sender: userId,
          recipient: receiverId,
          content: content || "",
          imageUrl,
        });

        const populated = await directMessage.populate([
          { path: "sender", select: "username avatar" },
          { path: "recipient", select: "username avatar" },
        ]);

        // Send to sender
        const senderSockets = Array.from(userSockets[userId] || []);
        senderSockets.forEach((socketId) => {
          io.to(socketId).emit("newDirectMessage", populated);
        });

        // Send to receiver
        const receiverSockets = Array.from(userSockets[receiverId] || []);
        receiverSockets.forEach((socketId) => {
          io.to(socketId).emit("newDirectMessage", populated);
        });

        // Create notification for receiver if they're not online
        if (receiverSockets.length === 0) {
          const sender = await User.findById(userId).select("username avatar");
          if (sender) {
            const notification = await Notification.create({
              recipient: receiverId,
              type: "direct_message",
              title: "New Message",
              message: `${sender.username} sent you a message`,
              data: {
                senderId: userId,
                senderUsername: sender.username,
                senderAvatar: sender.avatar,
                messageId: directMessage._id,
              },
            });

            sendNotificationToUser(io, receiverId, notification, userSockets);
          }
        }
      } catch (error) {
        console.error("[Socket] Error in sendDirectMessage:", error);
      }
    }
  );

  socket.on(
    "markDirectMessageAsRead",
    async ({ messageId }: { messageId: string }) => {
      try {
        if (!messageId) return;

        const message = await DirectMessage.findById(messageId);
        if (!message || message.recipient.toString() !== userId) {
          return;
        }

        message.readAt = new Date();
        await message.save();

        // Notify sender that message was read
        const senderSockets = Array.from(
          userSockets[message.sender.toString()] || []
        );
        senderSockets.forEach((socketId) => {
          io.to(socketId).emit("directMessageRead", {
            messageId,
            readAt: message.readAt,
            readBy: userId,
          });
        });

        // Emit to all user's sockets that DMs were read
        const userSocketsList = Array.from(userSockets[userId] || []);
        userSocketsList.forEach((socketId) => {
          io.to(socketId).emit("directMessagesRead", {
            senderId: message.sender.toString(),
            readAt: message.readAt,
          });
        });
      } catch (error) {
        console.error("[Socket] Error in markDirectMessageAsRead:", error);
      }
    }
  );

  socket.on(
    "markAllDirectMessagesAsRead",
    async ({ senderId }: { senderId: string }) => {
      try {
        if (!senderId) return;

        await DirectMessage.updateMany(
          { sender: senderId, recipient: userId, readAt: null },
          { readAt: new Date() }
        );

        // Notify sender that all messages were read
        const senderSockets = Array.from(userSockets[senderId] || []);
        const readAt = new Date();
        senderSockets.forEach((socketId) => {
          io.to(socketId).emit("allDirectMessagesRead", {
            readerId: userId,
            readAt,
          });
        });

        // Emit to all user's sockets that DMs were read
        const userSocketsList = Array.from(userSockets[userId] || []);
        userSocketsList.forEach((socketId) => {
          io.to(socketId).emit("directMessagesRead", {
            senderId,
            readAt,
          });
        });
      } catch (error) {
        console.error("[Socket] Error in markAllDirectMessagesAsRead:", error);
      }
    }
  );
};
