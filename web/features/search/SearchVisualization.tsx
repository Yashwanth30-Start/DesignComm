"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { WING2_AREAS } from "@/lib/mock-data";

// Cinematic data layer: renders behind search results, showing area/panel/circuit/asset
// relationships with parallax and cursor tracking. Sits between particles and info layer.
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  area?: string;
  charge: number;
  life: number;
}

export function SearchVisualization({ query }: { query: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const queryRef = useRef(query);

  // Track query changes without resetting the particle system
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // Initialize canvas and particle system on mount (once, never tears down)
  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    let raf = 0;
    let time = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.scale(dpr, dpr);
    }

    function initParticles() {
      particlesRef.current = [];
      // One particle per Wing 2 area, positioned in a grid
      const activeareas = WING2_AREAS.filter((a) => a.active);
      const cols = Math.ceil(Math.sqrt(activeareas.length));
      const cellW = width / cols;
      const cellH = height / cols;

      for (let i = 0; i < activeareas.length; i++) {
        const area = activeareas[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.3;
        const y = cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.3;
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 2.5,
          area: area.id,
          charge: 1,
          life: 1,
        });
      }
    }

    function animate() {
      time += 1;
      ctx!.clearRect(0, 0, width, height);
      ctx!.globalAlpha = 0.08;

      // Draw gradient field (subtle background)
      const gradient = ctx!.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(111, 227, 242, 0.05)");
      gradient.addColorStop(1, "rgba(184, 167, 255, 0.05)");
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, width, height);
      ctx!.globalAlpha = 1;

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const q = queryRef.current.toLowerCase();
      const isActive = q.length > 0;

      // Tuned constants: idle vs. active search
      const PARALLAX_AMP = isActive ? 8 : 20;
      const GRAB_DIST = isActive ? 160 : 250;
      const LINE_DIST = isActive ? 140 : 200;
      const LINE_ALPHA_BASE = isActive ? 0.1 : 0.15;
      const LINE_ALPHA_FALLOFF = isActive ? 0.22 : 0.4;
      const NORMAL_RADIUS = isActive ? 2 : 2.5;
      const NORMAL_ALPHA = isActive ? 0.18 : 0.3;
      const MATCH_RADIUS = isActive ? 3.2 : 4;
      const MATCH_ALPHA = isActive ? 0.4 : 0.6;
      const GLOW_ALPHA = isActive ? 0.3 : 0.2;

      // Update and draw particles
      for (const p of particles) {
        const matches = p.area?.toLowerCase().includes(q) ?? false;

        // Update visual treatment based on current query
        p.radius = matches ? MATCH_RADIUS : NORMAL_RADIUS;
        p.charge = matches ? 1.5 : 1;

        // Cursor attraction (if within grab distance)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < GRAB_DIST) {
          const pull = 0.04 * p.charge * (1 - dist / GRAB_DIST);
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;
        }

        // Damping and velocity
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;

        // Bounce at edges
        if (p.x < p.radius) {
          p.x = p.radius;
          p.vx *= -0.8;
        }
        if (p.x > width - p.radius) {
          p.x = width - p.radius;
          p.vx *= -0.8;
        }
        if (p.y < p.radius) {
          p.y = p.radius;
          p.vy *= -0.8;
        }
        if (p.y > height - p.radius) {
          p.y = height - p.radius;
          p.vy *= -0.8;
        }

        // Draw circle
        const fillAlpha = matches ? MATCH_ALPHA : NORMAL_ALPHA;
        ctx!.fillStyle = `rgba(111, 227, 242, ${fillAlpha})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fill();

        // Draw glow on query match
        if (matches) {
          ctx!.strokeStyle = `rgba(111, 227, 242, ${GLOW_ALPHA})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
          ctx!.stroke();
        }
      }

      // Draw links between nearby particles
      ctx!.strokeStyle = `rgba(111, 227, 242, ${LINE_ALPHA_BASE})`;
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINE_DIST) {
            ctx!.globalAlpha = LINE_ALPHA_FALLOFF * (1 - dist / LINE_DIST);
            ctx!.beginPath();
            ctx!.moveTo(p1.x, p1.y);
            ctx!.lineTo(p2.x, p2.y);
            ctx!.stroke();
            ctx!.globalAlpha = 1;
          }
        }
      }

      raf = requestAnimationFrame(animate);
    }

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      const isActive = queryRef.current.toLowerCase().length > 0;
      const PARALLAX_AMP = isActive ? 8 : 20;
      // Parallax offset: subtle 3D tilt based on mouse position
      const centerX = width / 2;
      const centerY = height / 2;
      const offsetX = ((e.clientX - centerX) / centerX) * PARALLAX_AMP;
      const offsetY = ((e.clientY - centerY) / centerY) * PARALLAX_AMP;
      setMousePos({ x: offsetX, y: offsetY });
    }

    resize();
    initParticles();
    animate();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 -z-5 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: mousePos.x, y: mousePos.y }}
      transition={{ duration: 0.8, x: { type: "spring", damping: 20, stiffness: 300 }, y: { type: "spring", damping: 20, stiffness: 300 } }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ mixBlendMode: "screen" }}
      />
    </motion.div>
  );
}
