# Requirements Document — Ghostlink

## Introduction

Link rot is a quiet epidemic: studies consistently find that a large share of links
published more than a few years ago no longer resolve. Blog posts, research papers,
documentation, and forum answers all point at pages that are gone. The Internet
Archive's Wayback Machine already preserves hundreds of billions of page snapshots,
but most people never think to look there — and there is no friendly, focused tool
that takes a dead link and hands you the page back.

Ghostlink is a free, dependency-free web app that resurrects dead links. Paste a URL,
Ghostlink checks whether the live page still responds, finds the closest archived
snapshot in the Wayback Machine, and shows you the resurrected page. It also checks
a whole list of links at once (for bloggers and researchers auditing link rot) and
keeps a local "graveyard" of everything you have resurrected.

## Glossary

- **Live check**: an attempt to reach the original URL from the browser.
- **Snapshot**: one archived capture of a page, identified by a 14-digit timestamp.
- **Resurrection**: the act of recovering a dead page from its closest snapshot.
- **Graveyard**: the local, browser-only history of resurrected links.
- **Wayback Machine**: the Internet Archive's web archive (web.archive.org).

## Requirements

### Requirement 1: Single-link resurrection

**User Story:** As a reader following an old link, I want to paste a dead URL and
get the archived page back, so I can still read what it said.

#### Acceptance Criteria

1. WHEN a user enters a URL and activates resurrect, THE Ghostlink_System SHALL
   normalize the URL (trim whitespace, add `https://` when no scheme is present)
   and reject input that is not a parseable URL with a clear error message.
2. WHEN a URL is submitted, THE Ghostlink_System SHALL attempt a live reachability
   check and query the Wayback availability API for the closest snapshot in
   parallel.
3. WHEN the live page is reachable, THE Ghostlink_System SHALL display a status
   of "Alive" and still show the closest snapshot as a backup.
4. WHEN the live page is unreachable and a snapshot exists, THE Ghostlink_System
   SHALL display a status of "Dead — Resurrected", the snapshot date in human
   form, and load the archived page in an embedded viewer.
5. WHEN no snapshot exists, THE Ghostlink_System SHALL display "No snapshot found"
   and offer a link to save the page to the Wayback Machine.
6. WHEN a snapshot is shown, THE Ghostlink_System SHALL provide actions to open
   the archived page in a new tab and to copy the snapshot link.

### Requirement 2: Snapshot timeline

**User Story:** As a researcher, I want to see which years a page was archived in,
so I can pick the version closest to the date I care about.

#### Acceptance Criteria

1. WHEN a snapshot is found, THE Ghostlink_System SHALL query the availability
   API at several year marks and display the distinct snapshots found as a
   timeline.
2. WHEN a timeline entry is selected, THE Ghostlink_System SHALL load that
   snapshot in the embedded viewer and update the displayed snapshot date.
3. WHEN the timeline query fails, THE Ghostlink_System SHALL hide the timeline
   without breaking the main result.

### Requirement 3: Batch link check

**User Story:** As a blogger, I want to paste a list of links and get a report of
which are dead and which can be resurrected, so I can fix my old posts.

#### Acceptance Criteria

1. WHEN a user pastes up to 50 URLs (one per line) and activates the check,
   THE Ghostlink_System SHALL check each URL against the availability API
   sequentially with a short delay between requests.
2. WHEN the batch check runs, THE Ghostlink_System SHALL show live progress
   (e.g. "Checking 7 of 23…").
3. WHEN the batch check finishes, THE Ghostlink_System SHALL display a table
   with one row per URL: the URL, whether a snapshot exists, the snapshot date,
   and a link to resurrect it.
4. WHEN a batch URL is not a parseable URL, THE Ghostlink_System SHALL mark its
   row as invalid instead of failing the whole batch.

### Requirement 4: Graveyard (local history)

**User Story:** As a returning user, I want to see the links I resurrected before,
so I can find them again without re-typing.

#### Acceptance Criteria

1. WHEN a link is successfully resurrected, THE Ghostlink_System SHALL store the
   URL, snapshot timestamp, and date in the browser's local storage.
2. WHEN the Graveyard view is opened, THE Ghostlink_System SHALL list stored
   entries newest first, each linking back to its resurrection.
3. WHEN the user clears the Graveyard, THE Ghostlink_System SHALL remove all
   stored entries after confirmation.

### Requirement 5: Shareable results

**User Story:** As a user who resurrected a page, I want a link I can send to
someone else that opens the same resurrection.

#### Acceptance Criteria

1. WHEN a resurrection succeeds, THE Ghostlink_System SHALL encode the URL in
   the page address (hash) so the result can be shared.
2. WHEN the page loads with a URL in the hash, THE Ghostlink_System SHALL run
   the resurrection automatically.

### Requirement 6: No backend, no keys, no cost

**User Story:** As the maintainer, I want the app to run entirely as static files
so it can be hosted for free and keep working indefinitely.

#### Acceptance Criteria

1. THE Ghostlink_System SHALL consist only of static HTML, CSS, and JavaScript
   with no build step and no server-side code.
2. THE Ghostlink_System SHALL NOT require any API key, account, or login.
3. THE Ghostlink_System SHALL work when served from any static host (e.g.
   GitHub Pages) and degrade gracefully when opened from a local file.

### Requirement 7: Presentation and accessibility

**User Story:** As a visitor, I want a polished, memorable interface that works on
my phone, so the tool feels like a finished product.

#### Acceptance Criteria

1. THE Ghostlink_System SHALL present a coherent dark "graveyard" visual theme
   with a ghost mark, and remain readable and usable on narrow screens.
2. WHEN the app is used with a keyboard, THE Ghostlink_System SHALL keep all
   controls reachable and operable.
3. THE Ghostlink_System SHALL show a clear loading state during network checks
   and a clear error message when the network fails.
