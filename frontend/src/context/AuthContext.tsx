import { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { useTokenRefresh } from "../hooks/useTokenRefresh";

// Define the shape of a user
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

// Define the context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // Set up silent token refresh when user is authenticated
  useTokenRefresh(!!user);

  // Helper to avoid redirect loop
  const isOnLoginPage = () => window.location.pathname === "/login";

  // Check if user is still authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getTokenFromCookies();

        // Skip auth check if on login page and no token exists
        if (isOnLoginPage() && !token) {
          setUser(null);
          return;
        }

        // Try to get user info
        try {
          const res = await axios.get("/api/auth/me", {
            withCredentials: true,
          });
          setUser(res.data);

          // Connect socket with the token
          if (token && socket.disconnected) {
            socket.auth = { token };
            socket.connect();
          }
        } catch (err: any) {
          // If 401 and not on login page, try refresh
          if (err.response?.status === 401 && !isOnLoginPage()) {
            try {
              await axios.post("/api/auth/refresh", null, {
                withCredentials: true,
              });

              // Retry /me after refresh
              const retryRes = await axios.get("/api/auth/me", {
                withCredentials: true,
              });
              setUser(retryRes.data);

              const newToken = getTokenFromCookies();
              if (newToken && socket.disconnected) {
                socket.auth = { token: newToken };
                socket.connect();
              }
            } catch (refreshErr) {
              clearTokenFromCookies();
              setUser(null);
              if (socket.connected) socket.disconnect();
            }
          } else {
            // Other error or on login page
            clearTokenFromCookies();
            setUser(null);
            if (socket.connected) socket.disconnect();
          }
        }
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", credentials, {
        withCredentials: true,
      });
      setUser(res.data.user);

      // Connect socket
      const token = getTokenFromCookies();
      if (token && socket.disconnected) {
        socket.auth = { token };
        socket.connect();
      }

      // Always redirect to rooms after successful login
      navigate("/rooms");
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (data: {
    username: string;
    email: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/signup", data, {
        withCredentials: true,
      });
      setUser(res.data.user);

      // Connect socket
      const token = getTokenFromCookies();
      if (token && socket.disconnected) {
        socket.auth = { token };
        socket.connect();
      }

      // Redirect to rooms after successful registration
      navigate("/rooms");
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      // Call backend logout endpoint
      await axios.post("/api/auth/logout", null, {
        withCredentials: true,
      });
    } catch (err) {
      // Continue with cleanup even if backend call fails
    } finally {
      // Always clear user state and tokens
      setUser(null);
      clearTokenFromCookies();
      localStorage.clear();
      socket.disconnect();
      setLoading(false);

      // Navigate to login only if not already there
      if (!isOnLoginPage()) {
        navigate("/login");
      }
    }
  };

  // Update user function
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Only render children when auth check is done
  if (!authChecked) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Utility function to get token from cookies
const getTokenFromCookies = (): string | null => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1] || null
  );
};

// Utility function to clear tokens from cookies
const clearTokenFromCookies = (): void => {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie =
    "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};
