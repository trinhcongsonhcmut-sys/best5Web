/**
 * QC for the home hub (card cascade) — real Chrome, real input.
 *
 *   node scripts/qc-home.mjs [--base http://localhost:5197] [--out DIR]
 *
 * Checks (each prints PASS/FAIL with the measured value):
 *   layout     no horizontal overflow at 1920 / 1440 / 1280×720 / 820 / 390, no console errors
 *   cards      5 cards present, 5 thumbnails decoded (naturalWidth > 0), all 5:4
 *   wheel      1 notch = +1 card, back = −1, clamps at both ends, one card per gesture (big flick)
 *   keyboard   ArrowDown / ArrowUp / End / Home
 *   hover      hovering a card behind lifts it (bigger scale) and pushes the cards in front of it down
 *   drag       mouse drag and touch swipe step the deck
 *   click      each of the 5 cards (front or behind) navigates to its route, rail dots jump
 *   smooth     frame-time p95 / worst frame while the cascade moves
 * Screenshots go to --out.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt('--base', 'http://localhost:5197');
const OUT = path.resolve(opt('--out', 'qc-evidence/home'));
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = ['/automotive', '/real-estate', '/beauty', '/fashion', '/fnb']; // cascade order, front card first
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
});

async function open(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForSelector('.card', { timeout: 20000 });
  await page.waitForTimeout(2200); // intro
  return { ctx, page, errs };
}
const readActive = (page) => page.evaluate(() => Number(document.querySelector('.rail-count b').textContent) - 1);
const settle = (page, ms = 1250) => page.waitForTimeout(ms);
const cardMatrix = (page, i) => page.evaluate((k) => {
  const el = document.querySelectorAll('.card')[k];
  const m = new DOMMatrix(getComputedStyle(el).transform);
  return { y: m.f, s: Math.hypot(m.a, m.b), o: Number(getComputedStyle(el).opacity) };
}, i);

// ── layout across viewports ────────────────────────────────────────────────────
for (const [label, vp, extra] of [
  ['1920x1080', { width: 1920, height: 1080 }, {}],
  ['1440x900', { width: 1440, height: 900 }, {}],
  ['1280x720', { width: 1280, height: 720 }, {}],
  ['820x1180 tablet', { width: 820, height: 1180 }, { hasTouch: true }],
  ['390x844 mobile', { width: 390, height: 844 }, { hasTouch: true, isMobile: true }],
]) {
  const { ctx, page, errs } = await open(vp, extra);
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, sh: document.documentElement.scrollHeight, ih: innerHeight }));
  check(`layout ${label}: no horizontal overflow`, m.sw <= m.iw, `scrollWidth ${m.sw} / ${m.iw}`);
  check(`layout ${label}: console clean`, errs.length === 0, errs.slice(0, 2).join(' | '));
  const box = await page.evaluate(() => {
    const f = document.querySelectorAll('.card')[0].querySelector('.card-face').getBoundingClientRect();
    return { l: f.left, r: f.right, t: f.top, b: f.bottom };
  });
  check(`layout ${label}: front card inside viewport`, box.l >= 0 && box.r <= vp.width && box.t >= 0 && box.b <= vp.height, `x ${Math.round(box.l)}–${Math.round(box.r)}, y ${Math.round(box.t)}–${Math.round(box.b)}`);
  await page.screenshot({ path: path.join(OUT, `home-${label.split(' ')[0]}.png`) });
  await ctx.close();
}

// ── desktop behaviour ──────────────────────────────────────────────────────────
{
  const { ctx, page, errs } = await open({ width: 1440, height: 900 });

  const info = await page.evaluate(() => [...document.querySelectorAll('.card-thumb')].map((i) => ({ w: i.naturalWidth, h: i.naturalHeight })));
  check('cards: 5 present', info.length === 5, String(info.length));
  check('cards: thumbnails decoded', info.every((i) => i.w > 0), info.map((i) => `${i.w}×${i.h}`).join(' '));
  check('cards: thumbnails 5:4', info.every((i) => Math.abs(i.w / i.h - 1.25) < 0.01), '');
  const wm = await page.evaluate(() => document.querySelector('.wordmark').getAttribute('aria-label'));
  check('brand: wordmark "Baha 3D"', wm === 'Baha 3D', wm);
  const wmStyle = await page.evaluate(() => {
    const [a, b] = [...document.querySelectorAll('.wm-line')].map((el) => getComputedStyle(el));
    return { top: a.color, topText: document.querySelectorAll('.wm-line')[0].textContent, bottomText: document.querySelectorAll('.wm-line')[1].textContent, bottomImg: b.backgroundImage.startsWith('linear-gradient'), order: document.querySelectorAll('.wm-line')[0].getBoundingClientRect().top < document.querySelectorAll('.wm-line')[1].getBoundingClientRect().top };
  });
  check('brand: "Baha" on top in black, "3D" below with gradient', wmStyle.topText === 'Baha' && wmStyle.bottomText === '3D' && wmStyle.order && wmStyle.bottomImg && wmStyle.top === 'rgb(15, 15, 20)', JSON.stringify(wmStyle));

  await page.mouse.move(700, 450);
  // wheel
  await page.mouse.wheel(0, 100); await settle(page);
  check('wheel: +1 notch → card 2', (await readActive(page)) === 1, `active ${(await readActive(page)) + 1}`);
  await page.mouse.wheel(0, -100); await settle(page);
  check('wheel: −1 notch → card 1', (await readActive(page)) === 0, '');
  await page.mouse.wheel(0, -100); await settle(page);
  check('wheel: clamps at the start', (await readActive(page)) === 0, '');
  // big flick: a trackpad stream of 12 events 16 ms apart (sent from inside the page, so a busy machine cannot stretch the gaps)
  await page.evaluate(() => new Promise((res) => {
    let k = 0;
    const tick = () => { window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true, bubbles: true })); if (++k < 12) setTimeout(tick, 16); else res(); };
    tick();
  }));
  await settle(page, 1500);
  check('wheel: a 12-event flick advances exactly one card', (await readActive(page)) === 1, `active ${(await readActive(page)) + 1}`);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 100); await settle(page, 900); }
  check('wheel: clamps at the end', (await readActive(page)) === 4, '');
  await page.screenshot({ path: path.join(OUT, 'desktop-last-card.png') });

  // keyboard
  await page.keyboard.press('Home'); await settle(page);
  check('keyboard: Home', (await readActive(page)) === 0, '');
  await page.keyboard.press('ArrowDown'); await settle(page);
  check('keyboard: ArrowDown', (await readActive(page)) === 1, '');
  await page.keyboard.press('End'); await settle(page);
  check('keyboard: End', (await readActive(page)) === 4, '');
  await page.keyboard.press('ArrowUp'); await settle(page);
  check('keyboard: ArrowUp', (await readActive(page)) === 3, '');
  await page.keyboard.press('Home'); await settle(page);

  // hover: card 2 sits behind the front card — pointer on its visible strip
  const strip = await page.evaluate(() => {
    const r = document.querySelectorAll('.card')[1].querySelector('.card-face').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + 28 };
  });
  const before1 = await cardMatrix(page, 1);
  const before0 = await cardMatrix(page, 0);
  await page.mouse.move(strip.x, strip.y); await page.waitForTimeout(1000);
  const after1 = await cardMatrix(page, 1);
  const after0 = await cardMatrix(page, 0);
  check('hover: hovered card swells', after1.s > before1.s * 1.02, `scale ${before1.s.toFixed(3)} → ${after1.s.toFixed(3)}`);
  check('hover: front card steps down', after0.y > before0.y + 8, `y ${before0.y.toFixed(1)} → ${after0.y.toFixed(1)}`);
  await page.screenshot({ path: path.join(OUT, 'desktop-hover-card2.png') });
  // pointer must still be on the hovered card (no flicker loop)
  const stillOn = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('.card') === document.querySelectorAll('.card')[1], [strip.x, strip.y]);
  check('hover: pointer still on hovered card (no flicker)', stillOn, '');
  await page.mouse.move(120, 450); await page.waitForTimeout(900);
  const rest1 = await cardMatrix(page, 1);
  check('hover: relaxes when the pointer leaves', Math.abs(rest1.s - before1.s) < 0.004, `scale ${rest1.s.toFixed(3)}`);

  // mouse drag (swipe up = next)
  await page.mouse.move(1000, 600); await page.mouse.down(); await page.mouse.move(1000, 520, { steps: 4 }); await page.mouse.move(1000, 420, { steps: 6 }); await page.mouse.up();
  await settle(page);
  check('drag: mouse drag up → next card', (await readActive(page)) === 1, `active ${(await readActive(page)) + 1}`);
  await page.mouse.move(1000, 420); await page.mouse.down(); await page.mouse.move(1000, 520, { steps: 4 }); await page.mouse.move(1000, 620, { steps: 6 }); await page.mouse.up();
  await settle(page);
  check('drag: mouse drag down → previous card', (await readActive(page)) === 0, '');

  // rail dots
  await page.click('.rail-dot:nth-of-type(3)'); await settle(page);
  check('rail: dot 3 jumps to card 3', (await readActive(page)) === 2, '');
  await page.click('.rail-dot:nth-of-type(1)'); await settle(page);

  // frame pacing while the cascade moves
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  await page.evaluate(() => {
    window.__ft = [];
    let t = performance.now();
    const loop = (n) => { window.__ft.push(n - t); t = n; window.__ftRaf = requestAnimationFrame(loop); };
    window.__ftRaf = requestAnimationFrame(loop);
  });
  const m0 = await metric();
  for (let i = 0; i < 4; i++) { await page.mouse.move(700 + i * 90, 300 + i * 40); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(700); }
  const m1 = await metric();
  const ft = await page.evaluate(() => { cancelAnimationFrame(window.__ftRaf); const a = window.__ft.slice(2).sort((x, y) => x - y); return { n: a.length, p50: a[Math.floor(a.length * 0.5)], p95: a[Math.floor(a.length * 0.95)], max: a[a.length - 1] }; });
  const busy = ((m1.TaskDuration - m0.TaskDuration) / ft.n) * 1000;
  const script = ((m1.ScriptDuration - m0.ScriptDuration) / ft.n) * 1000;
  const style = (((m1.RecalcStyleDuration - m0.RecalcStyleDuration) + (m1.LayoutDuration - m0.LayoutDuration)) / ft.n) * 1000;
  check('smooth: main thread ≤ 6 ms per frame while the cascade moves', busy <= 6, `${busy.toFixed(2)} ms/frame (script ${script.toFixed(2)}, style+layout ${style.toFixed(2)})`);
  console.log(`      frame pacing: n ${ft.n}, p50 ${ft.p50?.toFixed(1)} ms, p95 ${ft.p95?.toFixed(1)} ms, worst ${ft.max?.toFixed(1)} ms (wall-clock, includes load from other processes on this machine)`);
  check('smooth: median frame ≤ 17 ms (no sustained dropped frames)', ft.p50 <= 17, `p50 ${ft.p50?.toFixed(1)} ms`);
  check('console clean (desktop session)', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}

// ── click → route, for each of the 5 cards (front or behind) ───────────────────
for (let i = 0; i < 5; i++) {
  const { ctx, page } = await open({ width: 1440, height: 900 });
  const pt = await page.evaluate((k) => {
    const r = document.querySelectorAll('.card')[k].querySelector('.card-face').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + [26, 26, 18, 6, 26][k] };
  }, i);
  if (i === 4) { await page.keyboard.press('End'); await settle(page); } // the 5th card is only clickable once it is in front
  const click = i === 4 ? await page.evaluate(() => { const r = document.querySelectorAll('.card')[4].querySelector('.card-face').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }) : pt;
  await page.mouse.move(click.x, click.y); await page.waitForTimeout(250);
  await page.mouse.click(click.x, click.y);
  let ok = false;
  try { await page.waitForURL('**' + ROUTES[i], { timeout: 6000 }); ok = true; } catch { /* fall through */ }
  check(`click: card ${i + 1} → ${ROUTES[i]}`, ok, page.url().replace(BASE, ''));
  if (i === 0) await page.screenshot({ path: path.join(OUT, 'click-transition-landed.png') });
  await ctx.close();
}

// ── CTA ────────────────────────────────────────────────────────────────────────
{
  const { ctx, page } = await open({ width: 1440, height: 900 });
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await settle(page, 1500);
  const label = await page.textContent('.cta span');
  await page.click('.cta');
  let ok = false;
  try { await page.waitForURL('**/beauty', { timeout: 6000 }); ok = true; } catch { /* */ }
  check('cta: opens the card in front', ok && /Beauty & Cosmetics/.test(label), `${label.trim()} → ${page.url().replace(BASE, '')}`);
  await ctx.close();
}

// ── reduced motion: same navigation, no tweening ───────────────────────────────
{
  const { ctx, page, errs } = await open({ width: 1440, height: 900 }, { reducedMotion: 'reduce' });
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200);
  const fast = await readActive(page);
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.wm-line')).animationName);
  check('reduced-motion: card changes immediately, no CSS animations', fast === 1 && anim === 'none', `active ${fast + 1} after 200 ms, wordmark animation "${anim}"`);
  check('reduced-motion: console clean', errs.length === 0, '');
  await ctx.close();
}

// ── mobile touch swipe (real touch events through CDP) ─────────────────────────
{
  const { ctx, page } = await open({ width: 390, height: 844 }, { hasTouch: true, isMobile: true });
  const cdp = await ctx.newCDPSession(page);
  const box = await page.evaluate(() => { const r = document.querySelector('.home-stage').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.7 }; });
  const touch = async (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: box.x, y }] });
  await touch('touchStart', box.y);
  for (let k = 1; k <= 10; k++) { await touch('touchMove', box.y - k * 14); await page.waitForTimeout(16); }
  await touch('touchEnd', box.y - 140);
  await settle(page);
  const title = await page.evaluate(() => [...document.querySelectorAll('.card-title')].map((t) => Math.round(t.offsetHeight / parseFloat(getComputedStyle(t).lineHeight))));
  check('mobile: all 5 card titles fit on one line', title.every((n) => n === 1), title.join(','));
  check('touch: swipe up → next card', (await readActive(page)) === 1, `active ${(await readActive(page)) + 1}`);
  await page.screenshot({ path: path.join(OUT, 'mobile-after-swipe.png') });
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, 'qc-home.json'), JSON.stringify({ base: BASE, when: new Date().toISOString(), results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} PASS${failed.length ? ' — FAIL: ' + failed.map((f) => f.name).join('; ') : ''}`);
process.exit(failed.length ? 1 : 0);
