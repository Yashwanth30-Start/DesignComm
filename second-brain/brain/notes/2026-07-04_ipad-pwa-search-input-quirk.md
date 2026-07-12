# Note: iPad PWA search-input quirk

**Date:** 2026-07-04
**Source:** YAS-5 (High, owner:human, open)

The search box misbehaved on iPad (backspace / click-through issues), suspected an
iOS Safari **PWA** quirk with the native `type="search"` input. Fix: switch to
`type="text"` + an explicit clear button, and bump the service worker to **v5** so
installed PWAs pick up the change.

Confirmed bug-free in desktop Chromium preview, but **could not be reproduced or
verified on a real iPad** — that's an `owner:human` step
([[2026-07-04_owner-human-vs-agent-convention]]). Test order when a real iPad is
available: plain Safari tab first, then the installed PWA.

Lesson: iPad/PWA is a first-class target; desktop-Chromium-green ≠ verified for field
use.

## Related
- `directives/deploy_to_netlify.md`
- `context/owner.md`
</content>
