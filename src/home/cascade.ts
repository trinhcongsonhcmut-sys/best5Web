/**
 * Cascade pose maths — pure functions, no DOM.
 *
 * Every card has a signed depth `d = index − pos` (pos is the animated, fractional index of the front card):
 *   d = 0   front card, full size
 *   d > 0   behind: climbs up the stack, shrinks, darkens, finally fades out (only ~3 strips are visible)
 *   d < 0   already passed: tips onto the "floor" below the stack and fades away
 *
 * All offsets are in units of the card height H so the same curve works at any screen size.
 * Cards pivot on their bottom edge (transform-origin 50% 100%), so `y` is derived from where the *top* edge should land.
 */

export interface Pose {
  x: number;
  y: number;
  z: number;
  /** rotateX in degrees (card tipping onto the floor) */
  rx: number;
  s: number;
  o: number;
  /** dark overlay 0‥1 — depth shading */
  veil: number;
  /** 1 only for the front card — drives the info block */
  front: number;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Distance (in H) from the front card's top edge up to the top edge of the card at depth d. Geometric: 0.42, 0.57, 0.63, … */
const T = (d: number) => 0.656 * (1 - Math.pow(0.36, d));
const SHRINK = 0.885;
export const STACK_EXTENT = 1.65; // total height of the visible stack, in H

/**
 * Vertical offset (in H) of the front card from the stage centre. The visible stack above the front card is
 * T(remaining) tall, so shifting the front card down by half of that keeps the whole stack centred — and the
 * last card (nothing behind it) sits dead centre instead of leaving a hole above it.
 */
export const baseY = (remaining: number) => T(clamp(remaining, 0, 4)) / 2;

export function poseFor(d: number, H: number): Pose {
  if (d >= 0) {
    const s = Math.pow(SHRINK, d);
    return {
      x: 0,
      y: -(T(d) + 1 - s) * H,
      z: -2 * d,
      rx: 0,
      s,
      o: d <= 3 ? 1 : clamp(4 - d, 0, 1),
      veil: clamp(0.11 * d, 0, 0.5),
      front: clamp(1 - d * 2.2, 0, 1),
    };
  }
  const t = clamp(-d, 0, 1.2);
  return {
    x: 0,
    y: 1.12 * H * Math.pow(t, 1.35),
    z: 4 + 6 * t,
    rx: 74 * Math.pow(t, 1.15),
    s: 1 - 0.1 * t,
    o: 1 - clamp((t - 0.5) / 0.5, 0, 1),
    veil: 0.4 * t,
    front: clamp(1 + d * 2.2, 0, 1),
  };
}

/** Card size for a stage of the given pixel size. Cards are 5:4. */
export function cardSize(stageW: number, stageH: number): { w: number; h: number } {
  const w = Math.min(600, 0.84 * stageW, (0.9 * stageH * 1.25) / STACK_EXTENT);
  return { w, h: w / 1.25 };
}
