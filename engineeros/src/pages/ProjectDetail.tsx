import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Lightbulb, Plus, Trash2 } from "lucide-react";
import { useData } from "../state/DataProvider";
import { documents, ideas, notes, projects, tasks } from "../db/repo";
import {
  Button,
  EmptyState,
  Field,
  GlassPanel,
  ProgressBar,
  SectionHeading,
  Select,
  TextArea
} from "../components/ui/primitives";
import { TaskRow } from "../features/tasks/TaskRow";
import { TaskModal } from "../features/tasks/TaskModal";
import { relativeTime } from "../lib/dates";
import { cn } from "../lib/cn";
import type { Task } from "../types";

type Tab = "overview" | "tasks" | "notes" | "ideas" | "files";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "ideas", label: "Ideas" },
  { id: "files", label: "Files" }
];

export default function ProjectDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { db, version, mutate } = useData();
  const [tab, setTab] = useState<Tab>("overview");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);

  const project = useMemo(
    () => projects.get(db, id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version, id]
  );
  const [draft, setDraft] = useState(project);
  useEffect(() => {
    setDraft(project);
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const related = useMemo(() => {
    if (!project) return null;
    const pt = tasks.forProject(db, project.id);
    const done = pt.filter((t) => t.status === "done").length;
    return {
      tasks: pt,
      progress: pt.length ? Math.round((done / pt.length) * 100) : 0,
      doneCount: done,
      notes: notes.all(db).filter((n) => n.projectId === project.id),
      ideas: ideas.all(db).filter((i) => i.projectId === project.id),
      docs: documents.all(db).filter((doc) => doc.projectId === project.id)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, project?.id]);

  if (!project || !draft || !related) {
    return <EmptyState message="Project not found." hint="It may have been deleted." />;
  }

  const save = () => {
    if (!draft.name.trim()) return;
    mutate((d) => projects.update(d, project.id, draft));
  };

  const removeProject = () => {
    if (
      !window.confirm(
        "Delete this project? Its tasks, notes and ideas are kept but unlinked."
      )
    )
      return;
    mutate((d) => projects.remove(d, project.id));
    navigate("/projects");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/projects" className="flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink">
          <ArrowLeft size={14} /> Projects
        </Link>
        {!project.isDefault && (
          <Button variant="danger" onClick={removeProject}>
            <Trash2 size={13} /> Delete
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-ink">{project.name}</h1>
        <div className="mt-3 max-w-md">
          <ProgressBar value={related.progress} />
          <p className="mt-1.5 text-xs text-ink-dim2">
            {related.doneCount}/{related.tasks.length} tasks complete
          </p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors",
              tab === t.id
                ? "border-cyan text-cyan"
                : "border-transparent text-ink-dim hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <GlassPanel className="p-5">
          <div className="space-y-4">
            <Field label="Description">
              <TextArea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                onBlur={save}
              />
            </Field>
            <Field label="Goals">
              <TextArea
                rows={3}
                value={draft.goals}
                onChange={(e) => setDraft({ ...draft, goals: e.target.value })}
                onBlur={save}
              />
            </Field>
            <Field label="Status" className="max-w-xs">
              <Select
                value={draft.status}
                onChange={(e) => {
                  const next = { ...draft, status: e.target.value as typeof draft.status };
                  setDraft(next);
                  mutate((d) => projects.update(d, project.id, next));
                }}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="done">Done</option>
              </Select>
            </Field>
          </div>
        </GlassPanel>
      )}

      {tab === "tasks" && (
        <GlassPanel className="p-4">
          <SectionHeading
            title={`Tasks (${related.tasks.length})`}
            action={
              <Button variant="primary" onClick={() => setCreatingTask(true)}>
                <Plus size={13} /> Add task
              </Button>
            }
          />
          {related.tasks.length === 0 ? (
            <EmptyState message="No tasks in this project yet." />
          ) : (
            <div className="space-y-0.5">
              {related.tasks.map((t) => (
                <TaskRow key={t.id} task={t} onEdit={setEditingTask} showProject={false} />
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      {tab === "notes" && (
        <GlassPanel className="p-4">
          <SectionHeading
            title={`Notes (${related.notes.length})`}
            action={
              <Link to={`/knowledge?new=1&project=${project.id}`}>
                <Button variant="primary">
                  <Plus size={13} /> New note
                </Button>
              </Link>
            }
          />
          {related.notes.length === 0 ? (
            <EmptyState message="No notes linked to this project." />
          ) : (
            <div className="space-y-1.5">
              {related.notes.map((nte) => (
                <Link
                  key={nte.id}
                  to={`/knowledge?note=${nte.id}`}
                  className="block rounded-lg border border-white/[0.06] px-3 py-2 hover:border-cyan/30"
                >
                  <p className="text-sm text-ink">{nte.title}</p>
                  <p className="text-[11px] text-ink-dim2">
                    {nte.category} · {relativeTime(nte.updatedAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      {tab === "ideas" && (
        <GlassPanel className="p-4">
          <SectionHeading title={`Ideas (${related.ideas.length})`} />
          {related.ideas.length === 0 ? (
            <EmptyState
              message="No ideas linked to this project."
              hint="Capture one on the Ideas page and set its project."
            />
          ) : (
            <div className="space-y-1.5">
              {related.ideas.map((i) => (
                <Link
                  key={i.id}
                  to="/ideas"
                  className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] px-3 py-2 hover:border-gold/30"
                >
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-gold" />
                  <div>
                    <p className="text-sm text-ink">{i.title}</p>
                    {i.description && (
                      <p className="line-clamp-1 text-[11px] text-ink-dim2">{i.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      {tab === "files" && (
        <GlassPanel className="p-4">
          <SectionHeading title={`Files (${related.docs.length})`} />
          {related.docs.length === 0 ? (
            <EmptyState
              message="No documents assigned to this project."
              hint="Index files on the Documents page, then assign them to a project."
            />
          ) : (
            <div className="space-y-1.5">
              {related.docs.map((doc) => (
                <Link
                  key={doc.id}
                  to="/documents"
                  className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] px-3 py-2 hover:border-purple/30"
                >
                  <FileText size={14} className="shrink-0 text-purple" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{doc.name}</p>
                    <p className="truncate text-[11px] text-ink-dim2">
                      {doc.path} · rev {doc.revision}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      <TaskModal
        open={creatingTask}
        onClose={() => setCreatingTask(false)}
        defaults={{ projectId: project.id }}
      />
      <TaskModal open={editingTask != null} onClose={() => setEditingTask(null)} task={editingTask} />
    </div>
  );
}
