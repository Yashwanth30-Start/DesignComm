# CommissionOS Design System — V1

Source of truth for tokens and components lives in code (`tailwind.config.ts`, `app/globals.css`, `components/`). This doc is the map, not a duplicate — update it when the token set or component catalog changes shape, not on every color tweak.

## Tokens (`tailwind.config.ts`)

Ported from the legacy `commissionos-fixed.html` dark-glass-neon language and extended with gold, so the new app is a continuation of the validated visual direction, not a redesign.

| Token | Hex | Use |
| --- | --- | --- |
| `void` | `#05070A` | Deepest background, 3D canvas backdrop |
| `bg` / `bg-2` | `#0E1113` / `#151A1C` | Page background layers |
| `glass` / `glass-hi` | `rgba(255,255,255,.045/.07)` | Card surfaces |
| `ink` / `ink-dim` / `ink-dim2` | `#EDF2F3` / `#8E9A9D` / `#5C6669` | Text hierarchy |
| `cyan` | `#6FE3F2` | Primary accent, commissioned status |
| `emerald` | `#2ECC71` | Electrical, ready status |
| `amber` | `#FFB86B` | Fire alarm / warm accent |
| `gold` | `#E8C468` | Waiting status, premium accents |
| `purple` | `#B8A7FF` | Gravity/secondary accent |
| `security` | `#A855F7` | Security systems |
| `red` | `#EF4444` | Blocked status, constraints |

`status.*` maps the five workflow states (ready/waiting/blocked/commissioned/complete) directly to these tokens — see `StatusPill`.

## Component catalog

- **`components/ui`** — Button, GlassPanel, StatusPill, SectionHeading, Divider, IconTile, StatTile, Timeline, ProgressBar, Tag, PanelSchedule, GrainOverlay, Marquee. Pure presentational primitives; no data fetching.
- **`components/motion`** — Reveal, StaggerGroup/StaggerItem, Parallax, GlowPulse, MagneticButton, ScrollSectionStage, ScrollProgressRail, SpotlightCursor, PinnedChapter. Wrap Motion (`motion/react`) so pages never import Motion directly. `PinnedChapter` is the Editions-style pattern: viewport locks while scroll progress (a MotionValue) drives the chapter's animation via a render-prop — pass progress into a child *component* (not inline hooks in the render-prop) so rules-of-hooks hold.
- **`components/three`** — CanvasStage, ParticleField, TesseractSwarm, ElectricalGridFloor, AmbientScene, GlobalBackdrop. Client-only, mount-gated to avoid SSR/hydration mismatches. `GlobalBackdrop` is mounted once in `app/layout.tsx`: the singularity swarm blended behind every app page (skipped on `/`, which has its own canvas) with a persistent FX opacity meter (bottom-right, localStorage-backed). PageShell is intentionally background-transparent so the backdrop shows through.
- **`components/layout`** — NavRail, Topbar, PageShell. The app chrome for real product screens (not used on the cinematic landing page, which is deliberately chrome-free). `Topbar` renders `features/search/GlobalSearch` for the working global search.
- **`features/landing`** — ParticleLanding: single-viewport black/white landing (no scroll), dependency-free 2D-canvas particle network with cursor grab-links, centered heading + search box that routes to `/search?q=`, and direct buttons into `/assets` and `/panels`. `.liquid-glass` CSS remains in `app/globals.css` for future use.
- **`GrainOverlay`** is mounted once, globally, in `app/layout.tsx` — every screen gets the same subtle film-grain texture; don't add a second one per-page.

## Rules

1. Pages never hand-roll Tailwind glass/glow classes — use `GlassPanel` + the `glow` prop.
2. Pages never import `motion/react` or `three`/`@react-three/fiber` directly — go through `components/motion` / `components/three`.
3. Every status badge is `StatusPill`, driven by the `WorkflowStatus` type in `types/domain.ts` — never a one-off colored `<span>`.
4. New domain data shapes extend `types/domain.ts` first, then get a mock fixture in `lib/mock-data.ts`, then a component. Data model before UI, always.
5. Any panel/circuit table renders through `PanelSchedule` (`components/ui/PanelSchedule.tsx`) — a single straightforward grid layout driven by `PanelScheduleData`. Do not hand-roll a second table for panel schedules anywhere else in the app; extend this one component if a new view needs it to behave differently.
