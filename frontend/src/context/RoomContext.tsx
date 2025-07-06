import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

interface JoinRoomOptions {
  password?: string;
  delay?: number;
  name?: string;
}

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
  const listenersRef = useRef<RoomCreatedListener[]>([]);
  const navigate = useNavigate();

  const notifyRoomCreated = (room: any) => {
    listenersRef.current.forEach((listener) => listener(room));
  };

  const addRoomCreatedListener = useCallback(
    (listener: RoomCreatedListener) => {
      listenersRef.current.push(listener);
    },
    []
  );

  const removeRoomCreatedListener = useCallback(
    (listener: RoomCreatedListener) => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener);
    },
    []
  );

  const joinRoomWithLoading = async (
    roomId: string,
    options?: JoinRoomOptions
  ) => {
    if (!roomId) throw new Error("Invalid room ID");

    setIsJoiningRoom(true);

    try {
      // Ensure socket is connected
      if (!socket.connected) {
        socket.connect();
        await new Promise<void>((resolve) => {
          socket.once("connect", () => resolve());
        });
      }

      // Optional UX delay (e.g., for animations)
      if (options?.delay) {
        await new Promise((resolve) => setTimeout(resolve, options.delay));
      }

      let roomData: any = null;
      console.log();

      // For private or secret rooms, credentials are required
      if (options?.password || options?.name) {
        const { joinRoom } = await import("../api/rooms");
        roomData = await joinRoom(roomId, {
          password: options.password,
          name: options.name,
        });

        // Navigate only after successful credential validation
        navigate(`/chat/${roomId}`, {
          state: { roomData },
        });
      } else {
        // For public rooms, navigate immediately (no credentials needed)
        navigate(`/chat/${roomId}`);
      }

      setIsJoiningRoom(false);
    } catch (error) {
      console.error("[RoomContext] Error joining room:", error);
      setIsJoiningRoom(false);
      throw error; // Let calling component handle the error
    }
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

      {/* Global Joining Overlay */}
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
