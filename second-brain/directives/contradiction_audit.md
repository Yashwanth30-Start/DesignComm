# Contradiction Audit (maintenance)

## What this workflow is
Every few weeks, read the brain looking for notes that disagree with each other, so
it stays trustworthy. A brain that is never audited slowly becomes one you stop
trusting — and then stop using.

## Prerequisites
- `brain/INDEX.md` current.

## Process
1. Read every note in `brain/` (index first, then the notes).
2. Flag disagreements: old vs new asset/RFI counts, stale connector status (e.g. a
   note calling GroupMe "live" after the bot was abandoned), reversed decisions,
   out-of-date scope (Wing 2 vs future multi-project).
3. Present each conflict as: note A vs note B, what disagrees, which looks newer.
4. **You (human) rule on each one.** The agent proposes; it does not silently
   overwrite recorded decisions.
5. Update the losing note with a dated correction and a link to the winning note.
   Never delete the history — supersede it.

## Quality gates
- [ ] Every flagged conflict names both notes and the newer-looking one.
- [ ] No decision reversed without an explicit human ruling.
- [ ] Corrections are dated and link to the superseding note.

## Also run: the wikilink / orphan pass
Once the brain passes ~20 notes, and after every bulk import from `sources/`, run
the linking prompt in `sources/README.md` to add `[[wikilinks]]` and report orphans.
</content>
