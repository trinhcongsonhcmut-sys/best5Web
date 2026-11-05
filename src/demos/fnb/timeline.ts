/**
 * Scroll choreography for /fnb — every value is a PURE function of scroll progress p (0..1),
 * so scrolling back restores the exact state.
 *
 *  0.00  cafe hero      — cup floats centre, beans scattered far in depth
 *  0.25  slow roast     — beans orbit the cup, cup turns, steam rises
 *  0.36–0.56 transition — beans become a horizontal corkscrew "wind", cup lifts away,
 *                         background wipes espresso → burgundy, fork + pasta twirl drop in over an empty plate
 *  0.75  ingredient ballet — pasta unwinds into a floating helix, prawns/mussels/tomatoes/basil orbit it
 *  1.00  the dish       — everything falls into a plated nest; high-angle final frame on cream
 */
import * as THREE from 'three';
import { smoothstep } from '../../lib/math';
import type { PoseStop } from '../../lib/math';

export const PLATE_Y = -0.45;
export const PLATE_FLOOR = PLATE_Y + 0.044;

export const STOPS: PoseStop[] = [
  { t: 0, pos: [0, 0.18, 5.4], target: [0, 0.02, 0], fov: 30 },
  { t: 0.25, pos: [2.25, 0.85, 3.9], target: [0, 0.1, 0], fov: 31 },
  { t: 0.5, pos: [0.15, 0.95, 4.3], target: [0.15, 0.22, 0], fov: 35 },
  { t: 0.75, pos: [-3.2, 1.05, 3.25], target: [0, 0.62, 0], fov: 36 },
  { t: 1, pos: [0.0, 2.05, 3.55], target: [0, -0.33, 0], fov: 28 },
];

/** cafe → restaurant scene mix (drives lights, background wipe, bridge.extra.scene) */
export const sceneMix = (p: number) => smoothstep(0.42, 0.56, p);

export const cupExit = (p: number) => smoothstep(0.34, 0.48, p);
export const plateIn = (p: number) => smoothstep(0.41, 0.52, p);
export const pastaIn = (p: number) => smoothstep(0.42, 0.5, p);
export const forkOut = (p: number) => smoothstep(0.555, 0.64, p);
export const pastaUnwind = (p: number) => smoothstep(0.55, 0.69, p);
export const pastaNest = (p: number) => smoothstep(0.8, 0.965, p);
export const helixRot = (p: number) => 0.4 + (Math.min(p, 0.82) - 0.5) * 7.0;
export const labelsOn = (p: number) => smoothstep(0.66, 0.71, p) * (1 - smoothstep(0.79, 0.83, p));

/** lens shift (fraction of viewport width) that pushes the subject right of the copy on landscape screens */
export const lensShift = (p: number) => 0.13 * smoothstep(0.55, 0.65, p) * (1 - smoothstep(0.82, 0.93, p));

export const TWIRL_POS = new THREE.Vector3(-0.05, 0.62, 0.2);
/** the fork twirl is the hero of the 50% mark → shown larger than life */
export const TWIRL_S = 1.75;

/* Background palette keyframes (sRGB). cafe: inner/outer radial; restaurant: inner/outer radial. */
type Key = [number, string, string];
const CAFE: Key[] = [
  [0, '#4a2615', '#170802'],
  [0.25, '#a8652f', '#3e1d0a'],
  [0.45, '#c07c40', '#5a2c12'],
];
const REST: Key[] = [
  [0.45, '#7e2b1e', '#300f09'],
  [0.62, '#76281b', '#36110b'],
  [0.73, '#f3ede0', '#ddd0b4'],
  [1, '#f4eee2', '#d9cbae'],
];

const ca = new THREE.Color();
const cb = new THREE.Color();
function sample(keys: Key[], p: number, which: 1 | 2, out: THREE.Color) {
  if (p <= keys[0][0]) return out.set(keys[0][which]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0] = keys[i];
    const [t1] = keys[i + 1];
    if (p <= t1) {
      const f = smoothstep(t0, t1, p);
      ca.set(keys[i][which]);
      cb.set(keys[i + 1][which]);
      return out.copy(ca).lerp(cb, f);
    }
  }
  return out.set(keys[keys.length - 1][which]);
}

export function backdropColors(p: number, cafeIn: THREE.Color, cafeOut: THREE.Color, restIn: THREE.Color, restOut: THREE.Color) {
  sample(CAFE, p, 1, cafeIn);
  sample(CAFE, p, 2, cafeOut);
  sample(REST, p, 1, restIn);
  sample(REST, p, 2, restOut);
}

/** light theme (dark ink) once the cream background has taken over */
export const isLightTheme = (p: number) => p > 0.665;

/* Glaze variants (cup + saucer + plate share one ceramic recipe). */
export const GLAZES = [
  { id: 'cream', label: 'Cream glaze', swatch: '#efe3d0', color: '#efe3d0', roughness: 0.32, clearcoat: 1, env: 1, sheen: 0.15, restK: 1, spec: 1 },
  { id: 'matte-black', label: 'Matte black', swatch: '#2b2623', color: '#1c1918', roughness: 0.66, clearcoat: 0.15, env: 0.3, sheen: 0, restK: 0.62, spec: 0.3 },
  { id: 'terracotta', label: 'Terracotta', swatch: '#b5523a', color: '#b5523a', roughness: 0.5, clearcoat: 0.35, env: 0.6, sheen: 0, restK: 0.74, spec: 0.45 },
] as const;
