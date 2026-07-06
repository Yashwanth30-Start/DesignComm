import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "cyan" | "emerald" | "purple" | "gold" | "red";
  hoverLift?: boolean;
}

const glowMap: Record<NonNullable<GlassPanelProps["glow"]>, string> = {
  none: "",
  cyan: "shadow-glow-cyan",
  emerald: "shadow-glow-emerald",
  purple: "shadow-glow-purple",
  gold: "shadow-glow-gold",
  red: "shadow-glow-red",
};

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, glow = "none", hoverLift = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-glass-border bg-glass backdrop-blur-xs shadow-glass",
        glowMap[glow],
        hoverLift &&
          "transition-transform duration-600 ease-cinematic hover:-translate-y-1 hover:border-glass-border-hi",
        className
      )}
      {...props}
    />
  )
);
GlassPanel.displayName = "GlassPanel";
