import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DIM, shadowTexture, rimBarrelGeometry, rimFaceGeometry, treadBlockGeometry, tyreGeometry } from './geometry';
import type { TruckMaterials } from './materials';
import { anim } from './anim';

/** Shared wheel geometries (built once for all 4 corners). */
let shared: ReturnType<typeof build> | null = null;
function build() {
  const lug = new THREE.CylinderGeometry(0.012, 0.012, 0.03, 6);
  lug.rotateX(Math.PI / 2);
  const cap = new THREE.CylinderGeometry(0.058, 0.064, 0.03, 24);
  cap.rotateX(Math.PI / 2);
  const badge = new THREE.CylinderGeometry(0.03, 0.03, 0.012, 6);
  badge.rotateX(Math.PI / 2);
  const disc = new THREE.CylinderGeometry(0.205, 0.205, 0.026, 48, 1, false);
  disc.rotateX(Math.PI / 2);
  const hat = new THREE.CylinderGeometry(0.11, 0.11, 0.05, 32);
  hat.rotateX(Math.PI / 2);
  const caliper = new THREE.BoxGeometry(0.15, 0.07, 0.07);
  const spot = new THREE.PlaneGeometry(0.78, 0.5);
  spot.rotateX(-Math.PI / 2);
  const spotMat = new THREE.MeshBasicMaterial({ color: '#1e170f', map: shadowTexture(128, 128, 0.26, 6), transparent: true, depthWrite: false, opacity: 1 });
  return { spot, spotMat, tyre: tyreGeometry(), tread: treadBlockGeometry(), barrel: rimBarrelGeometry(), face: rimFaceGeometry(), lug, cap, badge, disc, hat, caliper };
}
const geo = () => (shared ??= build());

const PER_ROW = 46;

export function Wheel({ side, mats, x }: { side: 1 | -1; mats: TruckMaterials; x: number }) {
  const g = geo();
  const spin = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);
  const tread = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = tread.current;
    if (!m) return;
    const R = DIM.wheelR - 0.012 - 0.004;
    const mtx = new THREE.Matrix4();
    const t = new THREE.Vector3(), ax = new THREE.Vector3(0, 0, 1), r = new THREE.Vector3();
    let i = 0;
    // rows 0/1: staggered centre lugs · rows 2/3: shoulder lugs that wrap onto the sidewall (tilted outward)
    const W = [-0.06, 0.06, -0.13, 0.13];
    const n = new THREE.Vector3(), aa = new THREE.Vector3();
    for (let row = 0; row < 4; row++) {
      const sh = row >= 2;
      const sgn = W[row] > 0 ? 1 : -1;
      for (let k = 0; k < PER_ROW; k++) {
        const a = ((k + (row % 2) * 0.5 + (sh ? 0.25 : 0)) / PER_ROW) * Math.PI * 2;
        r.set(Math.cos(a), Math.sin(a), 0);
        t.set(-Math.sin(a), Math.cos(a), 0);
        const flip = row % 2 === 1 ? -1 : 1;
        const tilt = sh ? 0.55 : 0;
        n.copy(r).multiplyScalar(Math.cos(tilt)).addScaledVector(ax, Math.sin(tilt) * sgn).normalize();
        aa.copy(ax).multiplyScalar(Math.cos(tilt)).addScaledVector(r, -Math.sin(tilt) * sgn).normalize().multiplyScalar(flip);
        mtx.makeBasis(t.clone().multiplyScalar(flip), aa, n);
        const rr = sh ? R - 0.022 : R;
        mtx.setPosition(r.x * rr, r.y * rr, W[row]);
        if (sh) mtx.scale(new THREE.Vector3(1, 0.55, 1));
        m.setMatrixAt(i++, mtx);
      }
    }
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, []);

  const lugs = useMemo(() => Array.from({ length: 6 }, (_, k) => [Math.cos((k / 6) * Math.PI * 2 + 0.26) * 0.075, Math.sin((k / 6) * Math.PI * 2 + 0.26) * 0.075] as const), []);

  useFrame(() => {
    if (spin.current) spin.current.rotation.z = (side * -anim.roll) / DIM.wheelR;
    if (root.current) {
      // exploded: wheel assemblies slide outboard and drop a touch
      root.current.position.z = side * (DIM.trackZ + anim.explode * 0.62);
      root.current.position.y = DIM.wheelR;
    }
  });

  return (
    <group ref={root} position={[x, DIM.wheelR, side * DIM.trackZ]}>
      <mesh geometry={g.spot} material={g.spotMat} position-y={-DIM.wheelR + 0.006} raycast={() => null} renderOrder={2} />
      {/* outer face points to +z locally; the left side is turned around */}
      <group rotation-y={side === 1 ? 0 : Math.PI}>
        <group ref={spin}>
          <mesh geometry={g.tyre} material={mats.tyre} />
          <instancedMesh ref={tread} args={[g.tread, mats.tyre, PER_ROW * 4]} />
          <mesh geometry={g.barrel} material={mats.barrel} />
          <mesh geometry={g.face} material={mats.rim} position-z={0.05} />
          <mesh geometry={g.cap} material={mats.disc} position-z={0.068} />
          <mesh geometry={g.badge} material={mats.caliper} position-z={0.085} />
          {lugs.map(([lx, ly], k) => (
            <mesh key={k} geometry={g.lug} material={mats.disc} position={[lx, ly, 0.074]} />
          ))}
          <mesh geometry={g.disc} material={mats.disc} position-z={-0.005} />
          <mesh geometry={g.hat} material={mats.barrel} position-z={0.02} />
        </group>
        {/* caliper does not rotate with the wheel */}
        <mesh geometry={g.caliper} material={mats.caliper} position={[-0.12 * side, 0.13, 0.012]} rotation-z={-0.85 * side} />
      </group>
    </group>
  );
}
