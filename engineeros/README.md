# EngineerOS — Version 1

A local-first Progressive Web App that works as a second brain, daily manager, mentor,
learning platform and construction engineering workspace. Built for daytime work at
Turner Construction (QC, commissioning, electrical, Facility Grid, automation) and
evening learning (AI, ML, Python, software engineering).

Every screen answers one question: **"What should I focus on next?"**

## Quick start

```bash
cd engineeros
npm install
npm run dev        # development server
npm run build      # typecheck + production build (dist/)
npm run preview    # serve the production build locally
```

Open the app in any modern browser (Windows desktop, iPad Safari, Chromium). Install it
from the browser's "Install app / Add to Home Screen" prompt for the standalone PWA
experience. After the first load it works fully offline.

## What's inside (all functional, no placeholders)

| Module | What it does |
| --- | --- |
| **Dashboard** | Greeting, today's priorities, today's meetings, outstanding action items, weekly goal progress, learning progress, recent notes/ideas/documents, quick search, journal shortcut. |
| **Tasks** | Full CRUD with priority, project, category, due date, estimated/actual duration, status, related meeting/document/notes. Filter by everything, plus text search. |
| **Meetings** | Notes, attendees, project link, on-device generated summaries from typed notes, detected action items that become real linked tasks, voice notes. |
| **Projects** | Seeded with CommissionOS, Facility Grid, Construction Automation, Innovation, Personal Learning (plus user-created). Tabs for overview/goals, tasks, notes, ideas, files, with computed progress. |
| **Knowledge** | Markdown notes organized into construction/engineering categories, live preview editor, pinning, tags, project links. |
| **Documents** | Watched folders (File System Access API on Chromium; per-file import elsewhere). Indexes metadata + extracts text from plain-text formats, detects changes, bumps revisions, never duplicates by path. Never stores the files themselves. |
| **Ideas** | One-click capture bar; ideas carry project, tags, priority, status. Never lost. |
| **Daily Journal** | A page per day, created automatically: goals, completed work, problems, lessons, ideas, tomorrow's priorities, mood, time spent. |
| **Learning Center** | Seeded topics (AI, ML, Python, JavaScript, Git, Software Architecture, Construction Technology) with progress, notes, exercises, projects, review dates (due-for-review highlighting), weak areas, next lesson. |
| **Weekly Review** | Auto-computed stats (tasks completed, hours logged, projects advanced, ideas captured, lessons, recurring blockers) + a generated reflection with concrete recommendations. |
| **Global Search** | One query across tasks, meetings, projects, ideas, notes, documents, learning and journal entries — every hit is one click away. |
| **Voice notes** | One-tap audio recording on meetings, journal days and knowledge notes (MediaRecorder). Audio is stored on-device in IndexedDB with playback, rename and delete. Needs HTTPS or localhost for microphone access. |
| **Settings** | Name, working/learning hours, default priority, weekly goals, document extensions, AI provider fields (v2-ready), editable AI persona prompts, backup export/import, reset. No hardcoded paths. |

## AI personas

Six editable persona prompts ship in the database and are edited as Markdown in
Settings: **Manager** (prioritizes work), **Mentor** (career advice), **Teacher**
(explains concepts), **Software Architect** (reviews code), **Construction Expert**
(explains workflows), **Learning Coach** (tracks education).

Version 1's generated text (meeting summaries, weekly reflections) is produced
**on-device with transparent rules** — nothing leaves the machine. The AI settings
(provider/endpoint/model/key) are the wired-up extension point for routing those same
call sites to a hosted model in Version 2.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full picture. In short:

- **UI**: React 18 + TypeScript + Tailwind, dark glassmorphism with neon cyan accents
  (a continuation of the CommissionOS design language in `../web`).
- **Data**: a real SQLite database (sql.js, WASM) held in memory and persisted to
  IndexedDB after every write; notes and persona prompts are Markdown; configuration is
  JSON in the settings table.
- **Offline**: `vite-plugin-pwa` precaches the entire app shell including the SQLite
  engine; the app boots and works with zero network.
- **Modularity**: pages → repositories → database. SQL lives only in `src/db/repo.ts`;
  pages never touch SQL. Version 2 integrations (Outlook, SharePoint, Teams, Planner)
  slot in as new services writing through the same repositories.

## Deploying (Netlify)

The repo ships a `netlify.toml` (build `npm run build`, publish `dist/`, SPA
redirects), so deploying is:

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing
   project** → pick this GitHub repo.
2. Accept the detected settings (they come from `netlify.toml`) and deploy.

Every push to the default branch then auto-deploys. Netlify serves over HTTPS, which
is exactly what the PWA install prompt and microphone access require.

## Backups

Settings → Data → **Export backup** downloads the entire workspace as a single
`.sqlite` file; **Import backup** restores it (also the way to move devices).
