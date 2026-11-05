/** Pre-parsed per-colourway shading colours shared by the hero jacket and the flying "next look" copy. */
import * as THREE from 'three';
import { COLOURWAYS } from './palette';

const WHITE = new THREE.Color('#ffffff');
/** hover-rim strength per colourway: dark fabric gets a subtle rim, never X-ray white */
const RIM_K: Record<string, number> = { ember: 0.8, crimson: 0.8, carbon: 0.45, glacier: 0.5 };

export const palC = COLOURWAYS.map((c) => {
  const shell = new THREE.Color(c.shell);
  return {
    shell,
    rib: new THREE.Color(c.rib),
    sheen: new THREE.Color(c.sheenColor),
    print: new THREE.Color(c.tone === 'dark' ? '#202122' : '#f4f1ec'),
    // dissolve edge: halfway between the fabric and its world, lifted slightly — never a cream/white rim
    edge: shell.clone().lerp(new THREE.Color(c.bgIn), 0.5).lerp(WHITE, 0.15),
    // rim tinted from the fabric hue
    rim: (c.id === 'carbon' ? new THREE.Color('#8a8580') : shell.clone().lerp(WHITE, 0.5)).multiplyScalar(RIM_K[c.id] ?? 0.7),
  };
});
