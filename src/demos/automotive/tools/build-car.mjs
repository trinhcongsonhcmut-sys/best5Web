/**
 * Builds the shipped car asset for /automotive from the approved CarConcept.glb (CC-BY 4.0, Eric Chadwick /
 * Darmstadt Graphics Group — see ASSET_LICENSES.md). Run from BAHA_3D_SHOWCASE/:
 *
 *   node src/demos/automotive/tools/build-car.mjs
 *
 * in : public/assets/models/CarConcept.glb       (11.8 MB, PNG textures, KHR_materials_variants)
 * out: public/assets/models/CarConcept.baha.glb  (WebP textures, no third-party logos)
 *
 * What it does (nothing else — geometry and node names stay identical):
 *  1. strips every Khronos / 3D Commerce trademark from the file:
 *       - the Khronos logo texture used as emissive on rims, mirrors, brakes, hardware… → emissive removed
 *       - licence plate (Khronos logo) → plain blank plate (the BAHA plate is drawn at runtime on top)
 *       - InteriorSteeringEmblem node removed
 *       - tyre sidewall base colour + normal map: the KHRONOS and 3DCommerce lettering is rebuilt from a clean
 *         part of the same sidewall ring (polar resample, normals rotated with the ring)
 *  2. drops KHR_materials_variants (paint variants are BAHA MeshPhysical materials at runtime) → unused
 *     variant materials / iridescence texture pruned
 *  3. adds a low-poly raycast proxy "HIT_<node>" under every mesh node (meshopt-simplified ~6 %, no material) — hover
 *     picking on the 213k-triangle car cost ~10 ms per ray; on the proxies it is ~0.5 ms
 *  4. dedup + prune, textures → WebP (EXT_texture_webp, decoded natively by three's GLTFLoader — no CDN decoder)
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, simplifyPrimitive, textureCompress, weldPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const SRC = path.resolve('public/assets/models/CarConcept.glb');
const OUT = path.resolve('public/assets/models/CarConcept.baha.glb');

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(SRC);
const root = doc.getRoot();
const log = (...a) => console.log('·', ...a);

/* 1a — Khronos logo texture (512×128, used as emissive map and as licence-plate base colour) */
const users = (t) => t.listParents().filter((p) => p.propertyType === 'Material');
const logoTex = root.listTextures().find((t) => {
  const s = t.getSize();
  return s && s[0] === 512 && s[1] === 128 && users(t).some((m) => m.getName() === 'License');
});
if (!logoTex) throw new Error('Khronos logo texture not found');
for (const m of root.listMaterials()) {
  if (m.getEmissiveTexture() === logoTex) {
    m.setEmissiveTexture(null);
    m.setEmissiveFactor([0, 0, 0]);
    log('emissive logo removed from', JSON.stringify(m.getName()));
  }
}
const plate = doc.createTexture('baha_plate_blank').setMimeType('image/png');
plate.setImage(
  await sharp({ create: { width: 256, height: 64, channels: 3, background: { r: 232, g: 230, b: 224 } } }).png().toBuffer(),
);
for (const m of root.listMaterials()) if (m.getBaseColorTexture() === logoTex) m.setBaseColorTexture(plate);
logoTex.dispose();
log('licence plate → blank (BAHA plate drawn at runtime)');

/* 1b — steering wheel emblem */
for (const n of root.listNodes()) {
  if (n.getName() === 'InteriorSteeringEmblem') {
    n.getMesh()?.dispose();
    n.dispose();
    log('InteriorSteeringEmblem removed');
  }
}

/* 1c — tyre sidewall lettering (polar resample from a clean angle of the same ring) */
const DEG = Math.PI / 180;
const BAND = [0.403, 0.4985]; // radius / width
const WEDGES = [
  [148 * DEG, 214 * DEG], // KHRONOS (left)
  [-24 * DEG, 24 * DEG], // 3DCommerce (right)
];
const SRC_ANGLE = 60 * DEG; // clean sector (rings only)
const inWedge = (a) => {
  for (const [a0, a1] of WEDGES) {
    let d = a;
    while (d < a0 - Math.PI) d += 2 * Math.PI;
    while (d > a0 + Math.PI) d -= 2 * Math.PI;
    if (d >= a0 && d <= a1) return Math.min(d - a0, a1 - d); // distance to the wedge edge (rad)
  }
  return -1;
};
function sample(data, W, H, x, y, c) {
  const x0 = Math.max(0, Math.min(W - 2, Math.floor(x)));
  const y0 = Math.max(0, Math.min(H - 2, Math.floor(y)));
  const fx = x - x0, fy = y - y0;
  const at = (xx, yy) => data[(yy * W + xx) * 4 + c];
  return (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
}
/** sign = ±1: how a tangent-space XY normal rotates with the image angle (picked automatically below) */
function resample(data, W, H, isNormal, sign, onlyRect) {
  const out = Buffer.from(data);
  const cx = W / 2, cy = H / 2;
  let err = 0, cnt = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const r = Math.hypot(dx, dy) / W;
      if (r < BAND[0] || r > BAND[1]) continue;
      const a = Math.atan2(dy, dx);
      let edge;
      if (onlyRect) {
        // self-test sector (no lettering): compare a resample with the original pixels
        if (a < onlyRect[0] || a > onlyRect[1]) continue;
        edge = 1;
      } else {
        edge = inWedge(a);
        if (edge < 0) continue;
      }
      const sx = cx + Math.cos(SRC_ANGLE) * r * W - 0.5;
      const sy = cy + Math.sin(SRC_ANGLE) * r * W - 0.5;
      const i = (y * W + x) * 4;
      let v = [0, 1, 2].map((c) => sample(data, W, H, sx, sy, c));
      if (isNormal) {
        const nx = v[0] / 127.5 - 1, ny = v[1] / 127.5 - 1;
        const d = sign * (a - SRC_ANGLE);
        const rx = nx * Math.cos(d) - ny * Math.sin(d);
        const ry = nx * Math.sin(d) + ny * Math.cos(d);
        v = [(rx + 1) * 127.5, (ry + 1) * 127.5, v[2]];
      }
      const k = Math.min(1, edge / (3 * DEG)); // 3° feather into the untouched ring
      for (let c = 0; c < 3; c++) {
        const nv = data[i + c] * (1 - k) + v[c] * k;
        if (onlyRect) {
          err += Math.abs(nv - data[i + c]);
          cnt++;
        }
        out[i + c] = Math.round(Math.max(0, Math.min(255, nv)));
      }
    }
  }
  return onlyRect ? err / Math.max(1, cnt) : out;
}
async function cleanTexture(tex, isNormal) {
  const { data, info } = await sharp(Buffer.from(tex.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let sign = 1;
  if (isNormal) {
    // pick the rotation convention that reproduces a clean sector best
    const test = [95 * DEG, 125 * DEG];
    const e1 = resample(data, W, H, true, 1, test);
    const e2 = resample(data, W, H, true, -1, test);
    sign = e1 <= e2 ? 1 : -1;
    log(`tyre normal: rotation sign ${sign} (self-test error ${e1.toFixed(2)} vs ${e2.toFixed(2)})`);
  }
  const out = resample(data, W, H, isNormal, sign);
  tex.setImage(await sharp(out, { raw: { width: W, height: H, channels: 4 } }).removeAlpha().png().toBuffer());
  tex.setMimeType('image/png');
}
const tyre = root.listMaterials().find((m) => m.getName() === 'Tireside');
await cleanTexture(tyre.getBaseColorTexture(), false);
await cleanTexture(tyre.getNormalTexture(), true);
log('tyre sidewall lettering rebuilt');

/* 2 — drop material variants (runtime BAHA paints) */
for (const ext of root.listExtensionsUsed()) {
  if (ext.extensionName === 'KHR_materials_variants') {
    ext.dispose();
    log('KHR_materials_variants removed');
  }
}

/* 3 — raycast proxies */
await MeshoptSimplifier.ready;
const buffer = root.listBuffers()[0];
let hitTris = 0;
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh || node.getName().startsWith('HIT_')) continue;
  const pos = [];
  const idx = [];
  let base = 0;
  const el = [0, 0, 0];
  for (const prim of mesh.listPrimitives()) {
    if (prim.getMode() !== 4) continue;
    const P = prim.getAttribute('POSITION');
    const I = prim.getIndices();
    const n = P.getCount();
    for (let i = 0; i < n; i++) pos.push(...P.getElement(i, el));
    if (I) for (const v of I.getArray()) idx.push(v + base);
    else for (let i = 0; i < n; i++) idx.push(base + i);
    base += n;
  }
  if (!idx.length) continue;
  const prim = doc
    .createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(idx)).setBuffer(buffer));
  if (idx.length / 3 > 300) {
    weldPrimitive(prim);
    simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: 0.06, error: 0.004 });
  }
  hitTris += prim.getIndices().getCount() / 3;
  const name = `HIT_${node.getName() || mesh.getName() || 'mesh'}`;
  node.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
}
log(`raycast proxies: ${Math.round(hitTris)} triangles`);

/* 4 — optimise */
await doc.transform(dedup(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 90 }));
await io.write(OUT, doc);
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(2) + ' MB';
console.log(`✔ ${path.relative(process.cwd(), OUT)}  ${mb(SRC)} → ${mb(OUT)}`);
