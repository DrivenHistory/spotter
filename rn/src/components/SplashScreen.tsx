"use client";

export function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-bg-page">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-accent-coral/20 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E85A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
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
