# Reference: Integration Sources Roster

**Date:** 2026-07-04 (durable fact — update when a source's mode changes)
**Source:** `web/lib/mock-data.ts` INTEGRATION_SOURCES + Phase 3 issues

| Source | Current ingest mode | Future service | Active | Adapter / notes |
| --- | --- | --- | --- | --- |
| SharePoint Panel Schedules | local xlsx | Microsoft Graph | ✅ | Phase 2 |
| Procore RFI Log | csv export | Procore API | ✅ | `40-procore-rfi.mjs` (YAS-7) |
| Airtable Commissioning Tracker | csv export | Airtable API | ✅ | `50-airtable-inspections.mjs` (YAS-9) |
| FacilityGrid | csv/xlsx export + TamperMonkey push | API / bridge | ✅ | FGAS v1.8.0 push (YAS-13) |
| GroupMe | json export | GroupMe API | ✅ | export only — no live bot ([[2026-07-04_no-live-groupme-bot]]) |
| Excel Trackers | local xlsx | Scheduled ingest | ✅ | Phase 2 |
| Bluebeam Markups | manual export | Bluebeam Studio API | ❌ | inactive |

All live-push sources POST to the shared ingest Edge Function
([[2026-07-04_shared-ingest-edge-function]]). All export-based sources follow the
[[2026-07-04_manual-export-adapter-pattern]].

## Related
- [[data-model]]
- [[2026-07-04_phase3-import-counts]]
</content>
