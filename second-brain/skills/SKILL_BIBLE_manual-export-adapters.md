# SKILL BIBLE — Manual-Export Adapters

**Source:** CommissionOS Phase 3 build (YAS-7, YAS-9, YAS-11, YAS-12). Real,
verified. **Date:** 2026-07-04.

## Core principle
The reliable way to onboard a new data source is not a live API — it's: a human
exports a real sample → the agent inspects the *actual* columns → writes a small
numbered adapter → merges → verifies via RPC. Boring, controllable, reversible.

## The exact pattern
1. **Numbered module** in `import/adapters/` — the two-digit prefix sets run order
   (`40-procore-rfi.mjs` runs before `50-airtable-inspections.mjs`).
2. **Normalize** each row to the common record shape: `source`, `sourceRecordId`,
   `recordType`, `primaryLabel`, `secondaryLabel`, `status`, `assetKeys[]`,
   `panelKeys[]`, plus `Source=` for provenance.
3. **Match** to asset tags (see the asset-tag-matching skill). Record the fraction.
4. **Merge** into the right target (`documents.csv` for RFIs; `history` /
   `inspections` for field/inspection data).
5. **Verify** through `get_assets_json()` — the app's own read path.

## Specifics that matter (with numbers)
- **Procore:** 69/7890 RFIs matched a known tag via **Subject/Location substring**
  match. A low match rate is expected for a cross-system RFI log — report it, don't
  force matches. Example target row: "#1432 - FSD cct changed".
- **Airtable:** one row often covers a **batch of 20+ tags**. 264 rows expanded into
  **1,943 commissioning + 440 inspection** records. Expand-then-match, not match-then-expand.
- **Commissioning card** was always empty before the Airtable adapter — it's the
  card most dependent on this source.

## Common mistakes (each cost a real bug)
- **Character-slicing dates.** US-format dates were sliced at fixed positions instead
  of split on the delimiter → mangled times (YAS-9). Always `split`, never slice.
- **Ignoring PostgREST pagination.** Default page is 1000 rows; with 2,791 assets a
  naive query silently matched against only the first 1000 (YAS-12). Loop until exhausted.
- **Trusting the local file.** "Written to CSV" ≠ "visible in the app." Verify via RPC.

## Quality checklist
- [ ] Inspected the real export before writing a line of adapter.
- [ ] Match rate reported with denominator.
- [ ] Dates split, not sliced.
- [ ] Pagination handled for >1000 rows.
- [ ] Verified live via `get_assets_json()`.
- [ ] `Source=` set; unmatched rows reported, not force-matched.
</content>
