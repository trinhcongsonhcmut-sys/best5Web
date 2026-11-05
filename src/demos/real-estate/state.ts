/** Pure functions of scroll progress + tiny module state shared between the WebGL root and the DOM overlay. */
import { clamp, smoothstep } from '../../lib/math';

/** 0 = blue-hour dusk, 1 = full night. Pure function of p → scrolling back restores the light exactly. */
export const nightOf = (p: number) => smoothstep(0.06, 0.92, p);

/** Level rail (top → bottom). `pos` = slot index 0..4, `p` = scroll progress that frames that level. */
export const LEVELS = [
  { id: 'overview', label: 'Overview', short: 'OV', p: 1 },
  { id: 'rooftop', label: 'Rooftop', short: 'RF', p: 0.75 },
  { id: 'level2', label: 'Level 2', short: 'L2', p: 0.62 },
  { id: 'level1', label: 'Level 1', short: 'L1', p: 0.5 },
  { id: 'ground', label: 'Ground', short: 'G', p: 0.25 },
] as const;

/**
 * Continuous rail position (0 = Overview at top … 4 = Ground at bottom) as a function of p.
 * 0% starts on Overview (aerial), dives to Ground, climbs L1 → L2 → Rooftop, lifts back to Overview.
 */
const RAIL: [number, number][] = [
  [0, 0], [0.06, 0], [0.25, 4], [0.36, 4], [0.5, 3], [0.62, 2], [0.75, 1], [0.84, 1], [1, 0],
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
