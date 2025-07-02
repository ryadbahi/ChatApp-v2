import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { socket } from "./socket";
import LoginRegisterPage from "./pages/LoginRegister";
import ChatRoom from "./pages/ChatRoom";
import ProfilePage from "./pages/Profile";
import Rooms from "./pages/Rooms";
import SocketTest from "./components/SocketTest";
import ProtectedRoute from "./components/ProtectedRoute";

function App(): React.JSX.Element {
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
            <ChatRoom />
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

      {/* Default fallback */}
      <Route path="*" element={<Navigate to="/rooms" replace />} />
    </Routes>
  );
}

export default App;
