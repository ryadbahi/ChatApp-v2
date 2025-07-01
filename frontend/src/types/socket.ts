export interface ServerToClientEvents {
  newMessage: (msg: any) => void;
  // add other events as needed
}

export interface ClientToServerEvents {
  sendMessage: (payload: { roomId: string; message: string }) => void;
  joinRoom: (roomId: string) => void;
  // add other events as needed
}
