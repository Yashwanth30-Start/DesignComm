import Link from "next/link";
import type { Metadata } from "next";

import { PageShell } from "@/components/layout";
import { GlassPanel, StatusPill, SectionHeading } from "@/components/ui";
import { MOCK_ASSETS } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Assets — CommissionOS" };

export default function AssetsIndexPage() {
  return (
    <PageShell breadcrumb={<span>Assets</span>}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <SectionHeading
          eyebrow={`${MOCK_ASSETS.length} assets`}
          title="All Assets"
          description="Every asset tracked in this V1 build. Click through for the full workflow timeline, panel schedule, constraints, and history."
        />
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MOCK_ASSETS.map((asset) => (
            <Link key={asset.id} href={`/assets/${asset.id}`}>
              <GlassPanel hoverLift className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{asset.name}</div>
                  <div className="mt-0.5 truncate text-[11px] text-ink-dim">
                    {asset.area} · {asset.room} · Panel {asset.panel} · CKT {asset.circuit}
                  </div>
                </div>
                <StatusPill status={asset.status} pulse={asset.status === "blocked"} />
              </GlassPanel>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
