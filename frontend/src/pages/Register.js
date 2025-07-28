import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_BASE;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;
  const getPasswordStrength = (password) => {
    if (password.length < 6) return "Weak";
    if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.match(/[^a-zA-Z0-9]/)) return "Strong";
    return "Moderate";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    if (!validatePassword(formData.password)) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");

      setSuccess(true);
      setTimeout(() => {
        login(data.email, data.org, data.role, data.name);
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8 overflow-auto">
      <div className="bg-white p-4 sm:p-8 min-h-[500px] overflow-hidden rounded shadow-md w-full max-w-md flex flex-col justify-between">
        <h2 className="text-2xl font-semibold mb-4 text-center">Register</h2>
        <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            required
          />
          <p className="text-sm text-gray-600">
            Password strength: <strong>{getPasswordStrength(formData.password)}</strong>
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200"
          >
            {isLoading ? (
              <span className="animate-spin h-5 w-5 border-t-2 border-white border-solid rounded-full inline-block"></span>
            ) : (
              "Register"
            )}
          </button>
        </form>
        {success && (
          <div className="mt-4 text-green-600 text-center animate-pulse">
            Success! Logged in as: <strong>{formData.email}</strong>
          </div>
        )}
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
        <div className="mt-4 text-center">
          <a href="/" className="text-blue-600 hover:underline">
            Already have an account? Login
          </a>
        </div>
      </div>
    </div>
  );
}
