# Ghostlink — Resurrect Dead Links

**Dead links, back from the dead.** Paste a link that no longer loads and get
the page back from the Internet Archive's Wayback Machine.

Built with [Kiro](https://kiro.dev) for **Kiroween 2026** (Resurrection category).

- **Live site:** https://headshot-python.github.io/ghostlink/
- **Demo video:** (YouTube link added on submission)

## What it does

- **Resurrect a link** — paste any URL. Ghostlink checks whether the live page
  still answers, finds the closest archived snapshot, and shows you the
  resurrected page in an embedded viewer. Pick another year from the snapshot
  timeline to see a different version.
- **Batch check** — paste up to 50 links, one per line, and get a report of
  which are archived and which are truly lost. Made for bloggers and
  researchers auditing link rot.
- **Graveyard** — every resurrection is buried in a local history (your browser
  only, nothing leaves your device).
- **Shareable results** — every resurrection gets a link you can send to
  someone else; opening it re-runs the same resurrection.

## Why it matters

Link rot is a quiet epidemic: a large share of links published more than a few
years ago no longer resolve. The Wayback Machine already preserves hundreds of
billions of page snapshots, but most people never think to look there.
Ghostlink is the friendly front door to that archive.

## How it works

No backend, no build step, no dependencies, no API keys, no account. Just
`index.html` + `styles.css` + `app.js`, served as static files.

Data comes from two public, CORS-enabled Wayback Machine endpoints:

- `https://archive.org/wayback/available?url=…` — closest snapshot lookup.
- `https://web.archive.org/web/<timestamp>/<url>` — the archived page itself,
  shown in an iframe.

The snapshot timeline is built from availability-API calls at fixed year marks.
(The CDX search API was evaluated and rejected for browser use — it sends no
CORS headers.)

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Test it

```bash
node --check app.js
bash scripts/smoke-test.sh
```

## Deploy

Any static host works. GitHub Pages: push this repo, enable Pages from the
`main` branch, done.

## How Kiro was used

See [KIRO_USAGE.md](KIRO_USAGE.md) for the full, honest record: spec-driven
development (requirements / design / tasks), steering docs, agent hooks, a
custom agent, and the Kiro CLI implementation pass.

## License

MIT — see [LICENSE](LICENSE). Ghostlink is not affiliated with the Internet
Archive.
