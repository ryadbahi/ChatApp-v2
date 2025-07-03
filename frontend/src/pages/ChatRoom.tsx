import { useEffect, useState, useRef, useCallback } from "react";
import MessageBubble from "../components/MessageBubble";
// AppLayout is now applied globally via ProtectedRoute
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useChatRoom } from "../hooks/useChatRoom";
import { useAuth } from "../context/AuthContext";
import { FaPaperPlane } from "react-icons/fa";

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

const ChatRoom = () => {
  // Sidebar state is now handled by AppLayout
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;
    const joinRoom = async () => {
      try {
        const res = await axios.post(
          `/api/rooms/${roomId}/join`,
          {},
          { withCredentials: true }
        );
        setRoom(res.data);
      } catch (err) {
        console.error("[ChatRoom] Failed to join room", err);
        setRoom(null);
      }
    };
    joinRoom();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${roomId}`, {
          withCredentials: true,
        });
        setMessages(res.data);
      } catch (err) {
        console.error("[ChatRoom] Failed to fetch messages", err);
        setMessages([]);
      }
    };
    fetchMessages();
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

  const handleLeave = () => {
    navigate("/rooms");
  };

  if (!room) return <p className="text-white p-4">Loading...</p>;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-3xl font-bold text-white">{room.name}</h1>
        <button
          onClick={handleLeave}
          className="ml-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
        >
          Leave Room
        </button>
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        <div
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 mb-4 bg-white/20 rounded-2xl border border-white/30 shadow-2xl backdrop-blur-3xl"
          style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMe={msg.sender._id === user?.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 mt-2 shrink-0 bg-white/20 rounded-2xl border border-white/30 shadow-2xl backdrop-blur-3xl p-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 p-2 rounded-lg bg-white/30 text-white placeholder-white/70 border-none outline-none backdrop-blur"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 flex items-center justify-center bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors shadow-md"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Send message"
          >
            <FaPaperPlane size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
