"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Link2 } from "lucide-react";

import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { GlassPanel, SectionHeading, StatusPill, PanelSchedule, type LinkedAsset } from "@/components/ui";
import type { Asset, PanelScheduleData } from "@/types/domain";

export function PanelDetailView({
  schedule,
  assetsOnPanel,
  highlightCircuit,
}: {
  schedule: PanelScheduleData;
  assetsOnPanel: Asset[];
  highlightCircuit?: string;
}) {
  const linkedAssets = assetsOnPanel.reduce<Record<string, LinkedAsset>>((map, asset) => {
    map[asset.circuit] = { id: asset.id, name: asset.name, status: asset.status };
    return map;
  }, {});

  useEffect(() => {
    if (!highlightCircuit) return;
    document.getElementById(`ckt-${highlightCircuit}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightCircuit]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Reveal>
        <div className="mb-2 text-xs uppercase tracking-widest text-ink-dim">Panel</div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">{schedule.panelName}</h1>
        <p className="mt-2 text-sm text-ink-dim">{schedule.panelId}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <PanelSchedule
          schedule={schedule}
          highlightCircuit={highlightCircuit}
          linkedAssets={linkedAssets}
          className="mt-10"
        />
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
