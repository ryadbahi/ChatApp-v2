// socket.ts (frontend)
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "./types/socket";

// Récupère le token dans les cookies (même méthode que ton backend)
const token = document.cookie
  .split("; ")
  .find((row) => row.startsWith("token="))
  ?.split("=")[1];

console.log("[socket.ts] Token fetched from cookie:", token);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:5001",
  {
    auth: {
      token, // 👈 C’est ce qui doit apparaître dans socket.handshake.auth
    },
    withCredentials: true,
    autoConnect: false,
  }
);
