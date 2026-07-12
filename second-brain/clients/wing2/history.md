# Wing 2 — Project History

Dated log of every meaningful build/decision. The institutional memory that would
otherwise live in one head. Newest at top. Source: Linear project *CommissionOS —
Phase 3: Live Connectors* (team YAS).

---

## 2026-07-04 — GroupMe live bot abandoned; reverted to JSON export (YAS-10, YAS-14)
Created a GroupMe bot to callback-URL-ingest field messages. On creation, GroupMe
auto-posted a visible **"X added a bot"** system message into the *real company
group* — unanticipated, had to be cleaned up. Bot deleted. Live GroupMe integration
off the table for now. **Interim path:** Yashwanth shares a GroupMe JSON export;
agent builds an adapter (same manual-export pattern as Procore/Airtable). YAS-14
(wire bot to Edge Function) canceled as superseded.
→ Decision: `brain/decisions/2026-07-04_no-live-groupme-bot.md`

## 2026-07-04 — FacilityGrid live-push button added; CORS fixed (YAS-13, in progress)
Added an **additive-only** "Push to CommissionOS" button + `pushToCommissionOS()` to
the FacilityGrid TamperMonkey script (`FGAS 1.7.1.txt`, v1.7.4 → **v1.8.0**). First
user test hit "Failed to fetch"; fixed **server-side** by adding CORS headers + an
`OPTIONS` preflight (204) to the ingest Edge Function — not a change to the browser
script. Verified via curl (preflight + simulated POST). Waiting on next real user
test; no further agent work needed.

## 2026-07-04 — Shared ingest Edge Function built + deployed (YAS-11, YAS-12)
One Supabase Edge Function (Deno) as the POST target for both GroupMe (then) and
FacilityGrid push. Uses `service_role` server-side to upsert into
`history`/`inspections`; matches payloads to asset tags by text scan. Deployed via
Supabase CLI (human step). Verified end-to-end via curl: secret auth passes, a real
GroupMe-shaped payload matched a tag across **all 2,791 assets**, row visible through
`get_assets_json()`. **Fixed a PostgREST 1000-row pagination bug** found in testing.
Cleanup left: remove the temporary `debug` branch in `index.ts`.

## 2026-07-04 — Airtable inspection adapter (YAS-8, YAS-9, done)
Built `import/adapters/50-airtable-inspections.mjs`. Each Airtable row covers a batch
of 20+ tags; **264 rows → 1,943 commissioning + 440 inspection** records. The
commissioning card (previously always empty) now has real data. **Fixed a
date-formatting bug** (US dates were character-sliced instead of split, mangling
times). Verified via Supabase RPC.

## 2026-07-04 — Procore RFI adapter (YAS-6, YAS-7, done)
Built `import/adapters/40-procore-rfi.mjs`. **69/7890** RFIs matched a known asset tag
(Subject/Location substring) and merged into `documents.csv` (Source=Procore).
Verified via Supabase RPC.

## (pre-Phase 3) — Phase 2 complete
Supabase backend, panel-schedule circuits, and constraint log live and verified.

## Open / carried forward
- **YAS-5 (High, owner:human):** verify search-input fix on real iPad (Safari tab +
  installed PWA). Switched input `type=search`→`text` + explicit clear button, SW→v5,
  to fix backspace/click-through (suspected iOS PWA quirk). Confirmed fixed in desktop
  Chromium; not reproducible/testable without the real iPad.
- **YAS-15 (Low):** photo thumbnails — `photos` is a count only; needs a decision on
  where photo files/links live.
- **YAS-16 (Low):** multi-project UI switch (data model ready; waits for a 2nd project).
- **YAS-17 / YAS-18 (Low):** Netlify API-token auto-deploy — decision open; doesn't
  reduce build minutes.
</content>
