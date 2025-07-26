import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./LoginRegisterPage";
import DeviceData from "./DeviceData";
import AdminDevicesPage from "./pages/AdminDevicesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import Layout from "./components/Layout";
import Navbar from "./components/Navbar";

function App() {
  const [user, setUser] = useState(localStorage.getItem("userEmail"));
  const [org, setOrg] = useState(localStorage.getItem("userOrg"));
  const [role, setRole] = useState(localStorage.getItem("userRole"));
  // console.log("App.js component loaded with user:", user, "and org:", org);

  const handleLogin = (email, organisation, user_role) => {
    
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userOrg", organisation);
    localStorage.setItem("userRole", user_role);
    setUser(email);
    setOrg(organisation);
    setRole(user_role);
    console.log("Handling login for user:", email, "with org:", organisation, "and role:", user_role);
    
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userOrg");
    localStorage.removeItem("userRole");
    setUser(null);
    setOrg(null);
    setRole(null);
    console.log("User logged out");
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRegisterPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Navbar userEmail={user} org={org} role={role}>
                <DeviceData />
              </Navbar>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/devices"
          element={
            user && role === "admin" ? (
              <Navbar userEmail={user} org={org} role={role}>
                <AdminDevicesPage />
              </Navbar>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            user && role === "admin" ? (
              <Navbar userEmail={user} org={org} role={role}>
                <AdminUsersPage />
              </Navbar>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}


export default App;

{/* <Routes>
        <Route path="/" element={<LoginRegisterPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Navbar
                userEmail={user}
                org={org}
                role={role}>
                <DeviceData />
              </Navbar>

              // <Layout userEmail={user} org={org} role={role} onLogout={handleLogout}>
              //   <DeviceData />
              // </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/devices"
          element={
            user && role === "admin" ? (
              <Navbar userEmail={user} org={org} role={role}>
                <AdminDevicesPage />
              </Navbar>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            user && role === "admin" ? (
              <Navbar userEmail={user} org={org} role={role}>
                <AdminUsersPage />
              </Navbar>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes> */}
