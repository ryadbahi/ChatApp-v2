import { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";
import axios from "axios";
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
  const navigate = useNavigate();

  // Check if user is still authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/api/auth/me", { withCredentials: true });
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
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
      setUser(res.data.user);
      // Reconnect socket with new token
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      socket.disconnect();
      if (token) {
        socket.auth = { token };
        socket.connect();
      }
      navigate("/rooms");
    } catch (err) {
      console.error("Register error", err);
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
      setUser(res.data.user);
      // Reconnect socket with new token
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      socket.disconnect();
      if (token) {
        socket.auth = { token };
        socket.connect();
      }
      navigate("/rooms");
    } catch (err) {
      console.error("Login error", err);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      await axios.post("/api/auth/logout", null, {
        withCredentials: true,
      });
      setUser(null);
      socket.disconnect();
      navigate("/login");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setLoading(false);
    }
  };

  // Update user function to update the user state after profile edits
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

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
