"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, AlertTriangle, FileText, Search, X, Zap } from "lucide-react";

import { StatusPill, Tag } from "@/components/ui";
import type { NormalizedRecord } from "@/types/domain";
import { useProjectData } from "@/features/data/DataProvider";
import { PANEL_SOURCE, SOURCES, recordHaystack } from "@/features/data/sources";
import { MOCK_ASSETS } from "@/lib/mock-data";
import { formatDate, recordDate } from "@/lib/dates";
import { cn } from "@/utils/cn";
import { assetTokens, BOARD_STATUS_LABELS, type BoardCell } from "./panel-board";

// Pressing a circuit on the board opens this drawer: everything every
// connected app (GroupMe, RFIs, Airtable, Constraints, MEL, FA testing)
// knows about the load on that breaker, in one place.

const ROWS_PER_SOURCE = 5;

interface SourceHits {
  id: string;
  label: string;
  hits: { record: NormalizedRecord; date: number }[];
}

export function CircuitDrawer({
  panelId,
  cell,
  onClose,
}: {
  panelId: string;
  cell: BoardCell | null;
  onClose: () => void;
}) {
  const { records, recordCount } = useProjectData();

  useEffect(() => {
    if (!cell) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cell, onClose]);

  const model = useMemo(() => {
    if (!cell || cell.status === "blank") return null;
    const tokens = assetTokens(cell.title)
      .map((t) => t.toLowerCase())
      .filter((t) => t.length >= 3);
    const primaryToken = assetTokens(cell.title)[0] ?? cell.title;

    const bySource = new Map<string, { record: NormalizedRecord; date: number }[]>();
    let total = 0;
    if (tokens.length > 0) {
      for (const record of records) {
        if (record.source === PANEL_SOURCE) continue;
        const hay = recordHaystack(record);
        const matches =
          tokens.some((t) => hay.includes(t)) ||
          record.assetKeys.some((k) => tokens.includes(k.toLowerCase()));
        if (!matches) continue;
        total += 1;
        const list = bySource.get(record.source) ?? [];
        list.push({ record, date: recordDate(record) });
        bySource.set(record.source, list);
      }
    }
    const groups: SourceHits[] = SOURCES.map((s) => ({
      id: s.id,
      label: s.label,
      hits: (bySource.get(s.source) ?? []).sort((a, b) => b.date - a.date),
    })).filter((s) => s.hits.length > 0);

    const groupmeHits = bySource.get("GroupMe") ?? [];
    const energized =
      groupmeHits.find((hit) => recordHaystack(hit.record).includes("energiz")) ?? null;

    const asset = MOCK_ASSETS.find((a) => tokens.includes(a.name.toLowerCase())) ?? null;

    return { tokens, primaryToken, groups, total, energized, asset };
  }, [cell, records]);

  if (!cell || !model) return null;

  const { primaryToken, groups, total, energized, asset } = model;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close circuit details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-glass-border bg-bg-2 shadow-glass">
        <header className="flex items-start justify-between gap-3 border-b border-glass-border px-5 py-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-ink-dim">
              CKT {cell.poles.join(" · ")} — {panelId}
            </div>
            <h3 className="mt-1 break-all text-lg font-semibold tracking-tight text-ink">
              {cell.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Tag
                className={cn(
                  cell.status === "energized" && "border-emerald/40 text-emerald",
                  cell.status === "future" && "border-purple/40 text-purple",
                  cell.status === "blocked" && "border-red/40 text-red",
                  cell.status === "de-energized" && "border-gold/40 text-gold"
                )}
              >
                {BOARD_STATUS_LABELS[cell.status]}
              </Tag>
              {cell.breaker && <Tag>{cell.breaker}</Tag>}
              {cell.poles.length > 1 && <Tag>{cell.poles.length}-pole</Tag>}
              {energized && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald/40 bg-emerald-soft px-2.5 py-0.5 text-[10px] font-medium text-emerald">
                  <Zap className="h-3 w-3" />
                  GroupMe {formatDate(energized.date) || "date unknown"}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-glass hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {asset && (
            <section className="mb-5 rounded-lg border border-cyan/25 bg-glass p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-ink-dim">
                    CommissionOS asset
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{asset.name}</span>
                    <StatusPill status={asset.status} pulse={asset.status === "blocked"} />
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-dim">
                    {asset.area} · {asset.room} · {asset.trade}
                  </div>
                </div>
                <Link
                  href={`/assets/${asset.id}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-glass-border-hi bg-glass px-3 py-1.5 text-[11px] font-medium text-ink transition-colors hover:border-cyan/40 hover:text-cyan"
                >
                  Asset page <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              {asset.constraints.filter((c) => c.status === "open").map((constraint) => (
                <div
                  key={constraint.id}
                  className="mt-2 flex items-start gap-2 rounded-md border border-red/30 bg-red-soft px-3 py-1.5"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red" />
                  <span className="text-[11px] text-ink">{constraint.label}</span>
                </div>
              ))}
              <div className="mt-2 text-[11px] text-ink-dim">{asset.facilityGridStatus}</div>
            </section>
          )}

          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
              From every connected app
            </span>
            {total > 0 && (
              <span className="text-[10px] text-ink-dim2">{total.toLocaleString()} records</span>
            )}
          </div>

          {recordCount === 0 && (
            <p className="rounded-md border border-glass-border bg-glass p-3 text-[11px] leading-relaxed text-ink-dim">
              No project data connected in this browser yet. Click <span className="text-ink">Connect data</span> in
              the top bar and select the pipeline output JSON files — GroupMe, RFIs, Airtable,
              Constraints, MEL, and FA Testing records for {primaryToken} will appear here.
            </p>
          )}

          {recordCount > 0 && groups.length === 0 && (
            <p className="rounded-md border border-glass-border bg-glass p-3 text-[11px] text-ink-dim">
              No connected records mention {primaryToken} yet.
            </p>
          )}

          <div className="space-y-3">
            {groups.map((group) => (
              <details key={group.id} open className="rounded-lg border border-glass-border bg-glass p-3">
                <summary className="flex cursor-pointer items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-cyan">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-ink-dim">{group.hits.length} · latest first</span>
                </summary>
                <div className="mt-2">
                  {group.hits.slice(0, ROWS_PER_SOURCE).map(({ record, date }, i) => {
                    const rawEntries = record.raw
                      ? Object.entries(record.raw).filter(
                          ([, value]) => value != null && String(value).trim() !== ""
                        )
                      : [];
                    return (
                      <div
                        key={`${record.sourceRecordId}-${i}`}
                        className="border-t border-glass-border py-2 text-[11px] first:border-t-0 first:pt-0.5"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 break-words text-ink">
                            {record.primaryLabel}
                          </span>
                          {date > 0 && (
                            <span className="shrink-0 font-mono text-[10px] text-ink-dim2">
                              {formatDate(date)}
                            </span>
                          )}
                        </div>
                        {record.secondaryLabel && (
                          <p className="mt-0.5 break-words text-ink-dim">{record.secondaryLabel}</p>
                        )}
                        {record.status && (
                          <p className="mt-0.5 truncate text-[10px] text-ink-dim2">{record.status}</p>
                        )}
                        {rawEntries.length > 0 && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-[9px] uppercase tracking-widest text-ink-dim2 hover:text-ink-dim">
                              All fields ({rawEntries.length})
                            </summary>
                            <dl className="mt-1.5 space-y-1 rounded-md border border-glass-border bg-bg p-2">
                              {rawEntries.map(([key, value]) => (
                                <div key={key}>
                                  <dt className="text-[9px] uppercase tracking-wider text-ink-dim">
                                    {key}
                                  </dt>
                                  <dd className="mt-0.5 whitespace-pre-wrap break-all text-[10px] text-ink">
                                    {String(value)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </details>
                        )}
                      </div>
                    );
                  })}
                  {group.hits.length > ROWS_PER_SOURCE && (
                    <p className="pt-1 text-center text-[10px] text-ink-dim2">
                      +{group.hits.length - ROWS_PER_SOURCE} more in {group.label}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>

          {asset && asset.documents.length > 0 && (
            <section className="mt-4">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
                Documents
              </div>
              <div className="space-y-1.5">
                {asset.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 rounded-md border border-glass-border bg-glass px-3 py-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-cyan" />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-ink">{doc.name}</span>
                    <span className="shrink-0 text-[9px] uppercase tracking-wider text-ink-dim2">
                      {doc.source}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="border-t border-glass-border px-5 py-3">
          <Link
            href={`/search?q=${encodeURIComponent(primaryToken)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-glass-border-hi bg-glass px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-cyan/40 hover:text-cyan"
          >
            <Search className="h-3.5 w-3.5" /> Search {primaryToken} across everything
          </Link>
        </footer>
      </aside>
    </div>
  );
}
