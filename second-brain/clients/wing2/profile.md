# Client / Project Profile — Wing 2

> The single active CommissionOS deployment. Loaded before any project-specific work.
> `[TODO: confirm]` = placeholder, not fabricated fact.

## Who / what
- **Project:** Wing 2 of a large construction commissioning job.
  `[TODO: confirm — project owner, general contractor, building name/location.]`
- **CommissionOS role:** aggregates and surfaces the commissioning state of every
  asset in Wing 2.

## Scope
- **In scope (active):** areas **A500, A600, A700, B500, B600, B700, C500, C600,
  C700**.
- **Shown but out of scope (until platform expands):** D600, D700, E600, E700.
- **Multi-project:** the data model already carries a `project` field per asset
  (Wing 1 / Wing 2), but the UI doesn't yet switch projects (YAS-16, deferred until a
  second real project's data exists).

## Verified scale (2026-07-04)
- **2,791** assets in the backend.
- **7,890** Procore RFIs processed (69 tied to an asset).
- **1,943** commissioning + **440** inspection entries from Airtable (264 rows).

## Systems of record (the sources CommissionOS pulls from)
- **SharePoint** — panel schedules (xlsx)
- **Procore** — RFI log
- **Airtable** — commissioning + inspection tracker
- **FacilityGrid** — checklists / inspection readiness (browser bridge via TamperMonkey)
- **GroupMe** — field messages (JSON export; live bot abandoned)
- **Excel trackers** — misc
- **Bluebeam** — markups (inactive)

## Trades / people
`[TODO: confirm — real trade contractors and field contacts. The names in the app's
mock data (e.g. "Shambaugh & Son", "J. Alvarez", "FSD-13") are FIXTURES, not verified
project facts, and must not be treated as real.]`

## Stack
CommissionOS web app (Netlify) reading a Supabase backend; ingest via manual-export
adapters + a shared Edge Function. Used on desktop and as an installed PWA on iPad.
</content>
