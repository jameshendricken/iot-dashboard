
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginRegisterPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userEmail) {
      onLogin(userEmail);
      navigate("/dashboard");
    }
  }, [userEmail, navigate, onLogin]);

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setFormData({ email: "", password: "", confirmPassword: "" });
    setError("");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isRegistering && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const endpoint = isRegistering ? "/register" : "/login";
    try {
      const res = await fetch(`https://iot-backend-p66k.onrender.com${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");
      localStorage.setItem("userEmail", formData.email);
      setUserEmail(formData.email);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setUserEmail(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {userEmail && (
        <header className="w-full bg-white shadow p-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">Logged in as: <strong>{userEmail}</strong></span>
          <button onClick={handleLogout} className="text-indigo-600 hover:underline">Logout</button>
        </header>
      )}
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">
            {isRegistering ? "Create an Account" : "Sign In to Dashboard"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
            >
              {isRegistering ? "Register" : "Login"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
            <button onClick={toggleMode} className="text-indigo-600 hover:underline ml-2">
              {isRegistering ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
