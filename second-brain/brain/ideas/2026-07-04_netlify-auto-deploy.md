# Idea: Netlify auto-deploy via API token

**Date:** 2026-07-04
**Status:** Open decision (not a commitment)
**Source:** YAS-17 (decide), YAS-18 (implement) — both Low priority

Every code change currently needs a manual zip-drag to Netlify (data is already live
via Supabase, so this is code-only). A Netlify personal access token in `.env` (never
committed) would let the agent `npm run deploy` directly and push `public/`.

**The open question:** it adds automation but **does not reduce build minutes
consumed** — and Netlify credit usage is being watched. So the value is convenience,
not cost. Per `context/core_values.md` §7 (cost-aware automation), this waits until
the manual step is a real bottleneck.

## Related
- `directives/deploy_to_netlify.md`
- `context/owner.md`
</content>
