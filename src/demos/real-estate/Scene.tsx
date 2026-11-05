import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig, orbit } from '../../lib/CameraRig';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { buildPoseSampler, clamp, lerp, smoothstep, type PoseStop } from '../../lib/math';
import { Landscape } from './Landscape';
import { SkyDome } from './Sky';
import { Villa } from './Villa';
import { createLib } from './materials';
import { colliders, LEVELS, nightOf, railOf } from './state';

/**
 * Camera = one long flight: aerial dusk hero → down to the arrival court (GROUND) → crane up the living glass
 * (LEVEL 1) → past the teak-finned suite (LEVEL 2) → over the infinity pool (ROOFTOP) → pull out to the night overview.
 */
const STOPS: PoseStop[] = [
  { t: 0, pos: [25, 6.4, 38], target: [-3.4, 6.4, 0], fov: 34 },
  { t: 0.25, pos: [9.6, 1.75, 19.5], target: [1.6, 2.5, 5], fov: 44 },
  { t: 0.5, pos: [0.4, 7.0, 29.5], target: [-3.6, 7.0, 3], fov: 38 },
  { t: 0.62, pos: [-11.5, 10.9, 19.5], target: [-4.6, 10.4, 2], fov: 35 },
  { t: 0.75, pos: [9.8, 16.4, 13.2], target: [-3.6, 13.0, 1.8], fov: 40 },
  { t: 1, pos: [-31, 17.5, 37], target: [1, 6.4, 0], fov: 38 },
];
const LIMITS = { elevMin: -0.05, elevMax: 1.2, dollyMin: 0.62, dollyMax: 1.5 };

const C = (h: string) => new THREE.Color(h);
const LIGHT = {
  hemiSky: [C('#8d9cbc'), C('#24304d')],
  hemiGround: [C('#3a332c'), C('#0a0a0d')],
  key: [C('#ffd0ac'), C('#8ea6df')],
  fog: [C('#55678e'), C('#0d1526')],
};

function Lighting() {
  const { scene, gl } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const fog = useMemo(() => new THREE.Fog(LIGHT.fog[0].clone(), 55, 265), []);
  const frames = useRef(0);

  const camera = useThree((s) => s.camera);
  // explicit PCF (three r18x removed PCFSoft and warns) — set before the first frame, restored on unmount
  useLayoutEffect(() => {
    const prev = gl.shadowMap.type;
    gl.shadowMap.type = THREE.PCFShadowMap;
    return () => {
      gl.shadowMap.type = prev;
    };
  }, [gl]);
  useEffect(() => {
    camera.layers.enable(1); // far/vegetation layer (see Landscape) — the reflection camera only sees layer 0
    return () => camera.layers.disable(1);
  }, [camera]);
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
    if (frames.current === 4) gl.shadowMap.autoUpdate = false;
    if (hemi.current) {
      hemi.current.color.lerpColors(LIGHT.hemiSky[0], LIGHT.hemiSky[1], n);
      hemi.current.groundColor.lerpColors(LIGHT.hemiGround[0], LIGHT.hemiGround[1], n);
      hemi.current.intensity = 1.2 - 0.6 * n;
    }
    if (key.current) {
      key.current.color.lerpColors(LIGHT.key[0], LIGHT.key[1], n);
      key.current.intensity = 1.7 - 1.15 * n;
    }
    fog.color.lerpColors(LIGHT.fog[0], LIGHT.fog[1], n);
    scene.environmentIntensity = 0.95 - 0.55 * n;
    const r = railOf(scrollState.smooth);
    bridge.state.extra.level = LEVELS[Math.round(r)].id;
  });

  return (
    <>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={key}
        position={[-30, 34, 28]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={30}
        shadow-camera-bottom={-26}
        shadow-camera-near={5}
        shadow-camera-far={110}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      {/* reflections only: blue-hour sky, warm western afterglow, a few city glints */}
      <Environment resolution={256} frames={1}>
        <mesh scale={100}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#1c2f57" side={THREE.BackSide} />
        </mesh>
        <Lightformer form="rect" intensity={1.6} color="#7b97cf" position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[80, 80, 1]} />
        <Lightformer form="rect" intensity={3.2} color="#ffb27a" position={[-40, 2, -50]} scale={[90, 8, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#9fb6e6" position={[40, 6, 40]} scale={[80, 14, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#3b4a6b" position={[0, -10, 0]} rotation-x={-Math.PI / 2} scale={[80, 80, 1]} />
        <Lightformer form="circle" intensity={6} color="#ffd9a0" position={[30, 4, -60]} scale={4} />
        <Lightformer form="circle" intensity={6} color="#ffd9a0" position={[-60, 3, 20]} scale={3} />
      </Environment>
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
 *  1. close-up marks (25/50/75%) allow ±60° of orbit around their framing; 0% and 100% keep the full 360°
 *  2. collision: the lens is pushed out of tree crowns/trunks (spheres) and building volumes (AABBs), never below 0.9 m
 *  3. portrait phones: pan up so the villa sits under the headline
 */
function cameraGuard(cam: THREE.PerspectiveCamera) {
  const p = scrollState.smooth;
  sample(p, _p, _tgt);
  const w = lerp(Math.PI, 0.75, smoothstep(0.06, 0.14, p) * (1 - smoothstep(0.86, 0.94, p)));
  // final overview: never orbit below the hero's own elevation (no fence-in-face low angles)
  const pitchFloor = lerp(-1.2, -0.02, smoothstep(0.86, 0.95, p));
  if (orbit.tPitch < pitchFloor) orbit.tPitch = pitchFloor;
  if (w < Math.PI - 1e-3) {
    const base = Math.round(orbit.tYaw / TAU) * TAU;
    orbit.tYaw = base + clamp(orbit.tYaw - base, -w, w);
  }
  const c = cam.position;
  let moved = false;
  // portrait: the rig's generic fit backs off a bit more than this villa needs — come 7% closer (same direction)
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

/** adaptive resolution guard: slow GPU (e.g. shared Intel HD 530) → render at 0.8× DPR, back up when it recovers */
function AdaptiveDpr() {
  const setDpr = useThree((s) => s.setDpr);
  const base = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5);
  useEffect(() => () => setDpr(base), [setDpr, base]);
  return (
    <PerformanceMonitor
      bounds={() => [40, 58]}
      flipflops={4}
      onDecline={() => setDpr(Math.max(0.8, base * 0.8))}
      onIncline={() => setDpr(base)}
      onFallback={() => setDpr(Math.max(0.8, base * 0.8))}
    />
  );
}

export function RealEstateScene() {
  const lib = useMemo(() => createLib(), []);
  useEffect(() => () => lib.dispose(), [lib]);
  return (
    <>
      <CameraRig stops={STOPS} limits={LIMITS} fitAspect={1.45} defaultFov={36} onAfter={cameraGuard} />
      <AdaptiveDpr />
      <SkyDome />
      <Lighting />
      <Villa lib={lib} />
      <Landscape lib={lib} />
    </>
  );
}
