"use client";

export function LandingPage({
  onSignIn,
  onSignUp,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <div className="flex flex-col h-dvh bg-bg-page safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center px-10">
        {/* Glow */}
        <div className="absolute w-[300px] h-[300px] rounded-full bg-accent-coral/10 blur-3xl pointer-events-none" />

        {/* Coral circle with viewfinder */}
        <div className="relative w-[140px] h-[140px] mb-8">
          <div className="w-full h-full rounded-full bg-accent-coral" />
          {/* Viewfinder brackets */}
          <svg
            className="absolute inset-0 m-auto"
            width="80"
            height="80"
            viewBox="-3 -3 86 86"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M0 22L0 0L22 0" />
            <path d="M58 0L80 0L80 22" />
            <path d="M0 58L0 80L22 80" />
            <path d="M58 80L80 80L80 58" />
            <circle cx="40" cy="40" r="14" />
          </svg>
        </div>

        <h1 className="text-[42px] font-semibold tracking-[0.3em] text-text-primary mb-2">
          SPOTTER
        </h1>

        <p className="text-text-secondary text-[16px] mb-12">
          Spot. Identify. Collect.
        </p>

        {/* Buttons */}
        <div className="w-[300px] space-y-3">
          <button
            onClick={onSignIn}
            className="w-full h-[52px] bg-accent-coral rounded-full text-white font-semibold text-[17px] active:scale-[0.98] transition-transform"
          >
            Sign In
          </button>

          <button
            onClick={onSignUp}
            className="w-full h-[52px] border border-border-subtle rounded-full text-text-primary font-semibold text-[17px] active:scale-[0.98] transition-transform"
          >
            Create Account
          </button>
        </div>

        <button className="mt-4 text-text-muted text-[14px]">
          Continue as Guest
        </button>
      </div>

      {/* Footer */}
      <div className="pb-6 flex items-center justify-center gap-2 opacity-50">
        <span className="text-[11px] text-text-muted">Powered by</span>
        <span className="text-[11px] font-bold text-text-secondary tracking-wide">DRIVEN HISTORY</span>
      </div>
    </div>
  );
}
