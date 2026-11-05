/**
 * Physical materials shared by the v2 still-life. Colours are bound BY REFERENCE to the live palette (`look`), so
 * variant changes lerp straight into the shaders without per-frame copies.
 *
 *   glass   — the ONE transmissive material (amber Boston round): ior 1.5, Beer–Lambert attenuation, per-fragment
 *             thickness (grazing walls + punted base read deeper, like real thick glass)
 *   water   — non-transmissive physical water (transparent): env reflections + fresnel coverage + dark refraction
 *             edges, so splashes read on a pale set and never need a second transmission pass
 *   flesh   — citrus flesh driven by generated masks (pulp/pith/rind band), vesicle normal map, wet clearcoat and a
 *             fake sub-surface glow
 *   rind    — dimpled peel (normal map), waxy clearcoat
 */
import * as THREE from 'three';
import { addRim, type RimUniforms } from '../../lib/rim';
import { look } from './palette';
import { citrusFaceTextures, rindNormalTexture } from './textures';

/** chains an extra onBeforeCompile after the rim one (keeps the rim injection) */
function chain(mat: THREE.Material, key: string, fn: (sh: THREE.WebGLProgramParametersWithUniforms) => void) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev.call(mat, sh, r);
    fn(sh);
  };
  mat.customProgramCacheKey = () => key;
}

export function glassMaterial(rimColor = '#fff6ea') {
  const m = new THREE.MeshPhysicalMaterial({
    color: look.glass.clone(),
    metalness: 0,
    roughness: 0.035,
    transmission: 1,
    thickness: 0.07,
    ior: 1.5,
    attenuationColor: look.atten.clone(),
    attenuationDistance: 0.25,
    specularIntensity: 1,
    envMapIntensity: 1.15,
  });
  const rim = addRim(m, { color: rimColor, power: 3.4 });
  chain(m, 'baha-amber-glass-v2', (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vBahaY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBahaY = position.y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vBahaY;')
      .replace(
        '#include <transmission_fragment>',
        THREE.ShaderChunk.transmission_fragment.replace(
          'material.thickness = thickness;',
          // grazing view → longer path through the wall; punted base is solid glass
          `float bahaGraze = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 1.6);
           float bahaBase = 1.0 + 2.2 * (1.0 - smoothstep(0.03, 0.085, vBahaY));
           material.thickness = thickness * (1.0 + 3.2 * bahaGraze) * bahaBase;`,
        ),
      );
  });
  return rim;
}

export interface WaterMat {
  material: THREE.MeshPhysicalMaterial;
  fade: { value: number };
}

export function waterMaterial(doubleSided = false): WaterMat {
  const fade = { value: 1 };
  const m = new THREE.MeshPhysicalMaterial({
    color: '#000000',
    roughness: 0.02,
    metalness: 0,
    ior: 1.333,
    specularIntensity: 1,
    envMapIntensity: 2.2,
    transparent: true,
    depthWrite: false,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFade = fade;
    sh.uniforms.uEdge = { value: look.waterEdge };
    sh.uniforms.uBody = { value: look.bgMid };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFade;\nuniform vec3 uEdge;\nuniform vec3 uBody;')
      .replace(
        '#include <opaque_fragment>',
        // the set seen THROUGH the water (slightly darker, a lens), dark refraction rim, pure specular on top
        `vec3 wN = normalize(normal);
         float wNv = saturate(abs(dot(wN, normalize(vViewPosition))));
         float wSpec = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
         float wEdge = smoothstep(0.35, 0.94, 1.0 - wNv);
         float wUp = smoothstep(-0.1, 0.75, wN.y);
         // fake refraction (no 2nd transmission pass): the studio HDRI looked up along the REFRACTED ray (ior 1.33),
         // blended with the pale set behind → bright caustic cores, darker inverted surroundings, like a water lens
         #if defined( USE_ENVMAP ) && defined( STANDARD )
           // getIBLRadiance() samples reflect(-V, N); choosing N' = normalize(R - I) makes it return the REFRACTED ray R
           vec3 wV = normalize(vViewPosition);
           vec3 wRf = refract(-wV, wN, 0.752);
           vec3 wEnvR = getIBLRadiance(wV, normalize(wRf + wV), 0.03) * 0.55;
         #else
           vec3 wEnvR = uBody;
         #endif
         vec3 wCol = mix(uBody * (0.58 + 0.16 * wNv), wEnvR, 0.5 * wNv);
         wCol = mix(wCol, uEdge * 0.42, wEdge * 0.9 * (1.0 - 0.7 * wUp));
         // …and a bright caught-light rim on the upper edge, plus two sharp studio glints
         float wRim = pow(1.0 - wNv, 2.4) * (0.4 + 0.6 * wUp);
         vec3 wR = reflect(-normalize(vViewPosition), wN);
         float wGl = pow(max(dot(wR, normalize(vec3(-0.45, 0.7, 0.55))), 0.0), 120.0) * 1.9
                   + pow(max(dot(wR, normalize(vec3(0.62, 0.32, 0.7))), 0.0), 220.0) * 1.3;
         wCol += outgoingLight * 1.25 + vec3(wGl) + vec3(1.0, 0.99, 0.97) * wRim * 1.7;
         float wA = mix(0.34, 0.94, wEdge) + smoothstep(0.18, 0.8, wSpec) * 0.7 + min(1.0, wGl) + wRim * 0.9;
         outgoingLight = wCol;
         diffuseColor.a = clamp(wA, 0.0, 1.0) * uFade;
         #include <opaque_fragment>`,
      );
  };
  m.customProgramCacheKey = () => 'baha-water-v7';
  return { material: m, fade };
}

const FACE_VARIANTS: [number, number, number][] = [
  [3, 11, 1],
  [9, 10, 0.86],
];
let faceTex: ReturnType<typeof citrusFaceTextures>[] = [];
let rindTex: THREE.Texture | null = null;
/** generated once per page (before `ready`), shared by every citrus piece and the bokeh impostors */
export function citrusTextures(variant = 0) {
  const v = variant % FACE_VARIANTS.length;
  if (!faceTex[v]) faceTex[v] = citrusFaceTextures(512, ...FACE_VARIANTS[v]);
  if (!rindTex) rindTex = rindNormalTexture(256, 5);
  return { face: faceTex[v], rind: rindTex };
}
export function disposeCitrusTextures() {
  faceTex.forEach((f) => {
    f.map.dispose();
    f.normal.dispose();
  });
  rindTex?.dispose();
  faceTex = [];
  rindTex = null;
}

export function fleshMaterial(rim = false, variant = 0): { material: THREE.MeshPhysicalMaterial; uniforms: RimUniforms | null } {
  const tx = citrusTextures(variant);
  const m = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    map: tx.face.map,
    normalMap: tx.face.normal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.34,
    // wet film that follows every juice sac (clearcoat uses the same bumps → many small sharp highlights)
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    clearcoatNormalMap: tx.face.normal,
    clearcoatNormalScale: new THREE.Vector2(0.7, 0.7),
    envMapIntensity: 1.05,
  });
  const r = rim ? addRim(m, { color: '#ffffff', power: 2 }) : null;
  const apply = (sh: THREE.WebGLProgramParametersWithUniforms) => {
    sh.uniforms.uPulp = { value: look.pulp };
    sh.uniforms.uPith = { value: look.pith };
    sh.uniforms.uRindCut = { value: look.rindCut };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uPulp;\nuniform vec3 uPith;\nuniform vec3 uRindCut;')
      .replace(
        '#include <map_fragment>',
        `vec4 cT = texture2D(map, vMapUv);
         float cR = length(vMapUv - 0.5) * 2.0;
         // sacs lighter at the heart of the fruit, deeper toward the rind; per-sac brightness from R
         vec3 cPulp = uPulp * (0.5 + 0.62 * cT.r) * mix(1.12, 0.86, cR);
         // membranes/pith are cream and partly translucent (G < 1 lets the pulp colour through)
         vec3 cPith = mix(uPith, uPulp, 0.12) * (0.93 + 0.07 * cT.r);
         vec3 cCol = mix(cPith, cPulp, cT.g);
         cCol = mix(cCol, uRindCut * (0.9 + 0.14 * cT.r), cT.b);
         diffuseColor.rgb *= cCol;
         float cPulpMask = cT.g;
         float cDetail = cT.r;
         float cGloss = cT.a;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor = clamp(roughnessFactor * mix(1.35, 0.4, cGloss), 0.05, 1.0);`,
      )
      .replace(
        '#include <lights_physical_fragment>',
        `#include <lights_physical_fragment>
         #ifdef USE_CLEARCOAT
           material.clearcoat *= clamp(0.3 + cGloss + 0.25 * cPulpMask, 0.0, 1.0);
         #endif`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        // fake sub-surface scattering: light bleeding through the juice sacs, strongest toward the rind where the
        // flesh is thinnest; the pith ring glows faintly too (no second transmission pass)
        `#include <emissivemap_fragment>
         // deep, saturated wrap glow (uPulp²) inside each sac + the brighter juicy crest → translucent, mọng
         totalEmissiveRadiance += (uPulp * 0.6 + uPulp * uPulp * 0.6) * cPulpMask * (0.08 + 0.26 * cDetail) * (0.55 + 0.75 * cR);
         totalEmissiveRadiance += uPith * (1.0 - cPulpMask) * (1.0 - cT.b) * 0.05;`,
      );
  };
  if (r) chain(m, 'baha-flesh-rim-v3', apply);
  else {
    m.onBeforeCompile = apply;
    m.customProgramCacheKey = () => 'baha-flesh-v3';
  }
  return { material: m, uniforms: r ? r.uniforms : null };
}

export function rindMaterial(repeat: [number, number], rim = false): { material: THREE.MeshPhysicalMaterial; uniforms: RimUniforms | null } {
  const tx = citrusTextures();
  const n = tx.rind.clone();
  n.repeat.set(repeat[0], repeat[1]);
  n.needsUpdate = true;
  const m = new THREE.MeshPhysicalMaterial({
    normalMap: n,
    normalScale: new THREE.Vector2(0.55, 0.55),
    // waxy peel without a second (clearcoat) lobe — the iGPU budget goes to the glass
    roughness: 0.4,
    specularIntensity: 0.9,
    envMapIntensity: 1.0,
  });
  m.color = look.rind; // shared by reference → follows the variant lerp
  const r = rim ? addRim(m, { color: '#ffffff', power: 2 }) : null;
  return { material: m, uniforms: r ? r.uniforms : null };
}

/**
 * Moves a material out of three's transmission pre-pass (only OPAQUE objects are re-rendered into the transmission
 * target). Used for the citrus set: it is never seen through the amber glass + serum, so drawing it twice per frame
 * was pure cost on the iGPU. Still fully opaque and depth-writing, so occlusion is unchanged.
 */
export function skipTransmissionPass<T extends THREE.Material>(m: T) {
  m.transparent = true;
  m.depthWrite = true;
  m.opacity = 1;
  return m;
}
