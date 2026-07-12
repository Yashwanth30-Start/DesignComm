# Decision: No live GroupMe bot — use JSON export instead

**Date:** 2026-07-04
**Status:** Active
**Source:** YAS-10, YAS-14

## Decision
We will **not** run a live GroupMe bot to ingest field messages. GroupMe data comes
in via **JSON export**, processed by a manual-export adapter.

## Because
On bot creation, GroupMe automatically posted a visible **"X added a bot"** system
message into the *real company group*. Neither expected nor directly triggered by us,
and it had to be cleaned up. An automated integration that produces visible,
uncontrollable side effects in a live company channel is not worth the ingest
convenience. The manual export gets the same data with zero blast radius.

## Consequences
- YAS-14 (wire bot to Edge Function) canceled as superseded.
- The [[2026-07-04_manual-export-adapter-pattern]] now covers GroupMe too.
- Live API/bot may be revisited later if a real-time need appears — but only with an
  explicit plan for side effects.

## Related
- [[2026-07-04_manual-export-adapter-pattern]]
- [[2026-07-04_additive-only-on-live-tooling]]
- Full log: `clients/wing2/history.md`
</content>
