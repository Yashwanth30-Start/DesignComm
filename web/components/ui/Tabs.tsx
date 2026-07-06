"use client";

import { cn } from "@/utils/cn";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  tabs,
  activeId,
  onChange,
  className,
}: {
  tabs: TabDef[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto border-b border-glass-border pb-px", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-t-md px-3.5 py-2 text-xs font-medium transition-colors",
              isActive
                ? "border-b-2 border-cyan bg-glass text-ink"
                : "text-ink-dim hover:bg-glass hover:text-ink"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  isActive ? "bg-cyan-soft text-cyan" : "bg-glass-hi text-ink-dim"
                )}
              >
                {tab.count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
