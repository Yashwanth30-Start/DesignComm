"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Layers, Boxes, Zap, AlertTriangle, CircleCheck } from "lucide-react";

import { GlassPanel, SectionHeading, StatusPill, Tag } from "@/components/ui";
import type { NormalizedRecord } from "@/types/domain";
import { useProjectData } from "@/features/data/DataProvider";
import { MOCK_ASSETS, MOCK_PANEL_SCHEDULES } from "@/lib/mock-data";
import { LivePanelSchedule, type LiveCircuit } from "./LivePanelSchedule";
import { SearchVisualization } from "./SearchVisualization";
import { cn } from "@/utils/cn";

// Source columns per the field sketch: Airtable | GroupMe | Procore first,
// then supporting trackers. Panel schedule records render as the breaker
// grid up top instead of appearing as a column.
const SOURCE_COLUMNS: { id: string; label: string; source: string }[] = [
  { id: "airtable", label: "Airtable · Inspections", source: "Airtable Commissioning Tracker" },
  { id: "groupme", label: "GroupMe · Energization", source: "GroupMe" },
  { id: "rfis", label: "Procore · RFIs", source: "Procore RFI Log" },
  { id: "constraints", label: "Constraint Log", source: "Cx Constraint Log" },
  { id: "mel", label: "MEL", source: "MEL Master Equipment List" },
  { id: "fa", label: "FA Testing · TCO", source: "W2 FA Testing Tracker" },
];

const PANEL_SOURCE = "SharePoint Panel Schedules";

const DATE_KEYS = [
  "occurredOn",
  "Last Modified",
  "Date of Test",
  "Created",
  "Initiated At",
  "dateIdentified",
  "completedDate",
  "testDate",
  "updatedOn",
  "Due Date",
  "Closed Date",
];

interface Deduped {
  record: NormalizedRecord;
  duplicates: number;
  exact: boolean;
  date: number;
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

function parseDateValue(value: string): number {
  if (!value) return 0;
  let t = Date.parse(value);
  if (!Number.isNaN(t)) return t;
  t = Date.parse(value.replace(" ", "T"));
  if (!Number.isNaN(t)) return t;
  const m = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const year = m[3]!.length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(year, Number(m[1]) - 1, Number(m[2])).getTime();
  }
  return 0;
}

function recordDate(record: NormalizedRecord): number {
  const candidates: string[] = [];
  if (record.status) candidates.push(record.status);
  const raw = record.raw ?? {};
  for (const key of DATE_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string") candidates.push(value);
  }
  let best = 0;
  for (const candidate of candidates) {
    const t = parseDateValue(candidate);
    if (t > best) best = t;
  }
  return best;
}

function formatDate(t: number): string {
  if (t <= 0) return "";
  return new Date(t).toISOString().slice(0, 10);
}

function RecordCard({ item }: { item: Deduped }) {
  const { record, duplicates, exact, date } = item;
  const rawEntries = record.raw
    ? Object.entries(record.raw).filter(([, value]) => value != null && String(value).trim() !== "")
    : [];

  return (
    <GlassPanel glow={exact ? "cyan" : "none"} className="p-3">
      <div className="break-all text-xs font-medium leading-snug text-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
        {record.primaryLabel}
      </div>
      {record.secondaryLabel && (
        <p className="mt-1 break-words text-[11px] leading-snug text-ink-dim [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
          {record.secondaryLabel}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {date > 0 && <Tag className="text-cyan">{formatDate(date)}</Tag>}
        {record.status && <Tag className="max-w-[160px] truncate">{record.status}</Tag>}
        {record.area && <Tag>{record.area}</Tag>}
        {exact && <Tag className="border-cyan/40 text-cyan">Exact</Tag>}
        {duplicates > 1 && <Tag>{duplicates}×</Tag>}
      </div>
      {rawEntries.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-ink-dim hover:text-ink">
            Fields ({rawEntries.length})
          </summary>
          <dl className="mt-1.5 space-y-1.5 rounded-md border border-glass-border bg-glass p-2">
            {rawEntries.map(([key, value]) => (
              <div key={key} className="text-[11px]">
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

const COLUMN_PREVIEW = 6;

function SourceColumn({ label, items }: { label: string; items: Deduped[] }) {
  const preview = items.slice(0, COLUMN_PREVIEW);
  const rest = items.slice(COLUMN_PREVIEW);
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between border-b border-glass-border pb-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-cyan">{label}</span>
        <span className="text-[10px] text-ink-dim">{items.length} · latest first</span>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-ink-dim">No matches</p>
      ) : (
        <div className="space-y-2">
          {preview.map((item) => (
            <RecordCard key={recordKey(item.record)} item={item} />
          ))}
          {rest.length > 0 && (
            <details>
              <summary className="cursor-pointer py-1 text-center text-[11px] text-ink-dim hover:text-ink">
                Show {rest.length} more
              </summary>
              <div className="mt-2 space-y-2">
                {rest.map((item) => (
                  <RecordCard key={recordKey(item.record)} item={item} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const { records, recordCount } = useProjectData();

  const { columns, panel, energized, openConstraints, mockAssetHits, mockPanelHits, totalMatches } = useMemo(() => {
    const q = query.toLowerCase();
    const bySource = new Map<string, Deduped[]>();
    const panelCircuits: Deduped[] = [];
    const panelTitles: Deduped[] = [];
    const seen = new Map<string, Deduped>();
    let total = 0;

    const assetHits =
      q.length > 0
        ? MOCK_ASSETS.filter((asset) =>
            `${asset.name} ${asset.area} ${asset.room} ${asset.panel} ${asset.circuit}`.toLowerCase().includes(q)
          )
        : [];

    if (q.length > 0) {
      for (const record of records) {
        if (!recordHaystack(record).includes(q)) continue;
        const key = recordKey(record);
        const existing = seen.get(key);
        if (existing) {
          existing.duplicates += 1;
          continue;
        }
        const item: Deduped = {
          record,
          duplicates: 1,
          exact: isExactMatch(record, query),
          date: recordDate(record),
        };
        seen.set(key, item);
        total += 1;

        if (record.source === PANEL_SOURCE) {
          if (record.recordType === "panel_circuit") panelCircuits.push(item);
          else panelTitles.push(item);
          continue;
        }
        const list = bySource.get(record.source) ?? [];
        list.push(item);
        bySource.set(record.source, list);
      }
      for (const list of bySource.values()) {
        list.sort((a, b) => b.date - a.date || Number(b.exact) - Number(a.exact));
      }
    }

    // Assemble the breaker grid: group circuits by parent panel, prefer the
    // panel whose id matches the query, else the one with the most circuits.
    // Fall back to asset info if no imported panel records exist.
    let panelData: { panelId: string; rating?: string; fedFrom?: string; circuits: LiveCircuit[] } | null = null;
    if (panelCircuits.length > 0) {
      const groups = new Map<string, Deduped[]>();
      for (const item of panelCircuits) {
        const panelId = item.record.panelKeys[0] ?? "Unknown panel";
        const list = groups.get(panelId) ?? [];
        list.push(item);
        groups.set(panelId, list);
      }
      let chosenId = "";
      let chosen: Deduped[] = [];
      for (const [panelId, list] of groups) {
        if (panelId.toLowerCase() === q) {
          chosenId = panelId;
          chosen = list;
          break;
        }
        if (list.length > chosen.length) {
          chosenId = panelId;
          chosen = list;
        }
      }
      const title = panelTitles.find((item) => item.record.primaryLabel === chosenId);
      const titleRaw = (title?.record.raw ?? {}) as Record<string, unknown>;
      const circuitMap = new Map<number, LiveCircuit>();
      for (const item of chosen) {
        const raw = (item.record.raw ?? {}) as Record<string, unknown>;
        const num = Number(raw.circuit ?? item.record.circuitKeys[0]);
        if (!Number.isFinite(num)) continue;
        if (!circuitMap.has(num)) {
          circuitMap.set(num, {
            circuit: num,
            breaker: typeof raw.breaker === "string" ? raw.breaker : undefined,
            downstream: typeof raw.downstream === "string" ? raw.downstream : undefined,
          });
        }
      }
      panelData = {
        panelId: chosenId,
        rating: typeof titleRaw.rating === "string" ? titleRaw.rating : title?.record.secondaryLabel,
        fedFrom: typeof titleRaw.fedFrom === "string" ? titleRaw.fedFrom : undefined,
        circuits: [...circuitMap.values()],
      };
    } else if (assetHits.length > 0) {
      // Fallback: if searching for an asset (no imported panel records), extract panel/circuit from asset.
      const asset = assetHits[0];
      if (asset.panel && asset.circuit) {
        panelData = {
          panelId: asset.panel,
          circuits: [
            {
              circuit: Number(asset.circuit),
              breaker: undefined,
              downstream: asset.name,
            },
          ],
        };
      }
    }

    // Headline status: latest GroupMe message mentioning energization.
    const groupmeItems = bySource.get("GroupMe") ?? [];
    const energizedItem = groupmeItems.find((item) => recordHaystack(item.record).includes("energiz"));

    // Open constraints among matches.
    const constraintItems = bySource.get("Cx Constraint Log") ?? [];
    const open = constraintItems.filter((item) => !/closed|complete/i.test(item.record.status ?? ""));

    const panelHits =
      q.length > 0
        ? MOCK_PANEL_SCHEDULES.filter((p) => `${p.panelId} ${p.panelName}`.toLowerCase().includes(q))
        : [];

    return {
      columns: SOURCE_COLUMNS.map((col) => ({ ...col, items: bySource.get(col.source) ?? [] })),
      panel: panelData,
      energized: energizedItem ?? null,
      openConstraints: open,
      mockAssetHits: assetHits,
      mockPanelHits: panelHits,
      totalMatches: total,
    };
  }, [query, records]);

  return (
    <div className="relative min-h-screen">
      <SearchVisualization query={query} />
      <div className="relative z-20 mx-auto max-w-7xl px-6 py-10">
        <SectionHeading
          eyebrow={query ? `Results for "${query}"` : "Search"}
          title={query || "Type a query in the search bar"}
          description={
            recordCount === 0
              ? "No project data loaded in this browser yet — click Connect data in the top bar and select the pipeline output JSON files."
              : `${totalMatches.toLocaleString()} matches across ${recordCount.toLocaleString()} imported records.`
          }
        />

      {/* Primary answers: status, constraints, quick links */}
      {(query || mockAssetHits.length > 0) && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
              energized
                ? "border-emerald/40 bg-emerald-soft text-emerald"
                : "border-gold/40 bg-gold-soft text-gold"
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            {energized
              ? `Status — Energized (GroupMe, ${formatDate(energized.date) || "date unknown"})`
              : "No energization record found"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
              openConstraints.length > 0
                ? "border-red/40 bg-red-soft text-red"
                : "border-emerald/40 bg-emerald-soft text-emerald"
            )}
          >
            {openConstraints.length > 0 ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <CircleCheck className="h-3.5 w-3.5" />
            )}
            {openConstraints.length > 0
              ? `${openConstraints.length} open constraint${openConstraints.length === 1 ? "" : "s"}`
              : "No open constraints"}
          </span>
          {mockAssetHits.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-glass-border-hi bg-glass px-3 py-1.5 text-xs text-ink transition-colors hover:border-cyan/40"
            >
              <Layers className="h-3.5 w-3.5 text-cyan" />
              {asset.name}
              <StatusPill status={asset.status} />
            </Link>
          ))}
          {mockPanelHits.map((p) => (
            <Link
              key={p.panelId}
              href={`/panels/${encodeURIComponent(p.panelId)}`}
              className="inline-flex items-center gap-2 rounded-full border border-glass-border-hi bg-glass px-3 py-1.5 text-xs text-ink transition-colors hover:border-purple/40"
            >
              <Boxes className="h-3.5 w-3.5 text-purple" />
              {p.panelName}
            </Link>
          ))}
        </div>
      )}

      {/* Panel schedule breaker grid from live records */}
      {panel && panel.circuits.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan">
            Panel Schedule · {PANEL_SOURCE}
          </div>
          <LivePanelSchedule
            panelId={panel.panelId}
            rating={panel.rating}
            fedFrom={panel.fedFrom}
            circuits={panel.circuits}
            highlightText={query}
            energized={energized !== null}
          />
        </section>
      )}

      {/* Source columns, latest first */}
      {query && (
        <div className="mt-10 grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {columns.map((col) => (
            <SourceColumn key={col.id} label={col.label} items={col.items} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
