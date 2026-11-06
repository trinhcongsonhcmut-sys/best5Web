import { DefaultLoadingManager } from 'three';

export { SUN } from './contract';

/** Per-frame scene state derived ONLY from scroll progress (pure function of p → reversible). */
export const anim = {
  p: 0,
  /** 0..1 overall ".02" reveal envelope (drives the shadow cross-fade + QC readout) */
  explode: 0,
  /** reveal sub-beats, each 0..1 (staggered so the car opens / closes in sequence) */
  doors: 0,
  wheelsOut: 0,
  lift: 0,
  clams: 0,
  /** metres of virtual travel (road scroll + wheel roll) */
  roll: 0,
  /** 0..1 tail-light signature */
  rear: 0,
  /** 0..1 headlight / DRL beat */
  glow: 0,
  /** 0..1 ".01" driving beat (wheels spin, road slides, dust trails) */
  drive: 0,
};

/** Wheel centre / radius of the GLB car (metres, car frame: nose +X, ground y = 0) — filled once the model is rigged. */
export const carDims = {
  wheelR: 0.384,
  frontX: 1.25,
  rearX: -1.55,
  trackZ: 0.98,
  noseX: 2.18,
  tailX: -2.18,
};

/** GLB → car frame (filled by buildRig): world = T(offset) · Ry(rotY) · glb. Exported into the scene contract. */
export const carFrame = { rotY: Math.PI / 2, offset: [0, 0, 0] as [number, number, number] };

/**
 * Readiness gate: the GLB finishes DOWNLOADING (loading manager idle → Stage's probe could flag `ready`) well before it
 * is parsed, mounted, its contact shadow baked and its shaders compiled. We hold one item open on three's default
 * loading manager (the one drei's useProgress watches) until the car is really on screen.
 */
const GATE = 'axiom-gt:scene';
let gateOpen = false;
export function holdReady() {
  if (gateOpen) return;
  gateOpen = true;
  DefaultLoadingManager.itemStart(GATE);
}
export function releaseReady() {
  if (!gateOpen) return;
  gateOpen = false;
  DefaultLoadingManager.itemEnd(GATE);
}
