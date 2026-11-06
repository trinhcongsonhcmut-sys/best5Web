/**
 * Home-page thumbnails — captures the hero frame of each demo route straight from the live page.
 *
 *   node scripts/capture-home-thumbs.mjs [--base http://localhost:5197] [--only beauty,fnb]
 *
 * Output:
 *   public/thumbs/<id>.jpg                 clean frame (UI chrome hidden, only the 3D hero) — what the home cards use
 *   <scratchpad>/<id>-raw.jpg  (--raw DIR) full page with its own UI, for comparison
 *
 * All five thumbnails share one frame (1250×1000 viewport = 5:4, no crop), so framing and quality are uniform.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt('--base', 'http://localhost:5197');
const RAW = opt('--raw', '');
const ONLY = opt('--only', '').split(',').filter(Boolean);
const ROUTES = {
  beauty: '/beauty',
  fnb: '/fnb',
  'real-estate': '/real-estate',
  fashion: '/fashion',
  automotive: '/automotive',
};
const OUT = path.resolve('public', 'thumbs');
fs.mkdirSync(OUT, { recursive: true });
if (RAW) fs.mkdirSync(RAW, { recursive: true });

const VIEW = { width: 1250, height: 1000 }; // 5:4 — the demo lays itself out for this frame
// Shared chrome + each demo's small copy (kickers, pickers, brand marks). Big hero lettering stays: it is part of the hero.
const HIDE_COMMON = '.hud, .overlay, .hud-back, .scroll-hint, .stage-dots, .variant-picker';
const HIDE_EXTRA = {
  fnb: '.fnb-brand, .fnb-picker, .kick, .sub',
  fashion: '.fx-mark, .fx-kick, .fx-line, .fx-nextlabel, .fx-pick-head, .fx-next, .fx-blk',
};

// Per-demo framing: zoom factor + centre (fractions of the 1250×1000 frame). Keeps the subject large and every card 5:4.
const FRAME = {
  beauty: { s: 1.0, cx: 0.5, cy: 0.5 },
  fnb: { s: 1.2, cx: 0.545, cy: 0.51 },
  'real-estate': { s: 1.3, cx: 0.55, cy: 0.47 },
  fashion: { s: 1.0, cx: 0.5, cy: 0.5 },
  automotive: { s: 1.3, cx: 0.48, cy: 0.57 },
};
const clipFor = (id) => {
  const { s, cx, cy } = FRAME[id];
  const w = VIEW.width / s;
  const h = VIEW.height / s;
  const x = Math.min(Math.max(cx * VIEW.width - w / 2, 0), VIEW.width - w);
  const y = Math.min(Math.max(cy * VIEW.height - h / 2, 0), VIEW.height - h);
  return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) };
};

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
});

for (const [id, route] of Object.entries(ROUTES)) {
  if (ONLY.length && !ONLY.includes(id)) continue;
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1.1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(BASE + route, { waitUntil: 'load' });
  let ready = false;
  try {
    await page.waitForFunction(() => window.__baha3d?.getState?.().ready === true, null, { timeout: 90000 });
    ready = true;
  } catch {
    /* some demos may not expose the bridge — fall through with a fixed wait */
  }
  await page.mouse.move(6, VIEW.height - 6); // park the pointer so no hover state leaks into the frame
  await page.waitForTimeout(3500); // let intro tweens / post effects settle
  if (RAW) await page.screenshot({ path: path.join(RAW, `${id}-raw.jpg`), type: 'jpeg', quality: 85 });
  await page.addStyleTag({ content: `${HIDE_COMMON}, ${HIDE_EXTRA[id] ?? '.never'} { visibility: hidden !important; }` });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${id}.jpg`), type: 'jpeg', quality: 86, clip: clipFor(id) });
  console.log(id.padEnd(12), 'ready=', ready, 'errors=', errs.length);
  await ctx.close();
}
await browser.close();
