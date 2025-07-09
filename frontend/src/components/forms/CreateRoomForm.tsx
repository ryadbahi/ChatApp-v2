import React, { useState } from "react";
import { createRoom } from "../../api/rooms";

interface CreateRoomFormProps {
  onSuccess?: (
    room: any,
    joinAfterCreate: boolean,
    resetLoading?: () => void
  ) => void;
  onCancel?: () => void;
}

const CreateRoomForm: React.FC<CreateRoomFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "secret">(
    "public"
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [joinAfterCreate, setJoinAfterCreate] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!name.trim()) {
      setError("Room name is required");
      setIsLoading(false);
      return;
    }

    if (name.length < 3 || name.length > 15) {
      setError("Room name must be between 3 and 15 characters");
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

    if (visibility !== "public" && (!password || password.length < 4)) {
      setError(
        "Password must be at least 4 characters for private or secret rooms"
      );
      setIsLoading(false);
      return;
    }

    try {
      const roomData = {
        name: name.trim(),
        visibility,
        ...(visibility !== "public" && { password }),
      };
      console.log("Creating room with data:", roomData);
      const createdRoom = await createRoom(roomData);
      console.log("Room created successfully:", createdRoom);

      // Only call onSuccess if we have a valid room response
      if (createdRoom) {
        const roomWithId = {
          ...createdRoom,
          _id: createdRoom._id || createdRoom.id,
        };
        console.log("Calling onSuccess with:", roomWithId);

        // Create a callback to reset loading state
        const resetLoading = () => setIsLoading(false);

        // Pass the reset function along with the room data
        onSuccess?.(roomWithId, joinAfterCreate, resetLoading);
      } else {
        setError("Invalid room response from server");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("[CreateRoom] Error:", err);
      setError(err.response?.data?.msg || "Failed to create room");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/10 border border-white/20 rounded-2xl shadow-xl p-8 backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Create New Room</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-white/70 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Name */}
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
            onChange={(e) => {
              if (e.target.value.length <= 15) setName(e.target.value);
            }}
            placeholder="Enter room name"
            maxLength={15}
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/20 text-white placeholder-white/60
                     backdrop-blur-sm focus:ring-2 focus:ring-pink-400/30 focus:border-pink-400/50 transition-all outline-none"
          />
        </div>

        {/* Visibility */}
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
            onChange={(e) => setVisibility(e.target.value as any)}
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/20 text-white
                     backdrop-blur-sm focus:ring-2 focus:ring-pink-400/30 focus:border-pink-400/50 transition-all outline-none"
          >
            <option value="public" className="bg-gray-800">
              Public (visible to all)
            </option>
            <option value="private" className="bg-gray-800">
              Private (visible with password)
            </option>
            <option value="secret" className="bg-gray-800">
              Secret (hidden unless shared)
            </option>
          </select>
        </div>

        {/* Password */}
        {visibility !== "public" && (
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white/90 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 4 characters)"
                className="w-full px-4 py-2 pr-12 rounded-lg bg-black/20 border border-white/20 text-white placeholder-white/60
                         backdrop-blur-sm focus:ring-2 focus:ring-pink-400/30 focus:border-pink-400/50 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-white/60 mt-1">
              Password is required for private and secret rooms.
            </p>
          </div>
        )}

        {/* Join after create checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="joinAfterCreate"
            checked={joinAfterCreate}
            onChange={() => setJoinAfterCreate((v) => !v)}
            className="accent-pink-500 w-4 h-4 rounded focus:ring-pink-400/30 border-white/20 bg-black/20"
          />
          <label
            htmlFor="joinAfterCreate"
            className="text-white/80 text-sm select-none cursor-pointer"
          >
            Join this room after creation
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-300 text-sm bg-red-500/20 p-3 rounded-lg border border-red-400/20 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg text-white/90 border border-white/20 
                     hover:bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500/80 to-purple-500/80 text-white 
                     hover:from-pink-600/80 hover:to-purple-600/80 transition-colors disabled:opacity-50 backdrop-blur-sm"
          >
            {isLoading ? "Creating..." : "Create Room"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoomForm;
