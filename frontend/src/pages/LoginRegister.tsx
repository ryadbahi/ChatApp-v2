import { useState } from "react";
import AuthForm from "../components/AuthForm";

const LoginRegister = () => {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center">
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
