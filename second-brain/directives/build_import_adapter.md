# Build a Manual-Export Import Adapter

## What this workflow is
Given a raw export from an external source (Procore RFIs, Airtable commissioning,
FacilityGrid, GroupMe, an Excel tracker), produce a normalized adapter that maps its
rows into CommissionOS's common record shape and merges them into the backend,
matched to real asset tags. This is the single most repeated workflow in the project
(it produced YAS-7, YAS-9, YAS-11).

## Prerequisites
- The real export sample dropped into `data/incoming/_source/` (an `owner:human`
  step — someone must export the file first; see YAS-6, YAS-8).
- Supabase access + the RPCs used for verification (`get_assets_json()`).
- `skills/SKILL_BIBLE_manual-export-adapters.md` and
  `skills/SKILL_BIBLE_asset-tag-matching.md`.

## Inputs
| Field | Required | Description |
| --- | --- | --- |
| Source name | yes | e.g. "Procore RFI Log", "Airtable Commissioning Tracker" |
| Export file | yes | Real sample in `data/incoming/_source/` |
| Target record type | yes | rfi / commissioning_schedule / inspection_readiness / field_message |
| Match strategy | yes | How rows tie to asset tags (substring on Subject/Location, explicit tag column, batch-of-tags-per-row) |

## Process
1. **Inspect the real export first.** Read actual column names and shapes — never
   assume. Note quirks (date formats, one row covering many tags, etc.).
2. **Write the adapter** as a numbered module in `import/adapters/`
   (`40-procore-rfi.mjs`, `50-airtable-inspections.mjs` — the number sets run order).
3. **Map to the normalized record shape** (see `brain/references/data-model.md`):
   `source`, `sourceRecordId`, `recordType`, `primaryLabel`, `assetKeys`, `status`, etc.
4. **Match rows to asset tags** per the chosen strategy. Record the match rate with
   its denominator (e.g. "69/7890 matched").
5. **Merge** into the target (`documents.csv` / `history` / `inspections`) with the
   correct `Source=` value.
6. **Verify live** via Supabase RPC — confirm the new rows are visible through the
   exact path the app reads (`get_assets_json()`), not just in the local file.

## Quality gates
- [ ] Match rate reported as a fraction with its denominator, not "some".
- [ ] Date fields parsed by **splitting on the delimiter**, never character-slicing
      (the YAS-9 bug: US-format dates got sliced and mangled).
- [ ] Rows verified present via Supabase RPC, not just written locally.
- [ ] `Source=` set correctly so provenance is traceable.
- [ ] No fabricated asset tags — unmatched rows are reported, not force-matched.

## Edge cases
- **One row → many tags** (Airtable): a single row can cover 20+ tags; expand it
  into one record per tag before matching.
- **>1000 rows:** PostgREST paginates at 1000. Loop until exhausted or you'll
  silently miss matches (the YAS-12 pagination bug across 2,791 assets).
- **US vs ISO dates:** split on `/` or `-`, don't slice fixed positions.
- **Low match rate is normal** for cross-system logs (69/7890 for Procore) — report
  it, don't panic-match.
</content>
