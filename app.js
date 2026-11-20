/* Ghostlink — resurrect dead links via the Wayback Machine.
 * Static only: no build step, no dependencies, no API keys.
 * Data: https://archive.org/wayback/available (CORS-enabled).
 * NOTE: the CDX API is deliberately NOT used from the browser — it sends no
 * CORS headers. The timeline is built from availability-API calls at year marks.
 */
'use strict';

var WAYBACK_AVAIL = 'https://archive.org/wayback/available';
var WAYBACK_SAVE = 'https://web.archive.org/save/';
var GRAVEYARD_KEY = 'ghostlink.graveyard.v1';
var BATCH_MAX = 50;
var LIVE_TIMEOUT_MS = 8000;
var TIMELINE_YEARS = [2000, 2005, 2010, 2015, 2020, 2025];

/* ---------- pure helpers (also exercised by scripts/smoke-test.sh) ---------- */

function normalizeUrl(input) {
  var s = (input || '').trim();
  if (!s) return null;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) s = 'https://' + s;
  var u;
  try { u = new URL(s); } catch (e) { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  return u.toString();
}

function formatTimestamp(ts) {
  if (!ts || ts.length < 8) return ts || '';
  var y = ts.slice(0, 4), m = ts.slice(4, 6), d = ts.slice(6, 8);
  var months = ['January','February','March','April','May','June','July',
    'August','September','October','November','December'];
  var out = months[parseInt(m, 10) - 1] + ' ' + parseInt(d, 10) + ', ' + y;
  if (ts.length >= 12) out += ' at ' + ts.slice(8, 10) + ':' + ts.slice(10, 12) + ' UTC';
  return out;
}

function toHttpsArchiveUrl(url) {
  return url.replace(/^http:\/\/web\.archive\.org\//, 'https://web.archive.org/');
}

/* ---------- archive API ---------- */

function closestSnapshot(url, timestamp) {
  var api = WAYBACK_AVAIL + '?url=' + encodeURIComponent(url);
  if (timestamp) api += '&timestamp=' + timestamp;
  return fetch(api).then(function (r) { return r.json(); }).then(function (j) {
    var c = j && j.archived_snapshots && j.archived_snapshots.closest;
    if (!c || !c.available) return null;
    return { url: toHttpsArchiveUrl(c.url), timestamp: c.timestamp, status: c.status };
  });
}

/* Live reachability is a heuristic only: cross-origin responses are opaque,
 * so we can tell "the host answered" from "it did not" — never a status code. */
function checkLive(url) {
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, LIVE_TIMEOUT_MS);
  return fetch(url, { mode: 'no-cors', signal: ctrl.signal })
    .then(function () { clearTimeout(timer); return 'reachable'; })
    .catch(function () { clearTimeout(timer); return 'unreachable'; });
}

function buildTimeline(url) {
  var thisYear = new Date().getFullYear();
  var marks = TIMELINE_YEARS.filter(function (y) { return y <= thisYear; });
  var calls = marks.map(function (y) {
    return closestSnapshot(url, String(y) + '0101000000').catch(function () { return null; });
  });
  return Promise.all(calls).then(function (results) {
    var seen = {};
    var out = [];
    results.forEach(function (s) {
      if (s && s.timestamp && !seen[s.timestamp]) { seen[s.timestamp] = true; out.push(s); }
    });
    out.sort(function (a, b) { return a.timestamp < b.timestamp ? -1 : 1; });
    return out;
  });
}

/* ---------- graveyard (localStorage only, never leaves the device) ---------- */

function loadGraveyard() {
  try {
    var raw = localStorage.getItem(GRAVEYARD_KEY);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function saveToGraveyard(entry) {
  try {
    var list = loadGraveyard().filter(function (e) { return e.url !== entry.url; });
    list.unshift(entry);
    localStorage.setItem(GRAVEYARD_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) { /* storage unavailable — graveyard silently disabled */ }
}

/* ---------- node test hook ---------- */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normalizeUrl: normalizeUrl, formatTimestamp: formatTimestamp, toHttpsArchiveUrl: toHttpsArchiveUrl, closestSnapshot: closestSnapshot };
}

/* ---------- browser UI ---------- */
if (typeof document !== 'undefined') {
  var $ = function (id) { return document.getElementById(id); };

  /* Tabs */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      ['resurrect', 'batch', 'graveyard'].forEach(function (name) {
        $('panel-' + name).hidden = (name !== tab.dataset.tab);
      });
      if (tab.dataset.tab === 'graveyard') renderGraveyard();
    });
  });

  function setStatus(html) {
    var el = $('status-line');
    el.innerHTML = html;
    el.hidden = false;
  }

  function showError(msg) {
    var el = $('url-error');
    el.textContent = msg;
    el.hidden = false;
  }

  function showSnapshotInViewer(snap) {
    $('viewer').src = snap.url;
    $('open-archived').href = snap.url;
    $('result-meta').textContent =
      'Closest snapshot: ' + formatTimestamp(snap.timestamp) +
      (snap.status && snap.status !== '200' ? ' (archived status: ' + snap.status + ')' : '');
  }

  function renderTimeline(snaps, currentTs) {
    var box = $('timeline');
    var chips = $('timeline-chips');
    chips.innerHTML = '';
    if (!snaps.length) { box.hidden = true; return; }
    snaps.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'timeline-chip' + (s.timestamp === currentTs ? ' active' : '');
      b.textContent = s.timestamp.slice(0, 4);
      b.title = formatTimestamp(s.timestamp);
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(chips.children, function (c) { c.classList.remove('active'); });
        b.classList.add('active');
        showSnapshotInViewer(s);
      });
      chips.appendChild(b);
    });
    box.hidden = false;
  }

  function resurrect(rawInput) {
    var url = normalizeUrl(rawInput);
    if (!url) { showError('That does not look like a valid web address. Try something like example.com/old-page'); return; }
    $('url-error').hidden = true;
    var btn = $('resurrect-btn');
    btn.disabled = true;
    btn.textContent = 'Digging…';
    $('result-card').hidden = true;
    setStatus('<span class="spin"></span>Checking the live page and digging through the archive…');

    Promise.all([checkLive(url), closestSnapshot(url)]).then(function (res) {
      var live = res[0], snap = res[1];
      var badge = $('result-badge');
      $('result-url').textContent = url;
      $('save-now').href = WAYBACK_SAVE + encodeURIComponent(url);
      $('result-card').hidden = false;

      if (!snap) {
        badge.textContent = 'No snapshot found';
        badge.className = 'badge lost';
        $('result-meta').textContent =
          'The live page is ' + (live === 'reachable' ? 'reachable, but ' : 'unreachable and ') +
          'the Wayback Machine never saved a copy of it. This link may be truly lost — ' +
          'or you can save the page now so the next person finds it.';
        $('open-archived').style.display = 'none';
        $('copy-link').style.display = 'none';
        $('viewer').removeAttribute('src');
        $('timeline').hidden = true;
        setStatus('Finished. No snapshot exists for this link.');
      } else {
        $('open-archived').style.display = '';
        $('copy-link').style.display = '';
        if (live === 'reachable') {
          badge.textContent = 'Alive — backup found';
          badge.className = 'badge alive';
        } else {
          badge.textContent = 'Dead — Resurrected';
          badge.className = 'badge dead';
        }
        showSnapshotInViewer(snap);
        setStatus('Resurrected from the archive. Pick another year below to see a different snapshot.');
        saveToGraveyard({ url: url, timestamp: snap.timestamp, snapshotUrl: snap.url, date: new Date().toISOString() });
        updateGraveyardCount();
        buildTimeline(url).then(function (snaps) { renderTimeline(snaps, snap.timestamp); });
        try { history.replaceState(null, '', '#u=' + encodeURIComponent(url)); } catch (e) {}
      }
    }).catch(function () {
      setStatus('Could not reach the archive. Check your connection and try again.');
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Resurrect';
    });
  }

  $('resurrect-form').addEventListener('submit', function (e) {
    e.preventDefault();
    resurrect($('url-input').value);
  });

  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
    chip.addEventListener('click', function () {
      $('url-input').value = chip.dataset.url;
      resurrect(chip.dataset.url);
    });
  });

  $('copy-link').addEventListener('click', function () {
    var link = $('open-archived').href;
    function done(btn) { var b = $('copy-link'); b.textContent = 'Copied!'; setTimeout(function () { b.textContent = 'Copy snapshot link'; }, 1500); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done, function () { fallbackCopy(link); done(); });
    } else { fallbackCopy(link); done(); }
  });

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* Batch */
  $('batch-btn').addEventListener('click', function () {
    var lines = $('batch-input').value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var body = $('batch-body');
    body.innerHTML = '';
    $('batch-results').hidden = true;
    if (!lines.length) { $('batch-progress').textContent = 'Paste at least one link first.'; $('batch-progress').hidden = false; return; }
    if (lines.length > BATCH_MAX) lines = lines.slice(0, BATCH_MAX);
    var btn = $('batch-btn');
    btn.disabled = true;
    var done = 0;
    $('batch-results').hidden = false;

    function next(i) {
      if (i >= lines.length) {
        $('batch-progress').textContent = 'Done — ' + done + ' of ' + lines.length + ' checked.';
        btn.disabled = false;
        return;
      }
      $('batch-progress').hidden = false;
      $('batch-progress').textContent = 'Checking ' + (i + 1) + ' of ' + lines.length + '…';
      var raw = lines[i];
      var url = normalizeUrl(raw);
      var tr = document.createElement('tr');
      if (!url) {
        tr.innerHTML = '<td class="url"></td><td><span class="pill bad">invalid</span></td><td>—</td><td></td>';
        tr.children[0].textContent = raw;
        body.appendChild(tr);
        done++;
        setTimeout(function () { next(i + 1); }, 50);
        return;
      }
      closestSnapshot(url).then(function (snap) {
        var date = snap ? formatTimestamp(snap.timestamp).replace(/ at .*$/, '') : '—';
        var pill = snap ? '<span class="pill yes">archived</span>' : '<span class="pill no">not archived</span>';
        var link = snap ? '<a href="#u=' + encodeURIComponent(url) + '" data-resurrect>resurrect</a>' : '';
        tr.innerHTML = '<td class="url"></td><td>' + pill + '</td><td></td><td>' + link + '</td>';
        tr.children[0].textContent = url;
        tr.children[2].textContent = date;
        body.appendChild(tr);
        done++;
        setTimeout(function () { next(i + 1); }, 400);
      }).catch(function () {
        tr.innerHTML = '<td class="url"></td><td><span class="pill bad">error</span></td><td>—</td><td></td>';
        tr.children[0].textContent = url;
        body.appendChild(tr);
        done++;
        setTimeout(function () { next(i + 1); }, 400);
      });
    }
    next(0);
  });

  $('batch-clear').addEventListener('click', function () {
    $('batch-input').value = '';
    $('batch-body').innerHTML = '';
    $('batch-results').hidden = true;
    $('batch-progress').hidden = true;
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-resurrect]') : null;
    if (!a) return;
    e.preventDefault();
    var url = decodeURIComponent(a.getAttribute('href').replace(/^#u=/, ''));
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === 'resurrect');
      t.setAttribute('aria-selected', t.dataset.tab === 'resurrect' ? 'true' : 'false');
    });
    ['resurrect', 'batch', 'graveyard'].forEach(function (name) {
      $('panel-' + name).hidden = (name !== 'resurrect');
    });
    $('url-input').value = url;
    resurrect(url);
  });

  /* Graveyard */
  function updateGraveyardCount() {
    $('graveyard-count').textContent = String(loadGraveyard().length || '');
  }

  function renderGraveyard() {
    var list = $('graveyard-list');
    list.innerHTML = '';
    var entries = loadGraveyard();
    $('graveyard-empty').hidden = entries.length > 0;
    entries.forEach(function (entry) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#u=' + encodeURIComponent(entry.url);
      a.setAttribute('data-resurrect', '');
      a.textContent = entry.url;
      var t = document.createElement('time');
      t.textContent = 'resurrected ' + new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
        ' · snapshot ' + formatTimestamp(entry.timestamp).replace(/ at .*$/, '');
      li.appendChild(a);
      li.appendChild(t);
      list.appendChild(li);
    });
    updateGraveyardCount();
  }

  $('graveyard-clear').addEventListener('click', function () {
    if (!loadGraveyard().length) return;
    if (!window.confirm('Clear the whole graveyard? This cannot be undone.')) return;
    try { localStorage.removeItem(GRAVEYARD_KEY); } catch (e) {}
    renderGraveyard();
  });

  /* Auto-run from a shared hash link */
  updateGraveyardCount();
  if (location.hash.indexOf('#u=') === 0) {
    try {
      var shared = decodeURIComponent(location.hash.slice(3));
      if (shared) { $('url-input').value = shared; resurrect(shared); }
    } catch (e) {}
  }
}
