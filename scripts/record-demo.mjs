/**
 * Records a ~30s REAL interaction video of one demo (hover → orbit → colour variants → scroll through the 5 marks →
 * scroll back) with Chrome's CDP screencast + the system ffmpeg. No mock footage: every frame is the live page.
 *
 *   node scripts/record-demo.mjs <id> [--base http://localhost:5181] [--w 1440] [--h 900]
 * Output: qc-evidence/video/<id>.mp4  (+ <id>.json with the recording condition)
 */
import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const id = args[0];
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
if (!id) {
  console.error('usage: node scripts/record-demo.mjs <beauty|fnb|real-estate|fashion|automotive> [--base URL]');
  process.exit(2);
}
const BASE = opt('--base', 'http://localhost:5181');
const W = Number(opt('--w', 1440));
const H = Number(opt('--h', 900));
const ROUTE = { beauty: '/beauty', fnb: '/fnb', 'real-estate': '/real-estate', fashion: '/fashion', automotive: '/automotive' }[id];
if (!ROUTE) throw new Error(`unknown demo ${id}`);

const outDir = path.resolve('qc-evidence', 'video');
fs.mkdirSync(outDir, { recursive: true });
const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), `baha-rec-${id}-`));

const GPU = ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'];
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GPU });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

// Visible cursor ring (screencast does not draw the OS cursor) so viewers can follow hover / drag.
await page.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:2px solid #fff;mix-blend-mode:difference;pointer-events:none;z-index:99999;transition:transform .12s,background .12s;transform:scale(1)';
    document.body.appendChild(d);
    addEventListener('pointermove', (e) => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }, true);
    addEventListener('pointerdown', () => { d.style.transform = 'scale(.7)'; d.style.background = '#fff'; }, true);
    addEventListener('pointerup', () => { d.style.transform = 'scale(1)'; d.style.background = 'transparent'; }, true);
  });
});

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(BASE + ROUTE);
await page.waitForFunction(() => window.__baha3d?.getState().ready === true, null, { timeout: 90_000 });
await page.waitForTimeout(800);

const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const file = path.join(framesDir, `f${String(frames.length).padStart(6, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  frames.push({ t: metadata.timestamp, file });
  try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch { /* page closing */ }
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1 });

const wait = (ms) => page.waitForTimeout(ms);
const state = () => page.evaluate(() => window.__baha3d.getState());
const cx = W / 2, cy = H / 2;

// 1 · hero hold + hover sweep over the object (rim light eases in/out)
await wait(1800);
await page.mouse.move(cx - 260, cy + 40, { steps: 25 });
await wait(400);
await page.mouse.move(cx, cy, { steps: 45 });
await wait(1100);
await page.mouse.move(cx + 120, cy - 30, { steps: 40 });
await wait(900);

// 2 · orbit 360° (two slow drags)
for (const dir of [1, 1]) {
  await page.mouse.move(cx - 260 * dir, cy + 120);
  await page.mouse.down();
  await page.mouse.move(cx + 260 * dir, cy + 120, { steps: 90 });
  await page.mouse.up();
  await wait(500);
}
await page.mouse.move(cx - 200, cy - 80);
await page.mouse.down();
await page.mouse.move(cx + 200, cy - 20, { steps: 60 });
await page.mouse.up();
await wait(700);
await page.locator('[data-testid=reset-view]').click();
await wait(1500);

// 3 · colour variants (each visibly re-colours the 3D material)
const chips = page.locator('[data-testid^=variant-]');
const n = await chips.count();
for (let i = 0; i < n; i++) {
  await chips.nth(i).click();
  await wait(1500);
}
if (n) { await chips.nth(0).click(); await wait(900); }

// 4 · scroll through the timeline: smooth wheel, short holds at 25/50/75/100
const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await page.mouse.move(cx, H * 0.8);
const SCROLL_SECONDS = 15;
const step = Math.max(6, Math.round(maxScroll / ((SCROLL_SECONDS * 1000) / 32)));
const holds = [0.25, 0.5, 0.75, 0.995];
let nextHold = 0;
while (true) {
  const y = await page.evaluate(() => scrollY);
  if (y >= maxScroll - 2) break;
  await page.mouse.wheel(0, step);
  await wait(32);
  const p = y / maxScroll;
  if (nextHold < holds.length && p >= holds[nextHold]) {
    await wait(nextHold === holds.length - 1 ? 1600 : 1000);
    nextHold++;
  }
}
await wait(900);

// 5 · scroll back up (state must restore) + final hover
for (let i = 0; i < 70; i++) {
  await page.mouse.wheel(0, -Math.round(maxScroll / 70));
  await wait(30);
}
await wait(1200);
await page.mouse.move(cx, cy, { steps: 30 });
await wait(1200);

await cdp.send('Page.stopScreencast');
const finalState = await state();
await wait(200);
await browser.close();

// ── encode with ffmpeg (variable timestamps → constant 30 fps) ──
if (frames.length < 10) throw new Error(`only ${frames.length} frames captured`);
const list = [];
for (let i = 0; i < frames.length; i++) {
  const dur = i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 0.5;
  list.push(`file '${frames[i].file.replace(/\\/g, '/')}'`, `duration ${dur.toFixed(4)}`);
}
list.push(`file '${frames[frames.length - 1].file.replace(/\\/g, '/')}'`);
const listFile = path.join(framesDir, 'list.txt');
fs.writeFileSync(listFile, list.join('\n'));
const out = path.join(outDir, `${id}.mp4`);
const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', `fps=30,scale=${W}:-2,format=yuv420p`, '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (ff.status !== 0) throw new Error('ffmpeg failed');
const seconds = frames[frames.length - 1].t - frames[0].t;
fs.writeFileSync(
  path.join(outDir, `${id}.json`),
  JSON.stringify({ demo: id, base: BASE, viewport: `${W}x${H}`, seconds: Number(seconds.toFixed(1)), frames: frames.length, consoleErrors: errors, endState: { scroll: finalState.scroll, orbit: finalState.orbit, variant: finalState.variant, fps: finalState.fps }, recordedAt: new Date().toISOString() }, null, 2),
);
console.log(`✔ ${out}  (${seconds.toFixed(1)}s, ${frames.length} frames, console errors: ${errors.length})`);
