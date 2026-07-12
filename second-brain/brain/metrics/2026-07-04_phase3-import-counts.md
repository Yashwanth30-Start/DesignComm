# Metrics snapshot — Phase 3 import counts

**Date:** 2026-07-04 (dated snapshot — do not update in place; add a new dated note)
**Source:** YAS-7, YAS-9, YAS-11/12 (all verified via Supabase RPC)

| Metric | Value | Notes |
| --- | --- | --- |
| Assets in backend | **2,791** | single project, Wing 2 scope |
| Procore RFIs processed | **7,890** | full RFI log |
| RFIs matched to an asset tag | **69** | Subject/Location substring; low is expected |
| Airtable rows processed | **264** | each covers a batch of 20+ tags |
| Commissioning entries produced | **1,943** | from the 264 rows |
| Inspection entries produced | **440** | from the 264 rows |
| FacilityGrid TamperMonkey script | **v1.8.0** | v1.7.4 → v1.8.0, added push button |

All figures verified through `get_assets_json()`, the app's own read path. Numbers are
real and must never be rounded into vagueness or fabricated
([[2026-07-04_plain-text-and-manual-export-first]]).

## Related
- [[integration-sources-roster]]
- [[2026-07-04_manual-export-adapter-pattern]]
- [[2026-07-04_shared-ingest-edge-function]]
</content>
