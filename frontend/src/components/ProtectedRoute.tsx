// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { JSX } from "react";
import AppLayout from "./AppLayout";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-4">Loading...</p>;

  if (!user) return <Navigate to="/login" replace />;

  return <AppLayout>{children}</AppLayout>;
}
