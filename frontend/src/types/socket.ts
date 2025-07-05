import type { User } from "./types";

export interface ServerToClientEvents {
  newMessage: (msg: any) => void;
  roomUsersUpdate: (data: { users: User[] }) => void;
  roomUserCount: (data: { roomId: string; count: number }) => void;
  allRoomCounts: (counts: Record<string, number>) => void;
}

export interface ClientToServerEvents {
  sendMessage: (payload: { roomId: string; message: string }) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  getRoomUsers: (
    roomId: string,
    callback: (data: { users: User[] }) => void
  ) => void;
  getPublicRoomsUserCounts: (
    callback: (data: Record<string, number>) => void
  ) => void;
}
