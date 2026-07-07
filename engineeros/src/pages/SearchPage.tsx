import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Boxes,
  CalendarDays,
  FileText,
  GraduationCap,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Search
} from "lucide-react";
import { useData } from "../state/DataProvider";
import { globalSearch } from "../lib/search";
import { EmptyState, GlassPanel, Input, SectionHeading } from "../components/ui/primitives";
import type { SearchResultType } from "../types";

const TYPE_META: Record<SearchResultType, { label: string; icon: typeof Search; color: string }> = {
  task: { label: "Tasks", icon: ListChecks, color: "text-cyan" },
  meeting: { label: "Meetings", icon: CalendarDays, color: "text-emerald" },
  project: { label: "Projects", icon: Boxes, color: "text-purple" },
  idea: { label: "Ideas", icon: Lightbulb, color: "text-gold" },
  note: { label: "Knowledge", icon: BookOpen, color: "text-cyan" },
  document: { label: "Documents", icon: FileText, color: "text-purple" },
  learning: { label: "Learning", icon: GraduationCap, color: "text-emerald" },
  journal: { label: "Journal", icon: NotebookPen, color: "text-amber" }
};

const TYPE_ORDER: SearchResultType[] = [
  "task",
  "meeting",
  "project",
  "note",
  "idea",
  "document",
  "learning",
  "journal"
];

export default function SearchPage() {
  const { db, version } = useData();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";

  const results = useMemo(
    () => globalSearch(db, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version, query]
  );

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: results.filter((r) => r.type === type)
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Search</h1>
        <p className="mt-0.5 text-sm text-ink-dim">
          One query across tasks, meetings, projects, notes, ideas, documents, learning
          and journal entries.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim2" />
        <Input
          autoFocus
          className="rounded-full py-2.5 pl-11"
          placeholder="Type at least two characters…"
          value={query}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
        />
      </div>

      {query.trim().length < 2 ? (
        <EmptyState message="Start typing to search everything." />
      ) : grouped.length === 0 ? (
        <EmptyState message={`No results for "${query}".`} hint="Try a shorter or different term." />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ type, items }) => {
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            return (
              <div key={type}>
                <SectionHeading title={`${meta.label} (${items.length})`} />
                <div className="space-y-2">
                  {items.map((r) => (
                    <Link key={`${r.type}-${r.id}`} to={r.route}>
                      <GlassPanel className="mb-2 p-3.5 transition-colors hover:border-cyan/30">
                        <div className="flex items-start gap-3">
                          <Icon size={15} className={`mt-0.5 shrink-0 ${meta.color}`} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {r.title}
                              {r.date && (
                                <span className="ml-2 text-[11px] font-normal text-ink-dim2">
                                  {r.date.slice(0, 10)}
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-ink-dim">{r.snippet}</p>
                          </div>
                        </div>
                      </GlassPanel>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
