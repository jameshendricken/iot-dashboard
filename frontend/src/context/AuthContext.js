// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [userOrg, setUserOrg] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on startup
    const email = localStorage.getItem("userEmail");
    const org = localStorage.getItem("userOrg");
    const role = localStorage.getItem("userRole");

    if (email && org && role) {
      setUserEmail(email);
      setUserOrg(org);
      setUserRole(role);
    }
    setLoading(false);
  }, []);

  const login = (email, org, role) => {
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userOrg", org);
    localStorage.setItem("userRole", role);
    setUserEmail(email);
    setUserOrg(org);
    setUserRole(role);
  };

  const logout = () => {
    localStorage.clear();
    setUserEmail(null);
    setUserOrg(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ userEmail, userOrg, userRole, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
