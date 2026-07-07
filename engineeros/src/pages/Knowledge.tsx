import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, Pencil, Pin, Plus, Search, Trash2 } from "lucide-react";
import { useData } from "../state/DataProvider";
import { notes, projects } from "../db/repo";
import { KNOWLEDGE_CATEGORIES } from "../db/seed";
import {
  Button,
  EmptyState,
  Field,
  GlassPanel,
  Input,
  Select,
  TextArea
} from "../components/ui/primitives";
import { Markdown } from "../components/ui/Markdown";
import { relativeTime } from "../lib/dates";
import { cn } from "../lib/cn";

/**
 * The Markdown second brain: category rail, note list, and an editor with
 * live preview toggle. Notes autosave on blur. `?note=<id>` deep-links from
 * search and the dashboard; `?new=1&project=<id>` pre-links a new note.
 */
export default function Knowledge() {
  const { db, version, mutate } = useData();
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(true);

  const allNotes = useMemo(
    () => notes.all(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version]
  );

  const categories = useMemo(() => {
    const set = new Set([...KNOWLEDGE_CATEGORIES, ...allNotes.map((n) => n.category)]);
    return Array.from(set).sort();
  }, [allNotes]);

  const selectedId = params.get("note");
  const selected = selectedId ? allNotes.find((n) => n.id === selectedId) ?? null : null;

  const [draft, setDraft] = useState(selected);
  useEffect(() => {
    setDraft(selected);
    if (selected) setPreview(true);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?new=1&project=… deep link (from Project detail).
  useEffect(() => {
    if (params.get("new") === "1") {
      const projectId = params.get("project");
      let id = "";
      mutate((d) => {
        id = notes.create(d, { title: "Untitled note", projectId: projectId || null });
      });
      setParams({ note: id }, { replace: true });
      setPreview(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = allNotes.filter((n) => {
    if (category !== "all" && n.category !== category) return false;
    const q = query.trim().toLowerCase();
    if (q && !`${n.title} ${n.content} ${n.tags}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const createNote = () => {
    let id = "";
    mutate((d) => {
      id = notes.create(d, {
        title: "Untitled note",
        category: category === "all" ? "General" : category
      });
    });
    setParams({ note: id });
    setPreview(false);
  };

  const save = () => {
    if (!draft) return;
    mutate((d) => notes.update(d, draft.id, draft));
  };

  const removeNote = () => {
    if (!draft || !window.confirm("Delete this note?")) return;
    mutate((d) => notes.remove(d, draft.id));
    setParams({});
  };

  const projectList = projects.all(db);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Knowledge</h1>
          <p className="mt-0.5 text-sm text-ink-dim">
            {allNotes.length} Markdown notes · everything searchable
          </p>
        </div>
        <Button variant="primary" onClick={createNote}>
          <Plus size={14} /> New note
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Category rail + note list */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim2" />
            <Input
              className="pl-8"
              placeholder="Filter notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <GlassPanel className="max-h-[30vh] overflow-y-auto p-2 lg:max-h-none">
            <button
              onClick={() => setCategory("all")}
              className={cn(
                "block w-full rounded-md px-3 py-1.5 text-left text-sm",
                category === "all" ? "bg-cyan/10 text-cyan" : "text-ink-dim hover:text-ink"
              )}
            >
              All categories
            </button>
            {categories.map((c) => {
              const count = allNotes.filter((n) => n.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm",
                    category === c ? "bg-cyan/10 text-cyan" : "text-ink-dim hover:text-ink"
                  )}
                >
                  <span className="truncate">{c}</span>
                  {count > 0 && <span className="text-[10px] text-ink-dim2">{count}</span>}
                </button>
              );
            })}
          </GlassPanel>
        </div>

        {/* Note list + editor */}
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <GlassPanel className="max-h-[70vh] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-ink-dim2">No notes here yet.</p>
            ) : (
              filtered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setParams({ note: n.id })}
                  className={cn(
                    "block w-full rounded-lg px-3 py-2 text-left transition-colors",
                    selected?.id === n.id ? "bg-cyan/10" : "hover:bg-white/[0.04]"
                  )}
                >
                  <p className="flex items-center gap-1.5 truncate text-sm text-ink">
                    {n.pinned && <Pin size={11} className="shrink-0 text-gold" />}
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-dim2">
                    {n.category} · {relativeTime(n.updatedAt)}
                  </p>
                </button>
              ))
            )}
          </GlassPanel>

          {!draft ? (
            <EmptyState
              message="Select a note or create a new one."
              hint="Notes are Markdown — headings, lists, code blocks and tables all work."
            />
          ) : (
            <GlassPanel className="p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Input
                  className="min-w-[200px] flex-1 text-base font-medium"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  onBlur={save}
                />
                <Button onClick={() => setPreview((p) => !p)}>
                  {preview ? <Pencil size={13} /> : <Eye size={13} />}
                  {preview ? "Edit" : "Preview"}
                </Button>
                <Button
                  onClick={() => {
                    const next = { ...draft, pinned: !draft.pinned };
                    setDraft(next);
                    mutate((d) => notes.update(d, draft.id, next));
                  }}
                  className={cn(draft.pinned && "border-gold/40 text-gold")}
                >
                  <Pin size={13} />
                </Button>
                <Button variant="danger" onClick={removeNote}>
                  <Trash2 size={13} />
                </Button>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <Field label="Category">
                  <Select
                    value={draft.category}
                    onChange={(e) => {
                      const next = { ...draft, category: e.target.value };
                      setDraft(next);
                      mutate((d) => notes.update(d, draft.id, next));
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Project">
                  <Select
                    value={draft.projectId ?? ""}
                    onChange={(e) => {
                      const next = { ...draft, projectId: e.target.value || null };
                      setDraft(next);
                      mutate((d) => notes.update(d, draft.id, next));
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
                <Field label="Tags">
                  <Input
                    value={draft.tags}
                    onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                    onBlur={save}
                    placeholder="comma, separated"
                  />
                </Field>
              </div>

              {preview ? (
                <div className="min-h-[300px] rounded-lg border border-white/[0.06] bg-black/20 p-4">
                  <Markdown content={draft.content || "*Empty note — hit Edit to write.*"} />
                </div>
              ) : (
                <TextArea
                  rows={18}
                  className="font-mono text-[13px]"
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  onBlur={save}
                  placeholder="# Write Markdown here…"
                />
              )}
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
