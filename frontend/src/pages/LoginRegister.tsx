import { useState, useEffect } from "react";
import { AuthForm } from "../components";

const LoginRegister = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center relative">
            <h2 className="text-2xl font-bold text-indigo-600 mb-2">
              Welcome to AuraRooms!
            </h2>
            <p className="mb-4 text-gray-700">
              This is my <strong>LiveChat App</strong> project and I am very
              proud of it.
              <br />
              <span className="font-semibold text-red-500">Important:</span> The
              backend is hosted on Render and may be sleeping.
              <br />
              Please{" "}
              <a
                href="https://chatapp-v2-voa9.onrender.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                visit the backend
              </a>{" "}
              first to wake it up.
              <br />
              Once you see the message there, come back here to register or
              login!
            </p>
            <button
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              onClick={() => setShowModal(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      <div className="w-full max-w-md h-[450px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
        <AuthForm
          isRegister={isRegister}
          onToggle={() => setIsRegister(!isRegister)}
        />
      </div>
    </div>
  );
};

export default LoginRegister;
