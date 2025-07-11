import { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { socket } from "./socket";
import { ProtectedRoute } from "./components";
import { useSocketErrorHandler } from "./hooks/useSocketErrorHandler";

// Lazy load all pages for better code splitting
const LoginRegisterPage = lazy(() => import("./pages/LoginRegister"));
const ChatRoomWithUsers = lazy(() => import("./pages/ChatRoomWithUsers"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const Rooms = lazy(() => import("./pages/Rooms"));
const JoinPrivate = lazy(() => import("./pages/JoinPrivate"));
const DirectMessages = lazy(() => import("./pages/DirectMessages"));
const DirectMessageChat = lazy(() => import("./pages/DirectMessageChat"));
const SocketTest = lazy(() => import("./components/dev/SocketTest"));

// Loading fallback component
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-white text-lg font-medium">Loading...</p>
    </div>
  </div>
);
//import { useAuth } from "./context/AuthContext";

function App(): React.JSX.Element {
  //const { user, loading } = useAuth();

  // Set up global socket error handling
  useSocketErrorHandler(socket);

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}

export default App;
