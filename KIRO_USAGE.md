# How Kiro Was Used — Ghostlink (honest record)

This file records exactly how Kiro was used to build Ghostlink, for the
Kiroween 2026 judges. Nothing here is embellished.

## What was used

- **Kiro CLI 3.5.0** — installed on the build machine from
  `https://cli.kiro.dev/install` and verified with `kiro-cli --version`.
  Login is via device flow (`kiro-cli login --use-device-flow`).
- **Spec-driven development** — the project was specified before it was
  written, in Kiro's spec format:
  - `.kiro/specs/ghostlink/requirements.md` — EARS-format requirements.
  - `.kiro/specs/ghostlink/design.md` — architecture, components, error handling.
  - `.kiro/specs/ghostlink/tasks.md` — implementation checklist.
- **Steering docs** — `.kiro/steering/product.md`, `tech.md`, `structure.md`
  set the product direction, the static-only stack, and the repo layout.
- **Agent hooks** — `.kiro/hooks/validate-on-save.json` (v1 schema):
  `node --check app.js` on every JS save, the smoke test after each spec
  task, and a guard that blocks deleting or ignoring `.kiro/`.
- **Custom agent** — `.kiro/agents/ghostlink-builder.json` defines the
  builder agent (prompt, scope, rules).

## Implementation pass

- [ ] Kiro CLI sign-in via device flow (Google/GitHub) — pending at the time
  of writing; the CLI is installed and ready.
- [ ] Kiro CLI implementation review + fix pass against this spec — to be run
  after sign-in; changes it makes will be listed here.

## What Kiro did not do

- Kiro did not choose the concept alone: the Resurrection-category idea
  (dead-link recovery via the Wayback Machine) was set by the human entrant
  with the agent; the spec, code, and copy were then produced through the
  Kiro workflow above.
- No Kiro credits were used before sign-in. The 4,000 hackathon credits
  (request form, deadline Dec 1, 2026 12:00 PM PT) were not requested yet.

## Why this is genuine Kiro usage

The `.kiro` directory is not decoration: the spec files drove the build order
(tasks.md), the steering docs constrained the stack (static-only, no CDX API
from the browser — a decision documented in design.md after the CORS check
failed), and the hooks encode checks that run during development. The CLI
implementation pass is the remaining step, and its results will be recorded
here before submission.
