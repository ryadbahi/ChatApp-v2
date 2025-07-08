import { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

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
  const [authChecked, setAuthChecked] = useState(false); // NEW: know when auth is done
  const navigate = useNavigate();
  // Helper to avoid redirect loop
  const isOnLoginPage = () => window.location.pathname === "/login";

  // Check if user is still authenticated on mount, with refresh fallback
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from cookies
        const token = getTokenFromCookies();
        console.log("[Auth] Checking auth, token exists:", !!token);

        // Always try to get user info, even if token is missing (refresh may work)
        let res;
        try {
          res = await axios.get("/api/auth/me", {
            withCredentials: true,
          });
          console.log("[Auth] Backend verification successful:", res.data);
          setUser(res.data);

          // Connect socket with the token
          if (token && socket.disconnected) {
            socket.auth = { token };
            socket.connect();
          }
        } catch (err: any) {
          // If 401, try refresh
          if (err.response && err.response.status === 401) {
            try {
              console.log("[Auth] Token expired, trying refresh...");
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
              console.log("[Auth] Refresh failed, logging out", refreshErr);
              clearTokenFromCookies();
              setUser(null);
              if (socket.connected) socket.disconnect();
            }
          } else {
            // Other error
            clearTokenFromCookies();
            setUser(null);
            if (socket.connected) socket.disconnect();
          }
        }
      } finally {
        setLoading(false);
        setAuthChecked(true); // NEW: auth check done
      }
    };
    checkAuth();
  }, []);

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
      console.log("[Auth] Registration successful:", res.data.user);
      setUser(res.data.user);

      // Connect socket with new token
      const token = getTokenFromCookies();
      if (token) {
        socket.auth = { token };
        if (socket.disconnected) {
          socket.connect();
        }
      }
      navigate("/rooms");
    } catch (err) {
      console.error("[Auth] Register error", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", credentials, {
        withCredentials: true,
      });
      console.log("[Auth] Login successful:", res.data.user);
      setUser(res.data.user);

      // Connect socket with new token
      const token = getTokenFromCookies();
      if (token) {
        socket.auth = { token };
        if (socket.disconnected) {
          socket.connect();
        }
      }
      navigate("/rooms");
    } catch (err) {
      console.error("[Auth] Login error", err);
      throw err;
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
      console.error("Logout error", err);
    } finally {
      // Always clear user state and tokens, even if backend call fails
      setUser(null);

      // Clear token from cookies
      clearTokenFromCookies();

      // Clear any localStorage items
      localStorage.clear();

      // Disconnect socket
      socket.disconnect();

      setLoading(false);

      // Navigate to login only if not already there
      if (!isOnLoginPage()) {
        navigate("/login");
      }
    }
  };

  // Update user function to update the user state after profile edits
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // DEBUG: log render state
  console.log("AuthProvider render", {
    user,
    loading,
    authChecked,
    pathname: window.location.pathname,
  });
  // Only render children when auth check is done, else show loader (prevents redirect loop)
  if (!authChecked) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        Chargement...
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

// Utility function to clear token from cookies
const clearTokenFromCookies = (): void => {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};
