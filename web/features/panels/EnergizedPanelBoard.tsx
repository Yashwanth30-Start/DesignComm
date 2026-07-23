"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  Copy,
  Download,
  LayoutGrid,
  List,
  Loader2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import { GlassPanel, Tabs } from "@/components/ui";
import { useProjectData } from "@/features/data/DataProvider";
import { recordHaystack } from "@/features/data/sources";
import { cn } from "@/utils/cn";
import { CircuitDrawer } from "./CircuitDrawer";
import {
  assetTokens,
  bankCells,
  parsePanelMeta,
  BOARD_STATUS_LABELS,
  type BoardCell,
  type BoardCircuit,
  type BoardStatus,
} from "./panel-board";

// The PJKS-style energized-circuits board: metadata strip, Energized / Future /
// Spares / Panel Schedule tabs, and the classic two-bank breaker layout with
// green energized cells and merged multi-pole feeds. Pressing any non-blank
// circuit opens the CircuitDrawer with that load's records from every app.

const CELL_STYLES: Record<BoardStatus, { cell: string; sub: string }> = {
  energized: { cell: "border-emerald/60 bg-emerald/15", sub: "text-emerald" },
  future: { cell: "border-glass-border bg-glass", sub: "text-ink-dim" },
  "de-energized": { cell: "border-gold/40 bg-gold-soft", sub: "text-gold" },
  blocked: { cell: "border-red/40 bg-red-soft", sub: "text-red" },
  spare: { cell: "border-glass-border bg-glass", sub: "text-ink-dim2" },
  blank: { cell: "border-glass-border/60 bg-transparent", sub: "text-ink-dim2" },
  unknown: { cell: "border-glass-border bg-glass", sub: "text-ink-dim2" },
};

interface AuditRow {
  ok: boolean;
  text: string;
}

export interface EnergizedPanelBoardProps {
  panelId: string;
  circuits: BoardCircuit[];
  /** True when circuits were built from imported SharePoint records. */
  live: boolean;
  scheduleName?: string;
  permitNumber?: string;
  fedBy?: string;
  /** Text to highlight matching load titles (search query). */
  highlightText?: string;
  /** Circuit number to highlight (deep link from an asset). */
  highlightCircuit?: string;
  className?: string;
}

export function EnergizedPanelBoard({
  panelId,
  circuits,
  live,
  scheduleName,
  permitNumber,
  fedBy,
  highlightText,
  highlightCircuit,
  className,
}: EnergizedPanelBoardProps) {
  const { records, importing, importFiles } = useProjectData();
  const importRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("schedule");
  const [view, setView] = useState<"panel" | "list">("panel");
  const [selected, setSelected] = useState<BoardCell | null>(null);
  const [copied, setCopied] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);

  const meta = useMemo(() => parsePanelMeta(panelId), [panelId]);
  const oddCells = useMemo(() => bankCells(circuits, 1), [circuits]);
  const evenCells = useMemo(() => bankCells(circuits, 0), [circuits]);

  const counts = useMemo(() => {
    const cells = [...oddCells, ...evenCells];
    const by = (status: BoardStatus) => cells.filter((c) => c.status === status);
    return {
      cells,
      energized: by("energized"),
      future: by("future"),
      spares: by("spare"),
      blanks: by("blank"),
      blocked: by("blocked"),
      activeCircuits: circuits.filter((c) => c.status !== "blank").length,
      rows: Math.max(
        circuits.filter((c) => c.circuit % 2 === 1).length,
        circuits.filter((c) => c.circuit % 2 === 0).length
      ),
    };
  }, [oddCells, evenCells, circuits]);

  // Live alerts: blocked circuits, energized feeds missing a breaker size, and
  // open constraints (from imported data) that name a load on this panel.
  const alerts = useMemo(() => {
    const list: { severity: "red" | "gold"; text: string }[] = [];
    for (const cell of counts.blocked) {
      list.push({ severity: "red", text: `CKT ${cell.poles.join("/")} — ${cell.title} is blocked` });
    }
    for (const cell of counts.energized) {
      if (!cell.breaker) {
        list.push({
          severity: "gold",
          text: `CKT ${cell.poles.join("/")} — ${cell.title} energized with no breaker size on record`,
        });
      }
    }
    const tokens = counts.cells
      .filter((c) => c.status !== "blank")
      .flatMap((c) => assetTokens(c.title))
      .map((t) => t.toLowerCase())
      .filter((t) => t.length >= 3);
    if (tokens.length > 0) {
      for (const record of records) {
        if (record.source !== "Cx Constraint Log") continue;
        if (/closed|complete/i.test(record.status ?? "")) continue;
        if (!tokens.some((t) => recordHaystack(record).includes(t))) continue;
        list.push({ severity: "red", text: `Open constraint — ${record.primaryLabel}` });
        if (list.length >= 30) break;
      }
    }
    return list;
  }, [counts, records]);

  function runAudit() {
    const rows: AuditRow[] = [
      { ok: true, text: `${circuits.length} positions scanned across ${counts.rows} rows` },
      {
        ok: true,
        text: `${counts.energized.length} energized · ${counts.future.length} future · ${counts.spares.length} spare · ${counts.blanks.length} blank`,
      },
    ];
    const multiPole = counts.cells.filter((c) => c.poles.length > 1);
    if (multiPole.length > 0) {
      rows.push({
        ok: true,
        text: `${multiPole.length} multi-pole feed${multiPole.length === 1 ? "" : "s"}: ${multiPole
          .map((c) => `${c.title} (CKT ${c.poles.join("/")})`)
          .join(", ")}`,
      });
    }
    const seen = new Map<string, number[][]>();
    for (const cell of counts.cells) {
      if (cell.status === "blank" || cell.status === "spare") continue;
      const key = cell.title.toLowerCase();
      seen.set(key, [...(seen.get(key) ?? []), cell.poles]);
    }
    for (const [title, poleGroups] of seen) {
      if (poleGroups.length > 1) {
        rows.push({
          ok: false,
          text: `"${title}" appears on ${poleGroups.length} separate cells (CKT ${poleGroups
            .map((p) => p.join("/"))
            .join(" and CKT ")}) — verify this is intentional`,
        });
      }
    }
    for (const cell of counts.energized) {
      if (!cell.breaker) {
        rows.push({ ok: false, text: `CKT ${cell.poles.join("/")} energized without a breaker size` });
      }
    }
    for (const cell of counts.blocked) {
      rows.push({ ok: false, text: `CKT ${cell.poles.join("/")} — ${cell.title} blocked` });
    }
    if (!rows.some((r) => !r.ok)) rows.push({ ok: true, text: "No issues found — schedule is clean" });
    setAudit(rows);
  }

  function exportJson() {
    const payload = {
      panelId,
      meta,
      permitNumber: permitNumber ?? null,
      scheduleName: scheduleName ?? null,
      exportedAt: new Date().toISOString(),
      source: live ? "SharePoint import (live records)" : "mock fixture",
      circuits,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${panelId}-panel-schedule.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(panelId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (permissions/https) — silently skip.
    }
  }

  const q = highlightText?.trim().toLowerCase() ?? "";
  const highlightNum = Number(highlightCircuit);

  function isHighlighted(cell: BoardCell): boolean {
    if (Number.isFinite(highlightNum) && cell.poles.includes(highlightNum)) return true;
    if (q.length >= 2 && cell.status !== "blank" && cell.title.toLowerCase().includes(q)) return true;
    return false;
  }

  function CellButton({ cell }: { cell: BoardCell }) {
    const styles = CELL_STYLES[cell.status];
    const interactive = cell.status !== "blank";
    const sub =
      cell.status === "blank"
        ? null
        : [cell.breaker, BOARD_STATUS_LABELS[cell.status]].filter(Boolean).join(" · ");
    return (
      <button
        onClick={interactive ? () => setSelected(cell) : undefined}
        disabled={!interactive}
        title={interactive ? `CKT ${cell.poles.join("/")} — open all app data` : undefined}
        className={cn(
          "grid w-full grid-cols-[2.75rem,1fr] items-stretch overflow-hidden rounded-md border text-left transition-all",
          styles.cell,
          interactive && "cursor-pointer hover:border-cyan/50 hover:brightness-110",
          isHighlighted(cell) && "ring-2 ring-cyan"
        )}
        style={{ minHeight: `${cell.poles.length * 3 + (cell.poles.length - 1) * 0.25}rem` }}
      >
        <span className="flex flex-col items-center justify-around border-r border-white/5 bg-black/25 py-1">
          {cell.poles.map((pole) => (
            <span key={pole} id={`ckt-${pole}`} className="font-mono text-xs text-ink-dim">
              {pole}
            </span>
          ))}
        </span>
        <span className="flex flex-col justify-center px-3 py-1.5">
          <span
            className={cn(
              "break-all text-xs font-medium leading-snug",
              cell.status === "blank" ? "text-ink-dim2" : "text-ink"
            )}
          >
            {cell.title}
          </span>
          {sub && <span className={cn("mt-0.5 text-[10px]", styles.sub)}>{sub}</span>}
        </span>
      </button>
    );
  }

  function ListRow({ cell }: { cell: BoardCell }) {
    const styles = CELL_STYLES[cell.status];
    const interactive = cell.status !== "blank";
    return (
      <button
        onClick={interactive ? () => setSelected(cell) : undefined}
        disabled={!interactive}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-all",
          styles.cell,
          interactive && "cursor-pointer hover:border-cyan/50 hover:brightness-110",
          isHighlighted(cell) && "ring-2 ring-cyan"
        )}
      >
        <span className="w-14 shrink-0 font-mono text-xs text-ink-dim">{cell.poles.join("/")}</span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-xs font-medium",
            cell.status === "blank" ? "text-ink-dim2" : "text-ink"
          )}
        >
          {cell.title}
        </span>
        {cell.breaker && <span className="shrink-0 text-[10px] text-ink-dim">{cell.breaker}</span>}
        <span className={cn("shrink-0 text-[10px]", styles.sub)}>{BOARD_STATUS_LABELS[cell.status]}</span>
      </button>
    );
  }

  const allCellsByCircuit = useMemo(
    () => [...oddCells, ...evenCells].sort((a, b) => (a.poles[0] ?? 0) - (b.poles[0] ?? 0)),
    [oddCells, evenCells]
  );

  const tabCells: Record<string, BoardCell[]> = {
    energized: counts.energized,
    future: counts.future,
    spares: counts.spares,
  };

  function MetaItem({ label, value }: { label: string; value?: string }) {
    return (
      <div className="border-l-2 border-cyan/30 pl-2.5">
        <div className="text-[9px] uppercase tracking-widest text-ink-dim">{label}</div>
        <div className="mt-0.5 truncate text-sm font-semibold text-ink">{value ?? "—"}</div>
      </div>
    );
  }

  const bankHeader = (
    <div className="grid grid-cols-[2.75rem,1fr] overflow-hidden rounded-md border border-cyan/25 bg-cyan-soft">
      <span className="border-r border-cyan/20 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-cyan">
        Ckt #
      </span>
      <span className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-cyan">
        Title / Load
      </span>
    </div>
  );

  return (
    <div className={className}>
      {/* ————— Header: panel identity + action chips ————— */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-dim">Panel</div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{meta.shortName}</h2>
              <button
                onClick={() => void copyId()}
                title={`Copy ${panelId}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-glass hover:text-ink"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                  live ? "border-emerald/40 text-emerald" : "border-gold/40 text-gold"
                )}
              >
                {live ? "Live · SharePoint import" : "Demo · mock fixture"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) {
                void importFiles(event.target.files);
                event.target.value = "";
              }
            }}
          />
          <ActionChip
            onClick={() => setAlertsOpen((open) => !open)}
            active={alertsOpen}
            icon={<Bell className="h-3.5 w-3.5" />}
            label="Alerts"
            badge={alerts.length > 0 ? alerts.length : undefined}
          />
          <ActionChip
            onClick={() => importRef.current?.click()}
            icon={
              importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />
            }
            label="Import"
          />
          <ActionChip onClick={exportJson} icon={<Download className="h-3.5 w-3.5" />} label="Export" />
          <ActionChip
            onClick={runAudit}
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Run Audit"
          />
        </div>
      </div>

      {/* ————— Metadata strip ————— */}
      <GlassPanel className="mt-4 p-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-8">
          <MetaItem label="Substation" value={meta.substation} />
          <MetaItem label="Location" value={meta.location} />
          <MetaItem
            label="Panel Type"
            value={meta.typeCode ? `${meta.typeCode}${meta.typeLabel ? ` · ${meta.typeLabel}` : ""}` : undefined}
          />
          <MetaItem label="Specifier" value={meta.specifier} />
          <MetaItem label="Rows" value={String(counts.rows)} />
          <MetaItem label="Circuits" value={String(counts.activeCircuits)} />
          <MetaItem label="Permit Number" value={permitNumber} />
          <MetaItem label="Fed By" value={fedBy} />
        </div>
      </GlassPanel>

      {/* ————— Alerts / audit result panels ————— */}
      {alertsOpen && (
        <GlassPanel glow={alerts.length > 0 ? "red" : "emerald"} className="mt-3 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
              Alerts on this panel
            </span>
            <button onClick={() => setAlertsOpen(false)} className="text-ink-dim hover:text-ink">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-[11px] text-emerald">No alerts — nothing blocked, no open constraints.</p>
          ) : (
            <ul className="space-y-1">
              {alerts.map((alert, i) => (
                <li
                  key={i}
                  className={cn("text-[11px]", alert.severity === "red" ? "text-red" : "text-gold")}
                >
                  • {alert.text}
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      )}

      {audit && (
        <GlassPanel className="mt-3 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
              Panel audit — {new Date().toISOString().slice(0, 10)}
            </span>
            <button onClick={() => setAudit(null)} className="text-ink-dim hover:text-ink">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-1">
            {audit.map((row, i) => (
              <li key={i} className={cn("text-[11px]", row.ok ? "text-ink-dim" : "text-gold")}>
                {row.ok ? "✓" : "⚠"} {row.text}
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}

      {/* ————— Tabs + view toggle ————— */}
      <Tabs
        className="mt-5"
        activeId={tab}
        onChange={setTab}
        tabs={[
          { id: "energized", label: "Energized Circuits", count: counts.energized.length },
          { id: "future", label: "Future Energizations", count: counts.future.length },
          { id: "spares", label: "Spares", count: counts.spares.length },
          { id: "schedule", label: "Panel Schedule" },
        ]}
      />

      {tab === "schedule" && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ViewToggle
              active={view === "panel"}
              onClick={() => setView("panel")}
              icon={<LayoutGrid className="h-3 w-3" />}
              label="Panel View"
            />
            <ViewToggle
              active={view === "list"}
              onClick={() => setView("list")}
              icon={<List className="h-3 w-3" />}
              label="List View"
            />
            {scheduleName && (
              <span className="ml-1 text-[11px] font-medium text-emerald">Schedule: {scheduleName}</span>
            )}
          </div>

          {view === "panel" ? (
            <div className="mt-3 overflow-x-auto">
              <div className="grid min-w-[640px] grid-cols-2 gap-x-5">
                <div className="space-y-1">
                  {bankHeader}
                  {oddCells.map((cell) => (
                    <CellButton key={cell.poles[0]} cell={cell} />
                  ))}
                </div>
                <div className="space-y-1">
                  {bankHeader}
                  {evenCells.map((cell) => (
                    <CellButton key={cell.poles[0]} cell={cell} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-1">
              {allCellsByCircuit.map((cell) => (
                <ListRow key={cell.poles[0]} cell={cell} />
              ))}
            </div>
          )}
        </>
      )}

      {tab !== "schedule" && (
        <div className="mt-3 space-y-1">
          {(tabCells[tab] ?? []).map((cell) => (
            <ListRow key={cell.poles[0]} cell={cell} />
          ))}
          {(tabCells[tab] ?? []).length === 0 && (
            <p className="rounded-md border border-glass-border bg-glass p-4 text-center text-[11px] text-ink-dim">
              {tab === "energized" && "No energized circuits recorded on this panel yet."}
              {tab === "future" && "No future energizations recorded on this panel."}
              {tab === "spares" && "No spare circuits recorded on this panel."}
            </p>
          )}
        </div>
      )}

      <CircuitDrawer panelId={meta.shortName} cell={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ActionChip({
  onClick,
  icon,
  label,
  badge,
  active,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-medium transition-colors",
        active
          ? "border-cyan/40 bg-cyan-soft text-cyan"
          : "border-glass-border-hi bg-glass text-ink-dim hover:border-cyan/40 hover:text-ink"
      )}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 font-mono text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-medium transition-colors",
        active
          ? "border-cyan/50 bg-cyan-soft text-cyan"
          : "border-glass-border bg-glass text-ink-dim hover:text-ink"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
