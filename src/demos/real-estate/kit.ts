/**
 * Architecture kit: collects boxes (with metre-true UVs) per "part:material" bucket and merges each bucket into
 * ONE BufferGeometry → the whole villa renders in a few dozen draw calls while every part stays hoverable.
 * v2: UVs are metres / the PBR set's real-world tile size (UV_TILE), so the CC0 scans keep their true scale.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Part = 'mass' | 'glass' | 'roof' | 'fins' | 'pool' | 'none';
export type MatKey =
  | 'stone' | 'fascia' | 'paving' | 'steel' | 'glass' | 'wood' | 'deck' | 'interiorFloor' | 'interiorWall' | 'fabric'
  | 'fabricDark' | 'glow' | 'glowCool' | 'brass' | 'mosaic' | 'water' | 'curtain' | 'plant' | 'darkStone' | 'led'
  | 'ceiling' | 'wash' | 'scallop' | 'soffit';

/** metres covered by one texture tile (Poly Haven scans: blocks ≈ 2.2 m, planks ≈ 1.6 m, concrete ≈ 2.6 m) */
export const UV_TILE: Partial<Record<MatKey, number>> = {
  stone: 2.2,
  fascia: 2.6,
  soffit: 2.6,
  paving: 2.4,
  wood: 1.6,
  deck: 1.6,
};
/** planks run horizontally on cladding / garage door (the scan's boards are vertical) */
const UV_SWAP: Partial<Record<MatKey, boolean>> = { wood: true };

export interface Bucket {
  part: Part;
  mat: MatKey;
  geos: THREE.BufferGeometry[];
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

/** Box with UVs in metres / tile on every face (no stretching, joints keep their real size). */
export function boxUV(w: number, h: number, d: number, tile = 1, swap = false) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // face order: +x, -x, +y, -y, +z, -z ; 4 verts each
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++)
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      const u = (uv.getX(k) * dims[f][0]) / tile, v = (uv.getY(k) * dims[f][1]) / tile;
      if (swap) uv.setXY(k, v, u);
      else uv.setXY(k, u, v);
    }
  return g;
}

export class Kit {
  buckets = new Map<string, Bucket>();

  private bucket(part: Part, mat: MatKey) {
    const k = `${part}:${mat}`;
    let b = this.buckets.get(k);
    if (!b) {
      b = { part, mat, geos: [] };
      this.buckets.set(k, b);
    }
    return b;
  }

  /** axis-aligned box from min/max corners (x0,y0,z0)-(x1,y1,z1); world-anchored UVs so neighbouring boxes line up */
  box(part: Part, mat: MatKey, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, uvOffset = 0) {
    const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
    const tile = UV_TILE[mat] ?? 2.4;
    const g = boxUV(w, h, d, tile, UV_SWAP[mat]);
    // offset by the world corner → courses/joints continue across adjacent boxes instead of restarting
    const ox = Math.min(x0, x1) / tile, oy = Math.min(y0, y1) / tile, oz = Math.min(z0, z1) / tile;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const per: [number, number][] = [[oz, oy], [oz, oy], [ox, oz], [ox, oz], [ox, oy], [ox, oy]];
    for (let f = 0; f < 6; f++)
      for (let i = 0; i < 4; i++) {
        const k = f * 4 + i;
        const [a, b] = UV_SWAP[mat] ? [per[f][1], per[f][0]] : per[f];
        uv.setXY(k, uv.getX(k) + a + uvOffset, uv.getY(k) + b + uvOffset * 0.37);
      }
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.bucket(part, mat).geos.push(g);
    return this;
  }

  /** centred box with optional rotation (radians) */
  boxC(part: Part, mat: MatKey, cx: number, cy: number, cz: number, w: number, h: number, d: number, rx = 0, ry = 0, rz = 0) {
    const g = boxUV(w, h, d, UV_TILE[mat] ?? 2.4, UV_SWAP[mat]);
    _e.set(rx, ry, rz);
    _q.setFromEuler(_e);
    _m.compose(_p.set(cx, cy, cz), _q, _s.set(1, 1, 1));
    g.applyMatrix4(_m);
    this.bucket(part, mat).geos.push(g);
    return this;
  }

  /** any geometry with a transform */
  geo(part: Part, mat: MatKey, g: THREE.BufferGeometry, pos: [number, number, number] = [0, 0, 0], rot: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) {
    const gg = g.index ? g.toNonIndexed() : g.clone();
    // normalise attribute set to position/normal/uv so buckets merge
    for (const name of Object.keys(gg.attributes)) if (!['position', 'normal', 'uv'].includes(name)) gg.deleteAttribute(name);
    if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2));
    _e.set(rot[0], rot[1], rot[2]);
    _q.setFromEuler(_e);
    _m.compose(_p.set(...pos), _q, _s.set(...scale));
    gg.applyMatrix4(_m);
    this.bucket(part, mat).geos.push(gg);
    return this;
  }

  /**
   * Glazed wall in a plane: glass pane + slim black frame (perimeter + mullions + optional transom).
   * axis 'z' → wall faces ±z (spans x0..x1 at depth z); axis 'x' → wall faces ±x (spans z0..z1 at x).
   */
  glazing(part: Part, axis: 'x' | 'z', a0: number, a1: number, at: number, y0: number, y1: number, mullion = 1.6, transom: number | null = null, frame = 0.06) {
    const len = a1 - a0;
    const n = Math.max(1, Math.round(len / mullion));
    const step = len / n;
    const B = (u0: number, v0: number, u1: number, v1: number, dz: number, depth: number) => {
      if (axis === 'z') this.box(part, 'steel', u0, v0, at - depth / 2 + dz, u1, v1, at + depth / 2 + dz);
      else this.box(part, 'steel', at - depth / 2 + dz, v0, u0, at + depth / 2 + dz, v1, u1);
    };
    if (axis === 'z') this.box(part, 'glass', a0, y0, at - 0.01, a1, y1, at + 0.01);
    else this.box(part, 'glass', at - 0.01, y0, a0, at + 0.01, y1, a1);
    B(a0, y0, a1, y0 + frame, 0, 0.12);
    B(a0, y1 - frame, a1, y1, 0, 0.12);
    for (let i = 0; i <= n; i++) {
      const u = a0 + i * step;
      B(u - frame / 2, y0, u + frame / 2, y1, 0, 0.13);
    }
    if (transom !== null) B(a0, transom - 0.022, a1, transom + 0.022, 0, 0.09);
    return this;
  }

  build() {
    const out: { part: Part; mat: MatKey; geometry: THREE.BufferGeometry }[] = [];
    for (const b of this.buckets.values()) {
      const geos = b.geos.map((g) => (g.index ? g.toNonIndexed() : g));
      const merged = mergeGeometries(geos, false);
      if (!merged) continue;
      merged.computeBoundingSphere();
      merged.computeBoundingBox();
      out.push({ part: b.part, mat: b.mat, geometry: merged });
      geos.forEach((g) => g.dispose());
    }
    return out;
  }
}
