"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { BlackHoleStage } from "@/components/three";

// Cinematic landing: the singularity hangs in a dark sky above a luminous
// horizon (per the art direction reference) with the headline and universal
// search floating in front. No scrolling — one viewport, one action.
export function ParticleLanding() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function submitSearch() {
    const q = query.trim();
    if (q.length === 0) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-black text-white">
      {/* Layer 1: the black hole, filling the sky */}
      <BlackHoleStage className="z-[1]" offsetY={1.1} cameraPosition={[0, 1.4, 7.4]} fov={58} />

      {/* Layer 2: luminous horizon — bright line + reflection pool glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[38vh]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 100%, rgba(111,227,242,0.22) 0%, rgba(111,227,242,0.07) 35%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 5%, rgba(191,244,252,0.55) 35%, rgba(255,255,255,0.9) 50%, rgba(191,244,252,0.55) 65%, transparent 95%)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-24"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, rgba(191,244,252,0.18) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Minimal top bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-xl font-semibold tracking-tight">
          Commission<span className="text-white/50">OS</span>
        </span>
        <Link
          href="/home"
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

        {/* Universal search, straight from the landing page */}
        <div className="mx-auto mb-6 flex max-w-md items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm focus-within:border-white/50">
          <Search className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.8} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitSearch();
            }}
            placeholder="Search an asset, panel, circuit, room, or area…"
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
            href="/home"
            className="rounded-full bg-white px-8 py-3 font-medium text-black shadow-[0_10px_25px_rgba(255,255,255,0.15)] transition-transform hover:-translate-y-0.5"
          >
            What should I work on today?
          </Link>
          <Link
            href="/assets"
            className="rounded-full border border-white/25 px-8 py-3 font-medium text-white transition-colors hover:bg-white hover:text-black"
          >
            Browse Assets
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
