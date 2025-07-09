import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-green-400" />;
      case "error":
        return <FaExclamationTriangle className="text-red-400" />;
      case "info":
        return <FaInfoCircle className="text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500/20 border-green-500/30";
      case "error":
        return "bg-red-500/20 border-red-500/30";
      case "info":
        return "bg-blue-500/20 border-blue-500/30";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 z-50"
        >
          <div
            className={`backdrop-blur-md p-4 rounded-lg shadow-lg border ${getBgColor()} 
                      flex items-center gap-3 max-w-md`}
          >
            {getIcon()}
            <p className="text-white">{message}</p>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors ml-auto"
            >
              <FaTimes />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
