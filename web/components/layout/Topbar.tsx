import { Search } from "lucide-react";
import type { ReactNode } from "react";

export function Topbar({ breadcrumb }: { breadcrumb?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-glass-border bg-void/40 px-6 py-3.5 backdrop-blur-xs md:pl-[88px]">
      <div className="text-sm font-semibold tracking-tight text-ink">
        Commission<span className="text-cyan">OS</span>
      </div>
      {breadcrumb && <div className="text-xs text-ink-dim">{breadcrumb}</div>}
      <div className="ml-auto flex w-full max-w-sm items-center gap-2 rounded-md border border-glass-border-hi bg-glass px-3 py-1.5 text-xs text-ink-dim">
        <Search className="h-3.5 w-3.5" strokeWidth={1.8} />
        <span>Search assets, panels, circuits, RFIs…</span>
      </div>
    </header>
  );
}
