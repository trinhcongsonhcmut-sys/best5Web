/**
 * Procedural geometry for BAHA BOTANICA — all built in code (lathe profiles, swept blades, extrusions).
 * Units ≈ decimetres: jar Ø 1.12, sits on y = 0, cap top at y ≈ 0.9.
 */
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type P2 = [number, number];
const v2 = (pts: P2[]) => pts.map(([r, y]) => new THREE.Vector2(r, y));

function smoothNormals(g: THREE.BufferGeometry) {
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const m = mergeVertices(g, 1e-5);
  m.computeVertexNormals();
  return m;
}

/* ───────── jar body: thick-walled solid glass with a cream cavity (profile traversed CCW → outward normals) ───────── */
export const JAR = { r: 0.562, neckR: 0.5, neckY0: 0.61, neckY1: 0.7, cavityR: 0.43, floorY: 0.18, creamY: 0.6, capY: 0.6 };

export function jarBodyGeometry() {
  const pts: P2[] = [
    [0.0, 0.03], [0.25, 0.024], [0.42, 0.012], [0.49, 0.004], [0.524, 0.007], [0.546, 0.022], [0.558, 0.046], [0.562, 0.075],
    // lower embossed ring
    [0.562, 0.094], [0.5685, 0.101], [0.5685, 0.117], [0.562, 0.124],
    [0.562, 0.488],
    // upper embossed ring
    [0.5685, 0.495], [0.5685, 0.511], [0.562, 0.518],
    [0.56, 0.542], [0.552, 0.564], [0.537, 0.582], [0.516, 0.595], [0.503, 0.604], [0.5, 0.616],
    [0.5, 0.699], [0.497, 0.71], [0.489, 0.717], [0.476, 0.72], [0.459, 0.718], [0.449, 0.711], [0.446, 0.7],
    [0.44, 0.69], [0.432, 0.672], [0.43, 0.64], [0.43, 0.25], [0.426, 0.222], [0.414, 0.2], [0.395, 0.186], [0.36, 0.18], [0.0, 0.176],
  ];
  return new THREE.LatheGeometry(v2(pts), 112);
}

/** Two-start-free single helix thread on the neck (seen when the cap is off). */
export function threadGeometry() {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const a = t * Math.PI * 2 * 1.65;
    pts.push(new THREE.Vector3(Math.sin(a) * 0.503, 0.624 + t * 0.062, Math.cos(a) * 0.503));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 180, 0.0068, 7, false);
}

/** Label wrap: open cylinder segment just proud of the body, centred on +Z (front). */
export function labelGeometry() {
  return new THREE.CylinderGeometry(0.5705, 0.5705, 0.33, 72, 1, true, -0.98, 1.96);
}

/* ───────── cream: puck + whipped spiral top ───────── */
export function creamBodyGeometry() {
  const pts: P2[] = [[0, 0.181], [0.36, 0.184], [0.394, 0.19], [0.412, 0.204], [0.423, 0.224]];
  for (let i = 0; i <= 24; i++) pts.push([0.427, 0.25 + (0.354 * i) / 24]);
  const g = new THREE.LatheGeometry(v2(pts), 128);
  // soft whipped ripples on the side wall (only visible when the core lifts out at the craft mark)
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    if (v.y < 0.24) continue;
    const th = Math.atan2(v.x, v.z);
    const k = 1 + (0.008 * Math.sin(th * 4 + v.y * 46) + 0.002 * Math.sin(th * 9 + v.y * 20)) * Math.min(1, (v.y - 0.24) * 12);
    p.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  return smoothNormals(g);
}

export function creamTopGeometry() {
  const R = 0.427;
  const rings = 40;
  const segs = 144;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const r = R * t;
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * Math.PI * 2;
      const mound = 0.085 * Math.pow(1 - t * t, 1.35);
      const spiral = 0.026 * Math.sin(th - t * 21) * Math.sin(Math.PI * Math.min(1, t * 1.08));
      const peak = 0.045 * Math.exp(-(t * t) / 0.006);
      const curl = 0.012 * Math.exp(-(t * t) / 0.02) * Math.sin(th * 2);
      pos.push(Math.sin(th) * r, 0.604 + mound + spiral + peak + curl, Math.cos(th) * r);
    }
  }
  const row = segs + 1;
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < segs; j++) {
      const a = i * row + j;
      const b = a + row;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return smoothNormals(g);
}

/* ───────── cap: soft-touch shell with 72 vertical grip ribs (local y 0 → 0.304) ───────── */
export function capGeometry() {
  const pts: P2[] = [
    [0, 0.262], [0.4, 0.262], [0.49, 0.258], [0.508, 0.248], [0.512, 0.23], [0.512, 0.012], [0.518, 0.0],
    [0.566, 0.0], [0.574, 0.004], [0.578, 0.012], [0.58, 0.03],
    [0.58, 0.262], [0.578, 0.28], [0.57, 0.293], [0.556, 0.3], [0.52, 0.3025], [0.0, 0.304],
  ];
  const g = new THREE.LatheGeometry(v2(pts), 432);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const r = Math.hypot(v.x, v.z);
    if (r < 0.575 || v.y < 0.025 || v.y > 0.27) continue;
    const th = Math.atan2(v.x, v.z);
    const rib = Math.pow(0.5 + 0.5 * Math.cos(th * 72), 0.7);
    const k = (r + 0.0062 * rib) / r;
    p.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  return smoothNormals(g);
}

/* ───────── aloe blade: tapered, V-section, serrated, curved spine ───────── */
export interface BladeOpts {
  len: number;
  width: number;
  bend: number;
  twist: number;
  seed: number;
}

export function bladeGeometry({ len, width, bend, twist, seed }: BladeOpts) {
  const N = 30;
  // cross-section loop (u across the width, top = concave face, bottom = convex belly)
  const us = [1, 0.6, 0.2, -0.2, -0.6, -1, -0.6, -0.2, 0.2, 0.6];
  const top = [true, true, true, true, true, true, false, false, false, false];
  const K = us.length;
  const pos: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3(0, 0, 0);
  const T = new THREE.Vector3();
  const W = new THREE.Vector3();
  const Nn = new THREE.Vector3();
  const X = new THREE.Vector3(1, 0, 0);
  const step = len / N;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const a = bend * Math.pow(s, 1.25);
    T.set(0, Math.cos(a), Math.sin(a));
    const tw = twist * s;
    // Rodrigues (T ⟂ X): W = X cosθ + (T×X) sinθ
    W.copy(X).multiplyScalar(Math.cos(tw)).add(new THREE.Vector3().crossVectors(T, X).multiplyScalar(Math.sin(tw)));
    Nn.crossVectors(W, T).normalize();
    const w = width * Math.pow(1 - s, 0.85) * (1 + 0.18 * Math.pow(1 - s, 5));
    const valley = 0.3 * w;
    const belly = 0.42 * w * (1 - 0.4 * s) + 0.004;
    for (let k = 0; k < K; k++) {
      const u = us[k];
      const edge = Math.abs(u) === 1;
      const tooth = edge ? 1 + 0.09 * Math.pow(Math.max(0, Math.sin(s * len * 34 + seed * 3.1)), 8) * (1 - s) : 1;
      const q = 1 - u * u;
      const off = top[k] ? -valley * q : -valley * q - belly * Math.sqrt(Math.max(0, q));
      pos.push(P.x + W.x * u * w * tooth + Nn.x * off, P.y + W.y * u * w * tooth + Nn.y * off, P.z + W.z * u * w * tooth + Nn.z * off);
      // luminance multipliers (material.color carries the variant leaf tint)
      const base = Math.pow(1 - Math.min(1, s / 0.16), 2);
      const rim = Math.pow(Math.abs(u), 6) * 0.55;
      const tip = Math.max(0, (s - 0.86) / 0.14) * 0.25;
      const belly2 = top[k] ? 0 : 0.12;
      col.push(1 + base * 1.1 + rim - tip - belly2, 1 + base * 0.8 + rim - tip * 0.8 - belly2, 1 + base * 0.3 + rim * 0.7 - tip * 1.3 - belly2);
      uv.push((u + 1) / 2, s);
    }
    P.addScaledVector(T, step);
  }
  for (let i = 0; i < N; i++)
    for (let k = 0; k < K; k++) {
      const a = i * K + k;
      const b = i * K + ((k + 1) % K);
      const c = a + K;
      const d = b + K;
      idx.push(a, b, c, b, d, c);
    }
  // base cap
  const center = pos.length / 3;
  pos.push(0, -0.002, -0.3 * width * 0.6);
  col.push(1.6, 1.5, 1.2);
  uv.push(0.5, 0);
  for (let k = 0; k < K; k++) idx.push(center, (k + 1) % K, k);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ───────── ingredients ───────── */
export function dropGeometry(r = 0.07) {
  const pts: THREE.Vector2[] = [];
  const n = 28;
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI;
    let y = -Math.cos(a) * r;
    const t = k / n;
    const rr = Math.sin(a) * r * (1 - Math.pow(t, 2.2) * 0.62);
    if (y > 0) y *= 1.75;
    pts.push(new THREE.Vector2(Math.max(rr, 0), y));
  }
  return new THREE.LatheGeometry(pts, 40);
}

/** Aloe leaf cross-section slice: crescent skin (V-section) + translucent gel core sitting proud of it. */
export function aloeSliceGeometries() {
  const mk = (sc: number, inset = 0) => {
    const sh = new THREE.Shape();
    const w = 0.17 * sc;
    sh.moveTo(-w, 0.03 * sc - inset);
    sh.bezierCurveTo(-w * 0.75, -0.1 * sc, w * 0.75, -0.1 * sc, w, 0.03 * sc - inset);
    sh.bezierCurveTo(w * 0.45, 0.0 * sc, -w * 0.45, 0.0 * sc, -w, 0.03 * sc - inset);
    return sh;
  };
  const skin = new THREE.ExtrudeGeometry(mk(1), { depth: 0.045, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 3, curveSegments: 32 });
  skin.translate(0, 0.02, -0.0225);
  const gel = new THREE.ExtrudeGeometry(mk(0.84, 0.004), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.004, bevelSegments: 4, curveSegments: 32 });
  gel.translate(0, 0.024, -0.025);
  return { skin, gel };
}

export function nutGeometry() {
  const g = new THREE.SphereGeometry(0.075, 40, 28);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 90) * Math.sin(v.y * 70 + 1.3) * Math.sin(v.z * 80 + 0.4);
    v.multiplyScalar(1 + n * 0.035);
    v.x *= 1.18;
    v.y *= 0.92;
    v.z *= 0.95;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  return smoothNormals(g);
}

/** Green-tea leaf: grid surface with serrated outline, sunken midrib, lateral veins and a gentle curl + stem. */
export function teaLeafGeometry() {
  const NU = 14;
  const NV = 36;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= NV; j++) {
    const v = j / NV;
    const w = 0.085 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.02)), 0.75) * (1 + 0.04 * Math.sin(v * 70));
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * 2 - 1;
      const x = u * w;
      const y = v * 0.3 - 0.15;
      const vein = 0.0035 * Math.pow(Math.abs(Math.sin((v * 9 - Math.abs(u) * 1.4) * Math.PI)), 6);
      const z = 0.05 * u * u * w * 10 - 0.006 * (1 - Math.min(1, Math.abs(u) * 6)) - vein + 0.06 * (v - 0.5) * (v - 0.5);
      pos.push(x, y, z);
    }
  }
  const row = NU + 1;
  for (let j = 0; j < NV; j++)
    for (let i = 0; i < NU; i++) {
      const a = j * row + i;
      idx.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const stem = new THREE.CylinderGeometry(0.004, 0.006, 0.05, 6);
  stem.translate(0, -0.17, 0.012);
  return { leaf: g, stem };
}

/** Back panel (fine print) — open cylinder segment centred on −Z. */
export function backLabelGeometry() {
  return new THREE.CylinderGeometry(0.5705, 0.5705, 0.3, 48, 1, true, Math.PI - 0.72, 1.44);
}

/** Two-tier plinth: soft base + slightly inset top slab. */
export function plinthTopGeometry(R = 1.02) {
  const pts: P2[] = [[0, 0], [R - 0.015, 0], [R, 0.012], [R, 0.05], [R - 0.012, 0.062], [0, 0.062]];
  return new THREE.LatheGeometry(v2(pts), 128);
}

/* ───────── dropper serum bottle (local y 0 → ~0.98) ───────── */
export function serumGlassGeometry() {
  const pts: P2[] = [
    [0, 0.0], [0.17, 0.0], [0.2, 0.012], [0.212, 0.04], [0.212, 0.5], [0.205, 0.54], [0.18, 0.575], [0.13, 0.6], [0.085, 0.612], [0.08, 0.63], [0.08, 0.66],
  ];
  return new THREE.LatheGeometry(v2(pts), 64);
}
export function serumLiquidGeometry() {
  const pts: P2[] = [[0, 0.03], [0.19, 0.03], [0.196, 0.05], [0.196, 0.38], [0.0, 0.38]];
  return new THREE.LatheGeometry(v2(pts), 48);
}
export function serumCollarGeometry() {
  const pts: P2[] = [[0.0, 0.64], [0.092, 0.64], [0.098, 0.648], [0.098, 0.72], [0.09, 0.73], [0.0, 0.73]];
  return new THREE.LatheGeometry(v2(pts), 48);
}
export function serumBulbGeometry() {
  const pts: P2[] = [[0.0, 0.73], [0.06, 0.73], [0.064, 0.76], [0.058, 0.8], [0.068, 0.86], [0.066, 0.92], [0.05, 0.965], [0.025, 0.985], [0.0, 0.99]];
  return new THREE.LatheGeometry(v2(pts), 40);
}

/* ───────── plinth (top at y = 0) ───────── */
export function plinthGeometry(R = 1.12, H = 0.34) {
  const pts: P2[] = [[0, -H], [R - 0.02, -H], [R, -H + 0.02], [R, -0.03], [R - 0.008, -0.01], [R - 0.03, 0], [0, 0]];
  return new THREE.LatheGeometry(v2(pts), 128);
}
