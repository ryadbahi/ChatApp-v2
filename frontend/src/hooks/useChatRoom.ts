import { useEffect, useCallback } from "react";
import { socket } from "../socket";

export function useChatRoom(
  roomId: string | undefined,
  onNewMessage: (msg: any) => void
) {
  useEffect(() => {
    if (!roomId) return;

    if (!socket.connected) {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      socket.auth = { token };
      socket.connect();
    }

    socket.emit("joinRoom", roomId);
    socket.on("newMessage", onNewMessage);

    return () => {
      socket.off("newMessage", onNewMessage);
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!roomId || !socket.connected) return;
      socket.emit("sendMessage", { roomId, message });
    },
    [roomId]
  );

  return { sendMessage };
}
