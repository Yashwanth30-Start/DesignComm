"use client";

import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { cn } from "@/utils/cn";

export function CanvasStage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("pointer-events-none fixed inset-0 -z-10", className)}>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 1.2, 9], fov: 45 }}
      >
        <fog attach="fog" args={["#05070A", 8, 20]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 4, 4]} intensity={0.6} color="#6FE3F2" />
        {children}
      </Canvas>
    </div>
  );
}
