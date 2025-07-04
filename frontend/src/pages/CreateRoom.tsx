import CreateRoomForm from "../components/CreateRoomForm";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";

const CreateRoomPage = () => {
  const navigate = useNavigate();

  const onRoomCreated = () => {
    navigate("/rooms");
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
