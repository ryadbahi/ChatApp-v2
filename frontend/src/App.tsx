import { useEffect, useState } from "react";
import { socket } from "./socket";

function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    socket.connect(); // Connect when the app mounts

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, []);

  const joinRoom = (roomId: string) => socket.emit("joinRoom", roomId);

  const sendMessage = (roomId: string, content: string) => {
    const message = { roomId, content, sentAt: new Date() };
    socket.emit("sendMessage", { roomId, message });
    setMessages((prev) => [...prev, message]); // optimistic UI update
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-2">
        Socket connected: {connected ? "✅" : "❌"}
      </h1>

      <button
        onClick={() => joinRoom("YOUR_ROOM_ID_HERE")}
        className="bg-blue-500 text-white px-2 py-1 mb-4 rounded"
      >
        Join Room
      </button>

      <div className="space-y-2 mb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className="p-2 border rounded">
            {typeof msg.content === "string"
              ? msg.content
              : JSON.stringify(msg)}
          </div>
        ))}
      </div>

      <button
        onClick={() => sendMessage("YOUR_ROOM_ID_HERE", "Hello!")}
        className="bg-green-500 text-white px-2 py-1 rounded"
      >
        Send Hello
      </button>
    </div>
  );
}

export default App;
