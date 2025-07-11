import { useCallback } from "react";
import { useToast } from "./useToast";
import { useLoading } from "./useLoading";
import { useAuth } from "../context/AuthContext";
import { validateForm, authValidationSchemas } from "../utils/validation";

interface UseAuthApiReturn {
  loginWithApi: (credentials: {
    email: string;
    password: string;
  }) => Promise<boolean>;
  registerWithApi: (data: {
    username: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
  isLoading: (action?: string) => boolean;
  validateLoginForm: (data: { email: string; password: string }) => {
    isValid: boolean;
    errors: Record<string, string>;
  };
  validateRegisterForm: (data: {
    username: string;
    email: string;
    password: string;
  }) => { isValid: boolean; errors: Record<string, string> };
}

export const useAuthApi = (): UseAuthApiReturn => {
  const { showError, showSuccess } = useToast();
  const { withLoading, isLoading } = useLoading();
  const auth = useAuth();

  const validateLoginForm = useCallback(
    (data: { email: string; password: string }) => {
      return validateForm(data, authValidationSchemas.login);
    },
    []
  );

  const validateRegisterForm = useCallback(
    (data: { username: string; email: string; password: string }) => {
      return validateForm(data, authValidationSchemas.register);
    },
    []
  );

  const loginWithApi = useCallback(
    async (credentials: {
      email: string;
      password: string;
    }): Promise<boolean> => {
      // Validate form first
      const validation = validateLoginForm(credentials);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        showError(firstError);
        return false;
      }

      try {
        await withLoading("login", async () => {
          // Use auth.login which will throw enhanced errors from axios
          await auth.login(credentials);
        });

        showSuccess("Welcome back!");
        return true;
      } catch (error: any) {
        // The error should already be enhanced by axios interceptor

        // Use the user-friendly message from axios interceptor if available
        let message = error?.message;

        // If no message or still technical, provide specific auth messages
        if (
          !message ||
          message.includes("Server error") ||
          message.includes("status")
        ) {
          if (error?.response?.status === 401) {
            message =
              "Invalid email or password. Please check your credentials.";
          } else if (error?.response?.status === 400) {
            message = "Please enter a valid email and password.";
          } else if (error?.response?.status === 429) {
            message =
              "Too many login attempts. Please wait a moment before trying again.";
          } else if (error?.response?.status >= 500) {
            message =
              "Server is temporarily unavailable. Please try again later.";
          } else if (
            error?.code === "NETWORK_ERROR" ||
            error?.code === "CONNECTION_ERROR"
          ) {
            message =
              "Unable to connect to server. Please check your internet connection.";
          } else if (error?.code === "TIMEOUT_ERROR") {
            message = "Login request timed out. Please try again.";
          } else {
            message =
              "Login failed. Please check your credentials and try again.";
          }
        }

        showError(message);
        return false;
      }
    },
    [auth, withLoading, showError, showSuccess, validateLoginForm]
  );

  const registerWithApi = useCallback(
    async (data: {
      username: string;
      email: string;
      password: string;
    }): Promise<boolean> => {
      // Validate form first
      const validation = validateRegisterForm(data);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        showError(firstError);
        return false;
      }

      try {
        await withLoading("register", async () => {
          await auth.register(data);
        });

        showSuccess("Account created successfully! Welcome!");
        return true;
      } catch (error: any) {
        // Use the user-friendly message from axios interceptor if available
        let message = error?.message;

        // If no message or still technical, provide specific auth messages
        if (
          !message ||
          message.includes("Server error") ||
          message.includes("status")
        ) {
          if (error?.response?.status === 409) {
            message =
              "An account with this email address already exists. Please use a different email or try logging in.";
          } else if (error?.response?.status === 400) {
            message = "Please check your registration details and try again.";
          } else if (error?.response?.status === 429) {
            message =
              "Too many registration attempts. Please wait a moment before trying again.";
          } else if (error?.response?.status >= 500) {
            message =
              "Server is temporarily unavailable. Please try again later.";
          } else if (
            error?.code === "NETWORK_ERROR" ||
            error?.code === "CONNECTION_ERROR"
          ) {
            message =
              "Unable to connect to server. Please check your internet connection.";
          } else if (error?.code === "TIMEOUT_ERROR") {
            message = "Registration request timed out. Please try again.";
          } else {
            message =
              "Registration failed. Please check your information and try again.";
          }
        }

        showError(message);
        return false;
      }
    },
    [auth, withLoading, showError, showSuccess, validateRegisterForm]
  );

  return {
    loginWithApi,
    registerWithApi,
    isLoading,
    validateLoginForm,
    validateRegisterForm,
  };
};
