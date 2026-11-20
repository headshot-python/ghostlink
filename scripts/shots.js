/* Ghostlink demo screenshots — drives the local site in headless Chromium
 * and captures the frames used for the demo video.
 *
 * NOTE ON NETWORK: this sandbox blocks Chromium egress (the proxy CONNECT
 * hangs), so archive.org traffic is served from RECORDED fixtures — real API
 * responses and a real archived page captured with curl (see demo/fixtures/).
 * The app logic runs for real in a real browser; only the transport is
 * stubbed. The live app talks to the real API; see scripts/smoke-test.sh,
 * which proves the same calls against the live API from Node.
 *
 * Usage: node scripts/shots.js  (serves the site on :8931 first, or set BASE_URL)
 * Requires: playwright-core + chromium (see README / probe notes).
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8931/index.html';
const OUT = path.join(__dirname, '..', 'demo', 'shots');
const FIX = path.join(__dirname, '..', 'demo', 'fixtures');
const read = f => fs.readFileSync(path.join(FIX, f));
const PROXY_RAW = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://hatch-egress-proxy:3128';
const _pu = new URL(PROXY_RAW);
const PROXY = { server: _pu.protocol + '//' + _pu.host, bypass: '127.0.0.1,localhost' };
if (_pu.username) { PROXY.username = decodeURIComponent(_pu.username); PROXY.password = decodeURIComponent(_pu.password); }
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    proxy: PROXY,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text()); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));

  /* --- recorded-fixture routes (see header note) --- */
  await page.route('**/archive.org/wayback/available*', async route => {
    const u = new URL(route.request().url());
    const target = u.searchParams.get('url') || '';
    const ts = u.searchParams.get('timestamp') || '';
    let file = null;
    if (target.includes('geocities.com')) {
      file = ts ? `avail-geocities-${ts.slice(0, 4)}.json` : 'avail-geocities.json';
    } else if (target.includes('myspace.com')) file = 'avail-myspace.json';
    else if (target.includes('example.com')) file = 'avail-example.json';
    else if (target.includes('google.com/reader')) file = 'avail-reader.json';
    if (file && fs.existsSync(path.join(FIX, file))) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: read(file) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: target, archived_snapshots: {} }) });
    }
  });
  // Live checks: dead domains abort (unreachable), example.com answers.
  await page.route('https://geocities.com/*', r => r.abort());
  await page.route('https://www.geocities.com/*', r => r.abort());
  await page.route('https://myspace.com/*', r => r.abort());
  await page.route('https://www.myspace.com/*', r => r.abort());
  await page.route('https://www.google.com/reader*', r => r.abort());
  await page.route('https://this-domain-should-not-exist-xyz12345.com/*', r => r.abort());
  await page.route('https://example.com/*', r => r.fulfill({ status: 200, body: 'ok' }));
  // Archived pages: serve the recorded HTML; anything else on the archive aborts.
  await page.route('**/web.archive.org/**', async route => {
    const u = route.request().url();
    if (u.includes('myspace.com')) {
      await route.fulfill({ status: 200, contentType: 'text/html', body: read('archived-myspace.html') });
    } else if (u.includes('geocities.com')) {
      await route.fulfill({ status: 200, contentType: 'text/html', body: read('archived-geocities.html') });
    } else {
      await route.abort();
    }
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '01-home.png') });

  // Resurrect geocities.com
  await page.fill('#url-input', 'geocities.com');
  await page.click('#resurrect-btn');
  await page.waitForSelector('#result-card:not([hidden])', { timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, '02-resurrected.png') });

  // Resurrect myspace.com for the viewer shot (real archived page content)
  await page.click('.chip[data-url="https://www.myspace.com"]');
  await page.waitForFunction(
    () => !document.querySelector('#result-card').hidden &&
      document.querySelector('#result-badge').textContent.includes('Resurrected'),
    { timeout: 30000 }
  );
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUT, '03-viewer.png') });

  // Batch tab
  await page.click('[data-tab="batch"]');
  await page.fill('#batch-input', [
    'https://geocities.com',
    'https://example.com',
    'https://www.google.com/reader',
    'https://this-domain-should-not-exist-xyz12345.com',
    'https://www.myspace.com',
  ].join('\n'));
  await page.click('#batch-btn');
  await page.waitForFunction(
    () => document.querySelector('#batch-progress')?.textContent.startsWith('Done'),
    { timeout: 60000 }
  );
  await page.screenshot({ path: path.join(OUT, '04-batch.png') });

  // Graveyard tab
  await page.click('[data-tab="graveyard"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '05-graveyard.png') });

  // Narrow viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('[data-tab="resurrect"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '06-mobile.png') });

  await browser.close();
  console.log('shots saved to', OUT);
})().catch(e => { console.error('SHOT SCRIPT FAILED:', e.message); process.exit(1); });
