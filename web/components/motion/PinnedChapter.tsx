"use client";

import { useRef, type ReactNode } from "react";
import { useScroll, type MotionValue } from "motion/react";
import { cn } from "@/utils/cn";

export interface PinnedChapterProps {
  /** Render-prop: receives scroll progress (0 at pin start, 1 at release). */
  children: (progress: MotionValue<number>) => ReactNode;
  /** Total scroll track height in viewport-heights; higher = slower chapter. */
  heightVh?: number;
  className?: string;
  id?: string;
}

// The Editions-style pinned chapter: the viewport locks while the user keeps
// scrolling, and the chapter's content animates as a function of how far
// through the pin they are. Pair with useTransform in the render-prop to map
// progress -> scale/opacity/x/clip-path.
export function PinnedChapter({ children, heightVh = 250, className, id }: PinnedChapterProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section ref={ref} id={id} style={{ height: `${heightVh}vh` }} className={cn("relative", className)}>
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden px-6">
        <div className="relative z-10 w-full max-w-6xl">{children(scrollYProgress)}</div>
      </div>
    </section>
  );
}
