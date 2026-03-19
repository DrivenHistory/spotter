"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auth as authApi } from "@/lib/api";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

export function SignUpForm({
  onBack,
  onSignIn,
}: {
  onBack: () => void;
  onSignIn: () => void;
}) {
  const { signup, checkSession, error, isLoading, clearError } = useAuth();
  const kbHeight = useKeyboardHeight();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Magic link state
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  // Forgot password state
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(email, username, password);
  };

  const scrollOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const handleMagicLink = async () => {
    if (!email) {
      setMagicLinkError("Enter your email first");
      return;
    }
    setMagicLinkError(null);
    setMagicLinkLoading(true);
    try {
      const { ok, pollId } = await authApi.requestMagicLink(email);
      if (!ok || !pollId) throw new Error("Failed to send link");
      setMagicLinkSent(true);
      setMagicLinkLoading(false);

      pollRef.current = setInterval(async () => {
        try {
          const { status } = await authApi.pollMagicLink(pollId);
          if (status === "authenticated") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            await checkSession();
          }
        } catch { /* keep polling */ }
      }, 3000);
    } catch (e: unknown) {
      setMagicLinkError(e instanceof Error ? e.message : "Failed to send link");
      setMagicLinkLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMagicLinkError("Enter your email first");
      return;
    }
    setForgotLoading(true);
    try {
      await authApi.forgotPassword(email);
      setForgotSent(true);
    } catch { /* ignore */ }
    setForgotLoading(false);
  };

  const inputClass =
    "w-full px-4 py-3.5 bg-bg-card border border-border-subtle rounded-[14px] text-text-primary text-[15px] outline-none focus:border-accent-coral transition-colors placeholder:text-text-muted";

  // Magic link sent — waiting screen
  if (magicLinkSent) {
    return (
      <div className="flex flex-col h-dvh bg-bg-page safe-top safe-bottom px-8 pb-10">
        <div className="flex items-center h-14 pt-[60px]">
          <button onClick={() => { setMagicLinkSent(false); if (pollRef.current) clearInterval(pollRef.current); }} className="flex items-center gap-1.5 text-text-primary">
            <ArrowLeft size={18} />
            <span className="text-[16px] font-medium">Back</span>
          </button>
        </div>
        <div className="flex-1" />
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-accent-coral/10 flex items-center justify-center mb-5">
            <Mail size={28} className="text-accent-coral" />
          </div>
          <h1 className="text-[24px] font-bold text-text-primary mb-2">Check your email</h1>
          <p className="text-[15px] text-text-secondary mb-1">We sent a sign-in link to</p>
          <p className="text-[15px] font-semibold text-text-primary mb-6">{email}</p>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
            <span className="text-[14px] text-text-secondary">Waiting for you to click the link...</span>
          </div>
          <button onClick={handleMagicLink} className="text-[14px] text-accent-coral font-medium mt-2">
            Resend link
          </button>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

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
      <div className="flex-1 overflow-y-auto overscroll-contain px-8 pb-10" style={{ paddingBottom: kbHeight > 0 ? kbHeight + 40 : undefined }}>
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
              onChange={(e) => { setEmail(e.target.value); clearError(); setMagicLinkError(null); }}
              className={inputClass}
              placeholder="you@email.com"
              autoComplete="email"
              onFocus={scrollOnFocus}
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
              onFocus={scrollOnFocus}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              className={inputClass}
              placeholder="Create password (8+ characters)"
              autoComplete="new-password"
              onFocus={scrollOnFocus}
            />
          </div>

          {(error || magicLinkError) && (
            <p className="text-danger-red text-sm text-center">{error || magicLinkError}</p>
          )}

          <div className="h-1" />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[54px] bg-accent-coral rounded-full text-white font-semibold text-[17px] disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {isLoading ? "Creating..." : "Create Account"}
          </button>
        </form>

        {/* Magic link */}
        <button
          onClick={handleMagicLink}
          disabled={magicLinkLoading}
          className="mt-4 w-full h-[54px] border border-border-subtle rounded-full text-text-primary font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <Mail size={18} className="text-accent-coral" />
          {magicLinkLoading ? "Sending..." : "Email me a sign-in link"}
        </button>

        {/* Forgot password */}
        <div className="mt-3 text-center">
          {forgotSent ? (
            <p className="text-[13px] text-text-secondary">Reset link sent — check your email</p>
          ) : (
            <button
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="text-[13px] text-accent-coral font-medium disabled:opacity-50"
            >
              {forgotLoading ? "Sending..." : "Forgot password?"}
            </button>
          )}
        </div>

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
