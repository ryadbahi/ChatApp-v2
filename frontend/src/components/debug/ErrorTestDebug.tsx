import { useToast } from "../../hooks/useToast";

// Debug component to test error handling
export const ErrorTestDebug = () => {
  const { showError } = useToast();

  const testBasicToast = () => {
    console.log("Testing basic toast...");
    showError("This is a test error message!");
  };

  const testNetworkError = async () => {
    console.log("Testing network error...");
    try {
      const response = await fetch("http://localhost:5001/api/nonexistent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: "data" }),
      });
      console.log("Response:", response);
    } catch (error) {
      console.error("Network error caught:", error);
      showError("Network error occurred!");
    }
  };

  const testAxiosError = async () => {
    console.log("Testing axios error...");
    try {
      const axios = (await import("../../api/axios")).default;
      await axios.post("/api/auth/login", {
        email: "wrong",
        password: "wrong",
      });
    } catch (error) {
      console.error("Axios error caught:", error);
      showError("Axios error occurred!");
    }
  };

  return (
    <div className="fixed top-4 left-4 bg-black/80 p-4 rounded-lg space-y-2 z-50">
      <p className="text-white text-sm font-bold">Error Debug Panel</p>
      <button
        onClick={testBasicToast}
        className="block w-full bg-red-600 text-white p-2 rounded text-sm"
      >
        Test Basic Toast
      </button>
      <button
        onClick={testNetworkError}
        className="block w-full bg-orange-600 text-white p-2 rounded text-sm"
      >
        Test Network Error
      </button>
      <button
        onClick={testAxiosError}
        className="block w-full bg-blue-600 text-white p-2 rounded text-sm"
      >
        Test Axios Error
      </button>
    </div>
  );
};
