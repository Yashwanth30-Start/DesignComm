"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "@/utils/cn";

export interface SpotlightCursorProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

// Cursor-tracked radial glow behind hero content -- the "alive" signature
// touch. Falls back to a static center glow on touch devices (no mousemove).
export function SpotlightCursor({ children, className, color = "rgba(111,227,242,0.14)" }: SpotlightCursorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(50);
  const y = useMotionValue(40);
  const background = useMotionTemplate`radial-gradient(600px circle at ${x}% ${y}%, ${color}, transparent 70%)`;

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width) * 100);
    y.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={cn("relative", className)}>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background }} />
      <div className="relative">{children}</div>
    </div>
  );
}
