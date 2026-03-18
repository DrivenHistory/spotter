"use client";

import { useEffect, useState, useMemo } from "react";
import { HelpCircle } from "lucide-react";
import { spotter, type SpottedCar } from "@/lib/api";
import { points, RARITY_POINTS } from "@/lib/rarity";

interface LeaderboardEntry {
  email: string;
  name: string;
  spots: SpottedCar[];
  totalPoints: number;
  totalSpots: number;
  rareFinds: number;
}

const TABS = ["All Time", "Rarest Finds", "This Week"];
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function LeaderboardTab() {
  const [allSpots, setAllSpots] = useState<SpottedCar[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showScoring, setShowScoring] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { spots } = await spotter.getFeed();
        setAllSpots(spots);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const entries = useMemo(() => {
    let filtered = allSpots;
    if (selectedTab === 2) {
      const cutoff = Date.now() - SEVEN_DAYS;
      filtered = allSpots.filter((s) => new Date(s.createdAt).getTime() > cutoff);
    }

    const grouped = new Map<string, SpottedCar[]>();
    for (const s of filtered) {
      const key = s.spotterEmail.toLowerCase();
      grouped.set(key, [...(grouped.get(key) ?? []), s]);
    }

    const list: LeaderboardEntry[] = Array.from(grouped.entries()).map(([email, spots]) => ({
      email,
      name: spots[0].spotterName,
      spots,
      totalPoints: spots.reduce((s, c) => s + points(c.rarity), 0),
      totalSpots: spots.length,
      rareFinds: spots.filter((c) => ["Rare", "Very Rare", "Extremely Rare"].includes(c.rarity ?? "")).length,
    }));

    if (selectedTab === 1) {
      list.sort((a, b) => b.rareFinds - a.rareFinds || b.totalPoints - a.totalPoints);
    } else {
      list.sort((a, b) => b.totalPoints - a.totalPoints);
    }
    return list;
  }, [allSpots, selectedTab]);

  const initials = (name: string) => {
    const p = name.split(" ");
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-6 pt-2 pb-32">
      <h1 className="text-2xl font-semibold text-text-primary font-display mb-5">Leaderboard</h1>

      {/* Segment control */}
      <div className="flex p-[3px] bg-bg-card border border-border-subtle rounded-[12px] mb-5">
        {TABS.map((label, i) => (
          <button
            key={label}
            onClick={() => setSelectedTab(i)}
            className={`flex-1 py-2 rounded-[10px] text-[12px] transition-colors ${
              selectedTab === i
                ? "bg-accent-coral text-white font-semibold"
                : "text-text-secondary font-medium"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-semibold text-text-primary">
          Top Spotters — {TABS[selectedTab]}
        </p>
        <button onClick={() => setShowScoring(true)} className="text-text-secondary">
          <HelpCircle size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Podium */}
          {entries.length >= 3 && (
            <div className="flex items-end gap-2 mb-6">
              <PodiumSlot entry={entries[1]} rank={2} height="80px" color="#6B6B70" initials={initials} />
              <PodiumSlot entry={entries[0]} rank={1} height="100px" color="#FFB547" initials={initials} />
              <PodiumSlot entry={entries[2]} rank={3} height="64px" color="#E85A4F" initials={initials} />
            </div>
          )}

          {/* Full list */}
          <div className="bg-bg-card rounded-[16px] border border-border-subtle overflow-hidden">
            {entries.map((entry, i) => (
              <div key={entry.email}>
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <span className={`text-[14px] font-bold w-7 text-center ${i < 3 ? "text-accent-amber" : "text-text-muted"}`}>
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-semibold text-text-primary">{initials(entry.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-primary truncate">{entry.name}</p>
                    <p className="text-[11px] text-text-muted">{entry.totalSpots} spots · {entry.rareFinds} rare</p>
                  </div>
                  <span className="text-[14px] font-bold text-accent-amber">{entry.totalPoints} pts</span>
                </div>
                {i < entries.length - 1 && <div className="h-px bg-border-subtle mx-3.5" />}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Scoring sheet */}
      {showScoring && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowScoring(false)}>
          <div className="w-full max-w-md bg-bg-page rounded-t-[24px] p-6 safe-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border-strong rounded-full mx-auto mb-5" />
            <h3 className="text-xl font-semibold text-text-primary font-display text-center mb-3">How Scoring Works</h3>
            <p className="text-[13px] text-text-secondary text-center mb-5">
              Each car you spot earns points based on its rarity. AI determines rarity when identifying the car.
            </p>
            <div className="space-y-2 mb-6">
              {Object.entries(RARITY_POINTS).map(([name, pts]) => (
                <div key={name} className="flex items-center px-4 py-2.5 bg-bg-card rounded-[10px]">
                  <div className={`w-2 h-2 rounded-full bg-rarity-${name.toLowerCase().replace(/\s+/g, "-")} mr-3`} />
                  <span className="text-[14px] font-medium text-text-primary flex-1">{name}</span>
                  <span className={`text-[14px] font-bold text-rarity-${name.toLowerCase().replace(/\s+/g, "-")}`}>
                    {pts} pt{pts === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowScoring(false)}
              className="w-full py-3.5 bg-accent-coral rounded-[14px] text-white font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PodiumSlot({
  entry,
  rank,
  height,
  color,
  initials,
}: {
  entry: LeaderboardEntry;
  rank: number;
  height: string;
  color: string;
  initials: (name: string) => string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1.5">
      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}26` }}>
        <span className="text-[14px] font-bold" style={{ color }}>{initials(entry.name)}</span>
      </div>
      <p className="text-[11px] font-medium text-text-primary truncate max-w-full">{entry.name}</p>
      <p className="text-[10px] font-semibold text-accent-amber">{entry.totalPoints} pts</p>
      <div
        className="w-full rounded-[8px] flex items-center justify-center"
        style={{ height, backgroundColor: `${color}1F` }}
      >
        <span className="text-[20px] font-bold" style={{ color }}>{rank}</span>
      </div>
    </div>
  );
}
