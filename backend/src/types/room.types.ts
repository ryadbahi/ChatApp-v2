export interface CreateRoomRequestBody {
  name: string;
  isPrivate?: boolean;
  password?: string;
}

export interface JoinRoomRequestBody {
  password?: string;
}
