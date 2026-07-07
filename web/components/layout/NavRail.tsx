"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Boxes, Workflow, Settings } from "lucide-react";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: Layers, label: "Assets", href: "/assets" },
  { icon: Boxes, label: "Panels", href: "/panels" },
  { icon: Workflow, label: "Workflow", href: null },
  { icon: Settings, label: "Settings", href: null },
] as const;

export function NavRail() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center gap-1 border-r border-glass-border bg-void/60 py-5 backdrop-blur-xs md:flex">
      <Link href="/" className="mb-4 h-7 w-7 rounded-md bg-gradient-to-br from-cyan via-purple to-emerald shadow-glow-cyan" />
      {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
        const isActive = href ? pathname.startsWith(href) : false;

        if (!href) {
          return (
            <div
              key={label}
              title={`${label} — coming in the next pass`}
              className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-md text-ink-dim/30"
            >
              <Icon className="h-4 w-4" strokeWidth={1.7} />
            </div>
          );
        }

        return (
          <Link
            key={label}
            href={href}
            title={label}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
              isActive ? "bg-glass-hi text-cyan" : "text-ink-dim hover:bg-glass hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.7} />
          </Link>
        );
      })}
    </nav>
  );
}
