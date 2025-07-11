import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthApi } from "../../hooks/useAuthApi";
import LoadingSpinner from "../ui/LoadingSpinner";

interface Props {
  isRegister: boolean;
  onToggle: () => void;
}

const AuthForm = ({ isRegister, onToggle }: Props) => {
  const {
    loginWithApi,
    registerWithApi,
    isLoading,
    validateLoginForm,
    validateRegisterForm,
  } = useAuthApi();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear field error when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (isRegister) {
      const validation = validateRegisterForm(form);
      if (!validation.isValid) {
        setFieldErrors(validation.errors);
        return;
      }
      await registerWithApi(form);
    } else {
      const validation = validateLoginForm({
        email: form.email,
        password: form.password,
      });
      if (!validation.isValid) {
        setFieldErrors(validation.errors);
        return;
      }
      await loginWithApi({ email: form.email, password: form.password });
    }
  };

  const isSubmitting = isLoading("login") || isLoading("register");

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
          <div>
            <input
              autoComplete="new-password"
              name="username"
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className={`w-full p-3 bg-white/30 rounded-lg placeholder-white/75 text-white focus:bg-white/40 ${
                fieldErrors.username ? "border-2 border-red-400" : ""
              }`}
              required
              disabled={isSubmitting}
            />
            {fieldErrors.username && (
              <p className="text-red-400 text-sm mt-1">
                {fieldErrors.username}
              </p>
            )}
          </div>
        )}

        <div>
          <input
            autoComplete="new-password" // disables autofill
            spellCheck="false"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className={`w-full p-3 bg-white/30 rounded-lg placeholder-white/75 text-white focus:bg-white/40 ${
              fieldErrors.email ? "border-2 border-red-400" : ""
            }`}
            required
            disabled={isSubmitting}
          />
          {fieldErrors.email && (
            <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <input
            autoComplete="new-password" // disables autofill
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className={`w-full p-3 bg-white/30 rounded-lg placeholder-white/75 text-white focus:bg-white/40 ${
              fieldErrors.password ? "border-2 border-red-400" : ""
            }`}
            required
            disabled={isSubmitting}
          />
          {fieldErrors.password && (
            <p className="text-red-400 text-sm mt-1">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full py-3 font-bold rounded-lg transition flex items-center justify-center gap-2
            ${
              isSubmitting
                ? "bg-white/40 text-white/60 cursor-not-allowed"
                : "bg-white/80 text-indigo-700 hover:bg-white"
            }
          `}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="small" color="text-indigo-700" />
              {isRegister ? "Creating Account..." : "Logging in..."}
            </>
          ) : isRegister ? (
            "Sign Up"
          ) : (
            "Login"
          )}
        </button>

        <p className="text-center text-white/80">
          {isRegister ? "Already have an account?" : "Don't have one yet?"}{" "}
          <button
            onClick={onToggle}
            className="underline hover:text-white transition-colors"
            disabled={isSubmitting}
            type="button"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </motion.form>
    </AnimatePresence>
  );
};

export default AuthForm;
