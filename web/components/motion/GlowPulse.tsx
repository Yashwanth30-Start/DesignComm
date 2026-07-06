"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";

export interface GlowPulseProps {
  children: ReactNode;
  color?: "cyan" | "emerald" | "purple" | "gold" | "red";
  className?: string;
}

const glowColor: Record<NonNullable<GlowPulseProps["color"]>, string> = {
  cyan: "rgba(111,227,242,0.35)",
  emerald: "rgba(46,204,113,0.32)",
  purple: "rgba(184,167,255,0.35)",
  gold: "rgba(232,196,104,0.32)",
  red: "rgba(239,68,68,0.32)",
};

export function GlowPulse({ children, color = "cyan", className }: GlowPulseProps) {
  return (
    <motion.div
      className={cn("relative", className)}
      animate={{
        boxShadow: [
          `0 0 0px ${glowColor[color]}`,
          `0 0 36px ${glowColor[color]}`,
          `0 0 0px ${glowColor[color]}`,
        ],
      }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
