// Points per rarity tier:
//   Very Rare (10 pts)      = +1 level in early tiers
//   Extremely Rare (20 pts) = +2 levels in early tiers
export const RARITY_POINTS: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 5,
  "Very Rare": 10,
  "Extremely Rare": 20,
};

// 100-level tiered system — gaps widen as you progress:
//   Levels  1–25: gap=10   (Very Rare = exact level up)
//   Levels 26–50: gap=20   (Extremely Rare = exact level up)
//   Levels 51–75: gap=50   (big rares = meaningful boost)
//   Levels 76–100: gap=100 (prestige territory)
const TIERS = [
  { count: 25, gap: 10  },
  { count: 25, gap: 20  },
  { count: 25, gap: 50  },
  { count: 25, gap: 100 },
];

const LEVELS: { level: number; min: number }[] = [];
{
  let levelNum = 1;
  let minPts = 0;
  for (const { count, gap } of TIERS) {
    for (let i = 0; i < count; i++) {
      LEVELS.push({ level: levelNum++, min: minPts });
      minPts += gap;
    }
  }
}

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
