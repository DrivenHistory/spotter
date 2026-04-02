"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Zap, Trash2, MapPin } from "lucide-react";
import { type SpottedCar, spotter } from "@/lib/api";
import { points } from "@/lib/rarity";
import { RarityBadge } from "@/components/ui";
import { relativeTime } from "@/lib/time";

export function CarDetailView({
  car,
  onBack,
  onNext,
  onPrev,
  onDelete,
  canDelete = false,
}: {
  car: SpottedCar;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  const pts = points(car.rarity);

  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoExpanded, setPhotoExpanded] = useState(false);

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await spotter.delete(car.id);
      onDelete?.(car.id);
    } catch {
      setDeleting(false);
      setConfirmDel(false);
    }
  }

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
        {canDelete ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-semibold"
            style={{
              background: confirmDel ? "rgba(239,68,68,0.12)" : "transparent",
              border: confirmDel ? "1px solid rgba(239,68,68,0.3)" : "1px solid transparent",
              color: confirmDel ? "#EF4444" : "#6B6B70",
              opacity: deleting ? 0.5 : 1,
            }}
          >
            <Trash2 size={14} />
            {confirmDel ? "Confirm" : ""}
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      {/* Car image */}
      {car.imageUrl ? (
        <button
          className="w-full mb-4 p-0 border-0 bg-transparent cursor-zoom-in"
          onClick={() => setPhotoExpanded(true)}
        >
          <img src={car.imageUrl} alt={displayName} className="w-full h-[220px] object-cover rounded-[16px]" />
        </button>
      ) : (
        <div className="w-full h-[220px] bg-bg-elevated rounded-[16px] mb-4 flex items-center justify-center text-text-tertiary">No photo</div>
      )}

      {/* Fullscreen photo modal */}
      {photoExpanded && car.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setPhotoExpanded(false)}
        >
          <img
            src={car.imageUrl}
            alt={displayName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
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
            {car.bhp && <SpecCell label="Horsepower" value={car.bhp} />}
            {car.zeroToSixty && <SpecCell label="0-60 mph" value={car.zeroToSixty} />}
            {car.topSpeed && <SpecCell label="Top Speed" value={car.topSpeed} />}
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

      {/* Spotted location map */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={15} className="text-text-muted" />
          <h3 className="text-[14px] font-semibold text-text-secondary">Spotted Location</h3>
        </div>
        {car.lat != null && car.lng != null ? (
          <SpotMap lat={car.lat} lng={car.lng} />
        ) : (
          <div className="w-full h-[120px] rounded-[16px] bg-bg-card border border-border-subtle flex flex-col items-center justify-center gap-1">
            <MapPin size={20} className="text-text-muted" />
            <p className="text-[12px] text-text-muted">No location recorded</p>
          </div>
        )}
      </div>
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

// Lightweight single-pin Leaflet map for the spotted location
function SpotMap({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css" as string);
      const L = leaflet.default ?? (leaflet as unknown as typeof import("leaflet"));
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      });

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:24px;height:24px;border-radius:50% 50% 50% 0;
          background:#E85A4F;border:2px solid white;
          transform:rotate(-45deg);
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
        "/>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      L.marker([lat, lng], { icon }).addTo(map);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[180px] rounded-[16px] overflow-hidden border border-border-subtle"
    />
  );
}
