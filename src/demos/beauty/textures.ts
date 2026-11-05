/**
 * Canvas-drawn textures (no image files, no network): giant display word, jar labels, cap foil monogram,
 * soft blob shadow, particle dot. Text is drawn only after the self-hosted @fontsource faces are loaded.
 */
import * as THREE from 'three';

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
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = portrait ? '-2px' : '-5px';
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

/** Fine print on the back of the jar (variant independent). */
export function backLabelTexture() {
  const { c, ctx, t } = canvasTex(768, 320);
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const ls = (v: string) => ((ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = v);
    ls('6px');
    ctx.font = `600 20px ${SANS}`;
    ctx.fillText('RITUAL', c.width / 2, 40);
    ls('0px');
    ctx.font = `italic 400 30px ${SERIF}`;
    ctx.fillText('Warm a pearl between fingertips,', c.width / 2, 92);
    ctx.fillText('press softly into clean skin.', c.width / 2, 130);
    ctx.fillRect(c.width / 2 - 40, 160, 80, 2);
    ls('3px');
    ctx.font = `500 15px ${SANS}`;
    ['AQUA · ALOE BARBADENSIS LEAF JUICE · SQUALANE', 'BUTYROSPERMUM PARKII BUTTER · TOCOPHEROL', 'CAMELLIA SINENSIS LEAF EXTRACT · GLYCERIN'].forEach((l, i) => ctx.fillText(l, c.width / 2, 200 + i * 28));
    ctx.font = `600 14px ${SANS}`;
    ctx.fillText('BAHA BOTANICA  ·  LOT 01  ·  REFILLABLE GLASS', c.width / 2, 300);
    t.needsUpdate = true;
  };
  return { texture: t, draw };
}

/** Jar label print (white on transparent; tinted per variant). Wraps 1.96 rad of the body → aspect ≈ 3.4:1. */
export function labelTexture(name: string) {
  const { c, ctx, t } = canvasTex(1392, 410);
  ctx.setTransform(0.8, 0, 0, 0.8, 0, 0);
  const CW = 1740;
  const ls = (v: string) => ((ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = v);
  const draw = () => {
    ctx.clearRect(0, 0, CW, 512);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const cx = CW / 2;
    ls('14px');
    ctx.font = `600 30px ${SANS}`;
    ctx.fillText('BAHA  ·  BOTANICA', cx, 92);
    ls('0px');
    ctx.font = `400 168px ${SERIF}`;
    ctx.fillText(name, cx, 270);
    ctx.font = `italic 400 54px ${SERIF}`;
    ctx.fillText('cloud cream', cx, 342);
    ctx.fillRect(cx - 60, 384, 120, 2);
    ls('8px');
    ctx.font = `500 24px ${SANS}`;
    ctx.fillText('WHIPPED HYDRATING BALM', cx, 432);
    ctx.fillText('50 ML  ·  1.7 FL OZ', cx, 470);
    // side columns of fine print (left / right of the wordmark)
    ls('5px');
    ctx.font = `500 19px ${SANS}`;
    ctx.textAlign = 'left';
    ['NO. 01', 'ALOE 92%', 'SQUALANE', 'VIT. E'].forEach((s, i) => ctx.fillText(s, 250, 210 + i * 34));
    ctx.textAlign = 'right';
    ['DERM. TESTED', 'VEGAN', 'FRAGRANCE-FREE', 'MADE IN VN'].forEach((s, i) => ctx.fillText(s, CW - 250, 210 + i * 34));
    t.needsUpdate = true;
  };
  return { texture: t, draw };
}

/** Foil print on the cap top: ring of tiny caps + a Didone "B" monogram. */
export function capFoilTexture() {
  const { c, ctx, t } = canvasTex(768, 768);
  ctx.setTransform(0.75, 0, 0, 0.75, 0, 0);
  const draw = () => {
    ctx.clearRect(0, 0, c.width / 0.75, c.height / 0.75);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    const cx = 512;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cx, 470, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cx, 300, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 300px ${SERIF}`;
    ctx.fillText('B', cx, cx + 14);
    const text = 'BAHA BOTANICA · AT REST · BAHA BOTANICA · AT REST · ';
    ctx.font = `600 44px ${SANS}`;
    const n = text.length;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx + Math.sin(a) * 385, cx - Math.cos(a) * 385);
      ctx.rotate(a);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    t.needsUpdate = true;
  };
  return { texture: t, draw };
}

export function blobTexture(size = 256) {
  const { ctx, t } = canvasTex(size, size);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgb(255,255,255)');
  g.addColorStop(0.3, 'rgb(170,170,170)');
  g.addColorStop(0.62, 'rgb(48,48,48)');
  g.addColorStop(1, 'rgb(0,0,0)');
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
