# CommissionOS — Business Brain (Operating Manual)

> This file is read automatically at the start of every session. It is the
> constitution of the system. Built from the "Second Brain Blueprint" (Doby
> Lanete, DobotAI, 2026-07-05) and populated from real CommissionOS project data.

---

## 1. Architecture — the DOE pattern

The system is split into three layers. Respect the boundaries.

| Layer | What it is | Job |
| --- | --- | --- |
| **DIRECTIVES** (`directives/*.md`) | SOPs in plain English | *What to do*, step by step |
| **ORCHESTRATION** (the AI agent — you) | The decision maker | Read context, pick the SOP, check quality |
| **EXECUTION** (`execution/`, real scripts in `../web`/pipeline) | Deterministic code | *How it gets done*: API calls, file/data work |

**Why the split matters:** models are probabilistic. Push everything that *can*
be deterministic (adapters, formatting, imports, RPC verification) into scripts
that run identically every time. Let the AI do only what it is uniquely good at:
reading context, judgment calls, checking quality.

**Rule of thumb:** same input → same output ⇒ it belongs in a script. Requires
judgment, taste, or context ⇒ it stays with the AI.

Two more principles:
- **Plain text is forever.** Everything here is markdown. No proprietary DB, no
  vendor lock-in. This mirrors the product's own thesis (see
  `brain/decisions/2026-07-04_plain-text-and-manual-export-first.md`).
- **The system improves itself (self-annealing).** After every task: if something
  broke, fix the script and update the SOP; if a better approach appeared, update
  the skill file; if a new edge case surfaced, add it to the directive.

---

## 2. Directory map

```
second-brain/
├── CLAUDE.md        - This file. Read first, every session.
├── context/         - Who we are: company, voice, values, owner
├── directives/      - SOPs: what to do, step by step
├── execution/       - Notes on the deterministic scripts (real code lives in the product repo)
├── skills/          - Deep domain expertise (SKILL_BIBLE_*.md)
├── clients/         - One folder per project/client (currently: Wing 2)
├── brain/           - Linked notes: decisions, history, references, metrics, ideas
├── sources/         - Raw exports the brain is mined from
└── .tmp/            - Scratch space for drafts (never committed)
```

---

## 3. Context loading priority

Before any task, load in this order:

1. `context/company.md` → Always first (who we are / what CommissionOS is)
2. `context/core_values.md` → Always (how we operate; check work against it)
3. `context/brand_voice.md` → For any content / writing
4. `clients/{name}/*.md` → For project-specific work (e.g. `clients/wing2/`)
5. `skills/` relevant files → Domain expertise for the task
6. `directives/` the SOP → The workflow itself
7. `brain/INDEX.md` → Then open only the linked notes that are relevant

---

## 4. Orchestration flow

For every request:
1. **Parse** the request — what is actually being asked?
2. **Find** the matching directive in `directives/`.
3. **Load** context per the priority list above (plus the relevant client folder).
4. **Execute** — call scripts for deterministic steps; do judgment steps yourself.
5. **Check quality** against the directive's quality gates and `core_values.md`.
6. **Deliver**, then run the self-annealing step (§6).

---

## 5. Standing rules

1. **Never fabricate numbers, results, client names, or asset tags.** Use a
   placeholder (`[TODO: confirm]`) and ask. Confident fiction is the one
   unforgivable failure here — the whole product is a trust layer over real
   commissioning data.
2. **Date everything, in the filename.** `YYYY-MM-DD_slug.md`. Undated facts
   become landmines the first time the project changes its mind.
3. **Extract specifics, not summaries.** A note with no numbers, names, dates, or
   exact phrasings is too shallow to change output.
4. **Respect ownership labels.** `owner:human` = only Yashwanth can do it
   (external signups, physical file exports, live device/iPad testing). `owner:agent`
   = the agent builds and verifies without further input once unblocked.
5. **Verify against the real backend, not just locally.** Data changes are
   confirmed via Supabase RPC (`get_assets_json()` / `get_assets()`), the same path
   the app uses — not by eyeballing a local file.
6. **Additive-only on live/field tooling.** The FacilityGrid TamperMonkey script
   and anything touching the real company's environment gets additive changes only,
   never rewrites (see `clients/wing2/rules.md`).
7. **Secrets never get committed.** `.env`, service-role keys, tokens stay out of
   git. `service_role` is server-side only, never client-exposed.

---

## 6. Self-annealing protocol

After every task:
- **Error occurred?** Fix the script, then update the directive's edge cases.
- **Better approach found?** Update the relevant `skills/SKILL_BIBLE_*.md`.
- **New edge case?** Add it to the SOP so it never breaks the same way twice.
- **Decision made?** Write a dated note in `brain/decisions/` with the reasoning.

Every few weeks, run a **contradiction audit**: read the brain for notes that
disagree (old vs new pricing, stale rosters, reversed decisions), flag them, and
rule on each. See `directives/contradiction_audit.md`.
</content>
</invoke>
