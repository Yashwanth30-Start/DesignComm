"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Link2 } from "lucide-react";

import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { GlassPanel, SectionHeading, StatusPill } from "@/components/ui";
import type { Asset, PanelScheduleData } from "@/types/domain";
import { useProjectData } from "@/features/data/DataProvider";
import { PANEL_SOURCE } from "@/features/data/sources";
import { boardFromMock, boardFromRecords } from "./panel-board";
import { EnergizedPanelBoard } from "./EnergizedPanelBoard";

export function PanelDetailView({
  schedule,
  assetsOnPanel,
  highlightCircuit,
}: {
  schedule: PanelScheduleData;
  assetsOnPanel: Asset[];
  highlightCircuit?: string;
}) {
  const { records } = useProjectData();

  // Live imported SharePoint circuits for this panel win; the mock fixture is
  // the fallback so the page still demos without Connect data.
  const liveCircuits = useMemo(
    () =>
      boardFromRecords(
        records.filter(
          (record) =>
            record.source === PANEL_SOURCE &&
            record.recordType === "panel_circuit" &&
            record.panelKeys.includes(schedule.panelId)
        )
      ),
    [records, schedule.panelId]
  );
  const live = liveCircuits.length > 0;
  const circuits = live ? liveCircuits : boardFromMock(schedule);

  useEffect(() => {
    if (!highlightCircuit) return;
    document.getElementById(`ckt-${Number(highlightCircuit)}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightCircuit]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Reveal>
        <EnergizedPanelBoard
          panelId={schedule.panelId}
          circuits={circuits}
          live={live}
          scheduleName={schedule.scheduleName}
          permitNumber={schedule.permitNumber}
          fedBy={schedule.fedBy}
          highlightCircuit={highlightCircuit}
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
