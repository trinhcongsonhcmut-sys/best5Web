/**
 * BAHA BOTANICA v2 scene graph: warm off-white studio, real HDRI (studio_small_09, CC0) + brand strip lights for the
 * glass highlights. Camera = the v1 slow, symmetric dolly storyboard (5 marks), re-framed for a tall dropper bottle.
 */
import { useEffect, useLayoutEffect, useMemo } from 'react';
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
import { prep, warm } from './rig';
import { Bottle } from './Bottle';
import { Bokeh, HeroCitrus, Splash } from './Citrus';
import { Ingredients } from './Ingredients';
import { BlobShadow, Caustic, GiantWord, Motes, Sky } from './Backdrop';
import { Plinth, Serum, SERUM_POS } from './Serum';
import { disposeCitrusTextures } from './materials';

/** same beats/directions as v1 (hero front · high right · wide left · close ¾ right · pulled-back ritual) */
const STOPS: PoseStop[] = [
  // hero: bottle ≈ 58 % of the frame height, centred (v2 reference)
  { t: 0, pos: [0, 1.02, 5.7], target: [0, 0.88, 0], fov: 30 },
  { t: 0.25, pos: [1.3, 2.5, 4.95], target: [0, 1.1, 0], fov: 30 },
  { t: 0.5, pos: [-1.4, 1.55, 6.9], target: [0, 1.0, 0], fov: 32 },
  // in-between: the dropper is at its highest (pipette tip clearing the neck) → frame the full stack
  { t: 0.645, pos: [1.15, 2.15, 6.55], target: [0.18, 1.48, 0], fov: 31 },
  { t: 0.75, pos: [2.25, 1.86, 5.35], target: [0.3, 1.28, 0], fov: 31 },
  { t: 1, pos: [1.0, 1.75, 8.2], target: [0.2, 0.78, 0], fov: 28 },
];

/**
 * Portrait screens: same shots, pulled back just enough for the bottle to read, subject lowered under the copy
 * block; the 75 % craft shot slides the stack left so its labels have room on the right.
 */
function stopsFor(aspect: number): PoseStop[] {
  if (aspect >= 0.85) return STOPS;
  const k = Math.min(1.9, Math.max(1, Math.pow(0.85 / aspect, 0.8)));
  return STOPS.map((s) => {
    const off = s.pos.map((v, i) => v - s.target[i]);
    const shift: Vec3 = s.t === 0.75 ? [0.36, -0.1, -0.16] : s.t === 1 ? [-0.1, -0.12, 0] : [0, -0.22, 0];
    const target: Vec3 = [s.target[0] + shift[0], s.target[1] + shift[1], s.target[2] + shift[2]];
    const kk = s.t === 0.75 ? k * 1.12 : s.t === 1 ? k * 1.0 : s.t === 0 ? k * 0.92 : k;
    return { ...s, target, pos: [target[0] + off[0] * kk, target[1] + off[1] * kk, target[2] + off[2] * kk] as Vec3 };
  });
}

/** holds on-screen rendering until the scene's programs are compiled (see LookDriver) */
const gate = {
  orig: null as null | THREE.WebGLRenderer['render'],
  hold(gl: THREE.WebGLRenderer) {
    if (this.orig) return;
    const orig = gl.render;
    this.orig = orig;
    gl.render = function (scene, camera) {
      if (gl.getRenderTarget() !== null) orig.call(gl, scene, camera);
    };
  },
  release(gl: THREE.WebGLRenderer) {
    if (!this.orig) return;
    gl.render = this.orig;
    this.orig = null;
  },
};

function LookDriver() {
  const { gl, scene, camera } = useThree();
  // Cold start: nothing may be drawn on screen before the programs exist, otherwise the first frame compiles every
  // shader synchronously (seconds on ANGLE/D3D11). Until compileAsync — which uses KHR_parallel_shader_compile in
  // the GPU process — is done, on-screen renders are skipped; off-screen ones (environment cube, PMREM) still run.
  useLayoutEffect(() => {
    gate.hold(gl);
    return () => gate.release(gl);
  }, [gl]);
  useEffect(() => {
    // Stage flips bridge.ready only when drei's loading manager is idle → `prep` (opened at page mount) stays open
    // until fonts, the label canvas (GPU upload), the HDRI environment and every shader program are done.
    let alive = true;
    prep.start();
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
    const envReady = async () => {
      for (let i = 0; i < 600 && alive && !scene.environment; i++) await frame();
    };
    whenFonts()
      .then(envReady)
      .then(frame)
      .then(frame)
      .then(async () => {
        if (!alive) return;
        scene.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
          (Array.isArray(m) ? m : m ? [m] : []).forEach((mm) => {
            const s = mm as THREE.MeshPhysicalMaterial;
            [s.map, s.normalMap, s.alphaMap].forEach((t) => t && gl.initTexture(t));
          });
        });
        try {
          await Promise.race([gl.compileAsync(scene, camera), new Promise((r) => setTimeout(r, 20000))]);
        } catch {
          /* compile errors surface through the normal render path */
        }
        if (!alive) return;
        // draw again, then let the warm-up frames (every mesh drawn once, transmission target + mips allocated) pass
        // BEFORE ready, so no first-use stall lands in the visitor's first scroll
        gate.release(gl);
        for (let i = 0; i < 14 && alive; i++) await frame();
      })
      .finally(() => {
        gate.release(gl);
        if (alive) prep.end();
      });
    return () => {
      alive = false;
      prep.end();
    };
  }, [gl, scene, camera]);
  useEffect(() => {
    resetLook(0);
    warm.frames = 0;
    return () => disposeCitrusTextures();
  }, []);
  useFrame((_, delta) => {
    const i = variantStore.get().index;
    stepLook(i, Math.min(delta, 0.05));
    // warm-up frames only count while frames really reach the screen (not while the compile gate holds them)
    if (!gate.orig) warm.frames++;
    const a = pose(scrollState.smooth);
    const x = bridge.state.extra;
    x.world = WORLDS[i]?.id ?? '';
    x.dropperLift = +a.dropperY.toFixed(3);
    x.explode = +a.explode.toFixed(3);
    x.ingredients = +a.ingredients.toFixed(3);
    x.splash = +a.splash.toFixed(3);
  });
  return null;
}

/**
 * Automatic quality step for weak GPUs: if the measured frame rate stays under 42 fps for 3 s (judged from 4 s
 * after `ready`), the transmission target drops to 40 % (one step, never back up → no oscillation).
 */
function AutoQuality() {
  const { gl } = useThree();
  const st = useMemo(() => ({ slow: 0, since: -1, done: false }), []);
  useFrame(({ clock }, delta) => {
    const s = bridge.state;
    if (st.done || !s.ready) return;
    if (st.since < 0) st.since = clock.elapsedTime;
    // judged only after the first 4 s of interaction (start-up uploads never trigger it)
    if (clock.elapsedTime - st.since < 4) return;
    st.slow = s.fps.avg > 0 && s.fps.avg < 42 ? st.slow + Math.min(delta, 0.1) : 0;
    if (st.slow > 3) {
      st.done = true;
      gl.transmissionResolutionScale = 0.4;
      s.extra.quality = 'reduced';
    }
  });
  return null;
}

/** studio_small_09 light directions (found by scanning the HDR for luminance blobs) */
const UMB: [number, number, number] = [0.732 * 8, 0.433 * 8, 0.526 * 8];
const UMB2: [number, number, number] = [-0.69 * 8, 0.49 * 8, 0.52 * 8];
const UMB_I = 16;
const ENV_ROT = 1.1;

/** Real studio HDRI (reflections + refraction source) with three brand strip lights composited into the same cube. */
function Studio() {
  return (
    <Environment files="/assets/hdri/studio_small_09_2k.hdr" resolution={512} frames={1} environmentIntensity={0.85} environmentRotation={[0, ENV_ROT, 0]}>
      {/* tall soft strip key on the left → the long vertical highlight down the glass shoulder and wall */}
      <Lightformer form="rect" intensity={16} position={[-3.2, 1.5, 3.2]} rotation-y={Math.PI / 3.8} scale={[0.32, 9, 1]} />
      {/* narrow warm kicker right → second, thinner streak */}
      <Lightformer form="rect" intensity={11} position={[3.4, 1.2, 2.6]} rotation-y={-Math.PI / 3.4} scale={[0.16, 8, 1]} color="#fff1df" />
      {/* the HDRI's umbrella softbox (u 0.6, v 0.64 of studio_small_09) reflected as a ribbed "leaf" on the glass
          shoulder → covered by a clean rectangular softbox of similar output */}
      <Lightformer form="rect" intensity={UMB_I} position={UMB} target={[0, 0, 0]} scale={[5.2, 4, 1]} color="#fffaf2" />
      <Lightformer form="rect" intensity={10} position={UMB2} target={[0, 0, 0]} scale={[2.6, 2.8, 1]} color="#fffaf2" />
      {/* backlight behind the bottle → glows the amber through the liquid edge */}
      <Lightformer form="rect" intensity={3.2} position={[0, 1.4, -5]} scale={[5, 4, 1]} color="#ffd9a8" />
    </Environment>
  );
}

export function BeautyScene() {
  const { size, gl } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const bucket = aspect >= 0.85 ? 1 : Math.round(aspect * 20) / 20;
  const stops = useMemo(() => stopsFor(bucket), [bucket]);
  const limits = useMemo(() => ({ elevMin: -0.08, elevMax: 1.15, dollyMin: 0.68, dollyMax: 1.4 }), []);
  useEffect(() => {
    // the one transmission pass (amber glass) only ever shows the serum + backdrop through tinted glass → half size
    const prev = gl.transmissionResolutionScale;
    gl.transmissionResolutionScale = 0.5;
    return () => {
      gl.transmissionResolutionScale = prev;
    };
  }, [gl]);
  const jarX = () => pose(scrollState.smooth).jarX;
  const jarLift = () => pose(scrollState.smooth).jarLift;
  return (
    <>
      <LookDriver />
      <AutoQuality />
      <CameraRig stops={stops} limits={limits} defaultFov={30} fitAspect={bucket < 1 ? 0.2 : 1.5} />
      <Studio />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-3, 5, 4]} intensity={1.35} color="#fff6ea" />
      <directionalLight position={[3.5, 2, -4]} intensity={0.8} color="#fff2e2" />
      <Sky />
      <GiantWord />
      <Bottle />
      <BlobShadow getX={jarX} getLift={jarLift} radius={0.62} strength={0.32} />
      <BlobShadow getX={jarX} getLift={jarLift} radius={0.36} strength={0.38} soft={false} />
      <Caustic getX={jarX} />
      <BlobShadow getX={() => SERUM_POS.x} getLift={() => 0} getAlpha={() => pose(scrollState.smooth).serum} radius={0.42} strength={0.4} z={SERUM_POS.z} />
      <Splash />
      <HeroCitrus />
      <Ingredients />
      <Plinth />
      <Serum />
      <Motes />
      <Bokeh />
    </>
  );
}
