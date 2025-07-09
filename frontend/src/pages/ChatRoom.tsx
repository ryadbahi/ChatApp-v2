import { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageBubble,
  UserActionDropdown,
  RichMessageInput,
} from "../components";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axios";
import { useChatRoom } from "../hooks/useChatRoom";
import { useAuth } from "../context/AuthContext";
import {
  FaEdit,
  FaTrash,
  FaLock,
  FaGlobe,
  FaEyeSlash,
  FaExclamationTriangle,
} from "react-icons/fa";
import type { Room, Message, CreateRoomData, User } from "../types/types";
import { joinRoom, editRoom, deleteRoom } from "../api/rooms";
import clsx from "clsx";

interface EditRoomModalProps {
  room: Room;
  onSave: (data: CreateRoomData) => Promise<void>;
  onCancel: () => void;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({
  room,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(room.name);
  const [visibility, setVisibility] = useState(room.visibility);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!name.trim()) {
      setError("Room name is required");
      setIsLoading(false);
      return;
    }

    if (name.length < 3 || name.length > 50) {
      setError("Room name must be between 3 and 50 characters");
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9\s-_]+$/.test(name)) {
      setError(
        "Room name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
      setIsLoading(false);
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        visibility: visibility as "public" | "private" | "secret",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update room");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-6">Edit Room</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-white/90 mb-1"
            >
              Room Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 
                      focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 
                      outline-none text-white placeholder-white/50"
              placeholder="Enter room name"
            />
          </div>

          <div>
            <label
              htmlFor="visibility"
              className="block text-sm font-medium text-white/90 mb-1"
            >
              Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "public" | "private" | "secret")
              }
              className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 
                      focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 
                      outline-none text-white"
            >
              <option value="public">Public (visible to all)</option>
              <option value="private">
                Private (visible but requires permission)
              </option>
              <option value="secret">Secret (hidden unless shared)</option>
            </select>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/90 
                      hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-500/80 text-white 
                      hover:bg-blue-600/80 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId || !user) return;

    console.log("[ChatRoom] useEffect triggered", { roomId, user: user.id });
    console.log("[ChatRoom] Location state:", location.state);

    // Check if we have room data from navigation state (from successful password join)
    const navigationState = location.state as { roomData?: Room };
    if (navigationState?.roomData) {
      console.log(
        "[ChatRoom] Using room data from navigation state:",
        navigationState.roomData
      );
      setRoom(navigationState.roomData);
      setIsCreator(navigationState.roomData.createdBy._id === user.id);

      // Clear the navigation state to prevent issues on refresh
      window.history.replaceState({}, "", window.location.pathname);

      return;
    }

    console.log(
      "[ChatRoom] No navigation state found, attempting to join room"
    );

    const fetchRoomAndJoin = async () => {
      try {
        console.log(
          "[ChatRoom] Attempting to join room with empty credentials"
        );
        // Try to join with empty credentials first (works for public rooms and creators)
        const joinedRoom = await joinRoom(roomId, {});
        console.log("[ChatRoom] Successfully joined room:", joinedRoom);
        setRoom(joinedRoom);
        setIsCreator(joinedRoom.createdBy._id === user.id);
      } catch (err: any) {
        console.error("[ChatRoom] Failed to access room", err);

        if (err.response?.status === 429) {
          setError(
            "You've made too many attempts to join rooms. Please try again later."
          );
        } else if (
          err.response?.status === 400 ||
          err.response?.status === 403
        ) {
          // For private rooms, redirect to password page
          // For secret rooms, we'd need additional logic to detect the room type
          // Since we can't determine the room type without access, redirect to join page
          const errorMsg = err.response?.data?.msg || "";

          if (errorMsg.includes("Password required")) {
            // This is a private room - redirect to join page
            navigate(`/join/${roomId}`);
            return;
          } else if (
            errorMsg.includes("Name and password required") ||
            errorMsg.includes("credentials")
          ) {
            // This is likely a secret room - redirect to rooms with message
            setError(
              "This is a secret room. Please use 'Join Secret Room' from the main menu."
            );
          } else {
            setError(
              "This room requires permission to access. Please join through the proper channel."
            );
          }
        } else {
          setError(err.response?.data?.msg || "Failed to access room");
        }

        setRoom(null);
      }
    };

    fetchRoomAndJoin();
  }, [roomId, user, navigate, location.state]);

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

  const handleSend = useCallback(
    (message: string, imageUrl?: string) => {
      if (!message.trim() && !imageUrl) return;
      sendMessage(message, imageUrl);
    },
    [sendMessage]
  );

  const handleLeave = () => {
    navigate("/rooms");
  };

  const handleEditRoom = async (data: CreateRoomData) => {
    if (!roomId) return;

    try {
      const updatedRoom = await editRoom(roomId, data);
      setRoom(updatedRoom);
      setShowEditModal(false);
    } catch (err: any) {
      console.error("[ChatRoom] Failed to update room", err);
      throw err; // Let the modal handle the error
    }
  };

  const handleDeleteRoom = async () => {
    if (
      !roomId ||
      !window.confirm(
        "Are you sure you want to delete this room? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteRoom(roomId);
      navigate("/rooms");
    } catch (err) {
      console.error("[ChatRoom] Failed to delete room", err);
      alert("Failed to delete room. Please try again.");
    }
  };

  const handleUserClick = (clickedUser: User, event: React.MouseEvent) => {
    // Don't show dropdown for current user
    if (clickedUser._id === user?.id) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10,
    });
    setSelectedUser(clickedUser);
  };

  const handleCloseDropdown = () => {
    setSelectedUser(null);
  };

  const handleOpenDM = (userId: string) => {
    navigate(`/direct-messages/${userId}`);
  };

  // Helper: call scrollToBottom on image load
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-8 border border-red-500/30 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <FaExclamationTriangle className="text-red-400 text-2xl" />
            <h2 className="text-xl font-semibold text-white">Error</h2>
          </div>
          <p className="text-white/90 mb-6">{error}</p>
          <button
            onClick={() => navigate("/rooms")}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-white">{room.name}</h1>
          <span
            className={clsx(
              "ml-3 px-2 py-1 text-xs rounded-full",
              room.visibility === "public"
                ? "bg-green-500/20 text-green-300"
                : room.visibility === "private"
                ? "bg-yellow-500/20 text-yellow-300"
                : "bg-red-500/20 text-red-300"
            )}
          >
            {room.visibility === "public" ? (
              <>
                <FaGlobe className="inline mr-1" /> Public
              </>
            ) : room.visibility === "private" ? (
              <>
                <FaLock className="inline mr-1" /> Private
              </>
            ) : (
              <>
                <FaEyeSlash className="inline mr-1" /> Secret
              </>
            )}
          </span>
        </div>

        <div className="flex gap-2">
          {isCreator && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-2 bg-blue-500/80 text-white rounded-lg hover:bg-blue-600/80 transition-colors"
                title="Edit Room"
              >
                <FaEdit />
              </button>
              <button
                onClick={handleDeleteRoom}
                className="px-3 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600/80 transition-colors"
                title="Delete Room"
              >
                <FaTrash />
              </button>
            </>
          )}
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-gray-500/50 text-white font-semibold rounded-lg hover:bg-gray-600/50 transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      {showEditModal && (
        <EditRoomModal
          room={room}
          onSave={handleEditRoom}
          onCancel={() => setShowEditModal(false)}
        />
      )}

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
              onUserClick={handleUserClick}
              handleImgLoad={scrollToBottom}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 mt-2 shrink-0 bg-white/20 rounded-2xl border border-white/30 shadow-2xl backdrop-blur-3xl p-2">
          <RichMessageInput onSend={handleSend} />
        </div>
      </div>

      {selectedUser && (
        <UserActionDropdown
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={handleCloseDropdown}
          onOpenDM={handleOpenDM}
          position={dropdownPosition}
        />
      )}
    </div>
  );
};

export default ChatRoom;
