/**
 * Side-by-side + paint ΔE2000 between a realtime frame and a Blender preview of the same pose (same W×H).
 *   node automotive-flagship/tools/compare.mjs <realtime.png> <blender.png> <mask.png> <out.jpg>
 * Paint pixels = car silhouette mask (contract/mask-rt-*.png) ∩ near-white/near-paint chroma in BOTH images is not
 * assumed: we take the silhouette, erode it 3 px, and keep pixels whose Blender luminance is in the paint's range
 * (drops tyres / glass / dark trims). Prints median / p75 ΔE2000 over those pixels.
 */
import sharp from 'sharp';
const [a, b, m, out] = process.argv.slice(2);
const A = await sharp(a).removeAlpha().raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true });
const B = await sharp(b).removeAlpha().resize(A.info.width, A.info.height).raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true });
const M = await sharp(m).extractChannel(0).raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true });
const W = A.info.width, H = A.info.height;
const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lab(r, g, b) {
  r = lin(r); g = lin(g); b = lin(b);
  let x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, y = 0.2126 * r + 0.7152 * g + 0.0722 * b, z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
function de2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G), C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) / rad + 360) % 360, h2p = (Math.atan2(b2, a2p) / rad + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = h2p - h1p;
  if (C1p * C2p === 0) dhp = 0; else if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) hbp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dth = 30 * Math.exp(-(((hbp - 275) / 25) ** 2)), RC = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2), SC = 1 + 0.045 * Cbp, SH = 1 + 0.015 * Cbp * T, RT = -Math.sin(2 * dth * rad) * RC;
  return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH));
}
const inMask = (x, y) => x >= 0 && y >= 0 && x < W && y < H && M.data[y * W + x] > 127;
const ds = [];
let lumMin = +(process.env.PAINT_LMIN ?? 0.25);
for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
  if (!(inMask(x, y) && inMask(x - 3, y) && inMask(x + 3, y) && inMask(x, y - 3) && inMask(x, y + 3))) continue;
  const i = (y * W + x) * 3;
  const lb = lab(B.data[i], B.data[i + 1], B.data[i + 2]);
  if (lb[0] / 100 < lumMin) continue; // paint only (dark trims, tyres, glass excluded) — bright-paint variants
  ds.push(de2000(lab(A.data[i], A.data[i + 1], A.data[i + 2]), lb));
}
ds.sort((p, q) => p - q);
const q = (f) => ds[Math.floor(f * (ds.length - 1))] ?? NaN;
console.log(JSON.stringify({ pixels: ds.length, median: +q(0.5).toFixed(2), p75: +q(0.75).toFixed(2), p90: +q(0.9).toFixed(2) }));
if (out) {
  await sharp({ create: { width: W * 2 + 8, height: H, channels: 3, background: '#111' } })
    .composite([{ input: await sharp(a).removeAlpha().toBuffer(), left: 0, top: 0 }, { input: await sharp(b).removeAlpha().resize(W, H).toColourspace('srgb').png().toBuffer(), left: W + 8, top: 0 }])
    .jpeg({ quality: 88 }).toFile(out);
}
