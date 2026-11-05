/**
 * AXIOM T1 — ONE lofted body. Cross-section rings (half ring P0..P9, mirrored) are keyframed along the car and
 * linearly interpolated, so the silhouette is a single stroke: nose → hood → raked windscreen → roof → rear glass
 * sloping down into the open bed → tailgate. Shading is smooth along the length (flowing reflections) and creased
 * only where the ring has a deliberate character line (sill, shoulder, belt, roof edge, rails). Wheel arches are
 * part of the surface: the lower ring vertices are lifted over each wheel and the flank bulges into a haunch.
 *
 * Exploded mechanic: ring segments 0–5 = lower body, 6–8 = top shell (greenhouse / hood skin / bed rails) — they
 * share the belt ring, so at rest there is no seam.
 */
import * as THREE from 'three';

type P2 = [number, number]; // (z, y) half-ring point, z ≥ 0
interface Key {
  x: number;
  yb: number; // underside
  zs: number; // sill half-width
  yS: number; // shoulder crease height
  zS: number; // flank half-width
  top: [P2, P2, P2, P2]; // P6..P9
}

export const ARCH = { cx: 1.85, cy: 0.5, R: 0.52 };
export const NOSE_X = 2.98;
export const TAIL_X = -2.92;
export const FLOOR_Y = 1.12;

const cab: [P2, P2, P2, P2] = [[0.95, 1.27], [0.72, 1.93], [0.62, 1.98], [0, 1.99]]; // strong tumblehome
const bed: [P2, P2, P2, P2] = [[0.96, 1.37], [0.86, 1.37], [0.86, FLOOR_Y], [0, FLOOR_Y]];
const K = (x: number, yb: number, zs: number, yS: number, zS: number, top: [P2, P2, P2, P2]): Key => ({ x, yb, zs, yS, zS, top });

/** Keyframes, front → back. Duplicated x = crease across the ring; near-duplicates localise the rounding. */
const KEYS: Key[] = [
  // nose wedge: the bonnet runs down ~15° from the cowl into a short raked nose (no upright mask)
  K(NOSE_X, 0.64, 0.8, 0.9, 0.86, [[0.84, 0.95], [0.76, 0.97], [0.45, 0.985], [0, 0.99]]),
  K(2.86, 0.58, 0.9, 0.96, 0.95, [[0.93, 1.02], [0.84, 1.045], [0.45, 1.065], [0, 1.075]]),
  K(2.5, 0.57, 0.91, 1.1, 0.965, [[0.95, 1.115], [0.86, 1.135], [0.45, 1.15], [0, 1.155]]),
  K(1.76, 0.56, 0.92, 1.12, 0.97, [[0.95, 1.22], [0.86, 1.27], [0.45, 1.3], [0, 1.31]]),
  K(1.76, 0.56, 0.92, 1.12, 0.97, [[0.95, 1.22], [0.86, 1.27], [0.45, 1.3], [0, 1.31]]), // cowl crease
  K(0.4, 0.56, 0.92, 1.14, 0.97, cab), // windscreen = one ~26° wedge line from the cowl to the roof
  K(0.32, 0.56, 0.92, 1.14, 0.97, cab),
  K(-0.54, 0.56, 0.92, 1.14, 0.97, cab),
  K(-0.62, 0.56, 0.92, 1.14, 0.97, cab),
  K(-1.28, 0.56, 0.92, 1.14, 0.97, bed),
  K(-1.28, 0.56, 0.92, 1.14, 0.97, bed), // bed-front crease
  K(-2.8, 0.59, 0.91, 1.13, 0.965, bed),
  K(-2.84, 0.6, 0.9, 1.13, 0.96, [[0.95, 1.37], [0.86, 1.37], [0.86, FLOOR_Y], [0, FLOOR_Y]]),
  K(TAIL_X, 0.66, 0.84, 1.1, 0.92, [[0.91, 1.34], [0.86, 1.35], [0.86, FLOOR_Y], [0, FLOOR_Y]]),
];

const L = THREE.MathUtils.lerp;
const archY = (x: number) => {
  let y = -1;
  for (const cx of [ARCH.cx, -ARCH.cx]) {
    const d = x - cx;
    if (Math.abs(d) < ARCH.R) y = Math.max(y, ARCH.cy + Math.sqrt(ARCH.R * ARCH.R - d * d));
  }
  return y;
};
const haunch = (x: number) => {
  let b = 0;
  for (const cx of [ARCH.cx, -ARCH.cx]) b = Math.max(b, 1 - THREE.MathUtils.smoothstep(Math.abs(x - cx), 0.55, 0.95));
  return b * 0.03;
};

/** Half ring (P0..P9) at station x, from keyframes a→b with factor f. */
function ring(a: Key, b: Key, f: number, x: number): P2[] {
  const yb = L(a.yb, b.yb, f), zs = L(a.zs, b.zs, f), yS = L(a.yS, b.yS, f), zS = L(a.zS, b.zS, f) + haunch(x);
  const pts: P2[] = [
    [0, yb],
    [zs - 0.07, yb],
    [zs, yb + 0.06],
    [zS, yS - 0.36],
    [zS + 0.012, yS - 0.04],
    [zS, yS],
  ];
  for (let i = 0; i < 4; i++) pts.push([L(a.top[i][0], b.top[i][0], f), L(a.top[i][1], b.top[i][1], f)]);
  // lift the lower ring over the wheels → the arch opening is part of the same surface
  const ay = archY(x);
  if (ay > 0) for (let i = 0; i <= 3; i++) pts[i] = [pts[i][0], Math.max(pts[i][1], ay + i * 0.01)];
  return pts;
}

/** Station list: keyframes (+ their duplicates) and dense samples through the wheel arches. */
function stations(): { x: number; pts: P2[] }[] {
  const out: { x: number; pts: P2[] }[] = [];
  for (let k = 0; k < KEYS.length - 1; k++) {
    const a = KEYS[k], b = KEYS[k + 1];
    out.push({ x: a.x, pts: ring(a, b, 0, a.x) });
    if (a.x === b.x) continue;
    // extra samples inside this span where an arch crosses it
    for (const cx of [ARCH.cx, -ARCH.cx]) {
      const lo = Math.max(Math.min(a.x, b.x), cx - ARCH.R - 0.45), hi = Math.min(Math.max(a.x, b.x), cx + ARCH.R + 0.45);
      if (lo >= hi) continue;
      const n = Math.ceil((hi - lo) / 0.03);
      const xs: number[] = [];
      for (let i = 0; i <= n; i++) xs.push(L(hi, lo, i / n));
      for (const x of xs) {
        if (Math.abs(x - a.x) < 1e-4 || Math.abs(x - b.x) < 1e-4) continue;
        out.push({ x, pts: ring(a, b, (x - a.x) / (b.x - a.x), x) });
      }
    }
  }
  const last = KEYS[KEYS.length - 1];
  out.push({ x: last.x, pts: ring(KEYS[KEYS.length - 2], last, 1, last.x) });
  // keep front→back order (stable for duplicates)
  return out.map((s, i) => ({ s, i })).sort((p, q) => q.s.x - p.s.x || p.i - q.i).map((p) => p.s);
}

/** Exact surface point: interpolate the ring at any x (used to place glass / trims on the body). */
export function ringAtX(x: number): P2[] {
  for (let k = 0; k < KEYS.length - 1; k++) {
    const a = KEYS[k], b = KEYS[k + 1];
    if (a.x === b.x) continue;
    if (x <= a.x && x >= b.x) return ring(a, b, (x - a.x) / (b.x - a.x), x);
  }
  return ring(KEYS[0], KEYS[1], 0, x);
}

/** Smoothing groups over ring segments (segment s joins P_s → P_{s+1}). Shared group = rounded, else crease. */
const GROUPS = [[0], [1, 2], [3, 4], [5], [6], [7], [8]];

function grid(st: { x: number; pts: P2[] }[], i0: number, i1: number, side: 1 | -1) {
  const cols = i1 - i0 + 1;
  const pos: number[] = [];
  const uv: number[] = [];
  for (const s of st) {
    for (let i = i0; i <= i1; i++) {
      const [z, y] = s.pts[i];
      pos.push(s.x, y, z * side);
      uv.push(s.x, 0);
    }
  }
  const idx: number[] = [];
  for (let r = 0; r < st.length - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // orient outward: compare a mid face normal with the direction away from the body axis
  const P = g.getAttribute('position');
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3();
  let vote = 0;
  for (let t = 0; t < idx.length; t += 6 * Math.max(1, Math.floor(idx.length / 60))) {
    pa.fromBufferAttribute(P, idx[t]);
    pb.fromBufferAttribute(P, idx[t + 1]);
    pc.fromBufferAttribute(P, idx[t + 2]);
    const n = new THREE.Vector3().subVectors(pb, pa).cross(new THREE.Vector3().subVectors(pc, pa));
    const cen = pa.clone().add(pb).add(pc).multiplyScalar(1 / 3);
    const out = new THREE.Vector3(0, cen.y - 1.05, cen.z);
    vote += Math.sign(n.dot(out));
  }
  if (vote < 0) {
    for (let t = 0; t < idx.length; t += 3) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
    g.setIndex(idx);
  }
  g.computeVertexNormals();
  // UVs: u along the car; v = height on flanks, width on up-facing groups (brushing never degenerates)
  const N = g.getAttribute('normal');
  let up = 0;
  for (let i = 0; i < N.count; i++) up += Math.abs(N.getY(i));
  const topish = up / N.count > 0.6;
  const U = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) U.setXY(i, P.getX(i), topish ? P.getZ(i) : P.getY(i));
  return g;
}

/** Flat end cap from a closed 2D polygon in (z, y) at station x, facing ±x. */
function cap(poly: P2[], x: number, dir: 1 | -1) {
  const contour = poly.map(([z, y]) => new THREE.Vector2(z, y));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const pos: number[] = [];
  const uv: number[] = [];
  for (const t of tris) {
    const ids = dir * (THREE.ShapeUtils.isClockWise(contour) ? -1 : 1) > 0 ? t : [t[0], t[2], t[1]];
    for (const i of ids) {
      pos.push(x, poly[i][1], poly[i][0]);
      uv.push(poly[i][0], poly[i][1]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  // make sure the cap faces outward (±x)
  const n = g.getAttribute('normal');
  if (n.getX(0) * dir < 0) {
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i += 3) {
      const tx = p.getX(i + 1), ty = p.getY(i + 1), tz = p.getZ(i + 1);
      p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
      p.setXYZ(i + 2, tx, ty, tz);
    }
    g.computeVertexNormals();
  }
  return g;
}

function toNonIndexed(gs: THREE.BufferGeometry[]) {
  return gs.map((g) => (g.index ? g.toNonIndexed() : g));
}

/** Builds the two body layers. */
export function buildLoft() {
  const st = stations();
  const lower: THREE.BufferGeometry[] = [];
  const upper: THREE.BufferGeometry[] = [];
  for (const grp of GROUPS) {
    const i0 = grp[0], i1 = grp[grp.length - 1] + 1;
    for (const side of [1, -1] as const) (i0 >= 6 ? upper : lower).push(grid(st, i0, i1, side));
  }
  const full = (pts: P2[], a: number, b: number): P2[] => {
    const half = pts.slice(a, b + 1);
    const mir = half.slice().reverse().map(([z, y]) => [-z, y] as P2);
    return [...half, ...mir].filter((p, i, arr) => i === 0 || Math.abs(p[0] - arr[i - 1][0]) + Math.abs(p[1] - arr[i - 1][1]) > 1e-6);
  };
  const nose = st[0].pts, tail = st[st.length - 1].pts;
  // lower caps: P0..P6 then P6'..P1' ; upper caps: P6..P9..P6' (closed back to P6 → fills the tailgate)
  const lp = (p: P2[]) => {
    const h = p.slice(0, 7);
    const m = h.slice(1).map(([z, y]) => [-z, y] as P2).reverse();
    return [...h, ...m];
  };
  lower.push(cap(lp(nose), st[0].x, 1), cap(lp(tail), st[st.length - 1].x, -1));
  upper.push(cap(full(nose, 6, 9), st[0].x, 1), cap(full(tail, 6, 9), st[st.length - 1].x, -1));
  return { lower: mergeNI(toNonIndexed(lower)), upper: mergeNI(toNonIndexed(upper)), lowerParts: lower, upperParts: upper };
}

function mergeNI(parts: THREE.BufferGeometry[]) {
  let n = 0;
  for (const p of parts) n += p.getAttribute('position').count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  for (const p of parts) {
    const P = p.getAttribute('position'), N = p.getAttribute('normal'), U = p.getAttribute('uv');
    for (let i = 0; i < P.count; i++) {
      pos.set([P.getX(i), P.getY(i), P.getZ(i)], (o + i) * 3);
      nor.set([N.getX(i), N.getY(i), N.getZ(i)], (o + i) * 3);
      if (U) uv.set([U.getX(i), U.getY(i)], (o + i) * 2);
    }
    o += P.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/**
 * A patch ON the lofted surface: x from xa→xb, across the ring polyline `chain` (indices into P0..P9, negative =
 * mirrored side, e.g. [7,8,9,-8,-7]) from t0→t1 of its length; pushed out by `off` along the outward normal.
 */
export function surfacePatch(xa: number, xb: number, chain: number[], t0: number, t1: number, off = 0.005, nx = 10, nt = 8) {
  const pos: number[] = [];
  const pick = (pts: P2[], i: number): THREE.Vector2 => {
    const [z, y] = pts[Math.abs(i)];
    return new THREE.Vector2(i < 0 ? -z : z, y);
  };
  const along = (pts: P2[], t: number) => {
    const ps = chain.map((i) => pick(pts, i));
    let total = 0;
    const seg: number[] = [];
    for (let i = 0; i < ps.length - 1; i++) {
      const d = ps[i].distanceTo(ps[i + 1]);
      seg.push(d);
      total += d;
    }
    let target = t * total;
    for (let i = 0; i < seg.length; i++) {
      if (target <= seg[i] || i === seg.length - 1) return ps[i].clone().lerp(ps[i + 1], Math.min(1, target / Math.max(seg[i], 1e-6)));
      target -= seg[i];
    }
    return ps[ps.length - 1];
  };
  const P: THREE.Vector3[][] = [];
  for (let a = 0; a <= nx; a++) {
    const x = L(xa, xb, a / nx);
    const pts = ringAtX(x);
    const row: THREE.Vector3[] = [];
    for (let b = 0; b <= nt; b++) {
      const q = along(pts, L(t0, t1, b / nt));
      row.push(new THREE.Vector3(x, q.y, q.x));
    }
    P.push(row);
  }
  const idx: number[] = [];
  const flat: THREE.Vector3[] = P.flat();
  const cols = nt + 1;
  for (let a = 0; a < nx; a++)
    for (let b = 0; b < nt; b++) {
      const i = a * cols + b;
      idx.push(i, i + cols, i + 1, i + 1, i + cols, i + cols + 1);
    }
  for (const v of flat) pos.push(v.x, v.y, v.z);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // orient outward + push off the surface
  const n0 = new THREE.Vector3().fromBufferAttribute(g.getAttribute('normal'), Math.floor(flat.length / 2));
  const c0 = flat[Math.floor(flat.length / 2)];
  if (n0.dot(new THREE.Vector3(0, c0.y - 1.05, c0.z)) < 0 && Math.abs(c0.z) + Math.abs(c0.y - 1.05) > 0.3) {
    for (let t = 0; t < idx.length; t += 3) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
    g.setIndex(idx);
    g.computeVertexNormals();
  }
  const Pa = g.getAttribute('position'), Na = g.getAttribute('normal');
  for (let i = 0; i < Pa.count; i++) Pa.setXYZ(i, Pa.getX(i) + Na.getX(i) * off, Pa.getY(i) + Na.getY(i) * off, Pa.getZ(i) + Na.getZ(i) * off);
  return g.toNonIndexed();
}

/** Arch polyline (semicircle) for the liner / flare / well-wall bands. */
export function archPolyline(cx: number, n = 16): P2[] {
  const pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - (i / n) * Math.PI;
    pts.push([cx + Math.cos(a) * ARCH.R, ARCH.cy + Math.sin(a) * ARCH.R]);
  }
  return pts;
}
