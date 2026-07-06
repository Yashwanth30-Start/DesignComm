# CommissionOS — Web (V1)

Next.js 14 + TypeScript + Tailwind + Motion + React Three Fiber. This is the real CommissionOS product: a design system, a reusable component library, a cinematic scroll landing page, and the first Asset Detail Page. It renders typed mock data (`lib/mock-data.ts`) — no live integrations yet, by design (see `../docs/integration-contract.md`).

## Why there's no `npm install` step here

This is built and run on a locked-down work laptop with no Node, npm, or git, and no install permissions. So the build doesn't happen locally — it happens in the cloud, on Netlify's build servers, which already have Node. Nothing gets installed on this machine at any point.

## Deploying (no local install, no git CLI)

1. **Create a GitHub repo** (recommend private) at github.com — "Add file → Upload files."
2. Open this `web` folder in File Explorer, select everything **inside** it (`app/`, `components/`, `package.json`, etc. — not the `web` folder itself), and drag it into GitHub's upload page. GitHub's web uploader preserves folder structure. `node_modules`, `.next`, and `.env*` are already excluded via `.gitignore` (GitHub's uploader won't see them since they don't exist locally anyway).
3. Commit directly to `main` from the GitHub web UI.
4. Go to **netlify.com → Add new site → Import an existing project → Deploy with GitHub**, authorize GitHub, pick the repo.
5. Netlify auto-detects Next.js via `netlify.toml` (build command `npm run build`, `@netlify/plugin-nextjs`). Click **Deploy**. First build takes a few minutes while Netlify installs dependencies in the cloud.
6. Every time you want to update the site: edit files here, re-upload the changed files to GitHub (or use GitHub's web editor for small tweaks), and Netlify redeploys automatically on push.

If a build fails, open the failed deploy in Netlify and copy the log — the error will point at a specific file/line, which is the fastest way to get it fixed.

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
