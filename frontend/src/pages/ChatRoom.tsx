// src/pages/ChatRoom.tsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import { io, Socket } from "socket.io-client";

interface Room {
  _id: string;
  name: string;
  visibility: string;
  createdBy: { _id: string; username: string };
  members: string[];
  createdAt: string;
}

interface Message {
  _id: string;
  content: string;
  sender: { _id: string; username: string };
  createdAt: string;
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);

  // Join room + fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.post(
          `/api/rooms/${roomId}/join`,
          {},
          { withCredentials: true }
        );
        setRoom(res.data);
      } catch (err) {
        console.error("[ChatRoom] Failed to join room", err);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${roomId}`, {
          withCredentials: true,
        });
        setMessages(res.data);
      } catch (err) {
        console.error("[ChatRoom] Failed to fetch messages", err);
      }
    };

    if (roomId) {
      fetchMessages();
    }
  }, [roomId]);

  // Socket.IO
  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (!roomId || !token) return;

    socketRef.current = io("http://localhost:5001", {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to socket server:", socketRef.current?.id);
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
    console.log("[handleSend] Sending message:", newMessage);
    socketRef.current?.emit("sendMessage", {
      roomId,
      message: newMessage,
    });

    setNewMessage("");
  };

  if (!room) return <p className="text-white p-4">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">{room.name}</h1>

      <div className="flex-1 overflow-y-auto bg-white/10 rounded-xl p-4 space-y-2 mb-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`p-2 rounded-lg max-w-sm ${
              msg.sender.username === "me"
                ? "ml-auto bg-blue-500 text-white"
                : "bg-white text-black"
            }`}
          >
            <strong>{msg.sender.username}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-lg bg-white/30 text-white placeholder-white/70"
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
