"use client";

export function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-bg-page">
      <div className="relative mb-6">
        <div className="relative w-20 h-20">
          <div className="w-full h-full rounded-full bg-accent-coral" />
          <svg
            className="absolute top-[17px] left-[17px]"
            width="46"
            height="46"
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
      </div>
      <h1 className="text-2xl font-semibold tracking-[0.2em] text-text-primary font-display">
        SPOTTER
      </h1>
      <div className="mt-6 w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
