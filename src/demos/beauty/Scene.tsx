/**
 * BAHA BOTANICA scene graph: high-key pastel studio. Camera = slow, symmetric dolly storyboard (5 marks).
 */
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig } from '../../lib/CameraRig';
import { variantStore } from '../../lib/store';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import type { PoseStop, Vec3 } from '../../lib/math';
import { resetLook, stepLook, WORLDS } from './palette';
import { whenFonts } from './textures';
import { pose } from './anim';
import { JS, warm } from './rig';
import { Jar } from './Jar';
import { Leaves } from './Leaves';
import { Ingredients } from './Ingredients';
import { BlobShadow, GiantWord, Motes, Sky } from './Backdrop';
import { Plinth, Serum, SERUM_POS } from './Serum';

const sc = (v: Vec3, k = JS): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
const STOPS: PoseStop[] = [
  // hero: jar ≈ 40 % of the frame width (A1 ≈ 44 %)
  { t: 0, pos: [0, 0.9, 4.65], target: [0, 0.6, 0], fov: 30 },
  { t: 0.25, pos: sc([0.95, 2.1, 3.95]), target: sc([0, 0.6, 0]), fov: 30 },
  { t: 0.5, pos: sc([-0.95, 1.2, 5.6]), target: sc([0, 0.76, 0]), fov: 32 },
  { t: 0.75, pos: sc([1.9, 1.55, 4.05]), target: sc([0, 1.0, 0]), fov: 31 },
  { t: 1, pos: [1.25, 1.5, 7.9], target: [0.5, 0.5, 0], fov: 28 },
];

/**
 * Portrait screens: same shots, pulled back just enough for the jar to fill ~55 % of the width, subject lowered
 * under the copy block; the 75 % craft shot slides the stack left so its labels have room on the right.
 */
function stopsFor(aspect: number): PoseStop[] {
  if (aspect >= 0.85) return STOPS;
  const k = Math.min(1.9, Math.max(1, Math.pow(0.85 / aspect, 0.8)));
  return STOPS.map((s) => {
    const off = s.pos.map((v, i) => v - s.target[i]);
    const shift: Vec3 = s.t === 0.75 ? [0.34, -0.1, -0.16] : s.t === 1 ? [-0.16, -0.12, 0] : [0, -0.2, 0];
    const target: Vec3 = [s.target[0] + shift[0], s.target[1] + shift[1], s.target[2] + shift[2]];
    const kk = s.t === 0.75 ? k * 1.14 : s.t === 1 ? k * 1.0 : s.t === 0 ? k * 1.3 : k;
    return { ...s, target, pos: [target[0] + off[0] * kk, target[1] + off[1] * kk, target[2] + off[2] * kk] as Vec3 };
  });
}

function LookDriver() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    // Stage flips bridge.ready only when drei's loading manager is idle → register our own prep as a load item so
    // fonts, canvas textures (GPU upload) and every shader program are done BEFORE ready (no hitch afterwards).
    const mgr = THREE.DefaultLoadingManager;
    let alive = true;
    mgr.itemStart('beauty:prep');
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
    whenFonts()
      .then(frame)
      .then(frame)
      .then(async () => {
        if (!alive) return;
        scene.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
          (Array.isArray(m) ? m : m ? [m] : []).forEach((mm) => {
            const t = (mm as THREE.MeshStandardMaterial).map;
            if (t) gl.initTexture(t);
          });
        });
        try {
          await gl.compileAsync(scene, camera);
        } catch {
          /* compile errors surface through the normal render path */
        }
      })
      .finally(() => {
        mgr.itemEnd('beauty:prep');
      });
    return () => {
      if (alive) alive = false;
    };
  }, [gl, scene, camera]);
  useEffect(() => {
    resetLook(0);
    warm.frames = 0;
  }, []);
  useFrame((_, delta) => {
    const i = variantStore.get().index;
    stepLook(i, Math.min(delta, 0.05));
    warm.frames++;
    const a = pose(scrollState.smooth);
    const x = bridge.state.extra;
    x.world = WORLDS[i]?.id ?? '';
    x.capLift = +a.capLift.toFixed(3);
    x.explode = +a.explode.toFixed(3);
    x.ingredients = +a.ingredients.toFixed(3);
  });
  return null;
}

function Studio() {
  const envSky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {},
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `varying vec3 vDir; void main(){
            float y = vDir.y;
            vec3 c = mix(vec3(0.42,0.45,0.48), vec3(0.72,0.75,0.78), smoothstep(-0.3, 0.7, y));
            c = mix(c, vec3(0.3,0.31,0.33), smoothstep(-0.05, -0.6, y));
            gl_FragColor = vec4(c, 1.0); }`,
      }),
    [],
  );
  useEffect(() => () => envSky.dispose(), [envSky]);
  return (
    <Environment resolution={256} frames={1} environmentIntensity={1}>
      <mesh material={envSky} scale={50}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      {/* big overhead softbox */}
      <Lightformer form="rect" intensity={3.2} position={[0, 6, 1.5]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
      {/* tall strip key on the left → long vertical highlight on the glass */}
      <Lightformer form="rect" intensity={4} position={[-4.5, 1.2, 2.5]} rotation-y={Math.PI / 2.6} scale={[0.7, 6, 1]} />
      {/* warmer narrow strip right */}
      <Lightformer form="rect" intensity={6} position={[-2.6, 1.2, 4.2]} rotation-y={Math.PI / 5} scale={[0.12, 5, 1]} />
      <Lightformer form="rect" intensity={2.2} position={[4.5, 1, 1.5]} rotation-y={-Math.PI / 2.4} scale={[0.5, 5, 1]} color="#fff3df" />
      {/* cool rim from behind */}
      <Lightformer form="rect" intensity={2.4} position={[0, 2, -6]} scale={[7, 1.2, 1]} color="#e3f2ff" />
      <Lightformer form="circle" intensity={2} position={[2.5, 4, 4]} scale={1.6} />
    </Environment>
  );
}

export function BeautyScene() {
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const bucket = aspect >= 0.85 ? 1 : Math.round(aspect * 20) / 20;
  const stops = useMemo(() => stopsFor(bucket), [bucket]);
  const limits = useMemo(() => ({ elevMin: -0.08, elevMax: 1.15, dollyMin: 0.68, dollyMax: 1.4 }), []);
  return (
    <>
      <LookDriver />
      <CameraRig stops={stops} limits={limits} defaultFov={30} fitAspect={bucket < 1 ? 0.2 : 1.5} />
      <Studio />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 5, 4]} intensity={1.5} color="#fffaf2" />
      <directionalLight position={[3.5, 2, -4]} intensity={0.9} color="#e8f4ff" />
      <Sky />
      <GiantWord />
      <Jar />
      <BlobShadow getX={() => pose(scrollState.smooth).jarX} getLift={() => pose(scrollState.smooth).jarLift} radius={0.72 * JS} strength={0.55} />
      <BlobShadow getX={() => SERUM_POS.x} getLift={() => 0} getAlpha={() => pose(scrollState.smooth).serum} radius={0.42 * JS} strength={0.45} z={SERUM_POS.z} />
      <Leaves />
      <Ingredients />
      <Plinth />
      <Serum />
      <Motes />
    </>
  );
}
