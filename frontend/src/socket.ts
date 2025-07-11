// socket.ts (frontend)
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "./types/socket";

// Utility to clear token and redirect to login
export const logoutUser = () => {
  // Clear token from cookies
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Clear any localStorage items if you have them
  localStorage.clear();

  // Redirect to login page
  window.location.href = "/login";
};

// Get token from cookies
const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:5001",
  {
    auth: {
      token: getToken(),
    },
    withCredentials: true,
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  }
);

// Handle reconnection
socket.on("connect_error", () => {
  // Connection error occurred
});

socket.on("connect", () => {
  // Update auth token on reconnect
  socket.auth = { token: getToken() };
});

socket.on("disconnect", () => {
  // Socket disconnected
});

// DISABLED: Activity tracking functions no longer used
/*
// Activity tracking
let activityTimer: number | null = null;

const sendActivity = () => {
  if (socket.connected) {
    socket.emit("userActivity");
  }
};

// Throttled activity tracking function
const trackActivity = () => {
  if (activityTimer) {
    clearTimeout(activityTimer);
  }

  activityTimer = window.setTimeout(() => {
    sendActivity();
  }, 1000); // Send activity event at most once per second
};
*/

// DISABLED: We don't want mouse movements/clicks to reset inactivity timer
// Only meaningful actions (join room, send message) should reset the timer
/*
// Add event listeners for user activity
const activityEvents = [
  "mousedown",
  "mousemove", 
  "keypress",
  "scroll",
  "touchstart",
  "click",
];
activityEvents.forEach((event) => {
  document.addEventListener(event, trackActivity, true);
});
*/
