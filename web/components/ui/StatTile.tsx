import { cn } from "@/utils/cn";

export interface StatTileProps {
  value: string;
  label: string;
  accent?: "cyan" | "emerald" | "gold" | "purple" | "red";
  className?: string;
}

const accentText: Record<NonNullable<StatTileProps["accent"]>, string> = {
  cyan: "text-cyan",
  emerald: "text-emerald",
  gold: "text-gold",
  purple: "text-purple",
  red: "text-red",
};

export function StatTile({ value, label, accent = "cyan", className }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-glass-border-hi bg-glass px-5 py-4 backdrop-blur-xs shadow-glass",
        className
      )}
    >
      <div className={cn("text-2xl font-semibold tracking-tight", accentText[accent])}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-ink-dim">{label}</div>
    </div>
  );
}
