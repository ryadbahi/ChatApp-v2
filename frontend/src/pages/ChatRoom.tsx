import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ChatRoom = () => {
  const { id } = useParams();
  const { user } = useAuth();

  if (!id) return <p className="p-4 text-red-600">Room ID is missing.</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Room ID: {id}</h1>
      <p>Welcome, {user?.username}!</p>
      <p>This is where messages will appear and be sent in real time.</p>
    </div>
  );
};

export default ChatRoom;
