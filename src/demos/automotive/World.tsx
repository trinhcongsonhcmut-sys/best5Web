import { useEffect, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import { grainTexture } from './materials';
import { SUN, anim } from './anim';
import { FX_LAYER } from './layers';

/**
 * Golden-hour world built on the approved CC0 HDRI WITH terrain (Poly Haven evening_road_01):
 *  - the photo is graded ONCE on the GPU into a half-float equirect (sunset sky palette driven by the HDRI's own cloud
 *    structure; the dry field / road photo warmed and hazed toward the horizon) and rotated so the low sun sits just
 *    right of the hero frame, behind the car;
 *  - that single map is the visible backdrop (ground-projected skybox → real landscape all around, no seams) AND the
 *    PMREM image-based lighting (sharp sky / dark ground split → horizon line in the paint);
 *  - near field: CC0 asphalt road + dusty shoulder that fade into the projected photo ground, CC0 roadside shrubs,
 *    two far hazy mountain layers behind the photo's tree line.
 */
const TERRAIN = '/assets/hdri/evening_road_01_2k.hdr';
const ASPHALT = '/assets/textures/asphalt_02/asphalt_02';
const SHRUBS = ['/assets/models/polyhaven/shrub_03/shrub_03_lite.glb', '/assets/models/polyhaven/shrub_04/shrub_04_lite.glb'];
export const HAZE = '#dc9f6c';
/** height of the HDRI camera above its ground (m) → scale of the projected landscape; radius = backdrop dome */
const SKY = { height: 1.9, radius: 380 };
const fx = (o: THREE.Object3D) => o.layers.set(FX_LAYER);

useLoader.preload(HDRLoader, TERRAIN);
useLoader.preload(THREE.TextureLoader, [`${ASPHALT}_diff_2k.jpg`, `${ASPHALT}_nor_gl_2k.jpg`, `${ASPHALT}_arm_2k.jpg`]);
SHRUBS.forEach((u) => useGLTF.preload(u, false, false));

/* ───────────── one-time grade of the terrain HDRI (equirect → equirect, half float) ───────────── */
const GRADE_FRAG = /* glsl */ `
uniform sampler2D map; uniform vec3 uSun; uniform float uOff;
varying vec2 vUv;
const vec3 LUM = vec3(0.2126, 0.7152, 0.0722);
vec3 grad(float yy, vec3 h, vec3 m, vec3 t){ return mix(mix(h, m, smoothstep(0.0, 0.1, yy)), t, smoothstep(0.1, 0.5, yy)); }
void main(){
  vec2 su = vec2(fract(vUv.x + uOff), vUv.y);
  // paint out the photo's roadside sign (u .746–.764, v .44–.53) with the field right beside it
  if (su.x > 0.744 && su.x < 0.766 && su.y > 0.43 && su.y < 0.535) su.x -= 0.03;
  vec3 hdr = texture2D(map, su).rgb;
  // three's equirect convention: u = atan(z, x)/2π + 0.5, v = asin(y)/π + 0.5
  float az = (vUv.x - 0.5) * 6.2831853, el = (vUv.y - 0.5) * 3.1415927;
  vec3 d = vec3(cos(el) * cos(az), sin(el), cos(el) * sin(az));
  float y = d.y;
  float sd = max(dot(d, uSun), 0.0);
  vec2 hz = normalize(d.xz + 1e-5), hs = normalize(uSun.xz);
  float toward = dot(hz, hs);
  float anti = smoothstep(0.35, -0.85, toward);
  vec3 c;
  if (y >= 0.0) {
    float yy = y;
    float L = dot(hdr, LUM);
    float cloud = smoothstep(0.55, 0.95, hdr.r / max(hdr.b, 1e-3)) * smoothstep(0.02, 0.16, y);
    vec3 warm = grad(yy, vec3(2.25, 0.98, 0.24), vec3(0.95, 0.42, 0.13), vec3(0.24, 0.16, 0.15));
    vec3 cool = grad(yy, vec3(1.1, 0.64, 0.52), vec3(0.48, 0.38, 0.46), vec3(0.15, 0.15, 0.24));
    vec3 sky = mix(warm, cool, anti * 0.8);
    sky += vec3(1.5, 0.66, 0.18) * pow(sd, 12.0) * 0.8 + vec3(2.6, 1.4, 0.45) * pow(sd, 140.0) * 2.2;
    // stratus: dark undersides with burning edges toward the sun
    vec3 cDark = mix(vec3(0.3, 0.18, 0.15), vec3(0.26, 0.21, 0.26), anti);
    vec3 cLit = vec3(1.9, 0.9, 0.3);
    vec3 cc = mix(cDark, cLit, clamp(pow(sd, 4.0) * 1.4 + (L - 1.2) * 0.25, 0.0, 1.0));
    c = mix(sky, cc, cloud * 0.82);
    c += vec3(18.0, 10.0, 3.6) * smoothstep(0.99994, 0.99998, sd);
  } else {
    // the photographed field + road: dry, low-sun warm, darker away from the sun, hazing into the horizon
    float gl = dot(hdr, LUM);
    vec3 g = mix(vec3(gl), hdr, 0.38) * vec3(1.3, 0.92, 0.62);
    g *= mix(0.62, 1.15, pow(toward * 0.5 + 0.5, 2.0));
    vec3 haze = mix(mix(vec3(0.85, 0.55, 0.42), vec3(0.6, 0.48, 0.55), anti), vec3(1.6, 0.85, 0.35), pow(sd, 3.0));
    c = mix(g, haze, exp(y * 22.0) * 0.6);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

/** Bakes the graded panorama into a half-float equirect render target (caller owns + disposes it). */
function bakeTerrain(gl: THREE.WebGLRenderer, hdr: THREE.Texture) {
  hdr.wrapS = THREE.RepeatWrapping;
  hdr.minFilter = hdr.magFilter = THREE.LinearFilter;
  hdr.needsUpdate = true;
  const img = hdr.image as { width: number; height: number };
  const target = new THREE.WebGLRenderTarget(img.width, img.height, {
    type: THREE.HalfFloatType,
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  });
  target.texture.wrapS = THREE.RepeatWrapping;
  target.texture.mapping = THREE.EquirectangularReflectionMapping;
  // HDRI sun sits at u≈0.596 → rotate the whole panorama so it lands on SUN's azimuth
  const az = Math.atan2(SUN.z, SUN.x) / (2 * Math.PI) + 0.5;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: hdr }, uSun: { value: SUN }, uOff: { value: 0.596 - az } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: GRADE_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const prev = gl.getRenderTarget();
  gl.setRenderTarget(target);
  gl.render(quad, cam);
  gl.setRenderTarget(prev);
  mat.dispose();
  quad.geometry.dispose();
  return target;
}

/**
 * Ground-projected backdrop + IBL from the same graded panorama. Everything is created inside the effect (and torn
 * down in its cleanup) so React StrictMode's mount → unmount → mount never leaves a disposed render target in use.
 */
export function Backdrop() {
  const hdr = useLoader(HDRLoader, TERRAIN);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const rt = bakeTerrain(gl, hdr);
    const sky = new GroundedSkybox(rt.texture, SKY.height, SKY.radius, 96);
    (sky.material as THREE.MeshBasicMaterial).fog = false;
    sky.position.y = SKY.height - 0.06; // projected ground a hair below our road / shoulder planes
    sky.renderOrder = -2;
    sky.raycast = () => {};
    sky.layers.set(FX_LAYER);
    scene.add(sky);
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromEquirectangular(rt.texture);
    pmrem.dispose();
    const prev = scene.environment;
    scene.environment = env.texture;
    return () => {
      scene.environment = prev;
      scene.remove(sky);
      env.dispose();
      sky.geometry.dispose();
      (sky.material as THREE.Material).dispose();
      rt.dispose();
    };
  }, [gl, scene, hdr]);
  return null;
}

/* ───────────── far hazy ranges behind the photo's tree line (periodic spectrum → no seam at any yaw) ───────────── */
const HILL_FRAG = /* glsl */ `
uniform vec3 uCol; uniform vec3 uTop; uniform vec3 uHaze; uniform vec3 uSun; uniform float uFar;
varying float vH; varying float vS; varying vec3 vW;
void main(){
  vec3 v = normalize(vW - cameraPosition);
  float sd = max(dot(v, uSun), 0.0);
  vec3 c = mix(uCol, uTop, smoothstep(0.35, 1.0, vH));
  c *= 1.0 + vS * 0.22; // sun-facing / shadowed flanks of each ridge (fake slope light)
  vec3 haze = mix(vec3(0.62, 0.5, 0.58), uHaze, smoothstep(0.5, 0.98, sd));
  c = mix(c, haze, clamp(uFar * 0.45 + (1.0 - smoothstep(0.0, 0.8, vH)) * 0.45, 0.0, 0.95));
  c += vec3(1.1, 0.55, 0.2) * pow(sd, 6.0) * (0.12 + 0.5 * uFar);
  c += vec3(0.9, 0.5, 0.2) * smoothstep(0.95, 1.0, vH) * pow(sd, 2.0) * 0.35;
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const HILL_VERT =
  'attribute float aH; attribute float aS; varying float vH; varying float vS; varying vec3 vW; void main(){ vH = aH; vS = aS; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';

interface RidgeDef {
  R: number;
  base: number;
  amp: number;
  seed: number;
  col: string;
  top: string;
  far: number;
}
const RIDGES: RidgeDef[] = [
  { R: 345, base: 7, amp: 22, seed: 3, col: '#a98d9a', top: '#957a8c', far: 0.85 },
  { R: 262, base: 3, amp: 12, seed: 7, col: '#7d6474', top: '#6c5566', far: 0.6 },
];
function ridgeGeometry(d: RidgeDef) {
  const N = 1440;
  let s = d.seed * 9973;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const K = 140;
  const ph = Array.from({ length: K + 1 }, () => rnd() * Math.PI * 2);
  const hAt = (a: number) => {
    let n = 0, w = 0;
    for (let k = 1; k <= K; k++) {
      const amp = 1 / Math.pow(k, 1.15);
      const sv = Math.sin(k * a + ph[k]); // integer harmonics → exactly periodic, no seam
      n += amp * (k < 6 ? sv : (0.5 - Math.abs(sv)) * 1.4); // smooth massifs + creased rock detail
      w += amp;
    }
    n /= w;
    return d.base + d.amp * Math.max(0, 0.5 + n * 1.7);
  };
  const hLow = (a: number) => {
    let n = 0, w = 0;
    for (let k = 1; k <= 10; k++) {
      const amp = 1 / Math.pow(k, 1.15);
      n += amp * Math.sin(k * a + ph[k]);
      w += amp;
    }
    return d.amp * (n / w);
  };
  const pos = new Float32Array((N + 1) * 2 * 3);
  const aH = new Float32Array((N + 1) * 2);
  const aS = new Float32Array((N + 1) * 2);
  const idx: number[] = [];
  const sunAz = Math.atan2(SUN.z, SUN.x);
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const h = hAt(a);
    const slope = (hLow(a + 0.03) - hLow(a - 0.03)) / (0.06 * d.R); // dh/ds of the broad massifs (no streaks)
    const towardSun = Math.sin(sunAz - a); // which way along the ring faces the sun
    const sh = Math.max(-1, Math.min(1, slope * towardSun * 40));
    const x = Math.cos(a) * d.R, z = Math.sin(a) * d.R;
    pos.set([x, -1.5, z, x, h, z], i * 6);
    aH.set([0, 1], i * 2);
    aS.set([sh * 0.3, sh], i * 2);
    if (i < N) {
      const b = i * 2;
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aH', new THREE.BufferAttribute(aH, 1));
  g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  g.setIndex(idx);
  return g;
}
export function Ridges() {
  const items = useMemo(
    () =>
      RIDGES.map((d) => ({
        geo: ridgeGeometry(d),
        mat: new THREE.ShaderMaterial({
          side: THREE.DoubleSide,
          fog: false,
          uniforms: {
            uCol: { value: new THREE.Color(d.col) },
            uTop: { value: new THREE.Color(d.top) },
            uHaze: { value: new THREE.Color(HAZE) },
            uSun: { value: SUN },
            uFar: { value: d.far },
          },
          vertexShader: HILL_VERT,
          fragmentShader: HILL_FRAG,
        }),
      })),
    [],
  );
  useEffect(() => () => items.forEach((i) => { i.geo.dispose(); i.mat.dispose(); }), [items]);
  return (
    <group>
      {items.map((i, k) => (
        <mesh key={k} geometry={i.geo} material={i.mat} raycast={() => null} onUpdate={fx} renderOrder={-1} />
      ))}
    </group>
  );
}

/* ───────────── asphalt road (CC0 PBR set), its ends dissolving into the photographed landscape ───────────── */
const ROAD = { len: 150, w: 9.6, z: -0.5, tile: 2.6 };
export function Road() {
  const [diff, nor, arm] = useLoader(THREE.TextureLoader, [`${ASPHALT}_diff_2k.jpg`, `${ASPHALT}_nor_gl_2k.jpg`, `${ASPHALT}_arm_2k.jpg`]);
  const mat = useMemo(() => {
    for (const t of [diff, nor, arm]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(ROAD.len / ROAD.tile, ROAD.w / ROAD.tile);
    }
    // the road covers ~40 % of the frame at grazing angles: anisotropy only on albedo, one ARM fetch (roughness)
    diff.anisotropy = 4;
    nor.anisotropy = 1;
    arm.anisotropy = 1;
    diff.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({
      map: diff,
      normalMap: nor,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: arm,
      color: '#3d3f45',
      roughness: 0.78,
      metalness: 0,
      envMapIntensity: 1.05,
      transparent: true,
      depthWrite: true,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uHalf = { value: ROAD.w / 2 };
      shader.uniforms.uLen = { value: ROAD.len / 2 };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vRoad;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRoad = position.xy;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vRoad;\nuniform float uHalf;\nuniform float uLen;')
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          { float e = abs(vRoad.y);
            float line = smoothstep(uHalf-0.52, uHalf-0.47, e) * (1.0 - smoothstep(uHalf-0.37, uHalf-0.32, e));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.58, 0.52), line * 0.55);
            float sh = smoothstep(uHalf-0.25, uHalf+0.05, e);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.33, 0.25) * (0.75 + diffuseColor.r), sh * 0.85);
            // both road ends dissolve into the projected photo road / field
            diffuseColor.a *= 1.0 - smoothstep(uLen * 0.45, uLen * 0.98, abs(vRoad.x)); }`,
        );
    };
    return m;
  }, [diff, nor, arm]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const o = (anim.roll / ROAD.tile) % 1;
    diff.offset.x = nor.offset.x = arm.offset.x = o;
  });
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position={[0, 0, ROAD.z]} raycast={() => null} onUpdate={fx} renderOrder={1}>
      <planeGeometry args={[ROAD.len, ROAD.w + 0.6, 1, 1]} />
    </mesh>
  );
}

/** Dusty gravel shoulder around the set: crisp near the car, dissolving radially into the projected photo ground. */
export function Ground() {
  const tex = useMemo(() => {
    const t = grainTexture();
    t.repeat.set(30, 30);
    return t;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#7a6656', map: tex, roughness: 1, metalness: 0, envMapIntensity: 0.7, transparent: true, depthWrite: false });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vGP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGP = position.xy;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vGP;')
        .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.a *= 1.0 - smoothstep(16.0, 46.0, length(vGP * vec2(0.6, 1.0)));');
    };
    return m;
  }, [tex]);
  useEffect(() => () => { tex.dispose(); mat.dispose(); }, [tex, mat]);
  useFrame(() => {
    tex.offset.x = (anim.roll / (160 / 30)) % 1;
  });
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position-y={-0.015} raycast={() => null} onUpdate={fx} renderOrder={0}>
      <circleGeometry args={[80, 64]} />
    </mesh>
  );
}

/* ───────────── CC0 roadside scrub (Poly Haven shrub_03 / shrub_04), instanced, outside every camera path ───────────── */
function shrubGeometry(scene: THREE.Object3D) {
  let mesh: THREE.Mesh | null = null;
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
  });
  const m = mesh as unknown as THREE.Mesh;
  const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  return { geo: g, mat: m.material as THREE.Material, h: bb.max.y - bb.min.y };
}
export function Shrubs() {
  const a = useGLTF(SHRUBS[0], false, false);
  const b = useGLTF(SHRUBS[1], false, false);
  const sets = useMemo(() => {
    const out: THREE.InstancedMesh[] = [];
    let s = 41;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (const [k, src] of [a.scene, b.scene].entries()) {
      const { geo, mat } = shrubGeometry(src);
      const bushes = 7, per = 3, n = bushes * per;
      const im = new THREE.InstancedMesh(geo, mat, n);
      const o = new THREE.Object3D();
      for (let i = 0; i < bushes; i++) {
        // bushes on a ring 14–46 m around the set, never on the asphalt (|z + 0.5| < 6.5)
        let x = 0, z = 0;
        for (let t = 0; t < 20; t++) {
          const ang = rnd() * Math.PI * 2, r = 14 + rnd() * rnd() * 32;
          x = Math.cos(ang) * r;
          z = Math.sin(ang) * r;
          if (Math.abs(z + 0.5) > 6.5) break;
        }
        const base = (k === 0 ? 3.0 : 5.0) * (0.75 + rnd() * 0.6);
        for (let j = 0; j < per; j++) {
          o.position.set(x + (rnd() - 0.5) * base * 0.35, -0.02, z + (rnd() - 0.5) * base * 0.35);
          o.rotation.set(0, rnd() * Math.PI * 2, 0);
          const sc = base * (0.7 + rnd() * 0.45);
          o.scale.set(sc, sc * (0.85 + rnd() * 0.3), sc);
          o.updateMatrix();
          im.setMatrixAt(i * per + j, o.matrix);
        }
      }
      im.instanceMatrix.needsUpdate = true;
      im.raycast = () => {};
      im.layers.set(FX_LAYER);
      out.push(im);
    }
    return out;
  }, [a.scene, b.scene]);
  useEffect(() => () => sets.forEach((m) => m.geometry.dispose()), [sets]);
  return (
    <group>
      {sets.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </group>
  );
}
