import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig, orbit } from '../../lib/CameraRig';
import { smoothstep } from '../../lib/math';
import { Car } from './Car';
import { dotTexture } from './materials';
import { Backdrop, Ground, Road, Shrubs } from './World';
import { anim, carDims } from './anim';
import { CAMERA, FOG, LIGHTS, stopsFor } from './contract';
import { FX_LAYER } from './layers';

const fx = (o: THREE.Object3D) => o.layers.set(FX_LAYER);

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
    const c = camera as THREE.PerspectiveCamera;
    c.far = CAMERA.far; // the dome (r 380 m) must never be clipped, even on the portrait pull-back
    c.updateProjectionMatrix();
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

  return (
    <>
      <fog attach="fog" args={[FOG.color, FOG.near, FOG.far]} />
      <CameraRig stops={stops} limits={limits} defaultFov={CAMERA.defaultFov} fitAspect={CAMERA.fitAspect} onAfter={topViewSafe} />
      <AdaptiveDpr />
      <Backdrop />
      {/* soft sky-bounce key from the camera side (what keeps the reference car's flank and nose bright) */}
      <directionalLight position={LIGHTS.fill.position} intensity={LIGHTS.fill.intensity} color={LIGHTS.fill.color} />
      <Ground />
      <Road />
      <Shrubs />
      <Car />
      <DustTrail />
    </>
  );
}
