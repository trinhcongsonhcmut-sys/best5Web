/**
 * Shared scene ↔ DOM bridge for this demo (R3F <Canvas> is a separate React root, so a module singleton is used).
 * Scene components write live world positions; the anchor projector writes DOM callout transforms directly.
 */
import * as THREE from 'three';

/** hero jar scale (A1: jar ≈ 44 % of the frame width) */
export const JS = 1.25;

/** first frames: every mesh is drawn once so all shader programs compile before `ready` (no hitch mid-scroll) */
export const warm = { frames: 0, get on() { return this.frames < 6; } };

export const rig = {
  jarCenter: new THREE.Vector3(0, 0.5 * JS, 0),
  capCenter: new THREE.Vector3(0, 0.75 * JS, 0),
  creamCenter: new THREE.Vector3(0, 0.45 * JS, 0),
  bodyCenter: new THREE.Vector3(0, 0.32 * JS, 0),
  /** world positions of the five orbiting ingredients */
  ingredients: Array.from({ length: 5 }, () => new THREE.Vector3()),
  /** hover amount per ingredient (0..1) — callouts brighten with it */
  ingHover: [0, 0, 0, 0, 0],
  /** jar hover (drives the soft halo) */
  jarHover: 0,
  /** one-shot assembly intro (cap from above, body from below) — 0 → 1 after the scene is ready */
  intro: 0,
};

/** DOM elements registered by the overlay (callback refs). */
export const calloutEls: { ing: (HTMLElement | null)[]; detail: (HTMLElement | null)[] } = { ing: [], detail: [] };

/**
 * R3F quirk: when a hover group has several meshes (label over glass, gel over skin…), stopPropagation in the
 * shared onPointerOver cancels the group's previously-hovered face and fires onPointerOut → the rim flickers off.
 * Re-asserting the hover on every pointer move over the group keeps it steady (out still fires on real leave).
 */
export function steadyHover<B extends { onPointerOver: (e: never) => void }>(bind: B) {
  return { ...bind, onPointerMove: bind.onPointerOver };
}
