import Link from "next/link";
import type { CircuitStatus, PanelScheduleData, WorkflowStatus } from "@/types/domain";
import { StatusPill } from "./StatusPill";
import { cn } from "@/utils/cn";

// The one canonical panel schedule table. Every screen that needs to show a
// panel's circuits (Asset Detail, Panel views, Homepage widgets) renders this
// component instead of hand-rolling its own table.
const STATUS_CONFIG: Record<CircuitStatus, { label: string; dot: string; text: string }> = {
  energized: { label: "Energized", dot: "bg-emerald", text: "text-emerald" },
  "de-energized": { label: "De-energized", dot: "bg-gold", text: "text-gold" },
  blocked: { label: "Blocked", dot: "bg-red", text: "text-red" },
  spare: { label: "Spare", dot: "bg-ink-dim2", text: "text-ink-dim" },
};

export interface LinkedAsset {
  id: string;
  name: string;
  status: WorkflowStatus;
}

export interface PanelScheduleProps {
  schedule: PanelScheduleData;
  highlightCircuit?: string;
  /** Circuit number -> the CommissionOS asset fed from it, if known. */
  linkedAssets?: Record<string, LinkedAsset>;
  className?: string;
}

export function PanelSchedule({ schedule, highlightCircuit, linkedAssets, className }: PanelScheduleProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-cyan/20 bg-gradient-to-br from-cyan-soft to-glass shadow-glass",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-glass-border px-4 py-3">
        <span className="text-sm font-semibold text-ink">{schedule.panelName}</span>
        <span className="text-[10px] uppercase tracking-widest text-ink-dim">{schedule.panelId}</span>
      </div>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-ink-dim">
            <th className="px-4 py-2 font-medium">Ckt</th>
            <th className="px-4 py-2 font-medium">Description</th>
            <th className="px-4 py-2 font-medium">Load</th>
            <th className="px-4 py-2 font-medium">CommissionOS Asset</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {schedule.circuits.map((row) => {
            const config = STATUS_CONFIG[row.status];
            const isHighlighted = row.circuit === highlightCircuit;
            const linkedAsset = linkedAssets?.[row.circuit];
            return (
              <tr
                key={row.circuit}
                id={`ckt-${row.circuit}`}
                className={cn("border-t border-glass-border transition-colors", isHighlighted && "bg-cyan-soft")}
              >
                <td className="px-4 py-2 font-mono text-xs text-ink">{row.circuit}</td>
                <td className="px-4 py-2 text-ink">{row.description}</td>
                <td className="px-4 py-2 text-ink-dim">{row.load}</td>
                <td className="px-4 py-2">
                  {linkedAsset ? (
                    <Link href={`/assets/${linkedAsset.id}`} className="text-xs font-medium text-cyan hover:underline">
                      {linkedAsset.name}
                    </Link>
                  ) : (
                    <span className="text-xs text-ink-dim">—</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {linkedAsset ? (
                    <StatusPill status={linkedAsset.status} pulse={linkedAsset.status === "blocked"} />
                  ) : (
                    <span className={cn("inline-flex items-center gap-1.5 text-xs", config.text)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                      {config.label}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
