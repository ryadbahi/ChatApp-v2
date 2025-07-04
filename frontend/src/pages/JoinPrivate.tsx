import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaLock, FaArrowRight, FaExclamationTriangle } from "react-icons/fa";
import { useRoom } from "../context/RoomContext";

const JoinPrivate = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { joinRoomWithLoading } = useRoom();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    setIsLoading(true);
    setError(null);

    try {
      await joinRoomWithLoading(roomId, { password, delay: 500 });
    } catch (err: any) {
      console.error("[JoinPrivateRoom] Failed to join room:", err);

      if (err.response?.status === 429) {
        setError(
          "You've made too many attempts to join rooms. Please try again later."
        );
      } else if (err.response?.status === 403) {
        setError("Incorrect password. Please try again.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to join room. Please try again."
        );
      }

      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center mr-4">
            <FaLock className="text-white text-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join Private Room</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white/90 mb-2"
            >
              Enter Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 
                     focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 
                     outline-none text-white"
              placeholder="Room password"
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
              onClick={() => navigate("/rooms")}
              className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white 
                     hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-500/80 text-white 
                     hover:bg-indigo-600/80 transition-colors flex items-center justify-center gap-2"
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
    </div>
  );
};

export default JoinPrivate;
