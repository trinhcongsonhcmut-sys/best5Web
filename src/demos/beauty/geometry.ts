/**
 * Procedural geometry for BAHA BOTANICA v2 — all built in code (lathe profiles, polar grids, swept tubes).
 * Units: bottle Ø 0.604, base on y = 0, bulb top at y ≈ 1.78 (30 ml Boston-round dropper, ~1 : 3 like the v2 reference).
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

/* ───────── amber Boston-round bottle ───────── */
export const BOT = {
  r: 0.302,
  rIn: 0.278,
  neckR: 0.112,
  neckTop: 1.252,
  liquidY: 0.9,
  /** collar seat (dropper assembly origin, bottle-local) */
  collarY: 1.105,
  collarH: 0.31,
  collarR: 0.2,
  bulbR: 0.104,
  bulbH: 0.367,
  /** pipette tip in dropper-local y (collar seat = 0) */
  tipY: -0.905,
  labelY0: 0.115,
  labelY1: 0.845,
  labelArc: 3.3,
  height: 1.782,
};

/**
 * Thick-walled glass shell: outer wall up, rolled lip, inner wall down to a thick punted base (profile CCW →
 * outward normals outside, normals facing the cavity inside). Wall 0.024, base ≈ 0.05.
 */
export function bottleGlassGeometry() {
  const pts: P2[] = [
    [0, 0.018], [0.15, 0.012], [0.235, 0.004], [0.272, 0.0], [0.29, 0.004], [0.299, 0.016], [0.302, 0.04],
    [0.302, 0.93], [0.3, 0.962], [0.293, 0.992], [0.278, 1.022], [0.255, 1.05], [0.224, 1.072], [0.19, 1.088], [0.155, 1.099],
    [0.128, 1.106], [0.115, 1.112], [0.112, 1.124],
    [0.112, 1.234], [0.111, 1.243], [0.106, 1.25], [0.098, 1.253], [0.09, 1.25], [0.086, 1.243], [0.085, 1.232],
    [0.085, 1.126], [0.096, 1.104], [0.13, 1.086], [0.178, 1.066], [0.222, 1.041], [0.252, 1.01], [0.268, 0.978], [0.276, 0.944], [0.278, 0.9],
    [0.278, 0.11], [0.276, 0.092], [0.268, 0.078], [0.25, 0.07], [0.2, 0.066], [0, 0.064],
  ];
  return new THREE.LatheGeometry(v2(pts), 128);
}

/** Single-start thread on the neck (hidden under the collar, seen once the dropper is off). */
export function threadGeometry() {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const a = t * Math.PI * 2 * 1.6;
    pts.push(new THREE.Vector3(Math.sin(a) * 0.113, 1.14 + t * 0.075, Math.cos(a) * 0.113));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.0055, 6, false);
}

/** Serum volume inside the glass, with a concave meniscus climbing the wall. */
export function liquidGeometry() {
  const pts: P2[] = [
    [0, 0.068], [0.2, 0.07], [0.25, 0.074], [0.267, 0.081], [0.2745, 0.094], [0.2765, 0.112],
    [0.2765, 0.884], [0.2762, 0.896], [0.273, 0.9], [0.264, 0.897], [0.245, 0.892], [0.2, 0.889], [0.1, 0.888], [0, 0.888],
  ];
  return new THREE.LatheGeometry(v2(pts), 96);
}

/** Paper label: open cylinder segment just proud of the glass, centred on +Z. */
export function labelGeometry(scale = 1) {
  const h = BOT.labelY1 - BOT.labelY0;
  return new THREE.CylinderGeometry((BOT.r + 0.0025) * scale, (BOT.r + 0.0025) * scale, h, 128, 1, true, -BOT.labelArc / 2, BOT.labelArc);
}

/* ───────── dropper: ribbed collar · soft bulb · glass pipette (dropper-local, collar seat at y = 0) ───────── */
export function collarGeometry(ribs = 96) {
  const pts: P2[] = [
    [0.03, 0.0], [0.19, 0.0], [0.196, 0.003], [0.2, 0.01], [0.2, 0.018], [0.2, 0.03], [0.2, 0.14], [0.2, 0.25], [0.2, 0.262], [0.2, 0.268], [0.199, 0.281], [0.194, 0.293], [0.182, 0.302], [0.162, 0.307],
    [0.118, 0.31], [0.108, 0.312], [0.104, 0.318], [0.03, 0.318],
  ];
  const g = new THREE.LatheGeometry(v2(pts), ribs * 6);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const r = Math.hypot(v.x, v.z);
    if (r < 0.197 || v.y < 0.016 || v.y > 0.262) continue;
    const th = Math.atan2(v.x, v.z);
    // fine moulded grip ribs: rounded crowns, narrow grooves
    const rib = Math.pow(0.5 + 0.5 * Math.cos(th * ribs), 0.6);
    // ribs fade out into the plain bands top and bottom
    const band = Math.min(1, (v.y - 0.016) / 0.012, (0.262 - v.y) / 0.012);
    const k = (r - 0.009 * (1 - rib) * band) / r;
    p.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  return smoothNormals(g);
}

export function bulbGeometry() {
  const pts: P2[] = [
    [0.0, 0.0], [0.1, 0.0], [0.104, 0.012], [0.104, 0.05], [0.1, 0.1], [0.0965, 0.15], [0.098, 0.2], [0.1025, 0.25], [0.102, 0.288],
    [0.095, 0.318], [0.08, 0.342], [0.058, 0.357], [0.03, 0.365], [0.0, 0.367],
  ];
  return smoothNormals(new THREE.LatheGeometry(v2(pts), 72));
}

/** Pipette glass tube (outer skin only) — tapered tip at the bottom. */
export function pipetteGeometry() {
  const pts: P2[] = [
    [0.0, BOT.tipY], [0.007, BOT.tipY + 0.002], [0.011, BOT.tipY + 0.01], [0.015, BOT.tipY + 0.045], [0.023, BOT.tipY + 0.11],
    [0.0265, BOT.tipY + 0.15], [0.0265, -0.004], [0.0, -0.004],
  ];
  return smoothNormals(new THREE.LatheGeometry(v2(pts), 32));
}

/** opaque cores inside the pipette: serum column (bottom) + the hollow's pale inner wall (above) */
export function pipetteCoreGeometries() {
  const liquid = new THREE.CylinderGeometry(0.016, 0.006, 0.36, 16, 1, false);
  liquid.translate(0, BOT.tipY + 0.012 + 0.18, 0);
  const hollow = new THREE.CylinderGeometry(0.007, 0.009, 0.5, 12, 1, true);
  hollow.translate(0, BOT.tipY + 0.37 + 0.25, 0);
  return { liquid, hollow };
}

/* ───────── citrus ───────── */
/**
 * Citrus wheel (span = 2π) or wedge (span < 2π): textured flesh faces (polar grid, planar UV) + a lathe rind band
 * with a soft bevel and a slightly uneven outline; wedges also get their two cut faces (radial pulp cross-sections).
 * Piece lies in XZ (face normal +Y), θ measured from +X toward +Z. Radius R, thickness T.
 */
export function sliceGeometries(R = 0.4, T = 0.07, span = Math.PI * 2, seed = 1, uvRot = 0) {
  const F = R * 0.965;
  const full = span >= Math.PI * 2 - 1e-4;
  const rings = 24;
  const segs = Math.max(18, Math.round((112 * span) / (Math.PI * 2)));
  const h = T / 2;
  const bump = (t: number) => 0.004 * (1 - t * t) + (t > 0.86 ? 0.0012 : 0);
  const mk = (top: boolean) => {
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= rings; i++) {
      const t = i / rings;
      for (let j = 0; j <= segs; j++) {
        const th = (j / segs) * span;
        const x = Math.cos(th) * F * t;
        const z = Math.sin(th) * F * t;
        // juicy flesh slightly domed, the pith ring a hair proud
        const y = h + bump(t);
        pos.push(x, top ? y : -y, z);
        // texture turned per piece so no two pieces show the same segment layout
        const ur = th + uvRot;
        uv.push(0.5 + (Math.cos(ur) * F * t) / (2 * F), 0.5 + (Math.sin(ur) * F * t) / (2 * F));
      }
    }
    const row = segs + 1;
    for (let i = 0; i < rings; i++)
      for (let j = 0; j < segs; j++) {
        const a = i * row + j;
        const b = a + row;
        if (top) idx.push(a, a + 1, b, b, a + 1, b + 1);
        else idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const parts = [mk(true), mk(false)];
  if (!full) {
    // radial cut faces: pulp sacs → pith → rind cross-section, sampled along one ray of the flesh texture
    const cut = (ang: number, outward: THREE.Vector3) => {
      const pos: number[] = [];
      const uv: number[] = [];
      const n = 16;
      // planar projection of the cut: radius → along a texture ray, thickness → ACROSS it at the same scale, so the
      // cut shows a 2-D patch of juice sacs (a 1-D ray sampled rows of sacs as orange/white stripes)
      const aTex = 0.3 + seed * 0.7 + uvRot;
      const ax = Math.cos(aTex);
      const ay = Math.sin(aTex);
      for (let i = 0; i <= n; i++) {
        const r = (i / n) * R;
        const t = Math.min(1, r / F);
        const yy = r <= F ? h + bump(t) : h - 0.02 * ((r - F) / (R - F));
        const tr = r <= F ? t * 0.93 : 0.94 + 0.055 * ((r - F) / (R - F));
        for (const sy of [-1, 1]) {
          pos.push(Math.cos(ang) * r, sy * yy, Math.sin(ang) * r);
          const across = (sy * yy) / (2 * F);
          uv.push(0.5 + 0.5 * tr * ax - across * ay, 0.5 + 0.5 * tr * ay + across * ax);
        }
      }
      const tri = (flip: boolean) => {
        const idx: number[] = [];
        for (let i = 0; i < n; i++) {
          const a = i * 2;
          if (flip) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
          else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
        return idx;
      };
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(tri(false));
      g.computeVertexNormals();
      const nn = new THREE.Vector3().fromBufferAttribute(g.getAttribute('normal') as THREE.BufferAttribute, 8);
      if (nn.dot(outward) < 0) {
        g.setIndex(tri(true));
        g.computeVertexNormals();
      }
      return g;
    };
    parts.push(cut(0, new THREE.Vector3(0, 0, -1)), cut(span, new THREE.Vector3(-Math.sin(span), 0, Math.cos(span))));
  }
  const face = mergeGeos(parts);
  // lathe phi: x = sin φ, z = cos φ  →  φ = π/2 − θ
  const rind = new THREE.LatheGeometry(
    v2([
      [F, -h], [R * 0.985, -h + 0.006], [R, -h + 0.02], [R * 1.004, 0], [R, h - 0.02], [R * 0.985, h - 0.006], [F, h],
    ]),
    Math.max(24, Math.round((140 * span) / (Math.PI * 2))),
    full ? 0 : Math.PI / 2 - span,
    span,
  );
  // hand-cut, not machined: the peel outline wanders a little
  const p = rind.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const r = Math.hypot(v.x, v.z);
    if (r < F * 1.002) continue;
    const ph = Math.atan2(v.x, v.z);
    const k = 1 + 0.011 * Math.sin(ph * 7 + seed * 2.1) + 0.006 * Math.sin(ph * 17 + seed);
    p.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  return { face, rind };
}

/** Citrus half: rind dome (y ≤ 0) + flesh cut face at y = 0 (face normal +Y). */
export function halfGeometries(R = 0.5, uvRot = 0) {
  const dome = new THREE.SphereGeometry(R, 96, 36, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  dome.scale(1, 0.9, 1);
  const s = sliceGeometries(R, 0.0, Math.PI * 2, 1, uvRot);
  // keep only the top face of the wheel (first half of the merged index)
  const face = s.face;
  const half = (face.getIndex()!.count / 2) | 0;
  face.setIndex(Array.from(face.getIndex()!.array).slice(0, half));
  s.rind.dispose();
  return { dome, face };
}

function mergeGeos(list: THREE.BufferGeometry[]) {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let off = 0;
  for (const g of list) {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    const u = g.getAttribute('uv');
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      uv.push(u.getX(i), u.getY(i));
    }
    const ix = g.getIndex()!;
    for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + off);
    off += p.count;
    g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  m.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  m.setIndex(idx);
  return m;
}

/**
 * Cocktail-style peel twist with real thickness: dimpled rind skin outside, white pith inside + the two cut edges.
 * Returns { rind, pith } (render the pith double-sided: it carries the inner skin and both edges).
 */
export function peelGeometries() {
  const N = 96;
  const W = 4;
  const TH = 0.007;
  const turns = 1.7;
  const row = W + 1;
  const surf = (inset: number) => {
    const pos: number[] = [];
    const uv: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = t * Math.PI * 2 * turns;
      const rr = 0.04 + 0.012 * Math.sin(t * Math.PI);
      const y = (t - 0.5) * 0.2;
      const w = 0.03 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.01)), 0.3);
      for (let k = 0; k <= W; k++) {
        const u = k / W - 0.5;
        const r = rr - inset + 0.004 * (1 - 4 * u * u); // slightly cupped across the strip
        pos.push(Math.cos(a) * r, y + u * w * 2, Math.sin(a) * r);
        uv.push(t * 8, k / W);
      }
    }
    return { pos, uv };
  };
  const grid = (flip: boolean) => {
    const idx: number[] = [];
    for (let i = 0; i < N; i++)
      for (let k = 0; k < W; k++) {
        const a = i * row + k;
        if (flip) idx.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
        else idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
      }
    return idx;
  };
  const build = (pos: number[], uv: number[], idx: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  /** true when the sample normal points away from the twist axis */
  const outward = (g: THREE.BufferGeometry) => {
    const i = row * (N >> 1) + (W >> 1);
    const n = new THREE.Vector3().fromBufferAttribute(g.getAttribute('normal') as THREE.BufferAttribute, i);
    const q = new THREE.Vector3().fromBufferAttribute(g.getAttribute('position') as THREE.BufferAttribute, i);
    return n.x * q.x + n.z * q.z > 0;
  };
  const o = surf(0);
  let rind = build(o.pos, o.uv, grid(false));
  if (!outward(rind)) {
    rind.dispose();
    rind = build(o.pos, o.uv, grid(true));
  }
  const inn = surf(TH);
  const pos = [...inn.pos];
  const uv = [...inn.uv];
  const base = pos.length / 3;
  for (const k of [0, W])
    for (let i = 0; i <= N; i++) {
      const j = (i * row + k) * 3;
      pos.push(inn.pos[j], inn.pos[j + 1], inn.pos[j + 2], o.pos[j], o.pos[j + 1], o.pos[j + 2]);
      uv.push(0, 0, 0, 1);
    }
  const idx = grid(false);
  for (let e = 0; e < 2; e++)
    for (let i = 0; i < N; i++) {
      const a = base + e * (N + 1) * 2 + i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  const pith = build(pos, uv, idx);
  return { rind, pith };
}

/* ───────── water ───────── */
/**
 * A splash stream: Catmull-Rom spine, elliptical cross-section (flat < 1 → a liquid sheet), uneven thickness along
 * its length and a Rayleigh–Plateau "necklace" toward the tip where the jet starts breaking into droplets.
 */
export function streamGeometry(points: [number, number, number][], r0: number, r1: number, flat = 1, seed = 0, segs = 72, radial = 12, breakup = 0.35) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const frames = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const env = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.4);
    const wob = 1 + 0.3 * Math.sin(t * 13 + seed * 2.3) + 0.16 * Math.sin(t * 31 + seed) + 0.08 * Math.sin(t * 57 + seed * 3.7);
    const m = Math.min(1, Math.max(0, (t - (1 - breakup)) / breakup));
    const neck = 1 - m * 0.8 * Math.pow(0.5 + 0.5 * Math.cos(t * 70 + seed * 1.9), 1.5);
    const r = Math.max(0.0012, (r0 + (r1 - r0) * t) * env * wob * neck);
    for (let k = 0; k <= radial; k++) {
      const a = (k / radial) * Math.PI * 2;
      const c = Math.cos(a) * r;
      const s = Math.sin(a) * r * flat;
      pos.push(P.x + N.x * c + B.x * s, P.y + N.y * c + B.y * s, P.z + N.z * c + B.z * s);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < segs; i++)
    for (let k = 0; k < radial; k++) {
      const a = i * row + k;
      idx.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * Splash crown: a thin flared liquid wall whose rim tears into spikes; returns the spike tips (droplets sit there).
 * Open surface (render double-sided). Axis +Y, base ring radius R, arc `span` around +X→+Z.
 */
export function crownGeometry(R = 0.4, H = 0.3, spikes = 9, span = Math.PI * 1.6, seed = 3) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const jit = Array.from({ length: spikes }, () => ({ h: 0.55 + rnd() * 0.6, d: (rnd() - 0.5) * 0.5 }));
  const NU = Math.round(spikes * 14);
  const NV = 14;
  const pos: number[] = [];
  const idx: number[] = [];
  const tips: THREE.Vector3[] = [];
  const amp = (th: number) => {
    const f = (th / span) * spikes - 0.5;
    const k = Math.min(spikes - 1, Math.max(0, Math.round(f)));
    const d = f - k - jit[k].d * 0.3;
    return jit[k].h * Math.exp(-d * d * 9);
  };
  for (let j = 0; j <= NV; j++) {
    const v = j / NV;
    for (let i = 0; i <= NU; i++) {
      const th = (i / NU) * span;
      const a = amp(th);
      const hh = H * (0.35 + 0.65 * a);
      // the wall flares out toward the torn rim
      const r = R * (1 + 0.45 * Math.pow(v, 1.6) * (0.6 + 0.4 * a));
      pos.push(Math.cos(th) * r, v * hh, Math.sin(th) * r);
    }
  }
  const row = NU + 1;
  for (let j = 0; j < NV; j++)
    for (let i = 0; i < NU; i++) {
      const a = j * row + i;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  for (let k = 0; k < spikes; k++) {
    const th = ((k + 0.5 + jit[k].d * 0.3) / spikes) * span;
    const a = jit[k].h;
    const r = R * (1 + 0.45 * (0.6 + 0.4 * a));
    tips.push(new THREE.Vector3(Math.cos(th) * r * 1.05, H * (0.35 + 0.65 * a) + 0.035, Math.sin(th) * r * 1.05));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geo: g, tips };
}

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

/* ───────── pedestal (top at y = 0) ───────── */
export function plinthTopGeometry(R = 1.02) {
  const pts: P2[] = [[0, 0], [R - 0.015, 0], [R, 0.012], [R, 0.05], [R - 0.012, 0.062], [0, 0.062]];
  return new THREE.LatheGeometry(v2(pts), 128);
}

export function plinthGeometry(R = 1.12, H = 0.34) {
  const pts: P2[] = [[0, -H], [R - 0.02, -H], [R, -H + 0.02], [R, -0.03], [R - 0.008, -0.01], [R - 0.03, 0], [0, 0]];
  return new THREE.LatheGeometry(v2(pts), 128);
}
