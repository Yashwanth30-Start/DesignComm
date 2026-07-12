# Decision: Every task is labeled owner:human or owner:agent

**Date:** 2026-07-04
**Status:** Active
**Source:** Project convention (stated in the Phase 3 project description)

## Decision
Each issue carries an ownership label:
- **`owner:human`** — only Yashwanth can do it: external account signup, physical file
  export, live device/iPad testing, Supabase CLI login, Netlify account actions.
- **`owner:agent`** — Claude Code builds and verifies without further input once
  unblocked.

## Because
It removes ambiguity about who is blocked on what, so neither side waits on the other
by accident. The agent never fakes completion of a human-only step; the human never
gets pinged for something the agent can finish alone.

## Consequences
- The agent stops at `owner:human` steps and hands back a clear ask.
- Example split: YAS-6/YAS-8 (export samples) = human; YAS-7/YAS-9 (build adapters) =
  agent. YAS-12 deploy needed human CLI login even though the code was agent-built.

## Related
- [[2026-07-04_additive-only-on-live-tooling]]
- `context/core_values.md` §6
</content>
