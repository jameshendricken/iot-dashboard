import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_BASE;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

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
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-6">

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input
                        type="email"
                        placeholder="Enter your email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border-2 border-slate-500 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-gray-400 focus:outline-4 focus:-outline-offset-1 focus:outline-indigo-600 sm:text-sm/6"
                    />
                    </div>    
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                        Password
                        </label>
                        <div className="text-sm">
                        <a href="/reset-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Forgot password?
                        </a>
                        </div>
                    </div>
                    <div className="mt-2">
                        <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border-2 border-slate-500 outline-1 -outline-offset-1 outline-slate-300 placeholder:text-gray-400 focus:outline-4 focus:-outline-offset-1 focus:outline-indigo-600 sm:text-sm/6"
                        required
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        {isLoading ? (
                            <span className="animate-spin h-5 w-5 border-t-2 border-white border-solid rounded-full inline-block"></span>
                        ) : (
                            "Sign in"
                        )}
                    </button>

                </div>

            </form>

            <div className="mt-4 text-center">
                Don't have an account?
                <a href="/register" className="text-blue-600 hover:underline">
                Register
                </a>
            </div>
            {success && (
                <div className="mt-4 text-green-600 text-center animate-pulse">
                Success! Logged in as: <strong>{formData.email}</strong>
                </div>
            )}
            {error && <div className="mt-4 text-red-600 text-center">{error}</div>}



        </div>

    </div>
  );
}
