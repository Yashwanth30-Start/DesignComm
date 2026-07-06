"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// R3F port of the user's "Quantum Tesseract" particle simulator: an instanced
// swarm tracing a (P,Q) torus knot with a traveling energy pulse, plus a thin
// stardust shell. Simplified from the original 20k-instance version to keep
// frame rates comfortable behind DOM content (no post-processing bloom;
// additive blending fakes the glow).
const COUNT = 4200;
const STARDUST_RATIO = 0.08;
const P = 2;
const Q = 5;
const R = 3.1; // macro radius
const TUBE = 0.85; // micro radius

function seeded(i: number, salt: number) {
  const raw = Math.sin(i * salt) * 43758.5453;
  return raw - Math.floor(raw);
}

export function TesseractSwarm() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const seeds = useMemo(() => {
    const list = new Array<{ t: number; a: number; b: number; twinkle: number }>(COUNT);
    for (let i = 0; i < COUNT; i++) {
      list[i] = {
        t: (i / COUNT) * Math.PI * 2,
        a: seeded(i, 12.9898) * Math.PI * 2,
        b: seeded(i, 78.233),
        twinkle: seeded(i, 39.346) * Math.PI * 2,
      };
    }
    return list;
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = clock.getElapsedTime();
    const numStardust = Math.floor(COUNT * STARDUST_RATIO);

    for (let i = 0; i < COUNT; i++) {
      const seed = seeds[i]!;

      if (i < numStardust) {
        // Drifting stardust shell around the knot.
        const radius = R * 1.6 + seed.b * 4.5;
        const theta = seed.a + time * 0.03;
        const phi = Math.acos(2 * seeded(i, 53.211) - 1);
        dummy.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta) * 0.6,
          radius * Math.cos(phi)
        );
        dummy.scale.setScalar(0.55);
        const twinkle = Math.pow((Math.sin(time * 2.5 + seed.twinkle) + 1) * 0.5, 6);
        color.setHSL(0.52 + seed.b * 0.1, 0.75, 0.04 + twinkle * 0.5);
      } else {
        // Torus-knot swarm with bundle twist and a traveling pulse.
        const t = seed.t + time * 0.05;
        const cosQt = Math.cos(Q * t);
        const sinQt = Math.sin(Q * t);
        const cosPt = Math.cos(P * t);
        const sinPt = Math.sin(P * t);

        const cx = (R + TUBE * cosQt) * cosPt;
        const cy = (R + TUBE * cosQt) * sinPt;
        const cz = TUBE * sinQt;

        // Scatter within the tube using each particle's fixed angle/radius.
        const swirl = seed.a + time * 0.4;
        const spread = 0.28 * seed.b;
        dummy.position.set(
          cx + Math.cos(swirl) * spread,
          cy + Math.sin(swirl) * spread,
          cz + Math.sin(swirl + seed.twinkle) * spread
        );
        dummy.scale.setScalar(0.8 + seed.b * 0.5);

        const hue = 0.5 + ((seed.t * P) % (Math.PI * 2)) * 0.012 + Math.sin(seed.t * P * 2 + time) * 0.02;
        let lightness = 0.16;
        const pulse = Math.sin(seed.t * P * 12 - time * 4);
        if (pulse > 0.8) lightness += (pulse - 0.8) * 2.2;
        color.setHSL(hue % 1, 0.9, Math.min(0.85, lightness));
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color);
    }

    mesh.rotation.y = time * 0.06;
    mesh.rotation.x = Math.sin(time * 0.04) * 0.25;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} position={[0, 0.4, -2]}>
      <tetrahedronGeometry args={[0.05]} />
      <meshBasicMaterial transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}
