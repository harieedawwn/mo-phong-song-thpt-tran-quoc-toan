// Screenshot + console-error check with Playwright (Chromium).
// One-time setup:  cd tools && npm i playwright@1 && npx playwright install chromium
// Usage: node tools/shot.mjs <name> [hash] [--all]
//   <name>  file prefix, written to shots/<name>-<viewport>.png (shots/ is gitignored)
//   [hash]  optional URL hash, e.g. "mode=transverse" -> opens .../#mode=transverse
//   --all   also shoot 1280x720, 360x740 and phone landscape 844x390
// Requires the server: node tools/serve.mjs  (port 8765). Exit code 1 if console errors / 4xx / page errors.
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({chromium} = require('./node_modules/playwright')); }
catch { try { ({chromium} = require('playwright')); } catch { console.error('Playwright missing. Run: cd tools && npm i playwright@1 && npx playwright install chromium'); process.exit(2); } }
const [name = 'shot', hash = ''] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const all = process.argv.includes('--all');
const URL = 'http://localhost:8765/mo-phong-song-thpt-tran-quoc-toan/' + (hash ? '#' + hash : '');
const VPS = [['desk', 1366, 768, false], ['phone', 390, 844, true]];
if (all) VPS.push(['desk720', 1280, 720, false], ['phone360', 360, 740, true], ['phoneLand', 844, 390, true]);
fs.mkdirSync('shots', {recursive: true});
const browser = await chromium.launch();
const problems = [];
for (const [vp, w, h, mobile] of VPS) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1});
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') problems.push(`[${vp}] console.error: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', e => problems.push(`[${vp}] pageerror: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400) problems.push(`[${vp}] HTTP ${r.status()} ${r.url()}`); });
  await page.goto(URL, {waitUntil: 'load'});
  await page.waitForTimeout(2500);
  // let the animation run a little so the wave has propagated
  await page.evaluate(() => window.__app?.play?.()).catch(() => {});
  await page.waitForTimeout(2500);
  const overflow = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('[data-noscroll]')) if (el.scrollHeight > el.clientHeight + 2) out.push(el.id || el.className);
    if (document.documentElement.scrollWidth > innerWidth + 1) out.push('page horizontal scroll');
    return out;
  });
  if (overflow.length && !mobile) problems.push(`[${vp}] panel needs scrolling: ${overflow.join(', ')}`);
  await page.screenshot({path: `shots/${name}-${vp}.png`});
  await ctx.close();
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'OK: no console errors, no 4xx, no forced scrolling');
process.exit(problems.length ? 1 : 0);
