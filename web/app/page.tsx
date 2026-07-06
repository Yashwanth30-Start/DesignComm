"use client";

import Link from "next/link";
import { motion, useTransform, type MotionValue } from "motion/react";
import {
  Cloud,
  Table2,
  ClipboardList,
  Building2,
  MessageCircle,
  PenTool,
  ArrowDown,
  RotateCcw,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import { AmbientScene } from "@/components/three";
import {
  PinnedChapter,
  ScrollSectionStage,
  ScrollProgressRail,
  Reveal,
  StaggerGroup,
  StaggerItem,
  MagneticButton,
  SpotlightCursor,
} from "@/components/motion";
import {
  buttonVariants,
  GlassPanel,
  SectionHeading,
  StatusPill,
  IconTile,
  Tag,
  Marquee,
} from "@/components/ui";
import { WING2_AREAS } from "@/lib/mock-data";
import type { WorkflowStatus } from "@/types/domain";

const SOURCES: { icon: LucideIcon; label: string; accent: "cyan" | "amber" | "purple" | "emerald" | "gold" | "security" }[] = [
  { icon: Cloud, label: "SharePoint", accent: "cyan" },
  { icon: Table2, label: "Airtable", accent: "amber" },
  { icon: ClipboardList, label: "Procore", accent: "purple" },
  { icon: Building2, label: "FacilityGrid", accent: "emerald" },
  { icon: MessageCircle, label: "GroupMe", accent: "gold" },
  { icon: PenTool, label: "Bluebeam", accent: "security" },
];

const DATA_MODEL = ["Project", "Areas", "Rooms", "Panels", "Circuits", "Assets", "Documents", "History"];

const STATUS_SHOWCASE: { status: WorkflowStatus; caption: string }[] = [
  { status: "ready", caption: "No blockers. Moving on schedule." },
  { status: "waiting", caption: "Depends on another asset or inspection." },
  { status: "blocked", caption: "An open constraint is stopping progress." },
  { status: "commissioned", caption: "Startup verified, punch list clear." },
  { status: "complete", caption: "Turned over. Nothing left to track." },
];

const LOOP_STEPS = ["Commissioned", "Issue Found", "Constraint", "Reinspection", "Startup Again", "Commissioned"];

/* ------------------------------------------------------------------ */
/* Chapter 1 — Hero: giant type holds, then scales away as you scroll */

function HeroChapter({ progress }: { progress: MotionValue<number> }) {
  const scale = useTransform(progress, [0, 0.5, 1], [1, 1.02, 0.9]);
  const opacity = useTransform(progress, [0, 0.55, 0.95], [1, 1, 0]);
  const y = useTransform(progress, [0, 1], [0, -80]);

  return (
    <motion.div style={{ scale, opacity, y }}>
      <SpotlightCursor className="flex flex-col items-center text-center">
        <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-cyan">
          Project Kansas · Wing 2
        </div>
        <h1 className="bg-gradient-to-br from-white via-cyan to-purple bg-clip-text text-7xl font-bold leading-[0.95] tracking-tight text-transparent sm:text-8xl lg:text-9xl">
          CommissionOS
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-dim">
          The operating system for construction commissioning. One platform for assets, panels,
          circuits, inspections, and turnover.
        </p>
        <MagneticButton className="mt-14 inline-block">
          <div className="flex flex-col items-center gap-2 text-ink-dim">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
              <ArrowDown className="h-4 w-4" />
            </motion.div>
          </div>
        </MagneticButton>

        <div className="mt-16 w-screen max-w-none border-y border-glass-border py-4">
          <Marquee>
            {[...SOURCES.map((source) => source.label), "One Platform", "Wing 2", "A500 – C700"].map((label) => (
              <span
                key={label}
                className="text-sm font-semibold uppercase tracking-[0.25em] text-ink-dim"
              >
                {label}
              </span>
            ))}
          </Marquee>
        </div>
      </SpotlightCursor>
    </motion.div>
  );
}

/* --------------------------------------------------------------------- */
/* Chapter 2 — Problem: six scattered trackers converge into one platform */

const TILE_OFFSETS = [
  { x: -300, y: -140 },
  { x: 300, y: -120 },
  { x: -340, y: 60 },
  { x: 340, y: 90 },
  { x: -160, y: 200 },
  { x: 180, y: 180 },
];

function ConvergingTile({
  progress,
  offset,
  source,
}: {
  progress: MotionValue<number>;
  offset: { x: number; y: number };
  source: (typeof SOURCES)[number];
}) {
  const x = useTransform(progress, [0, 0.6], [offset.x, 0]);
  const y = useTransform(progress, [0, 0.6], [offset.y, 0]);
  const opacity = useTransform(progress, [0, 0.15, 0.55, 0.7], [0, 1, 1, 0]);
  const scale = useTransform(progress, [0.5, 0.7], [1, 0.6]);

  return (
    <motion.div style={{ x, y, opacity, scale }} className="absolute">
      <IconTile icon={source.icon} accent={source.accent} label={source.label} />
    </motion.div>
  );
}

function ProblemChapter({ progress }: { progress: MotionValue<number> }) {
  const headingOpacity = useTransform(progress, [0, 0.12], [0, 1]);
  const coreOpacity = useTransform(progress, [0.55, 0.75], [0, 1]);
  const coreScale = useTransform(progress, [0.55, 0.8], [0.7, 1]);
  const captionOpacity = useTransform(progress, [0.78, 0.92], [0, 1]);

  return (
    <div className="flex flex-col items-center">
      <motion.div style={{ opacity: headingOpacity }}>
        <SectionHeading
          align="center"
          eyebrow="02 — The Problem"
          title="Dozens of disconnected trackers."
          description="Six systems, each holding a piece of the truth. Keep scrolling — watch them collapse into one."
          className="mx-auto"
        />
      </motion.div>

      <div className="relative mt-10 flex h-72 w-full items-center justify-center">
        {SOURCES.map((source, i) => (
          <ConvergingTile key={source.label} progress={progress} offset={TILE_OFFSETS[i]!} source={source} />
        ))}
        <motion.div style={{ opacity: coreOpacity, scale: coreScale }}>
          <GlassPanel glow="cyan" className="px-10 py-6 text-center">
            <div className="text-2xl font-bold text-ink">CommissionOS</div>
            <div className="mt-1 text-xs text-ink-dim">one operational layer above all six</div>
          </GlassPanel>
        </motion.div>
      </div>

      <motion.p style={{ opacity: captionOpacity }} className="mt-6 max-w-md text-center text-sm text-ink-dim">
        The systems stay. CommissionOS becomes the layer that reads them all — so nobody checks six
        trackers before making a call in the field.
      </motion.p>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Chapter 3 — Data model: horizontal rail scrubs across as you scroll */

function DataModelChapter({ progress }: { progress: MotionValue<number> }) {
  const x = useTransform(progress, [0.1, 0.9], ["18%", "-52%"]);
  const headingOpacity = useTransform(progress, [0, 0.12], [0, 1]);

  return (
    <div>
      <motion.div style={{ opacity: headingOpacity }}>
        <SectionHeading
          align="center"
          eyebrow="03 — The Data Model"
          title="Everything revolves around the Asset."
          className="mx-auto"
        />
      </motion.div>
      <div className="mt-16 overflow-hidden py-4">
        <motion.div style={{ x }} className="flex w-max items-center gap-4">
          {DATA_MODEL.map((node, i) => (
            <div key={node} className="flex items-center gap-4">
              <GlassPanel
                glow={node === "Assets" ? "cyan" : "none"}
                className={`px-10 py-6 text-lg font-semibold ${node === "Assets" ? "text-cyan" : "text-ink"}`}
              >
                {node}
              </GlassPanel>
              {i < DATA_MODEL.length - 1 && <ArrowRight className="h-5 w-5 shrink-0 text-ink-dim" />}
            </div>
          ))}
        </motion.div>
      </div>
      <p className="mt-10 text-center text-sm text-ink-dim">
        Every trade, trigger, and turnover document traces back to one asset — with complete history.
      </p>
    </div>
  );
}

/* ------------------------------------------------------- */
/* Chapter 5 — Scope: area grid clip-reveals into the frame */

function ScopeChapter({ progress }: { progress: MotionValue<number> }) {
  const clipPath = useTransform(
    progress,
    [0.1, 0.6],
    ["inset(28% 28% 28% 28% round 24px)", "inset(0% 0% 0% 0% round 24px)"]
  );
  const headingOpacity = useTransform(progress, [0, 0.15], [0, 1]);

  return (
    <div>
      <motion.div style={{ opacity: headingOpacity }}>
        <SectionHeading
          align="center"
          eyebrow="05 — Version 1 Scope"
          title="Wing 2: A500–C700 online now."
          description="D600/D700 and E600/E700 are mapped and ready — they join once Wing 2 proves out the workflow engine."
          className="mx-auto"
        />
      </motion.div>
      <motion.div style={{ clipPath }} className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {WING2_AREAS.map((area) => (
          <GlassPanel
            key={area.id}
            glow={area.active ? "emerald" : "none"}
            className={`flex flex-col items-center gap-1 py-5 ${!area.active && "opacity-40"}`}
          >
            <span className="text-sm font-semibold text-ink">{area.id}</span>
            <span className="text-[10px] uppercase tracking-wider text-ink-dim">
              {area.active ? "Active" : "Phase 2"}
            </span>
          </GlassPanel>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------- */
/* Page assembly */

export default function HomePage() {
  return (
    <>
      <AmbientScene />
      <ScrollProgressRail />

      <div className="pointer-events-none fixed left-6 top-6 z-40 text-xs font-semibold tracking-tight text-ink/70">
        Commission<span className="text-cyan">OS</span>
      </div>
      <div className="pointer-events-none fixed bottom-6 left-6 z-40 hidden text-[10px] uppercase tracking-[0.2em] text-ink-dim/70 sm:block">
        Project Kansas · Wing 2
      </div>

      <div className="relative">
        <PinnedChapter id="opening" heightVh={200}>
          {(progress) => <HeroChapter progress={progress} />}
        </PinnedChapter>

        <PinnedChapter id="problem" heightVh={320}>
          {(progress) => <ProblemChapter progress={progress} />}
        </PinnedChapter>

        <PinnedChapter id="data-model" heightVh={300}>
          {(progress) => <DataModelChapter progress={progress} />}
        </PinnedChapter>

        {/* Chapter 4 — Workflow engine (flowing section between pins) */}
        <ScrollSectionStage id="workflow">
          <SectionHeading
            align="center"
            eyebrow="04 — The Workflow Engine"
            title="Ready. Waiting. Blocked. Commissioned. Complete."
            description="CommissionOS determines status automatically instead of asking you to interpret five different trackers by hand."
            className="mx-auto"
          />
          <GlassPanel className="mx-auto mt-12 max-w-2xl p-6">
            <StaggerGroup className="space-y-3">
              {STATUS_SHOWCASE.map(({ status, caption }) => (
                <StaggerItem key={status} className="flex items-center gap-4">
                  <StatusPill status={status} pulse={status === "blocked"} className="w-32 shrink-0 justify-center" />
                  <span className="text-sm text-ink-dim">{caption}</span>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </GlassPanel>
          <div className="mt-14">
            <p className="mb-6 text-center text-xs uppercase tracking-widest text-ink-dim">
              The workflow never assumes linear progress
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {LOOP_STEPS.map((step, i) => (
                <div key={`${step}-${i}`} className="flex items-center gap-3">
                  <Tag className="px-3 py-1.5 text-xs">{step}</Tag>
                  {i < LOOP_STEPS.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-ink-dim" />}
                </div>
              ))}
              <RotateCcw className="h-4 w-4 text-purple" />
            </div>
          </div>
        </ScrollSectionStage>

        <PinnedChapter id="scope" heightVh={260}>
          {(progress) => <ScopeChapter progress={progress} />}
        </PinnedChapter>

        {/* Chapter 6 — Close / CTA */}
        <ScrollSectionStage id="enter">
          <div className="flex flex-col items-center text-center">
            <SectionHeading
              align="center"
              eyebrow="06 — See It Live"
              title="Open a real asset."
              description="FSD-13 — Wing 2, Cell WH B-6. Blocked on a controls constraint, TY inspection scheduled next week."
            />
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/assets/fsd-13" className={buttonVariants({ size: "lg" })}>
                Open Asset Detail Page <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/assets" className={buttonVariants({ size: "lg", variant: "secondary" })}>
                Browse All Assets
              </Link>
            </div>
            <Reveal delay={0.2}>
              <p className="mt-16 text-xs text-ink-dim">
                Tip: inside the app, click <span className="text-ink">Connect data</span> to load your local
                pipeline exports — every Asset #, Equipment ID, RFI, and circuit becomes searchable, and the
                data never leaves your browser.
              </p>
            </Reveal>
          </div>
        </ScrollSectionStage>
      </div>
    </>
  );
}
