import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { socket } from "./socket";
import LoginRegisterPage from "./pages/LoginRegister";
import ChatRoomWithUsers from "./pages/ChatRoomWithUsers";
import ProfilePage from "./pages/Profile";
import Rooms from "./pages/Rooms";
import JoinPrivate from "./pages/JoinPrivate";
import DirectMessages from "./pages/DirectMessages";
import DirectMessageChat from "./pages/DirectMessageChat";
import SocketTest from "./components/SocketTest";
import ProtectedRoute from "./components/ProtectedRoute";
//import { useAuth } from "./context/AuthContext";

function App(): React.JSX.Element {
  //const { user, loading } = useAuth();
  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (token) {
      socket.auth = { token };
      socket.connect();
    }

    // Only disconnect on app close, not on navigation!
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginRegisterPage />} />
      <Route path="/socket" element={<SocketTest />} />

      {/* Protected routes */}
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <Rooms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:roomId"
        element={
          <ProtectedRoute>
            <ChatRoomWithUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/join/:roomId"
        element={
          <ProtectedRoute>
            <JoinPrivate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Direct Messages routes */}
      <Route
        path="/direct-messages"
        element={
          <ProtectedRoute>
            <DirectMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/direct-message/:userId"
        element={
          <ProtectedRoute>
            <DirectMessageChat />
          </ProtectedRoute>
        }
      />

      {/* Default fallback - redirect based on auth status */}
      <Route path="/" element={<Navigate to="/rooms" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
