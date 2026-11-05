/**
 * BAHA BOTANICA v2 — three serum worlds (amber Vitamin C · rose Hyaluronic · verdant Niacinamide).
 * One palette per variant: the whole WebGL world (backdrop, bottle glass + liquid, label accent, citrus, word) lerps to it.
 */
import * as THREE from 'three';

export interface World {
  id: string;
  label: string;
  /** product name printed on the label (+ HUD kicker) */
  name: string;
  /** active line on the label */
  active: string;
  /** glass description (craft callout) */
  glassName: string;
  /** citrus used in the still-life */
  fruit: string;
  /** peel-oil active (5th orbiting ingredient) */
  peel: string;
  /** giant display word behind the bottle */
  word: string;
  bgTop: string;
  bgMid: string;
  bgBot: string;
  glow: string;
  /** bottle glass tint (bridge "primary") + Beer–Lambert attenuation colour */
  glass: string;
  atten: string;
  liquid: string;
  collar: string;
  bulb: string;
  ink: string;
  paper: string;
  labelInk: string;
  accent: string;
  rind: string;
  rindCut: string;
  pulp: string;
  pith: string;
  plinth: string;
  shadow: string;
  /** dark edge tint of the water splash (water on a pale set reads by its refraction lines) */
  waterEdge: string;
}

export const WORLDS: World[] = [
  {
    id: 'vitc',
    label: 'Vitamin C',
    name: 'Radiance',
    active: 'Vitamin C 15%',
    glassName: 'Amber glass',
    fruit: 'Sweet orange',
    peel: 'Orange peel oil',
    word: 'GLOW',
    bgTop: '#eadccb',
    bgMid: '#f4ebdf',
    bgBot: '#fbf6ef',
    glow: '#fffaf2',
    glass: '#f2b878',
    atten: '#8f3f07',
    liquid: '#e08c26',
    collar: '#ebe7e0',
    bulb: '#f3f0ea',
    ink: '#33200f',
    paper: '#f2e8d7',
    labelInk: '#3a2a1d',
    accent: '#e08a3a',
    rind: '#f28a16',
    rindCut: '#f7a62e',
    pulp: '#ff8f1c',
    pith: '#fbf0d8',
    plinth: '#efe5d8',
    shadow: '#7a4a24',
    waterEdge: '#6b5a48',
  },
  {
    id: 'rose',
    label: 'Rose Hyaluron',
    name: 'Hydra',
    active: 'Hyaluronic 2%',
    glassName: 'Rose glass',
    fruit: 'Pink grapefruit',
    peel: 'Grapefruit peel oil',
    word: 'BLOOM',
    bgTop: '#ecd2cf',
    bgMid: '#f6e6e3',
    bgBot: '#fdf4f1',
    glow: '#fffaf8',
    glass: '#f2b2b9',
    atten: '#a63a55',
    liquid: '#f4a9b4',
    collar: '#eee7e4',
    bulb: '#f6f0ed',
    ink: '#47192a',
    paper: '#f7ece8',
    labelInk: '#4a2430',
    accent: '#d4657c',
    rind: '#f4a77a',
    rindCut: '#f7b98e',
    pulp: '#e4566a',
    pith: '#fde9df',
    plinth: '#f4e4e0',
    shadow: '#8c4b5d',
    waterEdge: '#7a5a60',
  },
  {
    id: 'lime',
    label: 'Verdant Niacinamide',
    name: 'Clarity',
    active: 'Niacinamide 10%',
    glassName: 'Verdant glass',
    fruit: 'Lime',
    peel: 'Lime peel oil',
    word: 'CLEAR',
    bgTop: '#dae2cf',
    bgMid: '#e9efe1',
    bgBot: '#f6f8f0',
    glow: '#fbfdf6',
    glass: '#b4cf8e',
    atten: '#2f6a22',
    liquid: '#cfe08a',
    collar: '#e9ebe3',
    bulb: '#f1f3ec',
    ink: '#1c2c18',
    paper: '#eef0e3',
    labelInk: '#25331f',
    accent: '#6e9a35',
    rind: '#4f8f22',
    rindCut: '#9cc054',
    pulp: '#a2c25a',
    pith: '#f1f5d8',
    plinth: '#e5ebdd',
    shadow: '#46633a',
    waterEdge: '#55634c',
  },
];

type ColorKey = Exclude<keyof World, 'id' | 'label' | 'name' | 'active' | 'glassName' | 'fruit' | 'peel' | 'word'>;
const KEYS: ColorKey[] = [
  'bgTop', 'bgMid', 'bgBot', 'glow', 'glass', 'atten', 'liquid', 'collar', 'bulb', 'ink', 'paper', 'labelInk', 'accent',
  'rind', 'rindCut', 'pulp', 'pith', 'plinth', 'shadow', 'waterEdge',
];

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
