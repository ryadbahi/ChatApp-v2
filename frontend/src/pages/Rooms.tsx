import { useEffect, useState } from "react";
import { socket } from "../socket";
// Join all rooms on the list for live user counts
import type { Room } from "../types/types";
import RoomCard from "../components/RoomCard";
import Toast from "../components/Toast";
import { getRooms, getCreatedRooms } from "../api/rooms";
import CreateRoomForm from "../components/CreateRoomForm";
import { useRoom } from "../context/RoomContext";

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg transition-colors ${
      isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
    }`}
  >
    {label}
  </button>
);

const RoomGrid: React.FC<{
  rooms: Room[];
  isCreated?: boolean;
  onUpdate: () => void;
  onRoomEdited: () => void;
  onRoomDeleted: () => void;
  userCounts: Record<string, number>;
}> = ({
  rooms,
  isCreated = false,
  onUpdate,
  onRoomEdited,
  onRoomDeleted,
  userCounts,
}) => {
  return (
    <div className="grid gap-8 w-full max-w-6xl sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => {
        // Only show userCount for public rooms
        const showUserCount = room.visibility === "public";
        return (
          <RoomCard
            key={room._id}
            room={room}
            isCreated={isCreated}
            onUpdate={onUpdate}
            onRoomEdited={onRoomEdited}
            onRoomDeleted={onRoomDeleted}
            userCount={showUserCount ? userCounts[room._id] ?? 0 : undefined}
          />
        );
      })}
    </div>
  );
};

const Rooms = () => {
  const [activeTab, setActiveTab] = useState<"all" | "created">("all");
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [createdRooms, setCreatedRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
    type: "success" | "error" | "info";
  }>({
    message: "",
    visible: false,
    type: "success",
  });

  const {
    joinRoomWithLoading,
    addRoomCreatedListener,
    removeRoomCreatedListener,
  } = useRoom();

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allRoomsData, createdRoomsData] = await Promise.all([
        getRooms(),
        getCreatedRooms(),
      ]);
      setAllRooms(allRoomsData);
      setCreatedRooms(createdRoomsData);
    } catch (err) {
      setError("Failed to load rooms. Please try again later.");
      console.error("[Rooms] Failed to fetch rooms:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Listen for room creation events from other components (like navbar)
  useEffect(() => {
    const handleRoomCreated = (room: any) => {
      console.log("Room created event received:", room);

      // Normalize ID
      const normalizedRoom = {
        ...room,
        _id: room._id || room.id,
      };

      // Add to both lists for immediate UI update
      setAllRooms((prev) => [normalizedRoom, ...prev]);
      setCreatedRooms((prev) => [normalizedRoom, ...prev]);

      // Also refresh from backend to ensure consistency
      fetchRooms().catch((error) => {
        console.error("Failed to refresh rooms from backend:", error);
      });
    };

    addRoomCreatedListener(handleRoomCreated);
    return () => removeRoomCreatedListener(handleRoomCreated);
  }, [addRoomCreatedListener, removeRoomCreatedListener]);

  // Fetch live user counts for public rooms only
  useEffect(() => {
    console.log("[Rooms] Socket connected:", socket.connected);
    if (!socket.connected) {
      console.log("[Rooms] Socket not connected, waiting...");
      socket.on("connect", () => {
        console.log("[Rooms] Socket connected, fetching user counts");
        socket.emit(
          "getPublicRoomsUserCounts",
          (counts: Record<string, number>) => {
            console.log("[Rooms] Received user counts:", counts);
            setUserCounts(counts || {});
          }
        );
      });
    } else {
      console.log("[Rooms] Socket already connected, fetching user counts");
      socket.emit(
        "getPublicRoomsUserCounts",
        (counts: Record<string, number>) => {
          console.log("[Rooms] Received user counts:", counts);
          setUserCounts(counts || {});
        }
      );
    }
    // Optionally, poll every 10 seconds for updates
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit(
          "getPublicRoomsUserCounts",
          (counts: Record<string, number>) => {
            //console.log("[Rooms] Polling - Received user counts:", counts);
            setUserCounts(counts || {});
          }
        );
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, allRooms, createdRooms]);

  useEffect(() => {
    // Listen for real-time room count updates from the backend
    const handleAllRoomCounts = (counts: Record<string, number>) => {
      setUserCounts(counts || {});
    };
    socket.on("allRoomCounts", handleAllRoomCounts);

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("allRoomCounts", handleAllRoomCounts);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
      {/* Create Room Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreate(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CreateRoomForm
              onSuccess={async (room, joinAfterCreate, resetLoading) => {
                console.log(
                  "Room creation successful, handling response:",
                  room
                );

                setToast({
                  message: "Room created successfully!",
                  visible: true,
                  type: "success",
                });

                // Normalize ID
                const normalizedRoom = {
                  ...room,
                  _id: room._id || room.id,
                };

                // Manually update UI immediately for better UX
                if (activeTab === "all") {
                  setAllRooms((prev) => [normalizedRoom, ...prev]);
                }
                setCreatedRooms((prev) => [normalizedRoom, ...prev]);

                // Also refresh from backend to ensure consistency
                try {
                  await fetchRooms();
                } catch (error) {
                  console.error("Failed to refresh rooms from backend:", error);
                }

                if (joinAfterCreate && normalizedRoom._id) {
                  setToast({
                    message: "Joining room...",
                    visible: true,
                    type: "info",
                  });

                  try {
                    console.log(
                      "[Rooms] Calling joinRoomWithLoading with:",
                      normalizedRoom._id
                    );
                    await joinRoomWithLoading(normalizedRoom._id, {
                      delay: 500,
                    });
                  } catch (error) {
                    console.error("Join failed", error);
                    setToast({
                      message: "Failed to join room. Please try manually.",
                      visible: true,
                      type: "error",
                    });
                  }
                }

                setShowCreate(false);
                resetLoading?.(); // Reset the form's loading state
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-white">Chat Rooms</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-gradient-to-r from-pink-500/80 to-purple-500/80 text-white rounded-lg hover:from-pink-600/80 hover:to-purple-600/80 transition-colors"
          >
            Create Room
          </button>
        </div>

        <div className="w-full flex justify-center mb-6">
          <Tab
            label="All Rooms"
            isActive={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          />
          <Tab
            label="My Created Rooms"
            isActive={activeTab === "created"}
            onClick={() => setActiveTab("created")}
          />
        </div>

        {error ? (
          <div className="text-center text-red-400 bg-red-500/10 backdrop-blur-sm p-4 rounded-lg">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <RoomGrid
            rooms={activeTab === "all" ? allRooms : createdRooms}
            isCreated={activeTab === "created"}
            onUpdate={fetchRooms}
            onRoomEdited={() =>
              setToast({
                message: "Room updated successfully!",
                visible: true,
                type: "success",
              })
            }
            onRoomDeleted={() =>
              setToast({
                message: "Room deleted successfully!",
                visible: true,
                type: "info",
              })
            }
            userCounts={userCounts}
          />
        )}
      </div>
    </div>
  );
};

export default Rooms;
