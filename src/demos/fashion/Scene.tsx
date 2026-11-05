import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig, orbit } from '../../lib/CameraRig';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import type { PoseStop } from '../../lib/math';
import { Backdrop } from './Backdrop';
import { Jacket } from './Jacket';
import { Rail } from './Rail';
import { NextPreview } from './NextPreview';
import { blobShadowTexture } from './textures';
import { FLY_LAND, FLY_START, resetWorld, stepWorld, uiStore, world } from './state';
import { COLOURWAYS } from './palette';

/*
 * Editorial shoot, scroll-scrubbed:
 *   0    low hero, garment floating centre, giant word behind
 *   .25  3/4 dolly from the right (garment drifts left, copy right)
 *   .5   half-turn (back) + layout shift: garment right, copy left
 *   .75  macro on chest: ciré texture, chambers, stitching, zip + patch
 *   1    low wide final, garment turned to its back 3/4, outlined word
 */
const LANDSCAPE: PoseStop[] = [
  // E2 framing: garment a little left of centre and smaller, headline space on the left kept clear
  { t: 0, pos: [0.22, -0.34, 7.0], target: [0.22, 0.03, 0], fov: 30 },
  { t: 0.25, pos: [3.05, 0.2, 4.15], target: [0.58, 0.03, 0], fov: 29 },
  { t: 0.5, pos: [-0.46, 0.5, 4.95], target: [-0.62, 0.02, 0], fov: 29 },
  { t: 0.75, pos: [0.66, 0.6, 2.0], target: [0.0, 0.44, 0.25], fov: 28 },
  { t: 1, pos: [1.2, -0.55, 5.55], target: [0.66, 0.06, 0], fov: 30 },
];

/**
 * portrait phones: no big lateral layout shifts (copy sits on top, HUD at the bottom); the garment is nudged a
 * little left so the stage-dot rail on the right edge never touches the sleeve.
 */
const PORTRAIT: PoseStop[] = [
  { t: 0, pos: [0.12, 0.1, 5.7], target: [0.12, 0.5, 0], fov: 30 },
  { t: 0.25, pos: [3.1, 0.6, 4.2], target: [0.14, 0.5, 0], fov: 29 },
  { t: 0.5, pos: [-0.08, 0.9, 5.0], target: [0.12, 0.48, 0], fov: 29 },
  { t: 0.75, pos: [0.62, 0.68, 1.6], target: [0.1, 0.48, 0.26], fov: 28 },
  { t: 1, pos: [0.62, -0.15, 5.6], target: [0.12, 0.5, 0], fov: 30 },
];

function BlobShadow() {
  const tex = useMemo(() => blobShadowTexture(), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#000', alphaMap: tex, transparent: true, depthWrite: false, opacity: 0.6, fog: false }), [tex]);
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => () => { tex.dispose(); mat.dispose(); }, [tex, mat]);
  useFrame(() => {
    mat.color.copy(world.cur.shadow);
    const lift = world.anchor.y - 0.05; // bob
    const s = 1 - lift * 1.6;
    // during the swap move the shadow shrinks + fades with the garment, and returns as it lands
    const k = THREE.MathUtils.clamp((world.scale - 0.3) / 0.7, 0, 1);
    if (ref.current) ref.current.scale.set(2.1 * s * (0.4 + 0.6 * k), 1.15 * s * (0.4 + 0.6 * k), 1);
    mat.opacity = 0.75 * (1 - lift * 2.2) * k * k;
  });
  return (
    <mesh ref={ref} material={mat} rotation-x={-Math.PI / 2} position={[0, -0.96, 0.02]} raycast={() => null} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

/** lights whose colour follows the colourway (the env map is baked once, neutral) */
function WorldLights() {
  const rim = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    rim.current?.color.copy(world.cur.rim);
    hemi.current?.groundColor.copy(world.cur.bgOut);
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffffff', '#884422', 0.55]} />
      <directionalLight position={[-3, 4.5, 5]} intensity={1.35} color="#fff6ec" />
      <directionalLight ref={rim} position={[3.5, 2.2, -4]} intensity={2.4} />
      <directionalLight position={[-4, 1.2, -3]} intensity={1.1} color="#ffffff" />
    </>
  );
}

function Studio() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.95}>
      {/* overhead softbox: highlight along the top of every chamber */}
      <Lightformer form="rect" intensity={2.6} position={[0, 6, 1.5]} rotation-x={Math.PI / 2} scale={[7, 3, 1]} />
      {/* big front-left key */}
      <Lightformer form="rect" intensity={1.5} position={[-4.5, 1.5, 4]} scale={[3.5, 4.5, 1]} />
      {/* tall strips: vertical glints across the glossy baffles */}
      <Lightformer form="rect" intensity={2.2} position={[4.5, 0.6, 2.5]} scale={[0.9, 7, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[-1.5, 0.4, 6]} scale={[0.6, 6, 1]} />
      {/* back rims */}
      <Lightformer form="rect" intensity={2.4} position={[-3.5, 1, -4.5]} scale={[1.2, 6, 1]} />
      <Lightformer form="rect" intensity={2.4} position={[3.5, 1, -4.5]} scale={[1.2, 6, 1]} />
      {/* warm bounce from the floor */}
      <Lightformer form="rect" intensity={0.5} position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[8, 8, 1]} color="#ffd9b8" />
    </Environment>
  );
}

export function FashionScene() {
  const size = useThree((s) => s.size);
  const portrait = size.width / Math.max(1, size.height) < 0.9;
  const stops = useMemo(() => (portrait ? PORTRAIT : LANDSCAPE), [portrait]);
  const limits = useMemo(() => ({ elevMin: -0.32, elevMax: 0.7, dollyMin: 0.55, dollyMax: 1.5 }), []);
  const index = variantStore.use((s) => s.index);

  useEffect(() => {
    resetWorld();
  }, []);

  useFrame((_, delta) => {
    stepWorld(index, Math.min(delta, 0.05), scrollState.smooth);
    bridge.state.extra.colourway = COLOURWAYS[world.index].id;
    bridge.state.extra.turn = +(scrollState.smooth).toFixed(3);
    // dim the copy while a jacket flies across it, or while the viewer orbits the garment under the headline
    const sw = world.swap;
    const flying = world.mode === 'fly' && sw >= FLY_START && sw < FLY_LAND;
    const yawW = Math.abs((((orbit.yaw + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
    const orbiting = yawW > 0.6 || Math.abs(orbit.pitch) > 0.35;
    const dim = flying || orbiting;
    if (uiStore.get().dim !== dim) uiStore.set({ dim });
  });

  return (
    <>
      <CameraRig stops={stops} limits={limits} defaultFov={30} fitAspect={portrait ? 1.1 : 1.25} />
      <Backdrop />
      <Studio />
      <WorldLights />
      <Rail />
      <BlobShadow />
      <Jacket />
      <NextPreview />
    </>
  );
}
