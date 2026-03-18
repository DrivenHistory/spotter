"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { spotter, type SpottedCar } from "@/lib/api";
import { points, rarityKey } from "@/lib/rarity";
import { relativeTime } from "@/lib/time";
import { RarityBadge, StatBox } from "@/components/ui";

export function CarsTab() {
  const { user } = useAuth();
  const [cars, setCars] = useState<SpottedCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { spots } = await spotter.getFeed();
        setCars(spots.filter((s) => s.spotterEmail.toLowerCase() === user.email.toLowerCase()));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [user]);

  const totalPts = cars.reduce((s, c) => s + points(c.rarity), 0);
  const rareCount = cars.filter((c) =>
    ["Rare", "Very Rare", "Extremely Rare"].includes(c.rarity ?? "")
  ).length;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-6 pt-2 pb-32">
      <h1 className="text-2xl font-semibold text-text-primary font-display mb-5">My Cars</h1>

      {/* Stats */}
      <div className="flex gap-2 mb-5">
        <StatBox value={String(cars.length)} label="Total" />
        <StatBox value={String(rareCount)} label="Rare+" valueColor="text-rarity-rare" />
        <StatBox value={String(totalPts)} label="Points" valueColor="text-accent-amber" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cars.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="text-4xl mb-3 text-text-tertiary">🚗</div>
          <p className="text-[16px] font-medium text-text-secondary">No cars spotted yet</p>
          <p className="text-[13px] text-text-muted mt-1">Use the Spot tab to identify your first car!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}

      {/* DrivenHistory promo */}
      <button
        onClick={() => window.open("https://www.drivenhistory.com", "_blank")}
        className="mt-5 w-full flex items-center gap-3 p-4 bg-bg-card rounded-[16px] border border-accent-coral/20"
      >
        <div className="w-10 h-10 rounded-[10px] bg-accent-coral/15 flex items-center justify-center shrink-0">
          <span className="text-[16px] font-bold text-accent-coral">DH</span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-[14px] font-semibold text-text-primary">Track your full collection</p>
          <p className="text-[12px] text-text-secondary">View your garage on DrivenHistory.com</p>
        </div>
        <ArrowRight size={18} className="text-accent-coral shrink-0" />
      </button>
    </div>
  );
}

function CarCard({ car }: { car: SpottedCar }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  return (
    <div className="rounded-[16px] bg-bg-card border border-border-subtle overflow-hidden">
      <div className="relative">
        {car.imageUrl ? (
          <img src={car.imageUrl} alt={displayName} className="w-full h-[120px] object-cover" />
        ) : (
          <div className="w-full h-[120px] bg-bg-elevated" />
        )}
        {car.rarity && (
          <div className="absolute top-2 right-2">
            <RarityBadge rarity={car.rarity} />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-[13px] font-semibold text-text-primary truncate">{displayName}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-medium text-accent-amber">{points(car.rarity)} pts</span>
          <span className="text-[10px] text-text-muted">{relativeTime(car.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
