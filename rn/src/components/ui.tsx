"use client";

export function RarityBadge({ rarity }: { rarity: string }) {
  const key = rarity.toLowerCase().replace(/\s+/g, "-");
  return (
    <span
      className={`inline-block px-2.5 py-1 text-[10px] font-semibold rounded-[8px] border
        text-rarity-${key} bg-rarity-${key}-bg border-rarity-${key}-border`}
    >
      {rarity}
    </span>
  );
}

export function StatBox({
  value,
  label,
  valueColor = "text-text-primary",
}: {
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-16 bg-bg-card rounded-[12px] border border-border-subtle">
      <span className={`text-[20px] font-bold ${valueColor}`}>{value}</span>
      <span className="text-[10px] font-medium text-text-secondary">{label}</span>
    </div>
  );
}
