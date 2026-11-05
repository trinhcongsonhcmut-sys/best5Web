import { expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const DEMOS = [
  { id: 'beauty', path: '/beauty' },
  { id: 'fnb', path: '/fnb' },
  { id: 'real-estate', path: '/real-estate' },
  { id: 'fashion', path: '/fashion' },
  { id: 'automotive', path: '/automotive' },
] as const;

export const EVIDENCE = path.join(process.cwd(), 'qc-evidence');
export const shotDir = (id: string) => {
  const d = path.join(EVIDENCE, 'shots', id);
  fs.mkdirSync(d, { recursive: true });
  return d;
};
export const writeJson = (rel: string, data: unknown) => {
  const f = path.join(EVIDENCE, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data, null, 2));
};

export const getState = (page: Page) => page.evaluate(() => window.__baha3d!.getState());
export const getMaterial = (page: Page, key: string) => page.evaluate((k) => window.__baha3d!.material(k), key);
export const scrollTo = async (page: Page, p: number, settleMs = 1600) => {
  await page.evaluate((v) => window.__baha3d!.scrollTo(v), p);
  await page.waitForTimeout(settleMs);
};

/** Opens a demo, collects console/page/request errors and waits for the bridge `ready` flag. */
export async function openDemo(page: Page, route: string) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
  });
  await page.goto(route);
  await page.waitForFunction(() => window.__baha3d?.getState().ready === true, null, { timeout: 60_000 });
  await page.waitForTimeout(600);
  return errors;
}

export async function canvasBox(page: Page) {
  const box = await page.locator('[data-testid=canvas-wrap]').boundingBox();
  expect(box, 'canvas wrapper has a box').not.toBeNull();
  return box!;
}

export const dist = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));

/** GPU / browser condition string — every FPS number must be reported together with this. */
export async function gpuInfo(page: Page) {
  return page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      renderer: gl && ext ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string) : 'unknown',
      vendor: gl && ext ? (gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) as string) : 'unknown',
      ua: navigator.userAgent,
      dpr: window.devicePixelRatio,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  });
}
