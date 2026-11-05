/**
 * Site: a wide manicured lawn (CC0 leafy_grass scan, green-graded, mowing stripes, macro variation to kill tiling),
 * a band of real grass blades that follows the lens (world-anchored toroidal window → blades never swim), garden
 * trees (deciduous + pines, alpha leaf-card crowns with sky-bent normals so they read lit from every side), shrubs,
 * a dark tree line ring for depth, and a baked AO decal grounding house + trees.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { scrollState } from '../../lib/scroll';
import type { Lib } from './materials';
import { colliders, GLOW_DIR, lightState, nightOf, SUN_DIR } from './state';
import { cached, groundAO, leafClusterTexture, needleTexture, rng } from './textures';
import { SHRUB_BEDS } from './Props';

// ───────── placements (x, z, scale) — projected against the 0/25/50/62/75/100 % framings: nothing crosses a subject ─────────
type P3 = [number, number, number];
/**
 * v2.2: garden trees only as soft distant silhouettes — every tree stands 54–80 m from the villa, i.e. OUTSIDE the
 * hero/overview orbit circle (≈ 46–49 m), so no orbit angle ever puts a crown between the lens and the house.
 * Arc behind the house + both flanks, varied heights.
 */
function arc(n: number, seed: number, r0: number, r1: number, a0: number, a1: number, s0: number, s1: number): P3[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = THREE.MathUtils.degToRad(a0 + ((i + 0.5 + (r() - 0.5) * 0.7) / n) * (a1 - a0));
    const d = r0 + r() * (r1 - r0);
    return [Math.cos(a) * d, Math.sin(a) * d, s0 + r() * (s1 - s0)] as P3;
  });
}
const OAKS: P3[] = [...arc(10, 71, 54, 78, -168, -12, 1.25, 1.75), ...arc(2, 72, 56, 74, 10, 34, 1.2, 1.6), ...arc(2, 73, 56, 74, 150, 172, 1.2, 1.6)];
const PINES: P3[] = [...arc(7, 81, 56, 82, -175, -95, 1.15, 1.55), ...arc(3, 82, 58, 80, 165, 200, 1.2, 1.5), ...arc(2, 83, 58, 80, -60, -20, 1.1, 1.4)];
const SHRUBS: [number, number, number][] = [
  [15.6, 5.6, 0.8], [15.3, 2.4, 0.7], [16.1, 0.2, 0.85], [15.4, -2.2, 0.75], [15.8, -4.6, 0.8],
  [-14.4, 5.4, 0.8], [-14.0, 2.0, 0.72], [-14.6, -0.6, 0.85], [-14.1, -3.4, 0.75],
  [9.0, -8.2, 0.9], [3.5, -8.4, 0.8], [-4.5, -8.3, 0.85], [-9.5, -8.0, 0.8],
];
const OAK_H = 11; // crown centre height at scale 1
const OAK_R = 4.2; // crown radius at scale 1
const PINE_H = 16;

/**
 * Leaf-card crown: an OPAQUE lumpy core (first in the buffer → early-z rejects the cards behind it) wrapped in a
 * thin shell of alpha cards. Every card is emitted with BOTH windings (front-side material only) and a normal bent
 * from the crown centre towards the sky → the canopy reads as a lit volume (sun side warm, shade side cool)
 * instead of flat cards that go black when seen from behind. Cards sample uv 0.14…1 of the leaf texture, the core
 * samples the solid swatch in its corner (CORE_UV).
 */
const CORE_UV = 0.035;
function crownGeometry(seed: number, count: number, card: number, shape: (r: () => number) => THREE.Vector3, up = 0.45, core: (v: THREE.Vector3) => void = () => {}) {
  const r = rng(seed);
  const P: number[] = [], N: number[] = [], U: number[] = [];
  {
    const ico = new THREE.IcosahedronGeometry(1, 2); // polyhedra are already non-indexed
    const p = ico.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      n.copy(v).normalize().multiplyScalar(1 - up).add(new THREE.Vector3(0, up, 0)).normalize();
      core(v);
      P.push(v.x, v.y, v.z);
      N.push(n.x, n.y, n.z);
      U.push(CORE_UV, CORE_UV);
    }
    ico.dispose();
  }
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), n = new THREE.Vector3();
  const lo = 0.14;
  const corners: [number, number, number, number][] = [[-0.5, -0.5, lo, lo], [0.5, -0.5, 1, lo], [0.5, 0.5, 1, 1], [-0.5, 0.5, lo, 1]];
  for (let i = 0; i < count; i++) {
    const c = shape(r);
    e.set(r() * Math.PI, r() * Math.PI * 2, r() * Math.PI);
    q.setFromEuler(e);
    const s = card * (0.75 + r() * 0.5);
    const vs = corners.map(([x, y, u, w]) => {
      v.set(x * s, y * s, 0).applyQuaternion(q).add(c);
      n.copy(v).setY(v.y * 0.6);
      if (n.lengthSq() < 1e-4) n.set(0, 1, 0);
      n.normalize().multiplyScalar(1 - up).add(new THREE.Vector3(0, up, 0)).normalize();
      return [v.x, v.y, v.z, n.x, n.y, n.z, u, w];
    });
    for (const tri of [[0, 1, 2], [0, 2, 3], [0, 2, 1], [0, 3, 2]])
      for (const k of tri) {
        const a = vs[k];
        P.push(a[0], a[1], a[2]);
        N.push(a[3], a[4], a[5]);
        U.push(a[6], a[7]);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  return g;
}

/** deciduous crown: lumpy shell of 3 overlapping lobes (unit radius ≈ 1), flat-ish underside */
const oakShape = (r: () => number) => {
  const lobes = [[0, 0, 0, 1], [0.45, 0.25, 0.2, 0.7], [-0.4, 0.15, -0.3, 0.72]];
  const [lx, ly, lz, lr] = lobes[Math.floor(r() * 3)];
  const u = r() * 2 - 1, a = r() * Math.PI * 2, rad = lr * (0.86 + 0.2 * r());
  const s = Math.sqrt(1 - u * u);
  const y = ly + u * rad * 0.8;
  return new THREE.Vector3(lx + Math.cos(a) * s * rad, Math.max(y, -0.45), lz + Math.sin(a) * s * rad);
};
/** pine: whorls of drooping sprays on a cone (unit height 1 from y 0.18, base radius 0.3) */
const pineShape = (r: () => number) => {
  const t = Math.pow(r(), 0.8);
  const y = 0.18 + t * 0.8;
  const rad = (1 - t) * 0.3 * (0.8 + 0.25 * r()) + 0.02;
  const a = r() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad);
};

function trunkGeometry(h: number, r0: number, r1: number, branches: number, seed: number) {
  const parts: THREE.BufferGeometry[] = [];
  const t = new THREE.CylinderGeometry(r1, r0, h, 7, 1, true);
  t.translate(0, h / 2, 0);
  parts.push(t);
  const r = rng(seed);
  for (let i = 0; i < branches; i++) {
    const L = h * (0.24 + r() * 0.14); // short: branch tips stay inside the crown
    const b = new THREE.CylinderGeometry(r1 * 0.35, r1 * 0.7, L, 5, 1, true);
    b.translate(0, L / 2, 0);
    b.rotateZ(0.5 + r() * 0.5);
    b.rotateY((i / branches) * Math.PI * 2 + r());
    b.translate(0, h * (0.7 + r() * 0.25), 0);
    parts.push(b);
  }
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return g;
}

/** occluder fade (screen-door dither per instance) so a tree never sits between the lens and the façade */
const FADE_VERT = ['attribute float aFade;\nvarying float vFade;\n', 'vFade = aFade;\n'];
const FADE_FRAG = 'varying float vFade;\n';
const FADE_DISCARD = 'if (vFade < 0.55) discard;\n';
function withFade<T extends THREE.Material>(m: T, key: string) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = FADE_VERT[0] + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + FADE_VERT[1]);
    sh.fragmentShader = FADE_FRAG + sh.fragmentShader.replace('void main() {', 'void main() {\n' + FADE_DISCARD);
  };
  m.customProgramCacheKey = () => 'baha-tree-fade-' + key;
  return m;
}
/**
 * Vertex-lit foliage (the crowns are the biggest overdraw in the shot): hemisphere + key light evaluated per
 * vertex on the sky-bent crown normals, alpha-tested leaf texture, per-instance dither fade, fog. Same light
 * values as the scene (lightState), ~3× cheaper per fragment than Lambert.
 */
const FOLIAGE_VERT = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
uniform vec3 uSunDir, uSun, uSky, uGround, uGlowDir;
attribute float aFade;
varying vec2 vUv;
varying vec3 vLight;
varying float vFade;
varying float vHaze;
void main() {
  vUv = uv;
  vFade = aFade;
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = m * vec4(position, 1.0);
  vec3 n = normalize(mat3(m) * normal);
  vec3 tint = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  tint = instanceColor;
  #endif
  // three's Lambert: (hemi irradiance + key·N·L) · albedo / π
  // + a translucency lift: leaves scatter the key light through the crown (×2.4 matches the old per-pixel look)
  // + warm backlight from the afterglow behind the trees (translucent leaf rim), scaled with the key (fades at night)
  vec3 vd = normalize(cameraPosition - wp.xyz);
  float back = pow(max(dot(-vd, uGlowDir), 0.0), 3.0) * (0.35 + 0.65 * max(dot(n, uGlowDir), 0.0));
  vLight = tint * (mix(uGround, uSky, n.y * 0.5 + 0.5) + uSun * (max(dot(n, uSunDir), 0.0) + 0.18 + back * 0.9)) * RECIPROCAL_PI * 2.4;
  // aerial perspective: crowns lighten, lose contrast and turn slightly blue with distance
  vHaze = smoothstep(30.0, 160.0, distance(wp.xyz, cameraPosition)) * 0.5;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FOLIAGE_FRAG = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform sampler2D map;
uniform vec3 uEmissive;
uniform float uAlphaTest;
uniform vec3 uHaze;
varying vec2 vUv;
varying vec3 vLight;
varying float vFade;
varying float vHaze;
void main() {
  if (vFade < 0.02) discard;
  vec4 t = texture2D(map, vUv);
  if (t.a < uAlphaTest * 0.25) discard;
  vec3 c = mix(t.rgb * (vLight + uEmissive), uHaze, vHaze);
  // alpha-to-coverage (MSAA): soft leaf edges instead of hard cut-outs
  gl_FragColor = vec4(c, smoothstep(uAlphaTest * 0.45, uAlphaTest * 1.25, t.a) * vFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
function foliageMaterial(map: THREE.Texture, emissive: string, alphaTest: number) {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      { map: { value: null }, uEmissive: { value: new THREE.Color(emissive) }, uAlphaTest: { value: alphaTest }, uSunDir: { value: SUN_DIR }, uGlowDir: { value: GLOW_DIR }, uHaze: { value: new THREE.Color() } },
    ]),
    alphaToCoverage: true,
    vertexShader: FOLIAGE_VERT,
    fragmentShader: FOLIAGE_FRAG,
    fog: true,
  });
}
function bindFoliage(m: THREE.ShaderMaterial, map: THREE.Texture) {
  m.uniforms.map.value = map;
  m.uniforms.uSunDir.value = SUN_DIR;
  // live light colours (same Color objects the scene writes every frame)
  m.uniforms.uSun = { value: lightState.sun };
  m.uniforms.uSky = { value: lightState.sky };
  m.uniforms.uGround = { value: lightState.ground };
  m.uniforms.uHaze = { value: HAZE };
  return m;
}

/** aerial haze colour (shared by all foliage), graded dusk → night in Landscape's frame loop */
const HAZE = new THREE.Color();
const HAZE_DUSK = new THREE.Color('#c4a68e');
const HAZE_NIGHT = new THREE.Color('#0e1522');

const VILLA_CORNERS = [-12.4, 13.8].flatMap((x) => [0, 9.6].flatMap((y) => [-6.1, 6.2].map((z) => new THREE.Vector3(x, y, z))));
const _v = new THREE.Vector3();

const M = (x: number, y: number, z: number, ry = 0, s = 1, sy = s, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, sy, s));

function Instanced({ geometry, material, mats, colors, castShadow = true, receiveShadow = false, depth }: { geometry: THREE.BufferGeometry; material: THREE.Material; mats: THREE.Matrix4[]; colors?: THREE.Color[]; castShadow?: boolean; receiveShadow?: boolean; depth?: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    mats.forEach((x, i) => m.setMatrixAt(i, x));
    colors?.forEach((c, i) => m.setColorAt(i, c));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    if (depth) m.customDepthMaterial = depth;
  }, [mats, colors, depth]);
  return <instancedMesh ref={ref} args={[geometry, material, mats.length]} castShadow={castShadow} receiveShadow={receiveShadow} />;
}

// ───────── lawn shading: scan luminance → manicured green, mowing stripes, macro variation ─────────
function lawnMaterial(lib: Lib, ao: THREE.Texture, aoSize: number) {
  const g = lib.sets.leafy_grass;
  const m = new THREE.MeshLambertMaterial({ map: g.map, normalMap: g.normal, normalScale: new THREE.Vector2(0.9, 0.9), color: '#ffffff' });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGroundAO = { value: ao };
    sh.uniforms.uSunCol = { value: lightState.sun };
    sh.vertexShader = 'varying vec3 vLawnW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvLawnW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader =
      'varying vec3 vLawnW;\nuniform sampler2D uGroundAO;\nuniform vec3 uSunCol;\n' +
      sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
        {
          // warm sun glints on blade tips, strongest at grazing view (sparse mask from the scan's bright texels)
          vec3 V = normalize(cameraPosition - vLawnW);
          float sparkle = bahaSpark;
          totalEmissiveRadiance += uSunCol * sparkle * 0.012 * (0.3 + 0.7 * pow(1.0 - V.y, 3.0));
        }`,
      ).replace(
        '#include <map_fragment>',
        /* glsl */ `float bahaSpark = 0.0;
        #include <map_fragment>
        {
          float l = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          bahaSpark = smoothstep(0.42, 0.62, l);
          // deep, slightly desaturated lawn green
          vec3 green = vec3(0.1, 0.195, 0.054) * (0.5 + 1.4 * l);
          diffuseColor.rgb = mix(green, vec3(l) * vec3(0.5, 0.62, 0.38), 0.12);
          // gentle mowing stripes, 4 m wide, soft edges
          float sp = sin(dot(vLawnW.xz, vec2(0.6, 0.8)) * 0.785);
          float sfar = smoothstep(8.0, 70.0, distance(vLawnW, cameraPosition));
          diffuseColor.rgb *= mix(mix(0.95, 0.86, sfar), mix(1.04, 1.12, sfar), smoothstep(-0.4, 0.4, sp));
          // two scales of macro variation (≈19× and ≈90× the tile) break the repeat into soft patches
          float macro = texture2D(map, vMapUv * 0.053 + vec2(0.31, 0.17)).g;
          float macro2 = texture2D(map, vMapUv * 0.011 + vec2(0.63, 0.29)).g;
          diffuseColor.rgb *= (0.84 + 0.32 * macro) * (0.82 + 0.36 * macro2);
          // darker foreground (the lens sits in the shade of the near lawn, like the reference)
          diffuseColor.rgb *= mix(0.74, 1.0, smoothstep(3.0, 42.0, distance(vLawnW, cameraPosition)));
          // baked contact AO of the house + trees (was a separate blended decal → one full-screen layer saved)
          vec2 aoUv = vLawnW.xz / ${aoSize.toFixed(1)} + 0.5;
          float occ = (aoUv.x > 0.0 && aoUv.x < 1.0 && aoUv.y > 0.0 && aoUv.y < 1.0) ? texture2D(uGroundAO, vec2(aoUv.x, 1.0 - aoUv.y)).r : 0.0;
          diffuseColor.rgb *= 1.0 - 0.8 * occ;
        }`,
      );
  };
  m.customProgramCacheKey = () => 'baha-lawn';
  return m;
}

// ───────── grass blades: a window of N blades that follows the lens ─────────
const BLADES = 48000;
const GR = 13; // half-size of the window (m)
function grassGeometry() {
  const r = rng(2024);
  const pos = new Float32Array(BLADES * 9);
  const off = new Float32Array(BLADES * 6);
  const rnd = new Float32Array(BLADES * 9);
  for (let i = 0; i < BLADES; i++) {
    const ox = r() * GR * 2, oz = r() * GR * 2;
    const a = r(), b = r(), c = r();
    const verts = [[-1, 0], [1, 0], [0, 1]];
    for (let k = 0; k < 3; k++) {
      const j = i * 3 + k;
      pos.set([verts[k][0], verts[k][1], 0], j * 3);
      off.set([ox, oz], j * 2);
      rnd.set([a, b, c], j * 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aOff', new THREE.BufferAttribute(off, 2));
  g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
function grassMaterial() {
  const u = {
    uCenter: { value: new THREE.Vector2() },
    uOn: { value: 1 },
    uTime: { value: 0 },
  };
  const m = new THREE.MeshLambertMaterial({ color: '#3d5a26' });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader =
      'uniform vec2 uCenter;\nuniform float uOn;\nuniform float uTime;\nattribute vec2 aOff;\nattribute vec3 aRnd;\nvarying float vT;\n' +
      sh.vertexShader
        .replace(
          '#include <beginnormal_vertex>',
          /* glsl */ `
          vec2 rel = mod(aOff - uCenter + ${GR.toFixed(1)}, ${(GR * 2).toFixed(1)}) - ${GR.toFixed(1)};
          vec2 wp = uCenter + rel;
          float edge = 1.0 - smoothstep(${(GR * 0.55).toFixed(2)}, ${(GR * 0.97).toFixed(2)}, length(rel));
          float lens = smoothstep(2.6, 5.5, distance(wp, cameraPosition.xz));
          vec2 hq = abs(wp - vec2(0.75, 1.1)) - vec2(13.9, 7.95); // terrace + house footprint
          float outside = smoothstep(0.0, 0.35, max(hq.x, hq.y));
          float bh = (0.03 + 0.045 * aRnd.x * aRnd.x) * edge * lens * outside * uOn;
          // blades turn their face to the lens (± a random twist) → always front-facing, full width
          vec2 tc = normalize(cameraPosition.xz - wp + vec2(1e-4));
          float tw = (aRnd.y - 0.5) * 1.2;
          vec2 bd = vec2(tc.y, -tc.x) * cos(tw) + tc * sin(tw);
          float bw = 0.005 + 0.004 * aRnd.z;
          float t = position.y;
          vec2 lean = (vec2(aRnd.z, aRnd.x) - 0.5) * 0.05 * t
            + vec2(sin(uTime * 1.3 + wp.x * 0.35 + wp.y * 0.21), cos(uTime * 1.1 + wp.y * 0.3)) * 0.01 * t;
          vT = t;
          vec3 objectNormal = normalize(vec3(tc.x * 0.45, 1.0, tc.y * 0.45));
          #ifdef USE_TANGENT
          vec3 objectTangent = vec3(1.0, 0.0, 0.0);
          #endif`,
        )
        .replace(
          '#include <begin_vertex>',
          'vec3 transformed = vec3(wp.x + bd.x * position.x * bw * (1.0 - t) + lean.x, bh * t, wp.y + bd.y * position.x * bw * (1.0 - t) + lean.y);',
        );
    sh.fragmentShader = 'varying float vT;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= mix(0.55, 0.9, vT);');
  };
  m.customProgramCacheKey = () => 'baha-grass';
  return { m, u };
}

export function Landscape({ lib }: { lib: Lib }) {
  const res = useMemo(() => {
    const leafT = cached('leafCluster', leafClusterTexture);
    const needleT = cached('needles', needleTexture);
    const barkT = cached('bark1', () => {
      const t = new THREE.DataTexture(new Uint8Array([74, 60, 50, 255]), 1, 1);
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      return t;
    });
    const fade = new THREE.InstancedBufferAttribute(new Float32Array(OAKS.length).fill(1), 1);
    const pineFade = new THREE.InstancedBufferAttribute(new Float32Array(PINES.length).fill(1), 1);
    fade.setUsage(THREE.DynamicDrawUsage);
    pineFade.setUsage(THREE.DynamicDrawUsage);

    // cores: lumpy lobed ellipsoid (oak), cone (pine), squat blob (shrub) — all inside the card shell
    const lump = (v: THREE.Vector3, k: number) => v.multiplyScalar(k * (0.9 + 0.1 * Math.sin(v.x * 5.1 + v.y * 3.3) * Math.cos(v.z * 4.3)));
    const oakCrown = crownGeometry(11, 150, 0.6, oakShape, 0.45, (v) => {
      lump(v, 0.66);
      if (v.y < -0.3) v.y = -0.3 + (v.y + 0.3) * 0.5;
    });
    const pineCrown = crownGeometry(23, 150, 0.13, pineShape, 0.35, (v) => {
      const y = 0.2 + (v.y * 0.5 + 0.5) * 0.74; // cone from 0.2 to 0.94
      const rad = (1 - (y - 0.2) / 0.74) * 0.24 + 0.01;
      const a = Math.atan2(v.z, v.x);
      v.set(Math.cos(a) * rad, y, Math.sin(a) * rad);
    });
    const shrubCrown = crownGeometry(31, 50, 0.55, oakShape, 0.5, (v) => {
      lump(v, 0.78);
    });
    const oakTrunk = trunkGeometry(OAK_H * 0.72, 0.32, 0.2, 4, 3);
    const pineTrunk = trunkGeometry(PINE_H * 0.9, 0.3, 0.08, 0, 5);
    oakCrown.setAttribute('aFade', fade);
    oakTrunk.setAttribute('aFade', fade);
    pineCrown.setAttribute('aFade', pineFade);
    pineTrunk.setAttribute('aFade', pineFade);

    const mats = {
      oak: bindFoliage(foliageMaterial(leafT, '#090d06', 0.5), leafT),
      pine: bindFoliage(foliageMaterial(needleT, '#040705', 0.45), needleT),
      shrub: bindFoliage(foliageMaterial(leafT, '#080b05', 0.5), leafT),
      bark: bindFoliage(foliageMaterial(barkT, '#000000', 0.5), barkT),
      barkPine: bindFoliage(foliageMaterial(barkT, '#000000', 0.5), barkT),
    };
    const depthOak = new THREE.MeshDepthMaterial({ map: leafT, alphaTest: 0.45, depthPacking: THREE.RGBADepthPacking });
    const depthPine = new THREE.MeshDepthMaterial({ map: needleT, alphaTest: 0.45, depthPacking: THREE.RGBADepthPacking });

    const r = rng(4242);
    const oakM = OAKS.map(([x, z, s], i) => M(x, 0, z, i * 1.7, s));
    const oakCrownM = OAKS.map(([x, z, s], i) => M(x, OAK_H * s, z, i * 2.3, OAK_R * s, OAK_R * s * 0.82));
    const oakC = OAKS.map(() => new THREE.Color().setHSL(0.19 + r() * 0.07, 0.18 + r() * 0.1, 0.25 + r() * 0.07));
    const pineM = PINES.map(([x, z, s], i) => M(x, 0, z, i * 1.1, s));
    const pineCrownM = PINES.map(([x, z, s], i) => M(x, 0, z, i * 0.9, PINE_H * s * 0.95, PINE_H * s));
    const pineC = PINES.map(() => new THREE.Color().setHSL(0.3 + r() * 0.06, 0.16 + r() * 0.08, 0.36 + r() * 0.08));
    const shrubM = SHRUBS.map(([x, z, s], i) => M(x, 0.75 * s, z, i * 1.3, 1.25 * s, 0.85 * s));
    const shrubC = SHRUBS.map(() => new THREE.Color().setHSL(0.24 + r() * 0.06, 0.25 + r() * 0.1, 0.3 + r() * 0.06));

    // tree line ring at 110–175 m (depth layer, also behind the house; beyond the farthest lens — portrait phones
    // back the camera off to ~100 m — so it never sits between the camera and the villa): crowns + pines, vertex-lit
    const canopyM: THREE.Matrix4[] = [];
    const canopyC: THREE.Color[] = [];
    const ringPineM: THREE.Matrix4[] = [];
    const ringPineC: THREE.Color[] = [];
    for (let i = 0; i < 110; i++) {
      const a = r() * Math.PI * 2;
      const d = 110 + r() * 65;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (r() < 0.3) {
        const h = 16 + r() * 12;
        ringPineM.push(M(x, 0, z, r() * 6, h * 0.9, h));
        ringPineC.push(new THREE.Color().setHSL(0.3 + r() * 0.05, 0.14 + r() * 0.08, 0.22 + r() * 0.06));
      } else {
        const s = 5.5 + r() * 6;
        canopyM.push(M(x, s * 0.85 + 2, z, r() * 6, s, s * (0.8 + r() * 0.4)));
        canopyC.push(new THREE.Color().setHSL(0.21 + r() * 0.08, 0.16 + r() * 0.1, 0.2 + r() * 0.07));
      }
    }
    const withOnes = (g: THREE.BufferGeometry, n: number) => {
      g.setAttribute('aFade', new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1));
      return g;
    };
    const canopy = withOnes(crownGeometry(41, 48, 0.85, oakShape, 0.5, (v) => lump(v, 0.72)), canopyM.length);
    const ringPine = withOnes(crownGeometry(43, 64, 0.18, pineShape, 0.35, (v) => {
      const y = 0.2 + (v.y * 0.5 + 0.5) * 0.74;
      const rad = (1 - (y - 0.2) / 0.74) * 0.24 + 0.01;
      const a = Math.atan2(v.z, v.x);
      v.set(Math.cos(a) * rad, y, Math.sin(a) * rad);
    }), ringPineM.length);

    // collision volumes for the camera (spheres: x, y, z, r)
    colliders.spheres = [
      ...OAKS.map(([x, z, s]) => [x, OAK_H * s, z, OAK_R * s * 0.95] as [number, number, number, number]),
      ...OAKS.flatMap(([x, z, s]) => [0.2, 0.45].map((f) => [x, OAK_H * s * f, z, 0.7] as [number, number, number, number])),
      ...PINES.flatMap(([x, z, s]) => [0.3, 0.55, 0.8].map((f) => [x, PINE_H * s * f, z, (1 - f) * 0.3 * PINE_H * s * 0.95 + 0.6] as [number, number, number, number])),
      ...SHRUBS.map(([x, z, s]) => [x, 0.75 * s, z, 1.2 * s] as [number, number, number, number]),
      ...SHRUB_BEDS.map(([x, z]) => [x, 0.4, z, 0.6] as [number, number, number, number]),
      ...ringPineM.map((m) => {
        const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
        m.decompose(p, q, sc);
        return [p.x, sc.y * 0.45, p.z, sc.x * 0.28 + 1] as [number, number, number, number];
      }),
      ...canopyM.map((m) => {
        const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
        m.decompose(p, q, sc);
        return [p.x, p.y, p.z, Math.max(sc.x, sc.y) * 1.05] as [number, number, number, number];
      }),
    ];

    // AO decal: house + terrace edge, every trunk / shrub
    const aoSize = 110;
    const ao = groundAO(
      aoSize,
      [[-12.9, -6.6, 14.4, 8.8, 0.85]],
      [
        ...OAKS.map(([x, z, s]) => [x, z, 3.2 * s, 0.6] as [number, number, number, number]),
        ...PINES.map(([x, z, s]) => [x, z, 2.4 * s, 0.6] as [number, number, number, number]),
        ...SHRUBS.map(([x, z, s]) => [x, z, 1.8 * s, 0.6] as [number, number, number, number]),
        ...SHRUB_BEDS.map(([x, z]) => [x, z, 1.2, 0.45] as [number, number, number, number]),
      ],
    );
    const lawnMat = lawnMaterial(lib, ao, aoSize);
    shrubCrown.setAttribute('aFade', new THREE.InstancedBufferAttribute(new Float32Array(SHRUBS.length).fill(1), 1));

    // lawn disc with metre UVs (tile 1.8 m)
    const lawn = new THREE.CircleGeometry(320, 96);
    {
      const p = lawn.attributes.position as THREE.BufferAttribute;
      const uv = lawn.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 1.8, p.getY(i) / 1.8);
    }
    const grass = grassGeometry();
    const grassMat = grassMaterial();
    return { lawnMat, ao, fade, pineFade, oakCrown, pineCrown, shrubCrown, oakTrunk, pineTrunk, mats, depthOak, depthPine, oakM, oakCrownM, oakC, pineM, pineCrownM, pineC, shrubM, shrubC, canopy, canopyM, canopyC, ringPine, ringPineM, ringPineC, aoSize, lawn, grass, grassMat };
  }, [lib]);

  useEffect(
    () => () => {
      Object.values(res.mats).forEach((m) => {
        m.dispose();
      });
      res.grassMat.m.dispose();
      res.lawnMat.dispose();
      res.ao.dispose();
      res.depthOak.dispose();
      res.depthPine.dispose();
      [res.oakCrown, res.pineCrown, res.shrubCrown, res.oakTrunk, res.pineTrunk, res.canopy, res.ringPine, res.lawn, res.grass].forEach((g) => g.dispose());
    },
    [res],
  );

  const grassMesh = useRef<THREE.Mesh>(null);
  const fadeNow = useMemo(() => ({ oak: new Float32Array(OAKS.length).fill(1), pine: new Float32Array(PINES.length).fill(1) }), []);
  const _f = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, clock }, delta) => {
    // grass window: centred ahead of the lens, hidden once the camera is high (blades would be sub-pixel)
    const u = res.grassMat.u;
    camera.getWorldDirection(_f);
    _f.y = 0;
    if (_f.lengthSq() < 1e-6) _f.set(0, 0, -1);
    _f.normalize();
    u.uCenter.value.set(camera.position.x + _f.x * GR * 0.78, camera.position.z + _f.z * GR * 0.78);
    u.uOn.value = 1 - THREE.MathUtils.smoothstep(camera.position.y, 6.5, 9.5);
    u.uTime.value = clock.elapsedTime;
    if (grassMesh.current) grassMesh.current.visible = u.uOn.value > 0.01;

    // occluder fade: project the villa's box, then fade any tree (trunk or crown disc) standing in front of it
    // whose screen footprint overlaps the house — and any tree whose crown would brush the lens
    let x0 = 1, x1 = -1, y0 = 1, y1 = -1;
    for (const c of VILLA_CORNERS) {
      _v.copy(c).project(camera);
      x0 = Math.min(x0, _v.x);
      x1 = Math.max(x1, _v.x);
      y0 = Math.min(y0, _v.y);
      y1 = Math.max(y1, _v.y);
    }
    const vcx = (x0 + x1) / 2, vhw = Math.max(0, (x1 - x0) / 2 - 0.05), vcy = (y0 + y1) / 2, vhh = Math.max(0, (y1 - y0) / 2 - 0.05);
    const villaDist = camera.position.distanceTo(_v.set(0.7, 4, 0));
    const cam = camera as THREE.PerspectiveCamera;
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), tanH = tanV * cam.aspect;
    const k = 1 - Math.exp(-6 * Math.min(delta, 0.05));
    const covers = (px: number, py: number, pz: number, r: number) => {
      _v.set(px, py, pz);
      const d = _v.distanceTo(camera.position);
      if (d > villaDist - 3) return false;
      _v.project(camera);
      if (_v.z > 1) return false;
      const rx = r / (d * tanH), ry = r / (d * tanV);
      const dx = Math.max(0, Math.abs(_v.x - vcx) - vhw), dy = Math.max(0, Math.abs(_v.y - vcy) - vhh);
      return dx < rx * 0.8 && dy < ry * 0.8;
    };
    // samples per tree: [height fraction, radius at scale 1] — trunk, lower crown, crown centre
    const step = (list: P3[], now: Float32Array, attr: THREE.InstancedBufferAttribute, h: number, samples: [number, number][], crownR: number) => {
      let dirty = false;
      list.forEach(([x, z, s], i) => {
        let want = 1;
        const near = Math.hypot(camera.position.x - x, camera.position.z - z);
        if (near < 5 + crownR * s) want = 0;
        else for (const [f, r] of samples) if (covers(x, h * s * f, z, r * s)) want = 0;
        const cur = now[i];
        const nxt = Math.abs(want - cur) < 0.01 ? want : cur + (want - cur) * k;
        if (nxt !== cur) {
          now[i] = nxt;
          attr.setX(i, nxt);
          dirty = true;
        }
      });
      if (dirty) attr.needsUpdate = true;
    };
    step(OAKS, fadeNow.oak, res.fade, OAK_H, [[0.3, 0.4], [0.85, OAK_R * 0.8], [1.0, OAK_R]], OAK_R);
    step(PINES, fadeNow.pine, res.pineFade, PINE_H, [[0.25, 0.4], [0.45, 3.6], [0.7, 2.2]], 3);

    const n = nightOf(scrollState.smooth);
    HAZE.lerpColors(HAZE_DUSK, HAZE_NIGHT, n);
    const e = 1 - 0.75 * n;
    res.mats.oak.uniforms.uEmissive.value.setRGB(0.009 * e, 0.014 * e, 0.006 * e);
    res.mats.pine.uniforms.uEmissive.value.setRGB(0.004 * e, 0.007 * e, 0.005 * e);
  });

  return (
    <group name="land">
      <mesh name="lawn" geometry={res.lawn} rotation-x={-Math.PI / 2} receiveShadow material={res.lawnMat} />
      <mesh name="grass" ref={grassMesh} geometry={res.grass} material={res.grassMat.m} receiveShadow frustumCulled={false} />
      {/* garden trees */}
      <group name="trees">
      <Instanced geometry={res.oakTrunk} material={res.mats.bark} mats={res.oakM} castShadow={false} />
      <Instanced geometry={res.oakCrown} material={res.mats.oak} mats={res.oakCrownM} colors={res.oakC} castShadow={false} />
      <Instanced geometry={res.pineTrunk} material={res.mats.barkPine} mats={res.pineM} castShadow={false} />
      <Instanced geometry={res.pineCrown} material={res.mats.pine} mats={res.pineCrownM} colors={res.pineC} castShadow={false} />
      </group>
      {/* dark leaf-card shrub masses along the flanks / back (the Poly Haven beds are in Props) */}
      <Instanced geometry={res.shrubCrown} material={res.mats.shrub} mats={res.shrubM} colors={res.shrubC} castShadow={false} />
      {/* tree line ring */}
      <Instanced geometry={res.canopy} material={res.mats.shrub} mats={res.canopyM} colors={res.canopyC} castShadow={false} />
      <Instanced geometry={res.ringPine} material={res.mats.pine} mats={res.ringPineM} colors={res.ringPineC} castShadow={false} />
    </group>
  );
}
