import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./LoginRegisterPage";
import DeviceData from "./DeviceData";
import AdminDevicesPage from "./pages/AdminDevicesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import Layout from "./components/Layout";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";

function AppRoutes() {
  const { userEmail, userOrg, userRole } = useAuth();

  return (
    <>
      {userEmail && <Navbar userEmail={userEmail} org={userOrg} role={userRole} />}
      <Routes>
        <Route
          path="/"
          element={
            userEmail ? <Navigate to="/dashboard" replace /> : <LoginRegisterPage />
          }
        />
        <Route
          path="/dashboard"
          element={
            userEmail ? <DeviceData /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/admin/devices"
          element={
            userEmail && userRole === "admin" ? <AdminDevicesPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/admin/users"
          element={
            userEmail && userRole === "admin" ? <AdminUsersPage /> : <Navigate to="/" replace />
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
