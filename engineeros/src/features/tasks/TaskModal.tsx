import { useEffect, useState } from "react";
import { useData } from "../../state/DataProvider";
import { meetings, projects, tasks, type TaskInput } from "../../db/repo";
import { Button, Field, Input, Modal, Select, TextArea } from "../../components/ui/primitives";
import type { Priority, Task, TaskStatus } from "../../types";

/**
 * Create/edit dialog for tasks. Used by Tasks, Dashboard, Projects and
 * Meetings — pass `defaults` to pre-link the task (e.g. to a meeting).
 */
export function TaskModal({
  open,
  onClose,
  task,
  defaults
}: {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaults?: Partial<TaskInput>;
}) {
  const { db, mutate, settings } = useData();
  const [form, setForm] = useState<TaskInput>({ title: "" });

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({ ...task });
    } else {
      setForm({ title: "", priority: settings.defaultPriority, status: "todo", ...defaults });
    }
    // Re-initialize only when the dialog opens or targets a different task.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  const projectList = projects.all(db);
  const meetingList = meetings.all(db).slice(0, 30);

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    if (!form.title?.trim()) return;
    mutate((d) => {
      if (task) {
        tasks.update(d, task.id, form);
      } else {
        tasks.create(d, form);
      }
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit task" : "New task"} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <Input
            autoFocus
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="What needs to happen?"
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <TextArea
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
          />
        </Field>
        <Field label="Priority">
          <Select
            value={form.priority ?? "medium"}
            onChange={(e) => set("priority", e.target.value as Priority)}
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={form.status ?? "todo"}
            onChange={(e) => set("status", e.target.value as TaskStatus)}
          >
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </Select>
        </Field>
        <Field label="Project">
          <Select
            value={form.projectId ?? ""}
            onChange={(e) => set("projectId", e.target.value || null)}
          >
            <option value="">— None —</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Category">
          <Input
            value={form.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
            placeholder="QC, Commissioning, Electrical…"
          />
        </Field>
        <Field label="Due date">
          <Input
            type="date"
            value={form.dueDate ?? ""}
            onChange={(e) => set("dueDate", e.target.value || null)}
          />
        </Field>
        <Field label="Related meeting">
          <Select
            value={form.meetingId ?? ""}
            onChange={(e) => set("meetingId", e.target.value || null)}
          >
            <option value="">— None —</option>
            {meetingList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.date} · {m.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estimated (minutes)">
          <Input
            type="number"
            min={0}
            value={form.estimatedMinutes ?? ""}
            onChange={(e) =>
              set("estimatedMinutes", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </Field>
        <Field label="Actual (minutes)">
          <Input
            type="number"
            min={0}
            value={form.actualMinutes ?? ""}
            onChange={(e) =>
              set("actualMinutes", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <TextArea
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            placeholder="Context, links, references…"
          />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save} disabled={!form.title?.trim()}>
          {task ? "Save changes" : "Create task"}
        </Button>
      </div>
    </Modal>
  );
}
