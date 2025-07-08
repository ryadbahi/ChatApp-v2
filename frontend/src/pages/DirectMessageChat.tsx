import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { getDirectMessages, markMessagesAsRead } from "../api/directMessages";
import type { DirectMessage, User } from "../types/types";
import Toast from "../components/Toast";
import { FiArrowLeft } from "react-icons/fi";
import MessageBubble from "../components/MessageBubble";
import RichMessageInput from "../components/RichMessageInput";
import { useAuth } from "../context/AuthContext";

const DirectMessageChat: React.FC = () => {
  const { userId: otherUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({ message: "", type: "info", visible: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type, visible: true });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!otherUserId) return;

    const fetchMessages = async () => {
      try {
        const response = await getDirectMessages(otherUserId);
        if (response.success && response.data) {
          if (Array.isArray(response.data.messages)) {
            setMessages(response.data.messages);
          } else {
            setMessages([]); // Ensure it's always an array
          }
          // Get other user info from the first message if available
          if (response.data.messages && response.data.messages.length > 0) {
            const firstMessage = response.data.messages[0];
            const otherUserFromMessage =
              firstMessage.sender._id === currentUser?.id
                ? firstMessage.recipient
                : firstMessage.sender;
            setOtherUser(otherUserFromMessage);
          }
        } else {
          setMessages([]);
        }

        // Mark messages as read
        await markMessagesAsRead(otherUserId);
      } catch (error) {
        console.error("Error fetching direct messages:", error);
        setMessages([]); // Ensure it's always an array on error
        showToast("Failed to load messages", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [otherUserId, currentUser?.id]);

  useEffect(() => {
    const handleNewDirectMessage = (message: DirectMessage) => {
      // Only add message if it's between current user and the other user
      if (
        message.sender._id === otherUserId ||
        message.recipient._id === otherUserId
      ) {
        setMessages((prev) => [...prev, message]);

        // If message is from the other user, mark as read
        if (message.sender._id === otherUserId && otherUserId) {
          markMessagesAsRead(otherUserId);
        }
      }
    };

    const handleDirectMessagesRead = (data: { readByUserId: string }) => {
      // Update messages to show they've been read
      setMessages((prev) =>
        prev.map((msg) =>
          msg.recipient._id === data.readByUserId && !msg.readAt
            ? { ...msg, readAt: new Date().toISOString() }
            : msg
        )
      );
    };

    socket.on("newDirectMessage", handleNewDirectMessage);
    socket.on("directMessagesRead", handleDirectMessagesRead);

    return () => {
      socket.off("newDirectMessage", handleNewDirectMessage);
      socket.off("directMessagesRead", handleDirectMessagesRead);
    };
  }, [otherUserId]);

  const handleSendMessage = (content: string, imageUrl?: string) => {
    if (!otherUserId || (!content.trim() && !imageUrl)) return;

    socket.emit("sendDirectMessage", {
      recipientId: otherUserId,
      message: content,
      imageUrl,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            User not found
          </h2>
          <button
            onClick={() => navigate("/direct-messages")}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate("/direct-messages")}
          className="mr-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center">
          {otherUser.avatar ? (
            <img
              src={otherUser.avatar}
              alt={otherUser.username}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mr-3">
              <span className="text-white font-semibold">
                {otherUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {otherUser.username}
            </h2>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              msg={{
                _id: message._id,
                content: message.content,
                imageUrl: message.imageUrl,
                sender: {
                  _id: message.sender._id,
                  username: message.sender.username,
                  avatar: message.sender.avatar || "", // Provide default empty string
                },
                createdAt: message.createdAt,
                room: "", // Not used for DMs
              }}
              isMe={message.sender._id === currentUser?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <RichMessageInput onSend={handleSendMessage} />
      </div>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default DirectMessageChat;
