import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { CameraRig, orbit } from '../../lib/CameraRig';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { buildPoseSampler, clamp, lerp, smoothstep, type PoseStop } from '../../lib/math';
import { Landscape } from './Landscape';
import { SkyDome } from './Sky';
import { Villa } from './Villa';
import { createLib } from './materials';
import { prepareEnv } from './env';
import { preloadPbr, usePbrSets } from './textures';
import { preloadProps, Props } from './Props';
import { colliders, ENV_ROT, LEVELS, lightState, nightOf, railOf, SUN_DIR } from './state';

export const HDR_URL = '/assets/hdri/belfast_sunset_puresky_2k.hdr';
// kick the downloads off at module evaluation (outside any React render)
useLoader.preload(HDRLoader, HDR_URL);
preloadPbr();
preloadProps();

/**
 * Camera = one long flight (same beats as v1): hero over the lawn → down to the terrace (GROUND) → up to the
 * glass balcony (LEVEL 1) → round the west corner to the suite (SUITE) → over the roof pool (ROOF) → pull out to
 * the night overview.
 */
const STOPS: PoseStop[] = [
  { t: 0, pos: [21, 3.4, 40], target: [-1.2, 3.9, 0], fov: 34 },
  { t: 0.25, pos: [9.5, 1.7, 15.5], target: [0.5, 2.0, 4.2], fov: 44 },
  { t: 0.5, pos: [-1.5, 5.6, 21.5], target: [-3.6, 5.5, 4.5], fov: 38 },
  { t: 0.62, pos: [-16, 6.6, 14], target: [-5.5, 5.4, 3], fov: 35 },
  { t: 0.75, pos: [9, 12.8, 12.5], target: [-2.2, 8.0, -0.2], fov: 40 },
  { t: 1, pos: [-31, 15, 36], target: [0.5, 3.4, 0], fov: 38 },
];
const LIMITS = { elevMin: -0.05, elevMax: 1.2, dollyMin: 0.62, dollyMax: 1.5 };

const C = (h: string) => new THREE.Color(h);
const LIGHT = {
  hemiSky: [C('#9fb0cc'), C('#25304c')],
  hemiGround: [C('#8a7048'), C('#0a0c0a')],
  key: [C('#ff9a50'), C('#8ea6df')],
  fog: [C('#d2ae8c'), C('#0d1526')],
};

function Lighting({ env }: { env: THREE.Texture }) {
  const { scene, gl } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const fog = useMemo(() => new THREE.Fog(LIGHT.fog[0].clone(), 70, 340), []);
  const frames = useRef(0);

  // explicit PCF (three r18x removed PCFSoft and warns) — set before the first frame, restored on unmount
  useLayoutEffect(() => {
    const prev = gl.shadowMap.type;
    gl.shadowMap.type = THREE.PCFShadowMap;
    return () => {
      gl.shadowMap.type = prev;
    };
  }, [gl]);
  // image-based lighting = the same HDRI as the sky dome (glass/pool reflect the sky you see)
  useLayoutEffect(() => {
    scene.environment = env;
    scene.environmentRotation.set(0, ENV_ROT, 0);
    return () => {
      scene.environment = null;
      scene.environmentRotation.set(0, 0, 0);
      scene.environmentIntensity = 1;
    };
  }, [scene, env]);
  useEffect(() => {
    scene.fog = fog;
    gl.shadowMap.autoUpdate = true;
    return () => {
      scene.fog = null;
      gl.shadowMap.autoUpdate = true; // never leave other demos with frozen shadows
    };
  }, [scene, gl, fog]);

  useFrame(() => {
    const n = nightOf(scrollState.smooth);
    // one baked shadow: the key light never moves, so render the map a few frames then freeze it
    frames.current++;
    if (frames.current === 6) gl.shadowMap.autoUpdate = false;
    if (hemi.current) {
      hemi.current.color.lerpColors(LIGHT.hemiSky[0], LIGHT.hemiSky[1], n);
      hemi.current.groundColor.lerpColors(LIGHT.hemiGround[0], LIGHT.hemiGround[1], n);
      hemi.current.intensity = 0.9 - 0.45 * n;
    }
    if (key.current) {
      key.current.color.lerpColors(LIGHT.key[0], LIGHT.key[1], n);
      key.current.intensity = 3.7 - 3.15 * n;
    }
    if (hemi.current && key.current) {
      lightState.sun.copy(key.current.color).multiplyScalar(key.current.intensity);
      lightState.sky.copy(hemi.current.color).multiplyScalar(hemi.current.intensity);
      lightState.ground.copy(hemi.current.groundColor).multiplyScalar(hemi.current.intensity);
    }
    fog.color.lerpColors(LIGHT.fog[0], LIGHT.fog[1], n);
    scene.environmentIntensity = 0.68 - 0.52 * n;
    const r = railOf(scrollState.smooth);
    bridge.state.extra.level = LEVELS[Math.round(r)].id;
    bridge.state.extra.calls = gl.info.render.calls;
  });

  const sun = SUN_DIR.clone().multiplyScalar(80);
  return (
    <>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={key}
        position={[sun.x, sun.y, sun.z]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={26}
        shadow-camera-bottom={-22}
        shadow-camera-near={20}
        shadow-camera-far={150}
        shadow-bias={-0.0005}
        shadow-normalBias={0.05}
      />
    </>
  );
}

const TAU = Math.PI * 2;
const sample = buildPoseSampler(STOPS, 36);
const _p = new THREE.Vector3();
const _tgt = new THREE.Vector3();
const _d = new THREE.Vector3();
const CLEAR = 0.7; // metres kept between the lens and any surface

/**
 * Camera guard, runs after the shared rig every frame (pure function of scroll + orbit → reversible):
 *  1. close-up marks (25/50/75%) allow ±43° of orbit around their framing; 0% and 100% keep the full 360°
 *  2. collision: the lens is pushed out of tree crowns/trunks (spheres) and building volumes (AABBs), never below 0.9 m
 *  3. portrait phones: pan up so the villa sits under the headline
 */
function cameraGuard(cam: THREE.PerspectiveCamera) {
  const p = scrollState.smooth;
  sample(p, _p, _tgt);
  const w = lerp(Math.PI, 0.75, smoothstep(0.06, 0.14, p) * (1 - smoothstep(0.86, 0.94, p)));
  // final overview: never orbit below the hero's own elevation (no hedge-in-face low angles)
  const pitchFloor = lerp(-1.2, -0.02, smoothstep(0.86, 0.95, p));
  if (orbit.tPitch < pitchFloor) orbit.tPitch = pitchFloor;
  if (w < Math.PI - 1e-3) {
    const base = Math.round(orbit.tYaw / TAU) * TAU;
    orbit.tYaw = base + clamp(orbit.tYaw - base, -w, w);
  }
  const c = cam.position;
  let moved = false;
  if (cam.aspect < 1) c.sub(_tgt).multiplyScalar(0.99).add(_tgt);
  for (const [x, y, z, r] of colliders.spheres) {
    _d.set(c.x - x, c.y - y, c.z - z);
    const len = _d.length();
    const R = r + CLEAR;
    if (len < R) {
      if (len < 1e-4) _d.set(0, 1, 0);
      c.set(x, y, z).addScaledVector(_d.normalize(), R);
      moved = true;
    }
  }
  for (const b of colliders.boxes) {
    const [x0, y0, z0] = b.min, [x1, y1, z1] = b.max;
    // a box that holds the framing target is the room we're looking into — skip it
    if (_tgt.x > x0 && _tgt.x < x1 && _tgt.y > y0 && _tgt.y < y1 && _tgt.z > z0 && _tgt.z < z1) continue;
    const ex0 = x0 - CLEAR, ex1 = x1 + CLEAR, ey0 = y0 - CLEAR, ey1 = y1 + CLEAR, ez0 = z0 - CLEAR, ez1 = z1 + CLEAR;
    if (c.x > ex0 && c.x < ex1 && c.y > ey0 && c.y < ey1 && c.z > ez0 && c.z < ez1) {
      const pen = [c.x - ex0, ex1 - c.x, ey1 - c.y, c.z - ez0, ez1 - c.z]; // never push downwards
      const i = pen.indexOf(Math.min(...pen));
      if (i === 0) c.x = ex0; else if (i === 1) c.x = ex1; else if (i === 2) c.y = ey1; else if (i === 3) c.z = ez0; else c.z = ez1;
      moved = true;
    }
  }
  if (c.y < 0.9) {
    c.y = 0.9;
    moved = true;
  }
  if (moved) cam.lookAt(_tgt);
  if (cam.aspect < 1) {
    const d = c.distanceTo(_tgt);
    cam.translateY((1 - cam.aspect) * 0.13 * d);
    cam.translateX((1 - cam.aspect) * 0.05 * d); // desktop framing leaves room for the copy column on the left — recentre on phones
  }
}

/**
 * Warm-up before bridge.ready (frame 2): compile EVERY program the flight will need — including objects that start
 * hidden (hologram) or outside the hero frustum (roof pool, back rooms) — and upload every texture, so nothing
 * compiles / uploads mid-scroll (ANGLE/D3D11 on the HD 530 stalls ~100–300 ms per program).
 */
function Warmup() {
  const { gl, scene, camera } = useThree();
  const frame = useRef(0);
  useFrame(() => {
    if (++frame.current !== 2) return;
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    const seen = new Set<THREE.Texture>();
    scene.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      for (const m of mat ? (Array.isArray(mat) ? mat : [mat]) : []) {
        const rec = m as unknown as Record<string, unknown> & { uniforms?: Record<string, { value: unknown }> };
        const vals = [...Object.values(rec), ...Object.values(rec.uniforms ?? {}).map((u) => u?.value)];
        for (const v of vals) if (v && (v as THREE.Texture).isTexture && !seen.has(v as THREE.Texture)) seen.add(v as THREE.Texture);
      }
    });
    seen.forEach((t) => gl.initTexture(t));
    gl.compile(scene, camera);
    hidden.forEach((o) => (o.visible = false));
  });
  return null;
}

/** adaptive resolution guard: slow / shared GPU (Intel HD 530) under 48 fps → render at 0.8× DPR, back up above 64 */
function AdaptiveDpr() {
  const setDpr = useThree((s) => s.setDpr);
  const base = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5);
  useEffect(() => () => setDpr(base), [setDpr, base]);
  return (
    <PerformanceMonitor
      bounds={() => [48, 64]}
      flipflops={4}
      onDecline={() => setDpr(Math.max(0.8, base * 0.8))}
      onIncline={() => setDpr(base)}
      onFallback={() => setDpr(Math.max(0.8, base * 0.8))}
    />
  );
}

export function RealEstateScene() {
  // both suspend → Stage's Suspense + useProgress keep bridge.ready false until scans + HDRI are in
  const sets = usePbrSets();
  const raw = useLoader(HDRLoader, HDR_URL);
  const env = useMemo(() => prepareEnv(raw as THREE.DataTexture), [raw]);
  useEffect(() => () => env.dispose(), [env]);
  const lib = useMemo(() => createLib(sets), [sets]);
  useEffect(() => () => lib.dispose(), [lib]);
  return (
    <>
      <CameraRig stops={STOPS} limits={LIMITS} fitAspect={1.45} defaultFov={36} onAfter={cameraGuard} />
      <AdaptiveDpr />
      <SkyDome env={env} />
      <Lighting env={env} />
      <Villa lib={lib} />
      <Landscape lib={lib} />
      <Props lib={lib} />
      <Warmup />
    </>
  );
}
