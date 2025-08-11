import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_BASE;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth?.() || {}; // defensive

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({ confirmPassword: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // helpers
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;
  const getPasswordStrength = (password) => {
    if (password.length < 6) return "Weak";
    if (/[A-Z]/.test(password) && /\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) return "Strong";
    return "Moderate";
  };

  // derived UI bits
  const strength = getPasswordStrength(formData.password);
  const strengthColor =
    strength === "Strong"
      ? "text-green-600 dark:text-green-400"
      : strength === "Moderate"
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const passwordsMatch =
    formData.confirmPassword === "" || formData.password === formData.confirmPassword;
  const showConfirmError =
    touched.confirmPassword && formData.confirmPassword !== "" && !passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError("");
    setSuccess(false);

    // ✅ Read fresh values directly from the form (handles autofill)
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const confirmPassword = String(fd.get("confirmPassword") || "");

    // keep local state in sync (optional; helps UI mirrors)
    setFormData({ name, email, password, confirmPassword });

    // validate
    if (!name) return setError("Please enter your name.");
    if (!validateEmail(email)) return setError("Please enter a valid email address.");
    if (!validatePassword(password)) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setIsLoading(true);
    try {
      if (!API_URL) throw new Error("API base URL is not configured. Set REACT_APP_API_BASE in your .env.");

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Registration failed");

      setSuccess(true);
      setTimeout(() => {
        try {
          if (typeof login === "function") {
            login(data.email, data.org, data.role, data.name);
          }
        } finally {
          navigate("/dashboard", { replace: true });
        }
      }, 600);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card">
        <h2 className="card-title">Create your account</h2>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" aria-busy={isLoading}>
          <fieldset disabled={isLoading} className="space-y-5">
            <div>
              <label className="form-label" htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
                required
                className="input"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData((s) => ({ ...s, email: e.target.value }))}
                required
                className="input"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData((s) => ({ ...s, password: e.target.value }))}
                required
                className="input"
              />
              {/* hide strength until typing */}
              {formData.password.length > 0 && (
                <p className={`mt-2 text-xs ${strengthColor}`}>
                  Password strength: <strong>{strength}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  if (!touched.confirmPassword) setTouched((t) => ({ ...t, confirmPassword: true }));
                  setFormData((s) => ({ ...s, confirmPassword: e.target.value }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                required
                aria-invalid={showConfirmError}
                aria-describedby={showConfirmError ? "confirm-error" : undefined}
                className={`input ${showConfirmError ? "input-error" : ""}`}
              />
              {showConfirmError && (
                <p id="confirm-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  Passwords do not match.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordsMatch}
              className={`btn-primary w-full ${(isLoading || !passwordsMatch) ? "btn-disabled" : ""}`}
            >
              {isLoading && <span aria-hidden="true" className="spinner" />}
              <span>{isLoading ? "Creating…" : "Register"}</span>
            </button>
          </fieldset>
        </form>

        {success && (
          <div className="mt-4 text-center text-success" role="status" aria-live="polite">
            Success! Logged in as: <strong>{formData.email}</strong>
          </div>
        )}
        {error && (
          <div className="mt-4 text-center text-error" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <div className="mt-6 text-center muted">
          Already have an account?{" "}
          <Link to="/" className="link-primary">Login</Link>
        </div>
      </div>
    </div>
  );
}
