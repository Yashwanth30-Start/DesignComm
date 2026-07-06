import Link from "next/link";
import type { Metadata } from "next";

import { PageShell } from "@/components/layout";
import { GlassPanel, SectionHeading, Tag } from "@/components/ui";
import { MOCK_PANEL_SCHEDULES, getAssetsByPanel } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Panels — CommissionOS" };

export default function PanelsIndexPage() {
  return (
    <PageShell breadcrumb={<span>Panels</span>}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <SectionHeading
          eyebrow={`${MOCK_PANEL_SCHEDULES.length} panels`}
          title="All Panels"
          description="Every panel schedule tracked in this V1 build. Click through for the full circuit table and the assets fed from it."
        />
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MOCK_PANEL_SCHEDULES.map((schedule) => {
            const assetCount = getAssetsByPanel(schedule.panelId).length;
            return (
              <Link key={schedule.panelId} href={`/panels/${encodeURIComponent(schedule.panelId)}`}>
                <GlassPanel hoverLift className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{schedule.panelName}</div>
                    <div className="mt-0.5 truncate text-[11px] text-ink-dim">
                      {schedule.panelId} · {schedule.circuits.length} circuits
                    </div>
                  </div>
                  <Tag>{assetCount} asset{assetCount === 1 ? "" : "s"}</Tag>
                </GlassPanel>
              </Link>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
