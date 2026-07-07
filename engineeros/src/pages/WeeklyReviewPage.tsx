import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useData } from "../state/DataProvider";
import { ideas, journal, projects, tasks, weeklyReviews } from "../db/repo";
import {
  Button,
  Field,
  GlassPanel,
  SectionHeading,
  StatTile,
  TextArea
} from "../components/ui/primitives";
import { weeklyReflection, type WeekStats } from "../lib/assist";
import { addDays, formatDay, parseDay, today, weekStart } from "../lib/dates";

/**
 * Weekly review: computed automatically from tasks, journal entries and
 * ideas for the chosen week, plus an editable review record and a generated
 * (on-device) reflection with recommendations.
 */
export default function WeeklyReviewPage() {
  const { db, version, mutate, settings } = useData();
  const [week, setWeek] = useState(() => weekStart(today()));

  const weekEnd = addDays(week, 6);

  const stats: WeekStats & { hoursWorked: number } = useMemo(() => {
    const fromIso = parseDay(week).toISOString();
    const toIso = parseDay(addDays(week, 7)).toISOString();
    const all = tasks.all(db);
    const completed = all.filter(
      (t) => t.completedAt != null && t.completedAt >= fromIso && t.completedAt < toIso
    );
    const created = all.filter((t) => t.createdAt >= fromIso && t.createdAt < toIso);
    const open = all.filter((t) => t.status !== "done");
    const entries = journal.between(db, week, weekEnd);
    const minutesWorked = entries.reduce((s, e) => s + e.timeSpentMinutes, 0);
    const capturedIdeas = ideas
      .all(db)
      .filter((i) => i.createdAt >= fromIso && i.createdAt < toIso);
    const projectNames = new Set<string>();
    for (const t of completed) {
      if (t.projectId) {
        const p = projects.get(db, t.projectId);
        if (p) projectNames.add(p.name);
      }
    }
    const splitLines = (s: string) =>
      s.split("\n").map((l) => l.replace(/^[-*•\s]+/, "").trim()).filter(Boolean);
    return {
      tasksCompleted: completed.length,
      tasksCreated: created.length,
      overdueOpen: open.filter((t) => t.dueDate != null && t.dueDate < today()).length,
      blockedOpen: open.filter((t) => t.status === "blocked"),
      minutesWorked,
      hoursWorked: Math.round((minutesWorked / 60) * 10) / 10,
      learningMinutesGoal: settings.weeklyLearningGoalMinutes,
      ideasCaptured: capturedIdeas.length,
      lessons: entries.flatMap((e) => splitLines(e.lessons)),
      problems: entries.flatMap((e) => splitLines(e.problems)),
      projectsAdvanced: Array.from(projectNames),
      weeklyTaskGoal: settings.weeklyTaskGoal
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, week, settings]);

  const review = useMemo(
    () =>
      weeklyReviews.peek(db, week) ?? {
        achievements: "",
        blockers: "",
        reflection: ""
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version, week]
  );

  const [draft, setDraft] = useState({ achievements: "", blockers: "" });
  const [draftWeek, setDraftWeek] = useState("");
  if (draftWeek !== week) {
    setDraftWeek(week);
    setDraft({ achievements: review.achievements, blockers: review.blockers });
  }

  const save = () => mutate((d) => weeklyReviews.update(d, week, draft));

  const generate = () => {
    const reflection = weeklyReflection(stats);
    mutate((d) => weeklyReviews.update(d, week, { ...draft, reflection }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Weekly Review</h1>
          <p className="mt-0.5 text-sm text-ink-dim">
            {formatDay(week)} – {formatDay(weekEnd)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setWeek(addDays(week, -7))} aria-label="Previous week">
            <ChevronLeft size={14} />
          </Button>
          <Button onClick={() => setWeek(addDays(week, 7))} aria-label="Next week">
            <ChevronRight size={14} />
          </Button>
          {week !== weekStart(today()) && (
            <Button variant="primary" onClick={() => setWeek(weekStart(today()))}>
              This week
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Tasks completed"
          value={stats.tasksCompleted}
          sub={`goal ${stats.weeklyTaskGoal}`}
        />
        <StatTile label="Hours logged" value={stats.hoursWorked} sub="from daily journal" />
        <StatTile
          label="Projects advanced"
          value={stats.projectsAdvanced.length}
          sub={stats.projectsAdvanced.slice(0, 2).join(", ") || "—"}
        />
        <StatTile label="Ideas captured" value={stats.ideasCaptured} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <GlassPanel className="p-5">
            <SectionHeading title="Lessons learned this week" />
            {stats.lessons.length === 0 ? (
              <p className="text-sm text-ink-dim2">
                Nothing journaled yet — lessons come from your daily journal.
              </p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-dim">
                {stats.lessons.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <SectionHeading title="Recurring blockers" />
            {stats.blockedOpen.length === 0 && stats.problems.length === 0 ? (
              <p className="text-sm text-ink-dim2">No blocked tasks or journaled problems.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-dim">
                {stats.blockedOpen.map((t) => (
                  <li key={t.id}>
                    <span className="text-red">Blocked task:</span> {t.title}
                  </li>
                ))}
                {stats.problems.map((p, i) => (
                  <li key={`p${i}`}>{p}</li>
                ))}
              </ul>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <Field label="Achievements">
              <TextArea
                rows={3}
                value={draft.achievements}
                onChange={(e) => setDraft((d) => ({ ...d, achievements: e.target.value }))}
                onBlur={save}
                placeholder="What are you proud of this week?"
              />
            </Field>
            <Field label="Blockers to raise" className="mt-3">
              <TextArea
                rows={3}
                value={draft.blockers}
                onChange={(e) => setDraft((d) => ({ ...d, blockers: e.target.value }))}
                onBlur={save}
                placeholder="What needs escalation or outside help?"
              />
            </Field>
          </GlassPanel>
        </div>

        <GlassPanel className="p-5" glow>
          <SectionHeading
            title="Reflection"
            action={
              <Button variant="primary" onClick={generate}>
                <Sparkles size={13} /> Generate reflection
              </Button>
            }
          />
          {review.reflection ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-dim">
              {review.reflection}
            </pre>
          ) : (
            <p className="text-sm text-ink-dim2">
              Generate a reflection from this week's data — completed work, blockers,
              journal lessons — with concrete recommendations for next week. Runs fully
              on-device.
            </p>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
