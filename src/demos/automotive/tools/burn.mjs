/**
 * Dev-only: clipped ("burnt") pixel ratio ON THE PRODUCT at each scroll mark.
 * Product mask = same frame re-rendered with the world hidden on a black background (car + its lamps only).
 * Burnt = all three sRGB channels ≥ 250 in the normal frame.   node src/demos/automotive/tools/burn.mjs [base]
 */
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const BASE = process.argv[2] ?? 'http://localhost:5195';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE + '/automotive');
await page.waitForFunction(() => !!window.__axDebug && window.__baha3d?.getState().ready, null, { timeout: 120000 });
await page.addStyleTag({ content: '.overlay, .hud { visibility: hidden !important; }' });
const raw = async () => {
  const { data, info } = await sharp(await page.screenshot({ type: 'png' })).raw().toBuffer({ resolveWithObject: true });
  return { data, ch: info.channels };
};
for (const p of [0, 0.25, 0.5, 0.75, 1]) {
  await page.evaluate((v) => window.__baha3d.scrollTo(v), p);
  await page.waitForTimeout(2600);
  const A = await raw();
  await page.evaluate(() => {
    const d = window.__axDebug;
    d.__bg = d.scene.background;
    d.scene.background = null;
    d.gl.setClearColor(0x000000, 1);
    d.__hidden = [];
    d.scene.traverse((o) => {
      if ((o.isMesh || o.isPoints) && o.layers.mask === 2 && o.visible) {
        o.visible = false;
        d.__hidden.push(o);
      }
    });
  });
  await page.waitForTimeout(400);
  const B = await raw();
  await page.evaluate(() => {
    const d = window.__axDebug;
    d.scene.background = d.__bg;
    d.__hidden.forEach((o) => (o.visible = true));
  });
  let mask = 0, burnt = 0;
  for (let i = 0; i < A.data.length; i += A.ch) {
    if (B.data[i] + B.data[i + 1] + B.data[i + 2] > 18) {
      mask++;
      if (A.data[i] >= 250 && A.data[i + 1] >= 250 && A.data[i + 2] >= 250) burnt++;
    }
  }
  console.log(`p=${p}  product px ${mask}  burnt ${burnt}  →  ${((burnt / Math.max(1, mask)) * 100).toFixed(2)} %`);
}
await browser.close();
