# Core Values — how CommissionOS operates

> Not poster values. Rules with a test for each, so the AI can check its own work.
> Extracted from the real decision pattern in the CommissionOS project.

### 1. Never fabricate data
The product is a trust layer over real commissioning records. A single invented
asset tag, RFI number, or count destroys that trust.
- **Test:** every number, name, tag, and date in output traces to a real source or
  a `[TODO: confirm]` placeholder. If you can't cite where it came from, it doesn't ship.

### 2. Verify against the real backend
"It should work" is not "it works."
- **Test:** any data change is confirmed via Supabase RPC (`get_assets_json()`),
  the same path the app uses — not by reading a local file or trusting the adapter.

### 3. Additive and reversible on anything live
Live tooling runs in a real company's environment where a mistake is visible to
real people (the GroupMe bot lesson).
- **Test:** could this be rolled back cleanly? On field scripts (TamperMonkey,
  connectors), did I add a new path rather than rewrite an existing one? Is git the
  undo button (every change committed)?

### 4. Manual-export first, live-API later
Prefer the boring, controllable path (share an export → build an adapter) over a
live integration until a real bottleneck justifies the risk.
- **Test:** does this integration need to be live *today*, or does a manual export
  get the same data with less blast radius? Default to the export.

### 5. Deterministic work goes in scripts
Anything that should produce the same output every time is code, not a judgment call.
- **Test:** given the same input, would two runs differ? If no → it's a script.

### 6. Respect the human/agent boundary
Some steps only a human can do; some only the agent should touch.
- **Test:** is this labeled `owner:human`? Then stop and hand it back with a clear
  ask. Is it `owner:agent` and unblocked? Then finish it without pinging for input.

### 7. Cost-aware automation
Automation that adds complexity without reducing real cost (build minutes, credits)
is deferred, not built.
- **Test:** does this automation reduce a real, recurring cost or bottleneck? If it
  only "feels" cleaner, it waits.

### 8. Plain text and version control, always
Every artifact is markdown/code in git. No lock-in, no un-diffable state.
- **Test:** is this change a clean, reviewable git diff? Is anything important
  living only in a proprietary tool where it can't be tracked?
</content>
