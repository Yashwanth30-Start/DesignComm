import { cn } from "@/utils/cn";

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-glass-border-hi bg-glass px-2 py-0.5 text-[11px] font-medium text-ink-dim",
        className
      )}
    >
      {children}
    </span>
  );
}
