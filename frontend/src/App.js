import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./LoginRegisterPage";
import DeviceData from "./DeviceData";
import AdminDevicesPage from "./pages/AdminDevicesPage";
import Layout from "./components/Layout";

function App() {
  const [user, setUser] = useState(localStorage.getItem("userEmail"));
  const [org, setOrg] = useState(localStorage.getItem("userOrg"));

  const handleLogin = (email, organisation) => {
    setUser(email);
    setOrg(organisation);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userOrg", organisation);
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userOrg");
    setUser(null);
    setOrg(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRegisterPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Layout userEmail={user} orgName={org} onLogout={handleLogout}>
                <DeviceData />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* <Route
          path="/admin/devices"
          element={
            user && org === "admin" ? (
              <Layout userEmail={user} orgName={org} onLogout={handleLogout}>
                <AdminDevicesPage />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        /> */}
      </Routes>
    </Router>
  );
}

export default App;
