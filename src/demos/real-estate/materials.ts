/**
 * Material library for the villa. Built once per mount; every hoverable part gets its OWN instances (own rim
 * uniform) so pointing at the pool lights the pool, not every steel frame in the house.
 */
import * as THREE from 'three';
import { addRim, type RimUniforms } from '../../lib/rim';
import type { MatKey, Part } from './kit';
import { cached, glowTexture, mosaicTexture, stoneSet, waterNormal, woodTexture, type StoneSet } from './textures';

export const FACADES = [
  { id: 'travertine', label: 'Travertine', swatch: '#d9ccb4', tint: '#e7dcc6', rough: 0.95, bump: 0.9 },
  { id: 'basalt', label: 'Basalt · Teak', swatch: '#3d4144', tint: '#4b5053', rough: 0.82, bump: 1.4 },
  { id: 'terracotta', label: 'Terracotta', swatch: '#b5623f', tint: '#c46e48', rough: 1.0, bump: 1.1 },
] as const;

export const RIM_COLOR = '#ffd9a3';

export interface Lib {
  stone(i: number): StoneSet;
  wood: StoneSet;
  mosaic: THREE.Texture;
  waterN: THREE.Texture;
  /** all materials keyed "part:mat" */
  mats: Map<string, THREE.MeshStandardMaterial>;
  rims: Map<Part, RimUniforms[]>;
  /** every stone material (façade + site walls) — variant tint goes to all of them */
  stones: THREE.MeshStandardMaterial[];
  primary: { material: THREE.MeshStandardMaterial; uniforms: RimUniforms };
  /** emissive materials whose intensity ramps dusk → night: [material, dusk, night] */
  ramps: [THREE.MeshStandardMaterial, number, number][];
  get(part: Part, mat: MatKey): THREE.MeshStandardMaterial;
  dispose(): void;
}

/** Lambert stand-in typed as Standard (only colour/emissive/emissiveIntensity are touched at runtime) */
const lambert = (p: THREE.MeshLambertMaterialParameters & { roughness?: number }) => {
  const { roughness: _r, ...rest } = p;
  void _r;
  return new THREE.MeshLambertMaterial(rest) as unknown as THREE.MeshStandardMaterial;
};

function base(key: MatKey, L: Pick<Lib, 'wood' | 'mosaic' | 'waterN'>): THREE.MeshStandardMaterial {
  const S = THREE.MeshStandardMaterial;
  switch (key) {
    case 'stone': {
      const s = stoneSet(0);
      return new S({ color: FACADES[0].tint, map: s.map, roughnessMap: s.rough, bumpMap: s.rough, bumpScale: FACADES[0].bump, roughness: FACADES[0].rough, metalness: 0, envMapIntensity: 0.55 });
    }
    case 'darkStone':
      return new S({ color: '#2a2b2d', roughness: 0.55, metalness: 0, envMapIntensity: 0.6 });
    case 'plaster':
      return new S({ color: '#ece4d6', roughness: 0.88, metalness: 0, envMapIntensity: 0.5 });
    case 'steel':
      return new S({ color: '#121316', roughness: 0.36, metalness: 0.75, envMapIntensity: 1.1 });
    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color: '#1e2b33', roughness: 0.03, metalness: 0.05, transparent: true, opacity: 0.38, envMapIntensity: 3.2,
        depthWrite: false, specularIntensity: 1, ior: 1.5,
      });
    case 'wood':
      return new S({ map: L.wood.map, roughnessMap: L.wood.rough, bumpMap: L.wood.rough, bumpScale: 0.6, color: '#d9a77a', roughness: 0.9, envMapIntensity: 0.5 });
    case 'deck':
      return new S({ map: L.wood.map, roughnessMap: L.wood.rough, color: '#b89a82', roughness: 1, envMapIntensity: 0.45 });
    case 'interiorFloor':
      return new S({ color: '#d8c6a8', roughness: 0.16, metalness: 0, emissive: '#ffcf96', emissiveIntensity: 0.08, envMapIntensity: 1.2 });
    // interior soft goods: Lambert (no specular/env BRDF) — they only read as warm glowing volumes through glass
    case 'interiorWall':
      return lambert({ color: '#ecd5b4', roughness: 0.92, emissive: '#ffb871', emissiveIntensity: 0.3 });
    case 'fabric':
      return lambert({ color: '#e2d8c8', roughness: 1, emissive: '#ffcf94', emissiveIntensity: 0.12 });
    case 'fabricDark':
      return lambert({ color: '#5b4a3c', roughness: 0.95, emissive: '#ffb070', emissiveIntensity: 0.06 });
    case 'curtain': {
      const m = new S({ color: '#f6efe2', roughness: 1, transparent: true, opacity: 0.62, emissive: '#ffd5a0', emissiveIntensity: 0.55, side: THREE.DoubleSide, depthWrite: false });
      return m;
    }
    case 'glow':
      return new S({ color: '#000000', emissive: '#ffd49a', emissiveIntensity: 2, roughness: 1 });
    case 'led':
      return new S({ color: '#000000', emissive: '#ffcf8a', emissiveIntensity: 2, roughness: 1 });
    case 'glowCool':
      return new S({ color: '#000000', emissive: '#9fe8ff', emissiveIntensity: 2, roughness: 1 });
    case 'brass':
      return new S({ color: '#c09a62', roughness: 0.28, metalness: 1, envMapIntensity: 1.2 });
    case 'mosaic':
      return new S({ map: L.mosaic, color: '#7fd0d6', roughness: 0.25, emissive: '#2fc6d6', emissiveIntensity: 0.15 });
    case 'water': {
      const m = new THREE.MeshPhysicalMaterial({
        color: '#0a5262', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.8, normalMap: L.waterN,
        normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 3.2, depthWrite: false, specularIntensity: 1,
        emissive: '#0b8fa3', emissiveIntensity: 0.1,
      });
      return m;
    }
    case 'plant':
      return lambert({ color: '#3f5e36', roughness: 0.85 });
    // warm-lit plaster ceiling: glows like a lit room seen from outside
    case 'ceiling':
      return lambert({ color: '#f3e3c8', emissive: '#ffd9a8', emissiveIntensity: 0.3 });
    // baked light pools / wall washes: additive radial cards under pendants, on feature walls and ceilings
    case 'wash':
      return new THREE.MeshBasicMaterial({
        map: cached('glow', glowTexture), color: '#ffb46a', transparent: true, opacity: 0.5, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2,
      }) as unknown as THREE.MeshStandardMaterial;
  }
}

/** rough emissive ramps (dusk → night) */
const RAMP: Partial<Record<MatKey, [number, number]>> = {
  interiorWall: [0.3, 0.95],
  ceiling: [0.32, 0.75],
  interiorFloor: [0.12, 0.4],
  fabric: [0.16, 0.5],
  fabricDark: [0.05, 0.14],
  curtain: [0.5, 1.15],
  glow: [2.2, 5],
  led: [1.4, 4.2],
  glowCool: [1.2, 3.6],
  mosaic: [0.08, 0.55],
  water: [0.05, 0.4],
};

export function createLib(): Lib {
  const wood = cached('wood', woodTexture);
  const mosaic = cached('mosaic', mosaicTexture);
  const waterN = cached('waterN', waterNormal);
  waterN.repeat.set(3, 3);
  const shared = { wood, mosaic, waterN };

  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const rims = new Map<Part, RimUniforms[]>();
  const stones: THREE.MeshStandardMaterial[] = [];
  const ramps: Lib['ramps'] = [];
  let primary: Lib['primary'] | null = null;

  const get = (part: Part, key: MatKey) => {
    const k = `${part}:${key}`;
    let m = mats.get(k);
    if (m) return m;
    m = base(key, shared);
    m.name = k;
    if (part !== 'none') {
      const { uniforms } = addRim(m, { color: RIM_COLOR, power: key === 'glass' || key === 'water' ? 1.6 : 2.2 });
      const list = rims.get(part) ?? [];
      list.push(uniforms);
      rims.set(part, list);
      if (part === 'mass' && key === 'stone') primary = { material: m, uniforms };
    }
    if (key === 'stone') stones.push(m);
    const r = RAMP[key];
    if (r) ramps.push([m, r[0], r[1]]);
    mats.set(k, m);
    return m;
  };
  // make sure primary exists first
  get('mass', 'stone');

  return {
    stone: stoneSet, wood, mosaic, waterN, mats, rims, stones, ramps,
    get primary() {
      return primary!;
    },
    get,
    dispose() {
      // textures stay in the module cache (three re-uploads them if the route is opened again)
      mats.forEach((m) => m.dispose());
    },
  };
}
