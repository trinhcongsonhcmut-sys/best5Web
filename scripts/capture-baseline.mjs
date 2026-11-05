/**
 * Baseline capture — freezes the CURRENT look + motion of a demo as reference before any asset swap.
 * Everything is read from the live page through the QC bridge (window.__baha3d), never estimated.
 *
 *   node scripts/capture-baseline.mjs <automotive|beauty|real-estate> [--base http://localhost:5181] [--tag v1]
 *
 * Output: baseline/<tag>/<id>/
 *   desktop/scroll-XXX.jpg   9 scroll marks (0, 12.5 … 100 %)
 *   desktop/orbit-XXX.jpg    8 orbit angles at the hero mark (0°, 45° … 315°)
 *   desktop/variant-N.jpg    every colour/material variant at the hero mark
 *   desktop/hover-on.jpg     pointer over the subject (rim / emissive on)
 *   mobile/scroll-XXX.jpg    390×844 portrait at 0 / 50 / 100 %
 *   baseline.json            camera pose per mark, dense camera path, orbit readouts, variant material readouts,
 *                            hover values, fps + GPU condition, console errors
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const id = args[0];
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const ROUTES = { automotive: '/automotive', beauty: '/beauty', 'real-estate': '/real-estate', fashion: '/fashion', fnb: '/fnb' };
if (!ROUTES[id]) {
  console.error('usage: node scripts/capture-baseline.mjs <automotive|beauty|real-estate> [--base URL] [--tag v1]');
  process.exit(2);
}
const BASE = opt('--base', 'http://localhost:5181');
const TAG = opt('--tag', 'v1');
const OUT = path.resolve('baseline', TAG, id);
fs.mkdirSync(path.join(OUT, 'desktop'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'mobile'), { recursive: true });

const GPU = ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'];
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GPU });
const pct = (p) => String(Math.round(p * 1000) / 10).replace('.', '_').padStart(3, '0');
const r3 = (v) => (Array.isArray(v) ? v.map((x) => Math.round(x * 1000) / 1000) : Math.round(v * 1000) / 1000);

async function open(viewport, isMobile = false) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + ROUTES[id]);
  await page.waitForFunction(() => window.__baha3d?.getState().ready === true, null, { timeout: 90_000 });
  await page.waitForTimeout(1500);
  return { ctx, page, errors };
}
const state = (page) => page.evaluate(() => window.__baha3d.getState());
const mat = (page) => page.evaluate(() => window.__baha3d.material('primary'));
const scrollTo = async (page, p, settle = 2600) => {
  await page.evaluate((v) => window.__baha3d.scrollTo(v), p);
  await page.waitForTimeout(settle);
};
const shot = (page, rel) => page.screenshot({ path: path.join(OUT, rel), type: 'jpeg', quality: 88 });
const pose = (s) => ({ scroll: r3(s.scroll.smooth), position: r3(s.camera.position), target: r3(s.camera.target), fov: r3(s.camera.fov), extra: s.extra });

const result = { demo: id, route: ROUTES[id], base: BASE, capturedAt: new Date().toISOString(), viewport: '1440x900', marks: [], cameraPath: [], orbit: [], variants: [], hover: {}, mobile: [] };

/* ───────────── desktop ───────────── */
{
  const W = 1440, H = 900;
  const { ctx, page, errors } = await open({ width: W, height: H });
  result.gpu = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return { renderer: gl && ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown', ua: navigator.userAgent };
  });
  result.materials = await page.evaluate(() => window.__baha3d.materials());
  const cx = W / 2, cy = H / 2;

  // hover: park the pointer on the subject, read the rim / emissive response, then leave
  await page.mouse.move(40, 40);
  await page.waitForTimeout(900);
  const before = await state(page);
  await page.mouse.move(cx, cy, { steps: 20 });
  await page.waitForTimeout(1400);
  const on = await state(page);
  await shot(page, 'desktop/hover-on.jpg');
  const onMat = await mat(page);
  await page.mouse.move(40, 40, { steps: 10 });
  await page.waitForTimeout(1400);
  const off = await state(page);
  result.hover = { idle: r3(before.hover.value), on: r3(on.hover.value), onId: on.hover.id, afterLeave: r3(off.hover.value), primaryWhileHovered: onMat };
  await shot(page, 'desktop/hover-off.jpg');

  // orbit: 8 × 45° at the hero mark, driven by real mouse drags (rad/px from the rig's sensitivity)
  const SENS = 0.0058;
  for (let k = 0; k < 8; k++) {
    if (k > 0) {
      const px = (Math.PI / 4) / SENS;
      await page.mouse.move(cx - px / 2, cy + 140);
      await page.mouse.down();
      await page.mouse.move(cx + px / 2, cy + 140, { steps: 30 });
      await page.mouse.up();
    }
    await page.mouse.move(6, H - 6); // park the pointer on empty background (no hover) before the shot
    await page.waitForTimeout(1300);
    const s = await state(page);
    result.orbit.push({ step: k, requestedDeg: k * 45, yawDeg: r3((s.orbit.yaw * 180) / Math.PI), yawTotalDeg: r3((s.orbit.yawTotal * 180) / Math.PI), pitch: r3(s.orbit.pitch), dolly: r3(s.orbit.dolly), camera: pose(s) });
    await shot(page, `desktop/orbit-${String(k * 45).padStart(3, '0')}.jpg`);
  }
  await page.evaluate(() => window.__baha3d.resetView());
  await page.waitForTimeout(1800);

  // variants at the hero mark
  const chips = page.locator('[data-testid^=variant-]');
  const n = await chips.count();
  for (let i = 0; i < n; i++) {
    await chips.nth(i).click();
    await page.mouse.move(6, H - 6); // park the pointer on empty background (no hover) before the shot
    await page.waitForTimeout(1900);
    const s = await state(page);
    result.variants.push({ index: i, id: s.variant.id, label: (await chips.nth(i).getAttribute('aria-label')) || (await chips.nth(i).innerText()).trim(), primary: await mat(page), extra: s.extra });
    await shot(page, `desktop/variant-${i}.jpg`);
  }
  if (n) {
    await chips.nth(0).click();
    await page.waitForTimeout(1500);
  }

  // scroll marks (screenshots) — 0 … 100 % in 12.5 % steps
  for (const p of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]) {
    await scrollTo(page, p);
    const s = await state(page);
    result.marks.push({ p, ...pose(s), hover: r3(s.hover.value), fps: r3(s.fps.avg) });
    await shot(page, `desktop/scroll-${pct(p)}.jpg`);
  }
  // dense camera path (every 2.5 %) — the exact choreography to preserve when re-framing a new model
  for (let i = 0; i <= 40; i++) {
    const p = i / 40;
    await scrollTo(page, p, 1300);
    result.cameraPath.push(pose(await state(page)));
  }
  await scrollTo(page, 0, 2000);
  const fin = await state(page);
  result.fps = { avg: r3(fin.fps.avg), frames: fin.fps.frames };
  result.consoleErrors = [...errors, ...fin.errors];
  await ctx.close();
}

/* ───────────── mobile portrait ───────────── */
{
  const { ctx, page, errors } = await open({ width: 390, height: 844 }, true);
  for (const p of [0, 0.5, 1]) {
    await scrollTo(page, p);
    const s = await state(page);
    result.mobile.push({ p, ...pose(s) });
    await shot(page, `mobile/scroll-${pct(p)}.jpg`);
  }
  result.mobileErrors = errors;
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'baseline.json'), JSON.stringify(result, null, 2));
console.log(`✔ ${id}: ${result.marks.length} marks, ${result.orbit.length} orbit shots, ${result.variants.length} variants, hover ${result.hover.idle}→${result.hover.on}→${result.hover.afterLeave}, fps ${result.fps.avg}, errors ${result.consoleErrors.length}`);
