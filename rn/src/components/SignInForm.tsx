"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function SignInForm({
  onBack,
  onSignUp,
}: {
  onBack: () => void;
  onSignUp: () => void;
}) {
  const { login, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="flex flex-col h-dvh bg-bg-page safe-top safe-bottom">
      {/* Header */}
      <div className="px-4 pt-3">
        <button onClick={onBack} className="flex items-center gap-1 text-text-secondary text-[14px]">
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold text-text-primary font-display text-center mb-8">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              className="w-full px-4 py-3.5 bg-bg-card border border-border-subtle rounded-[12px] text-text-primary text-[15px] outline-none focus:border-accent-coral transition-colors placeholder:text-text-tertiary"
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              className="w-full px-4 py-3.5 bg-bg-card border border-border-subtle rounded-[12px] text-text-primary text-[15px] outline-none focus:border-accent-coral transition-colors placeholder:text-text-tertiary"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-danger-red text-[13px] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-accent-coral rounded-[14px] text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={onSignUp} className="text-text-secondary text-[14px]">
            Don&apos;t have an account? <span className="text-accent-coral font-medium">Create one</span>
          </button>
        </div>
      </div>
    </div>
  );
}
