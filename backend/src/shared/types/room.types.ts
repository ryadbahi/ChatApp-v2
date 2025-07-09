export interface CreateRoomRequestBody {
  name: string;
  visibility?: "public" | "private" | "secret";
  password?: string;
}

export interface JoinRoomRequestBody {
  password?: string;
  name?: string; // nécessaire uniquement pour les rooms "secret"
}
