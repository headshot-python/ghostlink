# Implementation Plan — Ghostlink

- [x] 1. Project scaffolding
  - [x] 1.1 Create repo layout: `index.html`, `styles.css`, `app.js`, `README.md`,
    `LICENSE` (MIT), `.gitignore` (must NOT ignore `.kiro/`)
  - [x] 1.2 Write Kiro spec files (requirements, design, tasks) under
    `.kiro/specs/ghostlink/`
  - [x] 1.3 Write steering docs (product, tech, structure) under `.kiro/steering/`
  - [x] 1.4 Write hook config `.kiro/hooks/validate-on-save.json` and custom agent
    `.kiro/agents/ghostlink-builder.json`
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Core single-link resurrection
  - [x] 2.1 Implement URL normalization and validation with clear inline errors
  - [x] 2.2 Implement live reachability check (no-cors fetch, 8 s timeout)
  - [x] 2.3 Implement Wayback availability-API lookup and result rendering
    (status badge, snapshot date, actions, embedded viewer)
  - [x] 2.4 Implement "no snapshot" state with Save-to-Wayback link
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 3. Snapshot timeline
  - [x] 3.1 Query availability API at year marks, dedupe, render year chips
  - [x] 3.2 Selecting a chip loads that snapshot in the viewer
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Batch check and graveyard
  - [x] 4.1 Implement batch textarea, sequential checks with progress, results table
  - [x] 4.2 Implement graveyard storage, listing, and clear
  - [x] 4.3 Implement shareable hash links and auto-run on load
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2_

- [x] 5. Presentation and polish
  - [x] 5.1 Graveyard visual theme, responsive layout, loading and error states
  - [x] 5.2 Keyboard operability pass; example-URL chips for one-click demo
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 6. Verification
  - [x] 6.1 `node --check app.js`; `scripts/smoke-test.sh` green (serves site,
    curls files, live API calls against example.com and geocities.com)
  - [x] 6.2 Manual checklist: dead URL (geocities.com → Dead — Resurrected,
    snapshot June 13, 2019), live URL (example.com → Alive), never-archived
    URL (google.com/reader → No snapshot found), 5-URL batch (Done — 5 of 5),
    shared hash reload (#u= auto-runs resurrection), 390 px viewport —
    all verified in headless Chromium with recorded fixtures (see
    scripts/shots.js header note: sandbox blocks Chromium egress, so
    archive.org traffic was served from recorded real API responses; the
    same calls were proven live via scripts/smoke-test.sh)
  - _Requirements: 1.4, 1.5, 3.3, 5.2, 7.3_

- [ ] 7. Kiro CLI implementation pass (requires sign-in via device flow)
  - [ ] 7.1 `kiro-cli login --use-device-flow --social google`, sign in with
    Google in the browser (parent arranges the browser task)
  - [ ] 7.2 Run kiro-cli against this spec for an implementation review and fix
    pass; record what it changed in `KIRO_USAGE.md`
  - _Requirements: 1.x–7.x (review coverage)_

## Demo video
- [x] 8. Demo video built: `demo/ghostlink-demo.mp4`, 89 s, 1280x720 H.264 +
  AAC, 4.5 MB — 6 captioned segments from `demo/shots/` (scripts/make-video.sh).
  Needs YouTube upload (public) before submission; link goes in SUBMISSION.md.

- [ ] 7. Kiro CLI implementation pass (requires sign-in via device flow)
  - [ ] 7.1 `kiro-cli login --use-device-flow`, sign in with Google/GitHub
  - [ ] 7.2 Run kiro-cli against this spec for an implementation review and fix
    pass; record what it changed in `KIRO_USAGE.md`
  - _Requirements: 1.x–7.x (review coverage)_
