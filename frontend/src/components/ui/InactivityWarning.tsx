import React, { useState, useEffect } from "react";

interface InactivityWarningProps {
  show: boolean;
  timeLeft: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

const InactivityWarning: React.FC<InactivityWarningProps> = ({
  show,
  timeLeft,
  onExtendSession,
  onLogout,
}) => {
  const [countdown, setCountdown] = useState(Math.floor(timeLeft / 1000));

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, timeLeft]);

  useEffect(() => {
    if (show) {
      setCountdown(Math.floor(timeLeft / 1000));
    }
  }, [show, timeLeft]);

  if (!show) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Session Timeout Warning
          </h3>

          <p className="text-gray-600 mb-4">
            You will be logged out due to inactivity in:
          </p>

          <div className="text-2xl font-bold text-red-600 mb-6">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onExtendSession}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Stay Logged In
            </button>
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarning;
