"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Layers, Boxes, Database } from "lucide-react";

import { GlassPanel, SectionHeading, StatusPill, Tabs, Tag, type TabDef } from "@/components/ui";
import type { NormalizedRecord } from "@/types/domain";
import { useProjectData } from "@/features/data/DataProvider";
import { MOCK_ASSETS, MOCK_PANEL_SCHEDULES } from "@/lib/mock-data";

// Tab order mirrors the field workflow sketch: inspection scheduling first,
// then the electrical chain (panel schedule -> energization chat -> facility
// grid), then TCO/testing, equipment master, and finally open items.
const TAB_ORDER: { id: string; label: string; sources: string[] }[] = [
  { id: "all", label: "All", sources: [] },
  { id: "airtable", label: "Airtable · Inspections", sources: ["Airtable Commissioning Tracker"] },
  { id: "panels", label: "Panel Schedules", sources: ["SharePoint Panel Schedules"] },
  { id: "groupme", label: "GroupMe · Energization", sources: ["GroupMe"] },
  { id: "facilitygrid", label: "FacilityGrid", sources: ["FacilityGrid"] },
  { id: "fa", label: "FA Testing · TCO", sources: ["W2 FA Testing Tracker"] },
  { id: "mel", label: "MEL", sources: ["MEL Master Equipment List"] },
  { id: "constraints", label: "Constraints", sources: ["Cx Constraint Log"] },
  { id: "rfis", label: "RFIs", sources: ["Procore RFI Log"] },
];

interface DedupedRecord {
  record: NormalizedRecord;
  duplicates: number;
  exact: boolean;
}

function recordKey(record: NormalizedRecord): string {
  return [record.source, record.sourceRecordId, record.primaryLabel, record.secondaryLabel ?? ""].join("|");
}

function recordHaystack(record: NormalizedRecord): string {
  return (
    record.searchText ??
    `${record.primaryLabel} ${record.secondaryLabel ?? ""} ${record.status ?? ""} ${record.area ?? ""} ${record.location ?? ""} ${record.trade ?? ""}`.toLowerCase()
  );
}

function isExactMatch(record: NormalizedRecord, q: string): boolean {
  const target = q.toLowerCase();
  if (record.primaryLabel.toLowerCase() === target) return true;
  if (record.sourceRecordId.toLowerCase() === target) return true;
  const keys = [...record.assetKeys, ...record.panelKeys, ...record.rfiKeys];
  return keys.some((key) => key.toLowerCase() === target);
}

function RecordCard({ item }: { item: DedupedRecord }) {
  const { record, duplicates, exact } = item;
  const rawEntries = record.raw
    ? Object.entries(record.raw).filter(([, value]) => value != null && String(value).trim() !== "")
    : [];

  return (
    <GlassPanel glow={exact ? "cyan" : "none"} className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-cyan">{record.source}</div>
          <div className="mt-1 break-all text-sm font-medium leading-snug text-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
            {record.primaryLabel}
          </div>
          {record.secondaryLabel && (
            <p className="mt-1 break-words text-xs leading-snug text-ink-dim [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
              {record.secondaryLabel}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {exact && <Tag className="border-cyan/40 text-cyan">Exact match</Tag>}
          {duplicates > 1 && <Tag>{duplicates}× duplicate</Tag>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {record.status && <Tag>{record.status}</Tag>}
        {record.area && <Tag>{record.area}</Tag>}
        {record.trade && <Tag className="max-w-[220px] truncate">{record.trade}</Tag>}
        <Tag className="max-w-[260px] truncate">{record.sourcePath}</Tag>
      </div>
      {rawEntries.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] uppercase tracking-widest text-ink-dim hover:text-ink">
            Source fields ({rawEntries.length})
          </summary>
          <dl className="mt-2 space-y-2 rounded-md border border-glass-border bg-glass p-3">
            {rawEntries.map(([key, value]) => (
              <div key={key} className="text-xs">
                <dt className="uppercase tracking-wider text-ink-dim">{key}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap break-all text-ink">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </GlassPanel>
  );
}

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const { records, recordCount } = useProjectData();
  const [activeTab, setActiveTab] = useState("all");

  const { byTab, mockAssetHits, mockPanelHits } = useMemo(() => {
    const q = query.toLowerCase();
    const grouped = new Map<string, DedupedRecord[]>();
    for (const tab of TAB_ORDER) grouped.set(tab.id, []);

    if (q.length > 0) {
      const seen = new Map<string, DedupedRecord>();
      for (const record of records) {
        if (!recordHaystack(record).includes(q)) continue;
        const key = recordKey(record);
        const existing = seen.get(key);
        if (existing) {
          existing.duplicates += 1;
          continue;
        }
        const item: DedupedRecord = { record, duplicates: 1, exact: isExactMatch(record, query) };
        seen.set(key, item);
        const tab = TAB_ORDER.find((candidate) => candidate.sources.includes(record.source));
        grouped.get(tab ? tab.id : "all")!.push(item);
        if (tab) grouped.get("all")!.push(item);
      }
      // Exact matches float to the top of every tab.
      for (const list of grouped.values()) {
        list.sort((a, b) => Number(b.exact) - Number(a.exact));
      }
    }

    const assetHits =
      q.length > 0
        ? MOCK_ASSETS.filter((asset) =>
            `${asset.name} ${asset.area} ${asset.room} ${asset.panel} ${asset.circuit}`.toLowerCase().includes(q)
          )
        : [];
    const panelHits =
      q.length > 0
        ? MOCK_PANEL_SCHEDULES.filter((panel) => `${panel.panelId} ${panel.panelName}`.toLowerCase().includes(q))
        : [];

    return { byTab: grouped, mockAssetHits: assetHits, mockPanelHits: panelHits };
  }, [query, records]);

  const tabs: TabDef[] = TAB_ORDER.map((tab) => ({
    id: tab.id,
    label: tab.label,
    count: byTab.get(tab.id)?.length ?? 0,
  }));

  const activeResults = byTab.get(activeTab) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <SectionHeading
        eyebrow={query ? `Results for "${query}"` : "Search"}
        title={query || "Type a query in the search bar"}
        description={
          recordCount === 0
            ? "No project data loaded in this browser yet — click Connect data in the top bar and select the pipeline output JSON files to search every Asset #, Equipment ID, RFI, circuit, and message."
            : `Searching ${recordCount.toLocaleString()} imported records across every source, plus built-in assets and panels.`
        }
      />

      {(mockAssetHits.length > 0 || mockPanelHits.length > 0) && (
        <div className="mt-8 flex flex-wrap gap-2">
          {mockAssetHits.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="flex items-center gap-2 rounded-md border border-glass-border-hi bg-glass px-3 py-2 text-xs text-ink transition-colors hover:border-cyan/40"
            >
              <Layers className="h-3.5 w-3.5 text-cyan" />
              {asset.name}
              <StatusPill status={asset.status} />
            </Link>
          ))}
          {mockPanelHits.map((panel) => (
            <Link
              key={panel.panelId}
              href={`/panels/${encodeURIComponent(panel.panelId)}`}
              className="flex items-center gap-2 rounded-md border border-glass-border-hi bg-glass px-3 py-2 text-xs text-ink transition-colors hover:border-purple/40"
            >
              <Boxes className="h-3.5 w-3.5 text-purple" />
              {panel.panelName}
            </Link>
          ))}
        </div>
      )}

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} className="mt-8" />

      <div className="mt-6 space-y-3">
        {activeTab === "facilitygrid" && activeResults.length === 0 && (
          <GlassPanel className="flex items-center gap-3 p-5 text-sm text-ink-dim">
            <Database className="h-4 w-4 shrink-0" />
            FacilityGrid live status comes from the Tampermonkey bridge in a later phase — its exports aren&apos;t in
            the parsed dataset yet.
          </GlassPanel>
        )}
        {activeTab !== "facilitygrid" && query && activeResults.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-dim">No records in this tab for &quot;{query}&quot;.</p>
        )}
        {activeResults.map((item) => (
          <RecordCard key={recordKey(item.record)} item={item} />
        ))}
      </div>
    </div>
  );
}
