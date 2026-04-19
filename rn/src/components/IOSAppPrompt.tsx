"use client";

import { useEffect, useState } from "react";

const APP_STORE_URL =
  "https://apps.apple.com/app/spotter-driven-history/id6760792621";

// After dismissing or tapping Get, suppress the prompt for this long.
const DISMISS_TTL_MS = 5 * 24 * 60 * 60 * 1000;

const LS_DISMISSED_UNTIL = "spotter_app_prompt_dismissed_until";

function isIOSBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Macintosh; detect by touch points.
  const iPadOS =
    ua.includes("Macintosh") &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

export function IOSAppPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isIOSBrowser()) return;

      // Skip if installed as PWA (iOS).
      const nav = navigator as Navigator & { standalone?: boolean };
      if (nav.standalone === true) return;

      // Skip inside the Capacitor wrapper.
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) return;
      } catch {
        // Not in Capacitor — continue.
      }

      // Honor prior dismissal.
      const dismissedUntil = Number(
        localStorage.getItem(LS_DISMISSED_UNTIL) || 0,
      );
      if (dismissedUntil && Date.now() < dismissedUntil) return;

      if (cancelled) return;
      setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  const suppress = () => {
    localStorage.setItem(
      LS_DISMISSED_UNTIL,
      String(Date.now() + DISMISS_TTL_MS),
    );
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Get Spotter for iOS"
      className="fixed left-0 right-0 z-[60] px-4 bottom-[calc(env(safe-area-inset-bottom)+92px)]"
    >
      <div className="mx-auto max-w-[480px] flex items-center gap-3 rounded-2xl bg-bg-card border border-border-subtle px-4 py-3 shadow-lg">
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-accent-coral/10 border border-accent-coral/20">
          <svg
            viewBox="0 0 384 512"
            className="w-5 h-5 text-accent-coral"
            fill="currentColor"
          >
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-text-primary truncate">
            Get Spotter for iOS
          </p>
          <p className="text-[12px] text-text-muted mt-0.5">
            Faster car spotting with camera access.
          </p>
        </div>

        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={suppress}
          className="flex-shrink-0 rounded-full text-[12px] font-semibold px-3 py-1.5 bg-text-primary text-bg-page no-underline"
        >
          Get
        </a>

        <button
          type="button"
          onClick={suppress}
          aria-label="Not now"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-text-muted"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
