import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaGlobe, FaLock, FaEyeSlash } from "react-icons/fa";
import type { Room, CreateRoomData } from "../../types/types";
import { editRoom, deleteRoom } from "../../api/rooms";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";

interface RoomCardProps {
  room: Room;
  isCreated?: boolean;
  onUpdate?: () => void;
  onRoomEdited?: () => void;
  onRoomDeleted?: () => void;
  userCount?: number;
}

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
  const [visibility, setVisibility] = useState<"public" | "private" | "secret">(
    room.visibility as "public" | "private" | "secret"
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track if visibility is changing from public to private/secret
  const isChangingFromPublic =
    visibility !== "public" && room.visibility === "public";

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

    // Check if password is required for private/secret rooms
    if (isChangingFromPublic && !password) {
      setError("Password is required for private or secret rooms");
      setIsLoading(false);
      return;
    }

    try {
      // Only include password in the request if it's provided or required
      const data = {
        name: name.trim(),
        visibility,
      };

      // Add password to data if provided or changing to private/secret
      if (password || isChangingFromPublic) {
        Object.assign(data, { password });
      }

      await onSave(data);
    } catch (err: any) {
      console.error("[EditRoomModal] Error:", err);
      setError(err.response?.data?.msg || "Failed to update room");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md backdrop-blur-lg bg-white/10 p-6 rounded-xl border border-white/20">
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

          {/* Show password field if visibility is private or secret */}
          {visibility !== "public" && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/90 mb-1"
              >
                Password{" "}
                {room.visibility !== "public"
                  ? "(leave empty to keep current)"
                  : ""}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 
                           focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 
                           outline-none text-white placeholder-white/50"
                  placeholder={
                    room.visibility !== "public"
                      ? "Keep current password"
                      : "Enter password"
                  }
                  minLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-white/60 mt-1">
                {isChangingFromPublic
                  ? "Password is required when changing to private or secret"
                  : "Minimum 4 characters. Leave empty to keep the current password."}
              </p>
            </div>
          )}

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

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isCreated = false,
  onUpdate,
  onRoomEdited,
  onRoomDeleted,
  userCount = 0,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { joinRoomWithLoading } = useRoom();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest(".room-actions")) {
      e.stopPropagation();
      return;
    }

    try {
      // For private or secret rooms, redirect to join page (unless user is creator)
      if (room.visibility === "private" || room.visibility === "secret") {
        if (user && room.createdBy._id === user.id) {
          await joinRoomWithLoading(room._id, { delay: 300 });
          return;
        }
        navigate(`/join/${room._id}`);
        return;
      }

      // For public rooms, join directly
      await joinRoomWithLoading(room._id, { delay: 300 });
    } catch (error) {
      console.error("[RoomCard] Failed to join room:", error);
      // Error handling can be improved here if needed
    }
  };

  const handleEditRoom = async (data: CreateRoomData) => {
    try {
      await editRoom(room._id, data);
      setShowEditModal(false);
      onUpdate?.();
      onRoomEdited?.();
    } catch (err) {
      console.error("[RoomCard] Failed to edit room:", err);
      throw err; // Let the modal handle the error display
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete "${room.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteRoom(room._id);
      onUpdate?.();
      onRoomDeleted?.();
    } catch (err) {
      console.error("[RoomCard] Failed to delete room:", err);
      alert("Failed to delete room. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  // Get the appropriate icon based on visibility
  const VisibilityIcon =
    room.visibility === "private"
      ? FaLock
      : room.visibility === "secret"
      ? FaEyeSlash
      : FaGlobe;

  const visibilityColor =
    room.visibility === "private"
      ? "text-yellow-300 bg-yellow-500/20"
      : room.visibility === "secret"
      ? "text-red-300 bg-red-500/20"
      : "text-green-300 bg-green-500/20";

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`cursor-pointer backdrop-blur-md bg-white/10 border border-white/20 
                  text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between 
                  transition hover:scale-[1.02] relative ${
                    isDeleting ? "opacity-50 pointer-events-none" : ""
                  }`}
      >
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{room.name}</h2>
            <span
              className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${visibilityColor}`}
            >
              <VisibilityIcon size={10} />
              <span>
                {room.visibility === "private"
                  ? "Private"
                  : room.visibility === "secret"
                  ? "Secret"
                  : "Public"}
              </span>
            </span>
          </div>
          <p className="text-sm text-white/70 mt-2">
            Created by{" "}
            <span className="font-medium">{room.createdBy.username}</span>
          </p>
        </div>

        <div className="text-sm text-white/70 mt-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <p>📅 {new Date(room.createdAt).toLocaleDateString()}</p>
            {room.visibility === "public" || room.createdBy._id === user?.id ? (
              <span className="ml-2 px-2 py-1 bg-blue-500/20 rounded text-blue-200 text-xs">
                👥{" "}
                {userCount !== null && userCount !== undefined ? userCount : 0}{" "}
                online
              </span>
            ) : (
              <span className="ml-2 px-2 py-1 bg-blue-500/20 rounded text-blue-200 text-xs inline-flex">
                👥
                <FaEyeSlash className="mt-1 ml-1" />
              </span>
            )}
          </div>
          {isCreated && (
            <div className="flex gap-2 room-actions">
              <button
                onClick={handleEditClick}
                className="p-2 bg-blue-500/50 hover:bg-blue-600/50 rounded-full transition-colors"
                title="Edit Room"
              >
                <FaEdit size={14} />
              </button>
              <button
                onClick={handleDeleteRoom}
                className="p-2 bg-red-500/50 hover:bg-red-600/50 rounded-full transition-colors"
                title="Delete Room"
                disabled={isDeleting}
              >
                <FaTrash size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditRoomModal
          room={room}
          onSave={handleEditRoom}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </>
  );
};

export default RoomCard;
