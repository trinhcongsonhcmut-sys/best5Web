/**
 * Final still-life: matte pastel plinth rising into frame + a dropper serum bottle (secondary object).
 * The serum glass is NOT transmissive (keeps the scene at one transmission layer): clear-coated tinted shell
 * with depth-sorted liquid + glass pipette inside.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { easeOutCubic } from '../../lib/math';
import { pose } from './anim';
import { look } from './palette';
import { warm, steadyHover } from './rig';
import { addRim, useHoverRim } from '../../lib/rim';
import { JS } from './rig';
import { plinthGeometry, plinthTopGeometry, serumBulbGeometry, serumCollarGeometry, serumGlassGeometry, serumLiquidGeometry } from './geometry';

export const PLINTH_X = 0.42;
export const SERUM_POS = new THREE.Vector3(1.08, 0, -0.3);
const WHITE = new THREE.Color('#ffffff');

/** Two-tier pastel plinth: soft-touch base, foil inlay ring, lighter satin top slab (jar + serum stand on it). */
export function Plinth() {
  const ref = useRef<THREE.Group>(null);
  const res = useMemo(() => {
    const geos = { base: plinthGeometry(1.42, 0.4), top: plinthTopGeometry(1.3), ring: new THREE.TorusGeometry(1.36, 0.009, 8, 160) };
    const mats = {
      base: new THREE.MeshPhysicalMaterial({ color: look.plinth.clone(), roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.9 }),
      top: new THREE.MeshPhysicalMaterial({ color: look.plinth.clone(), roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 1.1 }),
      ring: new THREE.MeshStandardMaterial({ color: look.foil.clone(), metalness: 0.9, roughness: 0.25 }),
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
    res.mats.base.color.copy(look.plinth).multiplyScalar(0.94);
    res.mats.top.color.copy(look.plinth).lerp(WHITE, 0.35);
    res.mats.ring.color.copy(look.foil);
  });
  return (
    <group ref={ref}>
      <mesh geometry={res.geos.base} material={res.mats.base} position-y={-0.062} raycast={() => null} />
      <mesh geometry={res.geos.ring} material={res.mats.ring} position-y={-0.062} rotation-x={Math.PI / 2} raycast={() => null} />
      <mesh geometry={res.geos.top} material={res.mats.top} position-y={-0.062} raycast={() => null} />
    </group>
  );
}

export function Serum() {
  const ref = useRef<THREE.Group>(null);
  const res = useMemo(() => {
    const geos = {
      glass: serumGlassGeometry(),
      liquid: serumLiquidGeometry(),
      collar: serumCollarGeometry(),
      bulb: serumBulbGeometry(),
      pipette: new THREE.CylinderGeometry(0.018, 0.012, 0.62, 16, 1, false),
    };
    const mats = {
      glass: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.32, depthWrite: false, envMapIntensity: 1.8, side: THREE.DoubleSide }),
      liquid: new THREE.MeshPhysicalMaterial({ color: look.serum.clone(), roughness: 0.18, clearcoat: 0.6, transparent: true, opacity: 0.82, depthWrite: false, emissive: look.serum.clone(), emissiveIntensity: 0.18 }),
      collar: new THREE.MeshStandardMaterial({ color: look.foil.clone(), metalness: 0.9, roughness: 0.24 }),
      bulb: new THREE.MeshPhysicalMaterial({ color: look.cap.clone(), roughness: 0.55, clearcoat: 0.2 }),
      pipette: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false, clearcoat: 1 }),
    };
    const rims = [addRim(mats.glass, { color: '#ffffff', power: 2 }).uniforms, addRim(mats.bulb, { color: '#ffffff', power: 2.2 }).uniforms, addRim(mats.collar, { color: '#fff3d6', power: 2 }).uniforms];
    return { geos, mats, rims };
  }, []);
  useEffect(
    () => () => {
      Object.values(res.geos).forEach((g) => g.dispose());
      Object.values(res.mats).forEach((m) => m.dispose());
    },
    [res],
  );
  const { bind, value: hover } = useHoverRim(() => res.rims, 'serum', 1.8);
  useFrame(({ clock }) => {
    const a = pose(scrollState.smooth);
    const g = ref.current;
    if (!g) return;
    const k = a.serum;
    g.visible = k > 0.001 || warm.on;
    const s = 0.4 + 0.6 * easeOutCubic(k);
    g.position.set(SERUM_POS.x, SERUM_POS.y - 3.4 * (1 - a.plinth) + (1 - k) * 0.5, SERUM_POS.z);
    g.scale.setScalar(s * 1.35 * JS * (1 + 0.05 * hover.current));
    g.rotation.y = -0.5 + (1 - k) * 1.2 + Math.sin(clock.elapsedTime * 0.3) * 0.03;
    res.mats.liquid.color.copy(look.serum);
    res.mats.liquid.emissive.copy(look.serum);
    res.mats.liquid.emissiveIntensity = 0.18 + 0.4 * hover.current;
    res.mats.collar.color.copy(look.foil);
    res.mats.bulb.color.copy(look.cap);
  });
  return (
    <group ref={ref} {...steadyHover(bind)}>
      <mesh geometry={res.geos.liquid} material={res.mats.liquid} renderOrder={3} />
      <mesh geometry={res.geos.pipette} material={res.mats.pipette} position-y={0.4} renderOrder={4} />
      <mesh geometry={res.geos.glass} material={res.mats.glass} renderOrder={5} />
      <mesh geometry={res.geos.collar} material={res.mats.collar} />
      <mesh geometry={res.geos.bulb} material={res.mats.bulb} />
    </group>
  );
}
