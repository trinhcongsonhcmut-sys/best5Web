/**
 * Packs the two Cycles shadow-catcher bakes (alpha = fraction of light blocked) into one realtime texture:
 *   R = closed pose, G = open pose (.02 reveal), B = 0  →  src/demos/automotive/bake/road-shadow.png
 * A 9-tap vertical median removes the 1-px seam where the road and shoulder catchers meet; σ 0.8 blur hides 64-spp noise.
 *   node automotive-flagship/tools/pack-shadow.mjs [size=1024]
 */
import sharp from 'sharp';
import fs from 'node:fs';
const C = JSON.parse(fs.readFileSync('automotive-flagship/contract/scene-contract.json', 'utf8'));
const size = Number(process.argv[2] ?? 1024);
const load = async (n) => {
  // 16-bit PNG from Blender: sharp's uchar cast of ushort data is unreliable → read ushort and scale by hand
  const { data: raw, info } = await sharp(`automotive-flagship/renders/bake/shadow-${n}.png`).extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, out = Buffer.alloc(W * H);
  const data = info.depth === 'ushort' ? Uint8Array.from({ length: W * H }, (_, i) => Math.round(raw.readUInt16LE(i * 2) / 257)) : raw;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = [];
    for (let k = -4; k <= 4; k++) v.push(data[Math.min(H - 1, Math.max(0, y + k)) * W + x]);
    v.sort((a, b) => a - b);
    out[y * W + x] = v[4];
  }
  // the road and shoulder catchers leave a few-cm seam at each road edge → bridge it row-wise (linear fill)
  const { cz, size: S } = C.shadowBake, edgeZ = [C.road.z - (C.road.w + 0.6) / 2, C.road.z + (C.road.w + 0.6) / 2];
  for (const z of edgeZ) {
    const r = Math.round(((z - (cz - S / 2)) / S) * H), r0 = r - 10, r1 = r + 12;
    if (r0 < 0 || r1 >= H) continue;
    for (let x = 0; x < W; x++) for (let y = r0 + 1; y < r1; y++) out[y * W + x] = Math.round(out[r0 * W + x] + ((out[r1 * W + x] - out[r0 * W + x]) * (y - r0)) / (r1 - r0));
  }
  return sharp(out, { raw: { width: W, height: H, channels: 1 } }).blur(0.8).resize(size, size).extractChannel(0).raw().toBuffer();
};
const [a, b] = [await load('closed'), await load('open')];
const rgb = Buffer.alloc(size * size * 3);
for (let i = 0; i < size * size; i++) {
  rgb[i * 3] = a[i];
  rgb[i * 3 + 1] = b[i];
}
const info = await sharp(rgb, { raw: { width: size, height: size, channels: 3 } }).png({ compressionLevel: 9 }).toFile('src/demos/automotive/bake/road-shadow.png');
console.log(info);
