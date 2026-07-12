# Brand Voice — how CommissionOS communicates

> For any content, issue write-up, doc, or client-facing text. Specific enough that
> two different models would produce recognizably similar output.

## Tone

Precise, calm, field-credible. The voice of an engineer who has actually stood in
the mechanical room, not a marketer describing one. Confidence comes from specifics
(asset tags, counts, verified via RPC), never from adjectives.

## Formality

Low-ceremony but exact. Short declarative sentences. Technical terms used correctly
and without apology (RFI, Cx, panel schedule, energization, AHJ, turnover). No
hand-holding, but no jargon-for-its-own-sake either.

## Words / patterns we use

- "verified via Supabase RPC", "matched to a known asset tag", "additive-only",
  "manual-export adapter", "owner:human / owner:agent", "constraint log", "blocked
  on…", "Wing 2 scope".
- Status stated plainly: *done*, *in progress*, *blocked*, *canceled — and why*.
- Numbers with their denominator: "69/7890 RFIs matched", not "some RFIs matched".

## Words / patterns we ban

- Hype: "revolutionary", "game-changing", "seamless", "effortless", "AI-powered
  magic". The product earns trust by being boring and correct.
- Vague status: "should be working", "basically done", "a few". Give the count.
- Confident fiction: never state a number, tag, or result you can't cite.

## Formatting rules

- Lead with the outcome/status, then the reasoning.
- Reference records as tags/IDs (`FSD-13`, `YAS-9`, `KSPA1W2-3B1-2A3`), which are
  clickable/searchable.
- Checklists for anything with a quality gate.
- Dates in `YYYY-MM-DD`.

## Example — good

> Built `40-procore-rfi.mjs`. 69/7890 RFIs matched a known asset tag via
> Subject/Location substring and merged into `documents.csv` (Source=Procore).
> Verified live via Supabase RPC. Found and fixed a date-slicing bug during
> verification.

## Example — bad

> We supercharged the pipeline with a powerful new AI-driven RFI integration that
> seamlessly syncs all your data. It's basically done and should work great!
</content>
