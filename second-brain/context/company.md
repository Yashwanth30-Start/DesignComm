# Company / Product Context — CommissionOS

> Loaded first, every session. Written as an onboarding doc for a sharp new hire.
> Facts marked `[TODO: confirm]` are placeholders — never present them as certain.

## What CommissionOS is

CommissionOS is a **construction-commissioning operating system**: a single
searchable surface that aggregates the scattered systems a large commissioning
project runs on — panel schedules, RFIs, inspection trackers, field messages,
constraint logs — and ties every record back to a physical **asset tag** (e.g. a
fire/smoke damper, a panel, a circuit).

The problem it solves: on a big project, the "state" of any given asset is smeared
across SharePoint spreadsheets, Procore, Airtable, FacilityGrid, GroupMe threads,
and Excel trackers. No one place answers "what is the status of asset X, and what's
blocking it?" CommissionOS makes that one query.

## What it sells / who it serves

- **User:** commissioning managers, project engineers, and field leads on large
  construction / life-safety commissioning jobs.
- **Current deployment boundary:** **Wing 2** of a single active project (see
  `clients/wing2/profile.md`). Areas A500–C700 are in active scope; D/E 600–700
  are shown but out of scope until the platform expands.
- **Business model / pricing:** `[TODO: confirm — not yet recorded]`.

## How it's built (current state, 2026-07)

- **Frontend:** Next.js 14 + TypeScript + Tailwind + Motion + React Three Fiber.
  Public marketing/app site is the `web/` folder only; it renders typed mock data
  and **never** contains real project data.
- **Backend:** Supabase (Postgres + Edge Functions, Deno). Live and verified as of
  Phase 2. Data is served to the app via RPCs (`get_assets_json()` /
  `get_assets()`).
- **Ingest:** a local pipeline of **manual-export adapters** (one per source) that
  normalize CSV/XLSX/JSON exports into a common record shape, plus live-push
  connectors (FacilityGrid TamperMonkey bridge, formerly a GroupMe bot) that POST
  to a shared Supabase **ingest Edge Function**.
- **Deploy:** Netlify (cloud build; the dev laptop is locked down — no Node/npm/git
  locally, so builds happen on Netlify's servers). Code deploys are currently a
  manual zip-drag; data is live via Supabase.

## Data sources it integrates (the connector roster)

| Source | Current ingest mode | Future service | Active |
| --- | --- | --- | --- |
| SharePoint Panel Schedules | local xlsx | Microsoft Graph | ✅ |
| Procore RFI Log | csv export | Procore API | ✅ |
| Airtable Commissioning Tracker | csv export | Airtable API | ✅ |
| FacilityGrid | csv/xlsx export + TamperMonkey push | API / bridge | ✅ |
| GroupMe | json export | GroupMe API | ✅ |
| Excel Trackers | local xlsx | Scheduled ingest | ✅ |
| Bluebeam Markups | manual export | Bluebeam Studio API | ❌ (inactive) |

## Verified scale (as of 2026-07-04)

- **2,791** assets in the backend (single project, Wing 2 scope).
- **7,890** Procore RFIs processed; **69** matched to a known asset tag.
- **1,943** commissioning entries + **440** inspection entries from Airtable,
  across 264 rows.

(These are real, verified counts — see `brain/metrics/2026-07-04_phase3-import-counts.md`.)

## Phase history

- **Phase 1:** design system, component library, first Asset Detail Page (mock data).
  Leftovers: photo thumbnails, multi-project support.
- **Phase 2:** Supabase backend, panel-schedule circuits, constraint log — **live and verified.**
- **Phase 3 (current):** live connectors — Procore/Airtable adapters (done),
  shared ingest Edge Function (done), FacilityGrid live push (in progress), GroupMe
  live bot (abandoned — reverted to JSON export). See `clients/wing2/history.md`.
</content>
