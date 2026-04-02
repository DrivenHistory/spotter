"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { SpottedCar } from "@/lib/api";
import { points } from "@/lib/rarity";

// Leaflet is loaded dynamically to avoid SSR issues
let L: typeof import("leaflet") | null = null;

interface Props {
  cars: SpottedCar[];
  onBack: () => void;
  onCarSelect: (car: SpottedCar) => void;
}

function rarityColor(rarity?: string): string {
  switch (rarity) {
    case "Extremely Rare": return "#F87171";
    case "Very Rare":      return "#C084FC";
    case "Rare":           return "#60A5FA";
    case "Uncommon":       return "#34D399";
    default:               return "#9CA3AF";
  }
}

export function MapView({ cars, onBack, onCarSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  const mappableCars = cars.filter((c) => c.lat != null && c.lng != null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      // Dynamically import Leaflet (avoids SSR issues)
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css" as string);
      L = leaflet.default ?? (leaflet as unknown as typeof import("leaflet"));
      if (cancelled || !containerRef.current) return;

      // Default center: first car or London fallback
      const first = mappableCars[0];
      const center: [number, number] = first
        ? [first.lat!, first.lng!]
        : [51.505, -0.09];

      const map = L.map(containerRef.current, {
        center,
        zoom: first ? 13 : 5,
        zoomControl: true,
      });

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Add a pin for each car with location
      mappableCars.forEach((car) => {
        const color = rarityColor(car.rarity);
        const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
        const pts = points(car.rarity);

        // Custom SVG pin
        const icon = L!.divIcon({
          className: "",
          html: `
            <div style="
              width:36px;height:36px;border-radius:50% 50% 50% 0;
              background:${color};border:2px solid white;
              transform:rotate(-45deg);
              box-shadow:0 2px 8px rgba(0,0,0,0.4);
              cursor:pointer;
            ">
              ${car.imageUrl ? `
                <img src="${car.imageUrl}"
                  style="width:28px;height:28px;border-radius:50%;object-fit:cover;
                         transform:rotate(45deg);margin:2px;"
                />
              ` : `
                <div style="width:28px;height:28px;border-radius:50%;
                             background:#1a1a1a;transform:rotate(45deg);margin:2px;"/>
              `}
            </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -38],
        });

        const popup = L!.popup({
          className: "spotter-popup",
          closeButton: false,
          maxWidth: 200,
        }).setContent(`
          <div style="
            background:#16161A;border:1px solid #2A2A2E;border-radius:12px;
            overflow:hidden;cursor:pointer;min-width:160px;
          " onclick="this.dispatchEvent(new CustomEvent('car-select',{bubbles:true,detail:'${car.id}'}))">
            ${car.imageUrl
              ? `<img src="${car.imageUrl}" style="width:100%;height:80px;object-fit:cover;"/>`
              : `<div style="width:100%;height:80px;background:#1A1A1E;"/>`}
            <div style="padding:8px 10px;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#FAFAF9;">${displayName}</p>
              <p style="margin:2px 0 0;font-size:11px;color:${color};">${car.rarity ?? "Common"}${pts ? ` · ${pts} pts` : ""}</p>
            </div>
          </div>`);

        const marker = L!.marker([car.lat!, car.lng!], { icon }).addTo(map);
        marker.bindPopup(popup);
        marker.on("click", () => marker.openPopup());
      });

      // Listen for car-select events bubbling out of popups
      containerRef.current.addEventListener("car-select", (e: Event) => {
        const id = (e as CustomEvent<string>).detail;
        const car = mappableCars.find((c) => c.id === id);
        if (car) onCarSelect(car);
      });

      // Fit bounds if multiple cars
      if (mappableCars.length > 1) {
        const bounds = L.latLngBounds(mappableCars.map((c) => [c.lat!, c.lng!]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col bg-bg-page">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
        <button onClick={onBack} className="p-1 -ml-1 text-text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[20px] font-bold text-text-primary">Spotted Map</h1>
        <span className="ml-auto text-[13px] text-text-muted">{mappableCars.length} pin{mappableCars.length !== 1 ? "s" : ""}</span>
      </div>

      {mappableCars.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <p className="text-4xl mb-4">📍</p>
          <p className="text-[16px] font-semibold text-text-primary mb-2">No locations yet</p>
          <p className="text-[13px] text-text-muted">Future spots will appear here. Make sure location access is enabled when spotting.</p>
        </div>
      ) : (
        <div ref={containerRef} className="flex-1" />
      )}
    </div>
  );
}
