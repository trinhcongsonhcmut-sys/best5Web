import { Suspense, useEffect, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { bridge } from './bridge';
import { isCoarsePointer } from './math';

const TONE = {
  aces: THREE.ACESFilmicToneMapping,
  neutral: THREE.NeutralToneMapping,
  agx: THREE.AgXToneMapping,
  cineon: THREE.CineonToneMapping,
  none: THREE.NoToneMapping,
} as const;

/** Measures FPS / camera, flips bridge.ready once assets are in and frames rendered, reports context loss. */
function Probe() {
  const { camera, gl } = useThree();
  const { active } = useProgress();
  const acc = useRef({ t: 0, f: 0 });
  useFrame((_, dt) => {
    const s = bridge.state;
    s.camera.position[0] = camera.position.x;
    s.camera.position[1] = camera.position.y;
    s.camera.position[2] = camera.position.z;
    s.camera.fov = (camera as THREE.PerspectiveCamera).fov;
    s.fps.frames++;
    acc.current.t += dt;
    acc.current.f++;
    if (acc.current.t >= 0.5) {
      const inst = acc.current.f / acc.current.t;
      s.fps.avg = s.fps.avg === 0 ? inst : s.fps.avg * 0.6 + inst * 0.4;
      acc.current.t = 0;
      acc.current.f = 0;
    }
    if (!s.ready && s.fps.frames > 8 && !active) s.ready = true;
  });
  useEffect(() => {
    const el = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      bridge.logError('webglcontextlost');
    };
    el.addEventListener('webglcontextlost', lost);
    return () => el.removeEventListener('webglcontextlost', lost);
  }, [gl]);
  return null;
}

export interface StageProps {
  children: ReactNode;
  /** scene clear colour (also set <color attach="background"> yourself if you need a gradient pass) */
  background?: THREE.ColorRepresentation;
  fov?: number;
  exposure?: number;
  tone?: keyof typeof TONE;
  shadows?: boolean;
  dprMax?: number;
}

/** The one <Canvas> every demo uses: tuned DPR (lower on touch), tone mapping, bridge probe, Suspense. */
export function Stage({ children, background = '#0b0b0d', fov = 35, exposure = 1, tone = 'aces', shadows = true, dprMax = 2 }: StageProps) {
  const coarse = isCoarsePointer();
  return (
    <Canvas
      className="gl-canvas"
      shadows={shadows}
      dpr={[1, coarse ? 1.5 : dprMax]}
      camera={{ fov, near: 0.05, far: 400, position: [0, 0, 8] }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = TONE[tone];
        gl.toneMappingExposure = exposure;
        // Main pass is unaffected (every demo sets scene.background) but drei <ContactShadows>/off-screen targets
        // clear with this alpha — 1 turned the shadow plane into an opaque dark block.
        gl.setClearAlpha(0);
      }}
    >
      <color attach="background" args={[background]} />
      <Probe />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
