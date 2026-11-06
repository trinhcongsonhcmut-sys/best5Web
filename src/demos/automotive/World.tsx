import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import { grainTexture } from './materials';
import { SUN, anim } from './anim';
import { FX_LAYER } from './layers';
import { buildPoseSampler } from '../../lib/math';
import { CAMERA, FOG, GRADE, GROUND, LIGHTS, ROAD, SHRUB_URLS, WORLD, hdriOffset, stopsFor } from './contract';

/**
 * Golden-hour world built on the approved CC0 HDRI WITH terrain (Poly Haven evening_road_01) — the REAL photo, only
 * lightly graded (contract.GRADE; the Blender test scene applies the identical grade):
 *  - backdrop: the graded panorama, ground-projected (GroundedSkybox) → photographed sky + field all around, no seams;
 *  - IBL: the same panorama capped at GRADE.cap + a thin horizon band → a crisp horizon line runs along doors / bonnet;
 *    the radiance above the cap (the sun) is integrated and becomes the directional sun (measured, not tuned);
 *  - near field: CC0 asphalt road + dusty shoulder fading into the projected photo ground, CC0 shrub clusters on the
 *    shoulders kept out of every camera's line of sight.
 */
const TERRAIN = WORLD.hdri;
const ASPHALT = '/assets/textures/asphalt_02/asphalt_02';
const SHRUBS = SHRUB_URLS;
export const HAZE = FOG.color;
/** height of the HDRI camera above its ground (m) → scale of the projected landscape; radius = backdrop dome */
const SKY = { height: WORLD.skyHeight, radius: WORLD.skyRadius };
const fx = (o: THREE.Object3D) => o.layers.set(FX_LAYER);

useLoader.preload(HDRLoader, TERRAIN);
useLoader.preload(THREE.TextureLoader, [`${ASPHALT}_diff_2k.jpg`, `${ASPHALT}_nor_gl_2k.jpg`, `${ASPHALT}_arm_2k.jpg`]);
SHRUBS.forEach((u) => useGLTF.preload(u, false, false));

/* ───────────── one-time light grade of the terrain HDRI (equirect → equirect, half float) ───────────── */
const GRADE_FRAG = /* glsl */ `
uniform sampler2D map; uniform float uOff; uniform vec3 uGain; uniform float uSat; uniform float uCap;
uniform float uBand; uniform vec3 uBandCol; uniform float uBandEl; uniform float uBandW; uniform vec3 uSun;
uniform vec4 uSign; uniform float uSignShift;
varying vec2 vUv;
const vec3 LUM = vec3(0.2126, 0.7152, 0.0722);
void main(){
  vec2 su = vec2(fract(vUv.x + uOff), vUv.y);
  if (su.x > uSign.x && su.x < uSign.y && su.y > uSign.z && su.y < uSign.w) su.x -= uSignShift; // roadside sign
  vec3 c = texture2D(map, su).rgb;
  float L = dot(c, LUM);
  c = max(vec3(L) + (c - vec3(L)) * uSat, 0.0) * uGain;
  c = min(c, vec3(uCap));
  if (uBand > 0.0) {
    float az = (vUv.x - 0.5) * 6.2831853, el = (vUv.y - 0.5) * 3.1415927;
    float toward = dot(normalize(vec2(cos(az), sin(az))), normalize(uSun.xz));
    float w = (el - uBandEl) / uBandW;
    c += uBandCol * uBand * exp(-w * w) * (0.45 + 0.55 * smoothstep(-0.3, 0.9, toward));
  }
  gl_FragColor = vec4(c, 1.0);
}`;

/** Bakes the graded panorama into a half-float equirect render target (caller owns + disposes it). */
function bakeTerrain(gl: THREE.WebGLRenderer, hdr: THREE.Texture, ibl: boolean) {
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
  const G = GRADE;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: hdr },
      uOff: { value: hdriOffset() }, // the photo's sun lands on SUN's azimuth
      uGain: { value: new THREE.Vector3(...G.gain) },
      uSat: { value: G.saturation },
      uCap: { value: ibl ? G.cap : 1e5 },
      uBand: { value: ibl ? G.horizon.amount : 0 },
      uBandCol: { value: new THREE.Vector3(...G.horizon.color) },
      uBandEl: { value: G.horizon.elev },
      uBandW: { value: G.horizon.width },
      uSun: { value: SUN },
      uSign: { value: new THREE.Vector4(G.sign.u[0], G.sign.u[1], G.sign.v[0], G.sign.v[1]) },
      uSignShift: { value: G.sign.shift },
    },
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
 * The sun the IBL no longer carries: Σ max(grade(src) − cap, 0) · dΩ over the panorama (W/m² per channel, normal to
 * the sun) → directional light intensity (luminance) + colour; plus the mean graded sky colour just above the horizon (fog).
 * Same integral as build_scene.py, so realtime and Cycles get the same sun.
 */
function measure(hdr: THREE.DataTexture) {
  const { width: w, height: h, data } = hdr.image as unknown as { width: number; height: number; data: Uint16Array | Float32Array };
  const ch = data.length / (w * h);
  const half = data instanceof Uint16Array;
  const f = (i: number) => (half ? THREE.DataUtils.fromHalfFloat(data[i]) : data[i]);
  const [gr, gg, gb] = GRADE.gain;
  const sat = GRADE.saturation, cap = GRADE.cap;
  const E = [0, 0, 0], hz = [0, 0, 0];
  let hn = 0;
  for (let y = 0; y < h; y++) {
    const lat = (0.5 - (y + 0.5) / h) * Math.PI; // data row 0 = top of the panorama (texture.flipY = true)
    const dO = ((2 * Math.PI) / w) * (Math.PI / h) * Math.cos(lat);
    const horizonRow = lat > 0.01 && lat < 0.05; // haze colour: the sky band just above the horizon (all round)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = f(i);
      if (!horizonRow && r < cap * 0.5) continue; // cheap reject: nowhere near the cap (sun pixels are red-heavy)
      const g = f(i + 1), b = f(i + 2);
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const c = [Math.max(L + (r - L) * sat, 0) * gr, Math.max(L + (g - L) * sat, 0) * gg, Math.max(L + (b - L) * sat, 0) * gb];
      if (horizonRow) {
        hz[0] += c[0];
        hz[1] += c[1];
        hz[2] += c[2];
        hn++;
      }
      for (let k = 0; k < 3; k++) if (c[k] > cap) E[k] += (c[k] - cap) * dO;
    }
  }
  const lum = 0.2126 * E[0] + 0.7152 * E[1] + 0.0722 * E[2];
  const n = Math.max(lum, 1e-6);
  return {
    intensity: lum,
    color: new THREE.Color(E[0] / n, E[1] / n, E[2] / n),
    haze: new THREE.Color(hz[0] / Math.max(hn, 1), hz[1] / Math.max(hn, 1), hz[2] / Math.max(hn, 1)),
  };
}

/** live readout for the contract tooling */
export const worldReadout = { sunIntensity: 0, sunColor: [0, 0, 0] as number[], haze: [0, 0, 0] as number[] };

/**
 * Ground-projected backdrop + IBL from the same graded panorama + the measured directional sun. Everything is created
 * inside the effect (and torn down in its cleanup) so React StrictMode's mount → unmount → mount never leaves a
 * disposed render target in use.
 */
export function Backdrop() {
  const hdr = useLoader(HDRLoader, TERRAIN) as THREE.DataTexture;
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const sunPos = useMemo(() => SUN.clone().multiplyScalar(LIGHTS.sun.distance), []);
  const m = useMemo(() => measure(hdr), [hdr]);
  useEffect(() => {
    const rtSky = bakeTerrain(gl, hdr, false);
    const rtIbl = bakeTerrain(gl, hdr, true);
    const sky = new GroundedSkybox(rtSky.texture, SKY.height, SKY.radius, 64); // 16 k tris (96 → 37 k blew the 450 k budget)
    (sky.material as THREE.MeshBasicMaterial).fog = false;
    sky.position.y = SKY.height - 0.06; // projected ground a hair below our road / shoulder planes
    sky.renderOrder = -2;
    sky.raycast = () => {};
    sky.layers.set(FX_LAYER);
    scene.add(sky);
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromEquirectangular(rtIbl.texture);
    pmrem.dispose();
    rtIbl.dispose();
    const prev = scene.environment;
    scene.environment = env.texture;
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(m.haze);
    worldReadout.sunIntensity = m.intensity;
    worldReadout.sunColor = m.color.toArray();
    worldReadout.haze = m.haze.toArray();
    return () => {
      scene.environment = prev;
      scene.remove(sky);
      env.dispose();
      sky.geometry.dispose();
      (sky.material as THREE.Material).dispose();
      rtSky.dispose();
    };
  }, [gl, scene, hdr, m]);
  return <directionalLight ref={sunRef} position={sunPos} intensity={m.intensity} color={m.color} />;
}

/* ───────────── asphalt road (CC0 PBR set), its ends dissolving into the photographed landscape ───────────── */
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
      color: '#cecfd2', // = the Cycles target: scan albedo × 0.62 (sunset asphalt), roughness straight from the ARM map
      roughness: 1,
      metalness: 0,
      envMapIntensity: 1,
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
    const m = new THREE.MeshStandardMaterial({ color: GROUND.color, map: tex, roughness: 1, metalness: 0, envMapIntensity: 0.7, transparent: true, depthWrite: false });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vGP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGP = position.xy;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vGP;')
        .replace('#include <map_fragment>', `#include <map_fragment>\ndiffuseColor.a *= 1.0 - smoothstep(${GROUND.fade[0].toFixed(1)}, ${GROUND.fade[1].toFixed(1)}, length(vGP * vec2(0.6, 1.0)));`);
    };
    return m;
  }, [tex]);
  useEffect(() => () => { tex.dispose(); mat.dispose(); }, [tex, mat]);
  useFrame(() => {
    tex.offset.x = (anim.roll / (160 / 30)) % 1;
  });
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position-y={-0.015} raycast={() => null} onUpdate={fx} renderOrder={0}>
      <circleGeometry args={[GROUND.radius, 64]} />
    </mesh>
  );
}

/* ───────────── CC0 roadside scrub (Poly Haven shrub_03 / shrub_04): clusters on the shoulders, never in a shot ───────────── */
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

/**
 * Every camera the visitor can get without orbiting: the scroll path sampled every 2 % for desktop, tablet-portrait
 * and phone-portrait framings (stopsFor + CameraRig's fitAspect pull-back) → [camera, target] pairs.
 */
function shotCameras() {
  const out: [THREE.Vector3, THREE.Vector3][] = [];
  for (const aspect of [1.6, 0.75, 390 / 844]) {
    const fit = aspect < CAMERA.fitAspect ? Math.min(2.2, Math.max(1, Math.pow(CAMERA.fitAspect / aspect, 0.75))) : 1;
    const sample = buildPoseSampler(stopsFor(aspect), CAMERA.defaultFov);
    for (let i = 0; i <= 50; i++) {
      const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
      sample(i / 50, pos, tgt);
      out.push([tgt.clone().add(pos.sub(tgt).multiplyScalar(fit)), tgt]);
    }
  }
  return out;
}
/** a cluster (centre c, radius r) is rejected if a camera sits in it or it stands between any camera and the car */
function inAnyShot(c: THREE.Vector3, r: number, cams: [THREE.Vector3, THREE.Vector3][]) {
  const d = new THREE.Vector3(), s = new THREE.Vector3();
  for (const [cam, tgt] of cams) {
    s.subVectors(c, cam).setY(0);
    if (s.length() < 8 + r) return true;
    d.subVectors(tgt, cam).setY(0);
    const t = s.dot(d) / d.lengthSq();
    if (t > 0 && t < 1.2 && s.clone().addScaledVector(d, -t).length() < r + 2.8) return true;
  }
  return false;
}

/** soft dark footprint under each cluster (contact AO) */
function blobTexture() {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

export function Shrubs() {
  const a = useGLTF(SHRUBS[0], false, false);
  const b = useGLTF(SHRUBS[1], false, false);
  const { sets, blobs } = useMemo(() => {
    let s = 41;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const cams = shotCameras();
    // cluster centres on both shoulders, 6–13 m off the road centre line, kept out of every shot
    const clusters: { c: THREE.Vector3; r: number }[] = [];
    for (let t = 0; t < 400 && clusters.length < 12; t++) {
      const side = rnd() < 0.6 ? -1 : 1; // more scrub on the far shoulder (behind the car in most shots)
      const c = new THREE.Vector3((rnd() - 0.5) * 110, 0, ROAD.z + side * (6.2 + rnd() * 7));
      const r = 1.2 + rnd() * 1.3;
      if (inAnyShot(c, r, cams)) continue;
      if (clusters.some((q) => q.c.distanceTo(c) < q.r + r + 4)) continue;
      clusters.push({ c, r });
    }
    const srcs = [shrubGeometry(a.scene), shrubGeometry(b.scene)];
    const per = clusters.map(() => [2 + Math.floor(rnd() * 2), 1 + Math.floor(rnd() * 2)]); // shrub_03 / shrub_04 counts
    const sets = srcs.map(({ geo, mat }, k) => {
      const n = per.reduce((acc, p) => acc + p[k], 0);
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
      im.count = n;
      im.name = `shrub:${SHRUBS[k]}`;
      im.raycast = () => {};
      im.layers.set(FX_LAYER);
      return im;
    });
    const o = new THREE.Object3D();
    const idx = [0, 0];
    clusters.forEach(({ c, r }, ci) => {
      for (let k = 0; k < 2; k++) {
        for (let j = 0; j < per[ci][k]; j++) {
          const ang = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * r;
          o.position.set(c.x + Math.cos(ang) * rr, -0.02, c.z + Math.sin(ang) * rr);
          o.rotation.set(0, rnd() * Math.PI * 2, 0);
          const sc = (k === 0 ? 2.6 : 4.2) * (0.7 + rnd() * 0.6);
          o.scale.set(sc, sc * (0.85 + rnd() * 0.3), sc);
          o.updateMatrix();
          sets[k].setMatrixAt(idx[k]++, o.matrix);
        }
      }
    });
    sets.forEach((im) => (im.instanceMatrix.needsUpdate = true));
    const blobMat = new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: blobTexture(), transparent: true, opacity: 0.16, depthWrite: false });
    const blobs = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), blobMat, Math.max(1, clusters.length));
    blobs.count = clusters.length;
    clusters.forEach(({ c, r }, i) => {
      o.position.set(c.x, 0.008, c.z);
      o.rotation.set(0, 0, 0);
      o.scale.set(r * 1.6, 1, r * 1.6); // tight under the foliage only
      o.updateMatrix();
      blobs.setMatrixAt(i, o.matrix);
    });
    blobs.instanceMatrix.needsUpdate = true;
    blobs.raycast = () => {};
    blobs.layers.set(FX_LAYER);
    blobs.renderOrder = 1;
    return { sets, blobs };
  }, [a.scene, b.scene]);
  useEffect(
    () => () => {
      sets.forEach((m) => m.geometry.dispose());
      blobs.geometry.dispose();
      (blobs.material as THREE.MeshBasicMaterial).alphaMap?.dispose();
      (blobs.material as THREE.Material).dispose();
    },
    [sets, blobs],
  );
  return (
    <group>
      {sets.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      <primitive object={blobs} />
    </group>
  );
}
