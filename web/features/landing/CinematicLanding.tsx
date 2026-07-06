"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import { TesseractSwarm } from "@/components/three";
import { FadeIn } from "./FadeIn";
import { AnimatedHeading } from "./AnimatedHeading";
import { CustomCursor } from "./CustomCursor";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4";

const GALLERY_IMAGES = [
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_104530_521b2f85-c0f3-4d0e-9704-b578315b4cb9.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103711_76ccdb8b-5043-4f47-9c54-4379713393ea.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103728_394f6a1b-85e2-4386-a4f6-408472a0a5b7.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103739_86743e0e-16a7-4bee-bf38-dd67985344dc.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103748_b2215dc8-a3a7-470d-b19a-5b87fa7d0c37.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103758_e919ce72-5c9d-4b87-9be6-d7647b34825c.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103808_013583d0-3386-4547-9832-37c7d8edb3ac.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103937_a0c49d0a-33eb-4ead-aea6-c1baf241acbc.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103956_d18ed8fd-7b6f-4b86-91f9-20010fe38670.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_104034_ba5a9963-87ff-4008-a545-6bd686c088b5.png&w=1920&q=85",
];

const SYMBOLS = ["8", "$", "^^", "%", "/"];

// Scatter-grid layout from the reference: one primary card per row at a
// stepping column, plus a second card every third row.
function buildLayout(count: number, cols: number): number[][] {
  const rows: number[][] = [];
  let placed = 0;
  let r = 0;
  while (placed < count) {
    const row = new Array<number>(cols).fill(-1);
    const a = (r * 2 + (r % 2)) % cols;
    row[a] = placed++;
    if (r % 3 === 0 && placed < count) {
      let b = (a + 2) % cols;
      if (b === a) b = (a + 1) % cols;
      row[b] = placed++;
    }
    rows.push(row);
    r++;
  }
  return rows;
}

function useColumns() {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    function update() {
      setCols(window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : 4);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

export function CinematicLanding() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [cursorActive, setCursorActive] = useState(false);
  const [swarmReady, setSwarmReady] = useState(false);
  const cols = useColumns();
  const layout = useMemo(() => buildLayout(GALLERY_IMAGES.length, cols), [cols]);

  useEffect(() => setSwarmReady(true), []);

  useEffect(() => {
    let raf = 0;
    let lastSymbolAt = 0;
    let lastScrollY = -1;
    let spacerHeight = 0;

    const loop = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      const wrap = wrapRef.current;
      const maxScroll = Math.max(0, (wrap?.scrollHeight ?? vh) - vh);

      // Spacer height: hero viewport + gallery scroll + outro runway.
      const desired = vh + maxScroll + 2 * vh;
      if (rootRef.current && Math.abs(desired - spacerHeight) > 1) {
        rootRef.current.style.height = `${desired}px`;
        spacerHeight = desired;
      }

      // Phase 1: black panel slides up over the hero during the first vh.
      if (panelRef.current) {
        const py = Math.max(0, vh - y);
        panelRef.current.style.transform = `translate3d(0, ${py}px, 0)`;
      }

      // Phase 2: panel content scrolls.
      if (wrap) {
        const wy = Math.max(0, y - vh);
        wrap.style.transform = `translate3d(0, ${-wy}px, 0)`;
      }

      // Hero video is irrelevant once fully covered.
      if (videoBoxRef.current) {
        videoBoxRef.current.style.visibility = y > vh ? "hidden" : "visible";
      }

      // Card scale in/out based on live viewport position.
      for (const card of cardRefs.current) {
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        let scale = 0;
        if (rect.bottom > 0 && rect.top < vh) {
          const enter = Math.min(1, (vh - rect.top) / (vh * 0.6));
          const exit = Math.min(1, rect.bottom / (vh * 0.4));
          scale = Math.max(0, Math.min(enter, exit));
        }
        card.style.transform = `scale(${scale})`;
      }

      // Outro: white overlay, info slide, CTA scale, footer fade.
      const outroProgress = Math.max(0, Math.min(1, (y - vh - maxScroll) / (vh - 100)));
      if (overlayRef.current) overlayRef.current.style.opacity = String(outroProgress);
      if (infoRef.current) {
        const offset = window.innerWidth >= 1024 ? 166 : 132;
        infoRef.current.style.transform = `translate3d(0, ${-offset * outroProgress}px, 0)`;
      }
      if (buyRef.current) {
        buyRef.current.style.transform = `scale(${outroProgress})`;
        buyRef.current.style.pointerEvents = outroProgress > 0.6 ? "auto" : "none";
      }
      if (footerRef.current) footerRef.current.style.opacity = String(outroProgress);

      // Circle symbol randomizer, throttled to 80ms, only while scrolling.
      const now = performance.now();
      if (y !== lastScrollY && now - lastSymbolAt > 80 && symbolRef.current) {
        symbolRef.current.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]!;
        lastSymbolAt = now;
      }
      lastScrollY = y;

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [layout]);

  return (
    <div
      ref={rootRef}
      id="scroll-spacer"
      className="relative select-none bg-void"
      style={{ height: "500vh", cursor: cursorActive ? "none" : undefined }}
    >
      <CustomCursor onActiveChange={setCursorActive} />

      {/* Layer 0 — raw full-screen hero video, no overlay */}
      <div ref={videoBoxRef} id="main-canvas" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <video
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Layer 20 — navbar persists above the gallery panel */}
      <div className="fixed left-0 right-0 top-0 z-20 px-6 pt-6 md:px-12 lg:px-16">
        <FadeIn delay={0} duration={600}>
          <nav className="liquid-glass pointer-events-auto flex items-center justify-between rounded-xl px-4 py-2 text-white">
            <span className="text-2xl font-semibold tracking-tight">
              Commission<span className="text-cyan">OS</span>
            </span>
            <div className="hidden items-center gap-8 text-sm md:flex">
              <Link href="/assets" className="transition-colors hover:text-gray-300">
                Assets
              </Link>
              <Link href="/panels" className="transition-colors hover:text-gray-300">
                Panels
              </Link>
              <Link href="/search" className="transition-colors hover:text-gray-300">
                Search
              </Link>
              <span className="cursor-not-allowed text-white/40">Workflow</span>
            </div>
            <Link
              href="/assets"
              className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-100"
            >
              Open App
            </Link>
          </nav>
        </FadeIn>
      </div>

      {/* Layer 5 — hero content, covered by the panel as it slides up */}
      <div className="fixed inset-0 z-[5] flex flex-col px-6 pt-24 md:px-12 lg:px-16">
        {/* Hero bottom content */}
        <div className="flex flex-1 flex-col justify-end pb-12 lg:grid lg:grid-cols-2 lg:items-end lg:pb-16">
          <div className="text-white">
            <AnimatedHeading
              text={"Every asset. Every circuit.\nOne operating system."}
              className="mb-4 text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
            />
            <FadeIn delay={800} duration={1000}>
              <p className="mb-5 text-base text-gray-300 md:text-lg">
                One intelligent layer above SharePoint, Procore, Airtable, FacilityGrid, and GroupMe.
              </p>
            </FadeIn>
            <FadeIn delay={1200} duration={1000}>
              <div className="pointer-events-auto flex flex-wrap gap-4">
                <Link
                  href="/assets"
                  className="rounded-lg bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-gray-100"
                >
                  Open CommissionOS
                </Link>
                <Link
                  href="/panels"
                  className="liquid-glass rounded-lg border border-white/20 px-8 py-3 font-medium text-white transition-colors hover:bg-white hover:text-black"
                >
                  Explore Wing 2
                </Link>
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={1400} duration={1000} className="mt-8 flex items-end justify-start lg:mt-0 lg:justify-end">
            <div className="liquid-glass rounded-xl border border-white/20 px-6 py-3 text-white">
              <span className="text-lg font-light md:text-xl lg:text-2xl">Assets. Panels. Turnover.</span>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Layer 10 — black gallery panel with flowing particle swarm behind cards */}
      <div
        ref={panelRef}
        className="fixed inset-0 z-10 overflow-hidden bg-black"
        style={{ transform: "translate3d(0, 100vh, 0)" }}
      >
        {swarmReady && (
          <div className="pointer-events-none absolute inset-0">
            <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0.6, 9], fov: 45 }}>
              <ambientLight intensity={0.4} />
              <TesseractSwarm />
            </Canvas>
          </div>
        )}

        <div ref={wrapRef} className="relative w-full" style={{ paddingTop: "min(400px, 40vh)" }}>
          {layout.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 px-4 py-2 md:px-8"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {row.map((imageIndex, colIndex) => {
                if (imageIndex === -1) {
                  return <div key={colIndex} style={{ aspectRatio: "2/3" }} />;
                }
                const originRight = colIndex < cols / 2;
                return (
                  <div
                    key={colIndex}
                    ref={(el) => {
                      cardRefs.current[imageIndex] = el;
                    }}
                    className="bp-card overflow-hidden"
                    style={{
                      aspectRatio: "2/3",
                      transform: "scale(0)",
                      transformOrigin: originRight ? "right bottom" : "left bottom",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={GALLERY_IMAGES[imageIndex]}
                      alt={`Archive ${imageIndex + 1}`}
                      draggable={false}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ height: "30vh" }} />
        </div>
      </div>

      {/* Layer 12 — white outro overlay */}
      <div
        ref={overlayRef}
        id="outro-overlay"
        className="pointer-events-none fixed inset-0 z-[12] bg-white"
        style={{ opacity: 0 }}
      />

      {/* Layer 20 — persistent product info (exclusion-blended) */}
      <FadeIn delay={450} duration={600}>
        <div
          ref={infoRef}
          id="outro-info"
          className="pointer-events-none fixed bottom-12 left-0 right-0 z-20 flex flex-col items-center lg:bottom-20 lg:left-auto lg:right-8 lg:w-[330px]"
          style={{ mixBlendMode: "exclusion" }}
        >
          <div className="mb-3 flex w-[252px] flex-col items-start lg:mb-8 lg:w-full">
            <div className="relative mb-2 h-[30px] w-[30px]">
              <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18.75" stroke="#fff" strokeWidth="2.5" />
              </svg>
              <span
                ref={symbolRef}
                id="circle-symbol"
                className="absolute inset-0 flex items-center justify-center text-[13px] font-medium uppercase text-white"
                style={{ letterSpacing: "-0.04em" }}
              >
                8
              </span>
            </div>
            <div
              className="text-center text-[20px] font-medium uppercase leading-none text-white lg:text-[30px]"
              style={{ letterSpacing: "-0.04em" }}
            >
              Project Kansas Archive
              <br />
              &quot;WING 2&quot;
            </div>
          </div>
          <div
            className="text-center text-[60px] font-medium leading-none text-white lg:text-[80px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            A500–C700
          </div>
        </div>
      </FadeIn>

      {/* Layer 20 — "enter" CTA pill, scales in during outro */}
      <div
        ref={buyRef}
        id="outro-buy"
        className="fixed bottom-14 left-4 right-4 z-20 flex h-[100px] items-center justify-center rounded-[1335px] bg-white lg:bottom-8 lg:left-auto lg:right-8 lg:h-[174px] lg:w-[330px]"
        style={{ transform: "scale(0)", transformOrigin: "right bottom", pointerEvents: "none" }}
      >
        <Link
          href="/assets"
          className="flex h-full w-full items-center justify-center text-[72px] font-medium text-white lg:text-[110px]"
          style={{ letterSpacing: "-0.04em", mixBlendMode: "exclusion" }}
        >
          enter
        </Link>
      </div>

      {/* Layer 20 — footer, fades in during outro */}
      <div
        ref={footerRef}
        id="outro-footer"
        className="pointer-events-none fixed bottom-6 left-4 right-4 z-20 flex justify-between text-[11px] font-medium uppercase text-white lg:bottom-8 lg:right-auto lg:gap-20 lg:text-[13px]"
        style={{ mixBlendMode: "exclusion", opacity: 0, letterSpacing: "-0.02em" }}
      >
        <span>CommissionOS (R) 2026</span>
        <span>Project Kansas · Wing 2</span>
      </div>
    </div>
  );
}
