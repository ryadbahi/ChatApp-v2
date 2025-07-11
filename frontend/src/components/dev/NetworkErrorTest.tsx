import React from "react";
import { useToast } from "../../hooks/useToast";
import { useApi } from "../../hooks/useApi";
import axios from "../../api/axios";

// This component is for testing network error handling
// Remove it in production
const NetworkErrorTest: React.FC = () => {
  const { showError, showSuccess, showInfo } = useToast();
  const { callApi, isLoading } = useApi();

  const testNetworkError = async () => {
    try {
      await callApi(() => axios.get("/api/test/nonexistent"), {
        loadingKey: "test",
        errorMessage: "Custom error message for test",
      });
    } catch (error) {
      console.log("Caught error in component:", error);
    }
  };

  const testTimeoutError = async () => {
    try {
      await callApi(() => axios.get("/api/test/timeout", { timeout: 1000 }), {
        loadingKey: "timeout-test",
        errorMessage: "Request timed out",
      });
    } catch (error) {
      console.log("Caught timeout error:", error);
    }
  };

  const testToastTypes = () => {
    showError("This is an error message");
    setTimeout(() => showSuccess("This is a success message"), 1000);
    setTimeout(() => showInfo("This is an info message"), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 p-4 rounded-lg space-y-2">
      <p className="text-white text-sm font-bold">Error Testing (Dev Only)</p>
      <button
        onClick={testNetworkError}
        disabled={isLoading("test")}
        className="block w-full bg-red-600 text-white p-2 rounded text-sm"
      >
        {isLoading("test") ? "Testing..." : "Test Network Error"}
      </button>
      <button
        onClick={testTimeoutError}
        disabled={isLoading("timeout-test")}
        className="block w-full bg-orange-600 text-white p-2 rounded text-sm"
      >
        {isLoading("timeout-test") ? "Testing..." : "Test Timeout"}
      </button>
      <button
        onClick={testToastTypes}
        className="block w-full bg-blue-600 text-white p-2 rounded text-sm"
      >
        Test All Toasts
      </button>
    </div>
  );
};

export default NetworkErrorTest;
