import { useMemo, useRef, useState } from "react";
import { Download, Save, Upload } from "lucide-react";
import { useData } from "../state/DataProvider";
import { personas, settings as settingsRepo } from "../db/repo";
import { exportBytes, importBytes, resetDatabase } from "../db/database";
import {
  Button,
  Field,
  GlassPanel,
  Input,
  SectionHeading,
  Select,
  TextArea
} from "../components/ui/primitives";
import { today } from "../lib/dates";
import { cn } from "../lib/cn";
import type { AppSettings, Priority } from "../types";

/**
 * Configuration lives in the database (settings table, JSON) — no hardcoded
 * paths anywhere. Watched folders are managed on the Documents page since
 * that's where they're used.
 */
export default function Settings() {
  const { db, version, mutate, settings } = useData();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [savedFlash, setSavedFlash] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

  const personaList = useMemo(
    () => personas.all(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version]
  );
  const [personaDrafts, setPersonaDrafts] = useState<Record<string, string>>({});
  const [openPersona, setOpenPersona] = useState<string | null>(null);

  const save = () => {
    mutate((d) => settingsRepo.set(d, draft));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setDraft((s) => ({ ...s, [key]: value }));

  const exportDb = () => {
    const bytes = exportBytes();
    // Copy into a plain ArrayBuffer so the Blob type is satisfied.
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const blob = new Blob([buffer], { type: "application/x-sqlite3" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `engineeros-backup-${today()}.sqlite`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDb = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!window.confirm("Replace ALL current data with this backup?")) return;
    const buf = new Uint8Array(await file.arrayBuffer());
    await importBytes(buf);
    window.location.reload();
  };

  const reset = async () => {
    if (!window.confirm("Erase everything and start fresh? This cannot be undone.")) return;
    if (!window.confirm("Really erase all tasks, notes, meetings and journal entries?")) return;
    await resetDatabase();
    window.location.reload();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Settings</h1>
          <p className="mt-0.5 text-sm text-ink-dim">Everything configurable, nothing hardcoded.</p>
        </div>
        <Button variant="primary" onClick={save}>
          <Save size={14} /> {savedFlash ? "Saved ✓" : "Save settings"}
        </Button>
      </div>

      <GlassPanel className="p-5">
        <SectionHeading title="Profile & rhythm" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <Input value={draft.userName} onChange={(e) => set("userName", e.target.value)} />
          </Field>
          <Field label="Default task priority">
            <Select
              value={draft.defaultPriority}
              onChange={(e) => set("defaultPriority", e.target.value as Priority)}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </Field>
          <Field label="Working hours">
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={draft.workingHours.start}
                onChange={(e) => set("workingHours", { ...draft.workingHours, start: e.target.value })}
              />
              <span className="text-ink-dim2">–</span>
              <Input
                type="time"
                value={draft.workingHours.end}
                onChange={(e) => set("workingHours", { ...draft.workingHours, end: e.target.value })}
              />
            </div>
          </Field>
          <Field label="Learning hours (evenings)">
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={draft.learningHours.start}
                onChange={(e) => set("learningHours", { ...draft.learningHours, start: e.target.value })}
              />
              <span className="text-ink-dim2">–</span>
              <Input
                type="time"
                value={draft.learningHours.end}
                onChange={(e) => set("learningHours", { ...draft.learningHours, end: e.target.value })}
              />
            </div>
          </Field>
          <Field label="Weekly task goal">
            <Input
              type="number"
              min={1}
              value={draft.weeklyTaskGoal}
              onChange={(e) => set("weeklyTaskGoal", Number(e.target.value) || 1)}
            />
          </Field>
          <Field label="Weekly learning goal (minutes)">
            <Input
              type="number"
              min={0}
              value={draft.weeklyLearningGoalMinutes}
              onChange={(e) => set("weeklyLearningGoalMinutes", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </GlassPanel>

      <GlassPanel className="p-5">
        <SectionHeading title="Documents" />
        <Field label="Indexed file extensions (comma separated)">
          <Input
            value={draft.documentExtensions.join(", ")}
            onChange={(e) =>
              set(
                "documentExtensions",
                e.target.value
                  .split(",")
                  .map((x) => x.trim().toLowerCase().replace(/^\./, ""))
                  .filter(Boolean)
              )
            }
          />
        </Field>
        <p className="mt-2 text-xs text-ink-dim2">
          Watched folders are managed on the Documents page (browser folder access is
          granted there). Text is extracted from plain-text formats; other formats are
          indexed by metadata only.
        </p>
      </GlassPanel>

      <GlassPanel className="p-5">
        <SectionHeading title="AI" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Provider">
            <Select
              value={draft.ai.provider}
              onChange={(e) =>
                set("ai", { ...draft.ai, provider: e.target.value as AppSettings["ai"]["provider"] })
              }
            >
              <option value="local">Local (on-device, offline) — v1</option>
              <option value="anthropic">Anthropic (Version 2)</option>
              <option value="openai">OpenAI (Version 2)</option>
              <option value="azure">Azure OpenAI (Version 2)</option>
            </Select>
          </Field>
          <Field label="Model">
            <Input
              value={draft.ai.model}
              onChange={(e) => set("ai", { ...draft.ai, model: e.target.value })}
              placeholder="reserved for Version 2"
            />
          </Field>
          <Field label="Endpoint" className="sm:col-span-2">
            <Input
              value={draft.ai.endpoint}
              onChange={(e) => set("ai", { ...draft.ai, endpoint: e.target.value })}
              placeholder="reserved for Version 2"
            />
          </Field>
          <Field label="API key (stored locally only)" className="sm:col-span-2">
            <Input
              type="password"
              value={draft.ai.apiKey}
              onChange={(e) => set("ai", { ...draft.ai, apiKey: e.target.value })}
              placeholder="reserved for Version 2"
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-ink-dim2">
          Version 1 summaries and reflections are generated on-device with transparent
          rules — nothing leaves this machine. These fields configure a hosted model for
          Version 2 without a redesign.
        </p>
      </GlassPanel>

      <GlassPanel className="p-5">
        <SectionHeading title="AI personas (editable prompts)" />
        <div className="space-y-2">
          {personaList.map((p) => {
            const isOpen = openPersona === p.id;
            const value = personaDrafts[p.id] ?? p.prompt;
            return (
              <div key={p.id} className="rounded-lg border border-white/[0.06]">
                <button
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left"
                  onClick={() => setOpenPersona(isOpen ? null : p.id)}
                >
                  <span className="text-sm text-ink">{p.name}</span>
                  <span className="text-xs text-ink-dim2">{p.role}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-white/[0.06] p-4">
                    <TextArea
                      rows={10}
                      className="font-mono text-xs"
                      value={value}
                      onChange={(e) =>
                        setPersonaDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                      }
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="primary"
                        disabled={value === p.prompt}
                        onClick={() => mutate((d) => personas.update(d, p.id, value))}
                      >
                        Save prompt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassPanel>

      <GlassPanel className="p-5">
        <SectionHeading title="Integrations (Version 2)" />
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={draft.integrations.microsoft365}
            onChange={(e) => set("integrations", { microsoft365: e.target.checked })}
            className="h-4 w-4 accent-[#6FE3F2]"
          />
          <span className="text-sm text-ink-dim">
            Microsoft 365 (Outlook, SharePoint, Teams, Planner) — placeholder flag; the
            data model and services are designed so these plug in without a redesign.
          </span>
        </label>
      </GlassPanel>

      <GlassPanel className="p-5">
        <SectionHeading title="Data" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportDb}>
            <Download size={14} /> Export backup (.sqlite)
          </Button>
          <Button onClick={() => importInput.current?.click()}>
            <Upload size={14} /> Import backup
          </Button>
          <input
            ref={importInput}
            type="file"
            accept=".sqlite,.db"
            className="hidden"
            onChange={(e) => void importDb(e.target.files)}
          />
        </div>
        <p className="mt-3 text-xs text-ink-dim2">
          The entire workspace is a single SQLite file stored in this browser. Export it
          for backup or to move devices.
        </p>
        <div className={cn("mt-5 border-t border-red/20 pt-4")}>
          <Button variant="danger" onClick={() => void reset()}>
            Erase all data
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
