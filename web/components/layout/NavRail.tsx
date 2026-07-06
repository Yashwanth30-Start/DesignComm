"use client";

import { Home, Search, Layers, Workflow, Settings } from "lucide-react";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { icon: Home, label: "Home" },
  { icon: Search, label: "Search" },
  { icon: Layers, label: "Assets" },
  { icon: Workflow, label: "Workflow" },
  { icon: Settings, label: "Settings" },
] as const;

export function NavRail({ activeLabel = "Assets" }: { activeLabel?: string }) {
  return (
    <nav className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center gap-1 border-r border-glass-border bg-void/60 py-5 backdrop-blur-xs md:flex">
      <div className="mb-4 h-7 w-7 rounded-md bg-gradient-to-br from-cyan via-purple to-emerald shadow-glow-cyan" />
      {NAV_ITEMS.map(({ icon: Icon, label }) => (
        <div
          key={label}
          title={label}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
            label === activeLabel ? "bg-glass-hi text-cyan" : "text-ink-dim hover:bg-glass hover:text-ink"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.7} />
        </div>
      ))}
    </nav>
  );
}
