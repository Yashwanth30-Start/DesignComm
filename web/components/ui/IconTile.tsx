import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export interface IconTileProps {
  icon: LucideIcon;
  accent?: "cyan" | "emerald" | "amber" | "gold" | "purple" | "security" | "red";
  label?: string;
  className?: string;
}

const accentMap: Record<NonNullable<IconTileProps["accent"]>, string> = {
  cyan: "text-cyan border-cyan/25 shadow-glow-cyan",
  emerald: "text-emerald border-emerald/25 shadow-glow-emerald",
  amber: "text-amber border-amber/25",
  gold: "text-gold border-gold/25 shadow-glow-gold",
  purple: "text-purple border-purple/25 shadow-glow-purple",
  security: "text-security border-security/25",
  red: "text-red border-red/25 shadow-glow-red",
};

export function IconTile({ icon: Icon, accent = "cyan", label, className }: IconTileProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-md border bg-glass backdrop-blur-xs",
          accentMap[accent]
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </div>
      {label && <span className="text-xs text-ink-dim">{label}</span>}
    </div>
  );
}
