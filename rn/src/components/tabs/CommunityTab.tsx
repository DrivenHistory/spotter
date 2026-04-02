"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowRight, Check, X, Mail, Map } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useGroups } from "@/lib/groups-context";
import { spotter, type SpottedCar } from "@/lib/api";
import { points } from "@/lib/rarity";
import { relativeTime } from "@/lib/time";
import { RarityBadge } from "@/components/ui";
import { CarDetailView } from "@/components/CarDetailView";
import { MapView } from "@/components/MapView";

const RARE_TIERS = ["Rare", "Very Rare", "Extremely Rare"];

export function CommunityTab({ onProfile }: { onProfile?: () => void }) {
  const { user } = useAuth();
  const { pendingInvites, acceptInvite, declineInvite } = useGroups();
  const [allSpots, setAllSpots] = useState<SpottedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<SpottedCar | null>(null);
  const [showMap, setShowMap] = useState(false);

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

  // Combined list for swipe navigation: top rare first, then recent activity
  const allNavigable = useMemo(() => {
    const seen = new Set<string>();
    const list: SpottedCar[] = [];
    for (const c of [...topRare, ...recentActivity]) {
      if (!seen.has(c.id)) { seen.add(c.id); list.push(c); }
    }
    return list;
  }, [topRare, recentActivity]);

  if (showMap) {
    return (
      <MapView
        cars={allSpots}
        onBack={() => setShowMap(false)}
        onCarSelect={(car) => { setShowMap(false); setSelectedCar(car); }}
      />
    );
  }

  if (selectedCar) {
    const idx = allNavigable.findIndex((c) => c.id === selectedCar.id);
    return (
      <CarDetailView
        car={selectedCar}
        onBack={() => setSelectedCar(null)}
        onNext={idx < allNavigable.length - 1 ? () => setSelectedCar(allNavigable[idx + 1]) : undefined}
        onPrev={idx > 0 ? () => setSelectedCar(allNavigable[idx - 1]) : undefined}
        canDelete={!!user && selectedCar.spotterEmail.toLowerCase() === user.email.toLowerCase()}
        onDelete={(id) => {
          setAllSpots((prev) => prev.filter((c) => c.id !== id));
          setSelectedCar(null);
        }}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[28px] font-bold text-text-primary">Community</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMap(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-card text-text-muted active:opacity-70 transition-opacity"
            aria-label="View map"
          >
            <Map size={17} strokeWidth={2} />
          </button>
          <button onClick={onProfile} className="w-10 h-10 rounded-full bg-accent-coral flex items-center justify-center shrink-0">
            <span className="text-[14px] font-bold text-white">{initials}</span>
          </button>
        </div>
      </div>

      {/* Pending Invites Banner */}
      {pendingInvites.length > 0 && (
        <div className="mb-5 p-4 bg-accent-coral/10 border border-accent-coral/30 rounded-[16px]">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={18} className="text-accent-coral" />
            <h2 className="text-[16px] font-semibold text-text-primary">
              {pendingInvites.length === 1 ? "You have a game invite!" : `You have ${pendingInvites.length} game invites!`}
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 bg-bg-card rounded-[12px]">
                <div className="w-9 h-9 rounded-[10px] bg-bg-elevated flex items-center justify-center text-[18px] shrink-0">
                  {inv.groupIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary truncate">{inv.groupName}</p>
                  <p className="text-[11px] text-text-secondary">from {inv.inviterName}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptInvite(inv.id).catch(() => {})}
                    className="h-8 px-3 rounded-[8px] bg-accent-coral flex items-center gap-1"
                  >
                    <Check size={14} className="text-white" />
                    <span className="text-[12px] font-semibold text-white">Join</span>
                  </button>
                  <button
                    onClick={() => declineInvite(inv.id).catch(() => {})}
                    className="w-8 h-8 rounded-[8px] bg-bg-elevated flex items-center justify-center"
                  >
                    <X size={14} className="text-text-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Rare Finds */}
      {topRare.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-semibold text-text-primary">Top Rare Finds</h2>
            <span className="text-[12px] font-semibold text-[#A855F7] bg-[#A855F7]/10 px-2.5 py-1 rounded-[12px]">
              🔥 This Week
            </span>
          </div>
          {/* Carousel breaks out of px-5 to scroll edge-to-edge */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
            {topRare.map((car) => (
              <RareCard key={car.id} car={car} onTap={() => setSelectedCar(car)} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <h2 className="text-[18px] font-semibold text-text-primary mb-2">Recent Activity</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recentActivity.map((car) => (
            <ActivityRow key={car.id} car={car} onTap={() => setSelectedCar(car)} />
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

      {/* DrivenHistory promo */}
      <button
        onClick={() => window.open("https://www.drivenhistory.com", "_blank")}
        className="mt-4 w-full flex items-center gap-3 p-4 bg-bg-card rounded-[16px] border border-accent-coral/20"
      >
        <div className="w-10 h-10 rounded-[10px] bg-accent-coral/15 flex items-center justify-center shrink-0">
          <span className="text-[16px] font-bold text-accent-coral">DH</span>
        </div>
        <div className="flex-1 text-left flex flex-col gap-1">
          <p className="text-[14px] font-semibold text-text-primary">Join the community</p>
          <p className="text-[12px] text-text-secondary">Connect on DrivenHistory.com</p>
        </div>
        <ArrowRight size={20} className="text-accent-coral shrink-0" />
      </button>
    </div>
  );
}

function RareCard({ car, onTap }: { car: SpottedCar; onTap: () => void }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  return (
    <button onClick={onTap} className="shrink-0 w-[170px] rounded-[16px] bg-bg-card overflow-hidden flex flex-col text-left">
      {car.imageUrl ? (
        <img src={car.imageUrl} alt={displayName} className="w-full h-[120px] object-cover shrink-0" />
      ) : (
        <div className="w-full h-[120px] bg-bg-elevated flex items-center justify-center text-text-tertiary text-xs shrink-0">No photo</div>
      )}
      <div className="flex flex-col gap-1 px-3.5 py-2.5 mt-auto">
        <p className="text-[13px] font-semibold text-text-primary truncate">{displayName}</p>
        <div className="flex items-center gap-2">
          {car.rarity && <RarityBadge rarity={car.rarity} />}
          <span className="text-[11px] text-text-muted">by {(car.spotterName || car.spotterEmail.split("@")[0]).split(" ")[0]}</span>
        </div>
      </div>
    </button>
  );
}

function ActivityRow({ car, onTap }: { car: SpottedCar; onTap: () => void }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  return (
    <button onClick={onTap} className="flex items-center gap-3 p-3 bg-bg-card rounded-[12px] text-left w-full">
      {car.imageUrl ? (
        <img src={car.imageUrl} alt="" className="w-14 h-14 rounded-[8px] object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-[8px] bg-bg-elevated shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-text-primary truncate">{displayName}</p>
        <p className="text-[12px] text-text-secondary mt-0.5">
          Spotted by {car.spotterName || car.spotterEmail.split("@")[0]} · {relativeTime(car.createdAt)}
        </p>
      </div>
      {car.rarity && <RarityBadge rarity={car.rarity} />}
    </button>
  );
}
