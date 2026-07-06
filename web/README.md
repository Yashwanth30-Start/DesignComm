# CommissionOS — Web (V1)

Next.js 14 + TypeScript + Tailwind + Motion + React Three Fiber. This is the real CommissionOS product: a design system, a reusable component library, a cinematic scroll landing page, and the first Asset Detail Page. It renders typed mock data (`lib/mock-data.ts`) — no live integrations yet, by design (see `../docs/integration-contract.md`).

**Only ever upload the contents of this `web` folder to GitHub.** Never upload `../pipeline/` or `../Claude_Code/` — those contain real, confidential project data and this site is public with no login. See `../pipeline/README.md`.

## Searching your real data (without exposing it)

The deployed site never contains project data — but it can *read* it locally. On any app page (Assets, Panels, or an asset detail), click **Connect data** in the top bar and select the JSON files from `../pipeline/output/` (`panel-schedules.json`, `rfis.json`, `constraints.json`, `groupme.json`, `trackers.json`, `airtable.json` — you can select all six at once). They load into the browser's IndexedDB on your machine only; nothing is uploaded anywhere. From then on, the global search returns every Asset #, Equipment ID, panel, circuit, RFI number, constraint, and GroupMe message from your real exports — clicking a result opens a drawer with all of that record's source fields. The import persists across visits on the same browser; the ✕ next to the record count clears it. Re-run `../pipeline/run-all.ps1` after new exports land, then re-import.

## Why there's no `npm install` step here

This is built and run on a locked-down work laptop with no Node, npm, or git, and no install permissions. So the build doesn't happen locally — it happens in the cloud, on Netlify's build servers, which already have Node. Nothing gets installed on this machine at any point.

## Deploying (no local install, no git CLI)

There are two valid repo shapes. Pick whichever matches what you already have — **you do not need to re-upload anything you've already pushed.**

**Shape A — `web/` sits inside the repo as a subfolder** (this is what happens if you drag the whole `web` folder into GitHub's uploader instead of its contents — the most common outcome):
1. Add one file at the **repo root** (next to the `web` folder, not inside it): `../netlify.toml` from this project — it contains `base = "web"`, which tells Netlify to treat `web/` as the project root for the build. Use GitHub's "Add file → Upload files" and drop it at the repo root.
2. Delete `web/netlify.toml` from the repo if GitHub still has an old copy there (there should only be one `netlify.toml`, at the repo root).
3. In Netlify: **Site configuration → Build & deploy → Trigger deploy → Clear cache and deploy site.**

**Shape B — contents of `web/` sit directly at the repo root** (package.json, app/, components/ visible immediately in the repo's root file listing):
1. Use `web/netlify.toml`-equivalent config at the repo root directly (no `base` needed) — i.e. the root `netlify.toml` should NOT have `base = "web"` in this case.
2. Everything else is the same.

If you're not sure which shape you have, open the repo on github.com — if the root file listing shows a `web` folder, you're in Shape A.

Once the correct `netlify.toml` is in place and a fresh deploy runs, you should see real build output in the Netlify log: `npm install` pulling ~15 packages (several seconds, not instant), then `next build` compiling routes. If the log still says `Detected 0 framework(s)` / `No build steps found`, the `netlify.toml` still isn't where Netlify expects it — double check it's at the true repo root and not nested.

If a build fails after that, open the failed deploy in Netlify and copy the log — the error will point at a specific file/line, which is the fastest way to get it fixed.

### Faster iteration option

If you want to see changes before a full Netlify deploy, paste the project into [StackBlitz](https://stackblitz.com/) or [CodeSandbox](https://codesandbox.io/) (both run entirely in the browser, no install) for a live preview.

## Using it on iPad

The deployed Netlify URL works in Safari. Tap **Share → Add to Home Screen** — `app/manifest.ts` and the app icons (`app/icon.tsx`, `app/apple-icon.tsx`) make it launch full-screen like a native app.

## Where things live

- `tailwind.config.ts` / `app/globals.css` — design tokens.
- `components/ui`, `components/motion`, `components/three`, `components/layout` — the reusable library. See `docs/design-system.md` for the full catalog and the rules for using it.
- `app/page.tsx` — the cinematic scroll landing page.
- `app/assets/[assetId]/page.tsx` + `features/assets/AssetDetailView.tsx` — the first real product screen.
- `types/domain.ts` + `lib/mock-data.ts` — the data model and its mock fixtures, shaped to match `../docs/integration-contract.md` and `../backend/schema.sql` so plugging in real data later doesn't require redesigning anything.
- `features/*`, `services/`, `database/`, `hooks/` — scaffolded per the target architecture; most are placeholder stubs until their pass comes up.
