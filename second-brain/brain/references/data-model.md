# Reference: CommissionOS Data Model

**Date:** 2026-07-04 (durable — mirrors `web/types/domain.ts`)
**Source:** `web/types/domain.ts`, integration-contract, `backend/schema.sql`

## The join key
Everything ties to a physical **asset tag** via `assetKeys[]` (and `panelKeys[]`).
See [[asset-tag-matching]] / `skills/SKILL_BIBLE_asset-tag-matching.md`.

## NormalizedRecord (the common shape every adapter targets)
`source`, `sourceRecordId`, `sourcePath`, `sourceSheet?`, `recordType`,
`primaryLabel`, `secondaryLabel?`, `status?`, `area?`, `location?`, `trade?`,
`assetKeys[]`, `panelKeys[]`.

## RecordType values
`panel_schedule`, `panel_circuit`, `rfi`, `commissioning_schedule`,
`inspection_readiness`, `asset`, `constraint`, `checklist`, `document`,
`field_message`, `tracker_row`.

## Workflow statuses
`ready | waiting | blocked | commissioned | complete` (mapped to StatusPill colors).

## Circuit statuses
`energized | de-energized | blocked | spare`.

## Asset timeline stages (typical order)
Installed → Documentation → TY Inspection → City Inspection → Energized → Startup →
Commissioned → AHJ → Turnover.

## Read path
The app reads via Supabase RPC `get_assets_json()` / `get_assets()` — also the
verification path for every data change ([[2026-07-04_plain-text-and-manual-export-first]]).

## Related
- [[integration-sources-roster]]
- [[wing2-scope-areas]]
</content>
