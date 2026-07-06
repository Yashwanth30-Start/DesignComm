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

- **`components/ui`** — Button, GlassPanel, StatusPill, SectionHeading, Divider, IconTile, StatTile, Timeline, ProgressBar, Tag. Pure presentational primitives; no data fetching.
- **`components/motion`** — Reveal, StaggerGroup/StaggerItem, Parallax, GlowPulse, MagneticButton, ScrollSectionStage, ScrollProgressRail. Wrap Motion (`motion/react`) so pages never import Motion directly.
- **`components/three`** — CanvasStage, ParticleField, ElectricalGridFloor, AmbientScene. Client-only, mount-gated to avoid SSR/hydration mismatches. `AmbientScene` is the one thing pages actually import.
- **`components/layout`** — NavRail, Topbar, PageShell. The app chrome for real product screens (not used on the cinematic landing page, which is deliberately chrome-free).

## Rules

1. Pages never hand-roll Tailwind glass/glow classes — use `GlassPanel` + the `glow` prop.
2. Pages never import `motion/react` or `three`/`@react-three/fiber` directly — go through `components/motion` / `components/three`.
3. Every status badge is `StatusPill`, driven by the `WorkflowStatus` type in `types/domain.ts` — never a one-off colored `<span>`.
4. New domain data shapes extend `types/domain.ts` first, then get a mock fixture in `lib/mock-data.ts`, then a component. Data model before UI, always.
