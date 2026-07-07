import { useMemo, useState } from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { useData } from "../state/DataProvider";
import { learning } from "../db/repo";
import {
  Button,
  EmptyState,
  Field,
  GlassPanel,
  Input,
  Modal,
  ProgressBar,
  SectionHeading,
  TextArea
} from "../components/ui/primitives";
import { formatDay, today } from "../lib/dates";
import { cn } from "../lib/cn";
import type { LearningTopic } from "../types";

/**
 * Learning center: one card per topic with progress, notes, exercises,
 * weak areas, next lesson and a review date (topics due for review are
 * highlighted).
 */
export default function Learning() {
  const { db, version, mutate } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", area: "" });

  const topics = useMemo(
    () => learning.all(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version]
  );

  const avg = topics.length
    ? Math.round(topics.reduce((s, t) => s + t.progress, 0) / topics.length)
    : 0;
  const dueForReview = topics.filter((t) => t.reviewDate && t.reviewDate <= today());
  const selected = selectedId ? topics.find((t) => t.id === selectedId) ?? null : null;

  const update = (id: string, data: Partial<LearningTopic>) =>
    mutate((d) => learning.update(d, id, data));

  const create = () => {
    if (!form.name.trim()) return;
    mutate((d) => learning.create(d, form));
    setForm({ name: "", area: "" });
    setCreating(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Learning Center</h1>
          <p className="mt-0.5 text-sm text-ink-dim">
            {topics.length} topics · {avg}% average progress
            {dueForReview.length > 0 && (
              <span className="text-amber"> · {dueForReview.length} due for review</span>
            )}
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> New topic
        </Button>
      </div>

      <GlassPanel className="p-4">
        <SectionHeading title="Overall progress" />
        <ProgressBar value={avg} color="emerald" />
      </GlassPanel>

      {topics.length === 0 ? (
        <EmptyState message="No learning topics yet." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => {
            const due = t.reviewDate != null && t.reviewDate <= today();
            return (
              <button key={t.id} onClick={() => setSelectedId(t.id)} className="text-left">
                <GlassPanel
                  className={cn(
                    "h-full p-4 transition-colors hover:border-cyan/30",
                    due && "border-amber/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={15} className="shrink-0 text-cyan" />
                      <p className="text-sm font-medium text-ink">{t.name}</p>
                    </div>
                    {due && (
                      <span className="shrink-0 rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
                        Review due
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-dim2">{t.area}</p>
                  <div className="mt-3">
                    <ProgressBar value={t.progress} />
                    <p className="mt-1.5 text-[11px] text-ink-dim2">{t.progress}%</p>
                  </div>
                  {t.nextLesson && (
                    <p className="mt-2 line-clamp-2 text-xs text-ink-dim">
                      <span className="text-cyan">Next:</span> {t.nextLesson}
                    </p>
                  )}
                </GlassPanel>
              </button>
            );
          })}
        </div>
      )}

      {/* Topic editor */}
      <Modal
        open={selected != null}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? ""}
        wide
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Progress — ${selected.progress}%`} className="sm:col-span-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={selected.progress}
                  onChange={(e) => update(selected.id, { progress: Number(e.target.value) })}
                  className="w-full accent-[#6FE3F2]"
                />
              </Field>
              <Field label="Area">
                <Input
                  value={selected.area}
                  onChange={(e) => update(selected.id, { area: e.target.value })}
                />
              </Field>
              <Field label="Next review date">
                <Input
                  type="date"
                  value={selected.reviewDate ?? ""}
                  onChange={(e) => update(selected.id, { reviewDate: e.target.value || null })}
                />
              </Field>
              <Field label="Next recommended lesson" className="sm:col-span-2">
                <Input
                  value={selected.nextLesson}
                  onChange={(e) => update(selected.id, { nextLesson: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Notes">
              <TextArea
                rows={4}
                value={selected.notes}
                onChange={(e) => update(selected.id, { notes: e.target.value })}
                placeholder="Key concepts, references, links…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Exercises">
                <TextArea
                  rows={3}
                  value={selected.exercises}
                  onChange={(e) => update(selected.id, { exercises: e.target.value })}
                  placeholder="Practice work, one per line"
                />
              </Field>
              <Field label="Projects">
                <TextArea
                  rows={3}
                  value={selected.projects}
                  onChange={(e) => update(selected.id, { projects: e.target.value })}
                  placeholder="Real things built with this topic"
                />
              </Field>
            </div>
            <Field label="Weak areas">
              <TextArea
                rows={2}
                value={selected.weakAreas}
                onChange={(e) => update(selected.id, { weakAreas: e.target.value })}
                placeholder="What needs the most attention?"
              />
            </Field>
            {selected.reviewDate && (
              <p className="text-xs text-ink-dim2">
                Next review: {formatDay(selected.reviewDate)}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm("Delete this learning topic?")) {
                    mutate((d) => learning.remove(d, selected.id));
                    setSelectedId(null);
                  }
                }}
              >
                <Trash2 size={13} /> Delete topic
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New topic */}
      <Modal open={creating} onClose={() => setCreating(false)} title="New learning topic">
        <div className="space-y-4">
          <Field label="Name">
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. APIs, SQL, BIM…"
            />
          </Field>
          <Field label="Area">
            <Input
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              placeholder="Programming, AI, Construction…"
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setCreating(false)}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={!form.name.trim()}>
            Add topic
          </Button>
        </div>
      </Modal>
    </div>
  );
}
