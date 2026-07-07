import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Boxes,
  CalendarDays,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Menu,
  NotebookPen,
  Search,
  Settings,
  Sparkles,
  X,
  Zap
} from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * App chrome: fixed sidebar (spec order) on desktop, slide-over on
 * mobile/iPad portrait, topbar with global search and journal shortcut.
 */

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/meetings", label: "Meetings", icon: CalendarDays },
  { to: "/projects", label: "Projects", icon: Boxes },
  { to: "/knowledge", label: "Knowledge", icon: BookOpen },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/ideas", label: "Ideas", icon: Lightbulb },
  { to: "/learning", label: "Learning", icon: GraduationCap },
  { to: "/review", label: "Weekly Review", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings }
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 text-cyan shadow-glow-sm">
          <Zap size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold tracking-wide text-ink">EngineerOS</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-dim2">v1 · local-first</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border border-cyan/25 bg-cyan/10 text-cyan shadow-glow-sm"
                  : "border border-transparent text-ink-dim hover:bg-white/[0.04] hover:text-ink"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <p className="px-5 pb-4 text-[10px] leading-relaxed text-ink-dim2">
        All data lives on this device.
        <br />
        Works fully offline.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-void text-ink">
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(111,227,242,0.07),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(184,167,255,0.05),transparent_50%)]"
      />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-white/[0.06] bg-bg/70 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile slide-over */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-white/10 bg-bg-2">
            <button
              className="absolute right-3 top-4 rounded-md p-1 text-ink-dim hover:text-ink"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Topbar */}
      <header className="fixed inset-x-0 top-0 z-20 border-b border-white/[0.06] bg-bg/60 backdrop-blur-xl lg:left-60">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button
            className="rounded-md p-1.5 text-ink-dim hover:bg-white/5 hover:text-ink lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim2"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Search everything…"
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink-dim2 focus:border-cyan/40 focus:outline-none focus:ring-1 focus:ring-cyan/30"
            />
          </div>
          <button
            onClick={() => navigate("/journal")}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-ink-dim transition-colors hover:border-gold/40 hover:text-gold"
            title="Daily journal"
          >
            <NotebookPen size={14} />
            <span className="hidden sm:inline">Journal</span>
          </button>
        </div>
      </header>

      <main className="relative px-4 pb-16 pt-20 sm:px-6 lg:ml-60">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
