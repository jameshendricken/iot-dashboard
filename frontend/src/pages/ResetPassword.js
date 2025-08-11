import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_BASE;

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // clear errors as user types
  useEffect(() => {
    if (error && email && validateEmail(email)) setError("");
  }, [email]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setMessage("");
    setError("");

    // ✅ Read from the form to handle autofill
    const fd = new FormData(e.currentTarget);
    const freshEmail = String(fd.get("email") || "").trim();
    setEmail(freshEmail); // sync local state (for UI)

    if (!validateEmail(freshEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      if (!API_URL) throw new Error("API base URL is not configured. Set REACT_APP_API_BASE in your .env.");

      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: freshEmail }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to send reset email");

      setMessage("Check your email for a password reset link.");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card">
        <h2 className="card-title">Reset Password</h2>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" aria-busy={isLoading}>
          <fieldset disabled={isLoading} className="space-y-5">
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                name="email"         // needed for FormData
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`btn-primary w-full ${isLoading ? "btn-disabled" : ""}`}
            >
              {isLoading && <span aria-hidden="true" className="spinner" />}
              <span>{isLoading ? "Sending…" : "Send Reset Link"}</span>
            </button>
          </fieldset>
        </form>

        {message && (
          <div className="mt-4 text-center text-success" role="status" aria-live="polite">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 text-center text-error" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <div className="mt-6 text-center muted">
          <Link to="/" className="link-primary">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
