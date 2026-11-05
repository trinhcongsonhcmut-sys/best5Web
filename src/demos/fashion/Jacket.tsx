/**
 * The hero garment: CUMULUS 01 puffer (procedural, see geometry.ts). Owns its materials, hover rim + sheen boost,
 * pointer tilt, scroll turntable and the colourway swap move (fly out / fly in from the next-look preview, with a
 * noise dissolve on every jacket material — see state.ts for the shared timeline).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bridge } from '../../lib/bridge';
import { useHoverRim } from '../../lib/rim';
import { scrollState } from '../../lib/scroll';
import { damp, easeInOutCubic, range, smoothstep } from '../../lib/math';
import { buildJacket, buildLowJacket, pullGeometry, sliderGeometry, zipTape, zipTeeth } from './geometry';
import { addDissolve, createRibMaterial, createShellMaterial, dissolve, dissolveInner } from './materials';
import { backPrintTexture, chestPatchTexture, sleeveTabTexture } from './textures';
import { COLOURWAYS } from './palette';
import { palC } from './colours';
import { FLY_LAND, FLY_START, MID, world } from './state';

/** turntable as a pure function of scroll progress (reverse scroll restores exactly) */
export function jacketYaw(p: number) {
  return (
    -0.16 * (1 - easeInOutCubic(range(0, 0.25, p))) +
    Math.PI * easeInOutCubic(range(0.28, 0.5, p)) +
    (Math.PI + 0.25) * easeInOutCubic(range(0.53, 0.72, p)) +
    (Math.PI - 0.95) * easeInOutCubic(range(0.8, 0.98, p))
  );
}

const SLIDER_K = 0.982;

export function Jacket() {
  const geo = useMemo(() => buildJacket(), []);
  const proxy = useMemo(() => buildLowJacket(), []);
  const shell = useMemo(() => createShellMaterial(), []);
  const rib = useMemo(() => createRibMaterial(), []);

  const aux = useMemo(() => {
    // lining / inner caps are a deep tone of the shell (no black voids when orbiting into the collar or hem)
    const lining = new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.8, side: THREE.BackSide });
    const cap = new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.85, side: THREE.DoubleSide });
    const hole = new THREE.MeshStandardMaterial({ color: '#2a1d16', roughness: 0.9, side: THREE.DoubleSide });
    const metal = new THREE.MeshStandardMaterial({ color: '#5b5d60', metalness: 0.9, roughness: 0.28 });
    const teeth = new THREE.MeshStandardMaterial({ color: '#3a3b3e', metalness: 0.8, roughness: 0.38 });
    const tape = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.75, side: THREE.DoubleSide });
    const welt = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.5, metalness: 0.15, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
    const patch = new THREE.MeshStandardMaterial({ map: chestPatchTexture(), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
    const print = new THREE.MeshStandardMaterial({ map: backPrintTexture(), transparent: true, roughness: 0.32, metalness: 0.0, color: '#f4f1ec', polygonOffset: true, polygonOffsetFactor: -2 });
    const tab = new THREE.MeshStandardMaterial({ map: sleeveTabTexture(), transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 });
    const pick = new THREE.MeshBasicMaterial({ visible: false });
    for (const m of [lining, cap, hole, metal, teeth, tape, welt, patch, print, tab]) {
      m.fog = false;
      addDissolve(m, m === lining || m === cap || m === hole);
    }
    return { lining, cap, hole, metal, teeth, tape, welt, patch, print, tab, pick };
  }, []);

  const hw = useMemo(() => {
    const tapeGeo = zipTape(geo.zip);
    // small, dense, rounded teeth read as an interlocking coil instead of a ladder
    const toothGeo = new THREE.CapsuleGeometry(0.0016, 0.0042, 2, 6);
    toothGeo.rotateZ(Math.PI / 2);
    toothGeo.scale(1, 1, 1.25);
    const all = zipTeeth(geo.zip);
    const n = Math.floor(all.length * SLIDER_K);
    const teeth = new THREE.InstancedMesh(toothGeo, aux.teeth, n);
    for (let i = 0; i < n; i++) teeth.setMatrixAt(i, all[i]);
    teeth.instanceMatrix.needsUpdate = true;
    teeth.raycast = () => null;
    const sp = geo.zip.getPointAt(SLIDER_K);
    const st = geo.zip.getTangentAt(SLIDER_K);
    const pocketTops = geo.pocketTops.map((pt) => {
      // local +y = up the pocket (pull hangs along -y), +z = fabric normal, right-handed basis
      const z = pt.n.clone().normalize();
      const x = new THREE.Vector3().crossVectors(pt.t, z).normalize();
      const y = new THREE.Vector3().crossVectors(z, x).normalize();
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
      return { p: pt.p.clone().addScaledVector(pt.n, 0.002), q };
    });
    const wrist = geo.wristHoles.map((w) => ({ pos: w.pos, quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), w.dir) }));
    const tackGeo = new THREE.CapsuleGeometry(0.0021, 0.013, 2, 6);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const tacks = geo.bartacks.map((b) => {
      const across = new THREE.Vector3().crossVectors(b.t, b.n).normalize();
      return { p: b.p.clone().addScaledVector(b.n, 0.0012), q: new THREE.Quaternion().setFromUnitVectors(yAxis, across) };
    });
    const snapGeo = new THREE.SphereGeometry(0.0088, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    snapGeo.scale(1, 0.42, 1);
    const snapRing = new THREE.TorusGeometry(0.0088, 0.0016, 6, 24);
    snapRing.rotateX(-Math.PI / 2);
    const up = new THREE.Vector3(0, 1, 0);
    const snaps = geo.snaps.map((s) => ({ p: s.p.clone().addScaledVector(s.n, 0.0008), q: new THREE.Quaternion().setFromUnitVectors(up, s.n) }));
    return { tapeGeo, toothGeo, teeth, sp, st, pocketTops, tackGeo, tacks, snapGeo, snapRing, snaps, slider: sliderGeometry(), pull: pullGeometry(), pullSmall: pullGeometry(0.012, 0.03), disc: new THREE.CircleGeometry(0.064, 32), wrist };
  }, [geo, aux]);

  useEffect(
    () => () => {
      [geo.shell, geo.rib, geo.lining, geo.chestPatch, geo.backPrint, geo.sleeveTab, geo.neckCap, ...geo.armholes, ...geo.pockets, proxy].forEach((g) => g.dispose());
      [hw.tapeGeo, hw.toothGeo, hw.tackGeo, hw.snapGeo, hw.snapRing, hw.slider, hw.pull, hw.pullSmall, hw.disc].forEach((g) => g.dispose());
      hw.teeth.dispose();
      shell.material.dispose();
      shell.normalMap.dispose();
      rib.material.dispose();
      Object.values(aux).forEach((m) => {
        (m as THREE.MeshStandardMaterial).map?.dispose();
        m.dispose();
      });
      dissolve.uDissolve.value = 0;
    },
    [geo, proxy, hw, shell, rib, aux],
  );

  useEffect(() => {
    bridge.registerMaterial('primary', shell.material, shell.uniforms.uRim);
    bridge.registerMaterial('rib', rib.material, rib.uniforms.uRim);
    return () => {
      bridge.unregisterMaterial('primary');
      bridge.unregisterMaterial('rib');
    };
  }, [shell, rib]);

  const { bind, value: hover } = useHoverRim(() => [shell.uniforms, rib.uniforms], 'jacket', 1.5);

  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const pullRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const p = scrollState.smooth;
    const cw = COLOURWAYS[world.garment];
    const h = hover.current;
    world.hover = h;

    // dye = the colourway the garment wears at this point of the swap (flips at MID, hidden by the dissolve).
    // Pre-parsed colours: no string parsing / allocation per frame.
    const pc = palC[world.garment];
    shell.material.color.copy(pc.shell);
    shell.material.sheenColor.copy(pc.sheen);
    rib.material.color.copy(pc.rib);
    aux.tape.color.copy(pc.shell).multiplyScalar(0.42);
    aux.welt.color.copy(pc.shell).multiplyScalar(0.36);
    aux.lining.color.copy(pc.shell).multiplyScalar(0.35);
    aux.cap.color.copy(aux.lining.color).multiplyScalar(0.8);
    aux.hole.color.copy(aux.lining.color);
    aux.print.color.copy(pc.print);
    // hover: clearcoat lift + slightly glossier on top of the rim (no shader-variant switch)
    shell.material.roughness = cw.roughness - 0.05 * h;
    shell.material.clearcoat = cw.clearcoat + 0.12 * h;
    shell.uniforms.uRimColor.value.copy(pc.rim);
    rib.uniforms.uRimColor.value.copy(pc.rim);
    // dissolve edge = between the dissolving fabric and its world (never a grey/cream rim)
    dissolve.uDisColor.value.copy(pc.edge);
    shell.extra.uStitch.value = 0.75 + 0.25 * range(0.6, 0.75, p);

    // ── swap move ──
    const sw = world.swap;
    const outK = range(0, MID, sw);
    const inK = range(MID, 1, sw);
    const swapping = sw < 1;
    let dis = 0;
    let ox = 0;
    let oy = 0;
    const oz = 0;
    let s = 1;
    let spin = 0;
    if (swapping) {
      if (sw < MID) {
        dis = smoothstep(0.32, 1, outK);
        if (world.mode === 'fly') {
          // short drift up-left: the outgoing jacket stays near the centre while it burns off, so it overlaps
          // the incoming copy (E2's two-jacket beat) instead of leaving the middle of the frame empty
          const e = outK * outK * outK;
          ox = -0.32 * e;
          oy = 0.2 * e;
          s = 1 - 0.35 * e;
          spin = 0.7 * e;
        }
      } else if (world.mode === 'fly') {
        // the incoming garment is the preview copy (same shell material, same pose): when it lands the hero
        // replaces it in ONE frame — no second dissolve
        dis = sw < FLY_LAND ? 1 : 0;
        s = 0.3 + 0.7 * smoothstep(FLY_START, FLY_LAND, sw); // only drives the landing shadow
      } else {
        dis = 1 - smoothstep(0, 0.55, inK);
      }
    }
    world.dis = dis;
    dissolve.uDissolve.value = dis;
    dissolveInner.uDissolve.value = Math.min(1, dis * 2.2);
    world.scale = s;

    const g = root.current;
    if (g) {
      const bob = Math.sin(t * 1.5) * 0.022;
      const restYaw = jacketYaw(p) + Math.sin(t * 0.45) * 0.05 * (1 - range(0.6, 0.75, p) * (1 - range(0.75, 0.8, p)));
      g.position.set(ox, 0.05 + bob + oy, oz);
      g.rotation.y = restYaw + spin;
      g.rotation.z = Math.sin(t * 0.7) * 0.012;
      g.scale.setScalar(sw < MID ? s : 1);
      world.heroPos.set(0, 0.05 + bob, 0);
      world.heroRotY = restYaw;
      world.heroRotZ = g.rotation.z;
      world.anchor.set(0, 0.05 + bob, 0);
    }
    const tl = tilt.current;
    if (tl) {
      tl.rotation.x = damp(tl.rotation.x, -state.pointer.y * 0.1 * h, 6, dt);
      tl.rotation.y = damp(tl.rotation.y, state.pointer.x * 0.16 * h, 6, dt);
    }
    if (pullRef.current) pullRef.current.rotation.x = -0.22 + Math.sin(t * 1.5 + 0.6) * 0.05;
  });

  const sp = hw.sp;
  return (
    <group ref={root}>
      <group ref={tilt}>
        {/* invisible low-poly hit proxy: cheap pointer picking for hover */}
        <mesh geometry={proxy} material={aux.pick} {...bind} scale={1.03} />
        <mesh geometry={geo.shell} material={shell.material} raycast={() => null} />
        <mesh geometry={geo.rib} material={rib.material} raycast={() => null} />
        <mesh geometry={geo.lining} material={aux.lining} raycast={() => null} />
        <mesh geometry={geo.neckCap} material={aux.cap} raycast={() => null} />
        {geo.armholes.map((a, i) => (
          <mesh key={i} geometry={a} material={aux.welt} raycast={() => null} />
        ))}
        {hw.wrist.map((w, i) => (
          <mesh key={i} geometry={hw.disc} material={aux.hole} position={w.pos} quaternion={w.quat} raycast={() => null} />
        ))}
        {/* zip: tapes, teeth, slider, pull */}
        <mesh geometry={hw.tapeGeo} material={aux.tape} raycast={() => null} />
        <primitive object={hw.teeth} />
        <group position={[sp.x, sp.y - 0.004, sp.z + 0.0015]} rotation-x={Math.atan2(hw.st.z, hw.st.y)}>
          <mesh geometry={hw.slider} material={aux.metal} raycast={() => null} />
          <group ref={pullRef} position={[0, -0.012, 0.011]}>
            <mesh geometry={hw.pull} material={aux.metal} raycast={() => null} />
          </group>
        </group>
        {/* hand pocket welts + small pulls */}
        {geo.pockets.map((g, i) => (
          <mesh key={i} geometry={g} material={aux.welt} raycast={() => null} />
        ))}
        {hw.pocketTops.map((pt, i) => (
          <mesh key={i} geometry={hw.pullSmall} material={aux.metal} position={pt.p} quaternion={pt.q} raycast={() => null} />
        ))}
        {hw.tacks.map((b, i) => (
          <mesh key={`t${i}`} geometry={hw.tackGeo} material={aux.tape} position={b.p} quaternion={b.q} raycast={() => null} />
        ))}
        {hw.snaps.map((s, i) => (
          <group key={i} position={s.p} quaternion={s.q}>
            <mesh geometry={hw.snapGeo} material={aux.metal} raycast={() => null} />
            <mesh geometry={hw.snapRing} material={aux.metal} raycast={() => null} />
          </group>
        ))}
        <mesh geometry={geo.chestPatch} material={aux.patch} raycast={() => null} />
        <mesh geometry={geo.backPrint} material={aux.print} raycast={() => null} />
        <mesh geometry={geo.sleeveTab} material={aux.tab} raycast={() => null} />
      </group>
    </group>
  );
}
