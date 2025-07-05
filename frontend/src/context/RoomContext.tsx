import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

interface JoinRoomOptions {
  password?: string;
  delay?: number;
  name?: string;
}

// Room creation event listeners
type RoomCreatedListener = (room: any) => void;

interface RoomContextType {
  isJoiningRoom: boolean;
  joinRoomWithLoading: (
    roomId: string,
    options?: JoinRoomOptions
  ) => Promise<void>;
  notifyRoomCreated: (room: any) => void;
  addRoomCreatedListener: (listener: RoomCreatedListener) => void;
  removeRoomCreatedListener: (listener: RoomCreatedListener) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [roomCreatedListeners, setRoomCreatedListeners] = useState<
    RoomCreatedListener[]
  >([]);
  const navigate = useNavigate();

  const notifyRoomCreated = (room: any) => {
    roomCreatedListeners.forEach((listener) => listener(room));
  };

  const addRoomCreatedListener = React.useCallback(
    (listener: RoomCreatedListener) => {
      setRoomCreatedListeners((prev) => [...prev, listener]);
    },
    []
  );

  const removeRoomCreatedListener = React.useCallback(
    (listener: RoomCreatedListener) => {
      setRoomCreatedListeners((prev) => prev.filter((l) => l !== listener));
    },
    []
  );

  const joinRoomWithLoading = async (
    roomId: string,
    options?: JoinRoomOptions
  ) => {
    setIsJoiningRoom(true);

    try {
      // Ensure socket connection
      if (!socket.connected) {
        socket.connect();
      }

      // Add optional delay for smooth UX
      if (options?.delay) {
        await new Promise((resolve) => setTimeout(resolve, options.delay));
      }

      // If a password or name is provided, we need to join the room first
      if (options?.password || options?.name) {
        const { joinRoom } = await import("../api/rooms");
        await joinRoom(roomId, {
          password: options.password,
          name: options.name,
        });
      }

      // Navigate to the room
      await new Promise((r) => setTimeout(r, 200));
      console.log("[joinRoomWithLoading] navigating to", `/chat/${roomId}`);
      navigate(`/chat/${roomId}`);
      console.log("[joinRoomWithLoading] navigation done");
    } catch (error) {
      console.error("[RoomContext] Error joining room:", error);
      setIsJoiningRoom(false);
      throw error; // Let the calling component handle the error
    }

    // Keep loading state for a bit after navigation to ensure smooth transition
    setTimeout(() => {
      setIsJoiningRoom(false);
    }, 500);
  };

  return (
    <RoomContext.Provider
      value={{
        isJoiningRoom,
        joinRoomWithLoading,
        notifyRoomCreated,
        addRoomCreatedListener,
        removeRoomCreatedListener,
      }}
    >
      {children}
      {/* Global Loading Overlay */}
      {isJoiningRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-400 rounded-full border-t-transparent"></div>
              <p className="text-white text-lg font-medium">Joining room...</p>
            </div>
          </div>
        </div>
      )}
    </RoomContext.Provider>
  );
};
