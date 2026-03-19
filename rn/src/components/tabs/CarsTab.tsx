"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Car, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { spotter, type SpottedCar } from "@/lib/api";
import { points } from "@/lib/rarity";
import { CarDetailView } from "@/components/CarDetailView";

export function CarsTab({ onLogin }: { onLogin: () => void }) {
  const { user } = useAuth();
  const [cars, setCars] = useState<SpottedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<SpottedCar | null>(null);

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

  if (selectedCar) {
    return <CarDetailView car={selectedCar} onBack={() => setSelectedCar(null)} />;
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-5 pb-24">
      <h1 className="text-[28px] font-bold text-text-primary mb-4">My Cars</h1>

      {!user ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-accent-coral/10 flex items-center justify-center mb-4">
            <Car size={28} className="text-accent-coral" />
          </div>
          <p className="text-[18px] font-semibold text-text-primary mb-2">Sign in to see your cars</p>
          <p className="text-[14px] text-text-secondary mb-6 px-6">Create an account to save spotted cars and track your collection.</p>
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
          {/* Stats */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 flex flex-col items-center justify-center rounded-[12px] bg-bg-card p-3 gap-0.5">
              <span className="text-[24px] font-bold text-text-primary">{cars.length}</span>
              <span className="text-[11px] text-text-secondary">Total</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center rounded-[12px] bg-bg-card p-3 gap-0.5">
              <span className="text-[24px] font-bold text-rarity-rare">{rareCount}</span>
              <span className="text-[11px] text-text-secondary">Rare+</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center rounded-[12px] bg-bg-card p-3 gap-0.5">
              <span className="text-[24px] font-bold text-accent-coral">{totalPts}</span>
              <span className="text-[11px] text-text-secondary">Points</span>
            </div>
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
                <CarCard key={car.id} car={car} onTap={() => setSelectedCar(car)} />
              ))}
            </div>
          )}

          {/* DrivenHistory promo */}
          <button
            onClick={() => window.open("https://www.drivenhistory.com", "_blank")}
            className="mt-4 w-full flex items-center gap-3.5 p-4 bg-bg-card rounded-[16px] border border-accent-coral/20"
          >
            <img src="/dh-logo-horizontal.png" alt="DH" className="w-12 h-12 rounded-[12px] object-contain" />
            <div className="flex-1 text-left flex flex-col gap-1">
              <p className="text-[14px] font-semibold text-text-primary">Track your full collection</p>
              <p className="text-[12px] text-text-secondary">View your garage on DrivenHistory.com</p>
            </div>
            <ArrowRight size={20} className="text-accent-coral shrink-0" />
          </button>
        </>
      )}
    </div>
  );
}

function CarCard({ car, onTap }: { car: SpottedCar; onTap: () => void }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  const rarityLabel = car.rarity ? `${car.rarity} · ${points(car.rarity)} pts` : null;
  const rarityColor = car.rarity ? `text-rarity-${car.rarity.toLowerCase().replace(/\s+/g, "-")}` : "";
  return (
    <button onClick={onTap} className="rounded-[16px] bg-bg-card overflow-hidden text-left">
      {car.imageUrl ? (
        <img src={car.imageUrl} alt={displayName} className="w-full h-[100px] object-cover" />
      ) : (
        <div className="w-full h-[100px] bg-bg-elevated" />
      )}
      <div className="py-2 px-3">
        <p className="text-[13px] font-semibold text-text-primary truncate">{displayName}</p>
        {rarityLabel && <p className={`text-[11px] mt-0.5 ${rarityColor}`}>{rarityLabel}</p>}
      </div>
    </button>
  );
}
