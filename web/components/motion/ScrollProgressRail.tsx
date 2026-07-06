"use client";

import { motion, useScroll, useSpring } from "motion/react";

export function ScrollProgressRail() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });

  return (
    <div className="fixed right-4 top-1/2 z-50 hidden h-40 w-1 -translate-y-1/2 rounded-full bg-glass-hi sm:block">
      <motion.div
        style={{ scaleY, originY: 0 }}
        className="h-full w-full rounded-full bg-gradient-to-b from-cyan via-purple to-gold"
      />
    </div>
  );
}
