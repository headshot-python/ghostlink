# Design Document — Ghostlink

## Overview

Ghostlink is a single-page static web app. It has no backend, no build step, and no
dependencies. All data comes from two public, CORS-enabled endpoints of the
Internet Archive's Wayback Machine:

- `https://archive.org/wayback/available?url=<url>&timestamp=<ts>` — returns the
  closest snapshot to a URL (and optionally to a timestamp). Response includes
  `archived_snapshots.closest.{url, timestamp, status}`. Verified to send
  `access-control-allow-origin: *`.
- `https://web.archive.org/web/<timestamp>/<url>` — the archived page itself,
  loaded in an `<iframe>`. Verified to send no `X-Frame-Options` / CSP framing
  block.

A third endpoint is linked to, never called from code:
`https://web.archive.org/save/<url>` ("Save this page now").

The CDX search API was evaluated and rejected for browser use: it does not send
CORS headers, so the snapshot timeline is built from repeated availability-API
calls at fixed year marks instead.

## Architecture

```
index.html  — structure, tabs, result card, iframe viewer
styles.css  — graveyard theme, responsive layout
app.js      — all logic (see Components)
```

No framework. Vanilla JS, ES2019, one `<script>` tag. State lives in the DOM plus
`localStorage` (graveyard only). No bundler, no transpiler, no package manager
required to run the app.

## Components and Responsibilities

### URL handling (`normalizeUrl`, `isValidUrl`)

- Trims input; prepends `https://` when no scheme is present; validates with the
  `URL` constructor; rejects non-http(s) schemes.

### Live check (`checkLive`)

- `fetch(url, { mode: "no-cors", signal })` with an 8-second timeout.
- An opaque (resolved) response means the host answered; a rejection means it
  did not. This is a reachability heuristic only — cross-origin responses are
  opaque by design, so HTTP status is never visible. The UI copy says "reachable"
  / "unreachable", never "200" / "404".

### Snapshot lookup (`closestSnapshot`)

- `fetch(availabilityApi)` with `url` and optional `timestamp`.
- Returns the `closest` object or `null`. A snapshot whose `status` is not `"200"`
  is still shown but flagged.

### Timeline (`buildTimeline`)

- Queries the availability API in parallel at year marks 2000, 2005, 2010, 2015,
  2020, 2025 (only marks in the past relative to today).
- De-duplicates by timestamp, sorts ascending, renders as clickable year chips.
- Failures are swallowed per-mark; a total failure hides the timeline.

### Batch check (`runBatch`)

- Splits textarea input into lines, caps at 50 URLs, validates each.
- Sequential availability-API calls with a 400 ms pause (politeness to a free
  public API), updating a progress line after each row.
- Renders a results table: URL, snapshot status, snapshot date, resurrect link.

### Graveyard (`loadGraveyard`, `saveToGraveyard`, `clearGraveyard`)

- `localStorage` key `ghostlink.graveyard.v1`, an array of
  `{ url, timestamp, snapshotUrl, date }`, capped at 50 entries, newest first.
- All reads wrapped in try/catch so a corrupted store never breaks the app.

### Sharing (`updateHash`, `loadFromHash`)

- On success, sets `location.hash` to `#u=<base64url of the URL>`.
- On page load, a hash present triggers an automatic resurrection.

## Data Models

```js
Snapshot = { url: string, timestamp: string /* 14 digits */, status: string }
GraveyardEntry = { url: string, timestamp: string, snapshotUrl: string, date: string }
```

Snapshot timestamps render as human dates via `formatTimestamp` (e.g.
`20190613084634` → `June 13, 2019`).

## Error Handling

| Situation | Behaviour |
|---|---|
| Empty / invalid URL | Inline error under the input; no network call |
| Network failure on availability API | "Could not reach the archive. Check your connection and try again." |
| Live check times out | Treated as unreachable; resurrection proceeds |
| No snapshot | "No snapshot found" + "Save this page now" link |
| Timeline partial failure | Affected year marks skipped silently |
| localStorage unavailable/corrupt | Graveyard silently disabled |

## Testing Strategy

- `node --check app.js` for syntax (wired into a Kiro hook on save).
- `scripts/smoke-test.sh`: serves the directory, curls the three files, and runs a
  Node harness that exercises `normalizeUrl` / `formatTimestamp` and performs a
  live availability-API call against `example.com` and `geocities.com`.
- Manual checklist before release: resurrect a known-dead URL, a live URL, a
  never-archived URL; run a 5-URL batch; reload from a shared hash; narrow
  (360 px) viewport pass.
