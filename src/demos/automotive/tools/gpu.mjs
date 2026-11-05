// dev-only GPU-time probe (EXT_disjoint_timer_query_webgl2 around the main render): median ms per frame per toggle
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5195/automotive');
await page.waitForFunction(() => !!window.__axDebug && window.__baha3d?.getState().ready, null, { timeout: 120000 });
if (process.argv[3]) await page.evaluate((p) => window.__baha3d.scrollTo(Number(p)), process.argv[3]);
await page.waitForTimeout(2500);
await page.evaluate(() => {
  const r = window.__axDebug.gl, gl = r.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const orig = r.render.bind(r), pend = [];
  window.__gpu = [];
  r.render = (s, c) => {
    if (s.isScene && !r.getRenderTarget()) {
      const q = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      orig(s, c);
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      pend.push(q);
    } else orig(s, c);
    while (pend.length && gl.getQueryParameter(pend[0], gl.QUERY_RESULT_AVAILABLE)) {
      const q = pend.shift();
      if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) window.__gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
      gl.deleteQuery(q);
    }
  };
});
const measure = () => page.evaluate(() => new Promise((res) => { window.__gpu.length = 0; setTimeout(() => { const a = [...window.__gpu].sort((x, y) => x - y); res(a.length ? +a[Math.floor(a.length / 2)].toFixed(2) : -1); }, 2000); }));
const toggles = JSON.parse(process.argv[2] ?? '[]'); // [[name, onJs, offJs], ...]
for (let rep = 0; rep < 2; rep++) {
  console.log('baseline'.padEnd(30), await measure());
  for (const [name, on, off] of toggles) {
    await page.evaluate(on);
    await page.waitForTimeout(400);
    const v = await measure();
    await page.evaluate(off);
    await page.waitForTimeout(400);
    console.log(name.padEnd(30), v);
  }
}
await browser.close();
