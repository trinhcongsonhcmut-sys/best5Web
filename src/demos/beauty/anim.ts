/**
 * The whole beauty storyboard as a PURE function of scroll progress p (0..1) — scrolling back restores every pose.
 *   0.00 Hero        jar centred, giant word behind, aloe blades framing the foreground
 *   0.25 Unveil      blades part, the ribbed cap unscrews and lifts → whipped cream swirl
 *   0.50 Botanicals  jar tilts + turns, five ingredients orbit with anchored callouts
 *   0.75 Craft       layer separation: cap — cream — glass body, close 3/4 view
 *   1.00 Ritual      reassembled on a plinth next to the dropper serum, word back at full ink
 */
import { clamp, easeInOutCubic, range } from '../../lib/math';

const ease = easeInOutCubic;
const bell = (a: number, b: number, c: number, d: number, p: number) => ease(range(a, b, p)) * (1 - ease(range(c, d, p)));

export interface Pose {
  leafPart: number;
  capLift: number;
  capTwist: number;
  jarYaw: number;
  jarRoll: number;
  jarPitch: number;
  jarLift: number;
  jarX: number;
  ingredients: number;
  orbitAngle: number;
  callouts: number;
  explode: number;
  details: number;
  word: number;
  plinth: number;
  serum: number;
}

export function pose(pRaw: number): Pose {
  const p = clamp(pRaw, 0, 1);
  const reseat = 1 - ease(range(0.8, 0.94, p));
  const lift = ease(range(0.09, 0.26, p)) * reseat;
  const explode = bell(0.58, 0.73, 0.8, 0.93, p);
  const tilt = bell(0.28, 0.48, 0.56, 0.7, p);
  const finalK = ease(range(0.8, 0.97, p));
  return {
    leafPart: ease(range(0.015, 0.21, p)),
    capLift: lift * 0.36 + explode * 0.62,
    capTwist: -lift * 2.2 - explode * 0.6,
    jarYaw: -0.32 + ease(range(0.25, 0.52, p)) * 0.95 - ease(range(0.55, 0.75, p)) * 0.55 - finalK * 0.18,
    jarRoll: -0.15 * tilt,
    jarPitch: 0.1 * tilt,
    jarLift: 0.2 * tilt,
    jarX: -0.06 * finalK,
    ingredients: bell(0.3, 0.44, 0.6, 0.69, p),
    orbitAngle: (p - 0.5) * 2.6,
    callouts: bell(0.4, 0.46, 0.57, 0.63, p),
    explode,
    details: bell(0.68, 0.73, 0.79, 0.83, p),
    word: 1 - 0.84 * ease(range(0.06, 0.24, p)) + 0.84 * ease(range(0.84, 0.98, p)),
    plinth: finalK,
    serum: ease(range(0.84, 0.99, p)),
  };
}
