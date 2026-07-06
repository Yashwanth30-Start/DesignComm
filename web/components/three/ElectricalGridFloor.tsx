"use client";

import { Grid } from "@react-three/drei";

export interface ElectricalGridFloorProps {
  color?: string;
}

export function ElectricalGridFloor({ color = "#2ECC71" }: ElectricalGridFloorProps) {
  return (
    <Grid
      position={[0, -3, 0]}
      args={[40, 40]}
      cellSize={0.6}
      cellThickness={0.6}
      cellColor="#1c2528"
      sectionSize={3}
      sectionThickness={1.2}
      sectionColor={color}
      fadeDistance={22}
      fadeStrength={1.4}
      infiniteGrid
      followCamera={false}
    />
  );
}
