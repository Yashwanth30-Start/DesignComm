# Wing 2 — Hard Rules

Non-negotiable constraints for any work touching this project. Break one and you risk
the real company environment or the trust in the data.

1. **The public site never contains real project data.** Only `web/` contents ship to
   the public GitHub repo; the pipeline, adapters, and real exports stay confidential.
   The deployed site *reads* real data locally (IndexedDB, user's browser) — it never
   uploads it.

2. **Additive-only on live/field tooling.** The FacilityGrid TamperMonkey script gets
   new code paths (e.g. the "Push to CommissionOS" button), never rewrites of existing
   behavior. Same for anything touching the live environment.

3. **No automated actions in the real company GroupMe.** A bot creation posted a
   visible "X added a bot" system message to the real group (YAS-10). No live automated
   posting/creation without explicit human go-ahead. GroupMe data comes via **JSON
   export** only, for now.

4. **`owner:human` steps stop the agent.** External account signups, physical file
   exports, live device/iPad testing, Supabase CLI login, Netlify account actions — the
   agent hands these back with a clear ask, never fakes completion.

5. **Every data change verified via Supabase RPC** (`get_assets_json()`) before it's
   called done.

6. **Never fabricate asset tags, RFI numbers, counts, or trade/personnel names.**
   Unmatched → reported. Unknown → `[TODO: confirm]`. The mock-data names are not real.

7. **Watch Netlify build-minute / credit usage.** Batch code deploys; don't deploy per
   tweak.
</content>
