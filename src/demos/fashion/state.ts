/**
 * Shared per-frame state of the fashion scene (module singleton — R3F's canvas is a separate React root).
 *
 * Colourway swap = ONE designed timeline (`world.swap` 0→1 over SWAP_DUR seconds):
 *   0 … MID   the current jacket flies up-left, shrinks and dissolves out (old dye)
 *   MID       the garment dye, type tone and colourway label flip
 *   MID … 1   the next jacket flies in from the "next look" preview (lower right), dissolving in (new dye)
 *   the backdrop wipe runs on the SAME clock (range .16 → .9), so world and garment change together.
 * Mid-scroll (25–75%) the move would leave the frame, so it becomes an in-place cross-dissolve.
 */
import * as THREE from 'three';
import { easeInOutCubic, range } from '../../lib/math';
import { createStore } from '../../lib/store';
import { COLOURWAYS, type Colourway } from './palette';

export const SWAP_DUR = 1.0;
export const MID = 0.42;

const C = (h: string) => new THREE.Color(h);

export interface WorldColours {
  bgIn: THREE.Color;
  bgOut: THREE.Color;
  word: THREE.Color;
  wordAlpha: number;
  rim: THREE.Color;
  shadow: THREE.Color;
}

const fromCw = (c: Colourway): WorldColours => ({
  bgIn: C(c.bgIn),
  bgOut: C(c.bgOut),
  word: C(c.word),
  wordAlpha: c.wordAlpha,
  rim: C(c.rim),
  shadow: C(c.shadow),
});

/** colourway the GARMENT currently wears (flips at MID) — drives DOM tone + label */
export const garmentStore = createStore({ index: 0, tone: 0 });
/** the copy block steps back (dims) while a jacket flies across it or the viewer orbits the garment under it */
export const uiStore = createStore({ dim: false });

/** the incoming garment (carried by the preview copy) flies between these swap values */
export const FLY_START = 0.02;
export const FLY_LAND = 0.64;

export const world = {
  /** requested colourway */
  index: 0,
  /** colourway the garment wears before MID of the running swap */
  prevIndex: 0,
  /** colourway the garment shows right now */
  garment: 0,
  from: fromCw(COLOURWAYS[0]),
  to: fromCw(COLOURWAYS[0]),
  cur: fromCw(COLOURWAYS[0]),
  wipe: 1,
  swap: 1,
  /** 'fly' = slide out / fly in from the preview; 'fade' = in-place dissolve */
  mode: 'fly' as 'fly' | 'fade',
  anchor: new THREE.Vector3(0, 0.05, 0),
  /** jacket scale during the swap move (shadow follows) */
  scale: 1,
  /** where the "next look" preview sits, projected onto the garment's depth plane + its apparent scale there */
  previewOnPlane: new THREE.Vector3(1.6, -0.8, 0),
  previewScaleOnPlane: 0.3,
  hover: 0,
  /** current garment dissolve amount (written by the jacket) */
  dis: 0,
  /** backdrop wipe clock (0→1), independent of the garment clock so retargeting never jumps the world */
  wipeT: 1,
  /** hero pose (written by the jacket) — landing pose for the incoming preview copy */
  heroPos: new THREE.Vector3(0, 0.05, 0),
  heroRotY: 0,
  heroRotZ: 0,
};

export function resetWorld() {
  world.index = world.prevIndex = world.garment = 0;
  world.from = fromCw(COLOURWAYS[0]);
  world.to = fromCw(COLOURWAYS[0]);
  world.cur = fromCw(COLOURWAYS[0]);
  world.wipe = 1;
  world.wipeT = 1;
  world.dis = 0;
  world.swap = 1;
  world.mode = 'fly';
  world.scale = 1;
  garmentStore.set({ index: 0, tone: 0 });
}

function mixInto(out: WorldColours, a: WorldColours, b: WorldColours, t: number) {
  out.bgIn.copy(a.bgIn).lerp(b.bgIn, t);
  out.bgOut.copy(a.bgOut).lerp(b.bgOut, t);
  out.word.copy(a.word).lerp(b.word, t);
  out.wordAlpha = a.wordAlpha + (b.wordAlpha - a.wordAlpha) * t;
  out.rim.copy(a.rim).lerp(b.rim, t);
  out.shadow.copy(a.shadow).lerp(b.shadow, t);
}

/** call once per frame from the scene with the active variant index */
export function stepWorld(index: number, dt: number, progress: number) {
  if (index !== world.index) {
    // the wipe is a hard-edged circle, so the screen is never a blend: restart from whichever world
    // covers most of it (avoids a muddy mixed colour on rapid repeated clicks)
    const base = world.wipe >= 0.5 ? world.to : world.from;
    world.from = {
      bgIn: base.bgIn.clone(),
      bgOut: base.bgOut.clone(),
      word: base.word.clone(),
      wordAlpha: base.wordAlpha,
      rim: base.rim.clone(),
      shadow: base.shadow.clone(),
    };
    world.to = fromCw(COLOURWAYS[index]);
    const running = world.swap < 1;
    const retargetUntil = world.mode === 'fly' ? FLY_LAND : MID;
    if (running && world.swap < retargetUntil) {
      // the outgoing jacket is still leaving / the incoming one is still in flight: just retarget its dye
    } else if (running) {
      // the new hero is already materialising: send it out again from its current visibility (no pop)
      world.prevIndex = world.garment;
      world.swap = MID * Math.min(0.95, 0.3 + 0.7 * world.dis);
    } else {
      world.prevIndex = world.garment;
      world.swap = 0;
      // the fly-in starts from the preview, so it's only used while the preview is on screen
      world.mode = progress < 0.55 || progress > 0.93 ? 'fly' : 'fade';
    }
    world.index = index;
    world.wipeT = 0;
  }
  world.swap = Math.min(1, world.swap + dt / SWAP_DUR);
  world.wipeT = Math.min(1, world.wipeT + dt / SWAP_DUR);
  world.wipe = range(0.06, 0.82, world.wipeT);
  mixInto(world.cur, world.from, world.to, easeInOutCubic(world.wipe));
  const g = world.swap < MID ? world.prevIndex : world.index;
  if (g !== world.garment) world.garment = g;
  // label changes as the wipe starts; type tone flips once the new world covers most of the screen
  const st = garmentStore.get();
  const label = world.wipeT >= 0.06 ? world.index : st.index;
  const tone = world.wipe >= 0.45 ? world.index : st.tone;
  if (st.index !== label || st.tone !== tone) garmentStore.set({ index: label, tone });
}
