/** Touch QC (iPhone 13 metrics, touch + mobile UA, rendered by Chrome). Horizontal swipe orbits, vertical swipe scrolls. */
import { test, expect, type Page } from '@playwright/test';
import { DEMOS, canvasBox, getState, openDemo, shotDir } from './helpers';

async function swipe(page: Page, x0: number, y0: number, x1: number, y1: number, steps = 14) {
  const cdp = await page.context().newCDPSession(page);
  const pt = (x: number, y: number) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps) });
    await page.waitForTimeout(12);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

for (const demo of DEMOS) {
  test(`${demo.id} · mobile touch: swipe-x orbits, swipe-y scrolls, no overflow`, async ({ page }) => {
    const errors = await openDemo(page, demo.path);
    const box = await canvasBox(page);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height * 0.45;
    const s0 = await getState(page);

    await swipe(page, cx - 120, cy, cx + 120, cy);
    await page.waitForTimeout(700);
    const s1 = await getState(page);
    expect(Math.abs(s1.orbit.yaw - s0.orbit.yaw), 'horizontal swipe rotates the model view').toBeGreaterThan(0.4);

    const y0 = await page.evaluate(() => window.scrollY);
    await swipe(page, cx, cy + 160, cx, cy - 160, 20);
    await page.waitForTimeout(900);
    const y1 = await page.evaluate(() => window.scrollY);
    expect(y1, 'vertical swipe scrolls the page').toBeGreaterThan(y0 + 40);

    await page.screenshot({ path: `${shotDir(demo.id)}/mobile-touch.jpg`, type: 'jpeg', quality: 85 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}
