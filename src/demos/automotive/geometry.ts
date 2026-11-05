/**
 * AXIOM T1 — procedural geometry (original BAHA design: faceted EV utility truck).
 * Units = metres. Truck front points to +X, up = +Y, width along Z (right flank at +Z).
 */
import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { archPolyline } from './loft';

type P2 = [number, number];
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ───────────────────────── dimensions ───────────────────────── */
export const DIM = {
  axleX: 1.85,
  wheelR: 0.46,
  trackZ: 0.86,
  halfW: 0.98,
  /** arch pivot height */
  archY: 0.5, // = ARCH.cy in loft.ts
  /** bed floor (slab top in the bed) and bed wall top */
  bedY: 1.1,
  bedTop: 1.36,
  bedFront: -0.9,
  /** cab hull */
  cabY0: 1.08,
  ringY: 1.94,
  roofY: 1.98,
};

/** Wheel arch polyline — the same semicircle the lofted body is cut with. */
function archPts(cx: number): P2[] {
  return archPolyline(cx);
}
const scaleAbout = (pts: P2[], cx: number, cy: number, s: number): P2[] => pts.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s]);

/** Side silhouette of the lower body slab (front = +x): high hood, open bed floor behind the cab. */
function slabOutline(): P2[] {
  return [
    [-2.74, 0.56],
    ...archPts(-DIM.axleX),
    ...archPts(DIM.axleX),
    [2.66, 0.6],
    [2.84, 0.8],
    [2.88, 1.0],
    [2.78, 1.13],
    [1.24, 1.27],
    [DIM.bedFront, 1.25],
    [DIM.bedFront, DIM.bedY],
    [-2.8, DIM.bedY],
    [-2.84, DIM.bedY - 0.05],
    [-2.84, 0.68],
    [-2.78, 0.58],
  ];
}

/**
 * Panel crown baked into the normals: every panel behaves like a slightly convex sheet (normal tilts away from
 * `c` in proportion to the in-plane offset). The tilt is linear in position, so it interpolates exactly across
 * the big extrude cap triangles → long, continuous reflection gradients instead of one flat colour per panel.
 */
export function crown(g: THREE.BufferGeometry, c: THREE.Vector3, k: [number, number, number]) {
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  const v = new THREE.Vector3(), nn = new THREE.Vector3(), d = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    nn.fromBufferAttribute(n, i);
    d.subVectors(v, c);
    d.addScaledVector(nn, -d.dot(nn)); // in-plane offset only
    nn.x += d.x * k[0];
    nn.y += d.y * k[1];
    nn.z += d.z * k[2];
    nn.normalize();
    n.setXYZ(i, nn.x, nn.y, nn.z);
  }
  n.needsUpdate = true;
  return g;
}
const CROWN: [number, number, number] = [0.045, 0.24, 0.13];
/** Main body edge chamfer: wide enough that the middle strip reads as a continuous highlight at hero distance. */
export const SLAB_BEVEL = 0.045;

/** Faceted bevel = N flat chamfer strips per edge (each strip catches its own highlight line). */
const BEVEL = (s: number, seg = 3) => ({ bevelEnabled: true, bevelThickness: s, bevelSize: s, bevelSegments: seg, curveSegments: 1, steps: 1 });

/** Lower body slab: extruded silhouette, 3-strip machined bevel, crowned panels. */
export function slabGeometry() {
  const shape = new THREE.Shape(slabOutline().map(([x, y]) => new THREE.Vector2(x, y)));
  const depth = DIM.halfW * 2 - 2 * SLAB_BEVEL;
  const g = new THREE.ExtrudeGeometry(shape, { depth, ...BEVEL(SLAB_BEVEL) });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  planarUV(g); // box-projected: horizontal tangent on every face (extrude's own UVs give the rear face a vertical one)
  return crown(g, V(0, 0.92, 0), CROWN);
}
/** Same silhouette without bevel — only used for the exoskeleton line overlay (clean single edges). */
export function slabLinesGeometry() {
  const shape = new THREE.Shape(slabOutline().map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: DIM.halfW * 2, bevelEnabled: false });
  g.translate(0, 0, -DIM.halfW);
  return g;
}

/** Hood power-dome: a low faceted bulge sitting on the hood plane (catches its own highlight band). */
export function hoodDomeGeometry() {
  const hy = (x: number) => 1.13 + ((2.78 - x) / (2.78 - 1.24)) * 0.14 + SLAB_BEVEL;
  const pts: THREE.Vector3[] = [];
  for (const s of [1, -1]) {
    pts.push(V(2.5, hy(2.5) - 0.01, 0.6 * s), V(1.32, hy(1.32) - 0.01, 0.66 * s));
    pts.push(V(2.38, hy(2.38) + 0.035, 0.4 * s), V(1.34, hy(1.34) + 0.05, 0.46 * s));
  }
  const g = new ConvexGeometry(pts);
  planarUV(g);
  return crown(g, V(1.9, 1.2, 0), CROWN);
}

/** Cab: upright, forward-set utility cab. Side profile extruded with a 3-strip bevel, then tapered (tumblehome). */
const CAB = {
  bottom: [1.42, -0.95] as P2,
  bottomZ: 0.95,
  ring: [0.52, -0.84] as P2,
  ringZ: 0.8,
};
const CAB_BEVEL = 0.05;
const cabShape = () =>
  new THREE.Shape([[CAB.bottom[0], DIM.cabY0], [CAB.ring[0], DIM.ringY], [CAB.ring[1], DIM.ringY], [CAB.bottom[1], DIM.cabY0]].map(([x, y]) => new THREE.Vector2(x, y)));
const TAPER = (1 - CAB.ringZ / CAB.bottomZ) / (DIM.ringY - DIM.cabY0);
function taper(g: THREE.BufferGeometry) {
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * (1 - TAPER * (p.getY(i) - DIM.cabY0)));
  p.needsUpdate = true;
}
export function cabGeometry() {
  const depth = CAB.bottomZ * 2 - CAB_BEVEL * 2;
  const g = new THREE.ExtrudeGeometry(cabShape(), { depth, ...BEVEL(CAB_BEVEL) });
  g.translate(0, 0, -depth / 2);
  taper(g);
  g.computeVertexNormals();
  planarUV(g);
  return crown(g, V(0.1, 1.45, 0), CROWN);
}
export function cabLinesGeometry() {
  const g = new THREE.ExtrudeGeometry(cabShape(), { depth: CAB.bottomZ * 2, bevelEnabled: false });
  g.translate(0, 0, -CAB.bottomZ);
  taper(g);
  return g;
}

/**
 * Per-face box-projected UVs (flat-shaded, non-indexed geometry): every facet gets a well-conditioned tangent
 * frame, so the brushed roughness map + anisotropy never degenerate on faces that look along an axis.
 * u always runs along the car (x) where possible → brushing follows the body length.
 */
export function planarUV(g: THREE.BufferGeometry) {
  const geo = g.index ? g.toNonIndexed() : g;
  const p = geo.getAttribute('position');
  const uv = new Float32Array(p.count * 2);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let f = 0; f < p.count; f += 3) {
    a.fromBufferAttribute(p, f);
    b.fromBufferAttribute(p, f + 1);
    c.fromBufferAttribute(p, f + 2);
    n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b));
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    for (let k = 0; k < 3; k++) {
      const i = f + k;
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (ax >= ay && ax >= az) { uv[i * 2] = z; uv[i * 2 + 1] = y; }
      else if (ay >= az) { uv[i * 2] = x; uv[i * 2 + 1] = z; }
      else { uv[i * 2] = x; uv[i * 2 + 1] = y; }
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (geo !== g) g.copy(geo);
}

const L = THREE.MathUtils.lerp;
/** Point on the cab's side plane: x along car, s 0..1 from hull bottom to roof ring. */
const sidePt = (x: number, s: number, side: number) => V(x, L(DIM.cabY0, DIM.ringY, s), side * L(CAB.bottomZ, CAB.ringZ, s));
const xFront = (s: number) => L(CAB.bottom[0], CAB.ring[0], s);
const xBack = (s: number) => L(CAB.bottom[1], CAB.ring[1], s);

/** Flat convex polygon (3D, planar) → triangle fan, oriented to face away from `inside`, pushed out by `off`. */
export function planarPoly(points: THREE.Vector3[], inside: THREE.Vector3, off = 0.004) {
  const n = new THREE.Vector3().subVectors(points[1], points[0]).cross(new THREE.Vector3().subVectors(points[2], points[0])).normalize();
  const c = points.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / points.length);
  let pts = points;
  if (n.dot(new THREE.Vector3().subVectors(c, inside)) < 0) {
    pts = [...points].reverse();
    n.negate();
  }
  const pos: number[] = [];
  for (let i = 1; i < pts.length - 1; i++) {
    for (const q of [pts[0], pts[i], pts[i + 1]]) pos.push(q.x + n.x * off, q.y + n.y * off, q.z + n.z * off);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

const CAB_CENTER = V(0.25, 1.45, 0);

/** All glazing as one geometry (windscreen, 4 side windows, backlight, roof panel). Crowned like the body. */
export function glassGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [1, -1]) {
    const s0 = 0.3, s1 = 0.9;
    parts.push(planarPoly([sidePt(0.14, s0, side), sidePt(xFront(s0) - 0.1, s0, side), sidePt(xFront(s1) - 0.06, s1, side), sidePt(0.14, s1, side)], CAB_CENTER));
    parts.push(planarPoly([sidePt(xBack(s0) + 0.12, s0, side), sidePt(0.01, s0, side), sidePt(0.01, s1, side), sidePt(xBack(s1) + 0.1, s1, side)], CAB_CENTER));
  }
  // windscreen / backlight / roof sit on the bevel-expanded walls → pushed out by the bevel size
  const ws = (s: number, w: number) => V(L(CAB.bottom[0], CAB.ring[0], s), L(DIM.cabY0, DIM.ringY, s), w * (L(CAB.bottomZ, CAB.ringZ, s) - 0.09));
  parts.push(planarPoly([ws(0.27, -1), ws(0.27, 1), ws(0.94, 1), ws(0.94, -1)], CAB_CENTER, CAB_BEVEL + 0.004));
  const bl = (s: number, w: number) => V(L(CAB.bottom[1], CAB.ring[1], s), L(DIM.cabY0, DIM.ringY, s), w * (L(CAB.bottomZ, CAB.ringZ, s) - 0.16));
  parts.push(planarPoly([bl(0.4, -1), bl(0.4, 1), bl(0.9, 1), bl(0.9, -1)], CAB_CENTER, CAB_BEVEL + 0.004));
  const ry = DIM.ringY + CAB_BEVEL + 0.003;
  parts.push(planarPoly([V(0.3, ry, 0.56), V(-0.62, ry, 0.56), V(-0.62, ry, -0.56), V(0.3, ry, -0.56)], V(0, 0, 0), 0));
  return crown(merge(parts), V(0.1, 1.5, 0), [0.03, 0.2, 0.1]);
}

/** Open cargo bed side wall: rectangular section extruded along the car with a rounded 3-strip bevel. */
export function bedWallGeometry(side: number) {
  const bt = 0.012;
  const sec: P2[] = [[0.86, DIM.bedY - 0.02], [0.97, DIM.bedY - 0.02], [0.97, DIM.bedTop - bt], [0.86, DIM.bedTop - bt]];
  const shape = new THREE.Shape(sec.map(([z, y]) => new THREE.Vector2(z * side, y)));
  const len = -0.92 - -2.87;
  const g = new THREE.ExtrudeGeometry(shape, { depth: len - 2 * bt, ...BEVEL(bt) });
  // local x → world z, local y → y, local z (extrusion) → world −x (proper rotation, det +1)
  g.applyMatrix4(new THREE.Matrix4().makeBasis(V(0, 0, 1), V(0, 1, 0), V(-1, 0, 0)));
  g.translate(-0.92 - bt, 0, 0);
  g.computeVertexNormals();
  planarUV(g);
  return crown(g, V(-1.9, 1.2, 0), CROWN);
}
export function tailgateGeometry() {
  const bt = 0.01;
  const shape = new THREE.Shape([[-2.865, 1.04], [-2.79, 1.04], [-2.79, 1.345], [-2.865, 1.345]].map(([x, y]) => new THREE.Vector2(x, y)));
  const depth = 1.72 - 2 * bt;
  const g = new THREE.ExtrudeGeometry(shape, { depth, ...BEVEL(bt) });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  planarUV(g);
  return crown(g, V(-2.9, 1.18, 0), CROWN);
}

/** Camera-pod mirror: bevelled trapezoid pod on a round stalk rooted at the A-pillar base, with a dark lens. */
export function mirrorGeometry(side: number) {
  const s = side;
  const bt = 0.014;
  const prof = new THREE.Shape([[1.1, 1.385], [1.31, 1.385], [1.285, 1.5], [1.13, 1.51]].map(([x, y]) => new THREE.Vector2(x, y)));
  const pod = new THREE.ExtrudeGeometry(prof, { depth: 0.15 - 2 * bt, ...BEVEL(bt, 2) });
  pod.translate(0, 0, s > 0 ? 1.04 + bt : -1.19 + bt);
  pod.computeVertexNormals();
  planarUV(pod);
  const a = V(1.22, 1.29, 0.93 * s), b = V(1.21, 1.41, 1.07 * s);
  const stalk = new THREE.CylinderGeometry(0.017, 0.022, a.distanceTo(b), 12);
  stalk.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()));
  stalk.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  const st = stalk.toNonIndexed();
  planarUV(st);
  return merge([crown(pod, V(1.2, 1.44, 1.115 * s), [0.4, 0.4, 0.4]), st]);
}

/** Band between two scaled copies of an arch polyline, extruded along z. */
function archBand(cx: number, sIn: number, sOut: number, depth: number, bevel = 0) {
  const base = archPts(cx);
  const outer = scaleAbout(base, cx, DIM.archY, sOut);
  const inner = scaleAbout(base, cx, DIM.archY, sIn).reverse();
  const shape = new THREE.Shape([...outer, ...inner].map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, bevel > 0 ? { depth, ...BEVEL(bevel, 2) } : { depth, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}
/** Matte inner wheel-well liner — overlaps the notch walls so no body-coloured slit shows inside the arch. */
export const linerGeometry = (cx: number) => archBand(cx, 0.86, 0.962, 1.88);
/** Slim sculpted fender flare framing the arch (rounded strip edges catch a highlight). */
export const flareGeometry = (cx: number) => archBand(cx, 0.955, 1.065, 0.05, 0.014);

/** Shoulder character strip running along the belt: a thin rounded steel rib = one long crisp highlight. */
export function beltStripGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [1, -1]) {
    const shape = new THREE.Shape([[-2.84, 1.155], [1.9, 1.155], [1.9, 1.185], [-2.84, 1.185]].map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.008, ...BEVEL(0.008, 2) });
    g.translate(0, 0, s > 0 ? DIM.halfW + 0.008 : -DIM.halfW - 0.016);
    g.computeVertexNormals();
    planarUV(g);
    parts.push(g);
  }
  return merge(parts);
}

/* ───────────────────────── wheel ───────────────────────── */
/** Tyre carcass (lathe around +Z axle). */
export function tyreGeometry() {
  const R = DIM.wheelR - 0.012;
  const prof: P2[] = [
    [0.29, -0.13], [0.325, -0.152], [0.37, -0.162], [R - 0.026, -0.158], [R - 0.007, -0.142], [R, -0.115],
    [R, 0.115], [R - 0.007, 0.142], [R - 0.026, 0.158], [0.37, 0.162], [0.325, 0.152], [0.29, 0.13],
  ];
  const g = new THREE.LatheGeometry(prof.map(([r, w]) => new THREE.Vector2(r, w)), 72);
  g.rotateX(Math.PI / 2);
  return g;
}
/** One chunky all-terrain tread block (bevelled). */
export function treadBlockGeometry() {
  const s = new THREE.Shape();
  // footprint in (along-circumference, across-tread) — a skewed chevron lug
  s.moveTo(-0.024, -0.05);
  s.lineTo(0.012, -0.056);
  s.lineTo(0.026, 0.048);
  s.lineTo(-0.012, 0.056);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 1 });
  g.computeVertexNormals();
  return g; // extruded along +Z (radial direction once placed)
}

/** Faceted turbine wheel face: extruded disc with 6 skewed windows. */
export function rimFaceGeometry() {
  const R = 0.282;
  const outer = new THREE.Shape();
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const p = new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R);
    if (i === 0) outer.moveTo(p.x, p.y);
    else outer.lineTo(p.x, p.y);
  }
  for (let k = 0; k < 6; k++) {
    const a0 = (k / 6) * Math.PI * 2;
    const h = new THREE.Path();
    const pt = (r: number, da: number) => new THREE.Vector2(Math.cos(a0 + da) * r, Math.sin(a0 + da) * r);
    const q = [pt(0.1, 0.13), pt(0.25, 0.3), pt(0.256, 0.71), pt(0.105, 0.61)];
    h.moveTo(q[0].x, q[0].y);
    for (let i = 1; i < q.length; i++) h.lineTo(q[i].x, q[i].y);
    h.closePath();
    outer.holes.push(h);
  }
  const bore = new THREE.Path();
  for (let i = 0; i <= 24; i++) {
    const a = -(i / 24) * Math.PI * 2;
    const p = new THREE.Vector2(Math.cos(a) * 0.045, Math.sin(a) * 0.045);
    if (i === 0) bore.moveTo(p.x, p.y);
    else bore.lineTo(p.x, p.y);
  }
  outer.holes.push(bore);
  const g = new THREE.ExtrudeGeometry(outer, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.007, bevelSegments: 2, curveSegments: 1 });
  // concave dish: spokes sink toward the hub (deep-dish read from every angle)
  const pa = g.getAttribute('position');
  for (let i = 0; i < pa.count; i++) {
    const r = Math.hypot(pa.getX(i), pa.getY(i));
    pa.setZ(i, pa.getZ(i) - 0.045 * (1 - Math.min(1, r / R)));
  }
  g.computeVertexNormals();
  return g;
}
/** Rim barrel + outer lip. */
export function rimBarrelGeometry() {
  const prof: P2[] = [
    [0.262, -0.125], [0.292, -0.13], [0.292, -0.115], [0.274, -0.1], [0.274, 0.09], [0.29, 0.105], [0.298, 0.118], [0.29, 0.128], [0.276, 0.122],
  ];
  const g = new THREE.LatheGeometry(prof.map(([r, w]) => new THREE.Vector2(r, w)), 64);
  g.rotateX(Math.PI / 2);
  return g;
}

/* ───────────────────────── helpers ───────────────────────── */
export function merge(parts: THREE.BufferGeometry[]) {
  const nonIdx = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  let count = 0;
  for (const p of nonIdx) count += p.getAttribute('position').count;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  let o = 0;
  for (const p of nonIdx) {
    const pa = p.getAttribute('position');
    if (!p.getAttribute('normal')) p.computeVertexNormals();
    const na = p.getAttribute('normal');
    const ua = p.getAttribute('uv');
    for (let i = 0; i < pa.count; i++) {
      pos.set([pa.getX(i), pa.getY(i), pa.getZ(i)], (o + i) * 3);
      nor.set([na.getX(i), na.getY(i), na.getZ(i)], (o + i) * 3);
      if (ua) uvs.set([ua.getX(i), ua.getY(i)], (o + i) * 2);
    }
    o += pa.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return g;
}

/** Box placed by centre/size, optionally rotated — used for gaps, trims, chassis members. */
export function box(size: [number, number, number], at: [number, number, number], rot?: [number, number, number]) {
  const g = new THREE.BoxGeometry(...size);
  if (rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot)));
  g.translate(...at);
  return g;
}

/* ───────────────────────── procedural textures ───────────────────────── */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Horizontal brushing streaks as a roughness map (values ~0.72..1 → multiplies material roughness). */
export function brushedTexture() {
  const W = 256, H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const r = rng(7);
  ctx.fillStyle = 'rgb(225,225,225)';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    const y = r() * H;
    const v = 105 + Math.floor(r() * 150);
    ctx.fillStyle = `rgba(${v},${v},${v},${0.25 + r() * 0.45})`;
    const x = r() * W;
    const len = 30 + r() * 220;
    ctx.fillRect(x, y, len, 0.6 + r() * 1.2);
    if (x + len > W) ctx.fillRect(x - W, y, len, 1); // wrap
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.35, 2.2);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Fine desert sand: grain + soft wind ripples (tileable). */
export function sandTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(S, S);
  const r = rng(21);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S, T = Math.PI * 2;
      const rip = Math.sin(u * T * 4 + Math.sin(v * T * 2) * 1.4 + Math.sin(v * T * 5) * 0.3) * 0.6 + Math.sin(u * T * 9 + v * T * 3) * 0.4;
      const g = (r() - 0.5) * 18;
      const base = 238 + rip * 5 + g;
      const i = (y * S + x) * 4;
      img.data[i] = base;
      img.data[i + 1] = base * 0.985;
      img.data[i + 2] = base * 0.95;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Soft round sprite for dust. */
export function dotTexture() {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const gr = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Baked soft shadow (alpha only): a blurred rounded block, darker core. Used for the body + per-wheel contact. */
export function shadowTexture(w = 256, h = 128, inset = 0.2, blur = 14) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.filter = `blur(${blur}px)`;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(w * inset, h * inset, w * (1 - 2 * inset), h * (1 - 2 * inset));
  ctx.filter = `blur(${blur * 0.5}px)`;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(w * (inset + 0.06), h * (inset + 0.1), w * (1 - 2 * inset - 0.12), h * (1 - 2 * inset - 0.2));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Tailgate wordmark drawn with the self-hosted Barlow Condensed (alpha map; no font fetch, no logo copy). */
export function wordmarkTexture(text = 'A X I O M') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 64;
  const t = new THREE.CanvasTexture(c);
  const draw = () => {
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 64);
    ctx.fillStyle = '#fff';
    ctx.font = '700 54px "Barlow Condensed", "Arial Narrow", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 34);
    t.needsUpdate = true;
  };
  draw();
  document.fonts?.load('700 54px "Barlow Condensed"').then(draw).catch(() => undefined);
  return t;
}

/** Orange-peel micro-normal for the paint clearcoat (tileable value noise → normal map). */
export function orangePeelTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(S, S);
  const r = rng(5);
  const hgt = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) hgt[i] = r();
  // two box blurs → soft bumps
  for (let pass = 0; pass < 2; pass++) {
    const src = hgt.slice();
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        let sum = 0;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) sum += src[((y + dy + S) % S) * S + ((x + dx + S) % S)];
        hgt[y * S + x] = sum / 25;
      }
  }
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const h = (xx: number, yy: number) => hgt[((yy + S) % S) * S + ((xx + S) % S)];
      const nx = (h(x - 1, y) - h(x + 1, y)) * 6;
      const ny = (h(x, y - 1) - h(x, y + 1)) * 6;
      const i = (y * S + x) * 4;
      img.data[i] = 128 + nx * 127;
      img.data[i + 1] = 128 + ny * 127;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(9, 9);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** Inner wheel-well walls: the arch opening closed on the inboard side so nothing reads see-through. */
export function wellWallGeometry(cx: number) {
  const pts = scaleAbout(archPts(cx), cx, DIM.archY, 0.97);
  const shape = new THREE.Shape([[cx - 0.72, 0.42], ...pts, [cx + 0.72, 0.42]].map(([x, y]) => new THREE.Vector2(x, y)));
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [1, -1]) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false, curveSegments: 1 });
    g.translate(0, 0, s * 0.56 - 0.01);
    g.computeVertexNormals();
    parts.push(g);
  }
  return merge(parts);
}

/** Matte black grain (normal map) for composites — plastics read different from steel and rubber. */
export function grainTexture() {
  const t = orangePeelTexture();
  t.repeat.set(26, 26);
  return t;
}

/** Number plate: light grey field, dark border, mono "AXIOM · T1" (self-hosted IBM Plex Mono). */
export function plateTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 112;
  const t = new THREE.CanvasTexture(c);
  const draw = () => {
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#d6d4cd';
    ctx.fillRect(0, 0, 512, 112);
    ctx.strokeStyle = '#2a2a28';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 100);
    ctx.fillStyle = '#2a2a28';
    ctx.font = '500 58px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AXIOM · T1', 256, 60);
    t.needsUpdate = true;
  };
  draw();
  document.fonts?.load('500 58px "IBM Plex Mono"').then(draw).catch(() => undefined);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
