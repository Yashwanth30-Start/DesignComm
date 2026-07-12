# Owner Context — Yashwanth Nuthalapati

> The person the system works for. Personal facts that show up in decisions and
> product judgment. `[TODO: confirm]` = placeholder, not fabricated fact.

## Identity

- **Name:** Yashwanth Nuthalapati
- **Contact:** nuthalapatiyash96@gmail.com
- **GitHub:** `nuthalapatiyash96` (branch prefix on all issues), repo owner
  `yashwanth30-start` / `Yashwanth30-Start`
- **Linear workspace/team:** "Yashwanth Nuthalapati" (key `YAS`)
- **Role:** builder/owner of CommissionOS; works on/near a live construction
  commissioning project as the domain source of truth.

## Working environment (constraints that shape decisions)

- **Locked-down work laptop:** no Node, npm, or git installed, and no permission to
  install them. Consequence: all builds happen in the cloud (Netlify); the agent
  cannot assume a local toolchain exists. This is why the workflow leans on
  cloud build + browser-based preview (StackBlitz/CodeSandbox) instead of `npm install`.
- **iPad is a real target.** The app is installed as a PWA and used on iPad in the
  field; iOS Safari PWA quirks are a recurring source of bugs (see YAS-5).
- **Works alongside a real company GroupMe / project.** Anything that touches the
  live company environment must be handled carefully — a stray automated action is
  visible to real colleagues (see the GroupMe bot incident,
  `brain/decisions/2026-07-04_no-live-groupme-bot.md`).

## How Yashwanth works with the agent

- Uses an explicit **`owner:human` / `owner:agent`** split on every task so it's
  unambiguous who is blocked on what. Human-only tasks = external account signups,
  physical file exports, live device testing. Agent tasks = build + verify.
- Values **verification against the real backend**, not just "it should work."
- Watches **Netlify credit / build-minute usage** — automation that doesn't reduce
  cost is deprioritized (see YAS-17/YAS-18).
- Prefers **additive, reversible changes** on anything live.

## Background / expertise

`[TODO: confirm — professional background, years in commissioning, prior roles.
Draft from a recorded intro per the blueprint's record-and-transcribe method.]`
</content>
