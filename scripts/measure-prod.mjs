/**
 * Production-build performance measurement for all 5 demos — run on a QUIET machine (no builders/judges running).
 *   npm run build && (npx vite preview --port 5181 --strictPort &) && node scripts/measure-prod.mjs [--base URL] [--runs 2]
 * Per demo and per viewport: cold time-to-ready (fresh context), warm time-to-ready, idle FPS (3 s of rAF),
 * scripted-scroll FPS (8 s sweep 0→100%), p95 frame time, worst frame. Writes qc-evidence/perf-production.json (+ .md).
 * The condition (GPU/ANGLE renderer, Chrome version, DPR, viewport, time) is stored with the numbers.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt('--base', 'http://localhost:5181');
const RUNS = Number(opt('--runs', 2));
const DEMOS = ['beauty', 'fnb', 'real-estate', 'fashion', 'automotive'];
const ROUTE = (id) => `/${id}`;
const GPU = ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'];
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '390x844 (touch, DPR 2)', width: 390, height: 844, mobile: true },
];

const frameProbe = (mode) => `new Promise((res) => {
  const times = []; let last = performance.now(); const t0 = last;
  const max = document.documentElement.scrollHeight - innerHeight;
  const dur = ${mode === 'scroll' ? 8000 : 3000};
  function f(t) {
    times.push(t - last); last = t;
    const p = Math.min(1, (t - t0) / dur);
    ${mode === 'scroll' ? 'window.scrollTo(0, p * max);' : ''}
    if (t - t0 >= dur) {
      const s = [...times].sort((a, b) => a - b);
      res({ fps: times.length / ((t - t0) / 1000), p95: s[Math.floor(s.length * 0.95)], worst: s[s.length - 1] });
    } else requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
})`;

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GPU });
const version = browser.version();
const out = { measuredAt: new Date().toISOString(), base: BASE, chrome: version, host: `${os.cpus()[0]?.model} · ${os.cpus().length} threads · ${Math.round(os.totalmem() / 2 ** 30)} GB`, loadAvgNote: 'run with no other agents/builders/judges active', results: [] };

for (const vp of VIEWPORTS) {
  for (const id of DEMOS) {
    const runs = [];
    for (let r = 0; r < RUNS; r++) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.mobile ? 2 : 1, isMobile: vp.mobile, hasTouch: vp.mobile });
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(String(e)));
      const t0 = Date.now();
      await page.goto(BASE + ROUTE(id));
      await page.waitForFunction(() => window.__baha3d?.getState().ready === true, null, { timeout: 120_000 });
      const coldReady = Date.now() - t0;
      await page.waitForTimeout(1200);
      const idle = await page.evaluate(frameProbe('idle'));
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      const scroll = await page.evaluate(frameProbe('scroll'));
      const info = await page.evaluate(() => {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl2');
        const ext = gl?.getExtension('WEBGL_debug_renderer_info');
        return { renderer: gl && ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown', dpr: devicePixelRatio, canvas: document.querySelector('canvas') ? `${document.querySelector('canvas').width}x${document.querySelector('canvas').height}` : null };
      });
      // warm reload in the same context (HTTP cache + compiled shader cache warm)
      const t1 = Date.now();
      await page.reload();
      await page.waitForFunction(() => window.__baha3d?.getState().ready === true, null, { timeout: 120_000 });
      const warmReady = Date.now() - t1;
      runs.push({ coldReadyMs: coldReady, warmReadyMs: warmReady, idleFps: +idle.fps.toFixed(1), idleP95ms: +idle.p95.toFixed(1), idleWorstMs: +idle.worst.toFixed(1), scrollFps: +scroll.fps.toFixed(1), scrollP95ms: +scroll.p95.toFixed(1), scrollWorstMs: +scroll.worst.toFixed(1), gpu: info.renderer, dpr: info.dpr, canvasPx: info.canvas, consoleErrors: errors.length });
      await ctx.close();
      console.log(`${vp.name.padEnd(24)} ${id.padEnd(12)} run${r + 1}: cold ${coldReady} ms · warm ${warmReady} ms · idle ${idle.fps.toFixed(1)} fps · scroll ${scroll.fps.toFixed(1)} fps (p95 ${scroll.p95.toFixed(1)} ms, worst ${scroll.worst.toFixed(0)} ms) · errors ${errors.length}`);
    }
    out.results.push({ viewport: vp.name, demo: id, runs });
  }
}
await browser.close();

const dir = path.resolve('qc-evidence');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'perf-production.json'), JSON.stringify(out, null, 2));
const avg = (a, k) => +(a.reduce((s, x) => s + x[k], 0) / a.length).toFixed(1);
const rows = out.results.map((x) => `| ${x.viewport} | ${x.demo} | ${avg(x.runs, 'coldReadyMs')} | ${avg(x.runs, 'warmReadyMs')} | ${avg(x.runs, 'idleFps')} | ${avg(x.runs, 'scrollFps')} | ${avg(x.runs, 'scrollP95ms')} | ${Math.max(...x.runs.map((r) => r.scrollWorstMs))} | ${x.runs.reduce((s, r) => s + r.consoleErrors, 0)} |`);
fs.writeFileSync(path.join(dir, 'perf-production.md'), `# Production performance (measured ${out.measuredAt})\n\nChrome ${out.chrome} · ${out.host} · GPU ${out.results[0]?.runs[0]?.gpu}\n\n| Viewport | Demo | Cold ready (ms) | Warm ready (ms) | Idle fps | Scroll fps | Scroll p95 (ms) | Worst frame (ms) | Console errors |\n|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`);
console.log('\nwritten qc-evidence/perf-production.json + perf-production.md');
