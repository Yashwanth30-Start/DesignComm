"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

// Single-viewport black/white landing: an interactive particle network
// (tsParticles-style — drifting dots, links under 150px, web lines that grab
// toward the cursor within 220px) rendered on a plain 2D canvas with zero
// dependencies. No scrolling, no video — heading, search, and two buttons.
const PARTICLE_COUNT = 60;
const LINK_DISTANCE = 150;
const GRAB_DISTANCE = 220;
const SPEED = 0.35;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export function ParticleLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mouse = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let raf = 0;

    const dpr = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * SPEED * 2,
      vy: (Math.random() - 0.5) * SPEED * 2,
      radius: 2 + Math.random() * 3,
      alpha: 0.15 + Math.random() * 0.35,
    }));

    function handleMouseMove(event: MouseEvent) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    }
    function handleMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);
    window.addEventListener("resize", resize);

    function frame() {
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
      }

      // Particle-to-particle links.
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]!;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            ctx!.strokeStyle = `rgba(255,255,255,${0.2 * (1 - dist / LINK_DISTANCE)})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }

        // Grab links to the cursor.
        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < GRAB_DISTANCE) {
          ctx!.strokeStyle = `rgba(255,255,255,${0.6 * (1 - mdist / GRAB_DISTANCE)})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(mouse.x, mouse.y);
          ctx!.stroke();
        }

        ctx!.fillStyle = `rgba(255,255,255,${a.alpha})`;
        ctx!.beginPath();
        ctx!.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  function submitSearch() {
    const q = query.trim();
    if (q.length === 0) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-black text-white">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-[1] opacity-80 mix-blend-screen"
      />

      {/* Minimal top bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-xl font-semibold tracking-tight">
          Commission<span className="text-white/50">OS</span>
        </span>
        <Link
          href="/assets"
          className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-200"
        >
          Open App
        </Link>
      </div>

      {/* Centered content */}
      <main className="relative z-10 max-w-2xl px-6 text-center">
        <h1
          className="mb-4 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          Every asset. Every circuit.
          <br />
          One operating system.
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-gray-400">
          The operational layer above SharePoint, Procore, Airtable, FacilityGrid, and GroupMe —
          Project Kansas, Wing 2.
        </p>

        {/* Search straight from the landing page */}
        <div className="mx-auto mb-6 flex max-w-md items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm focus-within:border-white/50">
          <Search className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.8} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitSearch();
            }}
            placeholder="Search assets, panels, circuits, RFIs…"
            className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
          />
          <button
            onClick={submitSearch}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-gray-200"
            title="Search"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/assets"
            className="rounded-full bg-white px-8 py-3 font-medium text-black shadow-[0_10px_25px_rgba(255,255,255,0.15)] transition-transform hover:-translate-y-0.5"
          >
            Browse Assets
          </Link>
          <Link
            href="/panels"
            className="rounded-full border border-white/25 px-8 py-3 font-medium text-white transition-colors hover:bg-white hover:text-black"
          >
            Browse Panels
          </Link>
        </div>
      </main>

      <div className="absolute bottom-5 left-0 right-0 z-10 flex justify-center gap-6 text-[11px] uppercase tracking-widest text-gray-600">
        <span>CommissionOS 2026</span>
        <span>Project Kansas · Wing 2 · A500–C700</span>
      </div>
    </div>
  );
}
