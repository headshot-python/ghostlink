# Tech — Ghostlink

- Static only: `index.html` + `styles.css` + `app.js`. No build step, no
  framework, no dependencies, no backend, no API keys.
- Runs anywhere static files are served (GitHub Pages). Also opens from disk,
  except the live check needs a page context.
- Data sources (public, no key):
  - `https://archive.org/wayback/available` — closest snapshot lookup (CORS-enabled).
  - `https://web.archive.org/web/<timestamp>/<url>` — archived page, shown in an iframe.
  - `https://web.archive.org/save/<url>` — linked only, for saving a page now.
- Do NOT use the CDX search API from the browser: it sends no CORS headers.
  The timeline is built from availability-API calls at fixed year marks.
- Be polite to the free archive API: batch checks run sequentially with a
  400 ms pause between requests; cap a batch at 50 URLs.
- Commands:
  - `node --check app.js` — syntax check.
  - `bash scripts/smoke-test.sh` — serve, curl, and live-API smoke test.
  - `python3 -m http.server 8000` — local preview.
