/**
 * The whole beauty storyboard as a PURE function of scroll progress p (0..1) — scrolling back restores every pose.
 * v2 maps the v1 beats (same marks, same easing windows) onto the amber dropper serum:
 *   0.00 Hero        bottle centred, giant word behind, citrus slices + water splash framing it
 *   0.25 Unveil      slices part, splash retracts, the ribbed collar unscrews and the dropper lifts (pipette out)
 *   0.50 Actives     bottle tilts + turns, five actives orbit with anchored callouts
 *   0.75 Craft       layer separation: dropper out & set beside the bottle, bulb off the collar, label sleeve off the glass
 *   1.00 Ritual      reassembled on a pedestal with the splash + an orange half, word back at full ink
 */
import { clamp, easeInOutCubic, range } from '../../lib/math';

const ease = easeInOutCubic;
const bell = (a: number, b: number, c: number, d: number, p: number) => ease(range(a, b, p)) * (1 - ease(range(c, d, p)));

export interface Pose {
  /** foreground citrus + bokeh part (v1 leafPart) */
  slicePart: number;
  /** water splash amount (1 hero, 0 mid-story, 1 again at the ritual) */
  splash: number;
  /** dropper assembly offset from its seated pose (bottle-local units) */
  dropperY: number;
  dropperX: number;
  dropperTilt: number;
  dropperTwist: number;
  /** bulb separation from the collar */
  bulbLift: number;
  /** label sleeve separation from the glass */
  labelSep: number;
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
  // collar unscrews 9–26 % (v1 cap window), screws back on 83.5–93 % once the dropper is above the neck again
  const reseat = 1 - ease(range(0.835, 0.93, p));
  const lift = ease(range(0.09, 0.26, p)) * reseat;
  // craft: dropper rises until the pipette tip clears the neck, THEN slides beside the bottle (and back in reverse)
  const up = bell(0.56, 0.655, 0.835, 0.93, p);
  const side = bell(0.625, 0.72, 0.775, 0.83, p);
  const explode = bell(0.58, 0.73, 0.8, 0.93, p);
  const tilt = bell(0.28, 0.48, 0.56, 0.7, p);
  const finalK = ease(range(0.8, 0.97, p));
  const part = ease(range(0.015, 0.21, p));
  return {
    slicePart: part,
    splash: 1 - part * (1 - ease(range(0.84, 0.99, p))),
    // the drop beside the bottle is quadratic in `side` → the tip stays above the lip until it is clear of the neck
    dropperY: lift * 0.42 + up * 0.7 - side * side * 0.5,
    dropperX: side * 0.66,
    dropperTilt: -side * 0.16,
    dropperTwist: -lift * 2.2 - up * 0.6,
    // the bulb only separates once the dropper is set beside the bottle (keeps the stack inside the frame)
    bulbLift: side * 0.17,
    labelSep: bell(0.6, 0.7, 0.8, 0.88, p),
    jarYaw: -0.32 + ease(range(0.25, 0.52, p)) * 0.95 - ease(range(0.55, 0.75, p)) * 0.55 - finalK * 0.1,
    jarRoll: -0.15 * tilt,
    jarPitch: 0.1 * tilt,
    jarLift: 0.2 * tilt,
    jarX: -0.1 * finalK,
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
