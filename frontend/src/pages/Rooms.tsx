import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Room {
  _id: string;
  name: string;
  isPrivate: boolean;
  createdBy: { _id: string; username: string };
  members: string[];
  createdAt: string;
}

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get("/api/rooms", { withCredentials: true });
        setRooms(res.data);
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      }
    };

    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen px-4 py-10 flex flex-col items-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <h1 className="text-4xl font-bold text-white mb-10">My Chat Rooms</h1>

      <div className="grid gap-8 w-full max-w-6xl sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <div
            key={room._id}
            onClick={() => navigate(`/chat/${room._id}`)}
            className="backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between transition hover:scale-[1.02]"
          >
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{room.name}</h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    room.isPrivate
                      ? "bg-red-500/20 text-red-300"
                      : "bg-green-500/20 text-green-300"
                  }`}
                >
                  {room.isPrivate ? "Private 🔒" : "Public 🌍"}
                </span>
              </div>
              <p className="text-sm text-white/70 mt-2">
                Created by{" "}
                <span className="font-medium">{room.createdBy.username}</span>
              </p>
            </div>

            <div className="text-sm text-white/70 mt-auto">
              <p>👥 {room.members.length} member(s)</p>
              <p>📅 {new Date(room.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rooms;
