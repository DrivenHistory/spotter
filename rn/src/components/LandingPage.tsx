"use client";

import { LogIn, UserPlus, ArrowRight } from "lucide-react";

export function LandingPage({
  onSignIn,
  onSignUp,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <div className="flex flex-col h-dvh bg-bg-page safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <div className="w-[88px] h-[88px] rounded-full bg-accent-coral flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(232,90,79,0.3)]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 2h4v4H2zM18 2h4v4h-4zM2 18h4v4H2zM18 18h4v4h-4z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>

        <h1 className="text-[28px] font-semibold tracking-[0.2em] text-text-primary font-display mb-3">
          SPOTTER
        </h1>

        <p className="text-accent-coral text-[17px] font-medium mb-2">
          Identify any car. Instantly.
        </p>

        <p className="text-text-secondary text-[13px] text-center leading-relaxed mb-10 max-w-[260px]">
          Snap a photo. Let AI do the rest.{"\n"}Build your collection. Share your spots.
        </p>

        {/* Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={onSignIn}
            className="w-full py-4 bg-accent-coral rounded-[14px] text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <LogIn size={18} /> Sign In
          </button>

          <button
            onClick={onSignUp}
            className="w-full py-4 bg-bg-card border border-border-subtle rounded-[14px] text-text-primary font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <UserPlus size={18} /> Create Account
          </button>
        </div>

        <button className="mt-5 text-text-muted text-[13px] flex items-center gap-1">
          Continue as Guest <ArrowRight size={14} />
        </button>
      </div>

      {/* Footer */}
      <div className="pb-6 flex items-center justify-center gap-2">
        <div className="w-5 h-5 rounded bg-accent-coral/20 flex items-center justify-center">
          <span className="text-accent-coral text-[10px] font-bold">DH</span>
        </div>
        <span className="text-[11px] text-text-muted">
          Powered by <span className="text-text-secondary font-medium">Driven History</span>
        </span>
      </div>
    </div>
  );
}
