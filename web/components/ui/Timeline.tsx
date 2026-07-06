import { Check, AlertTriangle } from "lucide-react";
import type { TimelineStage } from "@/types/domain";
import { cn } from "@/utils/cn";

export interface TimelineProps {
  stages: TimelineStage[];
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const nodeStyles: Record<TimelineStage["status"], string> = {
  done: "bg-emerald border-emerald text-void",
  active: "bg-cyan border-cyan text-void shadow-glow-cyan animate-pulse",
  upcoming: "bg-transparent border-glass-border-hi text-ink-dim",
  blocked: "bg-red border-red text-void",
};

const connectorStyles: Record<TimelineStage["status"], string> = {
  done: "bg-emerald/50",
  active: "bg-gradient-to-r from-emerald/50 to-glass-border-hi",
  upcoming: "bg-glass-border-hi",
  blocked: "bg-red/50",
};

export function Timeline({ stages, orientation = "horizontal", className }: TimelineProps) {
  const isHorizontal = orientation === "horizontal";
  return (
    <div className={cn("flex", isHorizontal ? "flex-row items-start" : "flex-col", className)}>
      {stages.map((stage, i) => (
        <div
          key={stage.label}
          className={cn("flex flex-1", isHorizontal ? "flex-col items-center" : "flex-row items-start gap-4")}
        >
          <div className={cn("flex items-center", isHorizontal ? "w-full" : "flex-col")}>
            {i > 0 && (
              <div
                className={cn(
                  isHorizontal ? "h-px flex-1" : "w-px flex-1 min-h-[24px]",
                  connectorStyles[stages[i - 1]!.status]
                )}
              />
            )}
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                nodeStyles[stage.status]
              )}
            >
              {stage.status === "done" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {stage.status === "blocked" && <AlertTriangle className="h-3.5 w-3.5" strokeWidth={3} />}
            </div>
            {i < stages.length - 1 && (
              <div className={cn(isHorizontal ? "h-px flex-1" : "w-px flex-1 min-h-[24px]", connectorStyles[stage.status])} />
            )}
          </div>
          <div className={cn(isHorizontal ? "mt-2 text-center" : "pb-6")}>
            <div className="text-xs font-medium text-ink">{stage.label}</div>
            {stage.date && <div className="text-[10px] text-ink-dim">{stage.date}</div>}
            {stage.note && <div className="mt-1 text-[10px] text-ink-dim">{stage.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
