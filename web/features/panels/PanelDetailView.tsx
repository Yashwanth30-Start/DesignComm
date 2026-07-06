"use client";

import Link from "next/link";
import { Link2 } from "lucide-react";

import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { GlassPanel, SectionHeading, StatusPill, PanelSchedule } from "@/components/ui";
import type { Asset, PanelScheduleData } from "@/types/domain";

export function PanelDetailView({
  schedule,
  assetsOnPanel,
}: {
  schedule: PanelScheduleData;
  assetsOnPanel: Asset[];
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Reveal>
        <div className="mb-2 text-xs uppercase tracking-widest text-ink-dim">Panel</div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">{schedule.panelName}</h1>
        <p className="mt-2 text-sm text-ink-dim">{schedule.panelId}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <PanelSchedule schedule={schedule} className="mt-10" />
      </Reveal>

      <Reveal delay={0.15}>
        <section className="mt-14">
          <SectionHeading eyebrow="On This Panel" title="Assets" />
          {assetsOnPanel.length === 0 ? (
            <p className="mt-5 text-sm text-ink-dim">No mock assets are attached to this panel yet.</p>
          ) : (
            <StaggerGroup className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {assetsOnPanel.map((asset) => (
                <StaggerItem key={asset.id}>
                  <Link href={`/assets/${asset.id}`}>
                    <GlassPanel hoverLift className="flex items-center gap-3 p-4">
                      <Link2 className="h-4 w-4 shrink-0 text-cyan" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink">{asset.name}</div>
                        <div className="text-[10px] text-ink-dim">
                          {asset.area} · {asset.room} · CKT {asset.circuit}
                        </div>
                      </div>
                      <StatusPill status={asset.status} />
                    </GlassPanel>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </section>
      </Reveal>
    </div>
  );
}
