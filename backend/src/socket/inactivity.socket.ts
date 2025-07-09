import { Server } from "socket.io";

// Configurable timeouts (in milliseconds)
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour
const WARNING_TIME = 30 * 60 * 1000; // 30 min before disconnect

// Internal state
const userActivity: Record<string, number> = {};
const warningTimers: Record<string, NodeJS.Timeout> = {};
const disconnectTimers: Record<string, NodeJS.Timeout> = {};

// Update activity and reset timers
export const updateUserActivity = (
  userId: string,
  io: Server,
  userSockets: Record<string, Set<string>>,
  action = "unknown"
) => {
  userActivity[userId] = Date.now();

  clearTimers(userId);

  // Set warning timer
  warningTimers[userId] = setTimeout(() => {
    const sockets = Array.from(userSockets[userId] || []);
    sockets.forEach((socketId) => {
      io.to(socketId).emit("inactivityWarning", {
        message: "You will be disconnected due to inactivity",
        timeLeft: WARNING_TIME,
      });
    });
  }, INACTIVITY_TIMEOUT - WARNING_TIME);

  // Set disconnect timer
  disconnectTimers[userId] = setTimeout(() => {
    const sockets = Array.from(userSockets[userId] || []);
    sockets.forEach((socketId) => {
      io.to(socketId).emit("inactivityDisconnect", {
        message: "Disconnected due to inactivity",
      });
      io.sockets.sockets.get(socketId)?.disconnect(true);
    });

    // Clean up
    delete userActivity[userId];
    delete warningTimers[userId];
    delete disconnectTimers[userId];
  }, INACTIVITY_TIMEOUT);
};

// Cleanup on final disconnect
export const cleanupUserTimers = (userId: string) => {
  clearTimers(userId);
  delete userActivity[userId];
};

// Internal helper
const clearTimers = (userId: string) => {
  if (warningTimers[userId]) {
    clearTimeout(warningTimers[userId]);
    delete warningTimers[userId];
  }
  if (disconnectTimers[userId]) {
    clearTimeout(disconnectTimers[userId]);
    delete disconnectTimers[userId];
  }
};
