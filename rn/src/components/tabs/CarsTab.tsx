"use client";

import { useEffect, useMemo, useState } from "react";
import { spotter, user as userApi, type SpottedCar } from "@/lib/api";
import { points, RARITY_POINTS } from "@/lib/rarity";
import { CarDetailView } from "@/components/CarDetailView";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useAuth } from "@/lib/auth-context";
import { Zap, Flame, Star, DollarSign } from "lucide-react";

const RARITY_ORDER: Record<string, number> = {
  "Extremely Rare": 0,
  "Very Rare": 1,
  Rare: 2,
  Uncommon: 3,
  Common: 4,
};

function parseNum(val?: string): number {
  if (!val) return -1;
  const match = val.match(/[\d,]+(\.\d+)?/);
  if (!match) return -1;
  const n = parseFloat(match[0].replace(/,/g, ""));
  return isNaN(n) ? -1 : n;
}

export function CarsTab({
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
  const [brandFilter, setBrandFilter] = useState<string>("All");
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
    if (!active) return;
    setLoading(true);
    (async () => {
      try {
        const { spots } = await spotter.getFeed();
        setCars(spots);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [active]);

  const allCars = useMemo(() => {
    if (!newSpot) return cars;
    return cars.some((c) => c.id === newSpot.id) ? cars : [newSpot, ...cars];
  }, [cars, newSpot]);

  const brands = useMemo(() => {
    const makes = Array.from(new Set(allCars.map((c) => c.make).filter(Boolean))).sort();
    return ["All", ...makes];
  }, [allCars]);

  const filtered = useMemo(
    () => (brandFilter === "All" ? allCars : allCars.filter((c) => c.make === brandFilter)),
    [allCars, brandFilter]
  );

  const fastest = useMemo(
    () =>
      [...filtered]
        .filter((c) => parseNum(c.topSpeed) > 0)
        .sort((a, b) => parseNum(b.topSpeed) - parseNum(a.topSpeed))
        .slice(0, 5),
    [filtered]
  );

  const mostPowerful = useMemo(
    () =>
      [...filtered]
        .filter((c) => parseNum(c.bhp) > 0)
        .sort((a, b) => parseNum(b.bhp) - parseNum(a.bhp))
        .slice(0, 5),
    [filtered]
  );

  const rarest = useMemo(
    () =>
      [...filtered]
        .filter((c) => c.rarity && RARITY_ORDER[c.rarity] !== undefined)
        .sort(
          (a, b) =>
            (RARITY_ORDER[a.rarity ?? ""] ?? 99) - (RARITY_ORDER[b.rarity ?? ""] ?? 99)
        )
        .slice(0, 5),
    [filtered]
  );

  const mostValuable = useMemo(
    () =>
      [...filtered]
        .filter((c) => parseNum(c.marketValue) > 0)
        .sort((a, b) => parseNum(b.marketValue) - parseNum(a.marketValue))
        .slice(0, 5),
    [filtered]
  );

  if (selectedCar) {
    const idx = allCars.findIndex((c) => c.id === selectedCar.id);
    return (
      <CarDetailView
        car={selectedCar}
        onBack={() => setSelectedCar(null)}
        onNext={idx < allCars.length - 1 ? () => setSelectedCar(allCars[idx + 1]) : undefined}
        onPrev={idx > 0 ? () => setSelectedCar(allCars[idx - 1]) : undefined}
        canDelete={!!user && selectedCar.spotterEmail.toLowerCase() === user.email.toLowerCase()}
        onDelete={(id) => {
          setCars((prev) => prev.filter((c) => c.id !== id));
          setSelectedCar(null);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
        <h1 className="text-[28px] font-bold text-text-primary">Top Spots</h1>
        <button
          onClick={onProfile}
          className="w-10 h-10 rounded-full bg-accent-coral flex items-center justify-center shrink-0"
        >
          <span className="text-sm font-bold text-white">{user ? initials : "?"}</span>
        </button>
      </div>

      {/* Brand filter pills */}
      <div className="shrink-0 overflow-x-auto scrollbar-hide px-5 pb-3">
        <div className="flex gap-2 w-max">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setBrandFilter(brand)}
              className={`px-3 h-8 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                brandFilter === brand
                  ? "bg-accent-coral text-white"
                  : "bg-bg-card text-text-secondary"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <PullToRefresh className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-24" onRefresh={async () => {
        try {
          const { spots } = await spotter.getFeed();
          setCars(spots);
        } catch { /* ignore */ }
      }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Section
              icon={<Zap size={16} className="text-accent-amber" />}
              title="Fastest"
              color="text-accent-amber"
              cars={fastest}
              stat={(c) => c.topSpeed ?? ""}
              onSelect={setSelectedCar}
            />
            <Section
              icon={<Flame size={16} className="text-accent-coral" />}
              title="Most Powerful"
              color="text-accent-coral"
              cars={mostPowerful}
              stat={(c) => c.bhp ?? ""}
              onSelect={setSelectedCar}
            />
            <Section
              icon={<Star size={16} className="text-rarity-very-rare" />}
              title="Rarest"
              color="text-rarity-very-rare"
              cars={rarest}
              stat={(c) => c.rarity ?? ""}
              onSelect={setSelectedCar}
            />
            <Section
              icon={<DollarSign size={16} className="text-accent-green" />}
              title="Most Valuable"
              color="text-accent-green"
              cars={mostValuable}
              stat={(c) => c.marketValue ?? ""}
              onSelect={setSelectedCar}
            />
          </>
        )}
      </PullToRefresh>
    </div>
  );
}

function Section({
  icon,
  title,
  color,
  cars,
  stat,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  cars: SpottedCar[];
  stat: (c: SpottedCar) => string;
  onSelect: (c: SpottedCar) => void;
}) {
  if (cars.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-3">
        {icon}
        <h2 className={`text-[16px] font-semibold ${color}`}>{title}</h2>
      </div>
      <div className="flex flex-col gap-2">
        {cars.map((car, i) => {
          const name = [car.year, car.make, car.model].filter(Boolean).join(" ");
          const statVal = stat(car);
          return (
            <button
              key={car.id}
              onClick={() => onSelect(car)}
              className="flex items-center gap-3 bg-bg-card rounded-[14px] overflow-hidden active:opacity-80 transition-opacity"
            >
              {/* Rank */}
              <span className="w-9 shrink-0 text-center text-[13px] font-bold text-text-muted">
                #{i + 1}
              </span>
              {/* Thumbnail */}
              {car.imageUrl ? (
                <img
                  src={car.imageUrl}
                  alt={name}
                  className="w-[64px] h-[48px] object-cover shrink-0"
                />
              ) : (
                <div className="w-[64px] h-[48px] bg-bg-elevated shrink-0" />
              )}
              {/* Info */}
              <div className="flex-1 min-w-0 py-2 pr-3">
                <p className="text-[13px] font-semibold text-text-primary truncate">{name}</p>
                <p className="text-[11px] text-text-muted truncate">{car.spotterName || car.spotterEmail.split("@")[0]}</p>
                {statVal && (
                  <p className={`text-[12px] mt-0.5 font-medium ${color}`}>{statVal}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
