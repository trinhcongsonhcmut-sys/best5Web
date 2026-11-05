/**
 * Quick look-dev capture for /automotive (dev only): scroll marks / variants / hover into an output folder.
 *   node src/demos/automotive/tools/shots.mjs <outDir> [--base http://localhost:5195] [--p 0,0.25,0.5] [--w 1440 --h 900] [--variants] [--hover]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] ?? 'shots');
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt('--base', 'http://localhost:5195');
const W = Number(opt('--w', 1440)), H = Number(opt('--h', 900));
const marks = opt('--p', '0,0.25,0.5,0.75,1').split(',').map(Number);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: W < 700, hasTouch: W < 700 });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push(`requestfailed ${r.url()}`));
const t0 = Date.now();
await page.goto(BASE + '/automotive');
await page.waitForFunction(() => window.__baha3d?.getState().ready === true, null, { timeout: 120_000 });
console.log('ready in', Date.now() - t0, 'ms');
await page.waitForTimeout(1500);
const st = () => page.evaluate(() => window.__baha3d.getState());
for (const p of marks) {
  await page.evaluate((v) => window.__baha3d.scrollTo(v), p);
  await page.waitForTimeout(2600);
  const s = await st();
  await page.screenshot({ path: path.join(out, `p${String(Math.round(p * 1000)).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 88 });
  console.log('p', p, 'fps', s.fps.avg.toFixed(1), 'extra', JSON.stringify(s.extra));
}
if (args.includes('--variants')) {
  await page.evaluate(() => window.__baha3d.scrollTo(0));
  await page.waitForTimeout(2000);
  const n = await page.locator('[data-testid^=variant-]').count();
  for (let i = 0; i < n; i++) {
    await page.locator('[data-testid^=variant-]').nth(i).click();
    await page.mouse.move(W - 30, H / 2);
    await page.waitForTimeout(1900);
    await page.screenshot({ path: path.join(out, `variant-${i}.jpg`), type: 'jpeg', quality: 88 });
    console.log('variant', i, JSON.stringify(await page.evaluate(() => window.__baha3d.material('primary'))));
  }
}
if (args.includes('--hover')) {
  await page.evaluate(() => window.__baha3d.scrollTo(0));
  await page.waitForTimeout(2000);
  for (const [fx, fy, name] of [[0.5, 0.62, 'body'], [0.47, 0.53, 'glass'], [0.62, 0.7, 'wheel'], [0.71, 0.64, 'light']]) {
    await page.mouse.move(W * fx, H * fy, { steps: 6 });
    await page.waitForTimeout(1300);
    const s = await st();
    await page.screenshot({ path: path.join(out, `hover-${name}.jpg`), type: 'jpeg', quality: 88 });
    console.log('hover', name, s.hover.value.toFixed(2), s.extra.hoverPart, 'fps', s.fps.avg.toFixed(1));
  }
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
