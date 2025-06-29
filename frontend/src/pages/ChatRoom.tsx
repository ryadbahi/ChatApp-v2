// src/pages/ChatRoom.tsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io, Socket } from "socket.io-client";

interface Room {
  _id: string;
  name: string;
  isPrivate: boolean;
  createdBy: { _id: string; username: string };
  members: string[];
  createdAt: string;
}

interface Message {
  _id?: string;
  sender: string;
  text: string;
  createdAt?: string;
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);

  // Join the room and fetch room data
  useEffect(() => {
    const joinRoom = async () => {
      try {
        const res = await axios.post(`/api/rooms/${roomId}/join`, null, {
          withCredentials: true,
        });
        setRoom(res.data);
      } catch (err) {
        console.error("Failed to join room", err);
      }
    };

    joinRoom();
  }, [roomId]);

  // Setup socket connection
  useEffect(() => {
    if (!roomId) return;

    socketRef.current = io("http://localhost:5001", {
      withCredentials: true,
    });

    socketRef.current.emit("joinRoom", roomId);

    socketRef.current.on("newMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = { sender: "me", text: newMessage };
    socketRef.current?.emit("sendMessage", { roomId, text: newMessage });
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  if (!room) return <p className="p-4 text-white">Loading room...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      <h1 className="text-3xl text-white font-bold mb-4">{room.name}</h1>

      <div className="flex-1 overflow-y-auto bg-white/10 rounded-xl p-4 space-y-2 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg max-w-sm ${
              msg.sender === "me"
                ? "ml-auto bg-blue-500 text-white"
                : "bg-white text-black"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 p-2 rounded-lg bg-white/30 text-white placeholder-white/70 focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-white/80"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
