import { Server } from "socket.io";
import Notification from "../models/Notification";

export const sendNotificationToUser = (
  io: Server,
  userId: string,
  notification: any,
  userSockets: Record<string, Set<string>>
) => {
  const sockets = Array.from(userSockets[userId] || []);
  sockets.forEach((socketId) => {
    io.to(socketId).emit("newNotification", notification);
  });
};

export const registerNotificationEvents = (
  socket: any,
  io: Server,
  userId: string
) => {
  socket.on(
    "markNotificationAsRead",
    async ({ notificationId }: { notificationId: string }) => {
      try {
        if (!notificationId) return;

        const notif = await Notification.findById(notificationId);
        if (!notif || (notif.recipient as any).toString() !== userId) {
          return;
        }

        notif.read = true;
        await notif.save();

        socket.emit("notificationMarkedAsRead", { notificationId });
      } catch (error) {
        console.error("[Socket] Error in markNotificationAsRead:", error);
      }
    }
  );

  socket.on("markAllNotificationsAsRead", async () => {
    try {
      await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true }
      );

      socket.emit("allNotificationsMarkedAsRead");
    } catch (error) {
      console.error("[Socket] Error in markAllNotificationsAsRead:", error);
    }
  });

  socket.on(
    "deleteNotification",
    async ({ notificationId }: { notificationId: string }) => {
      try {
        if (!notificationId) return;

        const notif = await Notification.findById(notificationId);
        if (!notif || (notif.recipient as any).toString() !== userId) {
          return;
        }

        await Notification.findByIdAndDelete(notificationId);
        socket.emit("notificationDeleted", { notificationId });
      } catch (error) {
        console.error("[Socket] Error in deleteNotification:", error);
      }
    }
  );
};
