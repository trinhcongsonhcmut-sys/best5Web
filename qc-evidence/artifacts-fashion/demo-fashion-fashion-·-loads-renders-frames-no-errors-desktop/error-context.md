# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo.spec.ts >> fashion >> fashion · loads, renders frames, no errors
- Location: tests\qc\demo.spec.ts:11:5

# Error details

```
Error: console.error: THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false

Material Name: PMREMCubemapToCubemap
Material Type: ShaderMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: PMREMGGXConvolution
Material Type: ShaderMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: PMREMGGXIntegration
Material Type: ShaderMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshStandardMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshPhysicalMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshStandardMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshStandardMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshStandardMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshStandardMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshStandardMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshStandardMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshPhysicalMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshBasicMaterial

Program Info Log: 


console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false

Material Name: 
Material Type: MeshStandardMaterial

Program Info Log: 



expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 114

- Array []
+ Array [
+   "console.error: THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false
+
+ Material Name: PMREMCubemapToCubemap
+ Material Type: ShaderMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: PMREMGGXConvolution
+ Material Type: ShaderMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: PMREMGGXIntegration
+ Material Type: ShaderMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshStandardMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshPhysicalMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshStandardMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshStandardMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshStandardMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshStandardMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshStandardMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshStandardMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshPhysicalMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshBasicMaterial
+
+ Program Info Log: 
+
+ ",
+   "console.error: THREE.WebGLProgram: Shader Error 1282 - VALIDATE_STATUS false
+
+ Material Name: 
+ Material Type: MeshStandardMaterial
+
+ Program Info Log: 
+
+ ",
+ ]
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - generic:
      - generic:
        - generic [aria-hidden]:
          - generic: BAHA
          - generic: Atelier
          - emphasis: Outerwear · SS27
        - generic:
          - paragraph: Look 01 / Down shell
          - heading "Weightless, wrapped in colour." [level=1]:
            - emphasis: Weightless,
            - generic: wrapped
            - generic: in colour.
          - paragraph: Áo phao nylon bóng lơ lửng giữa khối màu — nhẹ như một đám mây.
        - generic [aria-hidden]:
          - paragraph: 02 — Construction
          - heading [level=2]:
            - generic: Chambered
            - emphasis: for still air.
          - paragraph: Khoang bông ngang khâu ép kín — giữ ấm mà không nặng vai.
          - generic:
            - generic:
              - term: Fill
              - definition: 750 FP down
            - generic:
              - term: Shell
              - definition: 20D ciré nylon
            - generic:
              - term: Weight
              - definition: 610 g
        - generic [aria-hidden]:
          - paragraph: 03 — Reverse
          - heading [level=2]:
            - generic: Turn
            - generic: around.
            - emphasis: The back tells it too.
          - paragraph: Lưng liền mảnh, cổ đứng 14 cm, chữ in phản quang trên vai.
        - generic [aria-hidden]:
          - generic:
            - paragraph: 04 — Up close
            - heading [level=2]:
              - emphasis: Closer.
            - list:
              - listitem:
                - generic: Ciré finish
                - generic: Bóng ướt, cản gió
              - listitem:
                - generic: Box stitch · 4 mm
                - generic: Đường may ép khoang
              - listitem:
                - generic: Two-way zip
                - generic: Răng kim loại gunmetal
        - generic [aria-hidden]:
          - paragraph: Cumulus 01 — four colourways
          - heading [level=2]:
            - generic: Wear the
            - generic: weather.
          - paragraph: Chọn một màu — cả thế giới đổi theo.
        - paragraph [aria-hidden]: Next look ↘
        - generic [ref=e9]:
          - generic [ref=e10]:
            - generic [ref=e11]: Colourway
            - generic [ref=e12]: Ember Orange
          - radiogroup "Colourway" [ref=e13]:
            - generic [ref=e14]:
              - radio "Ember Orange" [checked] [ref=e15] [cursor=pointer]
              - radio "Carbon Black" [ref=e16] [cursor=pointer]
              - radio "Glacier Silver" [ref=e17] [cursor=pointer]
              - radio "Crimson Red" [ref=e18] [cursor=pointer]
          - 'button "Next colourway: Carbon Black" [ref=e19] [cursor=pointer]':
            - generic [ref=e21]: Next — Carbon
    - generic:
      - link "BAHA 3D" [ref=e24] [cursor=pointer]:
        - /url: /
        - text: ← BAHA 3D
      - navigation "Timeline" [ref=e25]:
        - button "0% — Opening Hero" [ref=e26] [cursor=pointer]:
          - generic [ref=e28]: "0"
        - button "25% — First Reveal" [ref=e29] [cursor=pointer]:
          - generic [ref=e31]: "25"
        - button "50% — Transformation" [ref=e32] [cursor=pointer]:
          - generic [ref=e34]: "50"
        - button "75% — Detail & Material" [ref=e35] [cursor=pointer]:
          - generic [ref=e37]: "75"
        - button "100% — Final Frame" [ref=e38] [cursor=pointer]:
          - generic [ref=e40]: "100"
      - generic [ref=e41]:
        - button "Phóng to" [ref=e42] [cursor=pointer]: ＋
        - button "Thu nhỏ" [ref=e43] [cursor=pointer]: －
        - button "Reset view" [ref=e44] [cursor=pointer]
      - generic [aria-hidden]:
        - generic: Scroll
      - paragraph: Kéo để xoay · cuộn để dẫn cảnh · chạm đúp để về góc nhìn gốc
```

# Test source

```ts
  1   | /**
  2   |  * Generic QC for all 5 demos (MASTER_PROMPT PHẦN IX — QC C/D). Every check reads REAL scene state through
  3   |  * window.__baha3d (camera, orbit, material colours, hover rim) — a visible button alone is never evidence.
  4   |  * Run one demo: npx playwright test -g "beauty"
  5   |  */
  6   | import { test, expect } from '@playwright/test';
  7   | import { DEMOS, canvasBox, dist, getMaterial, getState, gpuInfo, openDemo, scrollTo, shotDir, writeJson } from './helpers';
  8   | 
  9   | for (const demo of DEMOS) {
  10  |   test.describe(`${demo.id}`, () => {
  11  |     test(`${demo.id} · loads, renders frames, no errors`, async ({ page }) => {
  12  |       const errors = await openDemo(page, demo.path);
  13  |       const s = await getState(page);
  14  |       expect(s.demo).toBe(demo.id);
  15  |       expect(s.ready).toBe(true);
  16  |       expect(s.fps.frames).toBeGreaterThan(8);
  17  |       expect(await page.locator('canvas').count()).toBeGreaterThan(0);
  18  |       const png = await page.screenshot({ path: `${shotDir(demo.id)}/load-1440x900.jpg`, type: 'jpeg', quality: 85 });
  19  |       expect(png.length, 'screenshot is not a flat colour (heuristic)').toBeGreaterThan(25_000);
> 20  |       expect(errors, errors.join('\n')).toEqual([]);
      |                                         ^ Error: console.error: THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false
  21  |       expect(s.errors, s.errors.join('\n')).toEqual([]);
  22  |     });
  23  | 
  24  |     test(`${demo.id} · orbit 360° changes the real camera, reset restores it`, async ({ page }) => {
  25  |       await openDemo(page, demo.path);
  26  |       const box = await canvasBox(page);
  27  |       const cy = box.y + box.height * 0.5;
  28  |       const before = await getState(page);
  29  |       for (let i = 0; i < 3; i++) {
  30  |         await page.mouse.move(box.x + box.width / 2 - 200, cy);
  31  |         await page.mouse.down();
  32  |         await page.mouse.move(box.x + box.width / 2 + 200, cy, { steps: 24 });
  33  |         await page.mouse.up();
  34  |       }
  35  |       await page.waitForTimeout(900);
  36  |       const after = await getState(page);
  37  |       const turned = Math.abs(after.orbit.yawTotal);
  38  |       expect(turned, `cumulative yaw after 1200px of dragging = ${turned.toFixed(2)} rad (needs ≥ 2π·0.9 for a full 360°)`).toBeGreaterThan(Math.PI * 2 * 0.9);
  39  |       // camera position is a function of yaw → a full turn returns near the start, so also test a partial drag below
  40  |       await page.click('[data-testid=reset-view]');
  41  |       await page.waitForTimeout(1500);
  42  |       await page.mouse.move(box.x + box.width / 2 - 120, cy);
  43  |       await page.mouse.down();
  44  |       await page.mouse.move(box.x + box.width / 2 + 80, cy, { steps: 16 });
  45  |       await page.mouse.up();
  46  |       await page.waitForTimeout(800);
  47  |       const partial = await getState(page);
  48  |       expect(dist(partial.camera.position, before.camera.position), 'camera moved after a partial drag').toBeGreaterThan(0.4);
  49  |       await page.click('[data-testid=reset-view]');
  50  |       await page.waitForTimeout(1800);
  51  |       const home = await getState(page);
  52  |       expect(Math.abs(home.orbit.yaw), 'orbit yaw back to ~0').toBeLessThan(0.02);
  53  |       expect(dist(home.camera.position, before.camera.position), 'camera back at the default view').toBeLessThan(0.08);
  54  |       await page.screenshot({ path: `${shotDir(demo.id)}/orbit-partial.jpg`, type: 'jpeg', quality: 85 });
  55  |     });
  56  | 
  57  |     test(`${demo.id} · ≥3 colour variants change the real material`, async ({ page }) => {
  58  |       await openDemo(page, demo.path);
  59  |       const chips = page.locator('[data-testid^=variant-]');
  60  |       const n = await chips.count();
  61  |       expect(n, 'at least 3 variant chips').toBeGreaterThanOrEqual(3);
  62  |       expect(await page.evaluate(() => window.__baha3d!.materials())).toContain('primary');
  63  |       const seen = new Map<string, unknown>();
  64  |       for (let i = 0; i < n; i++) {
  65  |         await chips.nth(i).click();
  66  |         await page.waitForTimeout(1400);
  67  |         const m = await getMaterial(page, 'primary');
  68  |         expect(m, 'primary material registered').not.toBeNull();
  69  |         seen.set(m!.color!, m);
  70  |         await page.screenshot({ path: `${shotDir(demo.id)}/variant-${i}.jpg`, type: 'jpeg', quality: 85 });
  71  |         expect(m!.roughness, 'PBR roughness preserved').not.toBeNull();
  72  |       }
  73  |       writeJson(`variants-${demo.id}.json`, [...seen.values()]);
  74  |       expect(seen.size, `distinct primary colours: ${[...seen.keys()].join(', ')}`).toBeGreaterThanOrEqual(3);
  75  |     });
  76  | 
  77  |     test(`${demo.id} · hover lights the object in and out`, async ({ page }) => {
  78  |       await openDemo(page, demo.path);
  79  |       const box = await canvasBox(page);
  80  |       const base = await getState(page);
  81  |       expect(base.hover.value).toBeLessThan(0.05);
  82  |       // Sweep a grid over the central area (objects can be hollow / off-centre) and stop at the first hit.
  83  |       let on = await getState(page);
  84  |       outer: for (const fy of [0.5, 0.42, 0.58, 0.34, 0.66]) {
  85  |         for (const fx of [0.5, 0.42, 0.58, 0.34, 0.66]) {
  86  |           await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy, { steps: 4 });
  87  |           await page.waitForTimeout(260);
  88  |           on = await getState(page);
  89  |           if (on.hover.value > 0.4) break outer;
  90  |         }
  91  |       }
  92  |       await page.waitForTimeout(500);
  93  |       on = await getState(page);
  94  |       const mat = await getMaterial(page, 'primary');
  95  |       await page.screenshot({ path: `${shotDir(demo.id)}/hover-on.jpg`, type: 'jpeg', quality: 85 });
  96  |       expect(on.hover.value, 'hover amount rises over the object').toBeGreaterThan(0.4);
  97  |       expect(mat!.rim ?? mat!.emissiveIntensity ?? 0, 'rim/emissive uniform is lit').toBeGreaterThan(0.05);
  98  |       await page.mouse.move(box.x + 6, box.y + box.height - 6, { steps: 8 });
  99  |       await page.waitForTimeout(1100);
  100 |       const off = await getState(page);
  101 |       expect(off.hover.value, 'hover eases out when leaving').toBeLessThan(0.08);
  102 |     });
  103 | 
  104 |     test(`${demo.id} · scroll timeline 0/25/50/75/100 forward and back`, async ({ page }) => {
  105 |       await openDemo(page, demo.path);
  106 |       const poses: { p: number; pos: number[]; tgt: number[]; fov: number; scroll: number }[] = [];
  107 |       for (const p of [0, 0.25, 0.5, 0.75, 1]) {
  108 |         await scrollTo(page, p);
  109 |         const s = await getState(page);
  110 |         poses.push({ p, pos: s.camera.position, tgt: s.camera.target, fov: s.camera.fov, scroll: s.scroll.smooth });
  111 |         expect(Math.abs(s.scroll.smooth - p), `scrub progress follows scroll at ${p}`).toBeLessThan(0.06);
  112 |         await page.screenshot({ path: `${shotDir(demo.id)}/timeline-${Math.round(p * 100)}.jpg`, type: 'jpeg', quality: 85 });
  113 |       }
  114 |       for (let i = 1; i < poses.length; i++) {
  115 |         const moved = dist(poses[i].pos, poses[i - 1].pos) + dist(poses[i].tgt, poses[i - 1].tgt) + Math.abs(poses[i].fov - poses[i - 1].fov);
  116 |         expect(moved, `camera/scene differs between ${poses[i - 1].p} and ${poses[i].p}`).toBeGreaterThan(0.15);
  117 |       }
  118 |       // reverse: scroll back up → state restored
  119 |       await scrollTo(page, 0.5);
  120 |       const mid = await getState(page);
```