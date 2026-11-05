/**
 * The villa (v2 — "cantilevered frame" house of the founder's reference), described in metres.
 * Ground y = 0, terrace paving top 0.2. Front faces +z.
 *
 *   Main frame A (x −12.4 … 4.6): GF 0.2 → 3.5 · slab 3.5–4.1 (charcoal fascia, 2.2 m cantilever) · L1 4.1 → 7.2 ·
 *     roof 7.2–7.8 (deep overhang) · roof terrace + raised infinity pool + stone chimney on top.
 *   Stair hall (x 4.6 … 6.0): glazed, screened by tall black steel slats.
 *   Wing B (x 5.9 … 13.8): GF garage (warm timber door) · slab 3.5–4.1 · L1 4.1 → 6.9 · roof 6.9–7.4.
 * Light-stone block piers, warm timber panels, floor-to-ceiling glass, frameless glass balcony railings, recessed
 * soffit downlights throwing scallops down the piers, warm interiors.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Kit, type MatKey, type Part } from './kit';

/** soft upholstery block (rounded edges) — cached per size */
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

export const Y = {
  terrace: 0.2,
  gfCeil: 3.5,
  l1: 4.1,
  l1Ceil: 7.2,
  roof: 7.8,
  bCeil: 6.9,
  bRoof: 7.4,
  deck: 7.86,
  poolTop: 8.36,
  water: 8.28,
};

// ───────── furniture helpers ─────────

function table(k: Kit, x: number, y: number, z: number, w: number, d: number, h: number, top: MatKey = 'darkStone') {
  k.box('none', top, x - w / 2, y + h - 0.05, z - d / 2, x + w / 2, y + h, z + d / 2);
  k.box('none', 'steel', x - w / 2 + 0.1, y, z - 0.04, x - w / 2 + 0.16, y + h - 0.05, z + 0.04);
  k.box('none', 'steel', x + w / 2 - 0.16, y, z - 0.04, x + w / 2 - 0.1, y + h - 0.05, z + 0.04);
}

function roundTable(k: Kit, x: number, y: number, z: number, r: number, h: number) {
  k.geo('none', 'darkStone', new THREE.CylinderGeometry(r, r, 0.06, 32), [x, y + h, z]);
  k.geo('none', 'brass', new THREE.CylinderGeometry(r * 0.55, r * 0.6, h - 0.03, 24), [x, y + (h - 0.03) / 2, z]);
}

function chair(k: Kit, x: number, y: number, z: number, ry: number, seat: MatKey = 'fabric') {
  const c = Math.cos(ry), s = Math.sin(ry);
  k.geo('none', seat, rounded(0.5, 0.1, 0.5, 0.04), [x, y + 0.47, z], [0, ry, 0]);
  k.geo('none', seat, rounded(0.5, 0.5, 0.08, 0.035), [x - 0.22 * s, y + 0.76, z - 0.22 * c], [-0.12, ry, 0]);
  for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
    const px = x + lx * c + lz * s, pz = z - lx * s + lz * c;
    k.boxC('none', 'steel', px, y + 0.21, pz, 0.025, 0.42, 0.025, 0, ry, 0);
  }
}



function curtain(k: Kit, axis: 'x' | 'z', a0: number, a1: number, y0: number, y1: number, at: number) {
  const w = a1 - a0;
  const g = new THREE.PlaneGeometry(w, y1 - y0, Math.max(8, Math.round(w * 10)), 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9) * 0.05);
  g.computeVertexNormals();
  if (axis === 'z') k.geo('none', 'curtain', g, [(a0 + a1) / 2, (y0 + y1) / 2, at]);
  else k.geo('none', 'curtain', g, [at, (y0 + y1) / 2, (a0 + a1) / 2], [0, Math.PI / 2, 0]);
}

function floorLamp(k: Kit, x: number, y: number, z: number, h = 1.6) {
  k.geo('none', 'darkStone', new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), [x, y + 0.02, z]);
  k.geo('none', 'brass', new THREE.CylinderGeometry(0.014, 0.014, h, 6), [x, y + h / 2, z]);
  k.geo('none', 'curtain', new THREE.CylinderGeometry(0.2, 0.24, 0.3, 24, 1, true), [x, y + h, z]);
  k.geo('none', 'glow', new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), [x, y + h - 0.14, z]);
}

function art(k: Kit, cx: number, cy: number, z: number, w: number, h: number) {
  k.box('none', 'brass', cx - w / 2 - 0.03, cy - h / 2 - 0.03, z, cx + w / 2 + 0.03, cy + h / 2 + 0.03, z + 0.03);
  k.box('none', 'fabricDark', cx - w / 2, cy - h / 2, z + 0.03, cx + w / 2, cy + h / 2, z + 0.045);
  k.box('none', 'fabric', cx - w * 0.3, cy - h * 0.15, z + 0.046, cx + w * 0.05, cy + h * 0.3, z + 0.05);
}

/** a soft additive light card: floor pool (axis 'y'), wall wash facing +z ('z') or ceiling glow ('down') */
function wash(k: Kit, axis: 'y' | 'z' | 'down', x: number, y: number, z: number, w: number, h: number) {
  const g = new THREE.PlaneGeometry(w, h);
  const rot: [number, number, number] = axis === 'y' ? [-Math.PI / 2, 0, 0] : axis === 'down' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  k.geo('none', 'wash', g, [x, y, z], rot);
}

/**
 * recessed soffit downlight at (x, ySoffit, z) + the scallop it throws on the wall face at zWall (facing +z) and
 * a soft pool on the floor at yFloor
 */
function downlight(k: Kit, x: number, ySoffit: number, z: number, zWall: number | null, yFloor: number | null, reach = 2.6) {
  k.geo('none', 'glow', new THREE.CylinderGeometry(0.055, 0.055, 0.012, 14), [x, ySoffit - 0.006, z]);
  k.geo('none', 'darkStone', new THREE.CylinderGeometry(0.085, 0.085, 0.008, 14), [x, ySoffit - 0.002, z]);
  if (zWall !== null) {
    const h = Math.min(reach, ySoffit - (yFloor ?? 0) - 0.02);
    k.geo('none', 'scallop', new THREE.PlaneGeometry(1.3, h), [x, ySoffit - h / 2, zWall + 0.012]);
  }
  if (yFloor !== null) k.geo('none', 'wash', new THREE.PlaneGeometry(1.8, 1.8), [x, yFloor + 0.012, z - 0.2], [-Math.PI / 2, 0, 0]);
}

/** frameless glass balustrade with a slim steel base shoe */
function railing(k: Kit, axis: 'x' | 'z', a0: number, a1: number, at: number, y: number, h = 1.05) {
  if (axis === 'z') {
    k.box('glass', 'glass', a0, y, at - 0.012, a1, y + h, at + 0.012);
    k.box('glass', 'steel', a0, y, at - 0.04, a1, y + 0.07, at + 0.04);
  } else {
    k.box('glass', 'glass', at - 0.012, y, a0, at + 0.012, y + h, a1);
    k.box('glass', 'steel', at - 0.04, y, a0, at + 0.04, y + 0.07, a1);
  }
}

function lounger(k: Kit, x: number, y: number, z: number, ry: number) {
  const c = Math.cos(ry), s = Math.sin(ry);
  k.boxC('none', 'darkStone', x, y + 0.22, z, 0.68, 0.1, 1.6, 0, ry, 0);
  k.boxC('none', 'fabric', x, y + 0.31, z + 0.15 * c, 0.62, 0.08, 1.15, 0, ry, 0);
  k.boxC('none', 'fabric', x - 0.62 * s, y + 0.5, z - 0.62 * c, 0.62, 0.08, 0.6, -0.7, ry, 0);
}

export interface EdgeBox {
  min: [number, number, number];
  max: [number, number, number];
}

export function buildVilla() {
  const k = new Kit();
  const edges: EdgeBox[] = [];
  const vol = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => edges.push({ min: [x0, y0, z0], max: [x1, y1, z1] });
  const T = Y.terrace;

  // ═════════ TERRACE PAVING (plinth under the house + the long front terrace) ═════════
  k.box('none', 'paving', -12.9, 0, -6.6, 14.4, T, 8.8);
  k.box('none', 'darkStone', -12.95, T - 0.03, 8.74, 14.45, T + 0.004, 8.86); // shadow-gap nosing

  // ═════════ MAIN FRAME A — GROUND FLOOR (x −11.5 … 3.6, z −5.6 … 4.0) ═════════
  vol(-11.5, T, -5.6, 3.6, Y.gfCeil, 4.0);
  // front (z ≈ 4.0, recessed 2.2 m under the cantilever): pier · timber · glass · pier · timber · glass · pier
  k.box('mass', 'stone', -11.5, T, 3.7, -10.2, Y.gfCeil, 4.15);
  k.box('fins', 'wood', -10.2, T, 3.82, -8.95, Y.gfCeil, 3.96);
  k.glazing('glass', 'z', -8.95, -3.35, 3.9, T, Y.gfCeil, 1.9);
  k.box('mass', 'stone', -3.35, T, 3.7, -2.1, Y.gfCeil, 4.15);
  k.box('fins', 'wood', -2.1, T, 3.82, -0.95, Y.gfCeil, 3.96);
  k.glazing('glass', 'z', -0.95, 2.5, 3.9, T, Y.gfCeil, 1.15);
  k.box('mass', 'stone', 2.5, T, 3.7, 3.6, Y.gfCeil, 4.15);
  // left side (x −11.5): stone with a full-height slot window
  k.box('mass', 'stone', -11.75, T, -5.6, -11.5, Y.gfCeil, -1.6);
  k.box('mass', 'stone', -11.75, T, -0.4, -11.5, Y.gfCeil, 4.15);
  k.glazing('glass', 'x', -1.6, -0.4, -11.62, T, Y.gfCeil, 1.2);
  // back (z −5.6): stone with a ribbon window
  k.box('mass', 'stone', -11.75, T, -5.85, 3.6, 1.2, -5.6);
  k.box('mass', 'stone', -11.75, 2.9, -5.85, 3.6, Y.gfCeil, -5.6);
  k.box('mass', 'stone', -11.75, 1.2, -5.85, -8.5, 2.9, -5.6);
  k.box('mass', 'stone', -1.5, 1.2, -5.85, 3.6, 2.9, -5.6);
  k.glazing('glass', 'z', -8.5, -1.5, -5.72, 1.2, 2.9, 1.75);
  // sheer drapes just inside every back / side window (folds + soft glow instead of a flat orange wall)
  curtain(k, 'z', -8.45, -1.55, 1.22, 2.88, -5.55);
  curtain(k, 'x', -1.58, -0.42, T + 0.05, Y.gfCeil - 0.06, -11.45);

  // GF interior: living (west) + dining/kitchen (east)
  k.box('none', 'interiorFloor', -11.45, T, -5.55, 3.55, T + 0.02, 3.85);
  k.box('none', 'ceiling', -11.45, Y.gfCeil - 0.04, -5.55, 3.55, Y.gfCeil, 3.85);
  k.box('none', 'interiorWall', -11.2, T, -1.9, 3.3, Y.gfCeil - 0.04, -1.6);
  k.box('none', 'wood', -8.2, T, -1.6, -4.0, Y.gfCeil - 0.04, -1.5); // timber feature wall
  k.box('none', 'led', -8.2, Y.gfCeil - 0.1, -1.5, -4.0, Y.gfCeil - 0.06, -1.42);
  k.box('none', 'fabric', -8.6, T + 0.02, -0.8, -3.6, T + 0.04, 2.8); // rug
  roundTable(k, -6.0, T, 1.1, 0.55, 0.36);
  floorLamp(k, -8.3, T, -1.0);
  art(k, -1.4, 1.9, -1.6, 1.5, 1.0);
  wash(k, 'y', -6.0, T + 0.05, 1.0, 5.0, 4.0);
  for (const x of [-9.8, -6.1, -2.4, 1.3]) wash(k, 'z', x, 2.1, -1.48, 3.2, 3.0);
  wash(k, 'down', -5.0, Y.gfCeil - 0.06, 1.0, 9.0, 5.0);
  // dining
  table(k, 0.8, T, 1.2, 2.4, 1.0, 0.76, 'wood');
  for (const dx of [-0.75, 0, 0.75]) {
    chair(k, 0.8 + dx, T, 0.4, 0);
    chair(k, 0.8 + dx, T, 2.0, Math.PI);
  }
  wash(k, 'y', 0.8, T + 0.05, 1.2, 4.0, 2.8);
  curtain(k, 'z', -10.15, -9.0, T + 0.05, Y.gfCeil - 0.06, 3.7);

  // ═════════ MAIN FRAME A — cantilever slab, LEVEL 1, roof ═════════
  k.box('roof', 'fascia', -12.4, Y.gfCeil, -6.1, 4.6, Y.l1, 6.2); // L1 slab (2.2 m cantilever)
  vol(-11.4, Y.l1, -5.4, 4.2, Y.l1Ceil, 4.4);
  // L1 front (z 4.4): stone pier · glass · timber · glass · timber
  k.box('mass', 'stone', -11.4, Y.l1, 4.15, -10.2, Y.l1Ceil, 4.6);
  k.glazing('glass', 'z', -10.2, -4.6, 4.4, Y.l1, Y.l1Ceil, 1.9);
  k.box('fins', 'wood', -4.6, Y.l1, 4.28, -3.0, Y.l1Ceil, 4.42);
  k.glazing('glass', 'z', -3.0, 3.0, 4.4, Y.l1, Y.l1Ceil, 2.0);
  k.box('fins', 'wood', 3.0, Y.l1, 4.28, 4.2, Y.l1Ceil, 4.42);
  // balcony: frameless glass railing along the slab edge
  railing(k, 'z', -11.95, 4.15, 6.02, Y.l1);
  railing(k, 'x', 2.7, 6.02, -11.95, Y.l1);
  // end plates of the frame (charcoal) — the left one stops short of the balcony so the corner stays open
  k.box('roof', 'fascia', -12.4, Y.l1, -6.1, -12.0, Y.l1Ceil, 2.6);
  k.box('roof', 'fascia', 4.2, Y.l1, -6.1, 4.6, Y.l1Ceil, 6.2);
  // L1 left side (x −11.4): stone, slot window
  k.box('mass', 'stone', -11.65, Y.l1, -5.4, -11.4, Y.l1Ceil, -2.4);
  k.box('mass', 'stone', -11.65, Y.l1, -1.0, -11.4, Y.l1Ceil, 4.6);
  k.glazing('glass', 'x', -2.4, -1.0, -11.52, Y.l1, Y.l1Ceil, 1.4);
  curtain(k, 'x', -2.38, -1.02, Y.l1 + 0.05, Y.l1Ceil - 0.06, -11.35);
  // L1 back (z −5.4): stone, two windows
  k.box('mass', 'stone', -11.65, Y.l1, -5.65, 4.2, 5.0, -5.4);
  k.box('mass', 'stone', -11.65, 6.6, -5.65, 4.2, Y.l1Ceil, -5.4);
  for (const [a, b] of [[-11.65, -9], [-6, -3.5], [0.5, 4.2]] as const) k.box('mass', 'stone', a, 5.0, -5.65, b, 6.6, -5.4);
  k.glazing('glass', 'z', -9, -6, -5.52, 5.0, 6.6, 1.5);
  k.glazing('glass', 'z', -3.5, 0.5, -5.52, 5.0, 6.6, 1.35);
  curtain(k, 'z', -8.95, -6.05, 5.02, 6.58, -5.36);
  curtain(k, 'z', -3.45, 0.45, 5.02, 6.58, -5.36);
  // L1 interior: master suite (west) + lounge (east)
  k.box('none', 'interiorFloor', -11.35, Y.l1, -5.35, 4.15, Y.l1 + 0.02, 4.3);
  k.box('none', 'ceiling', -11.35, Y.l1Ceil - 0.04, -5.35, 4.15, Y.l1Ceil, 4.3);
  k.box('none', 'interiorWall', -11.2, Y.l1, -1.4, 4.0, Y.l1Ceil - 0.04, -1.1);
  k.box('none', 'wood', -9.0, Y.l1, -1.1, -5.0, 5.9, -1.0); // headboard wall
  k.box('none', 'led', -9.0, 5.9, -1.0, -5.0, 5.94, -0.92);
  k.box('none', 'fabricDark', -8.2, Y.l1, -1.0, -5.8, Y.l1 + 0.38, 1.2); // bed
  k.box('none', 'fabric', -8.1, Y.l1 + 0.38, -0.95, -5.9, Y.l1 + 0.6, 1.15);
  k.boxC('none', 'fabric', -7.55, Y.l1 + 0.72, -0.7, 0.8, 0.26, 0.2, -0.3, 0, 0);
  k.boxC('none', 'fabric', -6.45, Y.l1 + 0.72, -0.7, 0.8, 0.26, 0.2, -0.3, 0, 0);
  k.box('none', 'fabricDark', -8.15, Y.l1 + 0.6, 0.4, -5.85, Y.l1 + 0.63, 1.18);
  for (const x of [-8.8, -5.2]) {
    k.box('none', 'wood', x - 0.3, Y.l1, -0.95, x + 0.3, Y.l1 + 0.5, -0.45);
    k.geo('none', 'glow', new THREE.SphereGeometry(0.15, 16, 12), [x, Y.l1 + 1.4, -0.7]);
  }
  wash(k, 'z', -7.0, 6.0, -0.9, 5.4, 2.6);
  wash(k, 'y', -7.0, Y.l1 + 0.05, 1.2, 5.0, 4.0);
  roundTable(k, 0.0, Y.l1, 2.0, 0.6, 0.34);
  floorLamp(k, -2.2, Y.l1, 0.2, 1.7);
  art(k, 0.0, 5.9, -1.1, 2.0, 1.2);
  for (const x of [-9.4, -5.6, -1.8, 2.0]) wash(k, 'z', x, 5.6, -0.98, 3.4, 3.0);
  wash(k, 'down', -3.5, Y.l1Ceil - 0.06, 1.4, 14.0, 5.0);
  wash(k, 'y', 0.0, Y.l1 + 0.05, 1.6, 5.0, 3.6);
  curtain(k, 'z', -10.15, -9.1, Y.l1 + 0.05, Y.l1Ceil - 0.06, 4.2);
  curtain(k, 'z', 2.0, 2.95, Y.l1 + 0.05, Y.l1Ceil - 0.06, 4.2);

  // roof slab A (deep overhang over the balcony) + light roof pavers on top (set back from the fascia edge)
  k.box('roof', 'fascia', -12.4, Y.l1Ceil, -6.1, 4.6, Y.roof, 6.2);
  k.box('roof', 'paving', -12.1, Y.roof, -5.8, 4.3, Y.roof + 0.03, 5.9);

  // soffit downlights: under the L1 cantilever (scallops down the GF piers / timber, pools on the terrace)
  // and under the roof overhang (scallops down the L1 pier / timber panels)
  // x → face the scallop lands on (pier fronts 4.15 / 4.6, timber fronts 3.96 / 4.42), null = over glass
  const GF_WALL: Record<number, number | null> = { [-10.85]: 4.15, [-9.6]: 3.96, [-7.6]: null, [-5.4]: null, [-2.75]: 4.15, [-1.55]: 3.96, [0.6]: null, [3.05]: 4.15 };
  for (const [x, zw] of Object.entries(GF_WALL)) downlight(k, Number(x), Y.gfCeil, 5.2, zw, T, 2.8);
  const L1_WALL: Record<number, number | null> = { [-10.8]: 4.6, [-8.4]: null, [-6.0]: null, [-3.8]: 4.42, [-1.2]: null, [1.4]: null, [3.6]: 4.42 };
  for (const [x, zw] of Object.entries(L1_WALL)) downlight(k, Number(x), Y.l1Ceil, 5.4, zw, Y.l1, 2.4);

  // ═════════ ROOF TERRACE A (deck, raised infinity pool, chimney) ═════════
  k.box('none', 'deck', -9.8, Y.roof, -5.4, 3.6, Y.deck, 3.4);
  railing(k, 'z', -9.8, 3.6, -5.38, Y.deck);
  railing(k, 'x', -5.38, 3.4, -9.8, Y.deck);
  railing(k, 'x', -5.38, 3.4, 3.6, Y.deck);
  // pool basin (inner x −6.3 … 2.3, z −1.8 … 1.6), walls rise to poolTop
  k.box('pool', 'mosaic', -6.5, Y.deck, -2.0, 2.5, Y.deck + 0.06, 1.8); // floor
  k.box('pool', 'mosaic', -6.5, Y.deck, -2.0, 2.5, Y.poolTop, -1.8); // back wall
  k.box('pool', 'mosaic', -6.5, Y.deck, -1.8, -6.3, Y.poolTop, 1.8);
  k.box('pool', 'mosaic', 2.3, Y.deck, -1.8, 2.5, Y.poolTop, 1.8);
  k.box('pool', 'darkStone', -6.55, Y.deck, 1.6, 2.55, Y.water - 0.01, 1.85); // overflow lip (dark honed band)
  k.box('pool', 'paving', -6.6, Y.deck, -2.08, -6.5, Y.poolTop, 1.85); // outer skins
  k.box('pool', 'paving', 2.5, Y.deck, -2.08, 2.6, Y.poolTop, 1.85);
  k.box('pool', 'paving', -6.6, Y.deck, -2.1, 2.6, Y.poolTop, -2.0);
  k.box('pool', 'paving', -6.65, Y.poolTop, -2.15, 2.65, Y.poolTop + 0.05, -1.75); // coping
  k.box('pool', 'paving', -6.65, Y.poolTop, -1.75, -6.25, Y.poolTop + 0.05, 1.82);
  k.box('pool', 'paving', 2.25, Y.poolTop, -1.75, 2.65, Y.poolTop + 0.05, 1.82);
  for (let i = 0; i < 4; i++) k.box('pool', 'glowCool', -5.2 + i * 2.3, Y.deck + 0.25, -1.8, -4.8 + i * 2.3, Y.deck + 0.33, -1.76);
  // warm LED line under the coping + deck uplights along the railings (the roof reads at night)
  k.box('none', 'led', -6.62, Y.poolTop - 0.06, 1.86, 2.62, Y.poolTop - 0.02, 1.9);
  for (const x of [-9.3, -6.9, -4.5, -2.1, 0.3, 2.7]) {
    k.box('none', 'darkStone', x - 0.07, Y.deck, -5.22, x + 0.07, Y.deck + 0.42, -5.08);
    k.box('none', 'glow', x - 0.05, Y.deck + 0.36, -5.08, x + 0.05, Y.deck + 0.4, -5.07);
    k.geo('none', 'wash', new THREE.PlaneGeometry(1.6, 1.6), [x, Y.deck + 0.012, -4.6], [-Math.PI / 2, 0, 0]);
  }
  lounger(k, -3.6, Y.deck, -3.6, Math.PI);
  lounger(k, -2.4, Y.deck, -3.6, Math.PI);
  lounger(k, -1.2, Y.deck, -3.6, Math.PI);
  roundTable(k, -6.9, Y.deck, -3.9, 0.45, 0.34);
  // chimney (light stone, charcoal cap)
  vol(-11.2, Y.roof, 1.3, -10.0, 9.5, 2.5);
  k.box('mass', 'stone', -11.2, Y.roof, 1.3, -10.0, 9.5, 2.5);
  k.box('roof', 'fascia', -11.3, 9.5, 1.2, -9.9, 9.62, 2.6);

  // ═════════ STAIR HALL (x 4.6 … 6.0) screened by tall black slats ═════════
  vol(4.6, T, -4.6, 6.0, 7.4, 2.8);
  k.glazing('glass', 'z', 4.6, 6.0, 2.8, T, 7.3, 1.4, 3.8);
  k.box('roof', 'fascia', 4.45, 7.3, -4.8, 6.1, 7.55, 3.5);
  k.box('mass', 'stone', 4.6, T, -4.8, 6.0, 7.3, -4.6);
  for (let x = 4.68; x <= 5.95; x += 0.13) k.box('fins', 'steel', x - 0.025, T, 3.08, x + 0.025, 7.3, 3.2);
  k.box('none', 'interiorWall', 4.65, T, -4.55, 5.95, 7.25, -4.45);
  k.box('none', 'ceiling', 4.62, 7.25, -4.55, 5.98, 7.3, 2.75);
  for (let i = 0; i < 18; i++) k.box('none', 'darkStone', 4.7, T + i * 0.4, -3.8 + i * 0.32, 5.9, T + i * 0.4 + 0.05, -3.5 + i * 0.32); // floating treads
  k.box('none', 'led', 5.92, T + 0.1, -4.4, 5.96, 7.2, -4.36);

  // ═════════ WING B (x 5.9 … 13.8) — garage + upper suite ═════════
  vol(6.0, T, -5.0, 13.0, Y.gfCeil, 3.4);
  // GF front (z 3.4): glazed entry · pier · timber garage door · pier
  k.glazing('glass', 'z', 6.0, 7.2, 3.3, T, Y.gfCeil, 1.2);
  k.box('mass', 'stone', 7.2, T, 3.15, 7.8, Y.gfCeil, 3.55);
  k.box('fins', 'wood', 7.8, T, 3.25, 12.2, 2.85, 3.38);
  k.box('none', 'darkStone', 7.8, 2.85, 3.2, 12.2, 2.9, 3.38);
  k.box('mass', 'stone', 7.8, 2.9, 3.15, 12.2, Y.gfCeil, 3.55);
  k.box('mass', 'stone', 12.2, T, 3.15, 13.0, Y.gfCeil, 3.55);
  k.box('mass', 'stone', 12.75, T, -5.0, 13.0, Y.gfCeil, 3.4);
  k.box('mass', 'stone', 6.0, T, -5.25, 13.0, Y.gfCeil, -5.0);
  k.box('none', 'interiorWall', 6.05, T, -1.0, 7.15, Y.gfCeil - 0.04, -0.9);
  k.box('none', 'ceiling', 6.05, Y.gfCeil - 0.04, -4.95, 12.7, Y.gfCeil, 3.25);
  k.box('none', 'interiorFloor', 6.05, T, -4.95, 7.2, T + 0.02, 3.25);
  wash(k, 'z', 6.6, 2.0, -0.88, 1.2, 2.8);
  // B slab, L1, roof
  k.box('roof', 'fascia', 5.9, Y.gfCeil, -5.4, 13.8, Y.l1, 5.0);
  vol(6.2, Y.l1, -5.2, 13.3, Y.bCeil, 3.2);
  k.glazing('glass', 'z', 6.2, 8.0, 3.2, Y.l1, Y.bCeil, 1.8);
  k.box('fins', 'wood', 8.0, Y.l1, 3.08, 9.4, Y.bCeil, 3.22);
  k.glazing('glass', 'z', 9.4, 13.3, 3.2, Y.l1, Y.bCeil, 2.0);
  railing(k, 'z', 5.95, 13.4, 4.82, Y.l1);
  k.box('roof', 'fascia', 13.4, Y.l1, -5.4, 13.8, Y.bCeil, 5.0);
  k.box('roof', 'fascia', 5.9, Y.l1, -5.4, 6.2, Y.bCeil, 1.2);
  k.box('mass', 'stone', 6.2, Y.l1, -5.45, 13.4, Y.bCeil, -5.2);
  k.box('mass', 'stone', 13.05, Y.l1, -5.2, 13.4, Y.bCeil, 3.2);
  k.box('roof', 'fascia', 5.9, Y.bCeil, -5.4, 13.8, Y.bRoof, 5.0);
  k.box('roof', 'paving', 6.2, Y.bRoof, -5.1, 13.5, Y.bRoof + 0.03, 4.7);
  // B upper interior (study / guest suite)
  k.box('none', 'interiorFloor', 6.25, Y.l1, -5.15, 13.0, Y.l1 + 0.02, 3.1);
  k.box('none', 'ceiling', 6.25, Y.bCeil - 0.04, -5.15, 13.0, Y.bCeil, 3.1);
  k.box('none', 'interiorWall', 6.3, Y.l1, -1.6, 13.0, Y.bCeil - 0.04, -1.3);
  table(k, 7.6, Y.l1, 0.4, 1.8, 0.8, 0.75, 'wood');
  chair(k, 7.6, Y.l1, -0.4, 0);
  floorLamp(k, 9.2, Y.l1, -0.9, 1.6);
  art(k, 11.0, 5.7, -1.3, 1.8, 1.0);
  for (const x of [7.4, 10.0, 12.4]) wash(k, 'z', x, 5.4, -1.28, 2.8, 2.6);
  wash(k, 'down', 9.6, Y.bCeil - 0.06, 0.8, 6.5, 4.0);
  wash(k, 'y', 10.5, Y.l1 + 0.05, 0.6, 4.0, 3.0);
  curtain(k, 'z', 12.1, 13.0, Y.l1 + 0.05, Y.bCeil - 0.06, 3.0);
  for (const x of [6.7, 8.7, 10.6, 12.6]) downlight(k, x, Y.gfCeil, 4.3, x === 12.6 ? 3.55 : x === 6.7 ? null : 3.38, T, 2.6);
  for (const x of [7.0, 8.7, 11.0, 13.0]) downlight(k, x, Y.bCeil, 4.2, x === 8.7 ? 3.22 : null, Y.l1, 2.2);

  // ═════════ TERRACE FURNITURE (outdoor lounge + dining, under the cantilever) ═════════
  k.box('none', 'darkStone', -6.0, T, 6.9, -4.4, T + 0.32, 7.6); // low table
  table(k, 0.9, T, 5.7, 2.2, 0.9, 0.74, 'wood');
  for (const dx of [-0.7, 0, 0.7]) {
    chair(k, 0.9 + dx, T, 5.0, 0, 'darkStone');
    chair(k, 0.9 + dx, T, 6.4, Math.PI, 'darkStone');
  }

  return { parts: k.build(), edges };
}
