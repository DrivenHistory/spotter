"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, ArrowLeft, Check, Zap, RotateCcw, X, LogIn } from "lucide-react";
import { spotter, type IdentifyResult, type SpottedCar } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { points } from "@/lib/rarity";
import { RarityBadge } from "@/components/ui";

const PENDING_SPOT_KEY = "spotter_pending_spot";
const MAX_DIMENSION = 1500;
const JPEG_QUALITY = 0.7;

/** Compress image to JPEG, capping dimensions at MAX_DIMENSION */
function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function savePendingSpot(result: IdentifyResult) {
  try { localStorage.setItem(PENDING_SPOT_KEY, JSON.stringify(result)); } catch {}
}

export function getPendingSpot(): IdentifyResult | null {
  try {
    const raw = localStorage.getItem(PENDING_SPOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearPendingSpot() {
  try { localStorage.removeItem(PENDING_SPOT_KEY); } catch {}
}

export const CAMERA_INPUT_ID = "spot-camera-input";
const GALLERY_INPUT_ID = "spot-gallery-input";

export function SpotTab({ active, triggerFile, onTriggerFileConsumed, onSaved, onClose, onLogin, onSignUp }: { active: boolean; triggerFile?: File | null; onTriggerFileConsumed?: () => void; onSaved: (spot: SpottedCar) => void; onClose: () => void; onLogin: () => void; onSignUp: () => void }) {
  const { user } = useAuth();
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [saved, setSaved] = useState<SpottedCar | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file passed in from the tab bar label (AppShell)
  useEffect(() => {
    if (triggerFile && active) {
      onTriggerFileConsumed?.();
      handleFile(triggerFile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerFile, active]);

  const handleFile = async (f: File) => {
    // Clear previous result so camera view shows while identifying
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setSaved(null);
    setError(null);
    setIdentifying(true);
    try {
      const compressed = await compressImage(f);
      const res = await spotter.identify(compressed);
      setResult(res);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "";
      const cleaned = raw.replace(/^ERROR:\s*/i, "").replace(/^Error:\s*/i, "").trim();
      setError(cleaned || "We couldn't identify this car. Try a clearer photo.");
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
      onSaved(spot); // pass spot to parent so CarsTab shows it immediately
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
    setSaving(false);
  };

  // Clear state only — camera is opened via <label> so iOS triggers it natively
  const clearState = () => {
    setPreview(null);
    setResult(null);
    setSaved(null);
    setError(null);
  };

  const displayName = result ? [result.year, result.make, result.model].filter(Boolean).join(" ") : "";
  const pts = result ? points(result.rarity) : 0;

  return (
    <div className="h-full relative">
      {/* ── File inputs — always in DOM, triggered via <label> for iOS reliability ── */}
      <input
        id={CAMERA_INPUT_ID}
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }}
      />
      <input
        id={GALLERY_INPUT_ID}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }}
      />

      {/* ── Result view ── */}
      <div className={result ? "h-full overflow-y-auto scrollbar-hide px-5 pb-24 safe-top" : "hidden"}>
        {result && (
          <>
            {/* Nav bar — label triggers camera natively on iOS */}
            <div className="flex items-center justify-between mb-4">
              <label
                htmlFor={CAMERA_INPUT_ID}
                onClick={clearState}
                className="text-text-primary cursor-pointer p-1"
              >
                <ArrowLeft size={24} />
              </label>
              <span className="text-[18px] font-semibold text-text-primary">Identification</span>
              <div className="w-6" />
            </div>

            {/* Car image */}
            {preview && (
              <img src={preview} alt="" className="w-full h-[220px] object-cover rounded-[16px] mb-4" />
            )}

            {/* Result card */}
            <div className="bg-bg-card rounded-[16px] p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[22px] font-bold text-text-primary">{displayName}</h2>
                {result.rarity && <RarityBadge rarity={result.rarity} />}
              </div>
              <p className="text-[14px] text-text-secondary">{result.confidence}% confidence</p>
            </div>

            {/* Specifications card */}
            {(result.bhp || result.zeroToSixty || result.topSpeed || result.marketValue) && (
              <div className="bg-bg-card rounded-[16px] p-5 mb-4">
                <h3 className="text-[16px] font-semibold text-text-primary mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-3">
                  {result.type && <SpecCell label="Type" value={result.type} />}
                  {result.bhp && <SpecCell label="Horsepower" value={`${result.bhp} hp`} />}
                  {result.zeroToSixty && <SpecCell label="0-60 mph" value={`${result.zeroToSixty} seconds`} />}
                  {result.topSpeed && <SpecCell label="Top Speed" value={`${result.topSpeed} mph`} />}
                  {result.marketValue && <SpecCell label="Market Value" value={result.marketValue} />}
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

            {error && <p className="text-danger-red text-sm text-center mb-4">{error}</p>}

            {/* Action buttons */}
            {!user ? (
              <div className="space-y-3">
                <button
                  onClick={() => { savePendingSpot(result); onLogin(); }}
                  className="w-full h-[52px] bg-accent-coral rounded-[26px] text-white font-semibold text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <LogIn size={18} />
                  Sign in to Save
                </button>
                <button
                  onClick={() => { savePendingSpot(result); onSignUp(); }}
                  className="w-full h-[52px] border border-border-subtle rounded-[26px] text-text-primary font-semibold text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  Create Account
                </button>
                {/* Discard — label opens camera natively */}
                <label
                  htmlFor={CAMERA_INPUT_ID}
                  onClick={clearState}
                  className="w-full h-[52px] border border-border-subtle rounded-[26px] text-text-secondary font-medium text-[15px] flex items-center justify-center cursor-pointer"
                >
                  Discard
                </label>
                <p className="text-[12px] text-text-muted text-center">Your spotted car will be saved after you sign in</p>
              </div>
            ) : saved ? (
              <div className="space-y-3">
                <button className="w-full h-[52px] bg-accent-green rounded-[26px] text-white font-semibold text-[17px] flex items-center justify-center gap-2">
                  <Check size={18} /> Saved to Collection
                </button>
                {/* Spot Another — label opens camera natively */}
                <label
                  htmlFor={CAMERA_INPUT_ID}
                  onClick={clearState}
                  className="w-full h-[52px] border border-border-subtle rounded-[26px] text-text-secondary font-medium text-[15px] flex items-center justify-center cursor-pointer"
                >
                  Spot Another Car
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-[52px] bg-accent-coral rounded-[26px] text-white font-semibold text-[17px] disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {saving ? "Saving..." : "Save to Collection"}
                </button>
                {/* Discard — label opens camera natively */}
                <label
                  htmlFor={CAMERA_INPUT_ID}
                  onClick={clearState}
                  className="w-full h-[52px] border border-border-subtle rounded-[26px] text-text-secondary font-medium text-[15px] flex items-center justify-center cursor-pointer"
                >
                  Discard
                </label>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Camera / upload view ── */}
      <div className={result ? "hidden" : "h-full relative overflow-hidden"}>
        {/* Dark atmospheric background */}
        <div className="absolute inset-0 bg-[#08080A]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0E] via-[#111115]/80 to-[#0B0B0E]" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 50% 40%, #E85A4F 0%, transparent 60%)" }} />

        {identifying ? (
          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            {preview && (
              <img src={preview} alt="" className="w-48 h-48 rounded-[20px] object-cover mb-6" />
            )}
            <div className="w-8 h-8 border-2 border-accent-coral border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-text-secondary text-[14px]">Identifying car...</p>
          </div>
        ) : (
          <div className="relative z-10 h-full flex flex-col">
            {/* Top bar */}
            <div className="flex items-end justify-between px-5 pb-3" style={{ paddingTop: "calc(12px + env(safe-area-inset-top, 0px))" }}>
              <h2 className="text-[18px] font-semibold text-text-primary">Spot a Car</h2>
              <button onClick={onClose} className="p-1"><X size={24} className="text-text-primary" /></button>
            </div>

            {/* Center viewfinder */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-[280px] h-[280px]">
                <svg className="absolute inset-0" width="280" height="280" viewBox="0 0 280 280" fill="none">
                  <path d="M4 40V4H40" stroke="rgba(255,255,255,0.7)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M240 4H276V40" stroke="rgba(255,255,255,0.7)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 240V276H40" stroke="rgba(255,255,255,0.7)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M240 276H276V240" stroke="rgba(255,255,255,0.7)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="px-5 pb-8 pt-6 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/80 to-transparent">
              <div className="flex items-center justify-center gap-12 mb-4">
                {/* Gallery — label triggers natively */}
                <label
                  htmlFor={GALLERY_INPUT_ID}
                  className="w-12 h-12 rounded-[8px] bg-[#1E1E24] border border-[#27272A] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                >
                  <ImageIcon size={20} className="text-text-primary" />
                </label>

                {/* Capture — label triggers natively */}
                <label
                  htmlFor={CAMERA_INPUT_ID}
                  className="relative active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center">
                    <div className="w-[58px] h-[58px] rounded-full bg-white" />
                  </div>
                </label>

                {/* Flip placeholder */}
                <button className="w-12 h-12 rounded-full bg-[#1E1E24] border border-[#27272A] flex items-center justify-center">
                  <RotateCcw size={20} className="text-text-primary" />
                </button>
              </div>

              {error && <p className="text-danger-red text-sm text-center mb-2">{error}</p>}

              <p className="text-[13px] text-text-secondary text-center">
                Point at a car and tap to identify
              </p>
            </div>
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
