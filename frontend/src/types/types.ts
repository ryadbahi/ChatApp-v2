// filepath: d:\GoMyCode\00- Project\ChatApp v2\frontend\src\types.ts
export interface Room {
  _id: string;
  name: string;
  visibility: string;
  createdBy: { _id: string; username: string };
  createdAt: string;
}

export interface Message {
  _id: string;
  content: string;
  sender: { _id: string; username: string };
  createdAt: string;
}
