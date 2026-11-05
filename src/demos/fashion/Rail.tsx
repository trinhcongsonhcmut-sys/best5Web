/**
 * Faint garment rail behind the hero (mechanic from reference E1): the other colourways hang on a bar, turned
 * away coverflow-style by their distance to the centre, washed into the backdrop colour (atmospheric, not sharp).
 * The rail lifts out of frame as the shoot starts (pure function of scroll → reverse restores it).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { orbit } from '../../lib/CameraRig';
import { smoothstep } from '../../lib/math';
import { buildLowJacket } from './geometry';
import { COLOURWAYS } from './palette';
import { world } from './state';

// two pieces only — the hero must stay the single focal point
const SLOTS = [
  { x: -3.7, rot: 1.05 },
  { x: 3.7, rot: -1.05 },
];
const Z = -7.5;
const BAR_Y = 1.25;

export function Rail() {
  const geo = useMemo(() => buildLowJacket(), []);
  const mats = useMemo(
    () => SLOTS.map(() => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, fog: false, envMapIntensity: 0.35 })),
    [],
  );
  const bar = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.6, fog: false }), []);
  const hook = useMemo(() => {
    const c = new THREE.CurvePath<THREE.Vector3>();
    c.add(new THREE.LineCurve3(new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0, 0.82, 0)));
    const arc = new THREE.EllipseCurve(0, 0.87, 0.05, 0.05, -Math.PI / 2, Math.PI * 0.9, false, 0);
    const pts = arc.getPoints(16).map((p) => new THREE.Vector3(p.x, p.y, 0));
    c.add(new THREE.CatmullRomCurve3(pts));
    const tube = new THREE.TubeGeometry(c, 40, 0.008, 6, false);
    const shoulders = new THREE.TorusGeometry(0.3, 0.012, 6, 32, Math.PI * 0.62);
    shoulders.rotateZ(Math.PI * 0.19);
    shoulders.translate(0, 0.3, 0);
    return { tube, shoulders };
  }, []);
  const root = useRef<THREE.Group>(null);
  const items = useRef<(THREE.Group | null)[]>([]);
  const tmp = useMemo(() => new THREE.Color(), []);
  const mid = useMemo(() => new THREE.Color(), []);

  useEffect(
    () => () => {
      geo.dispose();
      mats.forEach((m) => m.dispose());
      bar.dispose();
      hook.tube.dispose();
      hook.shoulders.dispose();
    },
    [geo, mats, bar, hook],
  );

  const size = useThree((s) => s.size);
  const portrait = size.width / Math.max(1, size.height) < 0.9;

  const lift = useRef(0);
  useFrame((state, delta) => {
    const p = scrollState.smooth;
    const g = root.current;
    if (!g) return;
    // the rail is a backdrop for the front hero shot only: when the viewer orbits away it lifts out of frame
    // (so it never slices across the copy at high/low angles)
    const yawW = Math.abs(((orbit.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
    const orbitAway = Math.max(smoothstep(0.12, 0.3, Math.abs(orbit.pitch)), smoothstep(0.3, 0.6, yawW));
    lift.current += (orbitAway - lift.current) * Math.min(1, delta * 6);
    const out = Math.max(smoothstep(0.02, 0.2, p), lift.current);
    g.visible = !portrait && out < 0.999;
    g.position.set(-out * 3, out * 5.5, 0);
    mid.copy(world.cur.bgIn).lerp(world.cur.bgOut, 0.3);
    bar.color.copy(mid).multiplyScalar(0.8);
    SLOTS.forEach((_, i) => {
      // tonal silhouettes of the rack, a hint of the next colourways, washed into the world → atmospheric depth
      const cw = COLOURWAYS[(world.index + 1 + i) % COLOURWAYS.length];
      tmp.set(cw.shell).lerp(mid, 0.92).multiplyScalar(0.86);
      mats[i].color.copy(tmp);
      mats[i].emissive.copy(mid).multiplyScalar(0.3);
      const it = items.current[i];
      if (it) it.rotation.y = SLOTS[i].rot + Math.sin(state.clock.elapsedTime * 0.6 + i * 1.7) * 0.06;
    });
  });

  return (
    <group ref={root}>
      <mesh material={bar} position={[0, BAR_Y, Z]} rotation-z={Math.PI / 2} raycast={() => null}>
        <cylinderGeometry args={[0.013, 0.013, 14, 8]} />
      </mesh>
      {SLOTS.map((s, i) => (
        <group key={i} ref={(el) => { items.current[i] = el; }} position={[s.x, BAR_Y - 0.92, Z]} rotation-y={s.rot}>
          <mesh geometry={geo} material={mats[i]} raycast={() => null} />
          <mesh geometry={hook.tube} material={bar} position={[0, 0.03, -0.01]} raycast={() => null} />
          <mesh geometry={hook.shoulders} material={bar} position={[0, 0.25, -0.01]} raycast={() => null} />
        </group>
      ))}
    </group>
  );
}
