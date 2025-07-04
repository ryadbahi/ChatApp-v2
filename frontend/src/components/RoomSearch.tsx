import React, { useState, useCallback } from "react";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import type { Room } from "../types/types";
import { searchRooms } from "../api/rooms";
import { FaLock, FaGlobe, FaEyeSlash } from "react-icons/fa";
import { useRoom } from "../context/RoomContext";

interface RoomSearchProps {
  onSelectRoom?: (room: Room) => void;
}

const RoomSearch: React.FC<RoomSearchProps> = ({ onSelectRoom }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { joinRoomWithLoading } = useRoom();

  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const rooms = await searchRooms(term);
        setResults(rooms);
      } catch (err) {
        setError("Failed to search rooms");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleRoomSelect = async (room: Room) => {
    if (onSelectRoom) {
      onSelectRoom(room);
    } else {
      try {
        // Handle based on visibility
        if (room.visibility === "private") {
          navigate(`/join/${room._id}`);
        } else {
          await joinRoomWithLoading(room._id, { delay: 300 });
        }
      } catch (error) {
        console.error("[RoomSearch] Failed to join room:", error);
        // Error handling can be improved here if needed
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search rooms..."
          className="w-full px-4 py-3 rounded-lg bg-black/20 backdrop-blur-sm 
                     border border-white/20 focus:border-pink-400/50 
                     focus:ring-2 focus:ring-pink-400/30 outline-none text-white 
                     placeholder-white/50 transition-all duration-200 text-lg"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-pink-400 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 text-red-300 text-sm bg-red-500/20 backdrop-blur-sm p-3 rounded-lg border border-red-400/20">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-xl overflow-hidden">
          {results.map((room) => (
            <div
              key={room._id}
              onClick={() => handleRoomSelect(room)}
              className="p-4 hover:bg-white/10 cursor-pointer transition-all duration-200
                         border-b border-white/10 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-white text-lg">
                  {room.name}
                </div>
                <div className="text-xs px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                  {room.visibility === "public" ? (
                    <span className="bg-green-500/30 text-green-200 px-3 py-1 rounded-full backdrop-blur-sm border border-green-400/20">
                      <FaGlobe className="inline mr-1" size={10} /> Public
                    </span>
                  ) : room.visibility === "private" ? (
                    <span className="bg-yellow-500/30 text-yellow-200 px-3 py-1 rounded-full backdrop-blur-sm border border-yellow-400/20">
                      <FaLock className="inline mr-1" size={10} /> Private
                    </span>
                  ) : (
                    <span className="bg-red-500/30 text-red-200 px-3 py-1 rounded-full backdrop-blur-sm border border-red-400/20">
                      <FaEyeSlash className="inline mr-1" size={10} /> Secret
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-white/70 mt-2">
                Created by {room.createdBy.username}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomSearch;
