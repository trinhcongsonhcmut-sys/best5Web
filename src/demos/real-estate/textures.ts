/**
 * Procedural canvas textures for the villa (no network, no image files).
 * Every tile is periodic so it repeats without seams; architecture UVs are in metres / TILE.
 */
import * as THREE from 'three';

/** One façade texture tile covers TILE × TILE metres. */
export const TILE = 2.4;

// ───────── deterministic random + periodic value noise ─────────
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function makeNoise(period: number, seed: number) {
  const r = rng(seed);
  const g = new Float32Array(period * period);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const at = (x: number, y: number) => g[(((y % period) + period) % period) * period + (((x % period) + period) % period)];
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

/** fbm sampled on a periodic lattice: u,v in 0..1 → 0..1 */
function fbm(n: ReturnType<typeof makeNoise>, u: number, v: number, base: number, oct = 4, sx = 1, sy = 1) {
  let sum = 0, amp = 0.5, f = base, norm = 0;
  for (let o = 0; o < oct; o++) {
    sum += n(u * f * sx, v * f * sy) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

function canvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d')! };
}

function tex(c: HTMLCanvasElement, srgb: boolean, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

/** per-pixel pass helper */
function pixels(w: number, h: number, fn: (x: number, y: number) => [number, number, number]) {
  const { c, g } = canvas(w, h);
  const img = g.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, gg, b] = fn(x, y);
      const i = (y * w + x) * 4;
      d[i] = r;
      d[i + 1] = gg;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return { c, g };
}

/** module-level cache: canvases are generated once per session, re-uploaded by three on remount */
const CACHE = new Map<string, unknown>();
export function cached<T>(key: string, make: () => T): T {
  if (!CACHE.has(key)) CACHE.set(key, make());
  return CACHE.get(key) as T;
}
export const STONE_KINDS = ['travertine', 'basalt', 'terracotta'] as const;
export const stoneSet = (i: number) => cached(`stone:${i}`, () => stoneTextures(STONE_KINDS[i], 512));
/** warm the other façade variants in idle time so the first click doesn't stall */
export function warmStones() {
  const ric = (window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200));
  let i = 1;
  const step = () => {
    if (i > 2) return;
    stoneSet(i++);
    ric(step, { timeout: 2000 });
  };
  ric(step, { timeout: 2000 });
}

export interface StoneSet {
  map: THREE.Texture;
  rough: THREE.Texture;
}

const clamp255 = (v: number) => Math.max(0, Math.min(255, v));

/**
 * Façade stone tiles. Albedo is a light, near-neutral luminance pattern — the material colour (variant tint)
 * multiplies it, so swapping variants changes both the colour and the actual surface pattern.
 * kind: travertine = cross-cut strata + pits, staggered 1.2×0.6 m panels
 *       basalt     = flamed fine-grain speckle, 0.6×1.2 m vertical slabs
 *       terracotta = long Roman bricks 0.6×0.08 m, per-brick firing variation
 */
export function stoneTextures(kind: 'travertine' | 'basalt' | 'terracotta', size = 1024): StoneSet {
  const s = size;
  const px = s / TILE; // pixels per metre
  const n1 = makeNoise(64, kind.length * 31 + 7);
  const n2 = makeNoise(16, kind.length * 17 + 3);
  const r = rng(kind.length * 977 + 11);

  // joint layout (in px), returns [jointMask 0..1, panelTone -1..1]
  const panelTone = new Float32Array(256);
  for (let i = 0; i < panelTone.length; i++) panelTone[i] = r() * 2 - 1;

  let pw: number, ph: number, stagger: number, joint: number;
  if (kind === 'travertine') { pw = 1.2 * px; ph = 0.6 * px; stagger = 0.5; joint = 2.2; }
  else if (kind === 'basalt') { pw = 0.6 * px; ph = 1.2 * px; stagger = 0; joint = 2.4; }
  else { pw = 0.6 * px; ph = 0.08 * px; stagger = 0.5; joint = 2.6; }

  const cell = (x: number, y: number) => {
    const row = Math.floor(y / ph);
    const off = (row % 2) * stagger * pw;
    const xx = (((x + off) % s) + s) % s;
    const col = Math.floor(xx / pw);
    const lx = xx - col * pw, ly = y - row * ph;
    const dj = Math.min(lx, pw - lx, ly, ph - ly);
    const mask = dj < joint ? 1 - dj / joint : 0;
    return { mask, tone: panelTone[(row * 7 + col * 13) & 255] };
  };

  const height = new Float32Array(s * s);
  const albedo = pixels(s, s, (x, y) => {
    const u = x / s, v = y / s;
    const { mask, tone } = cell(x, y);
    let l: number, warm = 0, h = 0.6;
    if (kind === 'travertine') {
      // strata: horizontal bands distorted by low noise
      const warp = fbm(n1, u, v, 2, 3) * 0.08;
      const band = fbm(n1, u * 0.25 + 0.3, v + warp, 8, 4, 0.15, 1);
      const pit = fbm(n2, u, v, 8, 2, 0.5, 3.0);
      l = 0.88 + (band - 0.5) * 0.22 + tone * 0.035;
      warm = (band - 0.5) * 0.35;
      const isPit = pit > 0.78 ? (pit - 0.78) * 4 : 0;
      l -= isPit * 0.14;
      h = 0.62 + (band - 0.5) * 0.15 - isPit * 0.5;
    } else if (kind === 'basalt') {
      const g1 = fbm(n1, u, v, 16, 3);
      const speck = r() * 0.12 + (r() > 0.985 ? 0.25 : 0);
      l = 0.82 + (g1 - 0.5) * 0.18 + speck - 0.06 + tone * 0.03;
      h = 0.55 + (g1 - 0.5) * 0.4 + speck * 0.6;
    } else {
      const g1 = fbm(n1, u, v, 6, 3);
      const fine = r() * 0.06;
      l = 0.82 + tone * 0.11 + (g1 - 0.5) * 0.14 + fine;
      warm = tone * 0.25;
      h = 0.7 + fine;
    }
    l = l * (1 - mask * 0.55);
    h = h * (1 - mask * 0.85);
    height[y * s + x] = h;
    const L = l * 255;
    return [clamp255(L * (1 + warm * 0.06)), clamp255(L), clamp255(L * (1 - warm * 0.08))];
  });

  // roughness (G channel) + bump (R channel) from height — joints rough & recessed
  const half = s >> 1;
  const rough = pixels(half, half, (x, y) => {
    const h = height[y * 2 * s + x * 2];
    const ro = kind === 'basalt' ? 0.7 - h * 0.25 : kind === 'travertine' ? 0.78 - h * 0.28 : 0.86 - h * 0.12;
    return [clamp255(h * 255), clamp255(ro * 255), 0];
  });
  return { map: tex(albedo.c, true), rough: tex(rough.c, false) };
}

/** Teak grain — runs along V (vertical fins). Albedo in colour. */
export function woodTexture(): StoneSet {
  const w = 128, h = 512;
  const n = makeNoise(32, 91);
  const r = rng(5);
  const lineTone = new Float32Array(w);
  for (let i = 0; i < w; i++) lineTone[i] = r();
  const albedo = pixels(w, h, (x, y) => {
    const u = x / w, v = y / h;
    const wob = fbm(n, u, v, 2, 3, 1, 0.3) * 0.12;
    const ring = Math.sin((u + wob) * Math.PI * 2 * 22) * 0.5 + 0.5;
    const fleck = fbm(n, u, v, 8, 2, 4, 0.2);
    const l = 0.62 + ring * 0.16 + (fleck - 0.5) * 0.2 + lineTone[x] * 0.04;
    return [clamp255(170 * l + 20), clamp255(112 * l + 8), clamp255(70 * l)];
  });
  const rough = pixels(w / 2, h / 2, (x, y) => {
    const u = (x * 2) / w;
    const ring = Math.sin(u * Math.PI * 2 * 22) * 0.5 + 0.5;
    return [clamp255(ring * 200 + 30), clamp255((0.55 + ring * 0.2) * 255), 0];
  });
  return { map: tex(albedo.c, true), rough: tex(rough.c, false) };
}

/** Large-format honed pavers for the forecourt (light grey, 1.2 m squares in a 2.4 m tile). */
export function paverTexture(): StoneSet {
  const s = 256;
  const n = makeNoise(32, 41);
  const r = rng(77);
  const tones = Array.from({ length: 16 }, () => r() * 2 - 1);
  const albedo = pixels(s, s, (x, y) => {
    const u = x / s, v = y / s;
    const cx = Math.floor(u * 2), cy = Math.floor(v * 2);
    const lx = (u * 2) % 1, ly = (v * 2) % 1;
    const dj = Math.min(lx, 1 - lx, ly, 1 - ly) * s * 0.5;
    const joint = dj < 1.6 ? 1 - dj / 1.6 : 0;
    const g = fbm(n, u, v, 8, 4);
    const l = (0.56 + (g - 0.5) * 0.16 + tones[cy * 2 + cx] * 0.04 + (r() - 0.5) * 0.03) * (1 - joint * 0.55);
    return [clamp255(l * 236), clamp255(l * 232), clamp255(l * 226)];
  });
  const rough = pixels(s / 2, s / 2, (x, y) => {
    const u = (x * 2) / s, v = (y * 2) / s;
    const g = fbm(n, u + 0.37, v + 0.11, 4, 4);
    // puddles = smooth patches (wet look)
    const wet = Math.max(0, Math.min(1, (g - 0.48) * 6));
    return [0, clamp255((0.55 - wet * 0.3) * 255), 0];
  });
  return { map: tex(albedo.c, true), rough: tex(rough.c, false) };
}

/** generic grain (lawn / earth / asphalt): returns colour map around `base` with fbm variation */
export function grainTexture(base: [number, number, number], amp: number, seed: number, size = 512, freq = 6) {
  const n = makeNoise(64, seed);
  const r = rng(seed * 3 + 1);
  const { c } = pixels(size, size, (x, y) => {
    const u = x / size, v = y / size;
    const g = fbm(n, u, v, freq, 5) - 0.5;
    const k = 1 + g * amp + (r() - 0.5) * amp * 0.35;
    return [clamp255(base[0] * k), clamp255(base[1] * k), clamp255(base[2] * k)];
  });
  return tex(c, true);
}

/** pool mosaic — small glass tiles, used as albedo (tinted by material) */
export function mosaicTexture() {
  const s = 256;
  const r = rng(303);
  const { c, g } = canvas(s);
  const n = 16;
  const d = s / n;
  g.fillStyle = '#c9d6d6';
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const k = 0.78 + r() * 0.22;
      g.fillStyle = `rgb(${Math.round(150 * k)},${Math.round(215 * k)},${Math.round(225 * k)})`;
      g.fillRect(x * d + 1, y * d + 1, d - 2, d - 2);
    }
  return tex(c, true);
}

/** tileable water normal map from a sum of directional sines */
export function waterNormal() {
  const s = 256;
  const waves = [
    [1, 0, 3, 0.9], [0, 1, 4, 0.7], [1, 1, 5, 0.5], [2, -1, 7, 0.35], [-1, 3, 9, 0.25], [3, 2, 13, 0.15],
  ];
  const { c } = pixels(s, s, (x, y) => {
    let dx = 0, dy = 0;
    const u = (x / s) * Math.PI * 2, v = (y / s) * Math.PI * 2;
    for (const [a, b, , amp] of waves) {
      const ph = a * u + b * v + a * 1.7 + b * 0.4;
      const cph = Math.cos(ph) * amp;
      dx += cph * a;
      dy += cph * b;
    }
    const k = 0.07;
    const nx = -dx * k, ny = -dy * k;
    const len = Math.hypot(nx, ny, 1);
    return [clamp255((nx / len) * 127 + 128), clamp255((ny / len) * 127 + 128), clamp255((1 / len) * 127 + 128)];
  });
  return tex(c, false);
}

/** distant tower façade: random lit windows on a dark grid → emissive map (also used as albedo darkened) */
export function cityWindows() {
  const w = 128, h = 256;
  const r = rng(808);
  const { c, g } = canvas(w, h);
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  const cols = 8, rows = 32;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const on = r();
      if (on < 0.42) continue;
      const k = 0.5 + r() * 0.5;
      const warm = r() > 0.25;
      g.fillStyle = warm ? `rgba(255,${Math.round(190 + 40 * k)},${Math.round(120 + 60 * k)},${k})` : `rgba(190,220,255,${k * 0.8})`;
      g.fillRect(x * (w / cols) + 3, y * (h / rows) + 2, w / cols - 6, h / rows - 4);
    }
  return tex(c, true);
}

/** palm frond leaflets (alpha in A) — frond spine runs along U, leaflets fan out along V */
export function frondTexture() {
  // leaflets are filled, tapered blades (not hairlines) so they read as foliage at distance and mip down to green, not black
  const w = 512, h = 128;
  const { c, g } = canvas(w, h);
  g.clearRect(0, 0, w, h);
  const r = rng(12);
  const cy = h / 2;
  const N = 38;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = 14 + t * (w - 34);
    const len = (h / 2 - 4) * Math.sin(Math.min(1, t * 1.1) * Math.PI * 0.9 + 0.18) * (0.88 + r() * 0.12);
    const wid = 9 - t * 4;
    for (const side of [-1, 1]) {
      const k = 0.85 + r() * 0.3;
      const tipX = x + 26 + r() * 8, tipY = cy + side * len;
      const grd = g.createLinearGradient(x, cy, tipX, tipY);
      grd.addColorStop(0, `rgb(${Math.round(96 * k)},${Math.round(128 * k)},${Math.round(58 * k)})`);
      grd.addColorStop(1, `rgb(${Math.round(124 * k)},${Math.round(158 * k)},${Math.round(72 * k)})`);
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(x - wid / 2, cy);
      g.quadraticCurveTo(x + 4, cy + side * len * 0.55, tipX, tipY);
      g.quadraticCurveTo(x + 14, cy + side * len * 0.5, x + wid / 2, cy);
      g.closePath();
      g.fill();
    }
  }
  g.strokeStyle = '#8a8550';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, cy);
  g.lineTo(w, cy);
  g.stroke();
  const t = tex(c, true, false);
  return t;
}

/** bamboo leaf spray card (alpha) */
export function leafCardTexture() {
  const s = 256;
  const { c, g } = canvas(s);
  const r = rng(99);
  g.clearRect(0, 0, s, s);
  for (let i = 0; i < 70; i++) {
    const x = s * 0.5 + (r() - 0.5) * s * 0.75;
    const y = s * 0.12 + r() * s * 0.8;
    const a = (r() - 0.5) * 2.2 + Math.PI / 2;
    const L = 26 + r() * 30;
    const k = 0.65 + r() * 0.35;
    g.fillStyle = `rgb(${Math.round(104 * k)},${Math.round(146 * k)},${Math.round(66 * k)})`;
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.beginPath();
    g.ellipse(L / 2, 0, L / 2, 6 + r() * 3, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  return tex(c, true, false);
}

/** palm trunk rings */
export function trunkTexture() {
  const w = 64, h = 512;
  const n = makeNoise(16, 4);
  const { c } = pixels(w, h, (x, y) => {
    const v = y / h;
    const ring = Math.pow(Math.abs(Math.sin(v * Math.PI * 40)), 6);
    const g = fbm(n, x / w, v, 4, 3);
    const l = 0.55 + g * 0.3 - ring * 0.25;
    return [clamp255(150 * l), clamp255(128 * l), clamp255(100 * l)];
  });
  return tex(c, true);
}

/**
 * Baked ground AO: dark soft footprints under the building and every tree, painted once on a canvas that maps
 * to a SIZE×SIZE metre square centred on the origin.
 */
export function groundAO(size: number, rects: [number, number, number, number, number][], dots: [number, number, number, number][]) {
  const res = 1024;
  const { c, g } = canvas(res);
  // white = occlusion amount (used as alphaMap on a black plane)
  g.fillStyle = '#000';
  g.fillRect(0, 0, res, res);
  const m = res / size;
  const toPx = (x: number, z: number) => [(x + size / 2) * m, (z + size / 2) * m];
  // rects: x0, z0, x1, z1, strength
  for (const [x0, z0, x1, z1, k] of rects) {
    for (let i = 6; i >= 1; i--) {
      const grow = i * 0.55;
      const [a, b] = toPx(x0 - grow, z0 - grow);
      const [cx, cz] = toPx(x1 + grow, z1 + grow);
      g.fillStyle = `rgba(255,255,255,${(k * 0.16) / i})`;
      g.beginPath();
      g.roundRect(a, b, cx - a, cz - b, grow * m);
      g.fill();
    }
  }
  // dots: x, z, radius, strength
  for (const [x, z, rad, k] of dots) {
    const [px, pz] = toPx(x, z);
    const grd = g.createRadialGradient(px, pz, 0, px, pz, rad * m);
    grd.addColorStop(0, `rgba(255,255,255,${k})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(px - rad * m, pz - rad * m, rad * 2 * m, rad * 2 * m);
  }
  const t = tex(c, false, false);
  return t;
}

/** soft round glow sprite for lamps */
export function glowTexture() {
  const s = 128;
  const { c, g } = canvas(s);
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  return tex(c, true, false);
}
