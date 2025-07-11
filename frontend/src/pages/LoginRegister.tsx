import { useState } from "react";
import { AuthForm } from "../components";
import { useToast } from "../hooks/useToast";
import { ErrorTestDebug } from "../components/debug/ErrorTestDebug";

const LoginRegister = () => {
  const [isRegister, setIsRegister] = useState(false);
  const { showError, showSuccess, showInfo } = useToast();

  // Temporary test function - remove in production
  const testToast = () => {
    showError("Test error message");
    setTimeout(() => showSuccess("Test success message"), 1000);
    setTimeout(() => showInfo("Test info message"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Debug panel */}
      <ErrorTestDebug />

      {/* Temporary test button - remove in production */}
      <button
        onClick={testToast}
        className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Test Toast
      </button>

      <div
        className="
        w-full max-w-md
        h-[450px]
        bg-white/10 backdrop-blur-md
        border border-white/20
        rounded-2xl shadow-2xl
        p-8
      "
      >
        <AuthForm
          isRegister={isRegister}
          onToggle={() => setIsRegister(!isRegister)}
        />
      </div>
    </div>
  );
};

export default LoginRegister;
