"use client";

import { GlassPanel } from "@/components/ui";
import { cn } from "@/utils/cn";

export interface LiveCircuit {
  circuit: number;
  breaker?: string;
  downstream?: string;
}

export interface LivePanelScheduleProps {
  panelId: string;
  rating?: string;
  fedFrom?: string;
  circuits: LiveCircuit[];
  highlightText?: string;
}

// Classic two-bank panel schedule: odd circuits (1,3,5…) down the left,
// even circuits (2,4,6…) down the right — built live from imported
// SharePoint panel-circuit records.
export function LivePanelSchedule({ panelId, rating, fedFrom, circuits, highlightText }: LivePanelScheduleProps) {
  const odd = circuits.filter((c) => c.circuit % 2 === 1).sort((a, b) => a.circuit - b.circuit);
  const even = circuits.filter((c) => c.circuit % 2 === 0).sort((a, b) => a.circuit - b.circuit);
  const rowCount = Math.max(odd.length, even.length);
  const q = highlightText?.toLowerCase();

  function isHit(c?: LiveCircuit) {
    if (!c || !q) return false;
    return `${c.downstream ?? ""}`.toLowerCase().includes(q);
  }

  return (
    <GlassPanel glow="cyan" className="overflow-x-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-glass-border px-4 py-3">
        <span className="text-sm font-semibold text-ink">{panelId}</span>
        <span className="text-[11px] text-ink-dim">
          {rating}
          {fedFrom && <span className="ml-3">FED FROM: {fedFrom}</span>}
        </span>
      </div>
      <table className="w-full min-w-[640px] border-collapse text-left text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-ink-dim">
            <th className="w-10 px-3 py-2 font-medium">Ckt</th>
            <th className="w-16 px-3 py-2 font-medium">Bkr</th>
            <th className="px-3 py-2 font-medium">Load</th>
            <th className="px-3 py-2 text-right font-medium">Load</th>
            <th className="w-16 px-3 py-2 text-right font-medium">Bkr</th>
            <th className="w-10 px-3 py-2 text-right font-medium">Ckt</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, i) => {
            const left = odd[i];
            const right = even[i];
            return (
              <tr key={i} className="border-t border-glass-border">
                <td className="px-3 py-1.5 font-mono text-ink">{left?.circuit ?? ""}</td>
                <td className="px-3 py-1.5 text-ink-dim">{left?.breaker ?? ""}</td>
                <td
                  className={cn(
                    "break-all px-3 py-1.5",
                    left?.downstream === "BLANK" || !left?.downstream ? "text-ink-dim2" : "text-ink",
                    isHit(left) && "bg-cyan-soft font-medium text-cyan"
                  )}
                >
                  {left ? (left.downstream ?? "") : ""}
                </td>
                <td
                  className={cn(
                    "break-all px-3 py-1.5 text-right",
                    right?.downstream === "BLANK" || !right?.downstream ? "text-ink-dim2" : "text-ink",
                    isHit(right) && "bg-cyan-soft font-medium text-cyan"
                  )}
                >
                  {right ? (right.downstream ?? "") : ""}
                </td>
                <td className="px-3 py-1.5 text-right text-ink-dim">{right?.breaker ?? ""}</td>
                <td className="px-3 py-1.5 text-right font-mono text-ink">{right?.circuit ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </GlassPanel>
  );
}
