/** Procedural canvas textures (no network): nylon crinkle normal map, labels/prints, blob shadow, giant word atlas. */
import * as THREE from 'three';

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/** fonts are self-hosted @fontsource files; wait for them before drawing type into a texture */
export async function fontsReady(specs: string[]) {
  try {
    await Promise.all(specs.map((s) => document.fonts.load(s)));
  } catch {
    /* draw with fallback */
  }
}

/** tileable value noise */
function makeNoise(period: number, seed: number) {
  const g = new Float32Array(period * period);
  let s = seed;
  for (let i = 0; i < g.length; i++) {
    s = (s * 16807) % 2147483647;
    g[i] = s / 2147483647;
  }
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const at = (i: number, j: number) => g[(((j % period) + period) % period) * period + (((i % period) + period) % period)];
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
}

/** ciré nylon: fine random crinkle facets + faint weave, as a tangent-space normal map */
export function crinkleNormalMap(size = 256) {
  const h = new Float32Array(size * size);
  const n1 = makeNoise(8, 7);
  const n2 = makeNoise(16, 19);
  const n3 = makeNoise(32, 41);
  const n4 = makeNoise(64, 73);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // fine ripstop grid (raised reinforcement threads) + small, high-frequency ciré crinkle.
      // No large-scale term: low-frequency normal noise read as "melted plastic" in the macro shot.
      const gx = Math.abs(((x % 32) + 32) % 32 - 1);
      const gy = Math.abs(((y % 32) + 32) % 32 - 1);
      const grid = Math.max(gx < 1.5 ? 1 - gx / 1.5 : 0, gy < 1.5 ? 1 - gy / 1.5 : 0);
      const r2 = 1 - Math.abs(n2(u * 16 + 3.1, v * 16) * 2 - 1);
      const r3 = 1 - Math.abs(n3(u * 32, v * 32) * 2 - 1);
      const r1 = n1(u * 8, v * 8);
      // very fine crinkle facets: these break the specular into the small streaks of real ciré
      const r4 = 1 - Math.abs(n4(u * 64 + 1.7, v * 64) * 2 - 1);
      h[y * size + x] = grid * 0.3 + r2 * r2 * 0.22 + r3 * r3 * 0.22 + r4 * r4 * 0.22 + r1 * 0.04;
    }
  }
  const c = canvas(size, size);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)];
  const k = 2.4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * k;
      const dy = (at(x, y + 1) - at(x, y - 1)) * k;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      img.data[i] = ((-dx / l) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / l) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** moulded rubber chest patch: BAHA monogram + line name */
export function chestPatchTexture() {
  const c = canvas(512, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const draw = () => {
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 256);
    roundRect(ctx, 10, 10, 492, 236, 46);
    ctx.fillStyle = '#141414';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, 26, 26, 460, 204, 34);
    ctx.setLineDash([12, 9]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f2efe9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = "800 104px 'Syne', 'Arial Black', sans-serif";
    ctx.fillText('BAHA', 256, 146);
    ctx.font = "500 30px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillStyle = 'rgba(242,239,233,0.7)';
    ctx.fillText('CUMULUS · 01', 256, 200);
    t.needsUpdate = true;
  };
  draw();
  void fontsReady(["800 104px 'Syne'", "500 30px 'JetBrains Mono'"]).then(draw);
  return t;
}

/** reflective back print across the upper back */
export function backPrintTexture() {
  const c = canvas(1024, 160);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const draw = () => {
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 160);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // manual letter-spacing, fitted to the canvas width
    const txt = 'BAHA ATELIER';
    let fs = 92;
    let sp = 16;
    let widths: number[] = [];
    let total = Infinity;
    while (total > 960 && fs > 30) {
      ctx.font = `800 ${fs}px 'Syne', 'Arial Black', sans-serif`;
      widths = [...txt].map((ch) => ctx.measureText(ch).width);
      sp = fs * 0.17;
      total = widths.reduce((a, b) => a + b, 0) + sp * (txt.length - 1);
      if (total > 960) fs -= 4;
    }
    let x = 512 - total / 2;
    ctx.textAlign = 'left';
    [...txt].forEach((ch, i) => {
      ctx.fillText(ch, x, 84);
      x += widths[i] + sp;
    });
    t.needsUpdate = true;
  };
  draw();
  void fontsReady(["800 92px 'Syne'"]).then(draw);
  return t;
}

/** woven flag on the sleeve: stripes + dot (symmetric, reads from any direction) */
export function sleeveTabTexture() {
  const c = canvas(256, 128);
  const ctx = c.getContext('2d')!;
  roundRect(ctx, 4, 4, 248, 120, 18);
  ctx.fillStyle = '#f1ede6';
  ctx.fill();
  ctx.fillStyle = '#151515';
  for (let i = 0; i < 3; i++) ctx.fillRect(28 + i * 26, 24, 12, 80);
  ctx.beginPath();
  ctx.arc(186, 64, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f1ede6';
  ctx.beginPath();
  ctx.arc(186, 64, 12, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** soft elliptical contact shadow (baked) */
export function blobShadowTexture(size = 256) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // gaussian-ish falloff, written as grey levels (alphaMap reads the green channel)
  for (let i = 0; i <= 12; i++) {
    const r = i / 12;
    const v = Math.round(255 * Math.exp(-r * r * 5.5));
    g.addColorStop(r, `rgb(${v},${v},${v})`);
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** giant editorial word for the backdrop: row 0 filled, row 1 outlined */
export function wordAtlas(word: string) {
  const W = 2048;
  const H = 1024;
  const c = canvas(W, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  const draw = () => {
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 420;
    ctx.font = `800 ${size}px 'Syne', 'Arial Black', sans-serif`;
    const m = ctx.measureText(word).width;
    size = Math.floor(size * Math.min(1, (W * 0.96) / m));
    ctx.font = `800 ${size}px 'Syne', 'Arial Black', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(word, W / 2, H * 0.25 + size * 0.04);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(word, W / 2, H * 0.75 + size * 0.04);
    t.needsUpdate = true;
  };
  draw();
  void fontsReady(["800 420px 'Syne'"]).then(draw);
  return t;
}
