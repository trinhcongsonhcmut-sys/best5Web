/**
 * Hover helpers for /fnb.
 *  - hoverResets: every hover target registers its "pointer out"; FnbScene calls them on pointerup / cancel / leave /
 *    scroll so a hover can never stay latched (pointer capture during an orbit drag swallows R3F's pointerout,
 *    and touch has no pointer to leave with).
 *  - glazeRim: keeps the hover light a thin, glaze-tinted Fresnel edge whose strength scales with the glaze
 *    brightness, so a Matte Black plate stays black while hovered.
 */
import * as THREE from 'three';
import type { RimUniforms } from '../../lib/rim';

export const hoverResets = new Set<() => void>();

const warmEdge = new THREE.Color('#ffd0a0');

/** call AFTER useHoverRim has written uRim this frame */
export function glazeRim(mat: THREE.MeshPhysicalMaterial, u: RimUniforms, hover: number, lift: number) {
  const c = mat.color;
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; // linear
  const k = 0.25 + 0.75 * Math.min(1, lum * 1.6);
  u.uRim.value *= k;
  u.uRimPower.value = 4.2; // edge band only
  u.uRimColor.value.copy(c).lerp(warmEdge, 0.55);
  mat.emissiveIntensity = hover * lift * k * k;
}
