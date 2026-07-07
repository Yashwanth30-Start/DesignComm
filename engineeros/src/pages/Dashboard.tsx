import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Lightbulb,
  NotebookPen,
  Plus,
  Search
} from "lucide-react";
import { useData } from "../state/DataProvider";
import { documents, ideas, journal, learning, meetings, notes, tasks } from "../db/repo";
import {
  Button,
  EmptyState,
  GlassPanel,
  ProgressBar,
  SectionHeading,
  StatTile
} from "../components/ui/primitives";
import { TaskRow } from "../features/tasks/TaskRow";
import { TaskModal } from "../features/tasks/TaskModal";
import { formatDayLong, greeting, relativeTime, today, weekStart } from "../lib/dates";
import type { Task } from "../types";

/**
 * The command center. Everything here answers one question:
 * "What should I focus on next?"
 */
export default function Dashboard() {
  const { db, version, settings } = useData();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");

  const day = today();

  const data = useMemo(() => {
    const allTasks = tasks.all(db);
    const open = allTasks.filter((t) => t.status !== "done");
    const priorities = open
      .filter((t) => (t.dueDate != null && t.dueDate <= day) || t.priority === "critical")
      .slice(0, 6);
    const focus = priorities.length
      ? priorities
      : open.slice(0, 5); // nothing due today → show top-ranked open work
    const actionItems = open.filter((t) => t.meetingId != null).slice(0, 5);
    const ws = weekStart(day);
    const doneThisWeek = allTasks.filter(
      (t) => t.completedAt != null && t.completedAt.slice(0, 10) >= ws
    ).length;
    const topics = learning.all(db);
    const avgProgress = topics.length
      ? Math.round(topics.reduce((sum, t) => sum + t.progress, 0) / topics.length)
      : 0;
    return {
      focus,
      usingFallbackFocus: priorities.length === 0,
      openCount: open.length,
      overdue: open.filter((t) => t.dueDate != null && t.dueDate < day).length,
      todayMeetings: meetings.onDate(db, day),
      recentNotes: notes.all(db).slice(0, 4),
      recentDocs: documents.all(db).slice(0, 4),
      recentIdeas: ideas.all(db).slice(0, 4),
      actionItems,
      doneThisWeek,
      avgProgress,
      journalToday: journal.peek(db, day)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, day]);

  const submitQuickSearch = () => {
    const q = quickQuery.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
            {greeting()}, <span className="text-cyan">{settings.userName || "Engineer"}</span>
          </h1>
          <p className="mt-1 text-sm text-ink-dim">{formatDayLong(day)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus size={14} /> New task
          </Button>
          <Button onClick={() => navigate("/journal")}>
            <NotebookPen size={14} /> Today's journal
          </Button>
        </div>
      </div>

      {/* Quick search */}
      <div className="relative max-w-xl">
        <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim2" />
        <input
          value={quickQuery}
          onChange={(e) => setQuickQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitQuickSearch()}
          placeholder="Search tasks, notes, meetings, ideas, documents…"
          className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-dim2 focus:border-cyan/40 focus:outline-none focus:ring-1 focus:ring-cyan/30"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Open tasks" value={data.openCount} sub={`${data.overdue} overdue`} />
        <StatTile label="Meetings today" value={data.todayMeetings.length} />
        <StatTile
          label="Weekly goal"
          value={`${data.doneThisWeek}/${settings.weeklyTaskGoal}`}
          sub="tasks completed"
        />
        <StatTile label="Learning" value={`${data.avgProgress}%`} sub="average progress" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Focus column */}
        <div className="space-y-6 lg:col-span-2">
          <GlassPanel className="p-5" glow>
            <SectionHeading
              title={data.usingFallbackFocus ? "Next up" : "Today's priorities"}
              action={
                <Link to="/tasks" className="flex items-center gap-1 text-xs text-cyan hover:underline">
                  All tasks <ArrowRight size={12} />
                </Link>
              }
            />
            {data.focus.length === 0 ? (
              <EmptyState message="Nothing on your plate." hint="Capture the next thing before you forget it." />
            ) : (
              <div className="space-y-1">
                {data.focus.map((t) => (
                  <TaskRow key={t.id} task={t} onEdit={setEditing} />
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <SectionHeading
              title="Outstanding action items"
              action={
                <Link to="/meetings" className="flex items-center gap-1 text-xs text-cyan hover:underline">
                  Meetings <ArrowRight size={12} />
                </Link>
              }
            />
            {data.actionItems.length === 0 ? (
              <p className="text-sm text-ink-dim2">No open action items from meetings.</p>
            ) : (
              <div className="space-y-1">
                {data.actionItems.map((t) => (
                  <TaskRow key={t.id} task={t} onEdit={setEditing} />
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <SectionHeading title="Weekly goal progress" />
            <ProgressBar
              value={(data.doneThisWeek / Math.max(1, settings.weeklyTaskGoal)) * 100}
              color="emerald"
            />
            <p className="mt-2 text-xs text-ink-dim">
              {data.doneThisWeek} of {settings.weeklyTaskGoal} tasks completed this week ·{" "}
              <Link to="/review" className="text-cyan hover:underline">
                open weekly review
              </Link>
            </p>
          </GlassPanel>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <GlassPanel className="p-5">
            <SectionHeading title="Today's meetings" />
            {data.todayMeetings.length === 0 ? (
              <p className="text-sm text-ink-dim2">No meetings today.</p>
            ) : (
              <div className="space-y-2">
                {data.todayMeetings.map((m) => (
                  <Link
                    key={m.id}
                    to={`/meetings/${m.id}`}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.06] px-3 py-2 hover:border-cyan/30"
                  >
                    <CalendarDays size={14} className="shrink-0 text-cyan" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{m.title}</p>
                      <p className="text-[11px] text-ink-dim2">{m.time || "No time set"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <SectionHeading title="Recent notes" />
            {data.recentNotes.length === 0 ? (
              <p className="text-sm text-ink-dim2">No notes yet.</p>
            ) : (
              <div className="space-y-1.5">
                {data.recentNotes.map((nte) => (
                  <Link
                    key={nte.id}
                    to={`/knowledge?note=${nte.id}`}
                    className="block rounded-md px-2 py-1.5 hover:bg-white/[0.04]"
                  >
                    <p className="truncate text-sm text-ink">{nte.title}</p>
                    <p className="text-[11px] text-ink-dim2">
                      {nte.category} · {relativeTime(nte.updatedAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <SectionHeading title="Recent ideas" />
            {data.recentIdeas.length === 0 ? (
              <p className="text-sm text-ink-dim2">
                No ideas captured yet — don't let them get away.
              </p>
            ) : (
              <div className="space-y-1.5">
                {data.recentIdeas.map((i) => (
                  <Link
                    key={i.id}
                    to="/ideas"
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white/[0.04]"
                  >
                    <Lightbulb size={13} className="mt-0.5 shrink-0 text-gold" />
                    <p className="truncate text-sm text-ink">{i.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <SectionHeading title="Recent documents" />
            {data.recentDocs.length === 0 ? (
              <p className="text-sm text-ink-dim2">
                Nothing indexed. Add watched folders in{" "}
                <Link to="/documents" className="text-cyan hover:underline">
                  Documents
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-1.5">
                {data.recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    to="/documents"
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white/[0.04]"
                  >
                    <FileText size={13} className="mt-0.5 shrink-0 text-purple" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{doc.name}</p>
                      <p className="text-[11px] text-ink-dim2">rev {doc.revision}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </div>

      <TaskModal open={creating} onClose={() => setCreating(false)} />
      <TaskModal open={editing != null} onClose={() => setEditing(null)} task={editing} />
    </div>
  );
}
