#!/usr/bin/env bash
# Ghostlink smoke test: serve the site, curl the files, and exercise the
# archive API path end to end (Node harness + live Wayback calls).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== 1. syntax =="
node --check app.js && echo "app.js syntax OK"

echo "== 2. pure-function unit checks =="
node -e "
const a = require('./app.js');
const assert = require('assert');
assert.strictEqual(a.normalizeUrl('example.com/old'), 'https://example.com/old');
assert.strictEqual(a.normalizeUrl('  https://example.com  '), 'https://example.com/');
assert.strictEqual(a.normalizeUrl('not a url'), null);
assert.strictEqual(a.normalizeUrl('ftp://example.com'), null);
assert.strictEqual(a.formatTimestamp('20190613084634'), 'June 13, 2019 at 08:46 UTC');
assert.strictEqual(a.formatTimestamp('20050101'), 'January 1, 2005');
assert.strictEqual(a.toHttpsArchiveUrl('http://web.archive.org/web/2019/http://x/'), 'https://web.archive.org/web/2019/http://x/');
console.log('pure functions OK');
"

echo "== 3. serve + curl =="
python3 -m http.server 8931 >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1
for f in index.html styles.css app.js; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8931/$f")
  echo "$f -> HTTP $code"
  [ "$code" = "200" ] || { echo "FAIL: $f not 200"; exit 1; }
done
curl -s "http://127.0.0.1:8931/index.html" | grep -q "Ghostlink" && echo "index.html contains Ghostlink"

echo "== 4. live Wayback availability API =="
node -e "
const a = require('./app.js');
(async () => {
  const live = await a.closestSnapshot('https://example.com');
  console.log('example.com snapshot:', live ? live.timestamp + ' ' + live.url : 'none');
  const dead = await a.closestSnapshot('https://geocities.com');
  console.log('geocities.com snapshot:', dead ? dead.timestamp + ' ' + dead.url : 'none');
  if (!dead) { console.error('FAIL: expected a snapshot for geocities.com'); process.exit(1); }
  const none = await a.closestSnapshot('https://this-domain-should-not-exist-xyz12345.com');
  console.log('nonexistent domain snapshot:', none ? none.timestamp : 'none (expected)');
  console.log('live API checks OK');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
"

echo "== ALL SMOKE TESTS PASSED =="
