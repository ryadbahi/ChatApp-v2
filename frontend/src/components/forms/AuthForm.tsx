import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isRegister: boolean;
  onToggle: () => void;
}

const AuthForm = ({ isRegister, onToggle }: Props) => {
  const auth = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isRegister) await auth.register(form);
    else await auth.login({ email: form.email, password: form.password });
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.form
        key={isRegister ? "register" : "login"}
        onSubmit={handleSubmit}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <h2 className="text-3xl font-semibold text-white text-center">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>

        {isRegister && (
          <input
            autoComplete="new-password"
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="w-full p-3 bg-white/30 rounded-lg placeholder-white/75 text-white focus:bg-white/40"
            required
          />
        )}

        <input
          autoComplete="new-password" // disables autofill
          spellCheck="false"
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 bg-white/30 rounded-lg placeholder-white/75 text-white focus:bg-white/40"
          required
        />

        <input
          autoComplete="new-password" // disables autofill
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-3 bg-white/30 rounded-lg placeholder-white/75 text-white focus:bg-white/40"
          required
        />

        <button
          type="submit"
          className="
            w-full py-3 bg-white/80 text-indigo-700 font-bold rounded-lg
            hover:bg-white transition
          "
        >
          {isRegister ? "Sign Up" : "Login"}
        </button>

        <p className="text-center text-white/80">
          {isRegister ? "Already have an account?" : "Don't have one yet?"}{" "}
          <button onClick={onToggle} className="underline">
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </motion.form>
    </AnimatePresence>
  );
};

export default AuthForm;
