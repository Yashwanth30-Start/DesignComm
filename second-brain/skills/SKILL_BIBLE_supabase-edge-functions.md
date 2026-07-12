# SKILL BIBLE — Supabase Edge Functions as a Shared Ingest Target

**Source:** CommissionOS Phase 3 (YAS-11, YAS-12, YAS-13). Real, verified.
**Date:** 2026-07-04.

## Core principle
One shared **ingest Edge Function** (Deno) is the single POST target for every
live-push connector. Connectors stay dumb; the function owns matching + upsert +
auth. Build the function independently of deploying it — deploy needs a human
(Supabase CLI login is `owner:human`).

## The exact shape
- **Auth:** a shared secret checked server-side on every POST. The `service_role`
  key is used **inside** the function only — never exposed client-side.
- **Matching:** incoming payloads (GroupMe-shaped or FacilityGrid-shaped) are scanned
  for known asset tags the same way the constraint-log adapter matches — text scan
  against the tag list.
- **Upsert:** into `history` / `inspections`.
- **CORS:** browser callers (the TamperMonkey script) need CORS headers **and** an
  `OPTIONS` preflight handler returning **204** with `Access-Control-Allow-*`.
  Missing this is the "Failed to fetch" error (YAS-13) — and the fix is server-side,
  not in the browser script.

## Specifics that matter
- **Verify end to end with curl:** secret auth passes → a real-tag payload matches
  across **all 2,791** assets → the row is visible through `get_assets_json()` (the
  app's path). Only then is it "done."
- **Pagination bug lives here too:** matching a payload against assets must page past
  1000 rows (PostgREST default) or high-numbered tags never match (YAS-12).
- **Clean up debug branches:** a temporary `debug` branch was left in `index.ts` after
  deploy — harmless but should be removed once the final version is pasted.

## Common mistakes
- Exposing `service_role` client-side. Never. Server-side only.
- Forgetting the OPTIONS preflight → "Failed to fetch" from browser callers.
- Calling it done from a local test instead of an RPC-verified round trip.

## Quality checklist
- [ ] Secret checked server-side; `service_role` never leaves the function.
- [ ] CORS headers + OPTIONS preflight (204) present for browser callers.
- [ ] Matching pages past 1000 rows.
- [ ] Verified end-to-end via curl → RPC visibility.
- [ ] Debug branches removed before final.
</content>
