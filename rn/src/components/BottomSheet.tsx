"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [kbHeight, setKbHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Scroll focused input into view when keyboard appears
  const scrollFocusedIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && contentRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, []);

  // Listen for keyboard via multiple strategies
  useEffect(() => {
    if (!open || typeof window === "undefined") return;

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

    // Strategy 3: focus/blur on inputs — fallback scroll
    const onFocusIn = () => {
      setTimeout(scrollFocusedIntoView, 300);
    };
    document.addEventListener("focusin", onFocusIn);
    listeners.push(() => document.removeEventListener("focusin", onFocusIn));

    return () => {
      listeners.forEach((fn) => fn());
      setKbHeight(0);
    };
  }, [open, scrollFocusedIntoView]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet — shifts up by keyboard height */}
      <div
        className="relative w-full bg-bg-card rounded-t-[24px] flex flex-col transition-transform duration-200"
        style={{
          maxHeight: "90vh",
          transform: kbHeight > 0 ? `translateY(-${kbHeight}px)` : undefined,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-text-muted" />
        </div>

        {/* Title row */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4 shrink-0">
            <h2 className="text-[22px] font-bold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center"
            >
              <X size={18} className="text-text-muted" />
            </button>
          </div>
        )}

        {/* Content — scrollable */}
        <div ref={contentRef} className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
