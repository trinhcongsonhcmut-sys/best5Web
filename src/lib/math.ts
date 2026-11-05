import * as THREE from 'three';

export type Vec3 = [number, number, number];

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Maps v from [a,b] to 0..1 (clamped) — handy to carve a sub-range out of the 0..1 scroll progress. */
export const range = (a: number, b: number, v: number) => clamp((v - a) / (b - a), 0, 1);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Frame-rate independent exponential smoothing. lambda ≈ 4 (lazy) … 14 (snappy). */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/**
 * Smooth camera path through keyframes placed at scroll progress `t` (0..1).
 * Uses a centripetal Catmull-Rom spline so the camera never stops dead at a keyframe while scrubbing.
 */
export interface PoseStop {
  t: number;
  pos: Vec3;
  target: Vec3;
  fov?: number;
}

export function buildPoseSampler(stops: PoseStop[], defaultFov = 35) {
  const sorted = [...stops].sort((a, b) => a.t - b.t);
  const mk = (pick: (s: PoseStop) => Vec3) =>
    new THREE.CatmullRomCurve3(sorted.map((s) => new THREE.Vector3(...pick(s))), false, 'centripetal');
  const posC = mk((s) => s.pos);
  const tgtC = mk((s) => s.target);
  const fovC = mk((s) => [s.fov ?? defaultFov, 0, 0]);
  const n = sorted.length;
  const tmp = new THREE.Vector3();
  const toU = (p: number) => {
    const pp = clamp(p, 0, 1);
    if (pp <= sorted[0].t) return 0;
    if (pp >= sorted[n - 1].t) return 1;
    let i = 0;
    while (i < n - 2 && pp > sorted[i + 1].t) i++;
    const f = (pp - sorted[i].t) / (sorted[i + 1].t - sorted[i].t);
    return (i + f) / (n - 1);
  };
  return (p: number, outPos: THREE.Vector3, outTarget: THREE.Vector3) => {
    const u = toU(p);
    posC.getPoint(u, outPos);
    tgtC.getPoint(u, outTarget);
    fovC.getPoint(u, tmp);
    return tmp.x; // fov
  };
}

export const stageIndex = (p: number) => Math.min(4, Math.max(0, Math.round(p * 4)));
export const STAGE_NAMES = ['Opening Hero', 'First Reveal', 'Transformation', 'Detail & Material', 'Final Frame'] as const;

export const isCoarsePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
