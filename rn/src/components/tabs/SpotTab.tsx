"use client";

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, X, Check } from "lucide-react";
import { spotter, type IdentifyResult, type SpottedCar } from "@/lib/api";
import { points, rarityKey, confidenceBg } from "@/lib/rarity";
import { RarityBadge } from "@/components/ui";

export function SpotTab({ onSaved }: { onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [saved, setSaved] = useState<SpottedCar | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setSaved(null);
    setError(null);
    setIdentifying(true);
    try {
      const res = await spotter.identify(f);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Identification failed");
    }
    setIdentifying(false);
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const spot = await spotter.save({
        make: result.make,
        model: result.model,
        year: result.year,
        type: result.type,
        confidence: result.confidence,
        description: result.description,
        imageUrl: result.imageUrl,
        marketValue: result.marketValue,
        rarity: result.rarity,
        bhp: result.bhp,
        zeroToSixty: result.zeroToSixty,
        topSpeed: result.topSpeed,
      });
      setSaved(spot);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
    setSaving(false);
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setSaved(null);
    setError(null);
  };

  // ── Result view ──
  if (result) {
    const displayName = [result.year, result.make, result.model].filter(Boolean).join(" ");
    return (
      <div className="h-full overflow-y-auto scrollbar-hide pb-32">
        {/* Image */}
        <div className="relative">
          {preview && <img src={preview} alt="" className="w-full h-[280px] object-cover" />}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-2.5 py-1 bg-accent-indigo/90 rounded-[8px] text-[11px] font-semibold text-white">AI Identified</span>
            <span className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold text-white ${confidenceBg(result.confidence)}`}>
              {result.confidence}%
            </span>
          </div>
        </div>

        <div className="px-6 pt-5 space-y-5">
          {/* Name + rarity */}
          <div>
            <h2 className="text-xl font-bold text-text-primary font-display">{displayName}</h2>
            <div className="flex items-center gap-2 mt-2">
              {result.rarity && <RarityBadge rarity={result.rarity} />}
              {result.type && <span className="text-[12px] text-text-muted">{result.type}</span>}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {result.marketValue && <DetailCell label="Market Value" value={result.marketValue} />}
            {result.rarity && <DetailCell label="Rarity" value={`${result.rarity} (${points(result.rarity)} pts)`} />}
          </div>

          {/* Performance */}
          {(result.bhp || result.zeroToSixty || result.topSpeed) && (
            <div className="flex gap-2">
              {result.bhp && <PerfBox label="BHP" value={result.bhp} />}
              {result.zeroToSixty && <PerfBox label="0-60" value={`${result.zeroToSixty}s`} />}
              {result.topSpeed && <PerfBox label="Top Speed" value={`${result.topSpeed} mph`} />}
            </div>
          )}

          {/* Description */}
          {result.description && (
            <p className="text-[13px] text-text-secondary leading-relaxed">{result.description}</p>
          )}

          {error && <p className="text-danger-red text-sm text-center">{error}</p>}

          {/* Save / Saved */}
          {saved ? (
            <div className="space-y-3">
              <button className="w-full py-3.5 bg-accent-green rounded-[14px] text-white font-semibold flex items-center justify-center gap-2">
                <Check size={18} /> Saved to Collection
              </button>
              <button onClick={reset} className="w-full py-3.5 border border-border-subtle rounded-[14px] text-text-secondary font-medium text-[14px]">
                Spot Another Car
              </button>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 bg-accent-coral rounded-[14px] text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {saving ? "Saving..." : "Save Spot"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Camera/upload view ──
  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {identifying ? (
        <div className="flex flex-col items-center">
          {preview && (
            <img src={preview} alt="" className="w-48 h-48 rounded-[20px] object-cover mb-6 border border-border-subtle" />
          )}
          <div className="w-8 h-8 border-2 border-accent-coral border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary text-sm">Identifying car...</p>
        </div>
      ) : (
        <>
          {/* Viewfinder icon */}
          <div className="w-24 h-24 rounded-[20px] border-2 border-dashed border-accent-coral/40 flex items-center justify-center mb-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E85A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3.5 bg-accent-coral rounded-[14px] text-white font-semibold active:scale-[0.98] transition-transform"
            >
              <Camera size={18} /> Camera
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3.5 bg-bg-card border border-border-subtle rounded-[14px] text-text-primary font-medium active:scale-[0.98] transition-transform"
            >
              <ImageIcon size={18} /> Gallery
            </button>
          </div>

          {error && <p className="text-danger-red text-sm mb-4">{error}</p>}

          <p className="text-[12px] text-text-muted text-center px-8">
            Take a photo or pick one from your gallery. Our AI will identify the car instantly.
          </p>
        </>
      )}
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-bg-card rounded-[12px] border border-border-subtle">
      <p className="text-[10px] text-text-muted mb-0.5">{label}</p>
      <p className="text-[13px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function PerfBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 p-3 bg-bg-card rounded-[12px] border border-border-subtle text-center">
      <p className="text-[14px] font-bold text-text-primary">{value}</p>
      <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
    </div>
  );
}
