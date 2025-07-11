import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/ui/Toast";
import type { ToastType } from "../components/ui/Toast";

interface ToastContextProps {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextProps>({
  showToast: () => {},
  showError: () => {},
  showSuccess: () => {},
  showInfo: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
    duration: number;
  }>({
    message: "",
    type: "info",
    isVisible: false,
    duration: 3000,
  });

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      setToast({ message, type, isVisible: true, duration });
    },
    []
  );

  const showError = useCallback(
    (message: string, duration = 5000) => {
      showToast(message, "error", duration);
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string, duration = 3000) => {
      showToast(message, "success", duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration = 3000) => {
      showToast(message, "info", duration);
    },
    [showToast]
  );

  const handleClose = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <ToastContext.Provider
      value={{ showToast, showError, showSuccess, showInfo }}
    >
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={handleClose}
        duration={toast.duration}
      />
    </ToastContext.Provider>
  );
};
