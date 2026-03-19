"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Tracks the iOS keyboard height using Capacitor keyboard events
 * and visualViewport fallback. Returns the current keyboard height in px.
 *
 * Use this to add dynamic bottom padding on scrollable containers
 * so content can scroll above the keyboard when `resize: "none"` is set
 * in capacitor.config.ts.
 */
export function useKeyboardHeight() {
  const [kbHeight, setKbHeight] = useState(0);

  const scrollFocusedIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const listeners: Array<() => void> = [];

    // Strategy 1: Capacitor Keyboard plugin events
    const onKeyboardShow = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      const height = detail?.keyboardHeight ?? 0;
      setKbHeight(height > 0 ? height : 300);
      scrollFocusedIntoView();
    };
    const onKeyboardHide = () => setKbHeight(0);

    window.addEventListener("keyboardWillShow", onKeyboardShow);
    window.addEventListener("keyboardDidShow", onKeyboardShow);
    window.addEventListener("keyboardWillHide", onKeyboardHide);
    window.addEventListener("keyboardDidHide", onKeyboardHide);
    listeners.push(() => {
      window.removeEventListener("keyboardWillShow", onKeyboardShow);
      window.removeEventListener("keyboardDidShow", onKeyboardShow);
      window.removeEventListener("keyboardWillHide", onKeyboardHide);
      window.removeEventListener("keyboardDidHide", onKeyboardHide);
    });

    // Strategy 2: visualViewport (works in Safari/WKWebView)
    const vv = window.visualViewport;
    if (vv) {
      const onViewportResize = () => {
        const diff = window.innerHeight - vv.height;
        const height = diff > 50 ? diff : 0;
        setKbHeight(height);
        if (height > 0) scrollFocusedIntoView();
      };
      vv.addEventListener("resize", onViewportResize);
      listeners.push(() => vv.removeEventListener("resize", onViewportResize));
    }

    return () => listeners.forEach((fn) => fn());
  }, [scrollFocusedIntoView]);

  return kbHeight;
}
