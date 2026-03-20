"use client";

export function LandingPage({
  onSignIn,
  onSignUp,
  onGuest,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
  onGuest: () => void;
}) {
  return (
    <div className="flex flex-col h-dvh bg-bg-page safe-top safe-bottom px-9 pb-10">
      {/* Top flex spacer */}
      <div className="flex-1 min-h-[200px]" />

      {/* Logo */}
      <div className="flex flex-col items-center">
        <div className="relative w-[160px] h-[160px]">
          <div className="w-full h-full rounded-full bg-accent-coral" />
          <svg
            className="absolute top-[35px] left-[35px]"
            width="90"
            height="90"
            viewBox="-3 -3 96 96"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M0 24L0 0L24 0" />
            <path d="M66 0L90 0L90 24" />
            <path d="M0 66L0 90L24 90" />
            <path d="M66 90L90 90L90 66" />
            <circle cx="45" cy="45" r="15" />
          </svg>
        </div>

        <div className="h-10" />

        <h1 className="text-[44px] font-semibold tracking-[12px] text-text-primary">
          SPOTTER
        </h1>

        <div className="h-2" />

        <p className="text-text-secondary text-[15px] tracking-wide">
          Spot. Identify. Collect.
        </p>
      </div>

      <div className="h-14" />

      {/* Buttons */}
      <div className="flex flex-col items-center gap-3.5 px-2">
        <button
          onClick={onSignIn}
          className="w-full max-w-[320px] h-[54px] bg-accent-coral rounded-full text-white font-semibold text-[17px] active:scale-[0.98] transition-transform"
        >
          Sign In
        </button>

        <button
          onClick={onSignUp}
          className="w-full max-w-[320px] h-[54px] border border-border-strong rounded-full text-text-primary font-semibold text-[17px] active:scale-[0.98] transition-transform"
        >
          Create Account
        </button>
      </div>

      <div className="h-4" />

      <button onClick={onGuest} className="text-text-muted text-[14px] font-medium self-center">
        Continue as Guest
      </button>

      {/* Bottom flex spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 opacity-50">
        <span className="text-[11px] text-text-muted">Powered by</span>
        <img src="/dh-logo-horizontal.png" alt="Driven History" className="h-[28px]" />
      </div>
    </div>
  );
}
