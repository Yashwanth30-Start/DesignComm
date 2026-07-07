"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { TesseractSwarm } from "./TesseractSwarm";
import { cn } from "@/utils/cn";

// Mount-gated full-bleed canvas hosting the quantum tesseract particle
// simulator. Camera sits closer than the app backdrop so the swarm fills
// the hero viewport.
export function SwarmStage({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0.5, 7], fov: 55 }}>
        <TesseractSwarm />
      </Canvas>
    </div>
  );
}
