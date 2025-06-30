import { Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegister";
import ChatRoom from "./pages/ChatRoom";
import ProfilePage from "./pages/Profile";
import JoinPrivate from "./pages/JoinPrivate";
import Rooms from "./pages/Rooms";

import ProtectedRoute from "./components/ProtectedRoute";

function App(): React.JSX.Element {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginRegisterPage />} />

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
