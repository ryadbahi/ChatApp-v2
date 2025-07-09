export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface AuthSuccessResponse {
  user: AuthenticatedUser;
  token?: string; // optional if you're only sending it via cookies
}

export interface ErrorResponse {
  msg: string;
}

export type AuthResponse = AuthSuccessResponse | ErrorResponse;
