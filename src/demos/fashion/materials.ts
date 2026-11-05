/**
 * Shell nylon = MeshPhysicalMaterial (clearcoat + sheen + crinkle normal map) wrapped by the shared hover rim,
 * then extended with per-pixel quilting detail driven by the `aSeam` attribute:
 *   • seam valley occlusion (darker pinch line between chambers)
 *   • stitch dashes along every chamber seam + two placket stitch rows beside the zip
 * Everything is anti-aliased with fwidth so the stitching fades instead of shimmering at distance.
 */
import * as THREE from 'three';
import { addRim, type RimUniforms } from '../../lib/rim';
import { COLOURWAYS } from './palette';
import { crinkleNormalMap } from './textures';

export interface ShellUniforms {
  uStitch: { value: number };
}

let sharedNormal: THREE.Texture | null = null;

/**
 * @param withDissolve false for the flying "next look" copy: it must stay solid while the hero is dissolved.
 * Both use the same shading so the hand-over from the copy to the hero is a one-frame swap with no visible change.
 */
export function createShellMaterial(withDissolve = true) {
  const c0 = COLOURWAYS[0];
  const normalMap = (sharedNormal ??= crinkleNormalMap(512));
  const mat = new THREE.MeshPhysicalMaterial({
    color: c0.shell,
    roughness: c0.roughness,
    metalness: 0,
    clearcoat: c0.clearcoat,
    // wet ciré top coat that follows the crinkle too, so its highlight breaks into small streaks instead of
    // one continuous plastic sheet
    clearcoatRoughness: 0.24,
    clearcoatNormalMap: normalMap,
    clearcoatNormalScale: new THREE.Vector2(0.14, 0.14),
    // a soft, broad sheen lobe: the matte nylon base reads as fabric rather than vinyl
    sheen: 0.45,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color(c0.sheenColor),
    normalMap,
    normalScale: new THREE.Vector2(0.26, 0.26),
    envMapIntensity: 0.68,
    side: THREE.FrontSide,
  });
  mat.fog = false;
  // tight Fresnel (silhouette only — a soft power lit every seam like an X-ray)
  const { uniforms } = addRim(mat, { color: '#ffffff', power: 3.4 });
  const extra: ShellUniforms = { uStitch: { value: 1 } };
  const rimCompile = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    rimCompile.call(mat, shader, renderer);
    shader.uniforms.uStitch = extra.uStitch;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aSeam;\nvarying vec4 vSeam;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSeam = aSeam;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vSeam;\nuniform float uStitch;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          float ph = vSeam.x;
          float dS = abs(fract(ph + 0.5) - 0.5);          // 0 on the stitch line, .5 mid-chamber
          float wS = dS * vSeam.w;                          // world distance to the seam
          // pinch occlusion in the valley
          float valley = smoothstep(0.0, 0.2, dS);
          diffuseColor.rgb *= mix(0.5, 1.0, valley);
          // chamber stitches: dashed line along the seam
          float fw = max(fwidth(wS), 1e-5);
          float line = 1.0 - smoothstep(0.0011 - fw, 0.0011 + fw, wS);
          float along = vSeam.y * 150.0;
          float fa = fwidth(along);
          float dash = smoothstep(0.32 - fa, 0.32 + fa, fract(along)) * (1.0 - smoothstep(0.92 - fa, 0.92 + fa, fract(along)));
          float vis = clamp(1.6 - fa * 2.2, 0.0, 1.0);
          float st = line * mix(1.0, dash, vis) * step(-0.5, ph);
          // two stitch rows either side of the zip placket
          float pd = abs(vSeam.z - 0.034);
          float fp = max(fwidth(vSeam.z), 1e-5);
          float pl = 1.0 - smoothstep(0.0009 - fp, 0.0009 + fp, pd);
          float along2 = ph * vSeam.w * 150.0;
          float fa2 = fwidth(along2);
          float dash2 = smoothstep(0.32 - fa2, 0.32 + fa2, fract(along2)) * (1.0 - smoothstep(0.92 - fa2, 0.92 + fa2, fract(along2)));
          pl *= mix(1.0, dash2, clamp(1.6 - fa2 * 2.2, 0.0, 1.0));
          float stitch = max(st, pl) * uStitch;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.42, stitch);
        }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        {
          // uneven sheen: crests a touch glossier, seams/creases rougher, slow irregular variation along the chamber
          float dS2 = abs(fract(vSeam.x + 0.5) - 0.5);
          float crest = smoothstep(0.08, 0.42, dS2);
          float wob = sin(vSeam.y * 23.0 + vSeam.x * 3.1) * sin(vSeam.y * 9.0 - vSeam.x * 7.3);
          float fine = sin(vSeam.y * 140.0 + vSeam.x * 19.0) * sin(vSeam.y * 61.0 - vSeam.x * 43.0);
          roughnessFactor = clamp(roughnessFactor + 0.16 * (1.0 - crest) + 0.07 * wob + 0.02 * fine, 0.08, 1.0);
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'baha-rim-v1-fashion-shell';
  if (withDissolve) addDissolve(mat);
  return { material: mat, uniforms, extra, normalMap };
}

/**
 * Colourway swap dissolve, shared by every jacket material: object-space 3D value noise; fragments below
 * `uDissolve` are discarded and a thin glowing edge (world rim colour) runs along the dissolve front.
 * uDissolve = 0 → fully solid (the branch costs one noise lookup).
 */
export const dissolve = {
  uDissolve: { value: 0 },
  uDisColor: { value: new THREE.Color('#ffffff') },
  uDisDir: { value: new THREE.Vector3(-0.85, 0.53, 0).normalize() },
};

const DIS_GLSL = /* glsl */ `
uniform float uDissolve;
uniform vec3 uDisColor;
varying vec3 vDisPos;
float disH(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float disN(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(disH(i), disH(i + vec3(1, 0, 0)), f.x), mix(disH(i + vec3(0, 1, 0)), disH(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(disH(i + vec3(0, 0, 1)), disH(i + vec3(1, 0, 1)), f.x), mix(disH(i + vec3(0, 1, 1)), disH(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// directional sweep (along the flight axis) broken up by FINE noise: the garment burns off in a clean,
// travelling front with a thin bright edge — no large blotches
uniform vec3 uDisDir;
float disField() {
  float sweep = 0.5 + 0.5 * clamp(dot(vDisPos, uDisDir) / 0.85, -1.0, 1.0);
  return clamp(sweep * 0.62 + disN(vDisPos * 22.0) * 0.28 + disN(vDisPos * 61.0) * 0.1, 0.0, 1.0);
}
`;

/** inner surfaces (lining, caps, wrist holes) dissolve ahead of the shell so the holes never show a dark core */
export const dissolveInner = { uDissolve: { value: 0 } };

export function addDissolve<T extends THREE.Material>(mat: T, inner = false) {
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey?.bind(mat);
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    shader.uniforms.uDissolve = inner ? dissolveInner.uDissolve : dissolve.uDissolve;
    shader.uniforms.uDisColor = dissolve.uDisColor;
    shader.uniforms.uDisDir = dissolve.uDisDir;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDisPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDisPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + DIS_GLSL)
      .replace(
        '#include <clipping_planes_fragment>',
        // threshold spans [-0.02, 1.02] so 0 = fully solid and 1 = fully gone (no stray specks at either end)
        '#include <clipping_planes_fragment>\nfloat disOn = step(0.0005, uDissolve);\nfloat disThr = uDissolve * 1.04 - 0.02;\nfloat disV = disOn > 0.5 ? disField() : 1.0;\nif (disV < disThr) discard;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uDisColor * (1.0 - smoothstep(disThr, disThr + 0.025, disV)) * disOn * 2.2;',
      );
  };
  const base = prevKey ? prevKey() : mat.type;
  mat.customProgramCacheKey = () => `${base}-fx-dissolve${inner ? '-in' : ''}`;
  return mat;
}

export function createRibMaterial() {
  const c0 = COLOURWAYS[0];
  const mat = new THREE.MeshStandardMaterial({ color: c0.rib, roughness: 0.78, metalness: 0 });
  mat.fog = false;
  const { uniforms } = addRim(mat, { color: '#ffffff', power: 2.4 });
  addDissolve(mat);
  return { material: mat, uniforms };
}

export type { RimUniforms };
