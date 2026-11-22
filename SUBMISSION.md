# Devpost Submission Copy — Ghostlink (Kiroween 2026)

## Title
Ghostlink — Resurrect Dead Links

## Tagline
Dead links, back from the dead.

## Category
Resurrection

## Built with
Kiro (CLI 3.5.0, spec-driven development), HTML, CSS, JavaScript, Wayback Machine API

## Links (fill in after deploy)
- Live app: https://headshot-python.github.io/ghostlink/
- GitHub repo: https://github.com/headshot-python/ghostlink
- Demo video (YouTube, public, under 3 min): https://www.youtube.com/watch?v=rILpYJTAPK4 (uploaded and verified public 2026-11-23 00:10 CST; 89 s, 1280x720)

## Description (for the Devpost form)

**The problem.** Link rot is a quiet epidemic. A large share of links
published more than a few years ago no longer resolve: blog posts, research
citations, documentation, forum answers — all pointing at pages that are
gone. Readers hit dead ends; writers watch their old work decay.

**The fix.** The Internet Archive's Wayback Machine already saved most of
those pages — hundreds of billions of snapshots — but almost nobody thinks to
look there. Ghostlink is the friendly front door to that archive.

**What it does.** Paste any dead link and Ghostlink brings it back: it checks
whether the live page still answers, finds the closest archived snapshot, and
shows you the resurrected page. A snapshot timeline lets you pick a version
from a different year. A batch mode checks up to 50 links at once and reports
which can be saved — built for bloggers and researchers auditing link rot.
Everything you resurrect is kept in a local "graveyard" (your browser only),
and every resurrection gets a shareable link.

**How it works.** No backend, no build step, no dependencies, no API keys, no
account. Just three static files, served from GitHub Pages, talking to the
Wayback Machine's public, CORS-enabled availability API. A real engineering
decision is documented in the repo: the CDX search API was evaluated and
rejected for browser use (it sends no CORS headers), so the timeline is built
from availability-API calls at fixed year marks instead.

**Who it is for.** Readers following old links, bloggers fixing link rot,
researchers citing old pages, anyone who has ever clicked a link and found
nothing.

## How Kiro was used (for the Devpost form)

- **Spec-driven development:** the project was specified before it was
  written, in Kiro's spec format — requirements.md (EARS format), design.md,
  tasks.md — under `.kiro/specs/ghostlink/`.
- **Steering docs:** product, tech, and structure steering set the direction
  (static-only stack, no CDX from the browser, polite 400 ms batch pacing).
- **Agent hooks:** a v1 hooks file runs `node --check` on every JS save, the
  smoke test after each spec task, and guards the `.kiro` directory against
  deletion or gitignore.
- **Custom agent:** a `ghostlink-builder` agent definition scopes the build.
- **Kiro CLI 3.5.0** was installed (spec, steering, hooks and custom agent
  as above) and signed in (Builder ID, 6712369@gmail.com); the CLI
  implementation-review pass ran on 2026-11-23, checked the code against
  the spec, fixed 4 small issues (ARIA tab attributes, a dead parameter,
  two design-doc inaccuracies), and the smoke test passes — see
  KIRO_USAGE.md in the repo for the honest, itemized record.

## Bonus prizes
None apply (not a startup, not a student project, did not register for
Kiroween 2025, not a Kiro Crew app). Best Demo is automatic for all eligible
submissions.

## Demo video plan (under 3 minutes)
1. (0:00–0:15) The problem: click a dead link, get nothing.
2. (0:15–1:00) Paste geocities.com into Ghostlink — live check fails, snapshot
   from 2019 appears, archived page loads in the viewer; pick 2005 on the
   timeline.
3. (1:00–1:40) Batch mode: paste 5 links, watch the report fill in.
4. (1:40–2:15) Graveyard + share link (open the shared link, resurrection
   re-runs).
5. (2:15–2:45) How it was built with Kiro: show the .kiro spec files, the
   hooks, the CLI.
6. (2:45–3:00) Close: "Dead links, back from the dead."
