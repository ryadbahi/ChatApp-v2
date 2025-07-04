import { useEffect, useState } from "react";
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
}> = ({ rooms, isCreated = false, onUpdate, onRoomEdited, onRoomDeleted }) => {
  return (
    <div className="grid gap-8 w-full max-w-6xl sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room._id}
          room={room}
          isCreated={isCreated}
          onUpdate={onUpdate}
          onRoomEdited={onRoomEdited}
          onRoomDeleted={onRoomDeleted}
        />
      ))}
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

  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
    type: "success" | "error" | "info";
  }>({
    message: "",
    visible: false,
    type: "success",
  });

  const { joinRoomWithLoading } = useRoom();

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
              onSuccess={async (room, joinAfterCreate) => {
                console.log(
                  "Room creation successful, handling response:",
                  room
                );

                // Close modal first
                setShowCreate(false);

                // Show success message
                setToast({
                  message: "Room created successfully!",
                  visible: true,
                  type: "success",
                });

                // Refresh room list
                await fetchRooms();

                // Navigate if requested with loading state
                if (joinAfterCreate && room && (room._id || room.id)) {
                  // Update toast to show joining status
                  setToast({
                    message: "Joining room...",
                    visible: true,
                    type: "info",
                  });

                  const roomId = room._id || room.id;

                  try {
                    if (room.visibility === "private") {
                      // For private rooms, navigate to join page
                      window.location.href = `/join/${roomId}`;
                    } else {
                      // For public rooms, use the global room joining function
                      await joinRoomWithLoading(roomId, { delay: 500 });
                    }
                  } catch (error) {
                    console.error(
                      "[Rooms] Failed to join room after creation:",
                      error
                    );
                    setToast({
                      message: "Failed to join room. Please try manually.",
                      visible: true,
                      type: "error",
                    });
                  }
                }
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-white">Chat Rooms</h1>
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
          />
        )}
      </div>
    </div>
  );
};

export default Rooms;
