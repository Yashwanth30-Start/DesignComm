# Decision: Public site never holds real data; plain-text + verify-via-RPC discipline

**Date:** 2026-07-04
**Status:** Active
**Source:** web/README, project convention

## Decision
1. Only the `web/` folder is public. Real project data, the pipeline, and adapters
   stay confidential and out of the public repo.
2. The deployed site *reads* real data locally (browser IndexedDB) but never uploads
   it.
3. Every data change is verified through the same Supabase RPC the app reads
   (`get_assets_json()`), never trusted from a local file.

## Because
The site is public with no login. Confidential commissioning data must never leak
through it. And a data-trust product cannot afford "should be there" — it must confirm
through the real read path. This mirrors the Second Brain thesis itself: plain text,
version-controlled, no un-diffable state.

## Consequences
- Two-repo-shape deploy discipline (see `directives/deploy_to_netlify.md`).
- "Verified via RPC" is the definition of done for data work
  ([[2026-07-04_phase3-import-counts]]).

## Related
- [[2026-07-04_manual-export-adapter-pattern]]
- [[integration-sources-roster]]
</content>
