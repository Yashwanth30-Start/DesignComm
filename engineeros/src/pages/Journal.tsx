import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useData } from "../state/DataProvider";
import { journal } from "../db/repo";
import { Button, Field, GlassPanel, Input, TextArea } from "../components/ui/primitives";
import { addDays, formatDayLong, today } from "../lib/dates";
import { cn } from "../lib/cn";
import type { JournalEntry } from "../types";

const MOODS = ["🔥 Great", "🙂 Good", "😐 Okay", "😮‍💨 Tired", "😖 Rough"];

const SECTIONS: { key: keyof JournalEntry; label: string; placeholder: string }[] = [
  { key: "goals", label: "Today's goals", placeholder: "What must happen today?" },
  { key: "completed", label: "Completed work", placeholder: "What actually got done?" },
  { key: "problems", label: "Problems", placeholder: "What went wrong or got in the way?" },
  { key: "lessons", label: "Lessons learned", placeholder: "What do you know now that you didn't this morning?" },
  { key: "ideas", label: "Ideas", placeholder: "Anything worth exploring later?" },
  { key: "tomorrow", label: "Tomorrow's priorities", placeholder: "Set tomorrow up before you leave." }
];

/**
 * Daily journal — a page exists for every day automatically; navigating to a
 * date creates it on first access. Fields autosave on blur.
 */
export default function Journal() {
  const { db, version, mutate } = useData();
  const [params, setParams] = useSearchParams();
  const [date, setDate] = useState(params.get("date") ?? today());

  // Deep link from search results: /journal?id=<entryId>
  const idParam = params.get("id");
  useEffect(() => {
    if (!idParam) return;
    const entry = journal.all(db).find((e) => e.id === idParam);
    if (entry) setDate(entry.date);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  const entry = useMemo(
    () => journal.peek(db, date),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version, date]
  );

  // A page exists for every day: create it on first visit to a date.
  useEffect(() => {
    if (!entry) {
      mutate((d) => {
        journal.forDate(d, date);
      });
    }
  }, [entry, date, mutate]);

  const [draft, setDraft] = useState<JournalEntry | null>(entry);
  useEffect(() => {
    setDraft(entry);
  }, [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!draft) return null;

  const save = () => mutate((d) => journal.update(d, date, draft));

  const setField = (key: keyof JournalEntry, value: string | number) =>
    setDraft((cur) => (cur ? { ...cur, [key]: value } : cur));

  const isToday = date === today();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Daily Journal</h1>
          <p className="mt-0.5 text-sm text-ink-dim">{formatDayLong(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
            <ChevronLeft size={14} />
          </Button>
          <Input
            type="date"
            className="w-auto"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
          <Button onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
            <ChevronRight size={14} />
          </Button>
          {!isToday && (
            <Button variant="primary" onClick={() => setDate(today())}>
              Today
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <GlassPanel key={s.key} className="p-4">
            <Field label={s.label}>
              <TextArea
                rows={4}
                value={String(draft[s.key] ?? "")}
                onChange={(e) => setField(s.key, e.target.value)}
                onBlur={save}
                placeholder={s.placeholder}
              />
            </Field>
          </GlassPanel>
        ))}

        <GlassPanel className="p-4">
          <Field label="Mood">
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    const next = { ...draft, mood: draft.mood === m ? "" : m };
                    setDraft(next);
                    mutate((d) => journal.update(d, date, next));
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    draft.mood === m
                      ? "border-cyan/40 bg-cyan/10 text-cyan"
                      : "border-white/10 text-ink-dim hover:border-white/25"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>
        </GlassPanel>

        <GlassPanel className="p-4">
          <Field label="Time spent (minutes)">
            <Input
              type="number"
              min={0}
              value={draft.timeSpentMinutes || ""}
              onChange={(e) => setField("timeSpentMinutes", Number(e.target.value) || 0)}
              onBlur={save}
              placeholder="e.g. 480"
            />
          </Field>
          <p className="mt-2 text-[11px] text-ink-dim2">
            Logged time feeds the weekly review's "hours worked".
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}
