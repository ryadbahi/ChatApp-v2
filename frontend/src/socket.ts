// socket.ts (frontend)
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "./types/socket";

// Get token from cookies
const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:5001",
  {
    auth: {
      token: getToken(),
    },
    withCredentials: true,
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  }
);

// Handle reconnection
socket.on("connect_error", (error) => {
  console.error("[Socket] Connection error:", error.message);
});

socket.on("connect", () => {
  console.log("[Socket] Connected");
  // Update auth token on reconnect
  socket.auth = { token: getToken() };
});

socket.on("disconnect", (reason) => {
  console.log("[Socket] Disconnected:", reason);
});
