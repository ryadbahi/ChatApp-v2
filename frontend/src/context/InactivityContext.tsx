import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { socket, logoutUser } from "../socket";
import { InactivityWarning } from "../components";

interface InactivityContextType {
  showWarning: boolean;
  timeLeft: number;
  extendSession: () => void;
  logout: () => void;
}

const InactivityContext = createContext<InactivityContextType | undefined>(
  undefined
);

interface InactivityProviderProps {
  children: ReactNode;
}

export const InactivityProvider: React.FC<InactivityProviderProps> = ({
  children,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Listen for inactivity warning
    const handleInactivityWarning = (data: {
      message: string;
      timeLeft: number;
    }) => {
      console.log("[Inactivity] Warning received:", data);
      setShowWarning(true);
      setTimeLeft(data.timeLeft);
    };

    // Listen for inactivity disconnect
    const handleInactivityDisconnect = (data: { message: string }) => {
      console.log("[Inactivity] Forced disconnect:", data);
      setShowWarning(false);
      logoutUser();
    };

    // Listen for socket disconnect
    const handleDisconnect = (reason: string) => {
      console.log("[Socket] Disconnected:", reason);
      // If disconnected by server or due to error, logout user
      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect"
      ) {
        logoutUser();
      }
    };

    // Listen for connection errors
    const handleConnectError = (error: Error) => {
      console.error("[Socket] Connection error:", error);
      // If token is invalid, logout user
      if (
        error.message === "Invalid token" ||
        error.message === "No token provided"
      ) {
        logoutUser();
      }
    };

    socket.on("inactivityWarning", handleInactivityWarning);
    socket.on("inactivityDisconnect", handleInactivityDisconnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("inactivityWarning", handleInactivityWarning);
      socket.off("inactivityDisconnect", handleInactivityDisconnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  const extendSession = () => {
    setShowWarning(false);
    // Send activity to reset the timer
    if (socket.connected) {
      socket.emit("userActivity");
    }
  };

  const logout = () => {
    setShowWarning(false);
    socket.disconnect();
    logoutUser();
  };

  return (
    <InactivityContext.Provider
      value={{ showWarning, timeLeft, extendSession, logout }}
    >
      {children}
      <InactivityWarning
        show={showWarning}
        timeLeft={timeLeft}
        onExtendSession={extendSession}
        onLogout={logout}
      />
    </InactivityContext.Provider>
  );
};

export const useInactivity = () => {
  const context = useContext(InactivityContext);
  if (context === undefined) {
    throw new Error("useInactivity must be used within an InactivityProvider");
  }
  return context;
};
