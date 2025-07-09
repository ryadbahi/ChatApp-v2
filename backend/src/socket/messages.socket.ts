import { Server } from "socket.io";
import Message from "../models/Message";
import Room from "../models/Room";
import User from "../models/User";
import { updateUserActivity } from "./inactivity.socket";

interface SendMessagePayload {
  roomId: string;
  message: string;
  imageUrl?: string;
}

export const registerMessageEvents = (
  socket: any,
  io: Server,
  userId: string,
  userSockets: Record<string, Set<string>>
) => {
  socket.on(
    "sendMessage",
    async ({ roomId, message, imageUrl }: SendMessagePayload) => {
      updateUserActivity(userId, io, userSockets, "sendMessage");
      try {
        if ((!message?.trim() && !imageUrl) || !roomId) return;

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
    }
  );
};
