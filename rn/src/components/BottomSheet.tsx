"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Handle iOS keyboard via visualViewport API
  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const kbHeight = window.innerHeight - vv.height;
      setKeyboardHeight(kbHeight > 50 ? kbHeight : 0);
    };

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
      setKeyboardHeight(0);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full bg-bg-card rounded-t-[24px] flex flex-col transition-all duration-200"
        style={{
          maxHeight: `${90 - (keyboardHeight / window.innerHeight) * 100}vh`,
          marginBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined,
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
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
