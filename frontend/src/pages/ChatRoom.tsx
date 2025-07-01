import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import { useChatRoom } from "../hooks/useChatRoom";
import { jwtDecode } from "jwt-decode";

interface Room {
  _id: string;
  name: string;
  visibility: string;
  createdBy: { _id: string; username: string };
  createdAt: string;
}

interface Message {
  _id: string;
  content: string;
  sender: { _id: string; username: string };
  createdAt: string;
}

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getCurrentUserId = (): string | null => {
    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.id;
    } catch (err) {
      console.error("Failed to decode token", err);
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    if (!roomId) return;
    axios
      .post(`/api/rooms/${roomId}/join`, {}, { withCredentials: true })
      .then((res) => setRoom(res.data))
      .catch((err) => {
        setRoom(null);
        console.error("[ChatRoom] Failed to join room", err);
      });
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    axios
      .get(`/api/messages/${roomId}`, { withCredentials: true })
      .then((res) => setMessages(res.data))
      .catch((err) => {
        setMessages([]);
        console.error("[ChatRoom] Failed to fetch messages", err);
      });
  }, [roomId]);

  const handleIncomingMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const { sendMessage } = useChatRoom(roomId, handleIncomingMessage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage("");
  }, [newMessage, sendMessage]);

  if (!room) return <p className="text-white p-4">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">{room.name}</h1>

      <div className="flex-1 overflow-y-auto bg-white/10 rounded-xl p-4 space-y-2 mb-4">
        {messages.map((msg) => {
          const isMe = msg.sender._id === currentUserId;
          return (
            <div
              key={msg._id}
              className={`p-2 rounded-lg max-w-sm ${
                isMe ? "ml-auto bg-blue-500 text-white" : "bg-white text-black"
              }`}
            >
              <strong>{msg.sender.username}:</strong> {msg.content}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
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
