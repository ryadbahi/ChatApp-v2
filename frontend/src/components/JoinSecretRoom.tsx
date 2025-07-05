import { useState } from "react";
import { FaLock, FaArrowRight, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { joinSecretRoomByName } from "../api/rooms";

interface JoinSecretRoomProps {
  onSuccess?: (roomId: string, roomName: string) => void;
  onCancel?: () => void;
}

const JoinSecretRoom = ({ onSuccess, onCancel }: JoinSecretRoomProps) => {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roomName.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("[JoinSecretRoom] Attempting to join secret room:", {
        name: roomName,
      });

      // Call backend to join secret room by name
      const result = await joinSecretRoomByName({ name: roomName, password });
      console.log("[JoinSecretRoom] Successfully joined secret room:", result);

      // Navigate directly to chat room with room data in state
      console.log("[JoinSecretRoom] Navigating to chat room with state:", {
        roomData: result,
      });
      navigate(`/chat/${result.id}`, {
        state: { roomData: result },
      });

      onSuccess?.(result.id, roomName);
    } catch (err: any) {
      console.error("[JoinSecretRoom] Failed to join secret room:", err);
      console.error("[JoinSecretRoom] Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      if (err.response?.status === 403) {
        setError("Invalid room name or password. Please try again.");
      } else if (err.response?.status === 400) {
        setError("All fields are required.");
      } else if (err.response?.status === 429) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to join room. Please try again.");
      }

      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-8 shadow-2xl">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-pink-500/30 rounded-full flex items-center justify-center mr-4">
          <FaLock className="text-white text-2xl" />
        </div>
        <h1 className="text-2xl font-bold text-white">Join Secret Room</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Name */}
        <div>
          <label
            htmlFor="roomName"
            className="block text-sm font-medium text-white/90 mb-2"
          >
            Room Name
          </label>
          <input
            type="text"
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/30 outline-none text-white placeholder-white/50"
            placeholder="Enter secret room name"
            required
          />
        </div>
        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-white/90 mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/30 outline-none text-white placeholder-white/50"
            placeholder="Enter password"
            required
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-pink-500/80 text-white hover:bg-pink-600/80 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent"></div>
            ) : (
              <>
                Join Room
                <FaArrowRight className="text-sm" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinSecretRoom;
