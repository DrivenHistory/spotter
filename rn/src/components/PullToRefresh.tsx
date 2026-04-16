"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";

const THRESHOLD = 60;
const MAX_PULL = 100;

export function PullToRefresh({
  onRefresh,
  children,
  className = "",
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      setPullDistance(Math.min(dy * 0.5, MAX_PULL));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } catch { /* ignore */ }
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        {refreshing ? (
          <div className="w-5 h-5 border-2 border-text-secondary border-t-accent-coral rounded-full animate-spin" />
        ) : (
          <svg
            className="w-5 h-5 text-text-secondary transition-transform duration-150"
            style={{ transform: `rotate(${Math.min((pullDistance / THRESHOLD) * 180, 180)}deg)`, opacity: Math.min(pullDistance / THRESHOLD, 1) }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
        )}
      </div>
      {children}
    </div>
  );
}
