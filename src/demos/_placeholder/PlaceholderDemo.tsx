/**
 * TEMPORARY engineering placeholder (NOT an acceptable deliverable — see MASTER_PROMPT PHẦN VII).
 * It exists only to prove the shared framework end-to-end (scroll timeline, orbit, variants, hover rim, QC bridge)
 * before each demo's real scene replaces it. Each demo folder overwrites its own index.tsx.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig } from '../../lib/CameraRig';
import { Stage } from '../../lib/Stage';
import { ShowcasePage, type DemoMeta } from '../../lib/ui';
import { VariantPicker } from '../../lib/ui';
import { addRim, useHoverRim } from '../../lib/rim';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import { damp, range, smoothstep, type PoseStop } from '../../lib/math';

const STOPS: PoseStop[] = [
  { t: 0, pos: [0, 0.4, 9], target: [0, 0, 0], fov: 32 },
  { t: 0.25, pos: [3.2, 0.9, 6.2], target: [0, 0, 0], fov: 30 },
  { t: 0.5, pos: [0, 2.6, 5.2], target: [0, 0.1, 0], fov: 34 },
  { t: 0.75, pos: [-2.2, 0.3, 3.6], target: [0, 0, 0], fov: 28 },
  { t: 1, pos: [0, 0.6, 7.5], target: [0, 0, 0], fov: 36 },
];

function PlaceholderScene({ meta }: { meta: DemoMeta }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { material, uniforms } = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color: meta.variants[0].swatch as string, metalness: 0.9, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });
    return addRim(m, { color: meta.accent });
  }, [meta]);
  const target = useMemo(() => new THREE.Color(), []);
  const index = variantStore.use((s) => s.index);
  const { bind } = useHoverRim(() => [uniforms], 'placeholder', 1.4);

  useEffect(() => {
    bridge.registerMaterial('primary', material, uniforms.uRim);
    return () => bridge.unregisterMaterial('primary');
  }, [material, uniforms]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const v = meta.variants[index].swatch;
    target.set(Array.isArray(v) ? v[0] : v);
    material.color.lerp(target, 1 - Math.exp(-6 * dt));
    const p = scrollState.smooth;
    if (mesh.current) {
      mesh.current.rotation.y = p * Math.PI * 4;
      mesh.current.rotation.x = smoothstep(0.4, 0.6, p) * 0.8;
      const s = 1 + range(0.5, 0.75, p) * 0.35;
      mesh.current.scale.setScalar(damp(mesh.current.scale.x, s, 6, dt));
    }
  });

  return (
    <>
      <CameraRig stops={STOPS} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[-5, 1, -2]} scale={[2, 6, 1]} color={meta.accent} />
        <Lightformer form="ring" intensity={3} position={[4, 1, 2]} scale={3} />
      </Environment>
      <mesh ref={mesh} material={material} castShadow {...bind}>
        <torusKnotGeometry args={[1, 0.34, 256, 48]} />
      </mesh>
    </>
  );
}

export function PlaceholderDemo({ meta, label }: { meta: DemoMeta; label: string }) {
  return (
    <ShowcasePage
      meta={meta}
      scene={
        <Stage background="#0e0e11">
          <PlaceholderScene meta={meta} />
        </Stage>
      }
      overlay={
        <div style={{ position: 'absolute', left: 24, bottom: 90 }}>
          <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.6 }}>
            {label} — placeholder (đang dựng)
          </p>
          <VariantPicker variants={meta.variants} />
        </div>
      }
    />
  );
}
