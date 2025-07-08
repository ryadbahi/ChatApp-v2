import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5001", // Point to your backend
  withCredentials: true,
});

// Interceptor pour refresh automatique
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
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
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
