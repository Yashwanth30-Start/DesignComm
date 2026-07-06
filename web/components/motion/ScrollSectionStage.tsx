"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/utils/cn";

export interface ScrollSectionStageProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

// Drives the "close current slide, open next" cinematic feel: each full-viewport
// section fades/scales/blurs in as it enters view and fades/scales/blurs out as
// it leaves, layered on top of CSS scroll-snap for the discrete slide-deck feel.
export function ScrollSectionStage({ children, className, id }: ScrollSectionStageProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.94, 1, 1, 0.96]);
  const blurPx = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [8, 0, 0, 6]);
  const filter = useTransform(blurPx, (v) => `blur(${v}px)`);

  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        "relative flex min-h-screen w-full snap-start items-center justify-center px-6 py-24",
        className
      )}
    >
      <motion.div style={{ opacity, scale, filter }} className="relative z-10 w-full max-w-6xl">
        {children}
      </motion.div>
    </section>
  );
}
