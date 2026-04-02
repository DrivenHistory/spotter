"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Car, Layers, LogIn, Map, Plus, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { spotter, user as userApi, type SpottedCar } from "@/lib/api";
import { points, spotterLevel } from "@/lib/rarity";
import { relativeTime } from "@/lib/time";
import { CarDetailView } from "@/components/CarDetailView";
import { MapView } from "@/components/MapView";

const RARITY_ORDER: Record<string, number> = {
  "Extremely Rare": 0,
  "Very Rare": 1,
  Rare: 2,
  Uncommon: 3,
  Common: 4,
};

type RarityFilter = "All" | "Rare+" | "Extremely Rare";

function rarityTextClass(rarity?: string): string {
  switch (rarity) {
    case "Extremely Rare": return "text-rarity-extremely-rare";
    case "Very Rare":      return "text-rarity-very-rare";
    case "Rare":           return "text-rarity-rare";
    case "Uncommon":       return "text-rarity-uncommon";
    default:               return "text-rarity-common";
  }
}

function rarityDotClass(rarity?: string): string {
  switch (rarity) {
    case "Extremely Rare": return "bg-rarity-extremely-rare";
    case "Very Rare":      return "bg-rarity-very-rare";
    case "Rare":           return "bg-rarity-rare";
    case "Uncommon":       return "bg-rarity-uncommon";
    default:               return "bg-rarity-common";
  }
}

export function HomeTab({
  onLogin,
  onProfile,
  active = false,
  newSpot,
  onAddCar,
}: {
  onLogin: () => void;
  onProfile?: () => void;
  active?: boolean;
  newSpot?: SpottedCar | null;
  onAddCar?: (file: File) => void;
}) {
  const { user } = useAuth();
  const [cars, setCars] = useState<SpottedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<SpottedCar | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("All");
  const [dbDisplayName, setDbDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    setRarityFilter("All");
  }, [active]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const s = await userApi.getSettings();
        if (s.displayName) setDbDisplayName(s.displayName);
      } catch { /* ignore */ }
    })();
  }, [user]);

  const initials = (() => {
    const name = dbDisplayName ?? user?.name ?? "S";
    const parts = name.split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  })();

  useEffect(() => {
    if (!user || !active) return;
    setLoading(true);
    (async () => {
      try {
        const { spots } = await spotter.getFeed();
        setCars(spots.filter((s) => s.spotterEmail.toLowerCase() === user.email.toLowerCase()));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [user, active]);

  const displayCars = useMemo(() => {
    if (!newSpot) return cars;
    return cars.some((c) => c.id === newSpot.id) ? cars : [newSpot, ...cars];
  }, [cars, newSpot]);

  const totalPts = displayCars.reduce((s, c) => s + points(c.rarity), 0);
  const rareCount = displayCars.filter((c) =>
    ["Rare", "Very Rare", "Extremely Rare"].includes(c.rarity ?? "")
  ).length;
  const extremelyRareCount = displayCars.filter((c) => c.rarity === "Extremely Rare").length;
  const levelInfo = spotterLevel(totalPts);

  const visibleCars = useMemo(() => {
    let filtered = displayCars;
    if (rarityFilter === "Rare+") {
      filtered = displayCars.filter((c) =>
        ["Rare", "Very Rare", "Extremely Rare"].includes(c.rarity ?? "")
      );
    } else if (rarityFilter === "Extremely Rare") {
      filtered = displayCars.filter((c) => c.rarity === "Extremely Rare");
    }
    return [...filtered].sort((a, b) => {
      const rd = (RARITY_ORDER[a.rarity ?? ""] ?? 99) - (RARITY_ORDER[b.rarity ?? ""] ?? 99);
      if (rd !== 0) return rd;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [displayCars, rarityFilter]);

  const leftCol = visibleCars.filter((_, i) => i % 2 === 0);
  const rightCol = visibleCars.filter((_, i) => i % 2 === 1);

  if (showMap) {
    return (
      <MapView
        cars={displayCars}
        onBack={() => setShowMap(false)}
        onCarSelect={(car) => { setShowMap(false); setSelectedCar(car); }}
      />
    );
  }

  if (selectedCar) {
    const idx = displayCars.findIndex((c) => c.id === selectedCar.id);
    return (
      <CarDetailView
        car={selectedCar}
        onBack={() => setSelectedCar(null)}
        onNext={idx < displayCars.length - 1 ? () => setSelectedCar(displayCars[idx + 1]) : undefined}
        onPrev={idx > 0 ? () => setSelectedCar(displayCars[idx - 1]) : undefined}
        canDelete
        onDelete={(id) => {
          setCars((prev) => prev.filter((c) => c.id !== id));
          setSelectedCar(null);
        }}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      {/* Hidden gallery input */}
      <input
        id="home-gallery-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onAddCar?.(f);
        }}
      />

      <div className="px-5 pt-5 pb-24 flex flex-col gap-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <span className="text-[26px] font-black tracking-tight text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Spotter
          </span>
          <div className="flex items-center gap-2">
            {user && (
              <label
                htmlFor="home-gallery-input"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-card text-text-muted active:opacity-70 transition-opacity cursor-pointer"
                aria-label="Add car from library"
              >
                <Plus size={17} strokeWidth={2.5} />
              </label>
            )}
            {user && (
              <button
                onClick={() => setShowMap(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-card text-text-muted active:opacity-70 transition-opacity"
                aria-label="View map"
              >
                <Map size={17} strokeWidth={2} />
              </button>
            )}
            <button
              onClick={onProfile}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-card text-text-muted active:opacity-70 transition-opacity"
              aria-label="Notifications"
            >
              <Bell size={17} strokeWidth={2} />
            </button>
            <button
              onClick={onProfile}
              className="w-10 h-10 rounded-full bg-accent-coral flex items-center justify-center shrink-0 active:opacity-80 transition-opacity"
            >
              <span className="text-sm font-bold text-white">{user ? initials : "?"}</span>
            </button>
          </div>
        </div>

        {!user ? (
          /* ── Logged-out state ── */
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-accent-coral/10 flex items-center justify-center mb-4">
              <Car size={28} className="text-accent-coral" />
            </div>
            <p className="text-[18px] font-semibold text-text-primary mb-2">Sign in to see your cars</p>
            <p className="text-[14px] text-text-secondary mb-6 px-6">
              Create an account to save spotted cars and track your collection.
            </p>
            <button
              onClick={onLogin}
              className="flex items-center gap-2 h-[48px] px-8 bg-accent-coral rounded-[24px] text-white font-semibold text-[16px] active:scale-[0.97] transition-transform"
            >
              <LogIn size={18} />
              Sign In
            </button>
          </div>
        ) : (
          <>
            {/* ── Hero banner ── */}
            <div
              className="rounded-[20px] px-4 py-3 flex flex-col gap-2"
              style={{
                background: "linear-gradient(135deg, #E85A4F 0%, #C2185B 100%)",
                boxShadow: "0 8px 24px rgba(232, 90, 79, 0.35)",
              }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[1.2px] text-white/60 uppercase">
                  Spotter Rank
                </span>
                <span className="text-[15px] font-black text-white bg-white/20 px-3 py-1 rounded-xl">
                  Level {levelInfo.level}
                </span>
              </div>

              {/* Points */}
              <div className="text-[36px] font-black text-white leading-none">
                {totalPts.toLocaleString()}
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] text-white/60">Total Points</span>
                <div className="flex flex-col items-end gap-1">
                  {levelInfo.nextMin < Infinity && (
                    <span className="text-[10px] text-white/50">
                      {levelInfo.nextMin.toLocaleString()} pts to Level {levelInfo.level + 1}
                    </span>
                  )}
                  <div className="w-[110px] h-[5px] rounded-full bg-white/25 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mini stats / filters ── */}
            <div className="flex gap-2">
              {([
                { filter: "All" as RarityFilter,              icon: <Layers size={16} className="shrink-0" />, count: displayCars.length,    label: "Spotted"  },
                { filter: "Rare+" as RarityFilter,            icon: <Star   size={16} className="shrink-0" />, count: rareCount,              label: "Rare+"    },
                { filter: "Extremely Rare" as RarityFilter,   icon: <Star   size={16} className="shrink-0" />, count: extremelyRareCount,     label: "Ex. Rare" },
              ]).map(({ filter, icon, count, label }) => {
                const active = rarityFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setRarityFilter(filter)}
                    className={`flex-1 flex items-center gap-2.5 rounded-[14px] px-3 py-3 border transition-colors active:opacity-80 ${
                      active
                        ? "bg-accent-coral/10 border-accent-coral/40"
                        : "bg-bg-card border-border-subtle"
                    }`}
                  >
                    <span className={active ? "text-accent-coral" : "text-text-muted"}>{icon}</span>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className={`text-[16px] font-bold leading-none ${active ? "text-accent-coral" : "text-text-primary"}`}>{count}</span>
                      <span className="text-[10px] text-text-muted">{label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Car grid ── */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
              </div>
            ) : visibleCars.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="text-4xl mb-3">
                  {rarityFilter !== "All" ? "⭐" : "🚗"}
                </div>
                <p className="text-[15px] font-medium text-text-secondary">
                  {rarityFilter !== "All" ? `No ${rarityFilter} cars yet` : "No cars spotted yet"}
                </p>
                <p className="text-[12px] text-text-muted mt-1">
                  {rarityFilter !== "All"
                    ? "Keep spotting to find them!"
                    : "Use the Spot tab to identify your first car!"}
                </p>
              </div>
            ) : (
              <div className="flex gap-3 items-start overflow-hidden">
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  {leftCol.map((car) => (
                    <CarCard key={car.id} car={car} onTap={() => setSelectedCar(car)} />
                  ))}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  {rightCol.map((car) => (
                    <CarCard key={car.id} car={car} onTap={() => setSelectedCar(car)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CarCard({ car, onTap }: { car: SpottedCar; onTap: () => void }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  const date = car.spottedAt ?? car.createdAt;
  return (
    <button
      onClick={onTap}
      className="rounded-[16px] bg-bg-card overflow-hidden text-left border border-border-subtle active:opacity-75 transition-opacity"
    >
      {car.imageUrl ? (
        <img src={car.imageUrl} alt={displayName} className="w-full h-[90px] object-cover" />
      ) : (
        <div className="w-full h-[90px] bg-bg-elevated" />
      )}
      <div className="px-3 py-2.5 flex flex-col gap-1.5">
        <p className="text-[12px] font-semibold text-text-primary truncate">{displayName}</p>
        {car.rarity && (
          <div className="flex items-center gap-1.5">
            <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${rarityDotClass(car.rarity)}`} />
            <span className={`text-[10px] truncate ${rarityTextClass(car.rarity)}`}>{car.rarity}</span>
          </div>
        )}
        <p className="text-[10px] text-text-muted">{relativeTime(date)}</p>
      </div>
    </button>
  );
}
