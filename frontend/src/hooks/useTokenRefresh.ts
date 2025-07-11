import { useEffect, useRef } from "react";
import axios from "../api/axios";

export const useTokenRefresh = (isAuthenticated: boolean) => {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if user is not authenticated
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Set up silent refresh - refresh token every 14 minutes (1 minute before expiry)
    const setupSilentRefresh = () => {
      refreshIntervalRef.current = setInterval(async () => {
        try {
          await axios.post("/api/auth/refresh", null, {
            withCredentials: true,
          });
        } catch (error) {
          // Don't redirect here - let the axios interceptor handle it
          // The interceptor will redirect to login if refresh fails
        }
      }, 14 * 60 * 1000); // 14 minutes
    };

    setupSilentRefresh();

    // Cleanup on unmount or when authentication changes
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isAuthenticated]);

  // Manual refresh function that can be called when needed
  const refreshToken = async (): Promise<boolean> => {
    try {
      await axios.post("/api/auth/refresh", null, {
        withCredentials: true,
      });
      return true;
    } catch (error) {
      console.error("[TokenRefresh] Manual refresh failed:", error);
      return false;
    }
  };

  return { refreshToken };
};
