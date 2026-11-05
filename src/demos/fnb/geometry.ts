/**
 * Procedural geometry + canvas textures for the fnb demo (no external assets, no network).
 * Every builder returns plain three.js objects; FnbScene owns and disposes them.
 */
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Lathe without the visible seam: drop UVs (glaze has no map) and weld the duplicated seam vertices. */
function weldedLathe(pts: THREE.Vector2[], segments: number) {
  const raw = new THREE.LatheGeometry(pts, segments);
  raw.deleteAttribute('uv');
  raw.deleteAttribute('normal');
  const g = mergeVertices(raw, 1e-5);
  raw.dispose();
  g.computeVertexNormals();
  return g;
}

const V2 = (x: number, y: number) => new THREE.Vector2(x, y);

/** Smooth a coarse profile with a Catmull-Rom spline so lathes have soft, believable curvature. */
function smoothProfile(pts: [number, number][], samples: number) {
  const curve = new THREE.SplineCurve(pts.map(([x, y]) => V2(x, y)));
  return curve.getSpacedPoints(samples).map((p) => V2(Math.max(0, p.x), p.y));
}

/* ───────────────────────── Cafe ───────────────────────── */

/** Cappuccino cup: foot ring → tulip bowl → rolled lip → inner wall → inner floor. Closed solid (no open faces). */
export function makeCupGeometry() {
  const outer: [number, number][] = [
    [0.0, 0.0],
    [0.17, 0.0],
    [0.2, 0.012],
    [0.195, 0.03],
    [0.21, 0.05],
    [0.29, 0.12],
    [0.36, 0.24],
    [0.405, 0.38],
    [0.425, 0.5],
    [0.432, 0.585],
  ];
  const lip: [number, number][] = [
    [0.432, 0.585],
    [0.438, 0.6],
    [0.43, 0.612],
    [0.416, 0.606],
    [0.41, 0.59],
  ];
  const inner: [number, number][] = [
    [0.41, 0.59],
    [0.402, 0.5],
    [0.382, 0.38],
    [0.338, 0.25],
    [0.26, 0.135],
    [0.14, 0.085],
    [0.0, 0.075],
  ];
  const pts = [...smoothProfile(outer, 36), ...smoothProfile(lip, 10).slice(1), ...smoothProfile(inner, 30).slice(1)];
  return weldedLathe(pts, 96);
}

/** Ear handle: a swept tube with a thicker top (thumb rest) and ends buried in the cup wall. */
export function makeHandleGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.39, 0.5, 0),
    new THREE.Vector3(0.53, 0.53, 0),
    new THREE.Vector3(0.63, 0.45, 0),
    new THREE.Vector3(0.62, 0.31, 0),
    new THREE.Vector3(0.52, 0.21, 0),
    new THREE.Vector3(0.36, 0.17, 0),
  ]);
  const g = new THREE.TubeGeometry(curve, 48, 0.034, 14, false);
  // flatten the tube sideways (real handles are oval, not round)
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * 0.72);
  g.computeVertexNormals();
  return g;
}

export function makeSaucerGeometry() {
  const prof: [number, number][] = [
    [0.0, 0.0],
    [0.2, 0.0],
    [0.215, 0.012],
    [0.225, 0.022],
    [0.42, 0.04],
    [0.58, 0.075],
    [0.635, 0.098],
    [0.645, 0.112],
    [0.632, 0.118],
    [0.57, 0.1],
    [0.42, 0.066],
    [0.26, 0.05],
    [0.235, 0.056],
    [0.215, 0.052],
    [0.0, 0.048],
  ];
  return weldedLathe(smoothProfile(prof, 120), 96);
}

/**
 * Roasted coffee bean: squashed ellipsoid, flatter belly, S-curved centre crease carved by a gaussian groove.
 * Long axis = Y. ~800 tris (instanced ~180×).
 */
export function makeBeanGeometry() {
  const g = new THREE.SphereGeometry(1, 30, 16);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const x = v.x * 0.7;
    const y = v.y;
    let z = v.z * 0.55;
    if (z > 0) {
      z *= 0.6;
      const s = 0.07 * Math.sin(y * 2.8);
      const d = (x - s) / 0.1;
      const groove = Math.exp(-d * d) * 0.2 * (1 - Math.pow(Math.abs(y), 3));
      z -= groove;
    } else {
      z *= 1.05;
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** Latte art (tulip rosetta) painted on a canvas: crema gradient, micro-foam ring, stacked hearts + pull line. */
export function makeLatteTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  const cx = S / 2;
  const g = x.createRadialGradient(cx, cx, 10, cx, cx, S / 2);
  g.addColorStop(0, '#b97a45');
  g.addColorStop(0.55, '#9a5b2e');
  g.addColorStop(0.86, '#6d3a1a');
  g.addColorStop(1, '#e9dcc7');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  // foam rim
  x.strokeStyle = 'rgba(244,234,216,.9)';
  x.lineWidth = 26;
  x.beginPath();
  x.arc(cx, cx, S / 2 - 12, 0, Math.PI * 2);
  x.stroke();
  // speckled crema
  for (let i = 0; i < 1600; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (S / 2 - 20);
    x.fillStyle = Math.random() < 0.5 ? 'rgba(60,28,10,.18)' : 'rgba(230,180,120,.16)';
    x.beginPath();
    x.arc(cx + Math.cos(a) * r, cx + Math.sin(a) * r, Math.random() * 2.2, 0, Math.PI * 2);
    x.fill();
  }
  const heart = (y: number, w: number, h: number) => {
    x.beginPath();
    x.moveTo(cx, y + h * 0.95);
    x.bezierCurveTo(cx - w * 1.15, y + h * 0.35, cx - w * 0.85, y - h * 0.45, cx, y - h * 0.05);
    x.bezierCurveTo(cx + w * 0.85, y - h * 0.45, cx + w * 1.15, y + h * 0.35, cx, y + h * 0.95);
    x.closePath();
    x.fill();
  };
  x.fillStyle = '#f6ecdc';
  x.shadowColor = 'rgba(80,40,15,.45)';
  x.shadowBlur = 6;
  // layered heart (tulip-style): alternating foam / crema rings, then a pull-through line
  const layers: [number, number, number, string][] = [
    [cx - 70, 178, 170, '#f6ecdc'],
    [cx - 40, 140, 132, '#a8683a'],
    [cx - 28, 118, 110, '#f6ecdc'],
    [cx - 2, 84, 80, '#a8683a'],
    [cx + 8, 66, 62, '#f6ecdc'],
  ];
  for (const [y, w, h, col] of layers) {
    x.fillStyle = col;
    x.shadowBlur = col === '#f6ecdc' ? 8 : 0;
    heart(y, w, h);
  }
  // small tulip cap above the heart
  x.fillStyle = '#f6ecdc';
  x.shadowBlur = 8;
  x.beginPath();
  x.ellipse(cx, cx - 150, 58, 30, 0, 0, Math.PI * 2);
  x.fill();
  x.shadowBlur = 0;
  x.strokeStyle = 'rgba(160,98,52,.9)';
  x.lineWidth = 6;
  x.beginPath();
  x.moveTo(cx, cx - 190);
  x.quadraticCurveTo(cx + 5, cx, cx, cx + 175);
  x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ───────────────────────── Restaurant ───────────────────────── */

/** Wide-rim pasta plate: foot ring, deep well, flared rim with rolled lip. */
export function makePlateGeometry() {
  const prof: [number, number][] = [
    [0.0, 0.0],
    [0.5, 0.0],
    [0.52, 0.014],
    [0.515, 0.03],
    [0.6, 0.045],
    [0.78, 0.085],
    [0.95, 0.13],
    [1.04, 0.158],
    [1.062, 0.172],
    [1.052, 0.186],
    [1.02, 0.182],
    [0.9, 0.158],
    [0.74, 0.122],
    [0.64, 0.085],
    [0.58, 0.058],
    [0.45, 0.046],
    [0.0, 0.042],
  ];
  return weldedLathe(smoothProfile(prof, 220), 128);
}

/** Flat forged fork (outline extruded with bevels), gently curved like a real fork. Tines point to -Y. */
export function makeForkGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.03, -0.18);
  s.bezierCurveTo(-0.05, -0.3, -0.112, -0.34, -0.11, -0.46);
  const tw = 0.035;
  const gap = (0.22 - 4 * tw) / 3;
  for (let k = 0; k < 4; k++) {
    const l = -0.11 + k * (tw + gap);
    const r = l + tw;
    s.lineTo(l, -0.8);
    s.quadraticCurveTo((l + r) / 2, -0.835, r, -0.8);
    if (k < 3) {
      s.lineTo(r, -0.52);
      s.quadraticCurveTo(r + gap / 2, -0.505, r + gap, -0.52);
    } else {
      s.lineTo(r, -0.46);
    }
  }
  s.bezierCurveTo(0.112, -0.34, 0.05, -0.3, 0.03, -0.18);
  s.bezierCurveTo(0.036, 0.1, 0.058, 0.4, 0.064, 0.6);
  s.absarc(0, 0.6, 0.064, 0, Math.PI, false);
  s.bezierCurveTo(-0.058, 0.4, -0.036, 0.1, -0.03, -0.18);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.006, bevelSegments: 3, curveSegments: 10 });
  g.translate(0, 0, -0.009);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    let dz = 0;
    if (y < -0.2) dz += 0.07 * Math.pow((-0.2 - y) / 0.6, 2);
    if (y > 0) dz -= 0.05 * Math.pow(y / 0.66, 2);
    p.setZ(i, p.getZ(i) + dz);
  }
  g.computeVertexNormals();
  return g;
}

function paint(g: THREE.BufferGeometry, col: THREE.Color | ((x: number, y: number, z: number) => THREE.Color)) {
  const p = g.attributes.position;
  const arr = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const c = typeof col === 'function' ? col(p.getX(i), p.getY(i), p.getZ(i)) : col;
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

/**
 * Grilled prawn: one continuous swept body along a C-curve (elliptic cross-section, tapering), with shell-segment
 * grooves, pale belly / charred back colouring, plus carapace head, tail fan and a few legs. Vertex coloured.
 */
export function makeShrimpGeometry() {
  const NU = 64;
  const NV = 16;
  const shell = new THREE.Color('#f07a52');
  const belly = new THREE.Color('#fbd6c4');
  const charC = new THREE.Color('#a8401c');
  const band = new THREE.Color('#fbd7bf');
  const arc = (t: number, out: THREE.Vector3) => {
    const a = THREE.MathUtils.lerp(-0.3, Math.PI * 1.2, t);
    const r = 0.12 - 0.035 * t;
    return out.set(Math.cos(a) * r, Math.sin(a) * r, 0);
  };
  const pos: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const c0 = new THREE.Vector3();
  const c1 = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3(0, 0, 1);
  const c = new THREE.Color();
  for (let i = 0; i <= NU; i++) {
    const t = i / NU;
    arc(t, c0);
    arc(Math.min(1, t + 0.01), c1);
    T.copy(c1).sub(arc(Math.max(0, t - 0.01), new THREE.Vector3())).normalize();
    N.crossVectors(B, T).normalize(); // in-plane, points to the outside of the C (the back)
    const segF = (t * 6.5) % 1; // position inside one shell segment -> segments overlap like shingles
    const groove = (1 - 0.16 * Math.pow(Math.abs(Math.sin(t * Math.PI * 6.5)), 10)) * (0.9 + 0.14 * segF);
    const ends = Math.sin(Math.min(1, t * 9) * Math.PI * 0.5) * (t > 0.92 ? Math.max(0.35, 1 - (t - 0.92) * 8) : 1);
    const r = THREE.MathUtils.lerp(0.058, 0.02, Math.pow(t, 1.1)) * groove * Math.max(0.2, ends);
    const isBand = Math.pow(Math.abs(Math.sin(t * Math.PI * 6.5)), 10);
    for (let j = 0; j <= NV; j++) {
      const a = (j / NV) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const x = c0.x + (N.x * ca * 1.08 + B.x * sa * 0.9) * r;
      const y = c0.y + (N.y * ca * 1.08 + B.y * sa * 0.9) * r;
      const z = c0.z + (N.z * ca * 1.08 + B.z * sa * 0.9) * r;
      pos.push(x, y, z);
      // ca>0 → back (shell, charred), ca<0 → belly (pale)
      c.copy(belly).lerp(shell, THREE.MathUtils.smoothstep(ca, -0.6, 0.3));
      c.lerp(charC, Math.max(0, ca - 0.55) * 0.9 * (0.6 + 0.4 * Math.sin(t * 23)));
      c.lerp(band, isBand * 0.5 * Math.max(0, ca));
      col.push(c.r, c.g, c.b);
      uv.push(t, j / NV);
    }
  }
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j;
      const b2 = a + NV + 1;
      idx.push(a, b2, a + 1, a + 1, b2, b2 + 1);
    }
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  body.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  body.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  body.setIndex(idx);
  body.computeVertexNormals();
  const parts: THREE.BufferGeometry[] = [body.toNonIndexed()];
  // carapace head
  const head = new THREE.SphereGeometry(1, 20, 14);
  head.scale(0.075, 0.056, 0.052);
  const hp = arc(0, new THREE.Vector3());
  head.rotateZ(-1.35);
  head.translate(hp.x + 0.012, hp.y - 0.03, 0);
  paint(head, (x, y) => new THREE.Color('#e5592c').lerp(new THREE.Color('#f39a6a'), THREE.MathUtils.clamp((hp.x + 0.03 - x) * 12, 0, 1)));
  parts.push(head.toNonIndexed());
  // tail fan: three lobes
  const tp = arc(1, new THREE.Vector3());
  const tp2 = arc(0.97, new THREE.Vector3());
  const tdir = Math.atan2(tp.y - tp2.y, tp.x - tp2.x);
  for (const k of [-2, -1, 0, 1, 2]) {
    const lobe = new THREE.SphereGeometry(1, 14, 8);
    lobe.scale(k === 0 ? 0.062 : 0.055, 0.006, 0.02);
    lobe.translate(0.045, 0, 0);
    lobe.rotateY(k * 0.36);
    lobe.rotateZ(tdir);
    lobe.translate(tp.x, tp.y, 0);
    paint(lobe, (x) => new THREE.Color('#d8502a').lerp(new THREE.Color('#8f2a12'), THREE.MathUtils.clamp(Math.abs(x - tp.x) * 14, 0, 1)));
    parts.push(lobe.toNonIndexed());
  }
  // two long antennae sweeping back over the body
  for (const side of [-1, 1]) {
    const h0 = new THREE.Vector3(hp.x + 0.06, hp.y - 0.05, side * 0.015);
    const curve = new THREE.CatmullRomCurve3([
      h0,
      new THREE.Vector3(h0.x + 0.08, h0.y - 0.02, side * 0.04),
      new THREE.Vector3(h0.x + 0.12, h0.y + 0.07, side * 0.07),
      new THREE.Vector3(h0.x + 0.06, h0.y + 0.2, side * 0.09),
      new THREE.Vector3(h0.x - 0.04, h0.y + 0.27, side * 0.1),
    ]);
    const ant = new THREE.TubeGeometry(curve, 24, 0.0022, 4, false);
    paint(ant, new THREE.Color('#e46a3e'));
    parts.push(ant.toNonIndexed());
    ant.dispose();
  }
  // legs along the belly
  for (let i = 0; i < 5; i++) {
    const t = 0.15 + i * 0.09;
    const p0 = arc(t, new THREE.Vector3());
    const leg = new THREE.CylinderGeometry(0.0035, 0.002, 0.05, 5);
    const ang = Math.atan2(p0.y, p0.x);
    leg.translate(0, -0.025, 0);
    leg.rotateZ(ang - Math.PI / 2 + 0.25);
    for (const zz of [-0.018, 0.018]) {
      const l2 = leg.clone();
      l2.translate(p0.x * 0.62, p0.y * 0.62, zz);
      paint(l2, new THREE.Color('#f2a27a'));
      parts.push(l2.toNonIndexed());
    }
    leg.dispose();
  }
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  body.dispose();
  head.dispose();
  g.computeBoundingSphere();
  return g;
}

/** One mussel valve: teardrop dome (hinge narrow) — outer (FrontSide) + nacre (BackSide) share this geometry. */
export function makeMusselShellGeometry() {
  const g = new THREE.SphereGeometry(1, 56, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const t = (x + 1) / 2; // 0 hinge → 1 broad end
    const w = 0.42 + 0.58 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.62);
    // growth ridges
    const dd = Math.hypot(x + 1, z * 0.8);
    const ridge = 1 + 0.07 * Math.pow(Math.abs(Math.sin(dd * 15)), 4) + 0.025 * Math.sin(dd * 47);
    p.setXYZ(i, x * 0.17, y * 0.058 * ridge * (0.55 + 0.45 * w), z * 0.085 * w);
  }
  g.computeVertexNormals();
  // growth bands: blue-black body, violet-brown growth lines, lighter worn umbo, olive-blue periostracum at the lip
  const col = new Float32Array(p.count * 3);
  const body = new THREE.Color('#1c1d26');
  const line = new THREE.Color('#6b5560');
  const lip = new THREE.Color('#4a5f86');
  const umbo = new THREE.Color('#7a6e68');
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / 0.17;
    const z = p.getZ(i) / 0.085;
    const y = p.getY(i) / 0.058;
    const d = Math.hypot(x + 1, z);
    c.copy(body).lerp(line, Math.pow(0.5 + 0.5 * Math.sin(d * 17), 5) * 0.75);
    c.lerp(lip, THREE.MathUtils.smoothstep(0.25, 0.0, y) * 0.7);
    c.lerp(umbo, THREE.MathUtils.smoothstep(0.35, 0.0, d) * 0.6);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export function makeMusselMeatGeometry() {
  const g = new THREE.SphereGeometry(1, 40, 16);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const edge = 1 - Math.abs(y);
    // ruffled mantle edge + plump body, teardrop like the valve
    const w = 0.5 + 0.5 * Math.sin(Math.min(1, ((x + 1) / 2) * 1.15) * Math.PI * 0.62);
    const ruff = 1 + 0.09 * Math.sin(a * 22) * edge;
    p.setXYZ(i, x * 0.135 * ruff, y * 0.036 * (1 + 0.35 * Math.sin(x * 9) * (1 - edge)), z * 0.064 * w * ruff);
  }
  g.computeVertexNormals();
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const core = new THREE.Color('#e9853f');
  const rim = new THREE.Color('#9a4a22');
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i) / 0.135, p.getZ(i) / 0.064);
    c.copy(core).lerp(rim, THREE.MathUtils.smoothstep(r, 0.78, 1.0) * 0.8);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Byssus "beard": a tuft of fine dark threads leaving the hinge. */
export function makeMusselBeardGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  // ~18 fine, irregular, curly fibres leaving the ventral seam next to the hinge (not the tip)
  let sd = 17;
  const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 18; k++) {
    const x0 = -0.125 + rnd() * 0.07;
    const z0 = -0.046 - rnd() * 0.006;
    const len = 0.022 + rnd() * 0.02;
    const pts: THREE.Vector3[] = [];
    let x = x0;
    let y = (rnd() - 0.5) * 0.004;
    let z = z0;
    let dx = (rnd() - 0.5) * 0.6;
    let dy = -0.3 - rnd() * 0.5;
    for (let s2 = 0; s2 < 5; s2++) {
      pts.push(new THREE.Vector3(x, y, z));
      const st = len / 4;
      x += dx * st;
      y += dy * st;
      z -= st * (0.6 + rnd() * 0.5);
      dx += (rnd() - 0.5) * 1.2;
      dy += (rnd() - 0.5) * 1.0;
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tb = new THREE.TubeGeometry(curve, 8, 0.0011 + rnd() * 0.0008, 3, false);
    parts.push(tb.toNonIndexed());
    tb.dispose();
  }
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return g;
}

/** Cherry tomato with a dimple + 5-sepal calyx and stem (vertex coloured, one draw). */
export function makeTomatoGeometry() {
  const body = new THREE.SphereGeometry(0.075, 28, 18);
  const p = body.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const r = Math.hypot(p.getX(i), p.getZ(i));
    let ny = y * 0.88;
    if (y > 0) ny -= 0.012 * Math.exp(-(r * r) / 0.0006);
    // subtle lobes
    const a = Math.atan2(p.getZ(i), p.getX(i));
    const k = 1 + 0.025 * Math.cos(a * 4) * (1 - Math.abs(y) / 0.075);
    p.setXYZ(i, p.getX(i) * k, ny, p.getZ(i) * k);
  }
  body.computeVertexNormals();
  paint(body, new THREE.Color('#d2261a'));
  const parts: THREE.BufferGeometry[] = [body.toNonIndexed()];
  const green = new THREE.Color('#3f6d28');
  for (let i = 0; i < 5; i++) {
    const sep = new THREE.SphereGeometry(1, 8, 6);
    sep.scale(0.034, 0.005, 0.009);
    sep.translate(0.03, 0, 0);
    sep.rotateZ(-0.35);
    sep.rotateY((i / 5) * Math.PI * 2 + 0.3);
    sep.translate(0, 0.058, 0);
    paint(sep, green);
    parts.push(sep.toNonIndexed());
  }
  const stem = new THREE.CylinderGeometry(0.004, 0.006, 0.03, 6);
  stem.rotateZ(0.25);
  stem.translate(0.002, 0.072, 0);
  paint(stem, new THREE.Color('#4d7a31'));
  parts.push(stem.toNonIndexed());
  const g = mergeGeometries(parts)!;
  body.dispose();
  return g;
}

/** Basil leaf: subdivided plane warped into a cupped, arched leaf with a darker midrib (vertex colours). */
export function makeBasilGeometry() {
  const g = new THREE.PlaneGeometry(1, 1, 20, 12);
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const leaf = new THREE.Color('#3f8a2c');
  const rib = new THREE.Color('#6fae4c');
  const edgeC = new THREE.Color('#9ad46a');
  const c = new THREE.Color();
  const L = 0.2;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5; // 0 stem → 1 tip
    const v = p.getY(i) * 2; // -1..1
    const w = 0.5 * Math.sin(Math.PI * Math.pow(u, 0.75)) * (u < 0.04 ? 0.3 : 1);
    const x = u * L;
    const y = v * w * L * 0.62;
    const z = -0.35 * (y * y) / (L * 0.2) + 0.55 * Math.abs(y) * 0.6 + 0.3 * L * u * u + 0.003 * Math.sin(u * 22) * Math.abs(v) - 0.03 * L * Math.sin(u * 7) * v;
    p.setXYZ(i, x, y, z);
    c.copy(leaf).lerp(rib, Math.exp(-(v * v) / 0.01) * 0.8);
    // lateral veins sweeping to the tip, lighter translucent margin, darker base
    const vein = Math.pow(0.5 + 0.5 * Math.cos((u * 6.5 - Math.abs(v) * 1.7) * Math.PI * 2), 14) * (Math.abs(v) < 0.88 ? 1 : 0);
    c.lerp(rib, vein * 0.45);
    c.lerp(edgeC, THREE.MathUtils.smoothstep(0.72, 1.0, Math.abs(v)) * 0.35);
    c.multiplyScalar(0.85 + 0.2 * u);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

/** Glossy sauce dollop (displaced, flattened sphere). */
export function makeSauceGeometry() {
  const g = new THREE.SphereGeometry(0.2, 40, 20);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + 0.12 * Math.sin(a * 5) + 0.06 * Math.sin(a * 11 + 1.3);
    p.setXYZ(i, x * k, Math.max(-0.02, y * 0.32), z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Glossy sauce pool with real thickness: low wobbly dome that hugs the plate well under the nest. */
export function makeSaucePoolGeometry() {
  const g = new THREE.SphereGeometry(1, 128, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + 0.09 * Math.sin(a * 3 + 0.7) + 0.05 * Math.sin(a * 5 + 2.1) + 0.035 * Math.sin(a * 9 + 4.2) + 0.02 * Math.sin(a * 14 + 1.1);
    // flat top, rounded meniscus edge
    const h = 0.004 + Math.pow(Math.max(0, y), 0.55) * 0.04;
    p.setXYZ(i, x * k, h, z * k);
  }
  g.computeVertexNormals();
  // thin edges read brighter / more orange, the deep middle a darker cooked red
  const col = new Float32Array(p.count * 3);
  const thick = new THREE.Color('#7a1208');
  const thin = new THREE.Color('#b8461e');
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    c.copy(thin).lerp(thick, Math.pow(Math.min(1, (p.getY(i) - 0.004) / 0.04), 0.6));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Sauce smear decal (alpha), drawn on the plate well under the nest. */
export function makeSauceSmearTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  x.translate(S / 2, S / 2);
  for (let k = 0; k < 3; k++) {
    x.beginPath();
    const R = S * (0.42 - k * 0.09);
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const r = R * (1 + 0.09 * Math.sin(a * 5 + k) + 0.05 * Math.sin(a * 13 + k * 2));
      if (i === 0) x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    x.fillStyle = ['rgba(128,22,10,.82)', 'rgba(146,26,14,.93)', 'rgba(158,30,16,.98)'][k];
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Soft radial contact-shadow blob (cheap alternative to real-time contact shadows on an iGPU). */
export function makeShadowTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,.75)');
  g.addColorStop(0.45, 'rgba(0,0,0,.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

/* ───────────────────────── Spaghetti (shader-morphed) ───────────────────────── */

export const PASTA = { strands: 52, seg: 96, radial: 6 };

/**
 * All spaghetti strands in ONE indexed geometry. Positions are computed in the vertex shader from
 * (aU along strand, aAng around cross-section, aSeed per strand) so the pasta can morph twirl → helix → nest
 * without rebuilding geometry on the CPU.
 */
export function makePastaGeometry() {
  const { strands, seg, radial } = PASTA;
  const vps = (seg + 1) * radial;
  const N = strands * vps;
  const aU = new Float32Array(N);
  const aAng = new Float32Array(N);
  const aSeed = new Float32Array(N * 4);
  const color = new Float32Array(N * 3);
  const pos = new Float32Array(N * 3);
  const idx: number[] = [];
  const base = new THREE.Color('#e8b787');
  const alt = new THREE.Color('#f4b276');
  const sauced = new THREE.Color('#c9542c');
  const c = new THREE.Color();
  let rnd = 7;
  const rand = () => {
    rnd = (rnd * 16807) % 2147483647;
    return rnd / 2147483647;
  };
  for (let s = 0; s < strands; s++) {
    const seed = [s / strands, rand(), rand(), rand()];
    c.copy(base).lerp(alt, rand() * 0.6);
    if (rand() < 0.45) c.lerp(sauced, 0.35 + rand() * 0.4);
    c.multiplyScalar(0.9 + rand() * 0.18); // ±9% luminance so neighbouring strands separate
    for (let i = 0; i <= seg; i++) {
      for (let j = 0; j < radial; j++) {
        const k = s * vps + i * radial + j;
        aU[k] = i / seg;
        aAng[k] = (j / radial) * Math.PI * 2;
        aSeed.set(seed, k * 4);
        color.set([c.r, c.g, c.b], k * 3);
      }
    }
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < radial; j++) {
        const a = s * vps + i * radial + j;
        const b = s * vps + i * radial + ((j + 1) % radial);
        const c2 = a + radial;
        const d = b + radial;
        idx.push(a, c2, b, b, c2, d);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
  g.setAttribute('aAng', new THREE.BufferAttribute(aAng, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 4));
  g.setAttribute('color', new THREE.BufferAttribute(color, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.6, 0), 3);
  return g;
}

export const PASTA_GLSL_HEAD = /* glsl */ `
attribute float aU;
attribute float aAng;
attribute vec4 aSeed;
uniform float uA;      // twirl → helix
uniform float uB;      // helix → nest
uniform float uRot;    // helix spin
uniform float uThick;
uniform float uPlateY;
uniform vec3 uTwirlPos;
uniform float uTwirlS;
const float TAU = 6.28318530718;
vec3 twirlC(float u, vec4 s) {
  float th = s.y * TAU + u * TAU * 5.0;
  float q = 2.0 * u - 1.0;
  float ball = 0.4 + 0.6 * sqrt(max(0.0, 1.0 - q * q));
  float r = (0.07 + 0.085 * s.z) * ball + 0.014 * sin(u * 37.0 + s.w * 6.0);
  float y = q * 0.15 + (s.x - 0.5) * 0.05;
  float hang = smoothstep(0.82, 1.0, u) * step(0.55, s.w);
  vec3 p = vec3(cos(th) * r, y, sin(th) * r);
  // every strand winds on its own tilted plane → a wound ball, not stacked rings
  float ta = (s.z - 0.5) * 0.9, tb = (s.w - 0.5) * 0.9;
  p.yz = mat2(cos(ta), -sin(ta), sin(ta), cos(ta)) * p.yz;
  p.xy = mat2(cos(tb), -sin(tb), sin(tb), cos(tb)) * p.xy;
  p.y -= hang * 0.42 * (0.5 + s.z);
  p.xz *= 1.0 - hang * 0.55;
  return uTwirlPos + p * uTwirlS;
}
vec3 helixAxis(float u) {
  float phi = uRot + u * TAU * 1.5;
  float R = 0.6 - 0.14 * u;
  return vec3(cos(phi) * R, -0.44 + u * 2.11, sin(phi) * R);
}
vec3 helixC(float u, vec4 s) {
  // strands wrap a round rope (tube r≈0.06–0.2 around the spiral axis), each with its own phase & radius noise
  float u0 = u;
  u *= 0.97 + 0.03 * s.w;
  vec3 c = helixAxis(u);
  vec3 T = normalize(helixAxis(min(u + 0.01, 1.0)) - helixAxis(max(u - 0.01, 0.0)));
  float phi = uRot + u * TAU * 1.5;
  vec3 rad = vec3(cos(phi), 0.0, sin(phi));
  vec3 N = normalize(rad - T * dot(rad, T));
  vec3 B = cross(T, N);
  float psi = s.y * TAU + u * TAU * 1.25 + 0.6 * sin(u * 9.0 + s.w * 6.0);
  float rho = (0.05 + 0.11 * sqrt(s.z) + 0.03 * sin(u * (11.0 + 9.0 * s.w) + s.x * 40.0)) * (0.82 + 0.36 * s.w);
  // gather the strands at both ends of the rope (no broom-like flare), tips curl inward
  // the rope gathers into a tapered tip at both ends (like a pulled bundle) instead of splaying like a broom
  rho *= mix(1.0, 0.04, smoothstep(0.82, 1.0, u0)) * mix(1.0, 0.25, smoothstep(0.08, 0.0, u0));
  return c + rho * (cos(psi) * N + sin(psi) * B);
}
vec3 nestC(float u, vec4 s) {
  float th = s.y * TAU + u * TAU * (2.1 + s.w * 0.9);
  float r = mix(0.47 - 0.12 * s.z, 0.04 + 0.12 * s.w, u) + 0.02 * sin(th * 3.0 + s.x * 9.0);
  float q = clamp(r / 0.56, 0.0, 1.0);
  float mound = 0.3 * (1.0 - q * q);
  float y = uPlateY + 0.035 + mound * (0.55 + 0.45 * s.x) + 0.012 * sin(u * 50.0 + s.y * 20.0);
  return vec3(cos(th) * r, y, sin(th) * r);
}
vec3 pastaCenter(float u, vec4 s) {
  float a = clamp(uA * 1.3 - s.x * 0.3, 0.0, 1.0); a = a * a * (3.0 - 2.0 * a);
  float b = clamp(uB * 1.35 - s.y * 0.35, 0.0, 1.0); b = b * b * (3.0 - 2.0 * b);
  if (b > 0.999) return nestC(u, s);
  vec3 p;
  if (a < 0.001) p = twirlC(u, s);
  else if (a > 0.999) p = helixC(u, s);
  else p = mix(twirlC(u, s), helixC(u, s), a);
  return b < 0.001 ? p : mix(p, nestC(u, s), b);
}
`;

export const PASTA_GLSL_NORMAL = /* glsl */ `
float pu = aU;
vec3 pc = pastaCenter(pu, aSeed);
vec3 pT = normalize(pastaCenter(min(pu + 0.005, 1.0), aSeed) - pastaCenter(max(pu - 0.005, 0.0), aSeed) + vec3(1e-5));
vec3 pRef = abs(pT.y) > 0.92 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
vec3 pN = normalize(cross(pT, pRef));
vec3 pB = cross(pT, pN);
vec3 pNrm = cos(aAng) * pN + sin(aAng) * pB;
vec3 objectNormal = pNrm;
`;

export const PASTA_GLSL_POS = /* glsl */ `
float pTaper = smoothstep(0.0, 0.03, pu) * smoothstep(1.0, 0.94, pu);
vec3 transformed = pc + pNrm * uThick * max(pTaper, 0.05);
`;
