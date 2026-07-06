"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Cloud,
  Table2,
  ClipboardList,
  Building2,
  MessageCircle,
  PenTool,
  ArrowDown,
  ChevronDown,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

import { AmbientScene } from "@/components/three";
import {
  ScrollSectionStage,
  ScrollProgressRail,
  Reveal,
  StaggerGroup,
  StaggerItem,
  GlowPulse,
  MagneticButton,
} from "@/components/motion";
import {
  buttonVariants,
  GlassPanel,
  SectionHeading,
  StatusPill,
  IconTile,
  Tag,
  Divider,
} from "@/components/ui";
import { WING2_AREAS } from "@/lib/mock-data";
import type { WorkflowStatus } from "@/types/domain";

const SOURCES = [
  { icon: Cloud, label: "SharePoint", accent: "cyan" as const },
  { icon: Table2, label: "Airtable", accent: "amber" as const },
  { icon: ClipboardList, label: "Procore", accent: "purple" as const },
  { icon: Building2, label: "FacilityGrid", accent: "emerald" as const },
  { icon: MessageCircle, label: "GroupMe", accent: "gold" as const },
  { icon: PenTool, label: "Bluebeam", accent: "security" as const },
];

const DATA_MODEL = ["Project", "Areas", "Rooms", "Panels", "Circuits", "Assets", "Documents", "History"];

const STATUS_SHOWCASE: WorkflowStatus[] = ["ready", "waiting", "blocked", "commissioned", "complete"];

const LOOP_STEPS = ["Commissioned", "Issue Found", "Constraint", "Reinspection", "Startup Again", "Commissioned"];

export default function HomePage() {
  return (
    <>
      <AmbientScene />
      <ScrollProgressRail />

      <div className="relative">
        {/* 1 — Opening */}
        <ScrollSectionStage id="opening">
          <div className="flex flex-col items-center text-center">
            <Reveal>
              <div className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-cyan">
                Project Kansas · Wing 2
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="bg-gradient-to-br from-white via-cyan to-purple bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-8xl">
                CommissionOS
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-xl text-lg text-ink-dim">
                The operating system for construction commissioning. One platform for assets,
                panels, circuits, inspections, and turnover.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <MagneticButton className="mt-14 inline-block">
                <div className="flex flex-col items-center gap-2 text-ink-dim">
                  <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
                  <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                    <ArrowDown className="h-4 w-4" />
                  </motion.div>
                </div>
              </MagneticButton>
            </Reveal>
          </div>
        </ScrollSectionStage>

        {/* 2 — Problem */}
        <ScrollSectionStage id="problem">
          <SectionHeading
            align="center"
            eyebrow="The Problem"
            title="Dozens of disconnected trackers."
            description="SharePoint, Airtable, Procore, FacilityGrid, GroupMe, and Bluebeam each hold a piece of the truth. None of them hold all of it — and nobody has time to check all six before making a call in the field."
            className="mx-auto"
          />
          <StaggerGroup className="mt-14 flex flex-wrap justify-center gap-6">
            {SOURCES.map((source) => (
              <StaggerItem key={source.label}>
                <IconTile icon={source.icon} accent={source.accent} label={source.label} />
              </StaggerItem>
            ))}
          </StaggerGroup>
          <div className="mt-10 flex flex-col items-center gap-4">
            <ChevronDown className="h-5 w-5 text-ink-dim" />
            <GlowPulse color="cyan">
              <GlassPanel glow="cyan" className="px-8 py-4">
                <span className="text-lg font-semibold text-ink">CommissionOS</span>
                <span className="ml-2 text-xs text-ink-dim">— one operational layer above all six</span>
              </GlassPanel>
            </GlowPulse>
          </div>
        </ScrollSectionStage>

        {/* 3 — Data model */}
        <ScrollSectionStage id="data-model">
          <SectionHeading
            align="center"
            eyebrow="The Data Model"
            title="Everything revolves around the Asset."
            description="Every trade, trigger, and turnover document traces back to one asset — and every asset carries its complete history."
            className="mx-auto"
          />
          <div className="mt-14 flex flex-col items-center">
            {DATA_MODEL.map((node, i) => (
              <div key={node} className="flex flex-col items-center">
                <Reveal delay={i * 0.06}>
                  <GlassPanel hoverLift className="px-8 py-3 text-sm font-medium text-ink">
                    {node}
                  </GlassPanel>
                </Reveal>
                {i < DATA_MODEL.length - 1 && <Divider orientation="vertical" className="my-2 h-6" />}
              </div>
            ))}
          </div>
        </ScrollSectionStage>

        {/* 4 — Workflow engine */}
        <ScrollSectionStage id="workflow">
          <SectionHeading
            align="center"
            eyebrow="The Workflow Engine"
            title="Ready. Waiting. Blocked. Commissioned. Complete."
            description="CommissionOS determines status automatically instead of asking you to interpret five different trackers by hand."
            className="mx-auto"
          />
          <StaggerGroup className="mt-12 flex flex-wrap justify-center gap-3">
            {STATUS_SHOWCASE.map((status) => (
              <StaggerItem key={status}>
                <StatusPill status={status} pulse={status === "blocked"} />
              </StaggerItem>
            ))}
          </StaggerGroup>

          <div className="mt-16">
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

        {/* 5 — Scope */}
        <ScrollSectionStage id="scope">
          <SectionHeading
            align="center"
            eyebrow="Version 1 Scope"
            title="Wing 2: A500–C700 online now."
            description="D600/D700 and E600/E700 are mapped and ready — they join once Wing 2 proves out the workflow engine."
            className="mx-auto"
          />
          <div className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {WING2_AREAS.map((area) => (
              <GlassPanel
                key={area.id}
                glow={area.active ? "emerald" : "none"}
                className={`flex flex-col items-center gap-1 py-4 ${!area.active && "opacity-40"}`}
              >
                <span className="text-sm font-semibold text-ink">{area.id}</span>
                <span className="text-[10px] uppercase tracking-wider text-ink-dim">
                  {area.active ? "Active" : "Phase 2"}
                </span>
              </GlassPanel>
            ))}
          </div>
        </ScrollSectionStage>

        {/* 6 — Close / CTA */}
        <ScrollSectionStage id="enter">
          <div className="flex flex-col items-center text-center">
            <SectionHeading
              align="center"
              eyebrow="See It Live"
              title="Open a real asset."
              description="FSD-13 — Wing 2, Cell WH B-6. Blocked on a controls constraint, TY inspection scheduled next week."
            />
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/assets/fsd-13" className={buttonVariants({ size: "lg" })}>
                Open Asset Detail Page <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/assets/pnl-b600-04"
                className={buttonVariants({ size: "lg", variant: "secondary" })}
              >
                View PNL-B600-04
              </Link>
            </div>
            <p className="mt-16 text-xs text-ink-dim">
              CommissionOS V1 — design system + reusable components. Homepage and the live workflow
              queue build next, on top of these same components.
            </p>
          </div>
        </ScrollSectionStage>
      </div>
    </>
  );
}
