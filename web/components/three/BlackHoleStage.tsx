"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { BlackHole } from "./BlackHole";
import { cn } from "@/utils/cn";

// Mount-gated full-bleed canvas hosting the BlackHole scene. Pages and
// features use this wrapper instead of importing @react-three/fiber directly.
export interface BlackHoleStageProps {
  className?: string;
  offsetY?: number;
  cameraPosition?: [number, number, number];
  fov?: number;
}

export function BlackHoleStage({
  className,
  offsetY = 0,
  cameraPosition = [0, 2.2, 8.4],
  fov = 55,
}: BlackHoleStageProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: cameraPosition, fov }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <BlackHole offsetY={offsetY} />
      </Canvas>
    </div>
  );
}
