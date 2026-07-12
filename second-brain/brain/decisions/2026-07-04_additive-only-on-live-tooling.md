# Decision: Additive-only changes on live / field tooling

**Date:** 2026-07-04
**Status:** Active
**Source:** YAS-13 (FacilityGrid TamperMonkey), YAS-10 (GroupMe)

## Decision
Changes to tooling running in the live company environment (the FacilityGrid
TamperMonkey script, connectors, anything field-facing) are **additive only** — add a
new code path, never rewrite existing behavior.

## Because
Field tooling runs where a mistake is immediately visible to real colleagues and can
disrupt real work. An additive change is trivially reversible and can't regress the
existing flow. The GroupMe incident ([[2026-07-04_no-live-groupme-bot]]) is the
cautionary tale for underestimating live side effects.

## Consequences
- The "Push to CommissionOS" button was *added* to the FGAS script (v1.7.4 → v1.8.0);
  nothing existing was rewritten.
- When the push failed ("Failed to fetch"), the fix went **server-side** (CORS +
  OPTIONS preflight on the Edge Function), not into the live browser script.

## Related
- [[2026-07-04_shared-ingest-edge-function]]
- [[2026-07-04_no-live-groupme-bot]]
</content>
