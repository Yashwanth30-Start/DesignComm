# Deploy the Web App to Netlify

## What this workflow is
Ship a code change to the public CommissionOS site. The dev laptop has no local
Node/npm/git, so the build happens on Netlify's servers. Data is already live via
Supabase — this workflow is for **code** changes only.

## Prerequisites
- Only the contents of `web/` are ever uploaded to GitHub (the site is public with
  no login; `../pipeline/` and real project data must never be pushed).
- `netlify.toml` correctly placed for the repo shape (see below).

## Inputs
| Field | Required | Description |
| --- | --- | --- |
| Repo shape | yes | A (`web/` is a subfolder → root `netlify.toml` needs `base = "web"`) or B (contents of `web/` at repo root → no `base`) |
| Change scope | yes | What changed and whether a service-worker version bump is needed |

## Process
1. Confirm the repo shape (open the repo on github.com — is there a `web/` folder at
   root? → Shape A).
2. Ensure exactly **one** `netlify.toml`, at the true repo root, matching the shape.
3. If a client-cached asset changed (search input, PWA behavior), **bump the service
   worker version** so clients pick it up (SW was bumped to v5 in YAS-5).
4. Trigger deploy in Netlify: **Build & deploy → Trigger deploy → Clear cache and
   deploy site.**
5. Watch the build log: expect `npm install` (~15 packages, several seconds) then
   `next build`. `Detected 0 framework(s)` means `netlify.toml` is misplaced.

## Quality gates
- [ ] Only `web/` contents are in the public repo — no pipeline/real data.
- [ ] Exactly one `netlify.toml`, correct for the repo shape.
- [ ] Build log shows real `npm install` + `next build`, not "No build steps found".
- [ ] Cost check: this consumes build minutes — batch changes, don't deploy per-tweak
      (Netlify credit usage is watched; see YAS-17).

## Edge cases
- **iOS Safari / PWA:** verify on a plain Safari tab first, then the installed PWA
  (`owner:human` — needs a real iPad; the agent can only confirm in desktop Chromium).
- **Faster iteration:** for preview without spending build minutes, paste into
  StackBlitz/CodeSandbox (browser-only, no install).
- **Auto-deploy:** a Netlify API token could remove the manual zip-drag, but it
  doesn't reduce build minutes — decision still open (YAS-17/YAS-18).
</content>
