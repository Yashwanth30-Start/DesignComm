import { cn } from "@/utils/cn";

export interface ProgressBarProps {
  value: number;
  max?: number;
  accent?: "cyan" | "emerald" | "gold" | "purple";
  className?: string;
}

const accentGradient: Record<NonNullable<ProgressBarProps["accent"]>, string> = {
  cyan: "from-cyan/40 to-cyan",
  emerald: "from-emerald/40 to-emerald",
  gold: "from-gold/40 to-gold",
  purple: "from-purple/40 to-purple",
};

export function ProgressBar({ value, max = 100, accent = "cyan", className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-glass-hi", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-900 ease-cinematic", accentGradient[accent])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
