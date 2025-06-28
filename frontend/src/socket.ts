import { io, Socket } from "socket.io-client";

interface ServerToClientEvents {
  receiveMessage: (message: any) => void;
}

interface ClientToServerEvents {
  sendMessage: (payload: { roomId: string; message: any }) => void;
  joinRoom: (roomId: string) => void;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:5001",
  {
    withCredentials: true,
    autoConnect: false, // connect manually
  }
);
