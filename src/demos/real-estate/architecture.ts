/**
 * The villa, described in metres. Ground at y = 0, plinth top 0.5.
 *   GF  0.5 → 4.1 (slab 4.1–4.5)   ·  L1 4.5 → 8.1 (slab 8.1–8.5)  ·  L2 8.5 → 12.1 (roof 12.1–12.55)
 *   Rooftop: infinity pool + teak deck + pergola on top of L2. Front faces +z.
 * Every side is designed: back has the stone stair core with a full-height glass slot and ribbon windows,
 * left side has the L2 cantilever + slot windows, right side the garage + L2 terrace.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Kit, type MatKey, type Part } from './kit';

/** soft upholstery block (rounded edges) — one shared unit box, scaled per piece */
const RB = new Map<string, THREE.BufferGeometry>();
function rounded(w: number, h: number, d: number, r = 0.06) {
  const k = `${w.toFixed(2)}|${h.toFixed(2)}|${d.toFixed(2)}|${r}`;
  let g = RB.get(k);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, h / 2 - 0.005, w / 2 - 0.005, d / 2 - 0.005));
    RB.set(k, g);
  }
  return g;
}

export const Y = { plinth: 0.5, l1: 4.5, l2: 8.5, roof: 12.55, deck: 13.1, water: 13.22 };

// ───────── furniture helpers (simple but proportioned) ─────────
function sofa(k: Kit, x: number, y: number, z: number, w: number, ry = 0, mat: MatKey = 'fabric') {
  // seat / back / arms, local frame rotated by ry around (x,z)
  const c = Math.cos(ry), s = Math.sin(ry);
  const P = (lx: number, lz: number): [number, number] => [x + lx * c + lz * s, z - lx * s + lz * c];
  const b = (lx: number, ly: number, lz: number, bw: number, bh: number, bd: number, m: MatKey = mat) => {
    const [px, pz] = P(lx, lz);
    k.geo('none', m, rounded(bw, bh, bd, 0.07), [px, y + ly, pz], [0, ry, 0]);
  };
  b(0, 0.06, 0, w, 0.06, 0.95, 'fabricDark'); // plinth shadow
  b(0, 0.25, 0.05, w - 0.1, 0.32, 0.85);
  b(0, 0.55, -0.36, w, 0.5, 0.22);
  b(-w / 2 + 0.11, 0.45, 0.02, 0.22, 0.32, 0.95);
  b(w / 2 - 0.11, 0.45, 0.02, 0.22, 0.32, 0.95);
  // cushions
  const n = Math.max(2, Math.round(w / 0.9));
  for (let i = 0; i < n; i++) b(-w / 2 + 0.35 + (i * (w - 0.7)) / Math.max(1, n - 1), 0.62, -0.18, 0.42, 0.36, 0.12, i % 2 ? 'fabricDark' : 'fabric');
}

function table(k: Kit, x: number, y: number, z: number, w: number, d: number, h: number, top: MatKey = 'darkStone') {
  k.box('none', top, x - w / 2, y + h - 0.05, z - d / 2, x + w / 2, y + h, z + d / 2);
  k.geo('none', 'brass', new THREE.CylinderGeometry(0.06, 0.12, h - 0.05, 12), [x, y + (h - 0.05) / 2, z]);
}

function roundTable(k: Kit, x: number, y: number, z: number, r: number, h: number) {
  k.geo('none', 'darkStone', new THREE.CylinderGeometry(r, r, 0.06, 32), [x, y + h, z]);
  k.geo('none', 'brass', new THREE.CylinderGeometry(r * 0.55, r * 0.6, h - 0.03, 24), [x, y + (h - 0.03) / 2, z]);
}

function chair(k: Kit, x: number, y: number, z: number, ry: number) {
  const c = Math.cos(ry), s = Math.sin(ry);
  k.geo('none', 'fabric', rounded(0.5, 0.1, 0.5, 0.04), [x, y + 0.47, z], [0, ry, 0]);
  k.geo('none', 'fabric', rounded(0.5, 0.52, 0.08, 0.035), [x - 0.22 * s, y + 0.78, z - 0.22 * c], [-0.12, ry, 0]);
  for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
    const px = x + lx * c + lz * s, pz = z - lx * s + lz * c;
    k.boxC('none', 'brass', px, y + 0.21, pz, 0.025, 0.42, 0.025, 0, ry, 0);
  }
}

function ringLight(k: Kit, x: number, y: number, z: number, r: number) {
  k.geo('none', 'glow', new THREE.TorusGeometry(r, 0.035, 8, 64), [x, y, z], [Math.PI / 2, 0, 0]);
  k.geo('none', 'brass', new THREE.CylinderGeometry(0.006, 0.006, 1.2, 4), [x + r, y + 0.6, z]);
  k.geo('none', 'brass', new THREE.CylinderGeometry(0.006, 0.006, 1.2, 4), [x - r, y + 0.6, z]);
}

function plant(k: Kit, x: number, y: number, z: number, h: number) {
  k.geo('none', 'darkStone', new THREE.CylinderGeometry(0.3, 0.24, 0.55, 16), [x, y + 0.275, z]);
  const leaf = new THREE.IcosahedronGeometry(0.5, 2);
  k.geo('none', 'plant', leaf, [x, y + h * 0.62, z], [0.3, 0.2, 0], [0.75, h * 0.55, 0.75]);
  k.geo('none', 'plant', leaf, [x + 0.18, y + h * 0.85, z - 0.1], [0.1, 1.2, 0], [0.55, 0.5, 0.55]);
  k.geo('none', 'wood', new THREE.CylinderGeometry(0.025, 0.03, h * 0.6, 5), [x, y + 0.55 + h * 0.3, z]);
}

function curtain(k: Kit, x0: number, x1: number, y0: number, y1: number, z: number) {
  const w = x1 - x0;
  const g = new THREE.PlaneGeometry(w, y1 - y0, Math.max(8, Math.round(w * 10)), 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9) * 0.06);
  g.computeVertexNormals();
  k.geo('none', 'curtain', g, [(x0 + x1) / 2, (y0 + y1) / 2, z]);
}

/** arc floor lamp: slim brass stem + linen drum shade that glows */
function floorLamp(k: Kit, x: number, y: number, z: number, h = 1.65) {
  k.geo('none', 'darkStone', new THREE.CylinderGeometry(0.17, 0.19, 0.04, 20), [x, y + 0.02, z]);
  k.geo('none', 'brass', new THREE.CylinderGeometry(0.014, 0.014, h, 6), [x, y + h / 2, z]);
  k.geo('none', 'curtain', new THREE.CylinderGeometry(0.2, 0.24, 0.3, 24, 1, true), [x, y + h, z]);
  k.geo('none', 'glow', new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), [x, y + h - 0.14, z]);
}

/** side table: brass ring base + stone disc, with a stack of books */
function sideTable(k: Kit, x: number, y: number, z: number) {
  k.geo('none', 'darkStone', new THREE.CylinderGeometry(0.24, 0.24, 0.03, 24), [x, y + 0.5, z]);
  k.geo('none', 'brass', new THREE.CylinderGeometry(0.02, 0.02, 0.48, 6), [x, y + 0.25, z]);
  k.geo('none', 'brass', new THREE.TorusGeometry(0.18, 0.012, 6, 24), [x, y + 0.01, z], [Math.PI / 2, 0, 0]);
  k.geo('none', 'fabricDark', rounded(0.22, 0.04, 0.16, 0.01), [x - 0.04, y + 0.535, z]);
  k.geo('none', 'fabric', rounded(0.2, 0.035, 0.15, 0.01), [x - 0.03, y + 0.57, z + 0.01], [0, 0.3, 0]);
}

/** framed artwork on a wall facing +z (warm picture light above) */
function art(k: Kit, cx: number, cy: number, z: number, w: number, h: number, tone: MatKey = 'fabricDark') {
  k.box('none', 'brass', cx - w / 2 - 0.03, cy - h / 2 - 0.03, z, cx + w / 2 + 0.03, cy + h / 2 + 0.03, z + 0.03);
  k.box('none', tone, cx - w / 2, cy - h / 2, z + 0.03, cx + w / 2, cy + h / 2, z + 0.045);
  k.box('none', 'fabric', cx - w * 0.3, cy - h * 0.15, z + 0.046, cx + w * 0.05, cy + h * 0.3, z + 0.05);
  k.box('none', 'glow', cx - w * 0.3, cy + h / 2 + 0.12, z + 0.02, cx + w * 0.3, cy + h / 2 + 0.15, z + 0.12);
}

/** a soft additive light card: floor pool (axis 'y'), wall wash facing +z ('z') or ceiling glow ('down') */
function wash(k: Kit, axis: 'y' | 'z' | 'down', x: number, y: number, z: number, w: number, h: number) {
  const g = new THREE.PlaneGeometry(w, h);
  const rot: [number, number, number] = axis === 'y' ? [-Math.PI / 2, 0, 0] : axis === 'down' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  k.geo('none', 'wash', g, [x, y, z], rot);
}

function lounger(k: Kit, x: number, y: number, z: number, ry: number) {
  const c = Math.cos(ry), s = Math.sin(ry);
  k.boxC('none', 'wood', x, y + 0.25, z, 0.7, 0.1, 1.5, 0, ry, 0);
  k.boxC('none', 'fabric', x, y + 0.34, z + 0.15 * c, 0.64, 0.08, 1.15, 0, ry, 0);
  k.boxC('none', 'fabric', x - 0.62 * s, y + 0.52, z - 0.62 * c, 0.64, 0.08, 0.6, -0.75, ry, 0);
  k.boxC('none', 'steel', x, y + 0.1, z, 0.6, 0.2, 1.3, 0, ry, 0);
}

function planter(k: Kit, part: Part, x0: number, z0: number, x1: number, z1: number, y: number, h = 0.6) {
  k.box(part, 'stone', x0, y, z0, x1, y + h, z1);
  k.box('none', 'darkStone', x0 + 0.08, y + h - 0.02, z0 + 0.08, x1 - 0.08, y + h + 0.0, z1 - 0.08);
  const shrub = new THREE.IcosahedronGeometry(0.5, 2);
  const n = Math.max(1, Math.round(((x1 - x0) * (z1 - z0)) / 0.8));
  for (let i = 0; i < n; i++) {
    const fx = x0 + 0.3 + ((i * 0.618) % 1) * (x1 - x0 - 0.6);
    const fz = z0 + 0.3 + ((i * 0.381 + 0.3) % 1) * (z1 - z0 - 0.6);
    k.geo('none', 'plant', shrub, [fx, y + h + 0.18, fz], [i, i * 2, 0], [0.75, 0.55, 0.75]);
  }
}

function balustrade(k: Kit, axis: 'x' | 'z', a0: number, a1: number, at: number, y: number) {
  if (axis === 'z') {
    k.box('none', 'glass', a0, y, at - 0.012, a1, y + 1.05, at + 0.012);
    k.box('none', 'steel', a0, y, at - 0.05, a1, y + 0.08, at + 0.05);
  } else {
    k.box('none', 'glass', at - 0.012, y, a0, at + 0.012, y + 1.05, a1);
    k.box('none', 'steel', at - 0.05, y, a0, at + 0.05, y + 0.08, a1);
  }
}

/** vertical fins along x (facing +z) */
function finsZ(k: Kit, x0: number, x1: number, z: number, y0: number, y1: number, pitch = 0.3, depth = 0.28) {
  for (let x = x0; x <= x1 + 1e-3; x += pitch) k.box('fins', 'wood', x - 0.035, y0, z - depth / 2, x + 0.035, y1, z + depth / 2, x * 0.37);
}
function finsX(k: Kit, z0: number, z1: number, x: number, y0: number, y1: number, pitch = 0.3, depth = 0.28) {
  for (let z = z0; z <= z1 + 1e-3; z += pitch) k.box('fins', 'wood', x - depth / 2, y0, z - 0.035, x + depth / 2, y1, z + 0.035, z * 0.41);
}

export interface EdgeBox {
  min: [number, number, number];
  max: [number, number, number];
}

export function buildVilla() {
  const k = new Kit();
  const edges: EdgeBox[] = [];
  const vol = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => edges.push({ min: [x0, y0, z0], max: [x1, y1, z1] });

  // ═════════ PLINTH + front terrace + entry steps ═════════
  k.box('mass', 'stone', -12.5, 0, -8.6, 13.6, Y.plinth, 9.5);
  k.box('none', 'darkStone', -12.6, Y.plinth - 0.05, 9.42, 13.7, Y.plinth + 0.005, 9.56); // coping line
  for (let i = 0; i < 3; i++) k.box('mass', 'stone', 0.8, 0, 9.5 + i * 0.4, 5.8, Y.plinth - (i + 1) * 0.166, 9.9 + i * 0.4);

  // ═════════ GROUND FLOOR (x −11..5, z −6..5) ═════════
  vol(-11, Y.plinth, -6, 5, 4.1, 5);
  // back wall z −6 with two ribbon windows
  k.box('mass', 'stone', -11, Y.plinth, -6, 5, 1.4, -5.7);
  k.box('mass', 'stone', -11, 3.2, -6, 5, 4.1, -5.7);
  k.box('mass', 'stone', -11, 1.4, -6, -8, 3.2, -5.7);
  k.box('mass', 'stone', -2, 1.4, -6, 0, 3.2, -5.7);
  k.box('mass', 'stone', 3, 1.4, -6, 5, 3.2, -5.7);
  k.glazing('glass', 'z', -8, -2, -5.85, 1.4, 3.2, 1.5);
  k.glazing('glass', 'z', 0, 3, -5.85, 1.4, 3.2, 1.5);
  // left wall x −11 with two full-height slots
  k.box('mass', 'stone', -11.3, Y.plinth, -6, -11, 4.1, -3);
  k.box('mass', 'stone', -11.3, Y.plinth, -2.4, -11, 4.1, 1);
  k.box('mass', 'stone', -11.3, Y.plinth, 1.6, -11, 4.1, 5.2);
  k.glazing('glass', 'x', -3, -2.4, -11.15, Y.plinth, 4.1, 1);
  k.glazing('glass', 'x', 1, 1.6, -11.15, Y.plinth, 4.1, 1);
  // front: stone pier, big glass, entry portal with pivot door
  k.box('mass', 'stone', -11.3, Y.plinth, 4.7, -9, 4.1, 5.25);
  k.glazing('glass', 'z', -9, 2.4, 4.95, Y.plinth, 4.1, 1.9);
  k.box('mass', 'stone', 2.4, Y.plinth, 4.6, 3.0, 4.1, 5.3);
  k.box('mass', 'stone', 4.4, Y.plinth, 4.6, 5.1, 4.1, 5.3);
  k.box('mass', 'stone', 3.0, 3.75, 4.6, 4.4, 4.1, 5.3);
  k.box('fins', 'wood', 3.05, Y.plinth, 4.68, 4.35, 3.75, 4.78); // pivot door
  k.box('none', 'brass', 4.12, 1.4, 4.79, 4.16, 2.9, 4.84); // pull
  // entry canopy with downlights
  k.box('roof', 'plaster', 0.6, 3.82, 5.3, 6.2, 4.0, 9.0);
  k.box('none', 'led', 0.7, 3.81, 8.85, 6.1, 3.82, 8.92);
  for (const x of [1.6, 3.4, 5.2]) k.geo('none', 'glow', new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), [x, 3.805, 7.2]);

  // GF interior (lobby / lounge)
  k.box('none', 'interiorFloor', -10.95, Y.plinth, -5.7, 4.6, Y.plinth + 0.02, 4.9);
  k.box('none', 'ceiling', -10.95, 4.06, -5.7, 4.6, 4.1, 4.9); // ceiling
  k.box('none', 'interiorWall', -10, Y.plinth, -2.6, 1.4, 4.06, -2.3); // feature wall
  k.box('none', 'wood', -6.4, Y.plinth, -2.32, -2.4, 4.06, -2.22); // timber panel insert
  k.box('none', 'led', -6.4, 4.0, -2.22, -2.4, 4.04, -2.12);
  for (let i = 0; i < 4; i++) k.box('none', 'glow', -9.6 + i * 0.75, 1.2 + (i % 2) * 0.6, -2.29, -9.1 + i * 0.75, 1.24 + (i % 2) * 0.6, -2.2); // niche lights
  k.box('none', 'fabric', -6.6, Y.plinth + 0.02, -0.4, -1.4, Y.plinth + 0.04, 3.4); // rug
  sofa(k, -4.1, Y.plinth, 0.3, 3.4, 0);
  sofa(k, -6.4, Y.plinth, 1.9, 2.2, -Math.PI / 2, 'fabricDark');
  roundTable(k, -4.0, Y.plinth, 1.8, 0.55, 0.38);
  chair(k, -1.9, Y.plinth, 2.2, Math.PI * 0.75);
  k.geo('none', 'led', new THREE.TorusGeometry(2.4, 0.035, 6, 96), [-4.0, 4.02, 1.6], [Math.PI / 2, 0, 0], [1.35, 1, 1]);
  ringLight(k, -4.0, 3.15, 1.8, 0.9);
  ringLight(k, -4.0, 2.95, 1.8, 0.55);
  table(k, 0.2, Y.plinth, -1.2, 2.2, 0.5, 0.85, 'wood'); // console
  floorLamp(k, -6.1, Y.plinth, 0.0);
  wash(k, 'y', -4.0, Y.plinth + 0.06, 1.8, 5.2, 4.2);
  wash(k, 'y', -6.1, Y.plinth + 0.07, 0.0, 2.2, 2.2);
  for (const x of [-8.2, -4.4, -0.6]) wash(k, 'z', x, 2.6, -2.2, 3.6, 3.4);
  wash(k, 'down', -4.0, 4.03, 1.6, 7.5, 5.5);
  sideTable(k, -2.1, Y.plinth, 0.4);
  art(k, -8.3, 2.3, -2.3, 1.6, 1.1);
  plant(k, -9.6, Y.plinth, 3.8, 2.3);
  plant(k, 1.6, Y.plinth, 3.6, 1.9);
  curtain(k, -9.0, -7.6, Y.plinth + 0.05, 4.0, 4.55);
  // garage (x 5..12, z −6..4) with teak slat door
  vol(5, Y.plinth, -6, 12, 4.1, 4);
  k.box('mass', 'stone', 5.1, Y.plinth, -6, 12, 4.1, -5.7);
  k.box('mass', 'stone', 11.7, Y.plinth, -6, 12, 4.1, 4);
  k.box('mass', 'stone', 5.1, Y.plinth, -6, 5.4, 4.1, 4);
  k.box('mass', 'stone', 5.1, Y.plinth, 3.7, 6.0, 4.1, 4.2);
  k.box('mass', 'stone', 11.0, Y.plinth, 3.7, 12, 4.1, 4.2);
  k.box('mass', 'stone', 6.0, 3.4, 3.7, 11.0, 4.1, 4.2);
  k.box('none', 'darkStone', 6.0, Y.plinth, 3.6, 11.0, 3.4, 3.7);
  finsZ(k, 6.1, 10.9, 3.95, Y.plinth, 3.4, 0.16, 0.12);
  // GF / garage roof slabs (offset a hair to avoid coplanar faces with the L1 slab)
  k.box('mass', 'plaster', -11.4, 4.1, -6.1, 5.0, 4.5, 5.35);
  k.box('mass', 'plaster', 5.0, 4.11, -6.1, 12.1, 4.49, 4.3);
  balustrade(k, 'x', -6.1, 5.3, -11.35, 4.5);
  balustrade(k, 'z', -11.4, -7, 5.3, 4.5);
  k.box('none', 'deck', -11.3, 4.5, -6.0, -7.0, 4.56, 5.3); // L1 west terrace deck

  // ═════════ LEVEL 1 (cantilever, x −7..13, z −5..7) ═════════
  vol(-7, Y.l1, -5, 13, 8.1, 7);
  k.box('mass', 'plaster', -7.05, 4.08, -5.05, 13.3, 4.51, 7.3); // floor slab (cantilever fascia)
  k.box('none', 'led', -7.0, 4.065, 7.1, 13.25, 4.08, 7.24); // soffit LED line
  k.box('mass', 'stone', -7, Y.l1, 6.7, -5.2, 8.1, 7.0);
  k.box('mass', 'stone', 9.2, Y.l1, 6.7, 13, 8.1, 7.0);
  k.glazing('glass', 'z', -5.2, 9.2, 6.85, Y.l1, 8.1, 1.8);
  // vertical brass-light reveals on the stone ends (the "gold line" of the reference at night)
  k.box('none', 'led', -5.3, Y.l1 + 0.05, 7.0, -5.22, 8.05, 7.04);
  k.box('none', 'led', 9.22, Y.l1 + 0.05, 7.0, 9.3, 8.05, 7.04);
  k.box('none', 'led', -9.08, Y.plinth + 0.05, 5.25, -9.0, 4.05, 5.29);
  k.box('none', 'led', 12.96, Y.l1 + 0.05, 7.0, 13.0, 8.05, 7.04);
  k.box('none', 'led', 2.55, 1.0, -8.27, 2.6, 14.6, -8.22);
  k.box('none', 'led', -1.0, 1.0, -8.27, -0.95, 14.6, -8.22);
  // left: sliding glass to the west terrace
  k.box('mass', 'stone', -7.3, Y.l1, -5, -7, 8.1, -2);
  k.box('mass', 'stone', -7.3, Y.l1, 5.4, -7, 8.1, 7);
  k.glazing('glass', 'x', -2, 5.4, -7.15, Y.l1, 8.1, 1.85);
  // back with ribbon window
  k.box('mass', 'stone', -7, Y.l1, -5.3, 13, 5.5, -5);
  k.box('mass', 'stone', -7, 7.3, -5.3, 13, 8.1, -5);
  k.box('mass', 'stone', -7, 5.5, -5.3, -4, 7.3, -5);
  k.box('mass', 'stone', 6, 5.5, -5.3, 13, 7.3, -5);
  k.glazing('glass', 'z', -4, 6, -5.15, 5.5, 7.3, 1.25);
  // back: teak screen over the stone east of the ribbon window + warm LED reveals under the slab edges
  finsZ(k, 6.3, 12.8, -5.45, Y.l1, 8.1, 0.3, 0.22);
  k.box('none', 'led', -7.0, 4.065, -5.2, 13.2, 4.08, -5.06);
  k.box('none', 'led', -7.0, 8.085, -5.2, 13.2, 8.1, -5.06);
  k.box('none', 'led', -11.3, 12.085, -6.48, 4.0, 12.1, -6.36);
  // GF west: teak screen between the slot windows
  finsX(k, -5.8, -3.2, -11.42, Y.plinth, 4.1, 0.3, 0.2);
  finsX(k, -2.2, 0.8, -11.42, Y.plinth, 4.1, 0.3, 0.2);
  // right with a tall window
  k.box('mass', 'stone', 13, Y.l1, -5, 13.3, 8.1, 1);
  k.box('mass', 'stone', 13, Y.l1, 6, 13.3, 8.1, 7);
  k.box('mass', 'stone', 13, 7.6, 1, 13.3, 8.1, 6);
  k.glazing('glass', 'x', 1, 6, 13.15, Y.l1, 7.6, 1.25);
  // L1 interior (living + dining)
  k.box('none', 'interiorFloor', -6.95, Y.l1, -4.95, 12.95, Y.l1 + 0.02, 6.7);
  k.box('none', 'ceiling', -6.95, 8.04, -4.95, 12.95, 8.08, 6.7);
  k.box('none', 'interiorWall', -6.2, Y.l1, -1.6, 12.2, 8.04, -1.3); // back partition
  // backlit shelving
  for (let i = 0; i < 6; i++) {
    const x0 = -5.6 + i * 1.25;
    k.box('none', 'wood', x0, Y.l1 + 0.4, -1.3, x0 + 0.06, 7.7, -0.9);
    for (let j = 0; j < 4; j++) {
      k.box('none', 'wood', x0, Y.l1 + 0.9 + j * 0.8, -1.3, x0 + 1.25, Y.l1 + 0.94 + j * 0.8, -0.9);
      k.box('none', 'led', x0 + 0.08, Y.l1 + 0.89 + j * 0.8, -1.0, x0 + 1.18, Y.l1 + 0.9 + j * 0.8, -0.94);
    }
  }
  k.box('none', 'fabric', -3.2, Y.l1 + 0.02, 0.8, 3.2, Y.l1 + 0.04, 5.2);
  sofa(k, 0, Y.l1, 2.0, 4.2, 0);
  sofa(k, -2.6, Y.l1, 3.6, 2.4, -Math.PI / 2, 'fabricDark');
  chair(k, 2.6, Y.l1, 4.6, Math.PI * 1.2);
  chair(k, 1.4, Y.l1, 5.0, Math.PI);
  roundTable(k, 0, Y.l1, 3.6, 0.7, 0.36);
  floorLamp(k, -2.6, Y.l1, 1.6, 1.75);
  wash(k, 'y', 0, Y.l1 + 0.06, 3.4, 6.0, 4.6);
  wash(k, 'y', 7.2, Y.l1 + 0.06, 3.2, 4.6, 3.0);
  wash(k, 'y', -2.6, Y.l1 + 0.07, 1.6, 2.4, 2.4);
  for (const x of [-4.2, 0.2, 4.6, 9.0]) wash(k, 'z', x, 6.5, -0.85, 4.2, 3.8);
  wash(k, 'down', 0.5, 8.01, 3.2, 8.5, 6.0);
  wash(k, 'down', 7.2, 8.01, 3.2, 5.0, 3.5);
  sideTable(k, 2.5, Y.l1, 2.1);
  art(k, 4.6, 6.3, -1.3, 2.2, 1.4, 'wood');
  k.geo('none', 'led', new THREE.TorusGeometry(2.6, 0.035, 6, 96), [0.5, 8.0, 3.2], [Math.PI / 2, 0, 0], [1.5, 1, 1]);
  ringLight(k, 0, 7.2, 3.5, 1.1);
  ringLight(k, 0, 6.95, 3.5, 0.7);
  // dining
  table(k, 7.2, Y.l1, 3.2, 3.0, 1.1, 0.76, 'wood');
  for (const dx of [-1, 0, 1]) {
    chair(k, 7.2 + dx * 0.9, Y.l1, 2.3, 0);
    chair(k, 7.2 + dx * 0.9, Y.l1, 4.1, Math.PI);
  }
  k.box('none', 'glow', 5.9, 6.6, 3.15, 8.5, 6.64, 3.25); // linear pendant
  k.box('none', 'steel', 5.9, 6.64, 3.12, 8.5, 6.7, 3.28);
  plant(k, -6.2, Y.l1, 6.0, 2.4);
  plant(k, 12.2, Y.l1, 6.0, 2.2);
  plant(k, 4.6, Y.l1, 6.1, 1.6);
  curtain(k, -5.1, -3.6, Y.l1 + 0.05, 8.0, 6.45);
  curtain(k, 9.5, 11.0, Y.l1 + 0.05, 8.0, 6.45);
  curtain(k, 3.6, 4.6, Y.l1 + 0.05, 8.0, 6.5);

  // L1 roof = L2 east terrace (x 3..13)
  k.box('mass', 'plaster', -7.05, 8.1, -5.05, 13.35, 8.5, 7.35);
  k.box('none', 'led', -7.0, 8.085, 7.2, 13.3, 8.1, 7.3);
  k.box('none', 'deck', 3.0, 8.5, -5.0, 13.3, 8.56, 7.3);
  balustrade(k, 'z', 3.0, 13.3, 7.25, 8.56);
  balustrade(k, 'x', -5.0, 7.3, 13.28, 8.56);
  planter(k, 'mass', 10.6, -4.6, 12.9, -1.2, 8.56, 0.7);
  planter(k, 'mass', 3.4, -4.6, 6.6, -3.6, 8.56, 0.5);
  sofa(k, 8.5, 8.56, 3.4, 3.0, Math.PI, 'fabric');
  roundTable(k, 8.5, 8.56, 2.2, 0.5, 0.35);
  lounger(k, 5.0, 8.56, 2.5, 0.2);

  // ═════════ LEVEL 2 (x −10..3, z −5.5..4.5) — master suite behind teak fins ═════════
  vol(-10, Y.l2, -5.5, 3, 12.1, 4.5);
  k.box('mass', 'plaster', -10.05, 8.12, -5.55, -7.0, 8.52, 4.55); // cantilever floor over the west terrace
  k.box('none', 'led', -10.0, 8.105, 4.4, -7.0, 8.12, 4.5);
  k.glazing('glass', 'z', -10, 3, 4.4, Y.l2, 12.1, 2.0);
  finsZ(k, -9.85, -1.2, 4.85, Y.l2, 12.1, 0.3, 0.3);
  k.box('fins', 'steel', -10, 12.0, 4.6, -1.0, 12.1, 5.05);
  k.box('fins', 'steel', -10, Y.l2, 4.6, -1.0, Y.l2 + 0.1, 5.05);
  // left: fins too (the view from the west is the cantilever)
  k.glazing('glass', 'x', -5.5, 4.5, -10.0, Y.l2, 12.1, 2.0);
  finsX(k, -5.3, 4.3, -10.45, Y.l2, 12.1, 0.3, 0.3);
  // back
  k.box('mass', 'stone', -10, Y.l2, -5.8, 3, 9.4, -5.5);
  k.box('mass', 'stone', -10, 11.2, -5.8, 3, 12.1, -5.5);
  for (const [a, b] of [[-10, -8], [-6.6, -4.4], [-3, -1]] as const) k.box('mass', 'stone', a, 9.4, -5.8, b, 11.2, -5.5);
  k.glazing('glass', 'z', -8, -6.6, -5.65, 9.4, 11.2, 1.4);
  k.glazing('glass', 'z', -4.4, -3, -5.65, 9.4, 11.2, 1.4);
  // right (x=3) to the terrace
  k.box('mass', 'stone', 3, Y.l2, -5.5, 3.3, 12.1, -3);
  k.glazing('glass', 'x', -3, 4.5, 3.15, Y.l2, 12.1, 1.85);
  // L2 interior
  k.box('none', 'interiorFloor', -9.9, Y.l2, -5.45, 2.95, Y.l2 + 0.02, 4.3);
  k.box('none', 'ceiling', -9.9, 12.05, -5.45, 2.95, 12.08, 4.3);
  k.box('none', 'interiorWall', -9.6, Y.l2, -2.2, 2.6, 12.05, -1.9);
  k.box('none', 'wood', -7.6, Y.l2, -1.9, -2.4, 10.4, -1.8); // headboard wall
  k.box('none', 'led', -7.6, 10.4, -1.8, -2.4, 10.44, -1.7);
  k.box('none', 'fabricDark', -6.2, Y.l2, -1.8, -3.8, Y.l2 + 0.38, 0.4); // bed base
  k.box('none', 'fabric', -6.1, Y.l2 + 0.38, -1.75, -3.9, Y.l2 + 0.6, 0.35); // mattress
  k.boxC('none', 'fabric', -5.55, Y.l2 + 0.72, -1.5, 0.8, 0.26, 0.2, -0.3, 0, 0);
  k.boxC('none', 'fabric', -4.45, Y.l2 + 0.72, -1.5, 0.8, 0.26, 0.2, -0.3, 0, 0);
  k.box('none', 'fabricDark', -6.15, Y.l2 + 0.6, -0.4, -3.85, Y.l2 + 0.63, 0.38); // throw
  for (const x of [-6.8, -3.2]) {
    k.box('none', 'wood', x - 0.3, Y.l2, -1.75, x + 0.3, Y.l2 + 0.5, -1.25);
    k.geo('none', 'glow', new THREE.SphereGeometry(0.16, 16, 12), [x, Y.l2 + 1.5, -1.45]);
  }
  k.box('none', 'fabric', -7.2, Y.l2 + 0.02, -1.6, -2.8, Y.l2 + 0.04, 2.4);
  wash(k, 'z', -5.0, 10.6, -1.68, 6.0, 3.2);
  wash(k, 'y', -5.0, Y.l2 + 0.07, 0.6, 5.0, 4.0);
  wash(k, 'down', -4.0, 12.02, 0.5, 8.0, 5.5);
  chair(k, 0.6, Y.l2, 2.8, Math.PI * 0.8);
  plant(k, 1.9, Y.l2, 3.6, 2.0);
  curtain(k, -1.0, 0.6, Y.l2 + 0.05, 12.0, 4.1);
  curtain(k, -9.6, -8.4, Y.l2 + 0.05, 12.0, 4.1);

  // ═════════ ROOF (slab + infinity pool + deck + pergola) ═════════
  k.box('roof', 'plaster', -11.0, 12.1, -6.5, 4.0, Y.roof, 5.5);
  k.box('none', 'led', -10.95, 12.085, 5.36, 3.95, 12.1, 5.46);
  // pool basin (mosaic walls) — inner x −9..1.6, z 1.2..5.3
  k.box('pool', 'mosaic', -9.2, Y.roof, 1.0, 1.8, Y.roof + 0.05, 5.5); // floor
  k.box('pool', 'mosaic', -9.2, Y.roof, 1.0, 1.8, Y.deck + 0.2, 1.2); // back wall
  k.box('pool', 'mosaic', -9.2, Y.roof, 1.2, -9.0, Y.deck + 0.2, 5.5);
  k.box('pool', 'mosaic', 1.6, Y.roof, 1.2, 1.8, Y.deck + 0.2, 5.5);
  k.box('pool', 'darkStone', -9.25, 12.08, 5.3, 1.85, Y.water - 0.01, 5.56); // overflow lip (dark honed basalt band)
  k.box('pool', 'plaster', -9.27, Y.roof, 0.93, -9.2, Y.deck + 0.2, 5.56); // outer skins
  k.box('pool', 'plaster', 1.8, Y.roof, 0.93, 1.87, Y.deck + 0.2, 5.56);
  k.box('pool', 'plaster', -9.3, Y.deck + 0.2, 0.95, 1.9, Y.deck + 0.25, 1.25); // coping
  k.box('pool', 'plaster', -9.3, Y.deck + 0.2, 1.25, -8.95, Y.deck + 0.25, 5.52);
  k.box('pool', 'plaster', 1.55, Y.deck + 0.2, 1.25, 1.9, Y.deck + 0.25, 5.52);
  for (let i = 0; i < 4; i++) k.box('pool', 'glowCool', -7.5 + i * 2.6, Y.roof + 0.35, 1.2, -7.1 + i * 2.6, Y.roof + 0.45, 1.24); // underwater lights
  // deck around
  k.box('none', 'deck', -10.9, Y.roof, -6.4, 3.9, Y.deck, 1.0);
  k.box('none', 'deck', -10.9, Y.roof, 1.0, -9.2, Y.deck, 5.45);
  k.box('none', 'deck', 1.8, Y.roof, 1.0, 3.9, Y.deck, 5.45);
  balustrade(k, 'x', -6.4, 5.45, -10.92, Y.deck);
  balustrade(k, 'x', -6.4, 5.45, 3.92, Y.deck);
  balustrade(k, 'z', -10.9, -1.1, -6.42, Y.deck);
  balustrade(k, 'z', 2.7, 3.9, -6.42, Y.deck);
  lounger(k, -1.6, Y.deck, -0.6, Math.PI);
  lounger(k, -0.4, Y.deck, -0.6, Math.PI);
  lounger(k, 0.8, Y.deck, -0.6, Math.PI);
  // pergola over the lounge
  for (const x of [-10.5, -4.0]) for (const z of [-6.0, -1.2]) k.box('roof', 'steel', x - 0.07, Y.deck, z - 0.07, x + 0.07, 15.9, z + 0.07);
  k.box('roof', 'steel', -10.6, 15.8, -6.1, -3.9, 15.95, -5.9);
  k.box('roof', 'steel', -10.6, 15.8, -1.3, -3.9, 15.95, -1.1);
  for (let x = -10.4; x <= -4.1; x += 0.36) k.box('roof', 'wood', x - 0.04, 15.95, -6.3, x + 0.04, 16.17, -0.9, x);
  k.box('none', 'led', -10.6, 15.78, -1.25, -3.9, 15.8, -1.15);
  sofa(k, -7.2, Y.deck, -5.2, 4.2, 0, 'fabric');
  sofa(k, -9.6, Y.deck, -3.3, 2.2, -Math.PI / 2, 'fabricDark');
  roundTable(k, -7.0, Y.deck, -3.4, 0.6, 0.35);
  planter(k, 'none', 2.2, -6.2, 3.8, -4.6, Y.deck, 0.55);

  // ═════════ STAIR CORE (back, rises above the roof) ═════════
  vol(-1, Y.plinth, -8.2, 2.6, 15.0, -5.5);
  k.box('mass', 'stone', -1, Y.plinth, -8.2, 2.6, 15.0, -7.9, 0.5);
  k.box('mass', 'stone', -1, Y.plinth, -8.2, -0.7, 15.0, -6.0, 0.5);
  k.box('mass', 'stone', 2.3, Y.plinth, -8.2, 2.6, 15.0, -6.0, 0.5);
  k.box('mass', 'plaster', -1.15, 15.0, -8.35, 2.75, 15.25, -5.4);
  k.glazing('glass', 'z', 0.2, 1.4, -8.25, 1.0, 14.6, 0.6, null, 0.05);
  // core door onto the roof deck
  k.box('mass', 'stone', -1, Y.deck, -6.0, -0.2, 15.0, -5.7);
  k.box('mass', 'stone', 1.7, Y.deck, -6.0, 2.6, 15.0, -5.7);
  k.box('mass', 'stone', -0.2, 15.0 - 0.6, -6.0, 1.7, 15.0, -5.7);
  k.box('none', 'interiorWall', -0.7, Y.deck, -7.9, 2.3, 15.0, -7.85);
  k.box('none', 'interiorFloor', -0.7, Y.deck, -7.9, 2.3, Y.deck + 0.02, -6.0);

  return { parts: k.build(), edges };
}
