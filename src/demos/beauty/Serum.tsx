/**
 * Final still-life (ritual mark): warm satin pedestal rising into frame + a citrus half and a wheel set beside the
 * bottle (secondary hover object "citrus"). The splash itself is the shared <Splash/> that returns around the bottle.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { easeOutCubic } from '../../lib/math';
import { useHoverRim } from '../../lib/rim';
import { pose } from './anim';
import { look } from './palette';
import { warm, steadyHover } from './rig';
import { halfGeometries, plinthGeometry, plinthTopGeometry, sliceGeometries } from './geometry';
import { fleshMaterial, rindMaterial, skipTransmissionPass } from './materials';
import { addRim } from '../../lib/rim';

export const PLINTH_X = 0.2;
/** citrus half on the pedestal (world, pedestal top = y 0) */
export const SERUM_POS = new THREE.Vector3(0.78, 0, 0.12);
const WHITE = new THREE.Color('#ffffff');

/** Two-tier satin pedestal with a thin brass inlay ring (bottle + citrus stand on it). */
export function Plinth() {
  const ref = useRef<THREE.Group>(null);
  const res = useMemo(() => {
    const geos = { base: plinthGeometry(1.3, 0.42), top: plinthTopGeometry(1.2), ring: new THREE.TorusGeometry(1.25, 0.008, 8, 160) };
    const mats = {
      // rim-capable (never lit) only so they share the collar's compiled program
      base: addRim(new THREE.MeshPhysicalMaterial({ color: look.plinth.clone(), roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.45, envMapIntensity: 0.85 })).material,
      top: addRim(new THREE.MeshPhysicalMaterial({ color: look.plinth.clone(), roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.28, envMapIntensity: 1.0 })).material,
      ring: new THREE.MeshStandardMaterial({ color: '#c9a46a', metalness: 0.9, roughness: 0.28 }),
    };
    return { geos, mats };
  }, []);
  useEffect(
    () => () => {
      Object.values(res.geos).forEach((g) => g.dispose());
      Object.values(res.mats).forEach((m) => m.dispose());
    },
    [res],
  );
  useFrame(() => {
    const k = pose(scrollState.smooth).plinth;
    const g = ref.current;
    if (!g) return;
    g.visible = k > 0.001 || warm.on;
    g.position.set(PLINTH_X, -3.4 * (1 - k), 0);
    res.mats.base.color.copy(look.plinth).multiplyScalar(0.95);
    res.mats.top.color.copy(look.plinth).lerp(WHITE, 0.3);
  });
  return (
    <group ref={ref}>
      <mesh geometry={res.geos.base} material={res.mats.base} position-y={-0.062} raycast={() => null} />
      <mesh geometry={res.geos.ring} material={res.mats.ring} position-y={-0.062} rotation-x={Math.PI / 2} raycast={() => null} />
      <mesh geometry={res.geos.top} material={res.mats.top} position-y={-0.062} raycast={() => null} />
    </group>
  );
}

/** Citrus half (cut face up toward the camera) + a wheel leaning on it, on the pedestal. */
export function Serum() {
  const ref = useRef<THREE.Group>(null);
  const res = useMemo(() => {
    const half = halfGeometries(0.34, 0.9);
    const slice = sliceGeometries(0.27, 0.05, Math.PI * 2, 2, 2.4);
    const flesh = fleshMaterial(true);
    const rind = rindMaterial([9, 0.4], true);
    const dome = rindMaterial([7, 2.2], true);
    [flesh, rind, dome].forEach((x) => skipTransmissionPass(x.material));
    return { half, slice, flesh, rind, dome };
  }, []);
  useEffect(
    () => () => {
      [res.half.dome, res.half.face, res.slice.face, res.slice.rind].forEach((g) => g.dispose());
      [res.flesh.material, res.rind.material, res.dome.material].forEach((m) => m.dispose());
      res.rind.material.normalMap?.dispose();
      res.dome.material.normalMap?.dispose();
    },
    [res],
  );
  const { bind, value: hover } = useHoverRim(() => [res.flesh.uniforms!, res.rind.uniforms!, res.dome.uniforms!], 'citrus', 1.6);
  useFrame(({ clock }) => {
    const a = pose(scrollState.smooth);
    const g = ref.current;
    if (!g) return;
    const k = a.serum;
    g.visible = k > 0.001 || warm.on;
    const s = 0.4 + 0.6 * easeOutCubic(k);
    g.position.set(SERUM_POS.x, SERUM_POS.y - 3.4 * (1 - a.plinth) + (1 - k) * 0.5, SERUM_POS.z);
    g.scale.setScalar(s * (1 + 0.05 * hover.current));
    g.rotation.y = -0.35 + (1 - k) * 1.2 + Math.sin(clock.elapsedTime * 0.3) * 0.03;
  });
  return (
    <group ref={ref} {...steadyHover(bind)}>
      {/* half resting on its dome, cut face tipped toward the camera */}
      <group position-y={0.3} rotation={[0.55, 0, 0.12]}>
        <mesh geometry={res.half.face} material={res.flesh.material} />
        <mesh geometry={res.half.dome} material={res.dome.material} />
      </group>
      {/* wheel leaning against the half */}
      <group position={[0.34, 0.255, -0.2]} rotation={[1.25, 0.2, -0.38]}>
        <mesh geometry={res.slice.face} material={res.flesh.material} />
        <mesh geometry={res.slice.rind} material={res.rind.material} />
      </group>
    </group>
  );
}
