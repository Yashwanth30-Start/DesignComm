"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Layers, Boxes, Zap, FileSearch, X } from "lucide-react";

import { StatusPill } from "@/components/ui";
import { MOCK_ASSETS, MOCK_PANEL_SCHEDULES, getAssetsByPanel } from "@/lib/mock-data";
import type { NormalizedRecord } from "@/types/domain";
import { useProjectData } from "@/features/data/DataProvider";

interface AssetResult {
  kind: "asset";
  id: string;
  title: string;
  subtitle: string;
  status: (typeof MOCK_ASSETS)[number]["status"];
}

interface PanelResult {
  kind: "panel";
  id: string;
  panelId: string;
  title: string;
  subtitle: string;
}

interface CircuitResult {
  kind: "circuit";
  id: string;
  panelId: string;
  circuit: string;
  title: string;
  subtitle: string;
}

interface RecordResult {
  kind: "record";
  id: string;
  title: string;
  subtitle: string;
  record: NormalizedRecord;
}

type Result = AssetResult | PanelResult | CircuitResult | RecordResult;

function matchAssets(query: string): AssetResult[] {
  const q = query.toLowerCase();
  return MOCK_ASSETS.filter((asset) =>
    [asset.name, asset.area, asset.room, asset.panel, asset.circuit, asset.trade, asset.status]
      .join(" ")
      .toLowerCase()
      .includes(q)
  ).map((asset) => ({
    kind: "asset" as const,
    id: asset.id,
    title: asset.name,
    subtitle: `${asset.area} · ${asset.room} · Panel ${asset.panel}`,
    status: asset.status,
  }));
}

function matchPanels(query: string): PanelResult[] {
  const q = query.toLowerCase();
  return MOCK_PANEL_SCHEDULES.filter((panel) => `${panel.panelId} ${panel.panelName}`.toLowerCase().includes(q)).map(
    (panel) => ({
      kind: "panel" as const,
      id: panel.panelId,
      panelId: panel.panelId,
      title: panel.panelName,
      subtitle: `${panel.panelId} · ${getAssetsByPanel(panel.panelId).length} asset(s) fed from this panel`,
    })
  );
}

function matchCircuits(query: string): CircuitResult[] {
  const q = query.toLowerCase();
  const results: CircuitResult[] = [];
  for (const panel of MOCK_PANEL_SCHEDULES) {
    for (const circuit of panel.circuits) {
      const haystack = `${circuit.circuit} ${circuit.description} ${circuit.load} ${circuit.status} ${panel.panelId} ${panel.panelName}`;
      if (haystack.toLowerCase().includes(q)) {
        results.push({
          kind: "circuit",
          id: `${panel.panelId}-${circuit.circuit}`,
          panelId: panel.panelId,
          circuit: circuit.circuit,
          title: `${panel.panelName} — CKT ${circuit.circuit}`,
          subtitle: `${circuit.description} · ${circuit.status}`,
        });
      }
    }
  }
  return results;
}

function matchRecords(query: string, records: NormalizedRecord[], limit: number): RecordResult[] {
  const q = query.toLowerCase();
  const results: RecordResult[] = [];
  for (let i = 0; i < records.length && results.length < limit; i++) {
    const record = records[i]!;
    const haystack =
      record.searchText ??
      `${record.primaryLabel} ${record.secondaryLabel ?? ""} ${record.status ?? ""} ${record.area ?? ""} ${record.location ?? ""} ${record.trade ?? ""}`.toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        kind: "record",
        id: `${record.source}-${record.sourceRecordId}-${i}`,
        title: record.primaryLabel,
        subtitle: `${record.source} · ${record.recordType}${record.status ? ` · ${record.status}` : ""}`,
        record,
      });
    }
  }
  return results;
}

function RecordDrawer({ record, onClose }: { record: NormalizedRecord; onClose: () => void }) {
  const rawEntries = record.raw ? Object.entries(record.raw).filter(([, value]) => value != null && value !== "") : [];
  const metaEntries: [string, string | undefined][] = [
    ["Source", record.source],
    ["Type", String(record.recordType)],
    ["Status", record.status],
    ["Area", record.area],
    ["Location", record.location],
    ["Trade", record.trade],
    ["File", record.sourcePath],
    ["Sheet", record.sourceSheet],
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-glass-border-hi bg-void/95 shadow-glass backdrop-blur-xs">
      <div className="flex items-start justify-between gap-3 border-b border-glass-border px-5 py-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-cyan">{record.source}</div>
          <h2 className="mt-1 break-words text-base font-semibold text-ink">{record.primaryLabel}</h2>
          {record.secondaryLabel && <p className="mt-1 text-xs text-ink-dim">{record.secondaryLabel}</p>}
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-glass hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <dl className="space-y-2">
          {metaEntries
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="flex gap-3 text-xs">
                <dt className="w-20 shrink-0 uppercase tracking-wider text-ink-dim">{label}</dt>
                <dd className="break-words text-ink">{value}</dd>
              </div>
            ))}
        </dl>
        {rawEntries.length > 0 && (
          <>
            <div className="mt-6 mb-2 text-[10px] uppercase tracking-widest text-ink-dim">Source fields</div>
            <dl className="space-y-2 rounded-md border border-glass-border bg-glass p-3">
              {rawEntries.map(([key, value]) => (
                <div key={key} className="text-xs">
                  <dt className="uppercase tracking-wider text-ink-dim">{key}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap break-words text-ink">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>
    </div>
  );
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<NormalizedRecord | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { records, recordCount } = useProjectData();

  const results = useMemo<Result[]>(() => {
    if (query.trim().length === 0) return [];
    const mockResults = [...matchAssets(query), ...matchPanels(query), ...matchCircuits(query)].slice(0, 6);
    const recordResults = matchRecords(query, records, 12);
    return [...mockResults, ...recordResults];
  }, [query, records]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setActiveRecord(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function goTo(result: Result) {
    setOpen(false);
    if (result.kind === "record") {
      setActiveRecord(result.record);
      return;
    }
    setQuery("");
    if (result.kind === "asset") {
      router.push(`/assets/${result.id}`);
    } else if (result.kind === "panel") {
      router.push(`/panels/${encodeURIComponent(result.panelId)}`);
    } else {
      router.push(`/panels/${encodeURIComponent(result.panelId)}?highlight=${encodeURIComponent(result.circuit)}`);
    }
  }

  return (
    <>
      <div ref={containerRef} className="relative ml-auto w-full max-w-sm">
        <div className="flex items-center gap-2 rounded-md border border-glass-border-hi bg-glass px-3 py-1.5 text-xs text-ink focus-within:border-cyan/50">
          <Search className="h-3.5 w-3.5 shrink-0 text-ink-dim" strokeWidth={1.8} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              recordCount > 0
                ? `Search ${recordCount.toLocaleString()} records + assets, panels, circuits…`
                : "Search assets, panels, circuits…"
            }
            className="w-full bg-transparent text-xs text-ink placeholder:text-ink-dim focus:outline-none"
          />
        </div>

        {open && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-96 overflow-y-auto rounded-md border border-glass-border-hi bg-void/95 p-1.5 shadow-glass backdrop-blur-xs">
            {results.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-ink-dim">
                No matches for &quot;{query}&quot;.
                {recordCount === 0 && (
                  <span className="mt-1 block">
                    Tip: click <span className="text-ink">Connect data</span> to load pipeline exports — then Asset
                    #s, Equipment IDs, RFIs, and circuits from every tracker become searchable here.
                  </span>
                )}
              </div>
            )}
            {results.map((result) => (
              <button
                key={`${result.kind}-${result.id}`}
                onClick={() => goTo(result)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-glass-hi"
              >
                {result.kind === "asset" && <Layers className="h-3.5 w-3.5 shrink-0 text-cyan" />}
                {result.kind === "panel" && <Boxes className="h-3.5 w-3.5 shrink-0 text-purple" />}
                {result.kind === "circuit" && <Zap className="h-3.5 w-3.5 shrink-0 text-gold" />}
                {result.kind === "record" && <FileSearch className="h-3.5 w-3.5 shrink-0 text-emerald" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink">{result.title}</div>
                  <div className="truncate text-[10px] text-ink-dim">{result.subtitle}</div>
                </div>
                {result.kind === "asset" && <StatusPill status={result.status} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeRecord && <RecordDrawer record={activeRecord} onClose={() => setActiveRecord(null)} />}
    </>
  );
}
