"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("Login succeeded, but session was not created. Try again.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#111827",
          padding: "36px",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <h1
          style={{
            color: "#ffffff",
            fontSize: "34px",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: "28px",
            letterSpacing: "-0.03em",
          }}
        >
          Sign In
        </h1>

        {error && (
          <p
            style={{
              color: "#fecaca",
              background: "rgba(127, 29, 29, 0.35)",
              border: "1px solid rgba(248, 113, 113, 0.35)",
              padding: "12px",
              borderRadius: "12px",
              textAlign: "center",
              marginBottom: "18px",
              fontSize: "14px",
            }}
          >
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            height: "58px",
            padding: "0 18px",
            marginBottom: "16px",
            borderRadius: "14px",
            background: "#1f2937",
            color: "#ffffff",
            border: "1px solid #374151",
            outline: "none",
            fontSize: "18px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            height: "58px",
            padding: "0 18px",
            marginBottom: "22px",
            borderRadius: "14px",
            background: "#1f2937",
            color: "#ffffff",
            border: "1px solid #374151",
            outline: "none",
            fontSize: "18px",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            height: "58px",
            border: "none",
            borderRadius: "14px",
            background: loading
              ? "#166534"
              : "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 12px 28px rgba(34, 197, 94, 0.35)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p
          style={{
            color: "#9ca3af",
            fontSize: "15px",
            textAlign: "center",
            marginTop: "24px",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            style={{
              color: "#4ade80",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
