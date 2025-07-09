import { CreateRoomForm, AppLayout } from "../components";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const { notifyRoomCreated } = useRoom();

  const onRoomCreated = (room: any, joinAfterCreate: boolean) => {
    console.log("[CreateRoomPage] Room created successfully:", room);

    // Notify all listeners about the new room
    notifyRoomCreated(room);

    if (joinAfterCreate && room?._id) {
      // Navigate to the room if user wants to join
      if (room.visibility === "private") {
        navigate(`/join/${room._id}`);
      } else {
        navigate(`/chat/${room._id}`);
      }
    } else {
      // Otherwise go back to rooms list
      navigate("/rooms");
    }
  };

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Room</h1>
        <CreateRoomForm onSuccess={onRoomCreated} />
      </div>
    </AppLayout>
  );
};

export default CreateRoomPage;
