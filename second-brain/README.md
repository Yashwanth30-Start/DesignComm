# CommissionOS — Second Brain

A plain-text operating system for the CommissionOS business, built from the "Second
Brain Blueprint" (Doby Lanete, DobotAI) and populated from real project data (the
Linear project *CommissionOS — Phase 3: Live Connectors* and the product repo).

## How to use it
1. Open this folder as a **vault in Obsidian** (free) to follow the `[[wikilinks]]`,
   see backlinks, and view the graph.
2. Point any capable AI agent (Claude Code, etc.) at this folder. It reads
   **`CLAUDE.md` first**, every session — that's the operating manual.
3. Do real work through the `directives/`. The system improves itself after each task
   (self-annealing).

## Layout
```
CLAUDE.md      Operating manual — read first, every session
context/       Who we are: company, brand_voice, core_values, owner
directives/    SOPs: build_import_adapter, deploy_to_netlify, contradiction_audit
execution/     Notes on the deterministic scripts (real code lives in the product repo)
skills/        SKILL_BIBLE_*: adapters, edge functions, asset-tag matching
clients/wing2/ The one active project: profile, rules, preferences, history
brain/         INDEX + decisions / notes / references / metrics / ideas (dated, linked)
sources/       Raw exports to mine (kept local — may contain confidential data)
```

## What's real vs. placeholder
- **Real (mined from Linear + repo):** the DOE architecture, all Phase 3 build history,
  verified counts (2,791 assets; 69/7890 RFIs; 1,943+440 Airtable), decisions, the
  connector roster, the data model, and the owner's working constraints.
- **`[TODO: confirm]` placeholders:** business model/pricing, project owner/GC identity,
  trade & personnel names (the app's mock-data names are **fixtures, not real facts**),
  and the owner's professional background. Per the standing rules, these were left as
  placeholders rather than fabricated — fill them in via the record-and-transcribe method.

## Next steps to deepen it
1. Drop real exports into `sources/` and run a mining session.
2. Fill the `[TODO: confirm]` placeholders in `context/` and `clients/wing2/`.
3. Once past ~20 notes, run the wikilink/orphan pass (`sources/README.md`).
4. Run a contradiction audit every few weeks (`directives/contradiction_audit.md`).
</content>
