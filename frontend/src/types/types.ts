// filepath: d:\GoMyCode\00- Project\ChatApp v2\frontend\src\types.ts
export interface User {
  _id: string;
  username: string;
  avatar: string;
}

export interface Room {
  _id: string;
  name: string;
  visibility: "public" | "private" | "secret";
  createdBy: User;
  createdAt: string;
}

export interface CreateRoomData {
  name: string;
  visibility: "public" | "private" | "secret";
}

export interface Message {
  _id: string;
  content: string;
  sender: User;
  room: string; // Room ID
  createdAt: string;
}
