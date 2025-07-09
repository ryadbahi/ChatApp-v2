// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { JSX } from "react";
import { AppLayout } from "../navigation";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, loading } = useAuth();

  console.log("[ProtectedRoute] render", {
    user,
    loading,
    pathname: window.location.pathname,
  });

  if (loading) return <p className="p-4">Loading...</p>;

  if (!user) {
    console.log("[ProtectedRoute] redirect to /login");
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}
