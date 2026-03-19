"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function SignUpForm({
  onBack,
  onSignIn,
}: {
  onBack: () => void;
  onSignIn: () => void;
}) {
  const { signup, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(email, username, password, confirm);
  };

  const inputClass =
    "w-full px-4 py-3.5 bg-bg-card border border-border-subtle rounded-[14px] text-text-primary text-[15px] outline-none focus:border-accent-coral transition-colors placeholder:text-text-muted";

  return (
    <div className="flex flex-col h-dvh bg-bg-page safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center h-14 pt-[60px] px-8 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-text-primary">
          <ArrowLeft size={18} />
          <span className="text-[16px] font-medium">Back</span>
        </button>
      </div>

      {/* Scrollable content — allows scrolling when keyboard is open */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-8 pb-10">
        <div className="min-h-[40px]" />

        {/* Title */}
        <div className="flex flex-col items-center mb-9">
          <h1 className="text-[28px] font-bold text-text-primary mb-2">Create Account</h1>
          <p className="text-[15px] text-text-secondary">Join the Spotter community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              className={inputClass}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearError(); }}
              className={inputClass}
              placeholder="Pick a username"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              className={inputClass}
              placeholder="Create password"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); clearError(); }}
              className={inputClass}
              placeholder="Confirm password"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-danger-red text-sm text-center">{error}</p>
          )}

          <div className="h-2.5" />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[54px] bg-accent-coral rounded-full text-white font-semibold text-[17px] disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {isLoading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="h-5" />

        {/* Link */}
        <div className="text-center">
          <button onClick={onSignIn} className="text-[14px]">
            <span className="text-text-secondary">Already have an account? </span>
            <span className="text-accent-coral font-semibold">Sign In</span>
          </button>
        </div>

        <div className="min-h-[40px]" />
      </div>
    </div>
  );
}
