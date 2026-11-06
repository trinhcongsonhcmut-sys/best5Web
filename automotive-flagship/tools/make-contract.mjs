/**
 * Generates automotive-flagship/contract/scene-contract.json FROM THE REALTIME CODE (never hand-copied):
 *   - imports src/demos/automotive/contract.ts + materials.ts + anim.ts through the running Vite dev server
 *     (same module instances the page uses → carFrame / carDims are the values buildRig really computed);
 *   - poses the live rig at p = 0 / 0.5 / 0.75, records the real camera + every named node's world matrix (car frame);
 *   - renders the car-only silhouette mask (layer 0, white on black) with the real camera at W×H → contract/mask-rt-<p>.png;
 *   - captures the realtime frame without HUD → contract/rt-<p>.png; exports the BAHA plate texture → contract/plate.png.
 *
 *   node automotive-flagship/tools/make-contract.mjs [--base http://localhost:5195] [--w 960 --h 540] [--p 0,0.5,0.75] [--out dir]
 * Run from BAHA_3D_SHOWCASE/. Dev server must be running (port 5195).
 */
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt('--base', 'http://localhost:5195');
const W = Number(opt('--w', 960)), H = Number(opt('--h', 540));
const POSES = opt('--p', '0,0.5,0.75').split(',').map(Number);
const OUT = path.resolve(opt('--out', 'automotive-flagship/contract'));
fs.mkdirSync(OUT, { recursive: true });
const tag = (p) => String(Math.round(p * 1000)).padStart(4, '0');

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(BASE + '/automotive');
await page.waitForFunction(() => window.__baha3d?.getState().ready === true && window.__axDebug, null, { timeout: 120_000 });
await page.waitForTimeout(1200);
await page.addStyleTag({ content: '.ax,.hud,.scroll-hint,.stage-dots{visibility:hidden!important}' });

// Vite rewrites imports of edited modules with ?t=<hmr stamp> → import the exact URLs the page loaded (same instances)
await page.evaluate(() => {
  const urls = performance.getEntriesByType('resource').map((e) => e.name);
  const find = (f) => urls.filter((u) => new URL(u).pathname === '/src/demos/automotive/' + f).pop() ?? '/src/demos/automotive/' + f;
  window.__axMod = { contract: find('contract.ts'), anim: find('anim.ts'), materials: find('materials.ts'), world: find('World.tsx') };
});
const statics = await page.evaluate(async () => {
  const c = await import(window.__axMod.contract);
  const a = await import(window.__axMod.anim);
  const m = await import(window.__axMod.materials);
  const w = await import(window.__axMod.world);
  const plate = m.plateTexture();
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 300));
  const v3 = (v) => [v.x, v.y, v.z];
  const portraitAspect = 390 / 844;
  const fit = (aspect) => (aspect < c.CAMERA.fitAspect ? Math.min(2.2, Math.max(1, Math.pow(c.CAMERA.fitAspect / aspect, 0.75))) : 1);
  return {
    sun: v3(c.SUN),
    world: { ...c.WORLD, uOff: c.hdriOffset() },
    lights: c.LIGHTS,
    grade: c.GRADE,
    realtimeSun: { ...w.worldReadout },
    fog: c.FOG,
    tone: c.TONE,
    camera: c.CAMERA,
    stops: { desktop: c.CAMERA_STOPS, portrait390x844: c.stopsFor(portraitAspect), portraitFit: fit(portraitAspect) },
    finishes: m.FINISHES,
    road: c.ROAD,
    shadowBake: c.SHADOW_BAKE,
    ground: c.GROUND,
    shrubs: (() => {
      const out = [];
      window.__axDebug.scene.traverse((o) => {
        if (!o.isInstancedMesh || !o.name.startsWith('shrub:')) return;
        const M = new window.__axDebug.THREE.Matrix4();
        const matrices = Array.from({ length: o.count }, (_, i) => (o.getMatrixAt(i, M), M.elements.map((x) => +x.toFixed(5))));
        out.push({ url: o.name.slice(6), matrices });
      });
      return out;
    })(),
    carFrame: a.carFrame,
    carDims: a.carDims,
    plate: plate.image.toDataURL('image/png'),
  };
});
fs.writeFileSync(path.join(OUT, 'plate.png'), Buffer.from(statics.plate.split(',')[1], 'base64'));
delete statics.plate;

const poses = [];
for (const p of POSES) {
  await page.evaluate((v) => window.__baha3d.scrollTo(v), p);
  await page.waitForFunction((v) => Math.abs(window.__baha3d.getState().scroll.smooth - v) < 1e-4, p, { timeout: 20_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `rt-${tag(p)}.png`) });
  const r = await page.evaluate(({ W, H }) => {
    const { THREE, gl, scene, camera, rig } = window.__axDebug;
    camera.updateMatrixWorld(true);
    rig.car.updateMatrixWorld(true);
    const nodes = {};
    const dup = [];
    rig.car.traverse((o) => {
      if (!o.name || o.name.startsWith('HIT_') || o.name.startsWith('mount:')) return;
      const mats = [];
      const pushMat = (x) => x && mats.push(...(Array.isArray(x) ? x : [x]).map((mm) => mm.name));
      pushMat(o.material);
      for (const ch of o.children) if (ch.isMesh && !ch.name.startsWith('HIT_')) pushMat(ch.material);
      let wheel = '';
      for (let q = o.parent; q; q = q.parent) if (q.name?.startsWith('mount:Wheel')) wheel = q.name.slice(6);
      if (nodes[o.name]) dup.push(o.name);
      nodes[o.name] = { m: o.matrixWorld.elements.map((x) => +x.toFixed(6)), mats, wheel, mesh: !!o.isMesh };
    });
    // silhouette: car layer only, flat white, no fog / background
    const rt = new THREE.WebGLRenderTarget(W, H, { samples: 0 });
    const prev = { bg: scene.background, fog: scene.fog, ov: scene.overrideMaterial, mask: camera.layers.mask, aspect: camera.aspect };
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    scene.background = new THREE.Color(0);
    scene.fog = null;
    scene.overrideMaterial = white;
    camera.layers.set(0);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    gl.setRenderTarget(rt);
    gl.setClearColor(0x000000, 1);
    gl.clear();
    gl.render(scene, camera);
    const buf = new Uint8Array(W * H * 4);
    gl.readRenderTargetPixels(rt, 0, 0, W, H, buf);
    gl.setRenderTarget(null);
    gl.setClearColor(0x000000, 0);
    Object.assign(scene, { background: prev.bg, fog: prev.fog, overrideMaterial: prev.ov });
    camera.layers.mask = prev.mask;
    camera.aspect = prev.aspect;
    camera.updateProjectionMatrix();
    rt.dispose();
    white.dispose();
    const mask = new Uint8Array(W * H);
    let on = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = buf[((H - 1 - y) * W + x) * 4] > 127 ? 255 : 0;
      mask[y * W + x] = v;
      if (v) on++;
    }
    let s = '';
    for (let i = 0; i < mask.length; i += 8192) s += String.fromCharCode.apply(null, mask.subarray(i, i + 8192));
    return {
      camera: {
        position: camera.position.toArray(),
        quaternion: camera.quaternion.toArray(),
        matrixWorld: camera.matrixWorld.elements.map((x) => +x.toFixed(6)),
        fov: camera.fov,
        near: camera.near,
        far: camera.far,
      },
      nodes,
      dup,
      coverage: on / (W * H),
      mask: btoa(s),
    };
  }, { W, H });
  await sharp(Buffer.from(r.mask, 'base64'), { raw: { width: W, height: H, channels: 1 } }).png().toFile(path.join(OUT, `mask-rt-${tag(p)}.png`));
  delete r.mask;
  const st = await page.evaluate(() => window.__baha3d.getState());
  const anim = await page.evaluate(async () => ({ ...(await import(window.__axMod.anim)).anim }));
  poses.push({ p, size: [W, H], extra: st.extra, anim, ...r });
  console.log(`p=${p} nodes=${Object.keys(r.nodes).length} dup=${r.dup.length} coverage=${(r.coverage * 100).toFixed(2)}%`);
}

const contract = {
  generated: new Date().toISOString(),
  generator: 'automotive-flagship/tools/make-contract.mjs (reads src/demos/automotive/contract.ts + live rig via Vite dev)',
  axes: { three: 'Y-up, right-handed, car nose +X, right flank +Z', toBlender: '(x, y, z) -> (x, -z, y); M_b = C·M_t·C^-1 for nodes, C·M_t for the camera' },
  carAsset: '/assets/models/CarConcept.baha.glb',
  ...statics,
  poses,
  errors,
};
fs.writeFileSync(path.join(OUT, 'scene-contract.json'), JSON.stringify(contract, null, 1));
console.log('wrote', path.join(OUT, 'scene-contract.json'), 'errors:', errors.length ? errors : 'none');
await browser.close();
