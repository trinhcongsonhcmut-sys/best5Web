import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig, orbit } from '../../lib/CameraRig';
import { smoothstep } from '../../lib/math';
import type { PoseStop, Vec3 } from '../../lib/math';
import { Car } from './Car';
import { dotTexture } from './materials';
import { Backdrop, Ground, HAZE, Ridges, Road, Shrubs } from './World';
import { SUN, anim, carDims } from './anim';
import { FX_LAYER } from './layers';

const FOG = { near: 55, far: 360 };

/*
 * Camera storyboard = v1 (hero 3/4 front low → side profile → high 3/4 reveal → rear 3/4 → final), re-framed for a
 * 4.36 m GT (v1 truck: 6.15 m): offsets ×0.72, targets lowered to the car's height.
 */
const BASE: PoseStop[] = [
  { t: 0, pos: [4.75, 0.9, 8.15], target: [0.12, 0.92, 0], fov: 27 },
  { t: 0.25, pos: [0.2, 0.68, 9.25], target: [0.12, 0.74, 0], fov: 27 },
  { t: 0.5, pos: [5.3, 3.95, 6.85], target: [0.05, 1.02, 0], fov: 30 },
  { t: 0.625, pos: [-1.75, 2.05, 8.6], target: [-0.2, 0.86, 0], fov: 29 }, // a touch lower than v1 so the .03 copy lands on sky, not asphalt
  { t: 0.75, pos: [-6.05, 1.55, 4.95], target: [-0.32, 0.8, 0], fov: 27 },
  { t: 0.875, pos: [-0.45, 0.98, 8.95], target: [0, 0.8, 0], fov: 28 },
  { t: 1, pos: [6.1, 0.62, 6.3], target: [0.15, 0.84, 0], fov: 29 },
];

/** Portrait screens: same shots, pulled back further and the subject lowered under the copy block. */
function stopsFor(aspect: number): PoseStop[] {
  if (aspect >= 1.05) return BASE;
  // the GT is wider than the v1 truck (2.5 m with mirrors) → a little more pull-back to keep it ~90 % of a phone's width
  const k = aspect < 0.7 ? 1.1 : 1.08;
  const lift = aspect < 0.7 ? 0.78 : 0.45;
  return BASE.map((s) => {
    const off = [s.pos[0] - s.target[0], s.pos[1] - s.target[1], s.pos[2] - s.target[2]];
    const target: Vec3 = [s.target[0], s.target[1] + lift, s.target[2]];
    return { ...s, target, pos: [target[0] + off[0] * k, target[1] + off[1] * k - lift * 0.4, target[2] + off[2] * k] as Vec3 };
  });
}

const fx = (o: THREE.Object3D) => o.layers.set(FX_LAYER);

/** Golden motes drifting in the low sun. */
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat, base } = useMemo(() => {
    const N = 160;
    const base = new Float32Array(N * 3);
    let s = 3;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      base[i * 3] = (r() - 0.5) * 20;
      base[i * 3 + 1] = 0.05 + r() * r() * 2.2;
      base[i * 3 + 2] = (r() - 0.5) * 14;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
    const mat = new THREE.PointsMaterial({ size: 0.035, map: dotTexture(), color: '#ffd7a2', transparent: true, opacity: 0.7, depthWrite: false, sizeAttenuation: true, blending: THREE.AdditiveBlending });
    return { geo, mat, base };
  }, []);
  useEffect(() => () => { geo.dispose(); mat.map?.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < a.count; i++) {
      let x = base[i * 3] - ((t * 0.3 + anim.roll * 0.9 + i) % 20);
      x = (((x + 10) % 20) + 20) % 20 - 10;
      a.setXYZ(i, x, base[i * 3 + 1] + Math.sin(t * 0.6 + i) * 0.04, base[i * 3 + 2]);
    }
    a.needsUpdate = true;
  });
  return <points ref={ref} geometry={geo} material={mat} raycast={() => null} onUpdate={fx} />;
}

/** .01 beat: fine road dust lifted behind the rear tyres while the car "drives" (opacity follows anim.drive). */
function DustTrail() {
  const ref = useRef<THREE.Points>(null);
  const N = 220;
  const { geo, mat, seed } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 4), 4));
    const seed = new Float32Array(N * 3);
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N * 3; i++) seed[i] = r();
    const mat = new THREE.PointsMaterial({ size: 0.34, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true });
    return { geo, mat, seed };
  }, []);
  useEffect(() => () => { geo.dispose(); mat.map?.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(({ clock }) => {
    const d = anim.drive;
    if (ref.current) ref.current.visible = d > 0.01;
    if (d <= 0.01) return;
    const t = clock.elapsedTime;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const col = geo.getAttribute('color') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const e = i % 4;
      const ex = (e < 2 ? carDims.rearX : carDims.frontX) - carDims.wheelR;
      const ez = (e % 2 ? -1 : 1) * (carDims.trackZ + 0.05);
      const life = (t * 0.6 + seed[i * 3]) % 1;
      const spread = seed[i * 3 + 1];
      pos.setXYZ(i, ex - life * (1.4 + spread * 1.8), 0.04 + life * (0.16 + seed[i * 3 + 2] * 0.4), ez + Math.sign(ez) * life * spread * 0.5);
      const a = Math.sin(Math.PI * life) * (1 - life * 0.4) * d * (e < 2 ? 0.26 : 0.12);
      col.setXYZ(i, 0.86, 0.72, 0.58);
      col.setW(i, a);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });
  return <points ref={ref} geometry={geo} material={mat} raycast={() => null} frustumCulled={false} onUpdate={fx} />;
}

/** Adaptive resolution guard (shared Intel HD 530): 0.8× DPR while the GPU is behind, back up when it recovers. */
function AdaptiveDpr() {
  const setDpr = useThree((s) => s.setDpr);
  const base = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5);
  useEffect(() => () => setDpr(base), [setDpr, base]);
  return (
    <PerformanceMonitor
      bounds={() => [50, 60]}
      flipflops={4}
      onDecline={() => setDpr(Math.max(0.8, base * 0.8))}
      onIncline={() => setDpr(base)}
      onFallback={() => setDpr(Math.max(0.8, base * 0.8))}
    />
  );
}

export function AutomotiveScene() {
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const portrait = aspect < 1.05;
  const stops = useMemo(() => stopsFor(aspect), [portrait, aspect < 0.7]); // eslint-disable-line react-hooks/exhaustive-deps
  const camera = useThree((st) => st.camera);
  useEffect(() => {
    camera.layers.enable(FX_LAYER);
  }, [camera]);
  const tv = useMemo(() => ({ back: new THREE.Vector3() }), []);
  const topViewSafe = useCallback(
    (cam: THREE.PerspectiveCamera) => {
      const k = smoothstep(0.12, 0.5, orbit.pitch);
      if (k <= 0) return;
      tv.back.set(0, 0, 1).applyQuaternion(cam.quaternion);
      cam.position.addScaledVector(tv.back, 2.2 * k);
    },
    [tv],
  );
  const limits = useMemo(() => ({ elevMin: 0.02, elevMax: 0.5, dollyMin: 0.62, dollyMax: 1.45 }), []);
  const sunPos = useMemo(() => SUN.clone().multiplyScalar(30), []);

  return (
    <>
      <fog attach="fog" args={[HAZE, FOG.near, FOG.far]} />
      <CameraRig stops={stops} limits={limits} defaultFov={28} fitAspect={1.5} onAfter={topViewSafe} />
      <AdaptiveDpr />
      <Backdrop />
      <directionalLight position={sunPos} intensity={3.0} color="#ffab5e" />
      {/* soft sky-bounce key from the camera side (what keeps the reference car's flank and nose bright) */}
      <directionalLight position={[7, 6, 9]} intensity={0.45} color="#ffe9d6" />
      <Ridges />
      <Ground />
      <Road />
      <Shrubs />
      <Car />
      <Dust />
      <DustTrail />
    </>
  );
}
