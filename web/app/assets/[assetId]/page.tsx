import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PageShell } from "@/components/layout";
import { AssetDetailView } from "@/features/assets/AssetDetailView";
import { getAssetById, getPanelSchedule, MOCK_ASSETS } from "@/lib/mock-data";

export function generateStaticParams() {
  return MOCK_ASSETS.map((asset) => ({ assetId: asset.id }));
}

export function generateMetadata({ params }: { params: { assetId: string } }): Metadata {
  const asset = getAssetById(params.assetId);
  return { title: asset ? `${asset.name} — CommissionOS` : "Asset not found — CommissionOS" };
}

export default function AssetPage({ params }: { params: { assetId: string } }) {
  const asset = getAssetById(params.assetId);
  if (!asset) notFound();
  const panelSchedule = getPanelSchedule(asset.panel);

  return (
    <PageShell breadcrumb={<span>Assets / {asset.area} / {asset.name}</span>}>
      <AssetDetailView asset={asset} panelSchedule={panelSchedule} />
    </PageShell>
  );
}
