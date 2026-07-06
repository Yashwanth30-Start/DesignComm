import type { ReactNode } from "react";
import { GlobalSearch } from "@/features/search/GlobalSearch";
import { BackButton } from "./BackButton";

export function Topbar({ breadcrumb }: { breadcrumb?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-glass-border bg-void/40 px-6 py-3.5 backdrop-blur-xs md:pl-[88px]">
      <BackButton />
      <div className="text-sm font-semibold tracking-tight text-ink">
        Commission<span className="text-cyan">OS</span>
      </div>
      {breadcrumb && <div className="text-xs text-ink-dim">{breadcrumb}</div>}
      <GlobalSearch />
    </header>
  );
}
