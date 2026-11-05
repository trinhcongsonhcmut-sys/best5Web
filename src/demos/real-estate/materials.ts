/**
 * Material library for the villa. Built once per mount (after the PBR scans are loaded); every hoverable part
 * gets its OWN instances (own rim uniform) so pointing at the pool lights the pool, not every frame in the house.
 *
 * Surfaces = CC0 scans with real normal + ARM (AO / roughness) maps on metre-true UVs:
 *   stone   sandstone_blocks_05 (façade variant swaps the set / tint / roughness live)
 *   fascia  concrete_floor_02 tinted charcoal (cantilever slabs, roof, end plates)
 *   paving  concrete_floor_02 light (terrace)    wood/deck  brown_planks_03 warmed
 * Plus a cheap analytic contact-AO term (world height above the floor / below the soffit) on walls.
 */
import * as THREE from 'three';
import { addRim, type RimUniforms } from '../../lib/rim';
import type { MatKey, Part } from './kit';
import { cached, glowTexture, mosaicTexture, scallopTexture, waterNormal, type PbrId, type PbrSet } from './textures';

export const FACADES = [
  { id: 'sandstone', label: 'Sandstone', swatch: '#d9c9ab', tint: '#f4ece0', set: 'sandstone_blocks_05', rough: 1.0, normal: 1.1, sat: 1.0 },
  { id: 'basalt', label: 'Basalt', swatch: '#4b4f54', tint: '#70757d', set: 'sandstone_blocks_05', rough: 0.78, normal: 1.5, sat: 0.25 },
  { id: 'concrete', label: 'Board Concrete', swatch: '#b4b0a8', tint: '#e9e7e3', set: 'concrete_floor_02', rough: 0.95, normal: 0.8, sat: 0.3 },
] as const satisfies readonly { id: string; label: string; swatch: string; tint: string; set: PbrId; rough: number; normal: number; sat: number }[];

export const RIM_COLOR = '#ffd9a3';

export interface Lib {
  sets: Record<PbrId, PbrSet>;
  waterN: THREE.Texture;
  /** all materials keyed "part:mat" */
  mats: Map<string, THREE.MeshStandardMaterial>;
  rims: Map<Part, RimUniforms[]>;
  /** every façade-stone material — variant set/tint goes to all of them */
  stones: THREE.MeshStandardMaterial[];
  primary: { material: THREE.MeshStandardMaterial; uniforms: RimUniforms };
  /** emissive materials whose intensity ramps dusk → night: [material, dusk, night] */
  ramps: [THREE.MeshStandardMaterial, number, number][];
  /** façade albedo saturation (eased per variant) */
  stoneSat: { value: number };
  /** additive light cards (opacity ramps dusk → night) */
  cards: [THREE.MeshBasicMaterial, number, number][];
  get(part: Part, mat: MatKey): THREE.MeshStandardMaterial;
  dispose(): void;
}

/** Lambert stand-in typed as Standard (only colour/emissive/emissiveIntensity are touched at runtime) */
const lambert = (p: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(p) as unknown as THREE.MeshStandardMaterial;

function pbr(set: PbrSet, p: THREE.MeshStandardMaterialParameters & { normal?: number }) {
  const { normal = 1, ...rest } = p;
  return new THREE.MeshStandardMaterial({
    map: set.map,
    normalMap: set.normal,
    normalScale: new THREE.Vector2(normal, normal),
    roughnessMap: set.arm,
    aoMap: set.arm,
    aoMapIntensity: 1,
    metalness: 0,
    ...rest,
  });
}

// ───────── analytic contact AO (walls darken towards the floor they stand on and the soffit above them) ─────────
const AO_VERT_HEAD = 'varying vec3 vBahaW;\nvarying vec3 vBahaN;\n';
const AO_VERT_BODY = 'vBahaW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvBahaN = normalize(mat3(modelMatrix) * objectNormal);\n';
const AO_FRAG_HEAD = /* glsl */ `
varying vec3 vBahaW;
varying vec3 vBahaN;
float bahaContactAO(vec3 p, vec3 n) {
  float vert = 1.0 - abs(n.y);
  float fl = p.y < 4.05 ? 0.2 : (p.y < 7.75 ? 4.1 : 7.8);
  float ce = p.y < 3.52 ? 3.5 : (p.x > 5.7 ? 6.9 : 7.2);
  float aoF = mix(0.42, 1.0, smoothstep(0.0, 0.9, p.y - fl));
  float aoC = p.y > ce + 0.01 ? 1.0 : mix(0.5, 1.0, smoothstep(0.0, 0.75, ce - p.y));
  return mix(1.0, aoF * aoC, vert);
}
`;
function withContactAO<T extends THREE.Material>(m: T): T {
  const prev = m.onBeforeCompile.bind(m);
  const prevKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r);
    sh.vertexShader = AO_VERT_HEAD + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + AO_VERT_BODY);
    sh.fragmentShader = AO_FRAG_HEAD + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= bahaContactAO(vBahaW, normalize(vBahaN));');
  };
  m.customProgramCacheKey = () => prevKey() + '|bahaAO';
  return m;
}

/** albedo saturation grade (the scans are warm; basalt / concrete / charcoal render want neutral greys) */
function withGrade<T extends THREE.Material>(m: T, sat: { value: number }, contrast?: { k: number; ref: number }): T {
  const prev = m.onBeforeCompile.bind(m);
  const prevKey = m.customProgramCacheKey.bind(m);
  // optional contrast squeeze around a reference luminance (the blotchy concrete scan → even fair-faced render)
  const squeeze = contrast
    ? `diffuseColor.rgb *= mix(${contrast.ref.toFixed(4)} / max(bahaL, 0.002), 1.0, ${contrast.k.toFixed(3)});`
    : '';
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r);
    sh.uniforms.uBahaSat = sat;
    sh.fragmentShader = 'uniform float uBahaSat;\n' + sh.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      {
        float bahaL = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        diffuseColor.rgb = mix(vec3(bahaL), diffuseColor.rgb, uBahaSat);
        ${squeeze}
      }`,
    );
  };
  m.customProgramCacheKey = () => prevKey() + '|bahaGrade' + (contrast ? `${contrast.k}/${contrast.ref}` : '');
  return m;
}

function base(key: MatKey, L: { sets: Record<PbrId, PbrSet>; waterN: THREE.Texture }): THREE.MeshStandardMaterial {
  const S = THREE.MeshStandardMaterial;
  const { sets } = L;
  switch (key) {
    case 'stone': {
      const f = FACADES[0];
      return pbr(sets[f.set], { color: f.tint, roughness: f.rough, normal: f.normal, envMapIntensity: 0.7 });
    }
    case 'fascia':
    case 'soffit': {
      // charcoal fair-faced concrete of the cantilever slabs: matte (Lambert — no env sheen, cheapest on the
      // largest surfaces of the roof shot) but still the real scan: albedo + normal + AO
      const c = sets.concrete_floor_02;
      return lambert({ color: '#858a93', map: c.map, normalMap: c.normal, normalScale: new THREE.Vector2(0.6, 0.6), aoMap: c.arm });
    }
    case 'paving':
      return pbr(sets.concrete_floor_02, { color: '#d6d2ca', roughness: 1, normal: 0.7, envMapIntensity: 0.4 });
    case 'wood':
      return pbr(sets.brown_planks_03, { color: '#f2a668', roughness: 0.9, normal: 0.7, envMapIntensity: 0.55 });
    case 'deck':
      return pbr(sets.brown_planks_03, { color: '#d39466', roughness: 1, normal: 0.8, envMapIntensity: 0.5 });
    case 'darkStone':
      return new S({ color: '#2a2b2d', roughness: 0.55, metalness: 0, envMapIntensity: 0.6 });
    case 'steel':
      return new S({ color: '#141518', roughness: 0.38, metalness: 0.7, envMapIntensity: 1.0 });
    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color: '#26323a', roughness: 0.02, metalness: 0.0, transparent: true, opacity: 0.36, envMapIntensity: 3.6,
        depthWrite: false, specularIntensity: 1, ior: 1.6,
      });
    case 'interiorFloor':
      return new S({ color: '#5a3f2c', roughness: 0.32, metalness: 0, emissive: '#ff9c50', emissiveIntensity: 0.06, envMapIntensity: 0.8 });
    // interior soft goods: Lambert (no specular/env BRDF) — they only read as warm glowing volumes through glass
    case 'interiorWall':
      return lambert({ color: '#8f6a4a', emissive: '#ff9448', emissiveIntensity: 0.16 });
    case 'fabric':
      return lambert({ color: '#c4ab8e', emissive: '#ffa860', emissiveIntensity: 0.1 });
    case 'fabricDark':
      return lambert({ color: '#463529', emissive: '#ff9a50', emissiveIntensity: 0.05 });
    case 'curtain':
      return new S({ color: '#e2cba8', roughness: 1, transparent: true, opacity: 0.55, emissive: '#ffb06a', emissiveIntensity: 0.4, side: THREE.DoubleSide, depthWrite: false });
    case 'glow':
      return new S({ color: '#000000', emissive: '#ffbf78', emissiveIntensity: 2, roughness: 1 });
    case 'led':
      return new S({ color: '#000000', emissive: '#ffcf8a', emissiveIntensity: 2, roughness: 1 });
    case 'glowCool':
      return new S({ color: '#000000', emissive: '#9fe8ff', emissiveIntensity: 2, roughness: 1 });
    case 'brass':
      return new S({ color: '#b8925c', roughness: 0.3, metalness: 1, envMapIntensity: 1.1 });
    case 'mosaic':
      return new S({ map: cached('mosaic', mosaicTexture), color: '#7fd0d6', roughness: 0.25, emissive: '#2fc6d6', emissiveIntensity: 0.15 });
    case 'water':
      return new THREE.MeshPhysicalMaterial({
        color: '#0a5262', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.82, normalMap: L.waterN,
        normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 2.4, depthWrite: false, specularIntensity: 1,
        emissive: '#0b8fa3', emissiveIntensity: 0.1,
      });
    case 'plant':
      return lambert({ color: '#26331f' });
    // warm-lit plaster ceiling: glows like a lit room seen from outside
    case 'ceiling':
      return lambert({ color: '#cfaa82', emissive: '#ffa860', emissiveIntensity: 0.24 });
    // baked light pools / wall washes: additive radial cards under pendants and downlights
    case 'wash':
      return new THREE.MeshBasicMaterial({
        map: cached('glow', glowTexture), color: '#ff8a3a', transparent: true, opacity: 0.4, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2,
      }) as unknown as THREE.MeshStandardMaterial;
    // the cone a recessed soffit downlight throws down a pier / panel
    case 'scallop':
      return new THREE.MeshBasicMaterial({
        map: cached('scallop', scallopTexture), color: '#ffb36b', transparent: true, opacity: 0.4, depthWrite: false,
        blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3, fog: true,
      }) as unknown as THREE.MeshStandardMaterial;
  }
}

/** emissive ramps (dusk → night) */
const RAMP: Partial<Record<MatKey, [number, number]>> = {
  interiorWall: [0.16, 0.42],
  ceiling: [0.18, 0.4],
  interiorFloor: [0.06, 0.2],
  fabric: [0.1, 0.28],
  fabricDark: [0.04, 0.1],
  curtain: [0.4, 0.85],
  glow: [2.6, 5],
  led: [1.4, 4.0],
  glowCool: [1.2, 3.6],
  mosaic: [0.08, 0.55],
  water: [0.05, 0.4],
};
/** additive card opacity ramps */
const CARD: Partial<Record<MatKey, [number, number]>> = {
  wash: [0.3, 0.5],
  scallop: [0.34, 0.8],
};
/** façade materials that get the contact-AO term */
const AO_KEYS: MatKey[] = ['stone', 'wood', 'interiorWall', 'fascia'];

export function createLib(sets: Record<PbrId, PbrSet>): Lib {
  const waterN = cached('waterN', waterNormal);
  waterN.repeat.set(3, 3);
  const shared = { sets, waterN };

  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const rims = new Map<Part, RimUniforms[]>();
  const stones: THREE.MeshStandardMaterial[] = [];
  const ramps: Lib['ramps'] = [];
  const cards: Lib['cards'] = [];
  const stoneSat = { value: FACADES[0].sat };
  const fasciaSat = { value: 0.12 };
  const pavingSat = { value: 0.4 };
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
    if (AO_KEYS.includes(key)) withContactAO(m);
    if (key === 'stone') withGrade(m, stoneSat);
    else if (key === 'fascia' || key === 'soffit') withGrade(m, fasciaSat, { k: 0.4, ref: 0.05 });
    else if (key === 'paving') withGrade(m, pavingSat);
    if (key === 'stone') stones.push(m);
    const r = RAMP[key];
    if (r) ramps.push([m, r[0], r[1]]);
    const c = CARD[key];
    if (c) cards.push([m as unknown as THREE.MeshBasicMaterial, c[0], c[1]]);
    mats.set(k, m);
    return m;
  };
  // make sure primary exists first
  get('mass', 'stone');

  return {
    sets, waterN, mats, rims, stones, ramps, cards, stoneSat,
    get primary() {
      return primary!;
    },
    get,
    dispose() {
      // textures stay in the loader / module cache (three re-uploads them if the route is opened again)
      mats.forEach((m) => m.dispose());
    },
  };
}
