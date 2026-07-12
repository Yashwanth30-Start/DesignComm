# Execution Layer

Deterministic scripts the AI calls so judgment-free work runs identically every
time. **The real code lives in the product repo/pipeline, not here** — this folder
documents what exists so the agent knows what it can call. (Only `web/` is public;
the pipeline and adapters are confidential and stay out of the public repo.)

## Known scripts (from the CommissionOS project)

| Script | Purpose | Provenance |
| --- | --- | --- |
| `import/adapters/40-procore-rfi.mjs` | Normalize Procore RFI CSV → `documents.csv` (Source=Procore), match to asset tags | YAS-7 |
| `import/adapters/50-airtable-inspections.mjs` | Airtable rows → commissioning + inspection records (expands batch-of-tags rows) | YAS-9 |
| Shared **ingest Edge Function** (Supabase, Deno) | Single POST target for FacilityGrid push (and formerly GroupMe); upserts into `history`/`inspections` using `service_role` server-side; CORS + OPTIONS preflight | YAS-11, YAS-12, YAS-13 |
| `data/incoming/FGAS *.txt` (TamperMonkey) | FacilityGrid browser bridge with additive "Push to CommissionOS" button (`pushToCommissionOS()`), v1.8.0 | YAS-13 |
| `run-all.ps1` | Runs the full pipeline over exports in `../pipeline/output/` | web/README |
| Supabase RPCs `get_assets_json()` / `get_assets()` | The read path the app uses; also the verification path for every data change | YAS-9/11/12 |

## Rules
- Deterministic in → deterministic out. If a script's output can vary for the same
  input, it has a bug.
- Verify a script's effect through the same RPC the app reads, not the raw table.
- Field/browser scripts are **additive-only** — new code paths, never rewrites.
- `service_role` and other secrets are server-side only; never committed, never
  shipped to the client.
</content>
