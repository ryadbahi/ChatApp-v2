// src/components/SocketTest.tsx
import { useEffect } from "react";
import { io } from "socket.io-client";

const SocketTest = () => {
  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    const socket = io(process.env.VITE_BACKEND_UR, {
      withCredentials: true,
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected!", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection failed:", err.message);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    // OPTIONAL: tester un envoi
    socket.emit("joinRoom", { roomId: "TEST_ROOM" });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-4 text-white">
      <h2>Socket Test Component</h2>
      <p>Open console to see connection status.</p>
    </div>
  );
};

export default SocketTest;
