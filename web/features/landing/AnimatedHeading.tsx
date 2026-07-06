"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

const CHAR_DELAY = 30;
const CHAR_DURATION = 500;

// Character-by-character entrance: each char fades in and slides from
// translateX(-18px), staggered left-to-right, line by line.
export function AnimatedHeading({
  text,
  initialDelay = 200,
  className,
}: {
  text: string;
  initialDelay?: number;
  className?: string;
}) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStarted(true);
      return;
    }
    const timer = setTimeout(() => setStarted(true), initialDelay);
    return () => clearTimeout(timer);
  }, [initialDelay]);

  const lines = text.split("\n");

  return (
    <h1 className={cn("font-normal", className)} style={{ letterSpacing: "-0.04em" }}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="block">
          {line.split("").map((char, charIndex) => (
            <span
              key={charIndex}
              className="inline-block"
              style={{
                opacity: started ? 1 : 0,
                transform: started ? "translateX(0)" : "translateX(-18px)",
                transition: `opacity ${CHAR_DURATION}ms ease, transform ${CHAR_DURATION}ms ease`,
                transitionDelay: `${lineIndex * line.length * CHAR_DELAY + charIndex * CHAR_DELAY}ms`,
              }}
            >
              {char === " " ? " " : char}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
