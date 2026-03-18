"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function LoginPage() {
  const { login, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="flex flex-col h-dvh bg-bg-page safe-top safe-bottom">
      <div className="flex-1 flex flex-col justify-center px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-full bg-accent-coral/20 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E85A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-[0.15em] text-text-primary font-display">
            SPOTTER
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              className="w-full px-4 py-3.5 bg-bg-card border border-border-subtle rounded-[12px] text-text-primary text-[15px] outline-none focus:border-accent-coral transition-colors"
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              className="w-full px-4 py-3.5 bg-bg-card border border-border-subtle rounded-[12px] text-text-primary text-[15px] outline-none focus:border-accent-coral transition-colors"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-danger-red text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-accent-coral rounded-[14px] text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <Link href="/signup" className="text-accent-coral text-sm font-medium">
            Create Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 flex items-center justify-center gap-1.5">
        <span className="text-[11px] text-text-muted">Powered by</span>
        <span className="text-[11px] text-text-secondary font-medium">Driven History</span>
      </div>
    </div>
  );
}
