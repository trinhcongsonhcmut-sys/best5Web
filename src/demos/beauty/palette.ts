/**
 * BAHA BOTANICA — "Aloe & Sky" art direction (reference/PALETTES.md Demo 1, A1 + A2 colour-world mechanic).
 * One palette per variant: the whole WebGL world (backdrop gradient, glass, cream, cap, leaves, word) lerps to it.
 */
import * as THREE from 'three';

export interface World {
  id: string;
  label: string;
  /** product name printed on the jar label */
  name: string;
  /** giant display word behind the jar */
  word: string;
  bgTop: string;
  bgMid: string;
  bgBot: string;
  glow: string;
  glass: string;
  atten: string;
  cream: string;
  cap: string;
  ink: string;
  labelInk: string;
  leaf: string;
  plinth: string;
  serum: string;
  shadow: string;
  foil: string;
}

export const WORLDS: World[] = [
  {
    id: 'aloe',
    label: 'Aloe Mist',
    name: 'Aloe',
    word: 'SOOTHE',
    bgTop: '#6aa9dc',
    bgMid: '#7ab9e6',
    bgBot: '#cdeeff',
    glow: '#e4f6ff',
    glass: '#0f4a2a',
    atten: '#0a3a1f',
    cream: '#e4ecd9',
    cap: '#1b2129',
    ink: '#0d2219',
    labelInk: '#d8ecd9',
    leaf: '#1d6236',
    plinth: '#dceff8',
    serum: '#cfe9b8',
    shadow: '#2b5d7c',
    foil: '#d9c08a',
  },
  {
    id: 'rose',
    label: 'Rose Quartz',
    name: 'Rose',
    word: 'BLOOM',
    bgTop: '#e6b2bd',
    bgMid: '#f3d2d6',
    bgBot: '#fcf0ec',
    glow: '#fff9f6',
    glass: '#c9768a',
    atten: '#8e3550',
    cream: '#f3dcd8',
    cap: '#f2ebe7',
    ink: '#47192a',
    labelInk: '#fff0f2',
    leaf: '#3f6e48',
    plinth: '#f7e5e3',
    serum: '#f3bfc9',
    shadow: '#8c4b5d',
    foil: '#c79a6c',
  },
  {
    id: 'amber',
    label: 'Amber Dew',
    name: 'Amber',
    word: 'GLOW',
    bgTop: '#e0a067',
    bgMid: '#efc79b',
    bgBot: '#fcefdf',
    glow: '#fff8ee',
    glass: '#a8561a',
    atten: '#5e2a08',
    cream: '#f0dfbf',
    cap: '#2a1c14',
    ink: '#3a210e',
    labelInk: '#fff3df',
    leaf: '#3a662c',
    plinth: '#f5e1c9',
    serum: '#f1b260',
    shadow: '#7c4a22',
    foil: '#e1c38c',
  },
];

type ColorKey = Exclude<keyof World, 'id' | 'label' | 'name' | 'word'>;
const KEYS: ColorKey[] = ['bgTop', 'bgMid', 'bgBot', 'glow', 'glass', 'atten', 'cream', 'cap', 'ink', 'labelInk', 'leaf', 'plinth', 'serum', 'shadow', 'foil'];

/** Live (damped) palette shared by every mesh in the scene. Driven once per frame by <LookDriver/>. */
export const look = Object.fromEntries(KEYS.map((k) => [k, new THREE.Color(WORLDS[0][k])])) as Record<ColorKey, THREE.Color>;
const tmp = new THREE.Color();

export function resetLook(i = 0) {
  for (const k of KEYS) look[k].set(WORLDS[i][k]);
}

export function stepLook(index: number, dt: number) {
  const w = WORLDS[index] ?? WORLDS[0];
  const a = 1 - Math.exp(-4.2 * dt);
  for (const k of KEYS) look[k].lerp(tmp.set(w[k]), a);
}
