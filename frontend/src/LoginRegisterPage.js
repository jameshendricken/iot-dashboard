import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const API_URL = process.env.REACT_APP_API_BASE;
if (!API_URL) {
  console.error("REACT_APP_API_BASE is not defined. Please set it in your .env file.");
}

export default function LoginRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
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

  const handlePasswordReset = async () => {
    if (!validateEmail(formData.email)) {
      setError("Enter a valid email to reset password.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset request failed");
      alert("Password reset email sent.");
    } catch (err) {
      setError(err.message);
    }
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

    const endpoint = isRegistering ? "/register" : "/login";
    try {
      const res = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            ...(isRegistering && { name: formData.name })
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");

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
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
            alt="Your Company"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">

            {/* <h2 className="text-2xl font-semibold mb-4 text-center">
            {isRegistering ? "Register" : "Login"}
            </h2> */}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegistering && (
                
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                required
              />
              {isRegistering && (
                <p className="text-sm text-gray-600">
                  Password strength: <strong>{getPasswordStrength(formData.password)}</strong>
                </p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200"
              >
                {isLoading ? (
                  <span className="animate-spin h-5 w-5 border-t-2 border-white border-solid rounded-full inline-block"></span>
                ) : (
                  isRegistering ? "Register" : "Login"
                )}
              </button>
            </form>
            {!isRegistering && (
          <div className="mt-4 text-center">
            <button
              onClick={handlePasswordReset}
              className="text-blue-500 text-sm hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}
        {success && (
          <div className="mt-4 text-green-600 text-center animate-pulse">
            Success! Logged in as: <strong>{formData.email}</strong>
          </div>
        )}
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
          <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:underline"
          >
            {isRegistering
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </button>
        </div>
          
          </div>
        
        
        
        
      </div>
    </div>
  );
}

