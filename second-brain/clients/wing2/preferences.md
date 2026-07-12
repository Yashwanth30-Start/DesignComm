# Wing 2 — Preferences

Style and working preferences for this project (softer than `rules.md` — these are
"how Yashwanth likes it", not hard constraints).

- **Report counts with denominators.** "69/7890 RFIs matched", not "some matched".
- **Status stated plainly and with the reason:** *done / in progress / blocked /
  canceled — and why*. See the issue write-up style in `history.md`.
- **Prefer manual export over live API** until a real bottleneck justifies the risk.
- **Prefer browser-based preview** (StackBlitz/CodeSandbox) for quick UI checks —
  the work laptop can't run a local build.
- **iPad/PWA is a first-class target.** Assume field use; test PWA behavior, not just
  desktop.
- **Cost-conscious.** Flag anything that burns Netlify build minutes or Supabase
  usage; propose the cheaper path.
- **Clean, reviewable git diffs.** Additive changes, secrets excluded, one concern
  per change.
</content>
