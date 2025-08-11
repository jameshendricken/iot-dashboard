// src/pages/Login.js
import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_BASE;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [formData, setFormData] = useState({ email: "", password: "" }); // still used for live typing
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Clear field error as user types
  useEffect(() => {
    if (fieldErrors.email && validateEmail(formData.email.trim())) {
      setFieldErrors((e) => ({ ...e, email: "" }));
    }
    if (fieldErrors.password && formData.password) {
      setFieldErrors((e) => ({ ...e, password: "" }));
    }
  }, [formData.email, formData.password]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setGlobalError("");
    setSuccess(false);

    // ✅ Read from the form to handle autofill/password managers reliably
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    // keep local state in sync (optional)
    setFormData({ email, password });

    // validate
    const errors = { email: "", password: "" };
    if (!validateEmail(email)) errors.email = "Please enter a valid email address.";
    if (!password) errors.password = "Please enter your password.";
    setFieldErrors(errors);
    if (errors.email || errors.password) {
      if (errors.email) emailRef.current?.focus();
      else if (errors.password) passwordRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.detail || "Authentication failed";
        setFieldErrors((e) => ({ ...e, password: message }));
        passwordRef.current?.focus();
        throw new Error(message);
      }

      login(data.email, data.org, data.role, data.name);
      setSuccess(true);
      setTimeout(() => navigate(redirectTo, { replace: true }), 800);
    } catch (err) {
      if (!fieldErrors.password && !fieldErrors.email) {
        setGlobalError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card">
        <div className="text-center">
          <img
            alt="Your Company"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-6 card-title">Sign in to your account</h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6" aria-busy={isLoading}>
          <fieldset disabled={isLoading} className="space-y-6">
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                name="email"               // <-- important for FormData
                autoComplete="email"
                ref={emailRef}
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData((s) => ({ ...s, email: e.target.value }))}
                required
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={`input ${fieldErrors.email ? "input-error" : ""}`}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-error" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="form-label">Password</label>
                <Link to="/reset-password" className="link-primary text-sm">Forgot password?</Link>
              </div>
              <input
                id="password"
                name="password"            // <-- important for FormData
                autoComplete="current-password"
                ref={passwordRef}
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData((s) => ({ ...s, password: e.target.value }))}
                required
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className={`input ${fieldErrors.password ? "input-error" : ""}`}
              />
              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-error" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-disabled={isLoading}
              className={`btn-primary w-full ${isLoading ? "btn-disabled" : ""}`}
            >
              {isLoading && <span aria-hidden="true" className="spinner" />}
              <span>{isLoading ? "Signing in…" : "Sign in"}</span>
            </button>
          </fieldset>
        </form>

        {success && (
          <div className="mt-4 text-center text-success" role="status" aria-live="polite">
            Success! Logged in as: <strong>{formData.email}</strong>
          </div>
        )}
        {globalError && (
          <div className="mt-4 text-center text-error" role="alert" aria-live="assertive">
            {globalError}
          </div>
        )}

        <div className="mt-6 text-center muted">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="link-primary">Register</Link>
        </div>
      </div>
    </div>
  );
}
