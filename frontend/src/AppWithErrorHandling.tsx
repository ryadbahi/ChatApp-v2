import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./hooks/useToast";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { logger } from "./utils/logger";

// Example of how to wrap your main app with error handling
const App: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error to your logging service
        logger.error("React Error Boundary", {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            {/* Your app components */}
            <div className="app">
              {/* Your routes and components go here */}
            </div>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
