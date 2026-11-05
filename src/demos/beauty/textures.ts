/**
 * Generated textures (no image files, no network): giant display word, paper label, citrus flesh masks + normal map,
 * rind dimple normal map, blurred foreground citrus (bokeh), soft blob shadow, particle dot.
 * Text is drawn only after the self-hosted @fontsource faces are loaded.
 */
import * as THREE from 'three';
import type { World } from './palette';

export const SERIF = '"Bodoni Moda", "Didot", "Bodoni 72", serif';
export const SANS = '"Manrope Variable", "Manrope", system-ui, sans-serif';

let fontsReady: Promise<unknown> | null = null;
export function whenFonts() {
  if (!fontsReady) {
    const specs = [`400 120px ${SERIF}`, `italic 400 120px ${SERIF}`, `500 120px ${SERIF}`, `600 40px ${SANS}`, `500 40px ${SANS}`];
    fontsReady = typeof document !== 'undefined' && document.fonts
      ? Promise.all(specs.map((s) => document.fonts.load(s))).catch(() => undefined)
      : Promise.resolve();
  }
  return fontsReady;
}

function canvasTex(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { c, ctx: c.getContext('2d')!, t };
}

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };

/**
 * Giant Didone word, white on transparent (tinted by the material colour).
 * landscape: one line on a 4:1 canvas · portrait: two stacked lines on a 1:1 canvas (phones keep the full word).
 */
export function wordTexture(portrait = false) {
  const W = portrait ? 1024 : 2048;
  const H = portrait ? 1024 : 512;
  const { c, ctx, t } = canvasTex(W, H);
  const fit = (text: string, maxW: number, maxSize: number) => {
    ctx.font = `400 ${maxSize}px ${SERIF}`;
    const w = ctx.measureText(text).width;
    return Math.min(maxSize, (maxSize * maxW) / Math.max(1, w));
  };
  const draw = (word: string) => {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    (ctx as Ctx).letterSpacing = portrait ? '-2px' : '-5px';
    if (!portrait) {
      const size = fit(word, W * 0.98, 444);
      ctx.font = `400 ${size}px ${SERIF}`;
      ctx.fillText(word, W / 2, H * 0.5 + size * 0.36);
    } else {
      const cut = Math.ceil(word.length / 2);
      const lines = [word.slice(0, cut), word.slice(cut)];
      const size = Math.min(...lines.map((l) => fit(l, W * 0.96, 470)));
      ctx.font = `400 ${size}px ${SERIF}`;
      lines.forEach((l, i) => ctx.fillText(l, W / 2, H * (i === 0 ? 0.27 : 0.73) + size * 0.36));
    }
    t.needsUpdate = true;
  };
  return { texture: t, draw };
}

/**
 * Wrap-around paper label (sRGB, fully opaque). The front panel (u ≈ 0.5) faces the camera; the canvas aspect
 * matches the wrapped arc (3.3 rad × r 0.3045 = 1.005 wide, 0.73 tall).
 */
export function labelTexture() {
  const W = 1792;
  const H = 1302;
  const { c, ctx, t } = canvasTex(W, H);
  const draw = (w: World) => {
    const x = ctx as Ctx;
    const cx = W / 2;
    // paper: warm stock + faint fibre noise + very soft vignette toward the wrap ends
    ctx.fillStyle = w.paper;
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(120,90,60,0.10)');
    g.addColorStop(0.22, 'rgba(120,90,60,0)');
    g.addColorStop(0.78, 'rgba(120,90,60,0)');
    g.addColorStop(1, 'rgba(120,90,60,0.10)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    let s = 9;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(110,80,50,0.07)';
      ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 5, 1);
    }
    ctx.fillStyle = w.labelInk;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    // wordmark
    x.letterSpacing = '30px';
    ctx.font = `500 92px ${SERIF}`;
    ctx.fillText('BAHA', cx + 15, 220);
    x.letterSpacing = '9px';
    ctx.font = `600 22px ${SANS}`;
    ctx.fillText('BOTANICA  ·  LABORATORY', cx + 4, 268);
    // product
    x.letterSpacing = '6px';
    ctx.font = `500 96px ${SERIF}`;
    ctx.fillText(w.name.toUpperCase(), cx + 3, 560);
    x.letterSpacing = '0px';
    ctx.font = `italic 400 68px ${SERIF}`;
    ctx.fillText('serum', cx, 640);
    // accent bar
    ctx.fillStyle = w.accent;
    ctx.fillRect(cx - 74, 700, 148, 16);
    ctx.fillStyle = w.labelInk;
    ctx.font = `italic 400 64px ${SERIF}`;
    ctx.fillText(w.active, cx, 840);
    x.letterSpacing = '4px';
    ctx.font = `500 21px ${SANS}`;
    ctx.fillText('BRIGHTENING DAILY CONCENTRATE', cx + 2, 900);
    // volume
    x.letterSpacing = '2px';
    ctx.font = `600 44px ${SANS}`;
    ctx.fillText('30 ml  ℮', cx, 1150);
    // fine print columns on the wrap (seen when the bottle turns)
    x.letterSpacing = '3px';
    ctx.font = `500 19px ${SANS}`;
    ctx.textAlign = 'left';
    ['DIRECTIONS', 'Apply 3 drops to clean skin,', 'morning. Follow with SPF.', '', 'BAHA BOTANICA LAB', 'LOT 02 · MADE IN VN'].forEach((l, i) => ctx.fillText(l, 70, 520 + i * 34));
    ctx.textAlign = 'right';
    ['INGREDIENTS', 'AQUA · ASCORBIC ACID', 'CITRUS SINENSIS PEEL OIL', 'SODIUM HYALURONATE', 'TOCOPHEROL · FERULIC ACID', 'GLYCERIN'].forEach((l, i) => ctx.fillText(l, W - 70, 520 + i * 34));
    t.needsUpdate = true;
  };
  return { texture: t, draw };
}

/* ───────── citrus flesh: masks (R detail · G pulp · B rind band) + normal map, generated per pixel ───────── */
function dataTex(data: Uint8Array, size: number, wrap: THREE.Wrapping = THREE.ClampToEdgeWrapping) {
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.colorSpace = THREE.NoColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.wrapS = t.wrapT = wrap;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function heightToNormal(h: Float32Array, size: number, k: number, wrap: boolean) {
  const out = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => {
    if (wrap) return h[((y + size) % size) * size + ((x + size) % size)];
    return h[Math.min(size - 1, Math.max(0, y)) * size + Math.min(size - 1, Math.max(0, x))];
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * k;
      const dy = (at(x, y + 1) - at(x, y - 1)) * k;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      out[i] = ((-dx / l) * 0.5 + 0.5) * 255;
      out[i + 1] = ((-dy / l) * 0.5 + 0.5) * 255;
      out[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      out[i + 3] = 255;
    }
  return out;
}

const sstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Photographic citrus flesh, generated per pixel:
 *   R  vesicle detail (individual teardrop juice sacs, per-sac brightness)
 *   G  pulp coverage — membranes are SOFT and only partly opaque (pulp shows through them), never pure white lines
 *   B  rind band (flavedo cross-section)
 *   A  wet-gloss factor (crown of each sac) → drives roughness + clearcoat in the flesh shader
 * + a matching normal map (sacs bulge, membranes sink, pith ring proud). `data` is kept for the bokeh impostors.
 */
export function citrusFaceTextures(size = 512, seed = 3, N = 11, sacScale = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const widths = Array.from({ length: N }, () => 1 + (rnd() - 0.5) * 0.28);
  const memScale = Array.from({ length: N }, () => 0.7 + rnd() * 0.7);
  // every segment grows its own sac size → no printed, uniform pattern
  const sacK = Array.from({ length: N }, () => (0.82 + rnd() * 0.36) * sacScale);
  const sum = widths.reduce((a, b) => a + b, 0);
  const bounds: number[] = [];
  let acc = rnd() * 0.5;
  for (const w of widths) {
    bounds.push(acc);
    acc += (w / sum) * Math.PI * 2;
  }
  // integer hash (no trig in the inner loops → the whole map builds in a few tens of ms)
  const hash = (a: number, b: number) => {
    let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(seed, 1442695041)) | 0;
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };
  const TAU = Math.PI * 2;
  const wc = bounds.map((_, k) => Math.cos(k * 1.7));
  const ws = bounds.map((_, k) => Math.sin(k * 1.7));
  const mask = new Uint8Array(size * size * 4);
  const h = new Float32Array(size * size);
  const bk = new Float32Array(N);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = ((x + 0.5) / size) * 2 - 1;
      const v = ((y + 0.5) / size) * 2 - 1;
      let th = Math.atan2(v, u);
      if (th < 0) th += TAU;
      const r0 = Math.hypot(u, v);
      const r = r0 / (1 + 0.01 * Math.sin(th * 5 + seed) + 0.007 * Math.sin(th * 11 + seed * 2.3));
      // curvy membranes (each segment wall wanders a little as it runs out to the pith)
      const s6 = Math.sin(r * 6) * 0.05 * r;
      const c6 = Math.cos(r * 6) * 0.05 * r;
      for (let k = 0; k < N; k++) bk[k] = bounds[k] + s6 * wc[k] + c6 * ws[k];
      let dMin = 9;
      let kMin = 0;
      let seg = 0;
      for (let k = 0; k < N; k++) {
        let d = Math.abs(th - bk[k]);
        d = Math.min(d, TAU - d);
        if (d < dMin) {
          dMin = d;
          kMin = k;
        }
        const a0 = bk[k];
        const a1 = k + 1 < N ? bk[k + 1] : bk[0] + TAU;
        const tt = th < a0 ? th + TAU : th;
        if (tt >= a0 && tt < a1) seg = k;
      }
      const arc = dMin * r;
      const memW = (0.003 + 0.0055 * r) * memScale[kMin];
      const membrane = 1 - sstep(memW * 0.5, memW * 1.9, arc);
      const core = 1 - sstep(0.045, 0.1, r + 0.02 * Math.cos(th * N));
      const pulpEdge = 0.835 + 0.012 * Math.sin(th * 9 + seed) + 0.006 * Math.sin(th * 23);
      const pulpOuter = 1 - sstep(pulpEdge - 0.014, pulpEdge + 0.01, r);
      const rindBand = sstep(0.93, 0.948, r);
      // teardrop juice sacs, long axis along the radius, tips toward the core
      const a0 = bk[seg];
      const tl = (th < a0 ? th + TAU : th) - a0;
      const cu = r * 15 * sacK[seg];
      const cv = tl * r * 30 * sacK[seg];
      const iu = Math.floor(cu);
      const iv = Math.floor(cv);
      let best = 9;
      let cell = 0;
      for (let du = -1; du <= 1; du++)
        for (let dv = -1; dv <= 1; dv++) {
          const hu = hash(iu + du, iv + dv + seg * 31);
          const ou = iu + du + 0.5 + (hu - 0.5) * 0.55;
          const ov = iv + dv + 0.5 + (hash(iv + dv + seg * 31, iu + du + 7) - 0.5) * 0.6;
          const ddu = cu - ou;
          const d = Math.hypot(ddu, (cv - ov) * (0.6 + 0.35 * Math.max(-0.6, ddu)));
          if (d < best) {
            best = d;
            cell = hu;
          }
        }
      const ves = 1 - sstep(0.12, 0.62, best);
      const pulp = Math.max(0, pulpOuter - core) * (1 - membrane * 0.6) * (r0 < 1.02 ? 1 : 0);
      const lum = 0.48 + 0.42 * ves * (0.7 + 0.6 * cell) + (hash(x, y) - 0.5) * 0.05;
      const gloss = ves * pulpOuter * (1 - membrane) * (1 - core);
      const i = (y * size + x) * 4;
      mask[i] = Math.min(255, Math.max(0, lum * 255));
      mask[i + 1] = Math.max(0, Math.min(1, pulp)) * 255;
      mask[i + 2] = rindBand * 255;
      mask[i + 3] = Math.min(255, gloss * 255);
      const pith = (1 - pulpOuter) * (1 - rindBand);
      h[y * size + x] =
        pulpOuter * (1 - core) * (0.42 + 0.42 * ves - 0.28 * membrane) + pith * 0.6 + rindBand * 0.64 + core * pulpOuter * 0.4;
    }
  return { map: dataTex(mask, size), normal: dataTex(heightToNormal(h, size, 7, false), size), data: mask, size };
}

/** Tiling rind normal map: dense oil-gland dimples + fine pebble noise. */
export function rindNormalTexture(size = 256, seed = 5) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const h = new Float32Array(size * size);
  const pits = Array.from({ length: 420 }, () => ({ x: rnd() * size, y: rnd() * size, r: 2.2 + rnd() * 3.2, d: 0.6 + rnd() * 0.6 }));
  for (const p of pits) {
    const R = Math.ceil(p.r * 2.2);
    for (let dy = -R; dy <= R; dy++)
      for (let dx = -R; dx <= R; dx++) {
        const xx = (Math.floor(p.x) + dx + size) % size;
        const yy = (Math.floor(p.y) + dy + size) % size;
        const d2 = (dx * dx + dy * dy) / (p.r * p.r);
        h[yy * size + xx] -= p.d * Math.exp(-d2 * 1.6);
      }
  }
  for (let i = 0; i < h.length; i++) h[i] += (rnd() - 0.5) * 0.08;
  return dataTex(heightToNormal(h, size, 1.3, true), size, THREE.RepeatWrapping);
}

/** Paper fibre normal map (tiling). */
export function paperNormalTexture(size = 256, seed = 13) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const h = new Float32Array(size * size);
  for (let f = 0; f < 900; f++) {
    const x0 = rnd() * size;
    const y0 = rnd() * size;
    const a = rnd() * Math.PI;
    const L = 6 + rnd() * 18;
    for (let k = 0; k < L; k++) {
      const xx = Math.floor(x0 + Math.cos(a) * k + size) % size;
      const yy = Math.floor(y0 + Math.sin(a) * k + size) % size;
      h[yy * size + xx] += 0.35;
    }
  }
  for (let i = 0; i < h.length; i++) h[i] += (rnd() - 0.5) * 0.25;
  return dataTex(heightToNormal(h, size, 0.6, true), size, THREE.RepeatWrapping);
}

/**
 * Out-of-focus citrus (photographic depth-of-field impostor): the SAME generated flesh (channel masks, see
 * citrusFaceTextures) on a disc with its rind ring, pre-blurred once on a canvas; alpha = coverage. A tiny shader
 * colourises it with the live palette, so it matches the sharp pieces and follows the variants.
 */
export function bokehSliceTexture(face: { data: Uint8Array; size: number }, out = 512, blur = 15) {
  const n = face.size;
  const src = document.createElement('canvas');
  src.width = src.height = n;
  const c = src.getContext('2d')!;
  const img = c.createImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const u = ((x + 0.5) / n) * 2 - 1;
      const v = ((y + 0.5) / n) * 2 - 1;
      const r = Math.hypot(u, v) / 1.04;
      const i = (y * n + x) * 4;
      img.data[i] = face.data[i];
      img.data[i + 1] = face.data[i + 1];
      img.data[i + 2] = r > 0.955 ? 255 : face.data[i + 2];
      img.data[i + 3] = (1 - sstep(0.99, 1.0, r)) * 255;
    }
  c.putImageData(img, 0, 0);
  const dst = document.createElement('canvas');
  dst.width = dst.height = out;
  const o = dst.getContext('2d')!;
  o.filter = `blur(${blur}px)`;
  const m = out * 0.12;
  o.drawImage(src, m, m, out - 2 * m, out - 2 * m);
  const t = new THREE.CanvasTexture(dst);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function blobTexture(size = 256, soft = false) {
  const { ctx, t } = canvasTex(size, size);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  if (soft) {
    g.addColorStop(0, 'rgb(255,255,255)');
    g.addColorStop(0.3, 'rgb(170,170,170)');
    g.addColorStop(0.62, 'rgb(48,48,48)');
    g.addColorStop(1, 'rgb(0,0,0)');
  } else {
    // tight contact core: dark under the base, fast falloff
    g.addColorStop(0, 'rgb(255,255,255)');
    g.addColorStop(0.45, 'rgb(220,220,220)');
    g.addColorStop(0.7, 'rgb(70,70,70)');
    g.addColorStop(1, 'rgb(0,0,0)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function dotTexture() {
  const { ctx, t } = canvasTex(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return t;
}
