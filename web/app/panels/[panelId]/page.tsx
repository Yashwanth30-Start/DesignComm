import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PageShell } from "@/components/layout";
import { PanelDetailView } from "@/features/panels/PanelDetailView";
import { getPanelSchedule, getAssetsByPanel, MOCK_PANEL_SCHEDULES } from "@/lib/mock-data";

export function generateStaticParams() {
  return MOCK_PANEL_SCHEDULES.map((schedule) => ({ panelId: schedule.panelId }));
}

export function generateMetadata({ params }: { params: { panelId: string } }): Metadata {
  const schedule = getPanelSchedule(decodeURIComponent(params.panelId));
  return { title: schedule ? `${schedule.panelName} — CommissionOS` : "Panel not found — CommissionOS" };
}

export default function PanelPage({
  params,
  searchParams,
}: {
  params: { panelId: string };
  searchParams: { highlight?: string };
}) {
  const panelId = decodeURIComponent(params.panelId);
  const schedule = getPanelSchedule(panelId);
  if (!schedule) notFound();
  const assetsOnPanel = getAssetsByPanel(panelId);

  return (
    <PageShell breadcrumb={<span>Panels / {schedule.panelName}</span>}>
      <PanelDetailView schedule={schedule} assetsOnPanel={assetsOnPanel} highlightCircuit={searchParams.highlight} />
    </PageShell>
  );
}
