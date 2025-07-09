"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupUserTimers = exports.updateUserActivity = void 0;
// Configurable timeouts (in milliseconds)
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour
const WARNING_TIME = 30 * 60 * 1000; // 30 min before disconnect
// Internal state
const userActivity = {};
const warningTimers = {};
const disconnectTimers = {};
// Update activity and reset timers
const updateUserActivity = (userId, io, userSockets, action = "unknown") => {
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
exports.updateUserActivity = updateUserActivity;
// Cleanup on final disconnect
const cleanupUserTimers = (userId) => {
    clearTimers(userId);
    delete userActivity[userId];
};
exports.cleanupUserTimers = cleanupUserTimers;
// Internal helper
const clearTimers = (userId) => {
    if (warningTimers[userId]) {
        clearTimeout(warningTimers[userId]);
        delete warningTimers[userId];
    }
    if (disconnectTimers[userId]) {
        clearTimeout(disconnectTimers[userId]);
        delete disconnectTimers[userId];
    }
};
