import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, Plus } from "lucide-react";
import { useData } from "../state/DataProvider";
import { ideas, notes, projects, tasks } from "../db/repo";
import {
  Button,
  Field,
  GlassPanel,
  Input,
  Modal,
  ProgressBar,
  TextArea
} from "../components/ui/primitives";
import { cn } from "../lib/cn";

export default function Projects() {
  const { db, version, mutate } = useData();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", goals: "" });

  const list = useMemo(() => {
    const allTasks = tasks.all(db);
    const allNotes = notes.all(db);
    const allIdeas = ideas.all(db);
    return projects.all(db).map((p) => {
      const pt = allTasks.filter((t) => t.projectId === p.id);
      const done = pt.filter((t) => t.status === "done").length;
      return {
        project: p,
        taskCount: pt.length,
        doneCount: done,
        progress: pt.length ? Math.round((done / pt.length) * 100) : 0,
        noteCount: allNotes.filter((n) => n.projectId === p.id).length,
        ideaCount: allIdeas.filter((i) => i.projectId === p.id).length
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version]);

  const create = () => {
    if (!form.name.trim()) return;
    mutate((d) => projects.create(d, form));
    setForm({ name: "", description: "", goals: "" });
    setCreating(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Projects</h1>
          <p className="mt-0.5 text-sm text-ink-dim">
            Each project collects its tasks, notes, ideas and files.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> New project
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map(({ project, taskCount, doneCount, progress, noteCount, ideaCount }) => (
          <Link key={project.id} to={`/projects/${project.id}`}>
            <GlassPanel className="h-full p-5 transition-colors hover:border-cyan/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10 text-cyan">
                    <Boxes size={15} />
                  </span>
                  <p className="text-sm font-semibold text-ink">{project.name}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    project.status === "active" && "border-emerald/30 bg-emerald/10 text-emerald",
                    project.status === "paused" && "border-gold/30 bg-gold/10 text-gold",
                    project.status === "done" && "border-white/10 bg-white/5 text-ink-dim"
                  )}
                >
                  {project.status}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-dim">
                {project.description || "No description yet."}
              </p>
              <div className="mt-4">
                <ProgressBar value={progress} />
                <p className="mt-2 text-[11px] text-ink-dim2">
                  {doneCount}/{taskCount} tasks · {noteCount} notes · {ideaCount} ideas
                </p>
              </div>
            </GlassPanel>
          </Link>
        ))}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New project">
        <div className="space-y-4">
          <Field label="Name">
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </Field>
          <Field label="Goals">
            <TextArea
              value={form.goals}
              onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
              rows={2}
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setCreating(false)}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={!form.name.trim()}>
            Create project
          </Button>
        </div>
      </Modal>
    </div>
  );
}
