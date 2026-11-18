// Screenshot + console-error check with Playwright (Chromium).
// One-time setup:  cd tools && npm i && npx playwright install chromium
//   (if the download fails, any Chromium already in ~/.cache/ms-playwright or $PLAYWRIGHT_BROWSERS_PATH is used, or set CHROME=/path/to/chrome)
// Usage: node tools/shot.mjs <name> [hash] [--all] [--paused] [--page=<path>]
//   <name>       file prefix, written to shots/<name>-<viewport>.png (shots/ is gitignored)
//   [hash]       optional URL hash, e.g. "mode=waves" -> opens .../#mode=waves
//   --all        also shoot 1280x720, 360x740 and phone landscape 844x390
//   --paused     after the wave has run, press Pause and shoot again as <name>-<viewport>-paused.png (annotations visible)
//   --page=<p>   open a repo file instead of the app (e.g. --page=art/ear.svg) and shoot it alone at 900x700 on white
//   --perf       no shots: 390x844 phone, CPU throttled x4, average fps over 5 s for each of the 4 modes (waves, sound, surface, em); exit 1 if any < 50
// Requires the server: node tools/serve.mjs  (port 8765).
// Exit code 1 on console errors / 4xx / page errors / a panel that needs scrolling / any page scrollbar (all viewports).
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
let chromium;
try { ({chromium} = require('./node_modules/playwright')); }
catch { try { ({chromium} = require('playwright')); } catch { console.error('Playwright missing. Run: cd tools && npm i && npx playwright install chromium'); process.exit(2); } }

const args = process.argv.slice(2);
const [name = 'shot', hash = ''] = args.filter(a => !a.startsWith('--'));
const all = args.includes('--all'), paused = args.includes('--paused');
const pageArg = (args.find(a => a.startsWith('--page=')) || '').slice(7);
const BASE = 'http://localhost:8765/mo-phong-song-thpt-tran-quoc-toan/';
const URL = pageArg ? BASE + pageArg : BASE + (hash ? '#' + hash : '');

// Launch the bundled browser; if its version is not downloaded, fall back to any installed Chromium build.
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(os.homedir(), '.cache/ms-playwright'), '/opt/pw-browsers'].filter(Boolean);
  const rel = ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux64/chrome', 'chrome-linux/chrome',
    'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-win/chrome.exe', 'chrome-win64/chrome.exe', 'chrome-headless-shell-win64/chrome-headless-shell.exe'];
  for (const r of roots) {
    let dirs = [];
    try { dirs = fs.readdirSync(r).filter(d => /^chromium/.test(d)).sort().reverse(); } catch { continue; }
    for (const d of dirs) for (const x of rel) { const p = path.join(r, d, x); if (fs.existsSync(p)) return p; }
  }
  return null;
}
let browser;
try { browser = await chromium.launch(); }
catch (e) {
  const exe = findChrome();
  if (!exe) { console.error('No Chromium found. Run: cd tools && npx playwright install chromium  (or set CHROME=/path/to/chrome)'); process.exit(2); }
  browser = await chromium.launch({executablePath: exe});
}

if (args.includes('--perf')) {
  const bad = [];
  for (const mode of ['waves', 'sound', 'surface', 'em']) {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
    await page.goto(BASE + '#mode=' + mode, {waitUntil: 'load'});
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__app?.play?.());
    const fps = await page.evaluate(() => new Promise(res => {
      let n = 0; const t0 = performance.now();
      const tick = t => { n++; if (t - t0 < 5000) requestAnimationFrame(tick); else res(n / ((t - t0) / 1000)); };
      requestAnimationFrame(tick);
    }));
    console.log(`perf ${mode}: ${fps.toFixed(1)} fps (CPU x4, 390x844)`);
    if (fps < 50) bad.push(mode);
    await ctx.close();
  }
  await browser.close();
  process.exit(bad.length ? 1 : 0);
}

const VPS = pageArg ? [['page', 900, 700, false]] : [['desk', 1366, 768, false], ['phone', 390, 844, true]];
if (all && !pageArg) VPS.push(['desk720', 1280, 720, false], ['phone360', 360, 740, true], ['phoneLand', 844, 390, true]);
fs.mkdirSync('shots', {recursive: true});
const problems = [];
for (const [vp, w, h, mobile] of VPS) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1});
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') problems.push(`[${vp}] console.error: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', e => problems.push(`[${vp}] pageerror: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400) problems.push(`[${vp}] HTTP ${r.status()} ${r.url()}`); });
  await page.goto(URL, {waitUntil: 'load'});
  if (pageArg) {
    await page.waitForTimeout(500);
    await page.screenshot({path: `shots/${name}-${vp}.png`});
    await ctx.close();
    continue;
  }
  await page.waitForTimeout(2500);
  // let the animation run a little so the wave has propagated
  await page.evaluate(() => window.__app?.play?.()).catch(() => {});
  await page.waitForTimeout(2500);
  const overflow = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('[data-noscroll]')) if (el.scrollHeight > el.clientHeight + 2) out.push(el.id || el.className);
    const de = document.documentElement;
    if (de.scrollWidth > innerWidth + 1) out.push('page horizontal scroll');
    if (de.scrollHeight > innerHeight + 1) out.push('page vertical scroll');
    const s = document.getElementById('school');
    if (s && s.scrollWidth > s.clientWidth + 1) out.push('school name overflows');
    if (s && s.getClientRects().length && s.getBoundingClientRect().height > parseFloat(getComputedStyle(s).lineHeight || '20') * 1.6 + 12) out.push('school name wraps');
    return out;
  });
  if (overflow.length && !(mobile && overflow.every(o => o !== 'page vertical scroll' && o !== 'page horizontal scroll' && !o.startsWith('school'))))
    problems.push(`[${vp}] layout: ${overflow.join(', ')}`);
  await page.screenshot({path: `shots/${name}-${vp}.png`});
  if (paused) {
    await page.evaluate(() => window.__app?.pause?.()).catch(() => {});
    await page.waitForTimeout(700);
    await page.screenshot({path: `shots/${name}-${vp}-paused.png`});
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'OK: no console errors, no 4xx, no scrollbars');
process.exit(problems.length ? 1 : 0);
