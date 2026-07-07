"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Singularity scene: a black event horizon wrapped in a photon ring and a
// Keplerian accretion disk of instanced particles. Particles orbit faster
// near the horizon, drift slowly inward, and respawn at the outer rim.
// The side of the disk moving toward the camera is doppler-brightened.
// Additive blending fakes the glow — no post-processing bloom needed.
const DISK_COUNT = 5200;
const STAR_COUNT = 650;
const INNER_R = 1.35;
const OUTER_R = 7.6;
const RANGE_R = OUTER_R - INNER_R;
const TILT_X = 0.42;

function seeded(i: number, salt: number) {
  const raw = Math.sin(i * salt) * 43758.5453;
  return raw - Math.floor(raw);
}

interface DiskSeed {
  r0: number;
  a0: number;
  yJitter: number;
  inflow: number;
  size: number;
  twinkle: number;
}

interface StarSeed {
  x: number;
  y: number;
  z: number;
  twinkle: number;
  size: number;
}

export function BlackHole({ offsetY = 0 }: { offsetY?: number }) {
  const diskRef = useRef<THREE.InstancedMesh>(null);
  const starRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const diskSeeds = useMemo<DiskSeed[]>(() => {
    const list: DiskSeed[] = [];
    for (let i = 0; i < DISK_COUNT; i++) {
      // Bias particle density toward the inner (hotter, brighter) disk.
      const bias = Math.pow(seeded(i, 12.9898), 1.6);
      list.push({
        r0: INNER_R + bias * RANGE_R,
        a0: seeded(i, 78.233) * Math.PI * 2,
        yJitter: (seeded(i, 39.346) - 0.5) * 2,
        inflow: 0.05 + seeded(i, 53.211) * 0.22,
        size: 0.5 + seeded(i, 94.673) * 0.9,
        twinkle: seeded(i, 27.157) * Math.PI * 2,
      });
    }
    return list;
  }, []);

  const starSeeds = useMemo<StarSeed[]>(() => {
    const list: StarSeed[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const radius = 16 + seeded(i, 11.317) * 18;
      const theta = seeded(i, 45.913) * Math.PI * 2;
      const phi = Math.acos(2 * seeded(i, 71.129) - 1);
      list.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta) * 0.75,
        z: radius * Math.cos(phi),
        twinkle: seeded(i, 33.719) * Math.PI * 2,
        size: 0.3 + seeded(i, 88.421) * 0.55,
      });
    }
    return list;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    const disk = diskRef.current;
    if (disk) {
      for (let i = 0; i < DISK_COUNT; i++) {
        const seed = diskSeeds[i];
        if (!seed) continue;

        // Inward spiral with wrap back to the outer rim.
        let progress = (seed.r0 - INNER_R - time * seed.inflow) % RANGE_R;
        if (progress < 0) progress += RANGE_R;
        const r = INNER_R + progress;

        // Keplerian sweep: angular speed falls off with radius^1.5.
        const angle = seed.a0 + time * (1.15 / Math.pow(Math.max(r, 0.6), 1.5));
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const thickness = 0.05 + (r / OUTER_R) * 0.28;
        dummy.position.set(r * cosA, seed.yJitter * thickness, r * sinA);
        dummy.scale.setScalar(seed.size * (0.55 + (1 - progress / RANGE_R) * 0.9));
        dummy.updateMatrix();
        disk.setMatrixAt(i, dummy.matrix);

        // Heat gradient: white-hot cyan at the inner edge, deep violet rim.
        const t = progress / RANGE_R;
        const hue = 0.52 + t * 0.16;
        const sat = 0.5 + t * 0.4;
        let light = 0.72 - t * 0.54;
        // Doppler beaming: the limb sweeping toward the camera (+Z) glows.
        const doppler = 0.55 + 0.45 * Math.max(0, cosA);
        light *= doppler;
        light += Math.sin(time * 3 + seed.twinkle) * 0.03;
        color.setHSL(hue, sat, Math.max(0.04, Math.min(0.92, light)));
        disk.setColorAt(i, color);
      }
      disk.instanceMatrix.needsUpdate = true;
      if (disk.instanceColor) disk.instanceColor.needsUpdate = true;
    }

    const stars = starRef.current;
    if (stars) {
      for (let i = 0; i < STAR_COUNT; i++) {
        const seed = starSeeds[i];
        if (!seed) continue;
        dummy.position.set(seed.x, seed.y, seed.z);
        dummy.scale.setScalar(seed.size);
        dummy.updateMatrix();
        stars.setMatrixAt(i, dummy.matrix);
        const twinkle = Math.pow((Math.sin(time * 1.8 + seed.twinkle) + 1) * 0.5, 4);
        color.setHSL(0.55, 0.35, 0.08 + twinkle * 0.55);
        stars.setColorAt(i, color);
      }
      stars.instanceMatrix.needsUpdate = true;
      if (stars.instanceColor) stars.instanceColor.needsUpdate = true;
    }

    const group = groupRef.current;
    if (group) {
      group.rotation.z = 0.1 + Math.sin(time * 0.05) * 0.04;
    }
  });

  return (
    <group position={[0, offsetY, 0]}>
      {/* Distant starfield (untilted) */}
      <instancedMesh ref={starRef} args={[undefined, undefined, STAR_COUNT]}>
        <tetrahedronGeometry args={[0.05]} />
        <meshBasicMaterial transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      {/* Event horizon: pure black, occludes disk particles passing behind it */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[1.02, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Tilted system: photon ring + accretion disk */}
      <group ref={groupRef} rotation={[TILT_X, 0, 0.1]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.2, 96]} />
          <meshBasicMaterial
            color="#BFF4FC"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.18, 1.85, 96]} />
          <meshBasicMaterial
            color="#6FE3F2"
            transparent
            opacity={0.14}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <instancedMesh ref={diskRef} args={[undefined, undefined, DISK_COUNT]}>
          <tetrahedronGeometry args={[0.045]} />
          <meshBasicMaterial transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
        </instancedMesh>
      </group>
    </group>
  );
}
