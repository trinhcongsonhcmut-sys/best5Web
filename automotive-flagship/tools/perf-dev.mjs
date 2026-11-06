/**
 * Dev-server perf probe for /automotive only (NOT production numbers): idle FPS at the hero (3 s rAF), scripted scroll
 * 0→100 % (8 s), p95 / worst frame, ready time, renderer info (draw calls, triangles) at 5 marks.
 *   node automotive-flagship/tools/perf-dev.mjs [--base http://localhost:5195] [--w 1440 --h 900]
 */
import { chromium } from '@playwright/test';
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt('--base', 'http://localhost:5195');
const W = Number(opt('--w', 1440)), H = Number(opt('--h', 900));
const probe = (mode) => `new Promise((res) => {
  const times = []; let last = performance.now(); const t0 = last;
  const max = document.documentElement.scrollHeight - innerHeight; const dur = ${mode === 'scroll' ? 8000 : 3000};
  function f(t) { times.push(t - last); last = t; const p = Math.min(1, (t - t0) / dur);
    ${mode === 'scroll' ? 'window.scrollTo(0, p * max);' : ''}
    if (t - t0 >= dur) { const s = [...times].sort((a, b) => a - b); res({ fps: +(times.length / ((t - t0) / 1000)).toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), worst: +s[s.length - 1].toFixed(1) }); }
    else requestAnimationFrame(f); }
  requestAnimationFrame(f); })`;
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const t0 = Date.now();
await p.goto(BASE + '/automotive');
await p.waitForFunction(() => window.__baha3d?.getState().ready === true, null, { timeout: 120000 });
const ready = Date.now() - t0;
await p.waitForTimeout(1500);
const gpu = await p.evaluate(() => { const g = window.__axDebug.gl.getContext(); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; });
const idle = await p.evaluate(probe('idle'));
const marks = [];
for (const m of [0, 0.25, 0.5, 0.75, 1]) {
  await p.evaluate((v) => window.__baha3d.scrollTo(v), m);
  await p.waitForTimeout(2200);
  const r = await p.evaluate(() => { const i = window.__axDebug.gl.info.render; return { calls: i.calls, tris: i.triangles }; });
  marks.push({ p: m, ...r, ...(await p.evaluate(probe('idle'))) });
}
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1500);
const scroll = await p.evaluate(probe('scroll'));
console.log(JSON.stringify({ condition: { mode: 'vite dev', viewport: `${W}x${H}`, dpr: 1, gpu, chrome: b.version() }, readyMs: ready, idle, scroll, marks, errors }, null, 1));
await b.close();
