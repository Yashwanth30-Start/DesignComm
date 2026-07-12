# SKILL BIBLE — Matching Records to Asset Tags

**Source:** CommissionOS Phase 3 adapters + ingest function (YAS-7, YAS-9, YAS-11).
Real, verified. **Date:** 2026-07-04.

## Core principle
Every incoming record from every source is only useful if it ties back to a physical
**asset tag**. The asset tag is the join key of the entire system. Matching is
fuzzy, one-directional (record → tag), and honest about its miss rate.

## Match strategies (pick per source)
- **Substring on Subject/Location** (Procore RFIs): scan the RFI's subject and
  location text for any known tag. Result: 69/7890 matched. Low is fine for RFIs.
- **Batch-of-tags per row** (Airtable): one row lists many tags; expand to one record
  per tag, then each is a direct match.
- **Free-text scan** (GroupMe / FacilityGrid push): scan the message body for known
  tags, same as the constraint-log adapter.

## Non-negotiables
- **Never fabricate a tag to force a match.** Unmatched rows are *reported*, not
  invented into existence. The count of unmatched is itself signal.
- **Match against the full asset set.** With 2,791 assets, PostgREST's 1000-row
  default silently drops the rest — page until exhausted, or high tags never match.
- **Report the fraction.** "69/7890" tells the reader the match quality; "matched
  some" tells them nothing.

## Tag shapes seen in the data
- Damper/device tags: `FSD-13`, `FSD cct changed` (RFI subject style).
- Panel tags: `KSPA1W2-3B1-2A3` (panel), with circuit numbers like `08`/`CKT08`.
- Areas: `A500`–`C700` active (Wing 2 scope); `D/E 600–700` out of scope.

## Quality checklist
- [ ] Match rate reported with denominator.
- [ ] Matched against the complete asset set (pagination handled).
- [ ] Unmatched rows reported, never force-matched.
- [ ] Tag comparison handles the real tag formats above.
</content>
