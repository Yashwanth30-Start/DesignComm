# Brain INDEX — master map

One line per note. Read this first, then open only what's relevant. Newest facts win;
when two notes disagree, run `directives/contradiction_audit.md`.

## Decisions
- [[2026-07-04_no-live-groupme-bot]] — GroupMe live bot abandoned; JSON export instead (bot posted a visible message to the real company group).
- [[2026-07-04_manual-export-adapter-pattern]] — Manual export → adapter → verify-via-RPC is the default for every source.
- [[2026-07-04_owner-human-vs-agent-convention]] — Every task labeled owner:human or owner:agent.
- [[2026-07-04_additive-only-on-live-tooling]] — Field/live tooling gets additive changes only, never rewrites.
- [[2026-07-04_plain-text-and-manual-export-first]] — Public site never holds real data; verify every data change via RPC.

## Notes (narrative memory)
- [[2026-07-04_shared-ingest-edge-function]] — Shared Supabase Edge Function build; fixed pagination + CORS bugs.
- [[2026-07-04_ipad-pwa-search-input-quirk]] — iOS PWA search-input fix; needs real-iPad verification (owner:human).

## References (durable facts)
- [[integration-sources-roster]] — The 7 data sources, ingest modes, adapters.
- [[data-model]] — NormalizedRecord shape, record types, statuses, read path.
- [[wing2-scope-areas]] — Active A500–C700; D/E 600–700 out of scope.

## Metrics (dated snapshots)
- [[2026-07-04_phase3-import-counts]] — 2,791 assets; 69/7890 RFIs; 1,943+440 from Airtable.

## Ideas (not commitments)
- [[2026-07-04_netlify-auto-deploy]] — API-token deploy; open (doesn't cut build minutes).
- [[2026-07-04_multi-project-support]] — Project switcher; deferred until a 2nd project exists.
- [[2026-07-04_photo-thumbnails]] — Real thumbnails; blocked on where photos live.
</content>
