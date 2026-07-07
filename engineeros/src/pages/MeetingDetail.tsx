import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";
import { useData } from "../state/DataProvider";
import { meetings, projects, tasks } from "../db/repo";
import {
  Button,
  EmptyState,
  Field,
  GlassPanel,
  Input,
  SectionHeading,
  Select,
  TextArea
} from "../components/ui/primitives";
import { TaskRow } from "../features/tasks/TaskRow";
import { TaskModal } from "../features/tasks/TaskModal";
import { summarizeMeetingNotes } from "../lib/assist";
import type { Task } from "../types";

/**
 * Meeting workspace: editable details and notes (autosaved on blur), a local
 * AI summary of the typed notes, and action items that are real tasks linked
 * back to the meeting.
 */
export default function MeetingDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { db, version, mutate } = useData();
  const meeting = useMemo(
    () => meetings.get(db, id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version, id]
  );

  const [draft, setDraft] = useState(meeting);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);

  useEffect(() => {
    setDraft(meeting);
  }, [meeting?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!meeting || !draft) {
    return (
      <EmptyState message="Meeting not found." hint="It may have been deleted." />
    );
  }

  const actionItems = tasks.forMeeting(db, meeting.id);
  const projectList = projects.all(db);

  const save = () => {
    if (!draft.title.trim()) return;
    mutate((d) => meetings.update(d, meeting.id, draft));
  };

  const generateSummary = () => {
    const digest = summarizeMeetingNotes(draft.notes);
    setDraft((cur) => (cur ? { ...cur, summary: digest.summary } : cur));
    mutate((d) => meetings.update(d, meeting.id, { ...draft, summary: digest.summary }));
    // Offer detected action lines that aren't tasks yet.
    const existing = new Set(actionItems.map((t) => t.title.toLowerCase()));
    setSuggested(digest.actionItems.filter((a) => !existing.has(a.toLowerCase())));
  };

  const acceptSuggestion = (text: string) => {
    mutate((d) =>
      tasks.create(d, {
        title: text,
        meetingId: meeting.id,
        projectId: meeting.projectId,
        category: "Action item"
      })
    );
    setSuggested((s) => s.filter((x) => x !== text));
  };

  const removeMeeting = () => {
    if (!window.confirm("Delete this meeting? Its action items become unlinked tasks.")) return;
    mutate((d) => meetings.remove(d, meeting.id));
    navigate("/meetings");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/meetings" className="flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink">
          <ArrowLeft size={14} /> Meetings
        </Link>
        <Button variant="danger" onClick={removeMeeting}>
          <Trash2 size={13} /> Delete
        </Button>
      </div>

      <GlassPanel className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Title" className="sm:col-span-2 lg:col-span-4">
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              onBlur={save}
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              onBlur={save}
            />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              onBlur={save}
            />
          </Field>
          <Field label="Project" className="lg:col-span-2">
            <Select
              value={draft.projectId ?? ""}
              onChange={(e) => {
                const next = { ...draft, projectId: e.target.value || null };
                setDraft(next);
                mutate((d) => meetings.update(d, meeting.id, next));
              }}
            >
              <option value="">— None —</option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Attendees" className="sm:col-span-2 lg:col-span-4">
            <Input
              value={draft.attendees}
              onChange={(e) => setDraft({ ...draft, attendees: e.target.value })}
              onBlur={save}
              placeholder="Comma-separated names"
            />
          </Field>
        </div>
      </GlassPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassPanel className="p-5">
          <SectionHeading title="Notes" />
          <TextArea
            rows={14}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            onBlur={save}
            placeholder={
              "Type meeting notes here…\n\nLines containing words like 'action', 'follow up' or 'need to' are detected as action items when you generate a summary."
            }
          />
        </GlassPanel>

        <div className="space-y-5">
          <GlassPanel className="p-5" glow>
            <SectionHeading
              title="Summary"
              action={
                <Button variant="primary" onClick={generateSummary} disabled={!draft.notes.trim()}>
                  <Sparkles size={13} /> Generate from notes
                </Button>
              }
            />
            {draft.summary ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-dim">
                {draft.summary}
              </pre>
            ) : (
              <p className="text-sm text-ink-dim2">
                No summary yet. Type notes, then generate — runs fully on-device.
              </p>
            )}
            {suggested.length > 0 && (
              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <p className="mb-2 text-xs font-medium text-amber">
                  Detected action items — add as tasks:
                </p>
                <div className="space-y-1.5">
                  {suggested.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => acceptSuggestion(sug)}
                      className="flex w-full items-center gap-2 rounded-md border border-white/10 px-2.5 py-1.5 text-left text-xs text-ink-dim hover:border-amber/40 hover:text-ink"
                    >
                      <Plus size={12} className="shrink-0 text-amber" />
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <SectionHeading
              title={`Action items (${actionItems.length})`}
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus size={13} /> Add
                </Button>
              }
            />
            {actionItems.length === 0 ? (
              <p className="text-sm text-ink-dim2">No action items yet.</p>
            ) : (
              <div className="space-y-0.5">
                {actionItems.map((t) => (
                  <TaskRow key={t.id} task={t} onEdit={setEditing} />
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </div>

      <TaskModal
        open={creating}
        onClose={() => setCreating(false)}
        defaults={{ meetingId: meeting.id, projectId: meeting.projectId, category: "Action item" }}
      />
      <TaskModal open={editing != null} onClose={() => setEditing(null)} task={editing} />
    </div>
  );
}
