"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { TesseractSwarm } from "./TesseractSwarm";

const STORAGE_KEY = "cx-backdrop-opacity";
const DEFAULT_OPACITY = 0.45;

// Site-wide singularity particle backdrop (the ported tesseract/blackhole
// swarm) blended behind every app page, with a persistent opacity meter.
// Skipped on the landing page, which runs its own particle canvas.
export function GlobalBackdrop() {
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const value = Number(stored);
      if (!Number.isNaN(value) && value >= 0 && value <= 1) setOpacity(value);
    }
  }, []);

  if (pathname === "/") return null;

  function update(value: number) {
    setOpacity(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }

  return (
    <>
      {mounted && opacity > 0 && (
        <div className="pointer-events-none fixed inset-0 -z-10" style={{ opacity }}>
          <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0.6, 9], fov: 45 }}>
            <TesseractSwarm />
          </Canvas>
        </div>
      )}

      {/* Opacity meter */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-glass-border-hi bg-void/75 px-3 py-1.5 backdrop-blur-xs">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">FX</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={(event) => update(Number(event.target.value) / 100)}
          className="h-1 w-24 cursor-pointer accent-cyan"
          title="Background particle opacity"
        />
        <span className="w-8 text-right text-[10px] text-ink-dim">{Math.round(opacity * 100)}%</span>
      </div>
    </>
  );
}
