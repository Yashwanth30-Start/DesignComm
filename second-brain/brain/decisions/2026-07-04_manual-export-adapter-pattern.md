# Decision: Manual-export adapters are the default onboarding path for any source

**Date:** 2026-07-04
**Status:** Active
**Source:** YAS-6/7 (Procore), YAS-8/9 (Airtable), YAS-10 (GroupMe fallback)

## Decision
Every new data source is onboarded by: a human exports a real sample → the agent
inspects the actual columns → writes a small numbered adapter → merges → verifies via
RPC. Live APIs are a later optimization, not the starting point.

## Because
- It is controllable and reversible; a bad run touches a CSV, not a live system.
- It sidesteps live-integration side effects (see [[2026-07-04_no-live-groupme-bot]]).
- It works within the locked-down laptop constraint and the `owner:human` export step.
- It proved out fast: Procore and Airtable adapters both shipped and verified on the
  same day (see [[2026-07-04_phase3-import-counts]]).

## Consequences
- Procore, Airtable, and GroupMe all follow this pattern.
- The reusable know-how lives in `skills/SKILL_BIBLE_manual-export-adapters.md`.
- Live push (FacilityGrid) exists too, but even that POSTs to a controlled Edge
  Function rather than a black-box integration
  ([[2026-07-04_shared-ingest-edge-function]]).

## Related
- [[2026-07-04_no-live-groupme-bot]]
- [[2026-07-04_shared-ingest-edge-function]]
- [[2026-07-04_phase3-import-counts]]
- [[data-model]]
</content>
