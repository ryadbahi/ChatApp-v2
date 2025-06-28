import { Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegister";
import ChatPage from "./pages/ChatRoom";
import ProfilePage from "./pages/Profile";
import JoinPrivate from "./pages/JoinPrivate";

import ProtectedRoute from "./components/ProtectedRoute";

function App(): React.JSX.Element {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginRegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
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
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

export default App;
