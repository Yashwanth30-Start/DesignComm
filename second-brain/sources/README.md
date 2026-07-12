# sources/ — raw exports the brain is mined from

Drop raw exports here, then have the agent mine them into dated `brain/` notes. This
is the shortcut: don't write history by hand — feed the AI the real exports.

## What belongs here
- GroupMe JSON exports (the ingest path now that the live bot is off — see
  `brain/decisions/2026-07-04_no-live-groupme-bot.md`).
- Procore RFI CSV/Excel exports.
- Airtable commissioning/inspection CSV exports.
- FacilityGrid CSV/XLSX exports.
- Excel trackers, old proposals, call transcripts, email threads.

## What must NOT go here (or anywhere public)
Real project data is confidential and the site is public — keep raw exports out of the
public `web/` repo entirely. `sources/` in this brain is for the *private* brain repo
only. Never commit real exports to the public site repo.

## The wikilink / orphan pass (run after every bulk import, once the brain has ~20 notes)

Paste this prompt verbatim:

> I read this vault in Obsidian. Go through every note in brain/ and add
> [[wikilinks]] connecting notes that genuinely share a client, a decision, a project,
> a person, or a lesson.
>
> Rules:
> - Link text must match the target note's filename exactly, so the link resolves in
>   Obsidian.
> - Only add a link where following it would teach the reader something real.
>   Relationships, not keyword matches.
> - Most notes should end up with 2 to 5 links. If a note honestly connects to nothing,
>   leave it alone and report it instead of forcing a link.
> - Add links only. Do not rewrite, trim, or improve any other content.
>
> When you are done, report: how many links you added, which notes are orphans with no
> connections, and the three most surprising connections you found.

## Then run a contradiction audit
See `directives/contradiction_audit.md`.
</content>
