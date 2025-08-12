// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginRegisterPage from "./LoginRegisterPage";
import DeviceData from "./pages/DeviceData";
import TailwindTest from "./pages/TailwindTest";
import AdminDevicesPage from "./pages/AdminDevicesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminOrgsPage from "./pages/AdminOrgPage";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ResetPasswordPage from "./pages/ResetPassword";
import UnitData from "./pages/UnitData";

// import Navbar from "../assets/js/Navbar2";
import Navbar from "./assets/js/Navbar2";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./theme/ThemeProvider.tsx";
import "./assets/css/base/global.css";

import { RequireAuth, RequireAdmin } from "./routes/guards";

function AppRoutes() {
  const { userEmail, userOrg, userRole, logout } = useAuth?.() || {};

  const handleLogout = async () => {
    try {
      if (typeof logout === "function") await logout();
    } finally {
      window.location.assign("/");
    }
  };

  // Navbar items filtered by role
  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/units", label: "Units" },
    ...(userRole === "admin"
      ? [
          { to: "/admin/devices", label: "Admin Devices" },
          { to: "/admin/users", label: "Admin Users" },
          { to: "/admin/organisations", label: "Admin Orgs" },
        ]
      : []),
  ];

  return (
    <ThemeProvider>
      <div className="site-theme min-h-screen flex flex-col">
        {userEmail && (
          <Navbar
            title="IoT Dashboard"
            navItems={navItems}
            userEmail={userEmail}
            org={userOrg}
            role={userRole}
            onLogout={handleLogout}
          />
        )}

        <div className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                userEmail ? <Navigate to="/dashboard" replace /> : <LoginPage />
              }
            />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Authenticated-only routes */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DeviceData />} />
              <Route path="/units" element={<UnitData />} />

              {/* Admin-only routes */}
              <Route element={<RequireAdmin />}>
                <Route path="/admin/devices" element={<AdminDevicesPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/organisations" element={<AdminOrgsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
