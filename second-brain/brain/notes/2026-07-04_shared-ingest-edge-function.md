# Note: Shared ingest Edge Function build

**Date:** 2026-07-04
**Source:** YAS-11, YAS-12, YAS-13

One Supabase Edge Function (Deno) is the single POST target for every live-push
connector. It authenticates a shared secret server-side, matches the payload to asset
tags by text scan, and upserts into `history`/`inspections` using `service_role`
(never client-exposed).

Deployed via Supabase CLI (an `owner:human` step, per
[[2026-07-04_owner-human-vs-agent-convention]]). Verified end-to-end via curl: secret
auth passes → a real GroupMe-shaped payload matched a tag across **all 2,791 assets**
→ row visible through `get_assets_json()`.

Two fixes surfaced during testing, both now standing lessons:
- **PostgREST 1000-row pagination bug** — matching only saw the first 1000 assets
  until the query paged through all 2,791.
- **CORS "Failed to fetch"** from the browser (FacilityGrid) caller — fixed by adding
  CORS headers + an `OPTIONS` preflight (204) server-side, not in the browser script
  ([[2026-07-04_additive-only-on-live-tooling]]).

Cleanup outstanding: remove the temporary `debug` branch in `index.ts`.

## Related
- [[2026-07-04_manual-export-adapter-pattern]]
- [[2026-07-04_phase3-import-counts]]
- `skills/SKILL_BIBLE_supabase-edge-functions.md`
</content>
