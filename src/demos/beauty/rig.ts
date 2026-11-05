/**
 * Shared scene ↔ DOM bridge for this demo (R3F <Canvas> is a separate React root, so a module singleton is used).
 * Scene components write live world positions; the anchor projector writes DOM callout transforms directly.
 */
import * as THREE from 'three';

/** hero bottle scale (bottle-local units are already world-sized: Ø 0.6, 1.78 tall) */
export const JS = 1;

/** first frames: every mesh is drawn once so all shader programs compile before `ready` (no hitch mid-scroll) */
export const warm = { frames: 0, get on() { return this.frames < 6; } };

export const rig = {
  /** centre of the bottle (glass + dropper), world */
  jarCenter: new THREE.Vector3(0, 0.89, 0),
  /** craft anchors: bulb, pipette, glass body (world) */
  bulbAnchor: new THREE.Vector3(),
  pipetteAnchor: new THREE.Vector3(),
  bodyAnchor: new THREE.Vector3(),
  /** world positions of the five orbiting actives */
  ingredients: Array.from({ length: 5 }, () => new THREE.Vector3()),
  /** hover amount per ingredient (0..1) — callouts brighten with it */
  ingHover: [0, 0, 0, 0, 0],
  /** bottle hover (drives the soft halo) */
  jarHover: 0,
  /** one-shot assembly intro (dropper from above, glass from below) — 0 → 1 after the scene is ready */
  intro: 0,
};

/** DOM elements registered by the overlay (callback refs). */
export const calloutEls: { ing: (HTMLElement | null)[]; detail: (HTMLElement | null)[] } = { ing: [], detail: [] };

/**
 * Keeps drei's loading manager busy from page mount until fonts, label canvas, HDRI-lit shader programs are all
 * compiled — Stage flips `bridge.ready` only when the manager is idle, so `ready` can never fire in the gap between
 * the HDRI finishing and the scene's own preparation starting.
 */
const MGR_ITEM = 'beauty:prep';
export const prep = {
  open: false,
  start() {
    if (this.open) return;
    this.open = true;
    THREE.DefaultLoadingManager.itemStart(MGR_ITEM);
  },
  end() {
    if (!this.open) return;
    this.open = false;
    THREE.DefaultLoadingManager.itemEnd(MGR_ITEM);
  },
};

/**
 * R3F quirk: when a hover group has several meshes (label over glass, gel over skin…), stopPropagation in the
 * shared onPointerOver cancels the group's previously-hovered face and fires onPointerOut → the rim flickers off.
 * Re-asserting the hover on every pointer move over the group keeps it steady (out still fires on real leave).
 */
export function steadyHover<B extends { onPointerOver: (e: never) => void }>(bind: B) {
  return { ...bind, onPointerMove: bind.onPointerOver };
}
