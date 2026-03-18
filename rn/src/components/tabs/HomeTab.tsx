"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { spotter, type SpottedCar } from "@/lib/api";
import { points, rarityKey } from "@/lib/rarity";
import { relativeTime } from "@/lib/time";
import { RarityBadge, StatBox } from "@/components/ui";

export function HomeTab({ onProfile }: { onProfile?: () => void }) {
  const { user } = useAuth();
  const [feed, setFeed] = useState<SpottedCar[]>([]);
  const [weeklySpots, setWeeklySpots] = useState<SpottedCar[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{ totalSpotted: number; uniqueSpotters: number; rareFinds: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [feedRes, weeklyRes] = await Promise.all([
          spotter.getFeed(),
          spotter.getWeekly(),
        ]);
        setFeed(feedRes.spots);
        setWeeklySpots(weeklyRes.spots);
        setWeeklyStats(weeklyRes.stats);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Spotter";
  const initials = (() => {
    const name = user?.name ?? "S";
    const parts = name.split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  })();

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-6 pt-2 pb-32">
      {/* Header with profile avatar */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold text-text-primary font-display">
          Hey, {firstName}!
        </h1>
        <button onClick={onProfile} className="w-10 h-10 rounded-full bg-accent-coral flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-white">{initials}</span>
        </button>
      </div>

      {/* Latest carousel */}
      {weeklySpots.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Latest</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6">
            {weeklySpots.slice(0, 10).map((car) => (
              <WeeklyCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      )}

      {/* Community Spots */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Community Spots</h2>

        {weeklyStats && (
          <div className="flex gap-2 mb-4">
            <StatBox value={String(weeklyStats.totalSpotted)} label="Spotted" />
            <StatBox value={String(weeklyStats.uniqueSpotters)} label="Spotters" />
            <StatBox value={String(weeklyStats.rareFinds)} label="Rare" valueColor="text-rarity-rare" />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map((car) => (
              <SpotRow key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WeeklyCard({ car }: { car: SpottedCar }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  return (
    <div className="shrink-0 w-[200px] rounded-[16px] bg-bg-card border border-border-subtle overflow-hidden">
      {car.imageUrl ? (
        <img src={car.imageUrl} alt={displayName} className="w-full h-[120px] object-cover" />
      ) : (
        <div className="w-full h-[120px] bg-bg-elevated flex items-center justify-center text-text-tertiary text-xs">No photo</div>
      )}
      <div className="p-3">
        <p className="text-[13px] font-semibold text-text-primary truncate">{displayName}</p>
        <div className="flex items-center justify-between mt-1">
          {car.rarity && <RarityBadge rarity={car.rarity} />}
          <span className="text-[10px] text-text-muted">{relativeTime(car.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function SpotRow({ car }: { car: SpottedCar }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  return (
    <div className="flex gap-3 p-3 bg-bg-card rounded-[14px] border border-border-subtle">
      {car.imageUrl ? (
        <img src={car.imageUrl} alt="" className="w-14 h-14 rounded-[10px] object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-[10px] bg-bg-elevated shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text-primary truncate">{displayName}</p>
        <p className="text-[11px] text-text-muted mt-0.5">by {car.spotterName}</p>
        <div className="flex items-center gap-2 mt-1">
          {car.rarity && <RarityBadge rarity={car.rarity} />}
          <span className="text-[11px] text-accent-amber font-medium">{points(car.rarity)} pts</span>
        </div>
      </div>
      <span className="text-[10px] text-text-muted shrink-0 mt-1">{relativeTime(car.createdAt)}</span>
    </div>
  );
}
