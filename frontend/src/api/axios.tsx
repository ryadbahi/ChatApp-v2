import axios from "axios";

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const instance = axios.create({
  baseURL: VITE_BACKEND_URL, // Use env var in production
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Global error handler for user-friendly messages
const handleApiError = (error: any) => {
  const response = error.response;
  const errorData = response?.data?.error;

  // Handle network errors (no response)
  if (!response) {
    if (error.code === "ECONNABORTED") {
      return {
        message:
          "Request timed out. Please check your connection and try again.",
        code: "TIMEOUT_ERROR",
        status: 408,
        originalError: error,
      };
    }

    if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error")
    ) {
      return {
        message:
          "Unable to connect to server. Please check your internet connection.",
        code: "NETWORK_ERROR",
        status: 0,
        originalError: error,
      };
    }

    // CORS or other network issues
    return {
      message: "Connection failed. The server may be unavailable.",
      code: "CONNECTION_ERROR",
      status: 0,
      originalError: error,
    };
  }

  // Create a user-friendly error object for server responses
  let userMessage = errorData?.message;

  // If no custom message from backend, create user-friendly messages based on status code
  if (!userMessage) {
    switch (response.status) {
      case 400:
        userMessage = "Invalid request. Please check your input and try again.";
        break;
      case 401:
        userMessage =
          "Invalid email or password. Please check your credentials.";
        break;
      case 403:
        userMessage = "You don't have permission to perform this action.";
        break;
      case 404:
        userMessage = "The requested resource was not found.";
        break;
      case 409:
        userMessage =
          "This email is already registered. Please try logging in instead.";
        break;
      case 422:
        userMessage = "Please check your input and try again.";
        break;
      case 429:
        userMessage =
          "Too many attempts. Please wait a moment before trying again.";
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        userMessage =
          "Server is temporarily unavailable. Please try again later.";
        break;
      default:
        userMessage = "An unexpected error occurred. Please try again.";
    }
  }

  const userError = {
    message: userMessage,
    code: errorData?.code || "SERVER_ERROR",
    status: response?.status || 500,
    originalError: error,
  };

  // Log detailed error for debugging (in production, send to logging service)
  console.error("API Error:", {
    url: error.config?.url,
    method: error.config?.method,
    status: response?.status,
    message: userError.message,
    code: userError.code,
    timestamp: new Date().toISOString(),
  });

  return userError;
};

// Interceptor pour refresh automatique
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 with token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        await instance.post("/api/auth/refresh");
        return instance(originalRequest);
      } catch (refreshError) {
        // Only redirect if not already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(handleApiError(refreshError));
      }
    }

    // For all other errors, process and reject with user-friendly error
    return Promise.reject(handleApiError(error));
  }
);

export default instance;
