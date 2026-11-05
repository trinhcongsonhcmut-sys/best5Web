/**
 * Colourways — garment + the whole world (backdrop gradient, rim light, shadow, type tone) change together.
 * Hues measured from reference E2 (see reference/PALETTES.md, Demo 4) and pushed slightly for a real-time PBR shell.
 */
export interface Colourway {
  id: string;
  label: string;
  /** shell nylon */
  shell: string;
  /** rib binding (hem/cuffs) */
  rib: string;
  roughness: number;
  clearcoat: number;
  sheen: number;
  sheenColor: string;
  /** backdrop: centre glow → edge */
  bgIn: string;
  bgOut: string;
  /** giant word behind the garment */
  word: string;
  wordAlpha: number;
  rim: string;
  shadow: string;
  /** DOM type tone on this world */
  tone: 'light' | 'dark';
}

export const COLOURWAYS: Colourway[] = [
  {
    id: 'ember',
    label: 'Ember Orange',
    shell: '#ec6a17',
    rib: '#c4520e',
    roughness: 0.36,
    clearcoat: 0.4,
    sheen: 0.35,
    sheenColor: '#ffc08a',
    bgIn: '#ff8a26',
    bgOut: '#a8400a',
    word: '#ffb46a',
    wordAlpha: 0.55,
    rim: '#ffd2a3',
    shadow: '#4d1c02',
    tone: 'light',
  },
  {
    id: 'carbon',
    label: 'Carbon Black',
    shell: '#262523',
    rib: '#1a1918',
    roughness: 0.36,
    clearcoat: 0.42,
    sheen: 0.45,
    sheenColor: '#8d8a84',
    bgIn: '#4a4844',
    bgOut: '#121110',
    word: '#5d5a55',
    wordAlpha: 0.7,
    rim: '#d8d2c8',
    shadow: '#000000',
    tone: 'light',
  },
  {
    id: 'glacier',
    label: 'Glacier Silver',
    shell: '#c3c9ce',
    rib: '#a6adb3',
    roughness: 0.4,
    clearcoat: 0.32,
    sheen: 0.6,
    sheenColor: '#ffffff',
    bgIn: '#e2e6e9',
    bgOut: '#80878c',
    word: '#f6f8f9',
    wordAlpha: 0.75,
    rim: '#ffffff',
    shadow: '#3a4045',
    tone: 'dark',
  },
  {
    id: 'crimson',
    label: 'Crimson Red',
    shell: '#b3080c',
    rib: '#8a0508',
    roughness: 0.36,
    clearcoat: 0.4,
    sheen: 0.4,
    sheenColor: '#ff8f86',
    bgIn: '#c9141a',
    bgOut: '#4f0204',
    word: '#e3373b',
    wordAlpha: 0.55,
    rim: '#ffb0a3',
    shadow: '#220001',
    tone: 'light',
  },
];
