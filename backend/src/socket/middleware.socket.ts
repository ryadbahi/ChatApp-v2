import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

// The same secret used to sign your JWTs
const JWT_SECRET = process.env.JWT_SECRET!;

// Registers the authentication middleware on the given socket.io instance
export const registerSocketAuthMiddleware = (
  io: Server,
  socketToUser: Record<string, string>,
  userSockets: Record<string, Set<string>>
) => {
  io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie || "";
    const cookies = cookie.parse(rawCookie);
    const token = cookies.token;

    if (!token) return next(new Error("No token provided"));

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const userId = decoded.id.toString();
      socket.data.userId = userId;
      socketToUser[socket.id] = userId;

      if (!userSockets[userId]) {
        userSockets[userId] = new Set();
      }
      userSockets[userId].add(socket.id);

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });
};
