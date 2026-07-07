import { ClipboardCheck, CircleCheck, CircleAlert, CircleDashed } from "lucide-react";
import { GlassPanel, ProgressBar } from "@/components/ui";
import { cn } from "@/utils/cn";

// Dedicated Facility Grid representation — never an embedded webpage.
// V1 renders from asset mock/export data; future versions sync through the
// existing Tampermonkey automation or the FacilityGrid API.
export type FacilityGridItemState = "complete" | "pending" | "missing";

export interface FacilityGridItem {
  label: string;
  state: FacilityGridItemState;
}

export interface FacilityGridCardProps {
  statusText: string; // e.g. "Checklist 3/5 complete"
  items?: FacilityGridItem[];
  latestComment?: string;
  className?: string;
}

function parseChecklist(statusText: string): { done: number; total: number } {
  const m = statusText.match(/(\d+)\s*\/\s*(\d+)/);
  const done = m ? Number(m[1]) : 0;
  const total = m ? Number(m[2]) : 0;
  return { done, total: total > 0 ? total : Math.max(done, 1) };
}

const STATE_STYLE: Record<FacilityGridItemState, { icon: typeof CircleCheck; text: string; label: string }> = {
  complete: { icon: CircleCheck, text: "text-emerald", label: "Complete" },
  pending: { icon: CircleDashed, text: "text-gold", label: "Pending" },
  missing: { icon: CircleAlert, text: "text-red", label: "Missing" },
};

export function FacilityGridCard({ statusText, items, latestComment, className }: FacilityGridCardProps) {
  const { done, total } = parseChecklist(statusText);
  const pct = Math.round((done / total) * 100);
  const remaining = Math.max(0, total - done);
  const rows: FacilityGridItem[] =
    items ??
    (pct >= 100
      ? [
          { label: "ROC", state: "complete" },
          { label: "STS", state: "complete" },
          { label: "FTE", state: "complete" },
        ]
      : [
          { label: "ROC", state: "complete" },
          { label: "STS", state: "pending" },
          { label: "FTE", state: "missing" },
        ]);

  return (
    <GlassPanel glow={pct >= 100 ? "emerald" : "none"} className={cn("p-5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink-dim">
          <ClipboardCheck className="h-3.5 w-3.5 text-cyan" />
          Facility Grid
        </div>
        <span className={cn("text-sm font-semibold", pct >= 100 ? "text-emerald" : "text-ink")}>{pct}%</span>
      </div>

      <ProgressBar value={pct} accent={pct >= 100 ? "emerald" : "cyan"} className="mt-3" />
      <div className="mt-2 flex items-baseline justify-between text-[11px] text-ink-dim">
        <span>Checklist {done}/{total}</span>
        <span>{remaining === 0 ? "No questions remaining" : `${remaining} question${remaining === 1 ? "" : "s"} remaining`}</span>
      </div>

      <div className="mt-4 space-y-1.5">
        {rows.map((item) => {
          const style = STATE_STYLE[item.state];
          const Icon = style.icon;
          return (
            <div key={item.label} className="flex items-center justify-between rounded-md border border-glass-border bg-glass px-3 py-1.5">
              <span className="text-xs font-medium text-ink">{item.label}</span>
              <span className={cn("flex items-center gap-1.5 text-[11px]", style.text)}>
                <Icon className="h-3.5 w-3.5" />
                {style.label}
              </span>
            </div>
          );
        })}
      </div>

      {latestComment && (
        <p className="mt-3 border-t border-glass-border pt-3 text-[11px] leading-relaxed text-ink-dim">
          “{latestComment}”
        </p>
      )}

      <p className="mt-3 text-[10px] uppercase tracking-wider text-ink-dim2">
        Synced from FG exports · live sync in Phase 2
      </p>
    </GlassPanel>
  );
}
