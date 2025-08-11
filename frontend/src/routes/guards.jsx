// src/routes/guards.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth() {
  const { userEmail } = useAuth?.() || {};
  const location = useLocation();

  if (!userEmail) {
    // send unauthenticated users to login; preserve the attempted URL
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function RequireAdmin() {
  const { userEmail, userRole } = useAuth?.() || {};
  const location = useLocation();

  if (!userEmail) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  if (userRole !== "admin") {
    // authenticated but not authorized → redirect somewhere safe
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
