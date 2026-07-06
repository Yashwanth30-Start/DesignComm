import type { WorkflowStatus } from "@/types/domain";
import { cn } from "@/utils/cn";

const STATUS_CONFIG: Record<WorkflowStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  ready: { label: "Ready", dot: "bg-emerald", text: "text-emerald", bg: "bg-emerald-soft", border: "border-emerald/30" },
  waiting: { label: "Waiting", dot: "bg-gold", text: "text-gold", bg: "bg-gold-soft", border: "border-gold/30" },
  blocked: { label: "Blocked", dot: "bg-red", text: "text-red", bg: "bg-red-soft", border: "border-red/30" },
  commissioned: { label: "Commissioned", dot: "bg-cyan", text: "text-cyan", bg: "bg-cyan-soft", border: "border-cyan/30" },
  complete: { label: "Complete", dot: "bg-status-complete", text: "text-status-complete", bg: "bg-white/10", border: "border-white/20" },
};

export interface StatusPillProps {
  status: WorkflowStatus;
  className?: string;
  pulse?: boolean;
}

export function StatusPill({ status, className, pulse = false }: StatusPillProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot, pulse && "animate-pulse")} />
      {config.label}
    </span>
  );
}
