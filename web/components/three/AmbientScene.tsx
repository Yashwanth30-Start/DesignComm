"use client";

import { useEffect, useState } from "react";
import { CanvasStage } from "./CanvasStage";
import { TesseractSwarm } from "./TesseractSwarm";
import { ElectricalGridFloor } from "./ElectricalGridFloor";

// Composed ambient 3D backdrop used behind the cinematic hero. Mounts only
// after hydration so the WebGL canvas never participates in server-rendered
// markup, avoiding any hydration mismatch risk.
export function AmbientScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <CanvasStage>
      <TesseractSwarm />
      <ElectricalGridFloor />
    </CanvasStage>
  );
}
