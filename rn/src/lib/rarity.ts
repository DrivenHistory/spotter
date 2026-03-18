export const RARITY_POINTS: Record<string, number> = {
  Common: 1,
  Uncommon: 3,
  Rare: 10,
  "Very Rare": 25,
  "Extremely Rare": 50,
};

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
