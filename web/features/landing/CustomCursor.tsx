"use client";

import { useEffect, useRef, useState } from "react";

// Desktop-only custom cursor: fixed exclusion-blended circle glyph that
// follows the pointer via direct DOM writes (no re-renders per mousemove).
export function CustomCursor({ onActiveChange }: { onActiveChange?: (active: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const isDesktopPointer =
      window.matchMedia("(pointer: fine)").matches && window.innerWidth >= 1024;
    setActive(isDesktopPointer);
    onActiveChange?.(isDesktopPointer);
    if (!isDesktopPointer) return;

    function handleMove(event: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      el.style.left = `${event.clientX}px`;
      el.style.top = `${event.clientY}px`;
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [onActiveChange]);

  if (!active) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-50"
      style={{ transform: "translate(-50%, -50%)", mixBlendMode: "exclusion", left: "-100px", top: "-100px" }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22.75" stroke="#fff" strokeWidth="2.5" />
        <text
          x="24"
          y="30"
          textAnchor="middle"
          fill="#fff"
          fontSize="17"
          fontFamily="var(--font-sans)"
          fontWeight="600"
        >
          C
        </text>
      </svg>
    </div>
  );
}
