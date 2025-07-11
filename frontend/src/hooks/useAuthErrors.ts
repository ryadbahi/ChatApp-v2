import { useCallback } from "react";
import { useToast } from "./useToast";
import { useLoading } from "./useLoading";

interface UseAuthErrorsReturn {
  handleAuthError: (error: any, action?: string) => void;
  handleLoginError: (error: any) => void;
  handleRegisterError: (error: any) => void;
  withAuthErrorHandling: <T>(
    action: string,
    asyncFn: () => Promise<T>
  ) => Promise<T | undefined>;
}

export const useAuthErrors = (): UseAuthErrorsReturn => {
  const { showError, showInfo } = useToast();
  const { withLoading } = useLoading();

  const getErrorMessage = (error: any, action: string): string => {
    const code = error?.code || "UNKNOWN_ERROR";
    const defaultMessage = error?.message || `Failed to ${action}`;

    // Map specific error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
      USER_NOT_FOUND: "No account found with this email address.",
      EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
      WEAK_PASSWORD: "Password must be at least 8 characters long.",
      INVALID_EMAIL: "Please enter a valid email address.",
      NETWORK_ERROR: "Connection error. Please check your internet connection.",
      TIMEOUT_ERROR: "Request timed out. Please try again.",
      SESSION_EXPIRED: "Your session has expired. Please log in again.",
      UNAUTHORIZED: "You are not authorized to perform this action.",
      SERVER_ERROR: "Server error. Please try again later.",
      VALIDATION_ERROR: "Please check your input and try again.",
      TOO_MANY_REQUESTS:
        "Too many attempts. Please wait a moment before trying again.",
    };

    return errorMessages[code] || defaultMessage;
  };

  const handleAuthError = useCallback(
    (error: any, action = "complete the action") => {
      const message = getErrorMessage(error, action);
      const status = error?.status || 500;

      // Show appropriate error message
      showError(message);

      // Log error for debugging
      console.error(`Auth Error [${action}]:`, {
        message: error?.message,
        code: error?.code,
        status,
        timestamp: new Date().toISOString(),
      });

      // Handle specific error codes with additional actions
      if (error?.code === "SESSION_EXPIRED" || status === 401) {
        // Don't redirect if already on login page
        if (window.location.pathname !== "/login") {
          showInfo("Please log in again.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        }
      }
    },
    [showError, showInfo]
  );

  const handleLoginError = useCallback(
    (error: any) => {
      handleAuthError(error, "log in");
    },
    [handleAuthError]
  );

  const handleRegisterError = useCallback(
    (error: any) => {
      handleAuthError(error, "create account");
    },
    [handleAuthError]
  );

  const withAuthErrorHandling = useCallback(
    async <T>(
      action: string,
      asyncFn: () => Promise<T>
    ): Promise<T | undefined> => {
      try {
        return await withLoading(action, asyncFn);
      } catch (error) {
        handleAuthError(error, action);
        return undefined;
      }
    },
    [withLoading, handleAuthError]
  );

  return {
    handleAuthError,
    handleLoginError,
    handleRegisterError,
    withAuthErrorHandling,
  };
};
