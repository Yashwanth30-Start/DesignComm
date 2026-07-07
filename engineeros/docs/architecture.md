# EngineerOS architecture

Source of truth is the code; this doc is the map. Update it when the shape of a layer
changes, not on every feature tweak.

## Layers

```
pages/            React route components (one per sidebar item + detail pages)
  ↓ read via repositories, write via mutate()
state/DataProvider.tsx   app context: opens the DB, exposes { db, version, mutate, settings }
  ↓
db/repo.ts        repositories — the ONLY place SQL lives
db/database.ts    sql.js bootstrap, migrations runner, IndexedDB persistence
db/schema.ts      ordered migrations (append-only)
db/seed.ts        first-run content: projects, learning topics, personas, settings
db/idb.ts         minimal IndexedDB helpers (sqlite snapshot + folder handles)
```

Supporting modules:

- `lib/search.ts` — global search: one LIKE-based source per entity type, each result
  typed and routed.
- `lib/assist.ts` — on-device text intelligence (meeting summaries, weekly
  reflections). Deterministic rules, fully offline. This is the seam where Version 2
  swaps in a hosted model using the AI settings + persona prompts.
- `lib/documents.ts` — watched-folder indexing via the File System Access API, with a
  per-file import fallback. Indexes metadata + extracted text only.
- `components/ui/primitives.tsx` — GlassPanel, Button, Input/TextArea/Select/Field,
  PriorityPill, StatusPill, Tag, ProgressBar, StatTile, SectionHeading, EmptyState,
  Modal. Pages compose these; they never hand-roll glass/glow styling.
- `components/layout/AppShell.tsx` — sidebar (spec order), topbar with global search
  and journal shortcut, responsive slide-over menu.

## Data flow

Reads are synchronous queries against the in-memory SQLite database. Writes go through
`mutate(fn)`, which runs the repository call, schedules a debounced persist (DB bytes →
IndexedDB), and bumps a version counter that pages depend on to re-query. With a single
local user this is simpler and faster than any cache/invalidation scheme.

The persistence snapshot is also flushed when the tab goes hidden. Backup/restore in
Settings exports/imports the same byte snapshot as a `.sqlite` file.

## Schema evolution

`db/schema.ts` holds an append-only `MIGRATIONS` array. The applied version lives in
the `meta` table (owned by the migrator in `database.ts` — migrations must not create
`meta`). To change the schema: append a new migration string, never edit an old one.
Imported backups are re-migrated on load, so old backups stay compatible.

## Storage responsibilities

| Data | Where |
| --- | --- |
| Structured entities (tasks, meetings, projects, ideas, journal, learning, reviews, documents index) | SQLite tables |
| Notes + persona prompts | Markdown text in SQLite (`notes.content`, `personas.prompt`) |
| Configuration | JSON blob in `settings` table (typed by `AppSettings`, merged over defaults so new fields appear on old databases) |
| Watched folder handles | IndexedDB `handles` store (FileSystemDirectoryHandle is structured-cloneable but not serializable to SQL) |
| Voice-note audio blobs | IndexedDB `audio` store, keyed by recording id; metadata in the SQLite `recordings` table (`lib/audio.ts` + `features/recordings/VoiceNotes.tsx`) |
| SQLite snapshot | IndexedDB `sqlite` store, key `main` |

Note: the Settings backup exports the SQLite file only — audio blobs are metadata-
linked but live outside the snapshot (they can be large). A future backup format can
bundle both.

## Offline / PWA

`vite-plugin-pwa` (Workbox `generateSW`) precaches every built asset including
`sql-wasm.wasm`, with `navigateFallback: /index.html` for the SPA routes. First visit
online; everything after that works with zero network. `registerType: autoUpdate`
means new deploys activate on the next navigation.

## Version 2 readiness

- **Microsoft 365 (Outlook/SharePoint/Teams/Planner)**: add service modules that write
  through the existing repositories (e.g. Outlook events → `meetings.upsert`). The
  `settings.integrations` flag and meeting "linked emails" are reserved for this.
- **Hosted AI**: `lib/assist.ts` call sites + `settings.ai` (provider/endpoint/model/
  key) + persona prompts in the DB. No UI redesign needed — the Generate buttons stay,
  the backend changes.
- **Desktop shell**: everything above `db/database.ts` is persistence-agnostic; a
  desktop wrapper can swap IndexedDB for a file on disk (and map notes to real `.md`
  files) without touching pages or repositories.
