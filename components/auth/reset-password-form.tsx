"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import Link from "next/link";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setSent(true);
    } catch (err) {
      const message = (err as { code?: string }).code;
      switch (message) {
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        default:
          setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-card">
        <h1 className="auth-title">Check your email</h1>
        <p className="auth-subtitle">
          We sent a password reset link to {email}
        </p>
        <div className="auth-link" style={{ marginTop: "1rem" }}>
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Reset password</h1>
      <p className="auth-subtitle">
        Enter your email and we&apos;ll send a reset link
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <label className="auth-label" htmlFor="email">
            Email
          </label>
          <input
            className="auth-input"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <div className="auth-link">
          <Link href="/login">Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}
