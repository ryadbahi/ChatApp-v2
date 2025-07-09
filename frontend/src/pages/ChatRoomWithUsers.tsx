import React, { useEffect } from "react";
import ChatRoom from "./ChatRoom";
import { RoomUsersList } from "../components";
import { useParams } from "react-router-dom";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";

const ChatRoomWithUsers: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId || !user) return;

    // Ensure connection
    if (!socket.connected) {
      socket.connect();
    }

    // Join room when component mounts
    socket.emit("joinRoom", { roomId });

    // Force a room users update request after a short delay
    const timer = setTimeout(() => {
      socket.emit("getRoomUsers", { roomId }, () => {
        // This callback ensures we get fresh user data
      });
    }, 100);

    // Cleanup: leave room when component unmounts
    return () => {
      clearTimeout(timer);
      socket.emit("leaveRoom", { roomId });
    };
  }, [roomId, user]);

  if (!roomId) return null;

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      <div className="md:w-1/7">
        <RoomUsersList roomId={roomId} />
      </div>
      <div className="flex-1">
        <ChatRoom />
      </div>
    </div>
  );
};

export default ChatRoomWithUsers;
