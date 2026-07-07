import { useMemo, useState } from "react";
import { Lightbulb, Trash2 } from "lucide-react";
import { useData } from "../state/DataProvider";
import { ideas, projects } from "../db/repo";
import {
  Button,
  EmptyState,
  GlassPanel,
  Input,
  PriorityPill,
  Select,
  Tag,
  TextArea
} from "../components/ui/primitives";
import { relativeTime } from "../lib/dates";
import type { Idea, IdeaStatus, Priority } from "../types";

const STATUS_OPTIONS: { value: IdeaStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "exploring", label: "Exploring" },
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" }
];

/** One-click capture at the top; the grid below keeps every idea alive. */
export default function Ideas() {
  const { db, version, mutate } = useData();
  const [title, setTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useMemo(() => {
    return ideas.all(db).filter((i) => {
      if (statusFilter === "active") return i.status !== "archived" && i.status !== "done";
      if (statusFilter === "all") return true;
      return i.status === statusFilter;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, statusFilter]);

  const projectList = projects.all(db);

  const capture = () => {
    const t = title.trim();
    if (!t) return;
    mutate((d) => ideas.create(d, { title: t }));
    setTitle("");
  };

  const update = (id: string, data: Partial<Idea>) =>
    mutate((d) => ideas.update(d, id, data));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Ideas</h1>
        <p className="mt-0.5 text-sm text-ink-dim">Capture first, evaluate later. Ideas are never lost.</p>
      </div>

      {/* One-click capture */}
      <GlassPanel className="p-4" glow>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Lightbulb size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold" />
            <Input
              className="pl-9"
              placeholder="Capture an idea and press Enter…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && capture()}
            />
          </div>
          <Button variant="primary" onClick={capture} disabled={!title.trim()}>
            Capture
          </Button>
        </div>
      </GlassPanel>

      <div className="max-w-xs">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="active">Active (new / exploring / planned)</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
          <option value="all">Everything</option>
        </Select>
      </div>

      {list.length === 0 ? (
        <EmptyState message="No ideas here." hint="Type one above — it takes two seconds." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((i) => {
            const project = i.projectId ? projects.get(db, i.projectId) : null;
            const isOpen = expanded === i.id;
            return (
              <GlassPanel key={i.id} className="p-4">
                <button
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : i.id)}
                >
                  <p className="text-sm font-medium text-ink">{i.title}</p>
                  <PriorityPill priority={i.priority} />
                </button>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-dim2">
                  <span className="uppercase tracking-wider text-cyan">{i.status}</span>
                  <span>{relativeTime(i.createdAt)}</span>
                  {project && <span>{project.name}</span>}
                  {i.tags &&
                    i.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((t) => <Tag key={t}>{t}</Tag>)}
                </p>
                {!isOpen && i.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-ink-dim">{i.description}</p>
                )}
                {isOpen && (
                  <div className="mt-3 space-y-3 border-t border-white/[0.06] pt-3">
                    <TextArea
                      rows={3}
                      placeholder="Describe the idea…"
                      value={i.description}
                      onChange={(e) => update(i.id, { description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={i.status}
                        onChange={(e) => update(i.id, { status: e.target.value as IdeaStatus })}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </Select>
                      <Select
                        value={i.priority}
                        onChange={(e) => update(i.id, { priority: e.target.value as Priority })}
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </Select>
                      <Select
                        value={i.projectId ?? ""}
                        onChange={(e) => update(i.id, { projectId: e.target.value || null })}
                      >
                        <option value="">— No project —</option>
                        {projectList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </Select>
                      <Input
                        placeholder="tags, comma separated"
                        value={i.tags}
                        onChange={(e) => update(i.id, { tags: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (window.confirm("Delete this idea permanently?")) {
                            mutate((d) => ideas.remove(d, i.id));
                          }
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
