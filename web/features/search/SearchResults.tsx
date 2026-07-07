"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Zap,
  AlertTriangle,
  CircleCheck,
  MapPin,
  Boxes,
  PlugZap,
  ArrowUpRight,
  FileText,
  Clock,
} from "lucide-react";

import { GlassPanel, SectionHeading, StatusPill, Tag, PanelSchedule } from "@/components/ui";
import type { Asset, NormalizedRecord } from "@/types/domain";
import { useProjectData } from "@/features/data/DataProvider";
import { FacilityGridCard } from "@/features/assets/FacilityGridCard";
import { MOCK_ASSETS, WING2_AREAS, getPanelSchedule, getAssetsByPanel } from "@/lib/mock-data";
import { recordDate, formatDate, parseDateValue } from "@/lib/dates";
import { LivePanelSchedule, type LiveCircuit } from "./LivePanelSchedule";
import { SearchVisualization } from "./SearchVisualization";
import { cn } from "@/utils/cn";

// Source names must exactly match the pipeline output source strings.
const SOURCES: { id: string; label: string; source: string }[] = [
  { id: "airtable", label: "Airtable", source: "Airtable Commissioning Tracker" },
  { id: "groupme", label: "GroupMe", source: "GroupMe" },
  { id: "rfis", label: "RFIs", source: "Procore RFI Log" },
  { id: "constraints", label: "Constraints", source: "Cx Constraint Log" },
  { id: "mel", label: "MEL", source: "MEL Master Equipment List" },
  { id: "fa", label: "FA Testing", source: "W2 FA Testing Tracker" },
];

const PANEL_SOURCE = "SharePoint Panel Schedules";
const EVIDENCE_PREVIEW = 4;

interface Hit {
  record: NormalizedRecord;
  date: number;
}

function recordHaystack(record: NormalizedRecord): string {
  return (
    record.searchText ??
    `${record.primaryLabel} ${record.secondaryLabel ?? ""} ${record.status ?? ""} ${record.area ?? ""} ${record.location ?? ""} ${record.trade ?? ""}`.toLowerCase()
  );
}

function hitKey(record: NormalizedRecord): string {
  return [record.source, record.sourceRecordId, record.primaryLabel, record.secondaryLabel ?? ""].join("|");
}

function workflowStage(asset: Asset): string {
  const active = asset.timeline.find((stage) => stage.status === "active" || stage.status === "blocked");
  if (active) return active.status === "blocked" ? `${active.label} — blocked` : active.label;
  const lastDone = [...asset.timeline].reverse().find((stage) => stage.status === "done");
  return lastDone ? `${lastDone.label} complete` : "Installed";
}

function assetLastUpdated(asset: Asset): string {
  let best = 0;
  for (const entry of asset.history) {
    const t = parseDateValue(entry.occurredOn);
    if (t > best) best = t;
  }
  for (const comment of asset.comments) {
    const t = parseDateValue(comment.postedOn);
    if (t > best) best = t;
  }
  return best > 0 ? formatDate(best) : "—";
}

// ————————————————————————————————————————————————————————————————
// Focused entity resolution: the search answers with ONE entity, never a dump.
type Focus =
  | { kind: "asset"; asset: Asset }
  | { kind: "panel"; panelId: string }
  | { kind: "area"; areaId: string }
  | { kind: "circuit"; circuit: string }
  | { kind: "none" };

function resolveFocus(q: string, livePanelIds: string[]): Focus {
  if (q.length === 0) return { kind: "none" };

  const exactAsset = MOCK_ASSETS.find(
    (a) => a.name.toLowerCase() === q || a.id.toLowerCase() === q
  );
  if (exactAsset) return { kind: "asset", asset: exactAsset };

  const areaMatch = WING2_AREAS.find((a) => a.id.toLowerCase() === q);
  if (areaMatch) return { kind: "area", areaId: areaMatch.id };

  if (/^\d{1,2}$/.test(q)) return { kind: "circuit", circuit: q };

  if (q.length >= 3) {
    const livePanel = livePanelIds.find((id) => id.toLowerCase().includes(q));
    if (livePanel) return { kind: "panel", panelId: livePanel };
    const mockPanel = MOCK_ASSETS.find((a) => a.panel.toLowerCase().includes(q));
    if (mockPanel) return { kind: "panel", panelId: mockPanel.panel };
    const partialAsset = MOCK_ASSETS.find(
      (a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
    );
    if (partialAsset) return { kind: "asset", asset: partialAsset };
  }

  return { kind: "none" };
}

// ————————————————————————————————————————————————————————————————

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-center justify-between gap-3 rounded-md border border-glass-border bg-glass px-3 py-2 transition-colors hover:border-cyan/40">
      <span className="text-[10px] uppercase tracking-widest text-ink-dim">{label}</span>
      <span className={cn("truncate text-xs font-medium", href ? "text-cyan" : "text-ink")}>{value}</span>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function EvidenceRow({ hit }: { hit: Hit }) {
  const { record, date } = hit;
  return (
    <div className="flex items-baseline gap-2 border-t border-glass-border py-1.5 text-[11px] first:border-t-0">
      <span className="min-w-0 flex-1 truncate text-ink">{record.primaryLabel}</span>
      {record.status && <span className="max-w-[120px] truncate text-ink-dim">{record.status}</span>}
      {date > 0 && <span className="shrink-0 font-mono text-ink-dim2">{formatDate(date)}</span>}
    </div>
  );
}

function EvidenceStrip({
  buckets,
  totalMatches,
}: {
  buckets: Map<string, Hit[]>;
  totalMatches: number;
}) {
  const withHits = SOURCES.map((s) => ({ ...s, hits: buckets.get(s.source) ?? [] })).filter(
    (s) => s.hits.length > 0
  );
  if (withHits.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-dim">
          Source evidence
        </span>
        <span className="text-[10px] text-ink-dim2">{totalMatches.toLocaleString()} matching records</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {withHits.map((s) => (
          <GlassPanel key={s.id} className="p-3">
            <details>
              <summary className="flex cursor-pointer items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-cyan">{s.label}</span>
                <span className="text-[10px] text-ink-dim">{s.hits.length} · latest first</span>
              </summary>
              <div className="mt-2">
                {s.hits.slice(0, EVIDENCE_PREVIEW).map((hit) => (
                  <EvidenceRow key={hitKey(hit.record)} hit={hit} />
                ))}
                {s.hits.length > EVIDENCE_PREVIEW && (
                  <p className="pt-1.5 text-center text-[10px] text-ink-dim2">
                    +{s.hits.length - EVIDENCE_PREVIEW} more in {s.label}
                  </p>
                )}
              </div>
            </details>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}

// ————————————————————————————————————————————————————————————————

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const { records, recordCount } = useProjectData();

  const model = useMemo(() => {
    const q = query.toLowerCase();
    const buckets = new Map<string, Hit[]>();
    const panelCircuits = new Map<string, Hit[]>();
    const seen = new Set<string>();
    let totalMatches = 0;

    if (q.length > 0) {
      for (const record of records) {
        if (!recordHaystack(record).includes(q)) continue;
        const key = hitKey(record);
        if (seen.has(key)) continue;
        seen.add(key);
        totalMatches += 1;
        const hit: Hit = { record, date: recordDate(record) };

        if (record.source === PANEL_SOURCE) {
          if (record.recordType === "panel_circuit") {
            const panelId = record.panelKeys.find((k) => k.length > 0) ?? "Unknown panel";
            const list = panelCircuits.get(panelId) ?? [];
            list.push(hit);
            panelCircuits.set(panelId, list);
          }
          continue;
        }
        const list = buckets.get(record.source) ?? [];
        list.push(hit);
        buckets.set(record.source, list);
      }
      for (const list of buckets.values()) {
        list.sort((a, b) => b.date - a.date);
      }
    }

    const groupmeHits = buckets.get("GroupMe") ?? [];
    const energized = groupmeHits.find((hit) => recordHaystack(hit.record).includes("energiz")) ?? null;

    const constraintHits = buckets.get("Cx Constraint Log") ?? [];
    const openConstraints = constraintHits.filter(
      (hit) => !/closed|complete/i.test(hit.record.status ?? "")
    );

    const focus = resolveFocus(q, [...panelCircuits.keys()]);

    return { q, buckets, panelCircuits, totalMatches, energized, openConstraints, focus };
  }, [query, records]);

  const { q, buckets, panelCircuits, totalMatches, energized, openConstraints, focus } = model;

  // Live circuits for a given panel id, deduped by circuit number.
  function liveCircuitsFor(panelId: string): LiveCircuit[] {
    const hits = panelCircuits.get(panelId) ?? [];
    const map = new Map<number, LiveCircuit>();
    for (const hit of hits) {
      const raw = (hit.record.raw ?? {}) as Record<string, unknown>;
      const num = Number(raw.circuit ?? hit.record.circuitKeys.find((k) => k.length > 0));
      if (!Number.isFinite(num) || map.has(num)) continue;
      map.set(num, {
        circuit: num,
        breaker: typeof raw.breaker === "string" ? raw.breaker : undefined,
        downstream: typeof raw.downstream === "string" ? raw.downstream : undefined,
      });
    }
    return [...map.values()];
  }

  const statusChips = q.length > 0 && (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
          energized ? "border-emerald/40 bg-emerald-soft text-emerald" : "border-gold/40 bg-gold-soft text-gold"
        )}
      >
        <Zap className="h-3.5 w-3.5" />
        {energized
          ? `Energized (GroupMe, ${formatDate(energized.date) || "date unknown"})`
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
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <SearchVisualization query={query} />
      <div className="relative z-20 mx-auto max-w-5xl px-6 py-10">
        <SectionHeading
          eyebrow={query ? `Results for "${query}"` : "Universal Search"}
          title={query || "Search an asset, panel, circuit, room, or area"}
          description={
            recordCount === 0
              ? "No project data loaded in this browser yet — click Connect data in the top bar and select the pipeline output JSON files."
              : `${recordCount.toLocaleString()} records connected.`
          }
        />

        {statusChips}

        {/* ————— FOCUSED ANSWER ————— */}

        {focus.kind === "asset" && (
          <AssetFocus
            asset={focus.asset}
            energizedLabel={energized ? `Energized (GroupMe, ${formatDate(energized.date)})` : null}
            liveCircuits={liveCircuitsFor(focus.asset.panel)}
            highlight={query}
          />
        )}

        {focus.kind === "panel" && (
          <PanelFocus
            panelId={focus.panelId}
            liveCircuits={liveCircuitsFor(focus.panelId)}
            energized={energized !== null}
            highlight={query}
          />
        )}

        {focus.kind === "area" && <AreaFocus areaId={focus.areaId} openConstraints={openConstraints.length} />}

        {focus.kind === "circuit" && <CircuitFocus circuit={focus.circuit} panelCircuits={panelCircuits} />}

        {focus.kind === "none" && q.length > 0 && totalMatches === 0 && recordCount > 0 && (
          <GlassPanel className="mt-8 p-6 text-center text-sm text-ink-dim">
            Nothing in Wing 2 matches “{query}”. Try an asset tag, panel ID, circuit number, or area code.
          </GlassPanel>
        )}

        {/* ————— EVIDENCE (compact, collapsed — never a table dump) ————— */}
        {q.length > 0 && <EvidenceStrip buckets={buckets} totalMatches={totalMatches} />}
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————

function AssetFocus({
  asset,
  energizedLabel,
  liveCircuits,
  highlight,
}: {
  asset: Asset;
  energizedLabel: string | null;
  liveCircuits: LiveCircuit[];
  highlight: string;
}) {
  const mockSchedule = getPanelSchedule(asset.panel);
  const openConstraints = asset.constraints.filter((c) => c.status === "open");

  return (
    <section className="mt-8">
      <GlassPanel glow={asset.status === "blocked" ? "red" : "cyan"} className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{asset.name}</h2>
              <StatusPill status={asset.status} pulse={asset.status === "blocked"} />
            </div>
            <p className="mt-1 text-xs text-ink-dim">
              Workflow · <span className="text-ink">{workflowStage(asset)}</span>
              {energizedLabel && <span className="ml-3 text-emerald">{energizedLabel}</span>}
            </p>
          </div>
          <Link
            href={`/assets/${asset.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-glass-border-hi bg-glass px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-cyan/40 hover:text-cyan"
          >
            Full asset page <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Electrical chain: Area → Room → Panel → Circuit — always intact */}
          <div className="space-y-1.5 lg:col-span-1">
            <InfoRow label="Area" value={asset.area} href={`/search?q=${encodeURIComponent(asset.area)}`} />
            <InfoRow label="Room" value={asset.room} />
            <InfoRow
              label="Panel"
              value={asset.panel}
              href={`/panels/${encodeURIComponent(asset.panel)}`}
            />
            <InfoRow
              label="Circuit"
              value={asset.circuit}
              href={`/search?q=${encodeURIComponent(asset.circuit)}`}
            />
            <InfoRow label="Trade" value={asset.trade} />
            <div className="flex items-center gap-1.5 pt-2 text-[10px] uppercase tracking-wider text-ink-dim2">
              <Clock className="h-3 w-3" /> Last updated {assetLastUpdated(asset)}
            </div>
          </div>

          {/* Facility Grid */}
          <FacilityGridCard
            statusText={asset.facilityGridStatus}
            latestComment={asset.comments.find((c) => c.source !== "procore")?.body}
          />

          {/* Documents + open constraints */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-ink-dim">Documents</div>
            {asset.documents.length === 0 && <p className="text-[11px] text-ink-dim2">None on file.</p>}
            {asset.documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 rounded-md border border-glass-border bg-glass px-3 py-1.5"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-cyan" />
                <span className="min-w-0 flex-1 truncate text-[11px] text-ink">{doc.name}</span>
                <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald" />
              </div>
            ))}
            <div className="pt-2 text-[10px] uppercase tracking-widest text-ink-dim">Open Constraints</div>
            {openConstraints.length === 0 && <p className="text-[11px] text-emerald">None — clear to proceed.</p>}
            {openConstraints.map((constraint) => (
              <div
                key={constraint.id}
                className="flex items-start gap-2 rounded-md border border-red/30 bg-red-soft px-3 py-1.5"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red" />
                <span className="text-[11px] text-ink">{constraint.label}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* Only THIS asset's panel — live records first, mock fallback */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-dim">
          <Boxes className="h-3.5 w-3.5 text-purple" /> Feeding panel · {asset.panel}
        </div>
        {liveCircuits.length > 0 ? (
          <LivePanelSchedule
            panelId={asset.panel}
            circuits={liveCircuits}
            highlightText={asset.name.toLowerCase() !== highlight.toLowerCase() ? highlight : asset.name}
            energized={energizedLabel !== null}
          />
        ) : mockSchedule ? (
          <PanelSchedule
            schedule={mockSchedule}
            highlightCircuit={asset.circuit}
            linkedAssets={{ [asset.circuit]: { id: asset.id, name: asset.name, status: asset.status } }}
          />
        ) : (
          <GlassPanel className="p-4 text-[11px] text-ink-dim">
            No schedule on file for {asset.panel} — import panel-schedules.json via Connect data.
          </GlassPanel>
        )}
      </div>
    </section>
  );
}

function PanelFocus({
  panelId,
  liveCircuits,
  energized,
  highlight,
}: {
  panelId: string;
  liveCircuits: LiveCircuit[];
  energized: boolean;
  highlight: string;
}) {
  const mockSchedule = getPanelSchedule(panelId);
  const fedAssets = getAssetsByPanel(panelId);
  const anchor = fedAssets.find((a) => a.circuit === "Main") ?? fedAssets.find(() => true);

  return (
    <section className="mt-8">
      <GlassPanel glow={energized ? "emerald" : "purple"} className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Boxes className="h-5 w-5 text-purple" />
              <h2 className="text-xl font-semibold tracking-tight text-ink">{panelId}</h2>
              {energized && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/40 bg-emerald-soft px-2.5 py-1 text-[11px] font-medium text-emerald">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" /> Energized
                </span>
              )}
            </div>
            {anchor && (
              <p className="mt-1 text-xs text-ink-dim">
                {anchor.area} · {anchor.room}
              </p>
            )}
          </div>
          <Link
            href={`/panels/${encodeURIComponent(panelId)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-glass-border-hi bg-glass px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-purple/40 hover:text-purple"
          >
            Panel page <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </GlassPanel>

      <div className="mt-4">
        {liveCircuits.length > 0 ? (
          <LivePanelSchedule panelId={panelId} circuits={liveCircuits} highlightText={highlight} energized={energized} />
        ) : mockSchedule ? (
          <PanelSchedule schedule={mockSchedule} />
        ) : (
          <GlassPanel className="p-4 text-[11px] text-ink-dim">
            No schedule on file for {panelId} — import panel-schedules.json via Connect data.
          </GlassPanel>
        )}
      </div>

      {fedAssets.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {fedAssets.map((a) => (
            <Link
              key={a.id}
              href={`/assets/${a.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-glass-border-hi bg-glass px-3 py-1.5 text-xs text-ink transition-colors hover:border-cyan/40"
            >
              CKT {a.circuit} · {a.name}
              <StatusPill status={a.status} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function AreaFocus({ areaId, openConstraints }: { areaId: string; openConstraints: number }) {
  const assets = MOCK_ASSETS.filter((a) => a.area.toLowerCase() === areaId.toLowerCase());
  const panels = [...new Set(assets.map((a) => a.panel))];

  return (
    <section className="mt-8">
      <GlassPanel glow="cyan" className="p-6">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-cyan" />
          <h2 className="text-xl font-semibold tracking-tight text-ink">Area {areaId}</h2>
          <Tag>Wing 2 · Active scope</Tag>
          {openConstraints > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red/40 bg-red-soft px-2.5 py-1 text-[11px] text-red">
              <AlertTriangle className="h-3 w-3" /> {openConstraints} open
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-widest text-ink-dim">Assets in {areaId}</div>
            {assets.length === 0 && <p className="text-[11px] text-ink-dim2">No tracked assets yet.</p>}
            <div className="space-y-1.5">
              {assets.map((a) => (
                <Link
                  key={a.id}
                  href={`/assets/${a.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-glass-border bg-glass px-3 py-2 transition-colors hover:border-cyan/40"
                >
                  <span className="text-xs font-medium text-ink">{a.name}</span>
                  <StatusPill status={a.status} />
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-widest text-ink-dim">Panels in {areaId}</div>
            {panels.length === 0 && <p className="text-[11px] text-ink-dim2">No tracked panels yet.</p>}
            <div className="space-y-1.5">
              {panels.map((p) => (
                <Link
                  key={p}
                  href={`/panels/${encodeURIComponent(p)}`}
                  className="flex items-center gap-2 rounded-md border border-glass-border bg-glass px-3 py-2 text-xs text-ink transition-colors hover:border-purple/40"
                >
                  <Boxes className="h-3.5 w-3.5 text-purple" /> {p}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </GlassPanel>
    </section>
  );
}

function CircuitFocus({
  circuit,
  panelCircuits,
}: {
  circuit: string;
  panelCircuits: Map<string, Hit[]>;
}) {
  const target = Number(circuit);
  const assets = MOCK_ASSETS.filter((a) => Number(a.circuit) === target);

  // Live rows: this circuit number across every imported panel (capped).
  const liveRows: { panelId: string; downstream: string }[] = [];
  for (const [panelId, hits] of panelCircuits) {
    for (const hit of hits) {
      const raw = (hit.record.raw ?? {}) as Record<string, unknown>;
      if (Number(raw.circuit) !== target) continue;
      const downstream = typeof raw.downstream === "string" ? raw.downstream : "";
      if (downstream && downstream !== "BLANK") liveRows.push({ panelId, downstream });
      if (liveRows.length >= 12) break;
    }
    if (liveRows.length >= 12) break;
  }

  return (
    <section className="mt-8">
      <GlassPanel glow="cyan" className="p-6">
        <div className="flex items-center gap-3">
          <PlugZap className="h-5 w-5 text-cyan" />
          <h2 className="text-xl font-semibold tracking-tight text-ink">Circuit {circuit}</h2>
        </div>

        {assets.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-ink-dim">Connected assets</div>
            {assets.map((a) => (
              <Link
                key={a.id}
                href={`/assets/${a.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-glass-border bg-glass px-3 py-2 transition-colors hover:border-cyan/40"
              >
                <span className="text-xs font-medium text-ink">
                  {a.name} <span className="text-ink-dim">· {a.panel}</span>
                </span>
                <StatusPill status={a.status} />
              </Link>
            ))}
          </div>
        )}

        {liveRows.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-ink-dim">
              CKT {circuit} across imported panels
            </div>
            {liveRows.map((row, i) => (
              <Link
                key={`${row.panelId}-${i}`}
                href={`/search?q=${encodeURIComponent(row.panelId)}`}
                className="flex items-center justify-between gap-3 rounded-md border border-glass-border bg-glass px-3 py-2 transition-colors hover:border-purple/40"
              >
                <span className="truncate text-xs text-ink">{row.downstream}</span>
                <span className="shrink-0 font-mono text-[10px] text-ink-dim">{row.panelId}</span>
              </Link>
            ))}
          </div>
        )}

        {assets.length === 0 && liveRows.length === 0 && (
          <p className="mt-4 text-[11px] text-ink-dim">
            No connected assets found for circuit {circuit}. Search a panel ID to see its full schedule.
          </p>
        )}
      </GlassPanel>
    </section>
  );
}
