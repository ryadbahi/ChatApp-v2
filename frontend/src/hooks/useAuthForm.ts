import { useCallback } from "react";
import { useToast } from "./useToast";
import { useLoading } from "./useLoading";
import { useAuth } from "../context/AuthContext";
import { validateForm, authValidationSchemas } from "../utils/validation";

interface UseAuthFormReturn {
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  register: (data: {
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

export const useAuthForm = (): UseAuthFormReturn => {
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

  const login = useCallback(
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
          await auth.login(credentials);
        });

        showSuccess("Welcome back!");
        return true;
      } catch (error: any) {
        // Enhanced error messages for login
        let message = "Login failed. Please try again.";

        if (error?.code === "INVALID_CREDENTIALS") {
          message = "Invalid email or password. Please check your credentials.";
        } else if (
          error?.code === "NETWORK_ERROR" ||
          error?.code === "CONNECTION_ERROR"
        ) {
          message =
            "Unable to connect to server. Please check your internet connection.";
        } else if (error?.code === "TIMEOUT_ERROR") {
          message = "Login request timed out. Please try again.";
        } else if (error?.message) {
          message = error.message;
        }

        showError(message);
        return false;
      }
    },
    [auth, withLoading, showError, showSuccess, validateLoginForm]
  );

  const register = useCallback(
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
        // Enhanced error messages for registration
        let message = "Registration failed. Please try again.";

        if (error?.code === "EMAIL_ALREADY_EXISTS") {
          message =
            "An account with this email already exists. Please try logging in instead.";
        } else if (error?.code === "USERNAME_TAKEN") {
          message =
            "This username is already taken. Please choose another one.";
        } else if (
          error?.code === "NETWORK_ERROR" ||
          error?.code === "CONNECTION_ERROR"
        ) {
          message =
            "Unable to connect to server. Please check your internet connection.";
        } else if (error?.code === "TIMEOUT_ERROR") {
          message = "Registration request timed out. Please try again.";
        } else if (error?.message) {
          message = error.message;
        }

        showError(message);
        return false;
      }
    },
    [auth, withLoading, showError, showSuccess, validateRegisterForm]
  );

  return {
    login,
    register,
    isLoading,
    validateLoginForm,
    validateRegisterForm,
  };
};
