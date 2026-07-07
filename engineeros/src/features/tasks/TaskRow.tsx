import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useData } from "../../state/DataProvider";
import { projects, tasks } from "../../db/repo";
import { PriorityPill, StatusPill } from "../../components/ui/primitives";
import { formatDay, formatMinutes, isOverdue } from "../../lib/dates";
import { cn } from "../../lib/cn";
import type { Task } from "../../types";

/** One task line: complete-toggle, title, badges. Click opens the editor. */
export function TaskRow({
  task,
  onEdit,
  showProject = true
}: {
  task: Task;
  onEdit: (task: Task) => void;
  showProject?: boolean;
}) {
  const { db, mutate } = useData();
  const project = task.projectId ? projects.get(db, task.projectId) : null;
  const done = task.status === "done";
  const overdue = isOverdue(task.dueDate, done);

  const toggle = () =>
    mutate((d) => tasks.update(d, task.id, { status: done ? "todo" : "done" }));

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-white/10 hover:bg-white/[0.03]",
        done && "opacity-50"
      )}
    >
      <button
        onClick={toggle}
        className="shrink-0 text-ink-dim transition-colors hover:text-emerald"
        aria-label={done ? "Mark as not done" : "Mark as done"}
      >
        {done ? <CheckCircle2 size={18} className="text-emerald" /> : <Circle size={18} />}
      </button>
      <button onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left">
        <p className={cn("truncate text-sm text-ink", done && "line-through")}>{task.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-dim2">
          {task.dueDate && (
            <span className={cn(overdue && "font-semibold text-red")}>
              {overdue ? "Overdue · " : ""}
              {formatDay(task.dueDate)}
            </span>
          )}
          {showProject && project && <span>{project.name}</span>}
          {task.category && <span>{task.category}</span>}
          {task.estimatedMinutes != null && (
            <span className="inline-flex items-center gap-0.5">
              <Clock size={10} />
              {formatMinutes(task.estimatedMinutes)}
            </span>
          )}
        </p>
      </button>
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <PriorityPill priority={task.priority} />
        <StatusPill status={task.status} />
      </div>
    </div>
  );
}
