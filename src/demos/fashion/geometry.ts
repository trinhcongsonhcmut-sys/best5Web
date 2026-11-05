/**
 * CUMULUS 01 — procedural puffer jacket (no external assets).
 *
 * Every panel is a parametric surface P(u,v) = base(u,v) + n_base · displacement, where the displacement carries
 * the down chambers (|sin|^0.6 profile → round puff, sharp stitched pinch), seam creases, drape noise and the zip
 * placket groove. Normals come from central differences on the final grid (wrapping where the surface is closed),
 * so the quilting reads correctly from every side. A vec4 `aSeam` attribute (chamber phase, along-seam coordinate,
 * |x| from the centre-front placket, chamber height) lets the shell shader draw seam shadows + stitch dashes
 * per-pixel, sharp even in the macro shot.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const spow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);
/** smooth 3D value noise in [-1, 1] (deterministic, for wrinkle displacement) */
function vhash(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let fx = x - xi, fy = y - yi, fz = z - zi;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  fz = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => vhash(xi + dx, yi + dy, zi + dz);
  const v = l(
    l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
    l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
  return v * 2 - 1;
}

/** round chamber, sharp pinch at the stitch line */
const puffShape = (t: number) => Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.46);

type SeamOut = [number, number, number, number];
type SurfaceFn = (u: number, v: number, out: THREE.Vector3, seam: SeamOut) => void;

interface GridSpec {
  nu: number;
  nv: number;
  wrapU: boolean;
  wrapV: boolean;
  fn: SurfaceFn;
  uvScale: [number, number];
  /** flip winding / normal so the face points outward */
  flip?: boolean;
}

function buildGrid({ nu, nv, wrapU, wrapV, fn, uvScale, flip = false }: GridSpec): THREE.BufferGeometry {
  const cols = nu + 1;
  const rows = nv + 1;
  const n = cols * rows;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  const seam = new Float32Array(n * 4);
  const p = new THREE.Vector3();
  const s: SeamOut = [0, 0, 9, 1];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const k = j * cols + i;
      s[0] = 0; s[1] = 0; s[2] = 9; s[3] = 1;
      fn(i / nu, j / nv, p, s);
      pos[k * 3] = p.x;
      pos[k * 3 + 1] = p.y;
      pos[k * 3 + 2] = p.z;
      uv[k * 2] = (i / nu) * uvScale[0];
      uv[k * 2 + 1] = (j / nv) * uvScale[1];
      seam[k * 4] = s[0];
      seam[k * 4 + 1] = s[1];
      seam[k * 4 + 2] = s[2];
      seam[k * 4 + 3] = s[3];
    }
  }
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const d = new THREE.Vector3();
  const get = (i: number, j: number, out: THREE.Vector3) => out.fromArray(pos, (j * cols + i) * 3);
  for (let j = 0; j <= nv; j++) {
    const jp = j > 0 ? j - 1 : wrapV ? nv - 1 : 0;
    const jn = j < nv ? j + 1 : wrapV ? 1 : nv;
    for (let i = 0; i <= nu; i++) {
      const ip = i > 0 ? i - 1 : wrapU ? nu - 1 : 0;
      const inn = i < nu ? i + 1 : wrapU ? 1 : nu;
      get(inn, j, a).sub(get(ip, j, b));
      get(i, jn, c).sub(get(i, jp, d));
      a.cross(c);
      if (flip) a.negate();
      const l = a.length();
      if (l > 1e-12) a.multiplyScalar(1 / l);
      else a.set(0, 1, 0);
      a.toArray(nor, (j * cols + i) * 3);
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const i0 = j * cols + i;
      const i1 = i0 + 1;
      const i2 = i0 + cols + 1;
      const i3 = i0 + cols;
      if (flip) idx.push(i0, i3, i1, i1, i3, i2);
      else idx.push(i0, i1, i3, i1, i2, i3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aSeam', new THREE.BufferAttribute(seam, 4));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/* ───────────────────────── torso ───────────────────────── */

const VS = 0.74; // v where the straight body ends and the shoulder dome starts
const HEM_Y = -0.6;
const SH_Y = 0.36;

interface Prof {
  y: number;
  a: number;
  b: number;
  n: number;
  s: number;
}
const prof: Prof = { y: 0, a: 0, b: 0, n: 2, s: 0 };
function torsoProfile(v: number, o: Prof) {
  if (v <= VS) {
    const k = v / VS;
    o.y = HEM_Y + k * (SH_Y - HEM_Y);
    o.a = 0.47 + 0.08 * sstep(0, 0.6, k) - 0.015 * sstep(0.7, 1, k);
    o.b = 0.28 + 0.055 * sstep(0, 0.65, k);
    o.n = 2.6;
    o.s = 0;
  } else {
    const s = Math.min(1, (v - VS) / (1 - VS));
    const phi = (s * Math.PI) / 2;
    const w = Math.pow(Math.max(0, Math.cos(phi)), 0.9);
    const h = Math.pow(Math.sin(phi), 0.9);
    o.y = SH_Y + 0.21 * h;
    o.a = 0.19 + (0.535 - 0.19) * w;
    o.b = 0.155 + (0.335 - 0.155) * w;
    o.n = 2.6 - 0.6 * s;
    o.s = s;
  }
  return o;
}

/** polar superellipse: uniform in angle, so the centre-front placket gets as many vertices as the sides */
const sec = { x: 0, z: 0 };
function section(ang: number, a: number, b: number, n: number) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const r = 1 / Math.pow(Math.pow(Math.abs(c / a), n) + Math.pow(Math.abs(s / b), n), 1 / n);
  sec.x = r * c;
  sec.z = r * s;
  return sec;
}

/** base (un-quilted) torso point; x0/z0 are the cross-section coords before the asymmetry nudges */
function torsoBase(u: number, v: number, out: THREE.Vector3) {
  const pr = torsoProfile(Math.min(1, Math.max(0, v)), prof);
  const ang = u * TAU;
  section(ang, pr.a, pr.b, pr.n);
  let x = sec.x;
  let z = sec.z;
  if (z < 0) z *= 1.04; // fuller back
  // tiny asymmetry: the shell hangs a touch to one side, front slightly lower at the hem
  x += 0.006 * Math.sin(v * 5 + 1.0);
  const y = pr.y - (z > 0 ? 0.012 * (1 - sstep(0, 0.25, v)) : 0);
  z += 0.01 * Math.sin(v * 3.1);
  return out.set(x, y, z);
}

/** arc-length table along v → chamber phase (seams horizontal, evenly spaced along the surface) */
const ARC = (() => {
  const N = 1024;
  const L = new Float32Array(N + 1);
  const Y = new Float32Array(N + 1);
  const o: Prof = { y: 0, a: 0, b: 0, n: 2, s: 0 };
  let prevR = 0;
  let prevY = 0;
  for (let i = 0; i <= N; i++) {
    torsoProfile(i / N, o);
    const r = (o.a + o.b) / 2;
    if (i > 0) L[i] = L[i - 1] + Math.hypot(r - prevR, o.y - prevY);
    Y[i] = o.y;
    prevR = r;
    prevY = o.y;
  }
  const at = (arr: Float32Array, v: number) => {
    const f = Math.min(N, Math.max(0, v * N));
    const i = Math.min(N - 1, Math.floor(f));
    return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  };
  const vHemTop = ((-0.565 - HEM_Y) / (SH_Y - HEM_Y)) * VS;
  const L0 = at(L, vHemTop);
  const total = L[N] - L0;
  const count = Math.round(total / 0.165);
  const H = total / count;
  /** v for a given world y (monotonic) */
  const vForY = (y: number) => {
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (Y[m] < y) lo = m;
      else hi = m;
    }
    const f = (y - Y[lo]) / Math.max(1e-6, Y[hi] - Y[lo]);
    return (lo + Math.min(1, Math.max(0, f))) / N;
  };
  return { phase: (v: number) => (at(L, v) - L0) / H, H, count, vForY };
})();

export const TORSO_CHAMBER = ARC.H;

const _b = new THREE.Vector3();
const _b1 = new THREE.Vector3();
const _b2 = new THREE.Vector3();
const _b3 = new THREE.Vector3();
const _b4 = new THREE.Vector3();
const _nb = new THREE.Vector3();

function baseNormal(u: number, v: number, out: THREE.Vector3) {
  const e = 1e-3;
  torsoBase(u + e, v, _b1);
  torsoBase(u - e, v, _b2);
  torsoBase(u, v + e, _b3);
  torsoBase(u, v - e, _b4);
  _b1.sub(_b2);
  _b3.sub(_b4);
  // u runs counter-clockwise (seen from above), v upward → cross(dv, du) points outward
  return out.crossVectors(_b3, _b1).normalize();
}

/** full quilted torso surface point */
export const torsoPoint: SurfaceFn = (u, v, out, seam) => {
  torsoBase(u, v, _b);
  baseNormal(u, v, _nb);
  const pr = torsoProfile(Math.min(1, Math.max(0, v)), prof);
  const ang = u * TAU;
  section(ang, pr.a, pr.b, pr.n);
  const x0 = sec.x;
  const z0 = sec.z;
  // stitch lines are sewn by hand, not lasered: a slow waviness along each seam
  const ph0 = ARC.phase(v);
  const ph = ph0 + 0.045 * Math.sin(ang * 2.3 + v * 11 + 0.7) * sstep(0, 0.6, ph0);
  let d = 0;
  if (ph > 0) {
    const k = Math.floor(ph);
    const t = ph - k;
    const front = z0 > 0;
    const zipF = front ? sstep(0.024, 0.085, Math.abs(x0)) : 1;
    const sideF = 0.64 + 0.36 * sstep(0.0, 0.15, Math.abs(z0));
    const domeF = 1 - 0.58 * pr.s;
    // bigger, flatter chambers of varying height; amplitude also varies chamber to chamber
    const amp = 0.034 * (1 + 0.16 * Math.sin(k * 2.39 + ang * 1.7)) * zipF * sideF * domeF;
    // chambers sag a little below their middle (down settles)
    const sag = t + 0.07 * Math.sin(Math.PI * t);
    d += amp * flatPuff(Math.min(1, sag), 3.2);
    // fabric gathers into pull lines at each stitch line (fading toward the crest)
    const near = Math.pow(1 - Math.sin(Math.PI * t), 1.6);
    d += 0.003 * near * zipF * (1 - 0.8 * pr.s) * Math.sin(ang * 38 + k * 1.9 + 2.2 * Math.sin(ang * 6 + k));
    // armpit drag lines (upper sides) and hem gathering (first chamber above the binding)
    const armpit = sstep(0.05, 0.3, pr.y) * (1 - sstep(0.36, 0.45, pr.y)) * (1 - sstep(0.06, 0.2, Math.abs(z0)));
    d += 0.0035 * armpit * Math.sin(ang * 30 + v * 45);
    if (k === 0) d += 0.004 * (1 - t) * Math.sin(ang * 26 + 1.3 * Math.sin(ang * 5));
    // random fabric wrinkles in the GEOMETRY (not just the normal map), concentrated near the stitch lines,
    // so the silhouette and the highlights break up like real ciré nylon instead of a smooth inflated skin
    const seamDist = Math.min(t, 1 - t) * 2;
    const wmask = 1 - sstep(0, 0.45, seamDist);
    d += 0.004 * wmask * zipF * vnoise(_b.x * 18, _b.y * 40, _b.z * 18);
    d += 0.0007 * vnoise(_b.x * 31 + 7, _b.y * 55, _b.z * 31);
  } else {
    d -= 0.006 * (1 - sstep(-0.35, 0, ph)); // tucked into the hem binding
  }
  if (z0 > 0) d -= 0.0065 * (1 - sstep(0.0, 0.032, Math.abs(x0))); // placket channel under the zip
  // low-frequency drape (not mirror-symmetric)
  d += 0.004 * Math.sin(ang * 3 + v * 9 + 0.6) * Math.sin(v * 17 + ang * 2) + 0.0012 * Math.sin(ang * 9 - v * 23);
  out.copy(_b).addScaledVector(_nb, d);
  seam[0] = ph;
  seam[1] = ang * ((pr.a + pr.b) / 2);
  seam[2] = z0 > 0 ? Math.abs(x0) : 9;
  seam[3] = ARC.H;
};

/* ───────────────────────── sleeves ───────────────────────── */

export function sleeveCurve(side: 1 | -1) {
  const pts: [number, number, number][] = [
    // upper arm hangs slightly back, elbow bends ~15° and the forearm drops forward (~8°)
    // clear elbow: upper arm hangs slightly behind the side seam, forearm swings forward ~30° from it
    [0.3, 0.36, 0.0],
    [0.47, 0.34, -0.02],
    [0.6, 0.1, -0.05],
    [0.665, -0.12, -0.04],
    [0.7, -0.33, 0.07],
    [0.715, -0.5, 0.2],
  ];
  return new THREE.CatmullRomCurve3(
    pts.map(([x, y, z]) => new THREE.Vector3(x * side, y, z)),
    false,
    'centripetal',
  );
}

interface Frame {
  p: THREE.Vector3;
  t: THREE.Vector3;
  n1: THREE.Vector3;
  n2: THREE.Vector3;
}
function frameAt(curve: THREE.CatmullRomCurve3, s: number, o: Frame) {
  const ss = Math.min(1, Math.max(0, s));
  curve.getPointAt(ss, o.p);
  curve.getTangentAt(ss, o.t);
  if (s > 1) o.p.addScaledVector(o.t, (s - 1) * curve.getLength());
  if (s < 0) o.p.addScaledVector(o.t, s * curve.getLength());
  o.n1.set(o.t.y, -o.t.x, 0).normalize(); // ⟂ tangent, in the arm's swing plane
  o.n2.crossVectors(o.t, o.n1).normalize();
  return o;
}

const S_EXIT = 0.15;
const S_GATHER = 0.955;
function sleeveRadius(s: number) {
  // visible taper: full at the shoulder, ~30% narrower at the wrist
  // slimmer set-in shoulder (no "Michelin" ball), tapering to a gathered wrist
  let r = 0.1 + 0.055 * sstep(0, 0.17, s);
  r -= 0.02 * sstep(0.2, 0.62, s);
  r -= 0.015 * sstep(0.62, 0.95, s);
  r -= 0.024 * sstep(0.95, 1.0, s);
  return r;
}
/** seam-to-seam profile: steep pinch at the stitch line, broad flat crest (down settles, it isn't inflated) */
const flatPuff = (t: number, e: number) => 1 - Math.pow(1 - Math.max(0, Math.sin(Math.PI * t)), e);

function makeSleeveFn(curve: THREE.CatmullRomCurve3, side: 1 | -1): SurfaceFn {
  const len = curve.getLength();
  const span = (S_GATHER - S_EXIT) * len;
  const count = Math.max(4, Math.round(span / 0.15));
  const H = span / count;
  const f: Frame = { p: new THREE.Vector3(), t: new THREE.Vector3(), n1: new THREE.Vector3(), n2: new THREE.Vector3() };
  const dir = new THREE.Vector3();
  return (u, v, out, seam) => {
    const th = u * TAU;
    frameAt(curve, v, f);
    dir.copy(f.n1).multiplyScalar(Math.cos(th)).addScaledVector(f.n2, Math.sin(th));
    let r = sleeveRadius(v);
    // seams lean toward horizontal (they continue the body's chambers) instead of ringing the arm
    // like a stack of tyres; fade the lean out toward the cuff so the last seam closes cleanly
    const lean = (dir.y * r * 0.9 * (1 - sstep(0.75, S_GATHER, v))) / H;
    // uneven chamber lengths: shorter, bunched chambers around the elbow, longer ones on upper arm/forearm
    const xs = (v - S_EXIT) / (S_GATHER - S_EXIT);
    const warp = xs > 0 && xs < 1 ? -0.38 * Math.sin(xs * TAU) : 0;
    const ph = ((v - S_EXIT) * len) / H + lean + warp;
    // inner elbow = the side facing forward-in at the bend; chambers are squashed there
    const elbow = Math.exp(-Math.pow((v - 0.55) / 0.12, 2));
    const innerElbow = Math.max(0, dir.z * 0.8 - dir.x * side * 0.6);
    const inner = Math.max(0, -dir.x * side);
    if (ph > 0 && v < S_GATHER + 0.01) {
      const k = Math.floor(ph);
      const t = ph - k;
      // chambers taper toward the wrist (~15%) and flatten at the inner elbow
      const taper = 1 - 0.18 * sstep(0.2, 0.95, v);
      const squash = 1 - 0.45 * elbow * innerElbow;
      // shallow, flat-crested chambers: sleeves fold, they don't stack like tyres; the cap of the sleeve
      // (shoulder) puffs only ~60% of the arm so it doesn't read as a ball
      const capK = 0.6 + 0.4 * sstep(0.2, 0.45, v);
      r += 0.0145 * taper * squash * capK * (1 + 0.15 * Math.sin(k * 1.7 + th * 1.3)) * flatPuff(t, 2.8);
      // pull lines radiating from each stitch line
      r += 0.0035 * Math.pow(1 - Math.sin(Math.PI * t), 1.6) * Math.sin(th * 23 + k * 2.1 + 1.5 * Math.sin(th * 4 + k));
      // random wrinkles in the geometry near the seams
      const wmask = 1 - sstep(0, 0.45, Math.min(t, 1 - t) * 2);
      r += 0.0033 * wmask * vnoise(f.p.x * 18 + dir.x * 3, f.p.y * 40, f.p.z * 18 + dir.z * 3);
    }
    // elbow: deep folds on the inside of the bend + a few diagonal pull lines on the outside
    r += 0.009 * (inner * inner + innerElbow) * elbow * Math.sin(v * 120 + th * 2.5);
    r += 0.004 * (1 - innerElbow) * elbow * Math.sin(v * 70 - th * 6);
    r += 0.0035 * Math.sin(th * 3 + v * 13 + side) * sstep(0.2, 0.4, v);
    out.copy(f.p).addScaledVector(dir, r);
    seam[0] = Math.min(ph, count + 0.5);
    seam[1] = th * 0.16;
    seam[2] = 9;
    seam[3] = H;
  };
}

/* ───────────────────────── collar ───────────────────────── */

const COLLAR_Y = 0.625;
const COLLAR_H = 0.155; // half height
const collarFn: SurfaceFn = (u, w, out, seam) => {
  const ang = u * TAU;
  const al = w * TAU;
  const ca = Math.cos(al);
  const pr = 0.03 * spow(ca, 0.5);
  const py = COLLAR_H * spow(Math.sin(al), 0.5);
  const hN = (py + COLLAR_H) / (2 * COLLAR_H);
  const ac = 0.205 + 0.022 * hN;
  const bc = 0.172 + 0.02 * hN;
  const cx = ac * Math.cos(ang);
  const cz = bc * Math.sin(ang) - 0.004;
  const nx = Math.cos(ang) / ac;
  const nz = Math.sin(ang) / bc;
  const nl = Math.hypot(nx, nz);
  let d = pr;
  const outer = sstep(0.15, 0.7, ca);
  const t = (hN * 2) % 1;
  d += 0.017 * outer * puffShape(t) * (Math.sin(ang) > 0 ? sstep(0.02, 0.07, Math.abs(cx)) : 1);
  if (Math.sin(ang) > 0) d -= 0.004 * outer * (1 - sstep(0, 0.026, Math.abs(cx)));
  d += 0.002 * Math.sin(ang * 7 + hN * 4);
  out.set(cx + (nx / nl) * d, COLLAR_Y + py, cz + (nz / nl) * d);
  seam[0] = hN * 2;
  seam[1] = ang * 0.19;
  seam[2] = Math.sin(ang) > 0 ? Math.abs(cx) : 9;
  seam[3] = COLLAR_H;
};

/* ───────────────────────── rib bands (hem + cuffs) ───────────────────────── */

const V_HEM = ((-0.615 - HEM_Y) / (SH_Y - HEM_Y)) * VS; // slightly below the torso start (clamped to 0)
const hemFn: SurfaceFn = (u, w, out) => {
  const ang = u * TAU;
  const al = w * TAU;
  const ca = Math.cos(al);
  const thick = 0.02;
  const pr = (thick / 2) * spow(ca, 0.45);
  const py = 0.033 * spow(Math.sin(al), 0.45);
  torsoBase(u, Math.max(0, V_HEM), _b);
  baseNormal(u, 0.001, _nb);
  _nb.y = 0;
  _nb.normalize();
  const rib = 0.0026 * (0.5 + 0.5 * Math.cos(ang * 150)) * sstep(0.25, 0.7, ca);
  const d = thick / 2 - 0.006 + pr + rib + 0.0025 * Math.sin(ang * 19);
  out.set(_b.x + _nb.x * d, -0.618 + py, _b.z + _nb.z * d);
};

function makeCuffFn(curve: THREE.CatmullRomCurve3): SurfaceFn {
  const f: Frame = { p: new THREE.Vector3(), t: new THREE.Vector3(), n1: new THREE.Vector3(), n2: new THREE.Vector3() };
  const len = curve.getLength();
  return (u, w, out) => {
    const th = u * TAU;
    const al = w * TAU;
    const ca = Math.cos(al);
    const pr = 0.006 * spow(ca, 0.45);
    const py = 0.034 * spow(Math.sin(al), 0.45);
    frameAt(curve, 1 - 0.035 / len + (0.04 + py) / len, f);
    const rib = 0.0024 * (0.5 + 0.5 * Math.cos(th * 44)) * sstep(0.25, 0.7, ca);
    const r = 0.074 + pr + rib;
    out.copy(f.p).addScaledVector(f.n1, Math.cos(th) * r).addScaledVector(f.n2, Math.sin(th) * r);
  };
}

/* ───────────────────────── zipper path ───────────────────────── */

function collarFrontZ(y: number) {
  const py = y - COLLAR_Y;
  if (Math.abs(py) > COLLAR_H * 0.995) return -Infinity;
  const hN = (py + COLLAR_H) / (2 * COLLAR_H);
  return 0.172 + 0.02 * hN - 0.004 + 0.03 - 0.004 + 0.001;
}

export function zipperPath() {
  const pts: THREE.Vector3[] = [];
  const p = new THREE.Vector3();
  const s: SeamOut = [0, 0, 9, 1];
  for (let y = -0.655; y <= 0.772; y += 0.012) {
    let z = -Infinity;
    if (y <= -0.578) {
      torsoBase(0.25, 0, _b);
      z = Math.max(z, _b.z + 0.02 - 0.006 + 0.004);
    }
    if (y >= HEM_Y + 0.004 && y <= 0.575) {
      torsoPoint(0.25, ARC.vForY(y), p, s);
      z = Math.max(z, p.z);
    }
    z = Math.max(z, collarFrontZ(y));
    if (Number.isFinite(z)) pts.push(new THREE.Vector3(0, y, z + 0.0035));
  }
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}

/* ───────────────────────── decals that hug the surface ───────────────────────── */

// own scratch vectors: the surface functions use _b.._b4 internally
const _s1 = new THREE.Vector3();
const _s2 = new THREE.Vector3();
const _s3 = new THREE.Vector3();
const _s4 = new THREE.Vector3();
function surfaceNormal(fn: SurfaceFn, u: number, v: number, out: THREE.Vector3, flip = false) {
  const e = 1e-3;
  const s: SeamOut = [0, 0, 9, 1];
  fn(u + e, v, _s1, s);
  fn(u - e, v, _s2, s);
  fn(u, v + e, _s3, s);
  fn(u, v - e, _s4, s);
  _s1.sub(_s2);
  _s3.sub(_s4);
  out.crossVectors(_s1, _s3).normalize();
  if (flip) out.negate();
  return out;
}

function decal(fn: SurfaceFn, uc: number, vc: number, du: number, dv: number, lift: number, flipN: boolean, nu = 16, nv = 8, mirrorU = false) {
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const s: SeamOut = [0, 0, 9, 1];
  return buildGrid({
    nu,
    nv,
    wrapU: false,
    wrapV: false,
    uvScale: [1, 1],
    flip: flipN !== mirrorU,
    fn: (a, b, out) => {
      const uu = uc + (mirrorU ? 1 - a - 0.5 : a - 0.5) * 2 * du;
      const vv = vc + (b - 0.5) * 2 * dv;
      fn(uu, vv, p, s);
      surfaceNormal(fn, uu, vv, n, flipN);
      out.copy(p).addScaledVector(n, lift);
    },
  });
}

/** v whose chamber phase is the centre of the chamber nearest to world height y */
function chamberCentreV(y: number) {
  const v = ARC.vForY(y);
  const k = Math.floor(ARC.phase(v));
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (ARC.phase(m) < k + 0.5) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/* ───────────────────────── assembly ───────────────────────── */

export interface JacketGeometry {
  shell: THREE.BufferGeometry; // torso + sleeves + collar (quilted nylon)
  rib: THREE.BufferGeometry; // hem binding + cuffs
  lining: THREE.BufferGeometry;
  wristHoles: { pos: THREE.Vector3; dir: THREE.Vector3 }[];
  zip: THREE.CatmullRomCurve3;
  pockets: THREE.BufferGeometry[];
  pocketTops: { p: THREE.Vector3; n: THREE.Vector3; t: THREE.Vector3 }[];
  bartacks: { p: THREE.Vector3; n: THREE.Vector3; t: THREE.Vector3 }[];
  chestPatch: THREE.BufferGeometry;
  backPrint: THREE.BufferGeometry;
  sleeveTab: THREE.BufferGeometry;
  snaps: { p: THREE.Vector3; n: THREE.Vector3 }[];
  armholes: THREE.BufferGeometry[];
  neckCap: THREE.BufferGeometry;
}

export interface Detail {
  torso: [number, number];
  sleeve: [number, number];
  collar: [number, number];
  rib: [number, number];
  cuff: [number, number];
}
export const HI: Detail = { torso: [168, 210], sleeve: [52, 150], collar: [128, 44], rib: [600, 14], cuff: [176, 12] };
export const LO: Detail = { torso: [56, 60], sleeve: [18, 40], collar: [40, 12], rib: [72, 6], cuff: [24, 6] };

function stripSeam(g: THREE.BufferGeometry) {
  // rib/aux geometries carry a neutral seam attribute so they can merge with the shell when needed
  const n = g.getAttribute('position').count;
  if (!g.getAttribute('aSeam')) g.setAttribute('aSeam', new THREE.BufferAttribute(new Float32Array(n * 4).fill(0.5), 4));
  return g;
}

export function buildJacket(detail: Detail = HI): JacketGeometry {
  const torso = buildGrid({ nu: detail.torso[0], nv: detail.torso[1], wrapU: true, wrapV: false, fn: torsoPoint, uvScale: [36, 15], flip: true });
  const rc = sleeveCurve(1);
  const lc = sleeveCurve(-1);
  const sleeveFnL = makeSleeveFn(lc, -1);
  const sleeveR = buildGrid({ nu: detail.sleeve[0], nv: detail.sleeve[1], wrapU: true, wrapV: false, fn: makeSleeveFn(rc, 1), uvScale: [11, 12] });
  const sleeveL = buildGrid({ nu: detail.sleeve[0], nv: detail.sleeve[1], wrapU: true, wrapV: false, fn: sleeveFnL, uvScale: [11, 12] });
  const collar = buildGrid({ nu: detail.collar[0], nv: detail.collar[1], wrapU: true, wrapV: true, fn: collarFn, uvScale: [14, 3.4], flip: true });
  const shell = mergeGeometries([torso, sleeveR, sleeveL, collar])!;
  [torso, sleeveR, sleeveL, collar].forEach((g) => g.dispose());

  const hem = buildGrid({ nu: detail.rib[0], nv: detail.rib[1], wrapU: true, wrapV: true, fn: hemFn, uvScale: [1, 1], flip: true });
  const cuffR = buildGrid({ nu: detail.cuff[0], nv: detail.cuff[1], wrapU: true, wrapV: true, fn: makeCuffFn(rc), uvScale: [1, 1] });
  const cuffL = buildGrid({ nu: detail.cuff[0], nv: detail.cuff[1], wrapU: true, wrapV: true, fn: makeCuffFn(lc), uvScale: [1, 1] });
  const rib = mergeGeometries([hem, cuffR, cuffL].map(stripSeam))!;
  [hem, cuffR, cuffL].forEach((g) => g.dispose());

  const lining = buildGrid({
    nu: 64,
    nv: 30,
    wrapU: true,
    wrapV: false,
    uvScale: [1, 1],
    flip: true,
    fn: (u, v, out) => {
      torsoBase(u, v * 0.985, out);
      out.x *= 0.95;
      out.z *= 0.95;
      if (v === 0) out.y -= 0.03;
    },
  });

  const f: Frame = { p: new THREE.Vector3(), t: new THREE.Vector3(), n1: new THREE.Vector3(), n2: new THREE.Vector3() };
  const wristHoles = [rc, lc].map((c) => {
    frameAt(c, 1 + 0.03 / c.getLength(), f);
    return { pos: f.p.clone(), dir: f.t.clone() };
  });

  // hand pockets: slanted zip welts that ride over the chambers (flat ribbons hugging the surface)
  const pockets = [1, -1].map((side) => {
    const pts: THREE.Vector3[] = [];
    const nrm: THREE.Vector3[] = [];
    const s: SeamOut = [0, 0, 9, 1];
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const k = i / N;
      const ang = Math.PI / 2 - side * (0.5 + 0.3 * k);
      const v = 0.07 + 0.25 * k;
      const p = new THREE.Vector3();
      const n = new THREE.Vector3();
      torsoPoint(ang / TAU, v, p, s);
      surfaceNormal(torsoPoint, ang / TAU, v, n, true);
      pts.push(p);
      nrm.push(n);
    }
    return ribbonGeometry(pts, nrm, 0.0065, 0.0016);
  });
  const pocketTops = pockets.map((g) => g.userData.top as { p: THREE.Vector3; n: THREE.Vector3; t: THREE.Vector3 });
  // bartacks: short dense reinforcement bars across both ends of each pocket welt
  const bartacks = pockets.flatMap((g) => [g.userData.top, g.userData.bottom] as { p: THREE.Vector3; n: THREE.Vector3; t: THREE.Vector3 }[]);

  const vChest = chamberCentreV(0.17);
  const chestPatch = decal(torsoPoint, (Math.PI / 2 - 0.44) / TAU, vChest, 0.018, 0.0175, 0.004, true, 20, 10, true);
  const vBack = chamberCentreV(0.26);
  const backPrint = decal(torsoPoint, (Math.PI * 1.5) / TAU, vBack, 0.074, 0.019, 0.003, true, 40, 10, true);
  // outer-front side of the left sleeve, upper arm
  const sleeveTab = decal(sleeveFnL, 0.9, 0.36, 0.04, 0.02, 0.0025, false, 10, 6);

  // set-in armhole seams: piping along the first sleeve seam (where sleeve meets shoulder)
  const sleeveFnR = makeSleeveFn(rc, 1);
  const armholes = [sleeveFnR, sleeveFnL].map((fn) => {
    const pts: THREE.Vector3[] = [];
    const sp: SeamOut = [0, 0, 9, 1];
    const p = new THREE.Vector3();
    const n = new THREE.Vector3();
    const N = 72;
    for (let i = 0; i < N; i++) {
      const u = i / N;
      let lo = 0.02;
      let hi = 0.45;
      for (let it = 0; it < 30; it++) {
        const m = (lo + hi) / 2;
        fn(u, m, p, sp);
        if (sp[0] < 0) lo = m;
        else hi = m;
      }
      const v = (lo + hi) / 2;
      fn(u, v, p, sp);
      surfaceNormal(fn, u, v, n);
      pts.push(p.clone().addScaledVector(n, 0.0012));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), 144, 0.0034, 6, true);
  });

  // dark-proof the inside: a cap deep in the body so looking down the collar never shows a void
  const capY = 0.3;
  const capV = ARC.vForY(capY);
  const cp = torsoProfile(capV, { y: 0, a: 0, b: 0, n: 2, s: 0 });
  const neckCap = new THREE.CircleGeometry(1, 48);
  neckCap.rotateX(-Math.PI / 2);
  neckCap.scale(cp.a * 0.93, 1, cp.b * 0.93);
  neckCap.translate(0, capY, 0);

  // chin-guard snaps either side of the zip, high on the collar
  const snaps = [-1, 1].map((sx) => {
    const py = 0.07;
    const al = Math.asin(Math.pow(py / COLLAR_H, 2));
    const u = (Math.PI / 2 + sx * 0.24) / TAU;
    const w = al / TAU;
    const p = new THREE.Vector3();
    const n = new THREE.Vector3();
    collarFn(u, w, p, [0, 0, 9, 1]);
    surfaceNormal(collarFn, u, w, n, true);
    return { p, n };
  });

  return { shell, rib, lining, wristHoles, zip: zipperPath(), pockets, pocketTops, bartacks, chestPatch, backPrint, sleeveTab, snaps, armholes, neckCap };
}

/** flat strip along surface points (side = tangent × normal), lifted along the normal */
function ribbonGeometry(pts: THREE.Vector3[], nrm: THREE.Vector3[], halfWidth: number, lift: number) {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const t = new THREE.Vector3();
  const side = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    t.subVectors(b, a).normalize();
    side.crossVectors(t, nrm[i]).normalize();
    for (const sx of [-1, 1]) {
      // edges tuck slightly into the fabric, centre rides on top → reads as a welted zip
      const q = pts[i].clone().addScaledVector(side, sx * halfWidth).addScaledVector(nrm[i], lift * 0.35);
      pos.push(q.x, q.y, q.z);
      nor.push(nrm[i].x, nrm[i].y, nrm[i].z);
      uv.push(sx < 0 ? 0 : 1, i / (pts.length - 1));
    }
    if (i < pts.length - 1) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const last = pts.length - 1;
  g.userData.top = { p: pts[last].clone().addScaledVector(nrm[last], lift), n: nrm[last].clone(), t: pts[last].clone().sub(pts[last - 1]).normalize() };
  g.userData.bottom = { p: pts[0].clone().addScaledVector(nrm[0], lift), n: nrm[0].clone(), t: pts[1].clone().sub(pts[0]).normalize() };
  return g;
}

/** low-poly silhouette for pointer picking + the rail ghosts (one merged mesh) */
export const MIDRES: Detail = { torso: [104, 110], sleeve: [30, 80], collar: [72, 20], rib: [220, 8], cuff: [64, 6] };

export function buildLowJacket(detail: Detail = LO) {
  const j = buildJacket(detail);
  const g = mergeGeometries([j.shell, j.rib])!;
  j.shell.dispose();
  j.rib.dispose();
  j.lining.dispose();
  j.chestPatch.dispose();
  j.backPrint.dispose();
  j.sleeveTab.dispose();
  j.armholes.forEach((a) => a.dispose());
  j.neckCap.dispose();
  j.pockets.forEach((p) => p.dispose());
  return g;
}

/* ───────────────────────── zipper hardware ───────────────────────── */

/** two zipper tapes as one ribbon strip following the path */
export function zipTape(curve: THREE.CatmullRomCurve3, halfWidth = 0.0105, segments = 220) {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  const side = new THREE.Vector3(1, 0, 0);
  const n = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const k = i / segments;
    curve.getPointAt(k, p);
    curve.getTangentAt(k, t);
    n.crossVectors(side, t).normalize();
    for (const sx of [-1, 1]) {
      pos.push(p.x + sx * halfWidth, p.y - n.y * 0.0015, p.z - n.z * 0.0015);
      nor.push(n.x, n.y, n.z);
    }
    if (i < segments) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/** instance matrices for the zipper teeth (alternating left/right) up to `untilY` */
export function zipTeeth(curve: THREE.CatmullRomCurve3, pitch = 0.0044) {
  const len = curve.getLength();
  const count = Math.floor(len / pitch);
  const mats: THREE.Matrix4[] = [];
  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  const n = new THREE.Vector3();
  const x = new THREE.Vector3(1, 0, 0);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const k = (i + 0.5) / count;
    curve.getPointAt(k, p);
    curve.getTangentAt(k, t);
    n.crossVectors(x, t).normalize();
    const off = i % 2 === 0 ? 0.0021 : -0.0021;
    m.makeBasis(x, t, n);
    m.setPosition(p.x + off, p.y, p.z);
    mats.push(m.clone());
  }
  return mats;
}

/** flat rounded zipper pull with a slot, extruded + bevelled */
export function pullGeometry(w = 0.019, h = 0.056) {
  const s = new THREE.Shape();
  const r = w / 2;
  s.moveTo(-r, 0);
  s.lineTo(-r, -h + r);
  s.absarc(0, -h + r, r, Math.PI, 0, false);
  s.lineTo(r, 0);
  s.absarc(0, 0, r, 0, Math.PI, false);
  const hole = new THREE.Path();
  const hw = w * 0.22;
  hole.moveTo(-hw, -0.004);
  hole.lineTo(-hw, -h * 0.42);
  hole.absarc(0, -h * 0.42, hw, Math.PI, 0, false);
  hole.lineTo(hw, -0.004);
  hole.absarc(0, -0.004, hw, 0, Math.PI, false);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.0022, bevelEnabled: true, bevelThickness: 0.0011, bevelSize: 0.001, bevelSegments: 2, curveSegments: 12 });
  g.translate(0, 0, -0.0011);
  return g;
}

export function sliderGeometry() {
  const s = new THREE.Shape();
  const w = 0.012;
  s.moveTo(-w, 0.016);
  s.quadraticCurveTo(-w, 0.02, -w * 0.6, 0.02);
  s.lineTo(w * 0.6, 0.02);
  s.quadraticCurveTo(w, 0.02, w, 0.016);
  s.lineTo(w * 0.7, -0.016);
  s.quadraticCurveTo(0, -0.022, -w * 0.7, -0.016);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0016, bevelSegments: 3, curveSegments: 10 });
  return g;
}
