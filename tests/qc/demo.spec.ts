/**
 * Generic QC for all 5 demos (MASTER_PROMPT PHẦN IX — QC C/D). Every check reads REAL scene state through
 * window.__baha3d (camera, orbit, material colours, hover rim) — a visible button alone is never evidence.
 * Run one demo: npx playwright test -g "beauty"
 */
import { test, expect } from '@playwright/test';
import { DEMOS, canvasBox, dist, getMaterial, getState, gpuInfo, openDemo, scrollTo, shotDir, writeJson } from './helpers';

for (const demo of DEMOS) {
  test.describe(`${demo.id}`, () => {
    test(`${demo.id} · loads, renders frames, no errors`, async ({ page }) => {
      const errors = await openDemo(page, demo.path);
      const s = await getState(page);
      expect(s.demo).toBe(demo.id);
      expect(s.ready).toBe(true);
      expect(s.fps.frames).toBeGreaterThan(8);
      expect(await page.locator('canvas').count()).toBeGreaterThan(0);
      const png = await page.screenshot({ path: `${shotDir(demo.id)}/load-1440x900.jpg`, type: 'jpeg', quality: 85 });
      expect(png.length, 'screenshot is not a flat colour (heuristic)').toBeGreaterThan(25_000);
      expect(errors, errors.join('\n')).toEqual([]);
      expect(s.errors, s.errors.join('\n')).toEqual([]);
    });

    test(`${demo.id} · orbit 360° changes the real camera, reset restores it`, async ({ page }) => {
      await openDemo(page, demo.path);
      const box = await canvasBox(page);
      const cy = box.y + box.height * 0.5;
      const before = await getState(page);
      for (let i = 0; i < 3; i++) {
        await page.mouse.move(box.x + box.width / 2 - 200, cy);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 200, cy, { steps: 24 });
        await page.mouse.up();
      }
      await page.waitForTimeout(900);
      const after = await getState(page);
      const turned = Math.abs(after.orbit.yawTotal);
      expect(turned, `cumulative yaw after 1200px of dragging = ${turned.toFixed(2)} rad (needs ≥ 2π·0.9 for a full 360°)`).toBeGreaterThan(Math.PI * 2 * 0.9);
      // camera position is a function of yaw → a full turn returns near the start, so also test a partial drag below
      await page.click('[data-testid=reset-view]');
      await page.waitForTimeout(1500);
      await page.mouse.move(box.x + box.width / 2 - 120, cy);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 80, cy, { steps: 16 });
      await page.mouse.up();
      await page.waitForTimeout(800);
      const partial = await getState(page);
      expect(dist(partial.camera.position, before.camera.position), 'camera moved after a partial drag').toBeGreaterThan(0.4);
      await page.click('[data-testid=reset-view]');
      await page.waitForTimeout(1800);
      const home = await getState(page);
      expect(Math.abs(home.orbit.yaw), 'orbit yaw back to ~0').toBeLessThan(0.02);
      expect(dist(home.camera.position, before.camera.position), 'camera back at the default view').toBeLessThan(0.08);
      await page.screenshot({ path: `${shotDir(demo.id)}/orbit-partial.jpg`, type: 'jpeg', quality: 85 });
    });

    test(`${demo.id} · ≥3 colour variants change the real material`, async ({ page }) => {
      await openDemo(page, demo.path);
      const chips = page.locator('[data-testid^=variant-]');
      const n = await chips.count();
      expect(n, 'at least 3 variant chips').toBeGreaterThanOrEqual(3);
      expect(await page.evaluate(() => window.__baha3d!.materials())).toContain('primary');
      const seen = new Map<string, unknown>();
      for (let i = 0; i < n; i++) {
        await chips.nth(i).click();
        await page.waitForTimeout(1400);
        const m = await getMaterial(page, 'primary');
        expect(m, 'primary material registered').not.toBeNull();
        seen.set(m!.color!, m);
        await page.screenshot({ path: `${shotDir(demo.id)}/variant-${i}.jpg`, type: 'jpeg', quality: 85 });
        expect(m!.roughness, 'PBR roughness preserved').not.toBeNull();
      }
      writeJson(`variants-${demo.id}.json`, [...seen.values()]);
      expect(seen.size, `distinct primary colours: ${[...seen.keys()].join(', ')}`).toBeGreaterThanOrEqual(3);
    });

    test(`${demo.id} · hover lights the object in and out`, async ({ page }) => {
      await openDemo(page, demo.path);
      const box = await canvasBox(page);
      const base = await getState(page);
      expect(base.hover.value).toBeLessThan(0.05);
      // Sweep a grid over the central area (objects can be hollow / off-centre) and stop at the first hit.
      let on = await getState(page);
      outer: for (const fy of [0.5, 0.42, 0.58, 0.34, 0.66]) {
        for (const fx of [0.5, 0.42, 0.58, 0.34, 0.66]) {
          await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy, { steps: 4 });
          await page.waitForTimeout(260);
          on = await getState(page);
          if (on.hover.value > 0.4) break outer;
        }
      }
      await page.waitForTimeout(500);
      on = await getState(page);
      const mat = await getMaterial(page, 'primary');
      await page.screenshot({ path: `${shotDir(demo.id)}/hover-on.jpg`, type: 'jpeg', quality: 85 });
      expect(on.hover.value, 'hover amount rises over the object').toBeGreaterThan(0.4);
      expect(mat!.rim ?? mat!.emissiveIntensity ?? 0, 'rim/emissive uniform is lit').toBeGreaterThan(0.05);
      await page.mouse.move(box.x + 6, box.y + box.height - 6, { steps: 8 });
      await page.waitForTimeout(1100);
      const off = await getState(page);
      expect(off.hover.value, 'hover eases out when leaving').toBeLessThan(0.08);
    });

    test(`${demo.id} · scroll timeline 0/25/50/75/100 forward and back`, async ({ page }) => {
      await openDemo(page, demo.path);
      const poses: { p: number; pos: number[]; tgt: number[]; fov: number; scroll: number }[] = [];
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        await scrollTo(page, p);
        const s = await getState(page);
        poses.push({ p, pos: s.camera.position, tgt: s.camera.target, fov: s.camera.fov, scroll: s.scroll.smooth });
        expect(Math.abs(s.scroll.smooth - p), `scrub progress follows scroll at ${p}`).toBeLessThan(0.06);
        await page.screenshot({ path: `${shotDir(demo.id)}/timeline-${Math.round(p * 100)}.jpg`, type: 'jpeg', quality: 85 });
      }
      for (let i = 1; i < poses.length; i++) {
        const moved = dist(poses[i].pos, poses[i - 1].pos) + dist(poses[i].tgt, poses[i - 1].tgt) + Math.abs(poses[i].fov - poses[i - 1].fov);
        expect(moved, `camera/scene differs between ${poses[i - 1].p} and ${poses[i].p}`).toBeGreaterThan(0.15);
      }
      // reverse: scroll back up → state restored
      await scrollTo(page, 0.5);
      const mid = await getState(page);
      expect(dist(mid.camera.position, poses[2].pos), 'back at 50% = same pose as forward 50%').toBeLessThan(0.25);
      await scrollTo(page, 0);
      const top = await getState(page);
      expect(dist(top.camera.position, poses[0].pos), 'back at 0% = hero pose').toBeLessThan(0.12);
      writeJson(`timeline-${demo.id}.json`, poses);
    });

    for (const vp of [
      { name: '1920x1080', width: 1920, height: 1080 },
      { name: '1440x900', width: 1440, height: 900 },
      { name: '390x844', width: 390, height: 844 },
    ]) {
      test(`${demo.id} · resize → ${vp.name} stays healthy`, async ({ page }) => {
        const errors = await openDemo(page, demo.path);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(1200);
        for (const p of [0, 0.5, 1]) {
          await scrollTo(page, p, 1400);
          await page.screenshot({ path: `${shotDir(demo.id)}/${vp.name}-${Math.round(p * 100)}.jpg`, type: 'jpeg', quality: 85 });
        }
        const s = await getState(page);
        expect(s.ready).toBe(true);
        expect(errors, errors.join('\n')).toEqual([]);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, 'no horizontal page scroll').toBeLessThanOrEqual(1);
      });
    }

    test(`${demo.id} · FPS measured with condition`, async ({ page }) => {
      await openDemo(page, demo.path);
      await page.waitForTimeout(1500);
      const idle = (await getState(page)).fps.avg;
      // animate through the timeline while measuring
      const t0 = Date.now();
      let minFps = Infinity;
      while (Date.now() - t0 < 4000) {
        await scrollTo(page, ((Date.now() - t0) / 4000) % 1, 120);
        minFps = Math.min(minFps, (await getState(page)).fps.avg || Infinity);
      }
      const scrolling = (await getState(page)).fps.avg;
      const info = await gpuInfo(page);
      writeJson(`perf-${demo.id}.json`, { demo: demo.id, idleFps: idle, scrollFps: scrolling, minFps, condition: info, at: new Date().toISOString() });
      expect(idle, `idle FPS ${idle.toFixed(1)} on ${info.renderer}`).toBeGreaterThan(10);
    });
  });
}
