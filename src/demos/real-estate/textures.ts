/**
 * Textures for the villa.
 *  - PBR: approved CC0 Poly Haven scans (public/assets/textures/<id>/), loaded as the 1K WebP copies made by
 *    scripts/make-textures.mjs (diffuse sRGB · OpenGL normal · ARM = R AO, G roughness, B metal — all linear but diffuse).
 *  - Procedural (light effects only, never a surface material): pool mosaic + water normal, light-pool / scallop
 *    cards, foliage alpha cards, baked ground AO.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ───────── PBR sets ─────────
export const PBR_IDS = ['sandstone_blocks_05', 'brown_planks_03', 'concrete_floor_02', 'leafy_grass'] as const;
export type PbrId = (typeof PBR_IDS)[number];
export interface PbrSet {
  map: THREE.Texture;
  normal: THREE.Texture;
  arm: THREE.Texture;
}
const KINDS = ['diff', 'nor_gl', 'arm'] as const;
const URLS = PBR_IDS.flatMap((id) => KINDS.map((k) => `/assets/textures/${id}/${id}_${k}_1k.webp`));
/** start the downloads when the route chunk is evaluated — never inside a React render (keeps useProgress quiet) */
export function preloadPbr() {
  useLoader.preload(THREE.TextureLoader, URLS);
}

/** Suspends until all 12 maps are in, configures colour space / wrap / filtering and pre-uploads them to the GPU. */
export function usePbrSets(): Record<PbrId, PbrSet> {
  const tex = useLoader(THREE.TextureLoader, URLS);
  const gl = useThree((s) => s.gl);
  const sets = useMemo(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const out = {} as Record<PbrId, PbrSet>;
    PBR_IDS.forEach((id, i) => {
      const [map, normal, arm] = tex.slice(i * 3, i * 3 + 3);
      for (const t of [map, normal, arm]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = aniso;
        t.colorSpace = THREE.NoColorSpace;
        t.needsUpdate = true;
      }
      map.colorSpace = THREE.SRGBColorSpace;
      out[id] = { map, normal, arm };
    });
    return out;
  }, [tex, gl]);
  // upload now (inside the loading phase) → no first-frame hitch, and the variant swap never stalls
  useLayoutEffect(() => {
    for (const s of Object.values(sets)) for (const t of [s.map, s.normal, s.arm]) gl.initTexture(t);
  }, [sets, gl]);
  return sets;
}

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
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

const clamp255 = (v: number) => Math.max(0, Math.min(255, v));

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

/**
 * Deciduous leaf cluster card (alpha): ~150 small leaves in clumps, slight hue spread. Mips down to a soft
 * green silhouette rather than black holes.
 */
export function leafClusterTexture() {
  const s = 256;
  const { c, g } = canvas(s);
  const r = rng(99);
  g.clearRect(0, 0, s, s);
  // solid swatch for the opaque crown core (uv ≈ 0.035, see Landscape CORE_UV); cards sample uv ≥ 0.14
  g.fillStyle = 'rgb(46,66,28)';
  g.fillRect(0, s - 20, 20, 20);
  for (let k = 0; k < 9; k++) {
    const cx = s * (0.3 + r() * 0.5), cy = s * (0.14 + r() * 0.52);
    for (let i = 0; i < 20; i++) {
      const a = r() * Math.PI * 2;
      const rad = r() * s * 0.2;
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      const L = 12 + r() * 12;
      const t = 0.7 + r() * 0.3;
      const hue = r();
      g.fillStyle = `rgb(${Math.round((88 + hue * 30) * t)},${Math.round((128 + hue * 12) * t)},${Math.round((52 - hue * 14) * t)})`;
      g.save();
      g.translate(x, y);
      g.rotate(r() * Math.PI * 2);
      g.beginPath();
      g.ellipse(L / 2, 0, L / 2, 4 + r() * 3, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
  return tex(c, true, false);
}

/** pine needle spray card (alpha): fan of dark needles on a twig */
export function needleTexture() {
  const s = 256;
  const { c, g } = canvas(s);
  const r = rng(41);
  g.clearRect(0, 0, s, s);
  g.fillStyle = 'rgb(40,66,44)';
  g.fillRect(0, s - 20, 20, 20);
  g.lineCap = 'round';
  for (let b = 0; b < 5; b++) {
    const y0 = s * (0.1 + b * 0.15);
    for (let i = 0; i < 46; i++) {
      const x = s * 0.2 + (i / 46) * s * 0.76;
      const len = (18 + r() * 16) * (1 - Math.abs(i / 46 - 0.5) * 0.8);
      const t = 0.65 + r() * 0.35;
      g.strokeStyle = `rgb(${Math.round(48 * t)},${Math.round(84 * t)},${Math.round(52 * t)})`;
      g.lineWidth = 2.4;
      for (const side of [-1, 1]) {
        g.beginPath();
        g.moveTo(x, y0);
        g.lineTo(x + 6, y0 + side * len);
        g.stroke();
      }
    }
  }
  return tex(c, true, false);
}

/**
 * Baked ground AO: dark soft footprints under the building and every tree, painted once on a canvas that maps
 * to a SIZE×SIZE metre square centred on the origin.
 */
export function groundAO(size: number, rects: [number, number, number, number, number][], dots: [number, number, number, number][]) {
  const res = 1024;
  const { c, g } = canvas(res);
  g.fillStyle = '#000';
  g.fillRect(0, 0, res, res);
  const m = res / size;
  const toPx = (x: number, z: number) => [(x + size / 2) * m, (z + size / 2) * m];
  for (const [x0, z0, x1, z1, k] of rects) {
    for (let i = 6; i >= 1; i--) {
      const grow = i * 0.45;
      const [a, b] = toPx(x0 - grow, z0 - grow);
      const [cx, cz] = toPx(x1 + grow, z1 + grow);
      g.fillStyle = `rgba(255,255,255,${(k * 0.16) / i})`;
      g.beginPath();
      g.roundRect(a, b, cx - a, cz - b, grow * m);
      g.fill();
    }
  }
  for (const [x, z, rad, k] of dots) {
    const [px, pz] = toPx(x, z);
    const grd = g.createRadialGradient(px, pz, 0, px, pz, rad * m);
    grd.addColorStop(0, `rgba(255,255,255,${k})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(px - rad * m, pz - rad * m, rad * 2 * m, rad * 2 * m);
  }
  return tex(c, false, false);
}

/** soft round glow (floor light pools, lamp halos) */
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

/**
 * Downlight "scallop" on a wall: the hot parabolic cone a recessed soffit light throws down a stone pier
 * (bright cusp just under the soffit, widening and fading towards the ground). Top of the card = soffit.
 */
export function scallopTexture() {
  const w = 128, h = 256;
  const { c } = pixels(w, h, (x, y) => {
    const u = (x / (w - 1)) * 2 - 1; // −1..1 across
    const v = y / (h - 1); // 0 top (soffit) … 1 bottom
    // cone edge widens with depth: |u| < sqrt(v) shape, soft falloff, hot spot near the top
    const edge = Math.sqrt(Math.max(v, 0.0001)) * 0.95 + 0.06;
    const across = Math.max(0, 1 - Math.pow(Math.abs(u) / edge, 2.2));
    const along = Math.pow(1 - v, 1.6) * Math.min(1, v * 9);
    const cusp = Math.exp(-Math.pow(v - 0.08, 2) / 0.004) * Math.exp(-u * u * 30) * 0.6;
    const k = Math.min(1, across * along * 1.05 + cusp);
    return [clamp255(k * 255), clamp255(k * 255), clamp255(k * 255)];
  });
  return tex(c, true, false);
}
