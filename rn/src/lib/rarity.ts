// Points per rarity tier — designed so:
//   10 Common spots  = 1 level
//   1 Very Rare      = 1 level jump
//   1 Extremely Rare = 2 level jumps
export const RARITY_POINTS: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 5,
  "Very Rare": 10,
  "Extremely Rare": 20,
};

// Equal 10-pt gaps so the above guarantees hold at every level
const LEVEL_GAP = 10;
const LEVELS = Array.from({ length: 10 }, (_, i) => ({
  level: i + 1,
  min: i * LEVEL_GAP,
}));

export function spotterLevel(totalPoints: number): {
  level: number;
  nextMin: number;
  progress: number;
} {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (totalPoints >= l.min) current = l;
    else break;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1];
  const nextMin = next?.min ?? Infinity;
  const progress = next
    ? Math.min((totalPoints - current.min) / (nextMin - current.min), 1)
    : 1;
  return { level: current.level, nextMin, progress };
}

export function rarityKey(r?: string): string {
  if (!r) return "common";
  return r.toLowerCase().replace(/\s+/g, "-");
}

export function points(rarity?: string): number {
  return RARITY_POINTS[rarity ?? ""] ?? 0;
}

export function confidenceColor(c: number): string {
  if (c >= 80) return "text-accent-green";
  if (c >= 50) return "text-accent-amber";
  return "text-danger-red";
}

export function confidenceBg(c: number): string {
  if (c >= 80) return "bg-accent-green";
  if (c >= 50) return "bg-accent-amber";
  return "bg-danger-red";
}
