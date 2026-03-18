"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { spotter, type SpottedCar } from "@/lib/api";
import { points } from "@/lib/rarity";
import { relativeTime } from "@/lib/time";
import { RarityBadge } from "@/components/ui";

const RARE_TIERS = ["Rare", "Very Rare", "Extremely Rare"];

export function CommunityTab({ onProfile }: { onProfile?: () => void }) {
  const { user } = useAuth();
  const [allSpots, setAllSpots] = useState<SpottedCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { spots } = await spotter.getFeed();
        setAllSpots(spots);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const topRare = useMemo(() => {
    return allSpots
      .filter((s) => RARE_TIERS.includes(s.rarity ?? ""))
      .sort((a, b) => points(b.rarity) - points(a.rarity) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [allSpots]);

  const recentActivity = useMemo(() => {
    return [...allSpots]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [allSpots]);

  const initials = (() => {
    const name = user?.name ?? "S";
    const parts = name.split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  })();

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-6 pt-2 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold text-text-primary font-display">Community</h1>
        <button onClick={onProfile} className="w-10 h-10 rounded-full bg-accent-coral flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-white">{initials}</span>
        </button>
      </div>

      {/* Top Rare Finds */}
      {topRare.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Top Rare Finds</h2>
            <span className="text-[11px] font-semibold text-rarity-very-rare bg-rarity-very-rare/10 px-2.5 py-1 rounded-full">
              🔥 This Week
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6">
            {topRare.map((car) => (
              <RareCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Activity</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((car) => (
              <ActivityRow key={car.id} car={car} />
            ))}
            {recentActivity.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <p className="text-4xl mb-3">👀</p>
                <p className="text-[15px] font-medium text-text-secondary">No community spots yet</p>
                <p className="text-[13px] text-text-muted mt-1">Be the first to spot a car!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RareCard({ car }: { car: SpottedCar }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  return (
    <div className="shrink-0 w-[170px] rounded-[16px] bg-bg-card border border-border-subtle overflow-hidden">
      {car.imageUrl ? (
        <img src={car.imageUrl} alt={displayName} className="w-full h-[120px] object-cover" />
      ) : (
        <div className="w-full h-[120px] bg-bg-elevated flex items-center justify-center text-text-tertiary text-xs">No photo</div>
      )}
      <div className="p-3">
        <p className="text-[13px] font-semibold text-text-primary truncate">{displayName}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {car.rarity && <RarityBadge rarity={car.rarity} />}
          <span className="text-[11px] text-text-muted">by {car.spotterName.split(" ")[0]}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ car }: { car: SpottedCar }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  return (
    <div className="flex gap-3 p-3 bg-bg-card rounded-[14px] border border-border-subtle items-center">
      {car.imageUrl ? (
        <img src={car.imageUrl} alt="" className="w-14 h-14 rounded-[10px] object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-[10px] bg-bg-elevated shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text-primary truncate">{displayName}</p>
        <p className="text-[11px] text-text-muted mt-0.5">
          Spotted by {car.spotterName} · {relativeTime(car.createdAt)}
        </p>
      </div>
      {car.rarity && <RarityBadge rarity={car.rarity} />}
    </div>
  );
}
