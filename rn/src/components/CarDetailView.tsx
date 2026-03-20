"use client";

import { useRef, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { type SpottedCar } from "@/lib/api";
import { points } from "@/lib/rarity";
import { RarityBadge } from "@/components/ui";
import { relativeTime } from "@/lib/time";

export function CarDetailView({
  car,
  onBack,
  onNext,
  onPrev,
}: {
  car: SpottedCar;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  const pts = points(car.rarity);

  // Swipe handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe is dominant and > 60px
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && onNext) onNext();
      else if (dx > 0 && onPrev) onPrev();
    }
  }, [onNext, onPrev]);

  return (
    <div
      className="h-full overflow-y-auto scrollbar-hide px-5 pb-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Nav bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-text-primary">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          {onPrev && (
            <button onClick={onPrev} className="text-text-muted active:text-text-primary">
              <ChevronLeft size={20} />
            </button>
          )}
          <span className="text-[18px] font-semibold text-text-primary">Car Details</span>
          {onNext && (
            <button onClick={onNext} className="text-text-muted active:text-text-primary">
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        <div className="w-6" />
      </div>

      {/* Car image */}
      {car.imageUrl ? (
        <img src={car.imageUrl} alt={displayName} className="w-full h-[220px] object-cover rounded-[16px] mb-4" />
      ) : (
        <div className="w-full h-[220px] bg-bg-elevated rounded-[16px] mb-4 flex items-center justify-center text-text-tertiary">No photo</div>
      )}

      {/* Title card */}
      <div className="bg-bg-card rounded-[16px] p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[22px] font-bold text-text-primary">{displayName}</h2>
          {car.rarity && <RarityBadge rarity={car.rarity} />}
        </div>
        {car.description && (
          <p className="text-[14px] text-text-secondary mb-2">{car.description}</p>
        )}
        <p className="text-[12px] text-text-muted">
          Spotted by {car.spotterName || car.spotterEmail.split("@")[0]} · {relativeTime(car.createdAt)}
        </p>
      </div>

      {/* Specifications card */}
      {(car.bhp || car.zeroToSixty || car.topSpeed || car.marketValue) && (
        <div className="bg-bg-card rounded-[16px] p-5 mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary mb-3">Specifications</h3>
          <div className="grid grid-cols-2 gap-3">
            {car.type && <SpecCell label="Type" value={car.type} />}
            {car.bhp && <SpecCell label="Horsepower" value={`${car.bhp} hp`} />}
            {car.zeroToSixty && <SpecCell label="0-60 mph" value={`${car.zeroToSixty} seconds`} />}
            {car.topSpeed && <SpecCell label="Top Speed" value={`${car.topSpeed} mph`} />}
            {car.marketValue && <SpecCell label="Market Value" value={car.marketValue} />}
          </div>
        </div>
      )}

      {/* Points row */}
      {pts > 0 && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap size={20} className="text-accent-coral" />
          <span className="text-[16px] font-semibold text-accent-coral">+{pts} points</span>
        </div>
      )}
    </div>
  );
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className="text-[14px] font-semibold text-text-primary">{value}</span>
    </div>
  );
}
