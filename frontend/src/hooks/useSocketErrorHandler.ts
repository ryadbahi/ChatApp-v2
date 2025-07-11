import { useEffect } from "react";
import { useToast } from "./useToast";

interface SocketError {
  message?: string;
  code?: string;
  type?: string;
}

export const useSocketErrorHandler = (socket: any) => {
  const { showError, showInfo } = useToast();

  useEffect(() => {
    if (!socket) return;

    const handleError = (error: SocketError) => {
      const message = error?.message || "Connection error occurred";
      const code = error?.code || "SOCKET_ERROR";

      // Log for debugging
      console.error("Socket Error:", {
        message,
        code,
        type: error?.type,
        timestamp: new Date().toISOString(),
      });

      // Show user-friendly error based on error type
      switch (code) {
        case "UNAUTHORIZED":
          showError("Authentication failed. Please log in again.");
          break;
        case "CONNECTION_LOST":
          showInfo("Connection lost. Attempting to reconnect...");
          break;
        case "ROOM_NOT_FOUND":
          showError("Room not found or has been deleted.");
          break;
        case "MESSAGE_FAILED":
          showError("Failed to send message. Please try again.");
          break;
        case "RATE_LIMITED":
          showError("You're sending messages too quickly. Please slow down.");
          break;
        default:
          showError(message);
      }
    };

    const handleConnect = () => {
      console.log("Socket connected");
    };

    const handleDisconnect = (reason: string) => {
      console.warn("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        showInfo("Connection lost. Please refresh the page.");
      }
    };

    const handleReconnect = () => {
      showInfo("Connection restored");
    };

    // Attach event listeners
    socket.on("error", handleError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect", handleReconnect);

    // Cleanup
    return () => {
      socket.off("error", handleError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect", handleReconnect);
    };
  }, [socket, showError, showInfo]);
};
