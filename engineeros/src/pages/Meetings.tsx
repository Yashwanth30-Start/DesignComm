import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Plus, Search, Users } from "lucide-react";
import { useData } from "../state/DataProvider";
import { meetings, projects, tasks } from "../db/repo";
import {
  Button,
  EmptyState,
  Field,
  GlassPanel,
  Input,
  Modal,
  Select
} from "../components/ui/primitives";
import { formatDay, today } from "../lib/dates";

export default function Meetings() {
  const { db, version, mutate } = useData();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", date: today(), time: "", attendees: "", projectId: "" });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meetings
      .all(db)
      .filter(
        (m) =>
          !q ||
          `${m.title} ${m.attendees} ${m.notes} ${m.summary}`.toLowerCase().includes(q)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, query]);

  const openActionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks.all(db)) {
      if (t.meetingId && t.status !== "done") {
        counts.set(t.meetingId, (counts.get(t.meetingId) ?? 0) + 1);
      }
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version]);

  const projectList = projects.all(db);

  const create = () => {
    if (!form.title.trim() || !form.date) return;
    mutate((d) =>
      meetings.create(d, {
        title: form.title,
        date: form.date,
        time: form.time,
        attendees: form.attendees,
        projectId: form.projectId || null
      })
    );
    setForm({ title: "", date: today(), time: "", attendees: "", projectId: "" });
    setCreating(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Meetings</h1>
          <p className="mt-0.5 text-sm text-ink-dim">
            Notes, summaries and action items — all connected.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> New meeting
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim2" />
        <Input
          className="pl-8"
          placeholder="Search meetings…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState message="No meetings yet." hint="Create one to start capturing notes and action items." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((m) => {
            const openActions = openActionCounts.get(m.id) ?? 0;
            return (
              <Link key={m.id} to={`/meetings/${m.id}`}>
                <GlassPanel className="h-full p-4 transition-colors hover:border-cyan/30">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{m.title}</p>
                    {openActions > 0 && (
                      <span className="shrink-0 rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
                        {openActions} open
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-ink-dim">
                    <CalendarDays size={12} />
                    {formatDay(m.date)}
                    {m.time && ` · ${m.time}`}
                  </p>
                  {m.attendees && (
                    <p className="mt-1 flex items-center gap-2 truncate text-xs text-ink-dim2">
                      <Users size={12} className="shrink-0" />
                      {m.attendees}
                    </p>
                  )}
                </GlassPanel>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New meeting">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="OAC coordination, commissioning kickoff…"
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            />
          </Field>
          <Field label="Attendees" className="sm:col-span-2">
            <Input
              value={form.attendees}
              onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))}
              placeholder="Comma-separated names"
            />
          </Field>
          <Field label="Project" className="sm:col-span-2">
            <Select
              value={form.projectId}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
            >
              <option value="">— None —</option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setCreating(false)}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={!form.title.trim()}>
            Create meeting
          </Button>
        </div>
      </Modal>
    </div>
  );
}
