"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Car, Gem, Layers, Lock, LogIn, Map, Medal, Plus, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { spotter, user as userApi, type SpottedCar } from "@/lib/api";
import { points, spotterLevel } from "@/lib/rarity";
import { relativeTime } from "@/lib/time";
import { CarDetailView } from "@/components/CarDetailView";
import { MapView } from "@/components/MapView";
import { cacheGet, cacheSet, cacheClear } from "@/lib/cache";

const RARITY_ORDER: Record<string, number> = {
  "Extremely Rare": 0,
  "Very Rare": 1,
  Rare: 2,
  Uncommon: 3,
  Common: 4,
};


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
  const [dbDisplayName, setDbDisplayName] = useState<string | null>(null);

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
    const cacheKey = `feed_${user.email}`;
    const cached = cacheGet<SpottedCar[]>(cacheKey);
    if (cached) {
      setCars(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    (async () => {
      try {
        const { spots } = await spotter.getFeed();
        const mine = spots.filter((s) => s.spotterEmail.toLowerCase() === user.email.toLowerCase());
        setCars(mine);
        cacheSet(cacheKey, mine);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [user, active]);

  const displayCars = useMemo(() => {
    if (!newSpot) return cars;
    return cars.some((c) => c.id === newSpot.id) ? cars : [newSpot, ...cars];
  }, [cars, newSpot]);

  const totalPts = displayCars.reduce((s, c) => s + points(c.rarity), 0);
  const rareOnlyCount = displayCars.filter((c) => c.rarity === "Rare").length;
  const veryRareCount = displayCars.filter((c) => c.rarity === "Very Rare").length;
  const extremelyRareCount = displayCars.filter((c) => c.rarity === "Extremely Rare").length;
  const levelInfo = spotterLevel(totalPts);

  // ── Level-up detection ──
  const [levelUpInfo, setLevelUpInfo] = useState<{ from: number; to: number } | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  // Capture baseline level once initial load completes (no animation)
  useEffect(() => {
    if (!loading && prevLevelRef.current === null) {
      prevLevelRef.current = levelInfo.level;
    }
  }, [loading, levelInfo.level]);

  // Detect level-up whenever a new spot arrives
  useEffect(() => {
    if (!newSpot || prevLevelRef.current === null) return;
    const newLevel = spotterLevel(totalPts).level;
    if (newLevel > prevLevelRef.current) {
      setLevelUpInfo({ from: prevLevelRef.current, to: newLevel });
      prevLevelRef.current = newLevel;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSpot]);

  const hasRare = displayCars.some((c) => ["Rare", "Very Rare", "Extremely Rare"].includes(c.rarity ?? ""));
  const hasVeryRare = displayCars.some((c) => ["Very Rare", "Extremely Rare"].includes(c.rarity ?? ""));
  const hasExtremelyRare = displayCars.some((c) => c.rarity === "Extremely Rare");

  const visibleCars = useMemo(() => {
    return [...displayCars].sort((a, b) => {
      const rd = (RARITY_ORDER[a.rarity ?? ""] ?? 99) - (RARITY_ORDER[b.rarity ?? ""] ?? 99);
      if (rd !== 0) return rd;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [displayCars]);

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
          setCars((prev) => {
            const next = prev.filter((c) => c.id !== id);
            if (user) cacheSet(`feed_${user.email}`, next);
            return next;
          });
          setSelectedCar(null);
        }}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide relative">
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
              className="rounded-[20px] px-[18px] py-[14px] flex flex-col gap-[10px]"
              style={{
                background: "linear-gradient(135deg, #E85A4F 0%, #C2185B 100%)",
                boxShadow: "0 8px 24px rgba(232, 90, 79, 0.35)",
              }}
            >
              {/* Top row */}
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[24px] font-black text-white leading-none">
                    Level {levelInfo.level}
                  </span>
                  <span className="text-[11px] text-white/75">Car Spotter</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold tracking-[1px] text-white/70 uppercase">Points</span>
                  <span className="text-[28px] font-black text-white leading-none">
                    {totalPts.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-[4px] rounded-full bg-black/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
                />
              </div>

              {/* Divider + achievements label */}
              <div className="w-full h-px bg-white/20" />
              <span className="text-[9px] font-bold tracking-[1.2px] text-white/60 uppercase">Achievements</span>

              {/* 4-column badge row */}
              <div className="flex rounded-[14px] bg-black/20 overflow-hidden">
                {([
                  { icon: <Medal size={18} />,  iconColor: "#F5A623", label: "Rare",      count: rareOnlyCount,       earned: hasRare          },
                  { icon: <Trophy size={18} />, iconColor: "#D0D0D0", label: "Very Rare", count: veryRareCount,       earned: hasVeryRare      },
                  { icon: <Gem size={18} />,    iconColor: "#FFFFFF", label: "Ex. Rare",  count: extremelyRareCount,  earned: hasExtremelyRare },
                  { icon: <Layers size={18} />, iconColor: "#FFFFFF", label: "Total",     count: displayCars.length,  earned: true             },
                ] as const).map(({ icon, iconColor, label, count, earned }, i, arr) => (
                  <div key={label} className="flex flex-1">
                    <div
                      className="flex-1 flex flex-col items-center justify-center gap-[5px] py-[10px]"
                      style={{ opacity: earned ? 1 : 0.35 }}
                    >
                      <span style={{ color: earned ? iconColor : "#FFFFFF" }}>
                        {earned ? icon : <Lock size={18} />}
                      </span>
                      <span className="text-[10px] font-semibold text-white/70 tracking-[0.3px] text-center leading-tight">
                        {label}
                      </span>
                      <span className="text-[20px] font-black text-white leading-none">
                        {earned ? count : "—"}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-px bg-white/15 self-stretch" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Car grid ── */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
              </div>
            ) : visibleCars.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="text-4xl mb-3">🚗</div>
                <p className="text-[15px] font-medium text-text-secondary">No cars spotted yet</p>
                <p className="text-[12px] text-text-muted mt-1">
                  Use the Spot tab to identify your first car!
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

      {levelUpInfo && (
        <LevelUpOverlay
          from={levelUpInfo.from}
          to={levelUpInfo.to}
          onDismiss={() => setLevelUpInfo(null)}
        />
      )}
    </div>
  );
}

function LevelUpOverlay({ from, to, onDismiss }: { from: number; to: number; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const levelsGained = to - from;
  const particles = ["⭐", "✨", "🌟", "⭐", "✨", "🌟"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,8,10,0.88)", animation: "lvlFadeIn 0.25s ease forwards" }}
      onClick={onDismiss}
    >
      {/* Floating particles */}
      {particles.map((emoji, i) => (
        <span
          key={i}
          className="absolute text-[22px] pointer-events-none select-none"
          style={{
            left: `${8 + i * 16}%`,
            bottom: "20%",
            animation: `lvlParticle 2.4s ${i * 0.18}s ease-out forwards`,
            opacity: 0,
          }}
        >
          {emoji}
        </span>
      ))}

      {/* Card */}
      <div
        className="flex flex-col items-center gap-3 text-center px-10"
        style={{ animation: "lvlCardIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
      >
        {/* Badge */}
        <div className="px-4 py-1 rounded-full bg-accent-coral/20 border border-accent-coral/40">
          <span className="text-[11px] font-bold tracking-[3px] uppercase text-accent-coral">
            Level Up!
          </span>
        </div>

        {/* Level number */}
        <div
          className="text-[100px] font-black leading-none"
          style={{
            fontFamily: "var(--font-display)",
            animation: "lvlNumIn 0.4s 0.18s cubic-bezier(0.34,1.56,0.64,1) both",
            background: "linear-gradient(135deg, #ffffff 30%, #E85A4F 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {to}
        </div>

        <p className="text-[16px] font-semibold text-text-secondary">
          {levelsGained > 1 ? `${levelsGained} levels gained!` : "New level reached"}
        </p>

        {/* Auto-dismiss progress bar */}
        <div className="w-28 h-[3px] rounded-full bg-white/15 overflow-hidden mt-1">
          <div
            className="h-full bg-accent-coral rounded-full"
            style={{ animation: "lvlDismiss 4s linear forwards" }}
          />
        </div>

        <p className="text-[11px] text-text-muted">Tap to continue</p>
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
