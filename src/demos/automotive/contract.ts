import { Vector3 } from 'three';
import type { PoseStop, Vec3 } from '../../lib/math';

/**
 * Scene contract — the ONE source of the numbers the realtime scene and the Blender/Cycles test scene must share
 * (camera storyboard, sun, HDRI rotation, lights, tone). `automotive-flagship/tools/make-contract.mjs` reads this
 * module (plus the live rig) from the dev server and writes `automotive-flagship/contract/scene-contract.json`.
 * Pure data + pure functions only (no React) so the generator can import it.
 */

/** low golden-hour sun, just right of the hero frame and behind the car (back-light + rim) */
export const SUN = new Vector3(-0.15, 0.13, -1).normalize();

/*
 * Camera storyboard = v1 (hero 3/4 front low → side profile → high 3/4 reveal → rear 3/4 → final), re-framed for a
 * 4.36 m GT (v1 truck: 6.15 m): offsets ×0.72, targets lowered to the car's height.
 */
export const CAMERA_STOPS: PoseStop[] = [
  { t: 0, pos: [4.75, 0.9, 8.15], target: [0.12, 0.92, 0], fov: 27 },
  { t: 0.25, pos: [0.2, 0.68, 9.25], target: [0.12, 0.74, 0], fov: 27 },
  { t: 0.5, pos: [5.3, 3.95, 6.85], target: [0.05, 1.02, 0], fov: 30 },
  { t: 0.625, pos: [-1.75, 2.05, 8.6], target: [-0.2, 0.86, 0], fov: 29 }, // a touch lower than v1 so the .03 copy lands on sky, not asphalt
  { t: 0.75, pos: [-6.05, 1.55, 4.95], target: [-0.32, 0.8, 0], fov: 27 },
  { t: 0.875, pos: [-0.45, 0.98, 8.95], target: [0, 0.8, 0], fov: 28 },
  { t: 1, pos: [6.1, 0.62, 6.3], target: [0.15, 0.84, 0], fov: 29 },
];
/** far > dome radius + the portrait pull-back (far 400 clipped the dome on phones → the "orange disc" behind the title) */
export const CAMERA = { defaultFov: 28, fitAspect: 1.5, near: 0.05, far: 1200 };

/** Portrait screens: same shots, pulled back further and the subject lowered under the copy block. */
export function stopsFor(aspect: number): PoseStop[] {
  if (aspect >= 1.05) return CAMERA_STOPS;
  // the GT is wider than the v1 truck (2.5 m with mirrors) → a little more pull-back to keep it ~90 % of a phone's width
  const k = aspect < 0.7 ? 1.1 : 1.08;
  const lift = aspect < 0.7 ? 0.78 : 0.45;
  return CAMERA_STOPS.map((s) => {
    const off = [s.pos[0] - s.target[0], s.pos[1] - s.target[1], s.pos[2] - s.target[2]];
    const target: Vec3 = [s.target[0], s.target[1] + lift, s.target[2]];
    return { ...s, target, pos: [target[0] + off[0] * k, target[1] + off[1] * k - lift * 0.4, target[2] + off[2] * k] as Vec3 };
  });
}

/** Approved CC0 HDRI with terrain (Poly Haven evening_road_01) + where its sun sits in the panorama (measured). */
export const WORLD = {
  hdri: '/assets/hdri/evening_road_01_2k.hdr',
  /** u of the brightest pixel (sun) in the source panorama — measured in Blender: u = 0.5959, v = 0.5552 */
  hdriSunU: 0.596,
  /** GroundedSkybox: height of the HDRI camera above its ground (m) and dome radius */
  skyHeight: 1.9,
  skyRadius: 380,
};
/**
 * three equirect convention: u = atan2(z, x) / 2π + 0.5. The graded panorama is sampled at fract(u + uOff) so the
 * photo's sun lands on SUN's azimuth. (Blender: same u after the (x, y, z) → (x, −z, y) axis swap ⇒ rotate the world
 * by −2π·uOff about Blender Z.)
 */
export const hdriOffset = () => WORLD.hdriSunU - (Math.atan2(SUN.z, SUN.x) / (2 * Math.PI) + 0.5);

/** asphalt road strip (CC0 asphalt_02) and dusty shoulder disc, both in the car frame (three units = metres) */
export const ROAD = { len: 150, w: 9.6, z: -0.5, tile: 2.6 };
export const GROUND = { radius: 80, fade: [16, 46] as [number, number], color: '#7a6656' };
/** Cycles shadow-catcher bake of the road under the car (three x/z centre + square size, metres) → bake/road-shadow.png */
export const SHADOW_BAKE = { cx: 0.75, cz: 4.4, size: 12 };
export const SHRUB_URLS = ['/assets/models/polyhaven/shrub_03/shrub_03_lite.glb', '/assets/models/polyhaven/shrub_04/shrub_04_lite.glb'];

/**
 * Light grade of the REAL photo (no repainted sky) — applied identically by World.tsx (GPU, once) and by
 * automotive-flagship/blender/build_scene.py (numpy), in the panorama's own pixel space:
 *   src = HDRI with the roadside sign patched (u in sign.u, v in sign.v ← u − sign.shift), sampled at fract(u + uOff)
 *   c   = max(L + (src − L) · saturation, 0) · gain                                  → visible backdrop (dome)
 *   ibl = min(c, cap) + horizon band (thin bright line just above the horizon, all round, stronger toward the sun)
 * The radiance cut off by `cap` is integrated (W/m², per channel) and becomes the directional sun → no double sun.
 */
export const GRADE = {
  gain: [1.1, 1.0, 0.88] as Vec3,
  saturation: 1.08,
  cap: 3.0,
  horizon: { amount: 2.4, elev: 0.028, width: 0.012, color: [1.0, 0.86, 0.7] as Vec3 },
  sign: { u: [0.744, 0.766] as [number, number], v: [0.43, 0.535] as [number, number], shift: 0.03 },
};

export const LIGHTS = {
  /** directional sun along SUN: intensity + colour are MEASURED from the graded HDRI above the cap (World.tsx) */
  sun: { distance: 30 },
  /** soft sky-bounce key from the camera side (keeps the flank and nose readable) — realtime-only IBL compensation */
  fill: { position: [7, 6, 9] as Vec3, intensity: 0.1, color: '#fff1e2' },
};
/** fog only blends the far road ends into the photo horizon (colour measured from the sky band at runtime) */
export const FOG = { color: '#b9a593', near: 150, far: 900 };
export const TONE = { mapping: 'neutral' as 'aces' | 'neutral' | 'agx', exposure: 1.0, background: '#b9a593' };
