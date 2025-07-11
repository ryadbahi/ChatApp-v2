import { useCallback } from "react";
import { useToast } from "./useToast";
import { useLoading } from "./useLoading";
import { logger } from "../utils/logger";

interface UseApiReturn {
  callApi: <T>(
    apiCall: () => Promise<T>,
    options?: {
      loadingKey?: string;
      successMessage?: string;
      errorMessage?: string;
      showSuccess?: boolean;
      suppressErrorToast?: boolean; // Allow components to handle errors themselves
    }
  ) => Promise<T>;
  callApiSafe: <T>(
    apiCall: () => Promise<T>,
    options?: {
      loadingKey?: string;
      successMessage?: string;
      errorMessage?: string;
      showSuccess?: boolean;
    }
  ) => Promise<T | undefined>;
  isLoading: (key?: string) => boolean;
}

export const useApi = (): UseApiReturn => {
  const { showSuccess, showError } = useToast();
  const { withLoading, isLoading } = useLoading();

  const callApi = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      options: {
        loadingKey?: string;
        successMessage?: string;
        errorMessage?: string;
        showSuccess?: boolean;
        suppressErrorToast?: boolean;
      } = {}
    ): Promise<T> => {
      const {
        loadingKey = "api",
        successMessage,
        errorMessage,
        showSuccess: showSuccessToast = false,
        suppressErrorToast = false,
      } = options;

      try {
        const result = await withLoading(loadingKey, apiCall);

        if (showSuccessToast && successMessage) {
          showSuccess(successMessage);
        }

        return result;
      } catch (error) {
        // Log the error
        logger.apiError("API Call", "unknown", error);

        // Show user-friendly error message unless suppressed
        if (!suppressErrorToast) {
          const message =
            errorMessage || (error as any)?.message || "An error occurred";
          showError(message);
        }

        // Re-throw the error so calling code can handle it if needed
        throw error;
      }
    },
    [withLoading, showSuccess, showError]
  );

  const callApiSafe = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      options: {
        loadingKey?: string;
        successMessage?: string;
        errorMessage?: string;
        showSuccess?: boolean;
      } = {}
    ): Promise<T | undefined> => {
      try {
        return await callApi(apiCall, options);
      } catch (error) {
        return undefined;
      }
    },
    [callApi]
  );

  return { callApi, callApiSafe, isLoading };
};

// Example usage in a component:
/*
const MyComponent = () => {
  const { callApi, isLoading } = useApi();
  
  const handleLogin = async () => {
    const result = await callApi(
      () => axios.post("/api/auth/login", { email, password }),
      {
        loadingKey: "login",
        successMessage: "Login successful!",
        errorMessage: "Failed to log in",
        showSuccess: true
      }
    );
    
    if (result) {
      // Handle successful login
    }
  };
  
  return (
    <button 
      onClick={handleLogin}
      disabled={isLoading("login")}
    >
      {isLoading("login") ? "Logging in..." : "Login"}
    </button>
  );
};
*/
