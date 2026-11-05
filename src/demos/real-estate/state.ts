/** Pure functions of scroll progress + tiny module state shared between the WebGL root and the DOM overlay. */
import * as THREE from 'three';
import { clamp, smoothstep } from '../../lib/math';

/** low golden-hour sun from the left, grazing the façade (rakes the stone, long shadows across the lawn) */
export const SUN_DIR = new THREE.Vector3(-0.96, 0.13, 0.22).normalize();
/** afterglow / warm rim direction: low behind the house, just right of centre in the hero frame */
export const GLOW_DIR = new THREE.Vector3(-0.12, 0.2, -0.97).normalize();
/**
 * HDRI yaw: belfast_sunset_puresky has its sun at u ≈ 0.684 (φ = atan2(z, x) ≈ 66°); materials look the
 * environment up with R_y(−rot)·dir, so rot = φ_hdri − φ_sun puts the photographed sun behind SUN_DIR.
 */
export const ENV_ROT = THREE.MathUtils.degToRad(66) - Math.atan2(SUN_DIR.z, SUN_DIR.x);

/** 0 = blue-hour dusk, 1 = full night. Pure function of p → scrolling back restores the light exactly. */
export const nightOf = (p: number) => smoothstep(0.06, 0.92, p);

/** Level rail (top → bottom). `pos` = slot index 0..4, `p` = scroll progress that frames that level. */
export const LEVELS = [
  { id: 'overview', label: 'Overview', short: 'OV', p: 1 },
  { id: 'roof', label: 'Roof', short: 'RF', p: 0.75 },
  { id: 'suite', label: 'Suite', short: 'ST', p: 0.62 },
  { id: 'level1', label: 'Level 1', short: 'L1', p: 0.5 },
  { id: 'ground', label: 'Ground', short: 'G', p: 0.25 },
] as const;

/**
 * Continuous rail position (0 = Overview at top … 4 = Ground at bottom) as a function of p.
 * 0% starts on Overview (hero over the lawn), dives to Ground, climbs Level 1 → Suite → Roof, lifts back to Overview.
 */
const RAIL: [number, number][] = [
  [0, 0], [0.12, 0], [0.25, 4], [0.36, 4], [0.5, 3], [0.62, 2], [0.75, 1], [0.84, 1], [1, 0],
];
export function railOf(p: number) {
  const q = clamp(p, 0, 1);
  for (let i = 0; i < RAIL.length - 1; i++) {
    const [a, va] = RAIL[i];
    const [b, vb] = RAIL[i + 1];
    if (q <= b) return va + (vb - va) * smoothstep(0, 1, (q - a) / (b - a || 1));
  }
  return 0;
}

/** dusk clock shown in the HUD: 18:05 → 21:40 */
export function clockOf(p: number) {
  const mins = 18 * 60 + 5 + Math.round(clamp(p, 0, 1) * 215);
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/** live key/hemisphere light (colour × intensity), mirrored for the vertex-lit foliage shader */
export const lightState = {
  sun: new THREE.Color(),
  sky: new THREE.Color(),
  ground: new THREE.Color(),
};

/** hover label bridge (WebGL root → DOM). The scene writes, the overlay element reads. */
export const hoverUi = {
  el: null as HTMLDivElement | null,
  part: null as string | null,
  x: 0,
  y: 0,
};

/** camera collision volumes, filled by the scene (spheres: x,y,z,r · boxes: AABB min/max) */
export const colliders = {
  spheres: [] as [number, number, number, number][],
  boxes: [] as { min: [number, number, number]; max: [number, number, number] }[],
};
