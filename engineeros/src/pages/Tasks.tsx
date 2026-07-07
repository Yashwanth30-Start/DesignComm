import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useData } from "../state/DataProvider";
import { projects, tasks } from "../db/repo";
import {
  Button,
  EmptyState,
  GlassPanel,
  Input,
  Select
} from "../components/ui/primitives";
import { TaskRow } from "../features/tasks/TaskRow";
import { TaskModal } from "../features/tasks/TaskModal";
import type { Task } from "../types";

export default function Tasks() {
  const { db, version } = useData();
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [category, setCategory] = useState("all");

  const projectList = useMemo(
    () => projects.all(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version]
  );

  const { filtered, categories, doneCount, openCount } = useMemo(() => {
    const all = tasks.all(db);
    const cats = Array.from(new Set(all.map((t) => t.category).filter(Boolean))).sort();
    const q = query.trim().toLowerCase();
    const list = all.filter((t) => {
      if (status === "open" && t.status === "done") return false;
      if (status !== "all" && status !== "open" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (projectId !== "all" && (t.projectId ?? "") !== projectId) return false;
      if (category !== "all" && t.category !== category) return false;
      if (
        q &&
        !`${t.title} ${t.description} ${t.notes} ${t.category}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    return {
      filtered: list,
      categories: cats,
      doneCount: all.filter((t) => t.status === "done").length,
      openCount: all.filter((t) => t.status !== "done").length
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, query, status, priority, projectId, category]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Tasks</h1>
          <p className="mt-0.5 text-sm text-ink-dim">
            {openCount} open · {doneCount} done
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> New task
        </Button>
      </div>

      <GlassPanel className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim2" />
            <Input
              className="pl-8"
              placeholder="Filter tasks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">All open</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
            <option value="all">Everything</option>
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">Any priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="all">Any project</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Any category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </GlassPanel>

      <GlassPanel className="p-3">
        {filtered.length === 0 ? (
          <EmptyState
            message="No tasks match these filters."
            hint="Adjust the filters or create a new task."
          />
        ) : (
          <div className="space-y-0.5">
            {filtered.map((t) => (
              <TaskRow key={t.id} task={t} onEdit={setEditing} />
            ))}
          </div>
        )}
      </GlassPanel>

      <TaskModal open={creating} onClose={() => setCreating(false)} />
      <TaskModal open={editing != null} onClose={() => setEditing(null)} task={editing} />
    </div>
  );
}
