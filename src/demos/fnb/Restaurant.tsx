/**
 * Scene B — Restaurant. Forged fork + spaghetti twirl drop in over an empty plate (burgundy), the pasta unwinds into
 * a floating rope-helix with prawns / mussels / cherry tomatoes / basil orbiting it (callouts), then everything falls
 * into a plated nest with a glossy sauce pool. Spaghetti is ONE geometry morphed in the vertex shader
 * (twirl → helix → nest).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { addRim, useHoverRim, type RimUniforms } from '../../lib/rim';
import { bridge } from '../../lib/bridge';
import { easeOutCubic, lerp, smoothstep } from '../../lib/math';
import {
  PASTA_GLSL_HEAD,
  PASTA_GLSL_NORMAL,
  PASTA_GLSL_POS,
  makeBasilGeometry,
  makeForkGeometry,
  makeMusselBeardGeometry,
  makeMusselMeatGeometry,
  makeMusselShellGeometry,
  makePastaGeometry,
  makePlateGeometry,
  makeSauceGeometry,
  makeSaucePoolGeometry,
  makeShadowTexture,
  makeShrimpGeometry,
  makeTomatoGeometry,
} from './geometry';
import { CALLOUTS, callouts } from './callouts';
import { glazeRim, hoverResets } from './hover';
import { PLATE_FLOOR, PLATE_Y, TWIRL_POS, TWIRL_S, forkOut, helixRot, labelsOn, pastaIn, pastaNest, pastaUnwind, plateIn } from './timeline';

type Kind = 'shrimp' | 'mussel' | 'tomato' | 'basil';
interface Ing {
  kind: Kind;
  /** position on the helix (0..1 along its height) and how far outside the pasta rope it floats */
  u: number;
  out: number;
  /** final plated position + rotation */
  plate: [number, number, number];
  rot: [number, number, number];
  scale: number;
  /** sits on the fork twirl in the hero moment */
  onTwirl?: [number, number, number];
}

const F = PLATE_FLOOR;
const INGREDIENTS: Ing[] = [
  { kind: 'shrimp', u: 0.21, out: 0.5, plate: [0.1, F + 0.3, 0.06], rot: [0.3, 0.6, -0.2], scale: 0.95, onTwirl: [0.04, 0.17, 0.05] },
  { kind: 'shrimp', u: 0.58, out: 0.48, plate: [-0.22, F + 0.24, 0.16], rot: [0.2, 2.4, 0.1], scale: 0.9 },
  { kind: 'shrimp', u: 0.89, out: 0.44, plate: [0.06, F + 0.22, -0.26], rot: [-0.2, 4.2, 0.2], scale: 0.9 },
  { kind: 'mussel', u: 0.36, out: 0.52, plate: [0.5, F + 0.07, 0.14], rot: [0, 0.4, 0], scale: 1.1 },
  { kind: 'mussel', u: 0.74, out: 0.5, plate: [-0.46, F + 0.07, 0.28], rot: [0, 2.6, 0], scale: 1.05 },
  { kind: 'mussel', u: 0.13, out: 0.54, plate: [-0.12, F + 0.07, -0.54], rot: [0, 4.6, 0], scale: 1.05 },
  { kind: 'tomato', u: 0.51, out: 0.46, plate: [0.4, F + 0.09, -0.32], rot: [0.2, 0, 0.3], scale: 1 },
  { kind: 'tomato', u: 0.28, out: 0.48, plate: [-0.42, F + 0.1, -0.16], rot: [-0.3, 0, 0.1], scale: 0.95 },
  { kind: 'tomato', u: 0.81, out: 0.46, plate: [0.27, F + 0.1, 0.42], rot: [0.1, 0, -0.2], scale: 1 },
  { kind: 'tomato', u: 0.66, out: 0.5, plate: [-0.06, F + 0.33, 0.12], rot: [0.4, 0, 0.2], scale: 0.85 },
  { kind: 'basil', u: 0.96, out: 0.4, plate: [0.02, F + 0.4, -0.04], rot: [0.1, 0.4, 0.15], scale: 1.1, onTwirl: [-0.02, 0.2, -0.02] },
  { kind: 'basil', u: 0.43, out: 0.44, plate: [0.14, F + 0.37, -0.1], rot: [0.2, 2.0, -0.1], scale: 0.95 },
  { kind: 'basil', u: 0.06, out: 0.42, plate: [-0.1, F + 0.36, 0.02], rot: [-0.15, 3.8, 0.1], scale: 0.9 },
];
/** callout index -> the ONE ingredient it annotates (-1 = the pasta rope); fixed, so labels never hop between instances */
const LABEL_ING = [0, 3, 6, 11, -1];
/** slot order of the labels down a column (re-sorted with hysteresis) */
const order = [0, 1, 2, 3, 4];
/** bounding radius per ingredient kind (world units, before the per-piece scale) */
const RADIUS: Record<Kind, number> = { shrimp: 0.2, mussel: 0.22, tomato: 0.085, basil: 0.12 };
/** oil beads on the sauce pool (pool-local, pool is scaled ×0.36 in x/z) */
const OIL: [number, number, number][] = [
  [0.62, 0.35, 0.5],
  [-0.7, 0.2, 0.35],
  [0.3, -0.75, 0.42],
  [-0.35, -0.6, 0.3],
  [0.82, -0.2, 0.28],
];
const hiddenFor = [0, 0, 0, 0, 0];

/** sauce droplets glazing the top of the nest */
const DROPS: [number, number, number, number][] = [
  [0.08, 0.12, 0.08, 0.7],
  [-0.24, 0.14, 0.06, 0.65],
  [0.3, 0.1, 0.05, 0.6],
  [0.12, -0.3, 0.06, 0.7],
  [0.16, 0.02, 0.05, 1],
  [-0.12, 0.08, 0.06, 0.8],
  [0.04, -0.17, 0.07, 0.9],
  [-0.2, -0.06, 0.1, 0.7],
  [0.26, -0.12, 0.12, 0.6],
  [-0.05, 0.24, 0.11, 0.75],
];

type Binds = Record<'shrimp' | 'mussel' | 'tomato', { onPointerOver: (e: ThreeEvent<PointerEvent>) => void; onPointerMove: (e: ThreeEvent<PointerEvent>) => void; onPointerOut: () => void }>;

/* ───────── ingredient meshes ───────── */
function IngredientMesh({ kind, mats, geos, binds }: { kind: Kind; mats: Mats; geos: Geos; binds: Binds }) {
  if (kind === 'shrimp') return <mesh geometry={geos.shrimp} material={mats.shrimp.material} {...binds.shrimp} />;
  if (kind === 'tomato') return <mesh geometry={geos.tomato} material={mats.tomato.material} {...binds.tomato} />;
  if (kind === 'basil') return <mesh geometry={geos.basil} material={mats.basil} position={[-0.1, 0, 0]} />;
  // mussel: two valves hinged at -x, opened ~45°, meat inside the lower one
  return (
    <group {...binds.mussel}>
      <group position={[-0.17, 0, 0]}>
        <group position={[0.17, 0, 0]} rotation={[Math.PI, 0, 0]}>
          <mesh geometry={geos.shell} material={mats.shellOut.material} />
          <mesh geometry={geos.shell} material={mats.shellIn} />
        </group>
        <mesh geometry={geos.meat} material={mats.meat} position={[0.18, 0.006, 0]} />
        <mesh geometry={geos.beard} material={mats.beard} position={[0.17, 0, 0]} />
        <group rotation={[0, 0, 0.8]}>
          <group position={[0.17, 0, 0]}>
            <mesh geometry={geos.shell} material={mats.shellOut.material} />
            <mesh geometry={geos.shell} material={mats.shellIn} />
          </group>
        </group>
      </group>
    </group>
  );
}

type Geos = ReturnType<typeof buildGeos>;
type Mats = ReturnType<typeof buildMats>;
function buildGeos() {
  return {
    plate: makePlateGeometry(),
    fork: makeForkGeometry(),
    pasta: makePastaGeometry(),
    shrimp: makeShrimpGeometry(),
    shell: makeMusselShellGeometry(),
    meat: makeMusselMeatGeometry(),
    tomato: makeTomatoGeometry(),
    basil: makeBasilGeometry(),
    sauce: makeSauceGeometry(),
    pool: makeSaucePoolGeometry(),
    beard: makeMusselBeardGeometry(),
    fleck: new THREE.PlaneGeometry(0.018, 0.011),
    drop: new THREE.SphereGeometry(0.03, 16, 10),
    disc: new THREE.CircleGeometry(1, 48),
  };
}
const warm = (m: THREE.MeshPhysicalMaterial, c: string) => {
  m.emissive.set(c);
  m.emissiveIntensity = 0;
  return m;
};
function buildMats() {
  const shadow = makeShadowTexture();
  return {
    shadowTex: shadow,
    fork: new THREE.MeshPhysicalMaterial({ color: '#f2f3f5', metalness: 0.72, roughness: 0.22, clearcoat: 0.3, envMapIntensity: 1.6 }),
    shrimp: addRim(warm(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.3, sheen: 0.5, sheenColor: new THREE.Color('#ffd2b0') }), '#ff9a62'), { color: '#ffe0c4', power: 2 }),
    shellOut: addRim(
      warm(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.28, sheen: 0.45, sheenRoughness: 0.5, sheenColor: new THREE.Color('#4a5a7a'), envMapIntensity: 0.7, side: THREE.FrontSide }), '#6a6f8a'),
      { color: '#c9d4ff', power: 2 },
    ),
    shellIn: new THREE.MeshPhysicalMaterial({ color: '#c3bdcd', roughness: 0.2, metalness: 0.35, side: THREE.BackSide }),
    meat: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.2 }),
    beard: new THREE.MeshStandardMaterial({ color: '#4a3b22', roughness: 0.8 }),
    pool: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.3, sheen: 0.35, sheenColor: new THREE.Color('#ff9a50') }),
    oil: new THREE.MeshPhysicalMaterial({ color: '#e8a050', roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.7, depthWrite: false }),
    fleck: new THREE.MeshStandardMaterial({ color: '#3f7a2a', roughness: 0.6, side: THREE.DoubleSide }),
    tomato: addRim(warm(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }), '#ff5a3a'), { color: '#ffd0c0', power: 2 }),
    basil: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide, sheen: 0.6, sheenColor: new THREE.Color('#bfe39a') }),
    sauce: new THREE.MeshPhysicalMaterial({ color: '#9f1d13', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 1, envMapIntensity: 1.6 }),
    shadow: new THREE.MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false, color: '#3a1a10', opacity: 0.6 }),
  };
}

function makePastaMaterial() {
  const base = warm(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.65, clearcoatRoughness: 0.16 }), '#ffb066');
  const { material, uniforms } = addRim(base, { color: '#ffe3bf', power: 2 });
  const pu = {
    uA: { value: 0 },
    uB: { value: 0 },
    uRot: { value: 0 },
    uThick: { value: 0.0085 },
    uPlateY: { value: PLATE_FLOOR },
    uTwirlPos: { value: TWIRL_POS.clone() },
    uTwirlS: { value: TWIRL_S },
  };
  const rimCompile = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    rimCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, pu);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + PASTA_GLSL_HEAD)
      .replace('#include <beginnormal_vertex>', PASTA_GLSL_NORMAL)
      .replace('#include <begin_vertex>', PASTA_GLSL_POS);
  };
  material.customProgramCacheKey = () => 'fnb-pasta-rim-v2';
  return { material, uniforms, pu };
}

/** Per-part hover: Fresnel rim + a warm emissive lift, only while the restaurant is on screen. */
function usePartHover(id: string, uniforms: RimUniforms[], mats: THREE.MeshStandardMaterial[], max = 1.5, lift = 0.22, glaze = false) {
  const h = useHoverRim(() => uniforms, id, max);
  useFrame(() => {
    if (glaze) glazeRim(mats[0] as THREE.MeshPhysicalMaterial, uniforms[0], h.value.current, lift);
    else for (const m of mats) m.emissiveIntensity = h.value.current * lift;
  });
  const over = h.bind.onPointerOver;
  const out = h.bind.onPointerOut;
  useEffect(() => {
    hoverResets.add(out);
    return () => void hoverResets.delete(out);
  }, [out]);
  return useMemo(
    () => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        if (scrollState.smooth > 0.47) over(e);
      },
      // re-arm: after a global clear (drag release / scroll) R3F still thinks we are hovered and sends no new
      // pointerover, so any pointer move over the object lights it again
      onPointerMove: (e: ThreeEvent<PointerEvent>) => {
        if (e.pointerType !== 'touch' && scrollState.smooth > 0.47) over(e);
      },
      onPointerOut: out,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

const axisPoint = (u: number, rot: number, out: THREE.Vector3) => {
  const phi = rot + u * Math.PI * 3;
  const R = 0.6 - 0.14 * u;
  return out.set(Math.cos(phi) * R, -0.44 + u * 2.11, Math.sin(phi) * R);
};

/* ───────── scene ───────── */
export function Restaurant({ plateGlaze, plateU }: { plateGlaze: THREE.MeshPhysicalMaterial; plateU: RimUniforms }) {
  const root = useRef<THREE.Group>(null);
  const plate = useRef<THREE.Group>(null);
  const fork = useRef<THREE.Mesh>(null);
  const pastaMesh = useRef<THREE.Mesh>(null);
  const sauce = useRef<THREE.Mesh>(null);
  const pool = useRef<THREE.Mesh>(null);
  const drops = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const ingRefs = useRef<(THREE.Group | null)[]>([]);

  const geos = useMemo(buildGeos, []);
  const mats = useMemo(buildMats, []);
  const pasta = useMemo(makePastaMaterial, []);

  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
      mats.shadowTex.dispose();
      [mats.fork, mats.shrimp.material, mats.shellOut.material, mats.shellIn, mats.meat, mats.beard, mats.pool, mats.oil, mats.fleck, mats.tomato.material, mats.basil, mats.sauce, mats.shadow].forEach((m) => m.dispose());
      pasta.material.dispose();
    },
    [geos, mats, pasta],
  );
  useEffect(() => {
    bridge.registerMaterial('plate', plateGlaze, plateU.uRim);
    bridge.registerMaterial('pasta', pasta.material, pasta.uniforms.uRim);
    return () => {
      bridge.unregisterMaterial('plate');
      bridge.unregisterMaterial('pasta');
    };
  }, [plateGlaze, plateU, pasta]);

  const plateBind = usePartHover('plate', [plateU], [plateGlaze], 0.35, 0.05, true);
  const pastaBind = usePartHover('pasta', [pasta.uniforms], [pasta.material], 0.9, 0.18);
  const binds: Binds = {
    shrimp: usePartHover('shrimp', [mats.shrimp.uniforms], [mats.shrimp.material]),
    mussel: usePartHover('mussel', [mats.shellOut.uniforms], [mats.shellOut.material], 1.1, 0.25),
    tomato: usePartHover('tomato', [mats.tomato.uniforms], [mats.tomato.material]),
  };

  // herb flecks: ~44 tiny parsley/basil specks resting on the nest (static matrices, one draw call)
  const flecks = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = flecks.current;
    if (!m) return;
    const o = new THREE.Object3D();
    let sd = 3;
    const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < m.count; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 0.42;
      const y = PLATE_FLOOR + 0.05 + 0.3 * (1 - Math.pow(r / 0.56, 2)) * 0.8;
      o.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      o.rotation.set(-Math.PI / 2 + (rnd() - 0.5) * 0.8, rnd() * 6.28, rnd() * 6.28);
      o.scale.setScalar(0.6 + rnd() * 0.8);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);

  // compile every restaurant shader up front (hidden objects are skipped by three.js) → no hitch at the hand-off
  const { gl, scene, camera: cam0 } = useThree();
  useEffect(() => {
    const id = window.setTimeout(() => {
      const r = root.current;
      if (!r) return;
      const hidden: THREE.Object3D[] = [];
      r.traverse((o) => {
        if (!o.visible) {
          hidden.push(o);
          o.visible = true;
        }
      });
      try {
        gl.compile(scene, cam0);
      } catch {
        /* compile is an optimisation only */
      }
      hidden.forEach((o) => (o.visible = false));
    }, 400);
    return () => window.clearTimeout(id);
  }, [gl, scene, cam0]);

  const fq = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const occluders = useMemo<THREE.Object3D[]>(() => [], []);
  const hits = useMemo<THREE.Intersection[]>(() => [], []);
  /** is ingredient i visible and in front of (not hidden behind) the pasta rope? */
  const isFront = (i: number, camera: THREE.Camera) => {
    const g = ingRefs.current[i];
    if (!g || !g.visible) return false;
    g.getWorldPosition(fq.a);
    axisPoint(INGREDIENTS[i].u, helixRot(scrollState.smooth), fq.b);
    const dist = fq.a.distanceTo(camera.position);
    if (dist - fq.b.distanceTo(camera.position) >= 0.08) return false; // behind the pasta rope
    // occluded by ANOTHER ingredient (e.g. a mussel in front of the prawn)? ray from the camera to the anchor
    occluders.length = 0;
    for (let k = 0; k < INGREDIENTS.length; k++) {
      const o = ingRefs.current[k];
      if (k !== i && o && o.visible) occluders.push(o);
    }
    fq.b.copy(fq.a).sub(camera.position).normalize();
    ray.set(camera.position, fq.b);
    ray.far = dist - 0.03;
    hits.length = 0;
    ray.intersectObjects(occluders, true, hits);
    return hits.length === 0;
  };

  const helixPos = useMemo(() => INGREDIENTS.map(() => new THREE.Vector3()), []);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(), e: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    const p = scrollState.smooth;
    const t = state.clock.elapsedTime;
    const r = root.current;
    if (!r) return;
    const k = plateIn(p);
    r.visible = k > 0.001 || pastaIn(p) > 0.001;
    if (!r.visible) {
      for (const c of callouts) c.op = 0;
      return;
    }

    // plate rises from below, settling flat; slow turntable in the final frame
    const pl = plate.current!;
    const ke = easeOutCubic(k);
    pl.position.set(0, lerp(-3.4, PLATE_Y, ke), 0);
    pl.rotation.set((1 - ke) * 0.7, (1 - ke) * 1.8 + smoothstep(0.85, 1, p) * 0.35, (1 - ke) * -0.25);
    pl.visible = k > 0.001;
    const sh = shadow.current!;
    sh.visible = k > 0.5;
    (sh.material as THREE.MeshBasicMaterial).opacity = 0.5 * smoothstep(0.5, 1, k) * (0.55 + 0.45 * smoothstep(0.62, 0.75, p));

    // pasta morph uniforms
    const pin = pastaIn(p);
    const a = pastaUnwind(p);
    const b = pastaNest(p);
    const rot = helixRot(p);
    const u = pasta.pu;
    u.uA.value = a;
    u.uB.value = b;
    u.uRot.value = rot;
    u.uThick.value = 0.0085 * pin;
    const drop = 1 - easeOutCubic(pin);
    u.uTwirlPos.value.set(TWIRL_POS.x, TWIRL_POS.y + drop * 2.6, TWIRL_POS.z);
    pastaMesh.current!.visible = pin > 0.001;

    // the hero fork: tines buried in the twirl, handle exiting to the upper right; lifts away as the pasta unwinds
    const fo = forkOut(p);
    const fk = fork.current!;
    fk.visible = pin > 0.001 && fo < 0.999;
    fk.scale.setScalar(1.15);
    fk.position.set(TWIRL_POS.x + 0.84 + fo * 1.8, TWIRL_POS.y + 0.4 + drop * 2.6 + fo * 1.3, TWIRL_POS.z - 0.05);
    fk.rotation.set(0.25, 0.3 + fo * 0.6, -1.15 + fo * 0.3);

    // ingredients: twirl (some) → orbit around the helix rope → plated.
    // Ballet positions are relaxed so no two pieces interpenetrate (centre distance ≥ (r1 + r2) × 1.15).
    for (let i = 0; i < INGREDIENTS.length; i++) {
      const d = INGREDIENTS[i];
      const phi = rot + d.u * Math.PI * 2 * 1.5;
      const R = 0.6 - 0.14 * d.u + d.out;
      const bobY = 0.03 * Math.sin(t * 0.9 + i);
      helixPos[i].set(Math.cos(phi) * R, -0.16 + d.u * 1.8 + bobY, Math.sin(phi) * R);
    }
    for (let it = 0; it < 6; it++) {
      for (let i = 0; i < INGREDIENTS.length; i++) {
        for (let j = i + 1; j < INGREDIENTS.length; j++) {
          const need = (RADIUS[INGREDIENTS[i].kind] * INGREDIENTS[i].scale + RADIUS[INGREDIENTS[j].kind] * INGREDIENTS[j].scale) * 1.6;
          tmp.d.copy(helixPos[j]).sub(helixPos[i]);
          const dd = tmp.d.length();
          if (dd < need) {
            if (dd < 1e-4) tmp.d.set(0, 1, 0);
            tmp.d.setLength((need - dd) * 0.5);
            helixPos[j].add(tmp.d);
            helixPos[i].sub(tmp.d);
          }
        }
      }
    }
    for (let i = 0; i < INGREDIENTS.length; i++) {
      const g = ingRefs.current[i];
      if (!g) continue;
      const d = INGREDIENTS[i];
      tmp.b.copy(helixPos[i]);
      if (d.onTwirl) tmp.a.set(TWIRL_POS.x + d.onTwirl[0] * TWIRL_S, TWIRL_POS.y + d.onTwirl[1] * TWIRL_S + drop * 2.6, TWIRL_POS.z + d.onTwirl[2] * TWIRL_S);
      else tmp.a.copy(TWIRL_POS);
      tmp.c.set(d.plate[0], d.plate[1], d.plate[2]);
      // staggered fall onto the plate
      const fb = smoothstep(0.79 + (i % 5) * 0.012, 0.95 + (i % 5) * 0.008, p);
      g.position.copy(tmp.a).lerp(tmp.b, a).lerp(tmp.c, fb);
      g.position.y += Math.sin(fb * Math.PI) * 0.18;
      const spin = (1 - fb) * a;
      if (d.kind === 'mussel') {
        // mussels keep a believable pose (tilt ≤ ~30°), they only turn around their vertical axis
        g.rotation.set(d.rot[0] + 0.45 * spin * Math.sin(p * 9 + i), lerp(d.rot[1] + spin * (p * 9 + i * 0.7), d.rot[1], fb), d.rot[2] + 0.3 * spin * Math.cos(p * 7 + i));
      } else {
        g.rotation.set(
          lerp(d.rot[0] + spin * (p * 6 + i), d.rot[0], fb),
          lerp(d.rot[1] + spin * (p * 9 + i * 0.7), d.rot[1], fb),
          lerp(d.rot[2] + spin * (p * 4), d.rot[2], fb),
        );
      }
      const vis = d.onTwirl ? pin : smoothstep(0.1, 0.6, a);
      g.scale.setScalar(d.scale * vis * (d.onTwirl ? lerp(1.35, 1, a) : 1));
      g.visible = vis > 0.001;
    }

    // sauce: glossy pool spreads in the well, droplets glaze the nest, dollop crowns it
    const sc = smoothstep(0.9, 0.99, p);
    const sa = sauce.current!;
    sa.visible = sc > 0.001;
    sa.scale.setScalar(sc * 0.7);
    const po = pool.current!;
    const pb = smoothstep(0.25, 0.95, b);
    po.visible = pb > 0.001;
    po.scale.set(0.36 * pb, 1, 0.36 * pb);
    const fl = flecks.current;
    if (fl) fl.visible = sc > 0.35;
    const dg = drops.current!;
    dg.visible = sc > 0.001;
    dg.children.forEach((m, j) => {
      const s = sc * DROPS[j][3];
      m.scale.set(s, s * 0.55, s);
    });

    // callouts — stable by design: every label is tied to ONE fixed ingredient (no per-frame instance switching),
    // fades (damped) when hidden behind the rope, keeps its column side with hysteresis, and keeps its slot order
    // in the column unless anchors clearly swap (> 40 px), so leader lines do not cross or jump.
    const lo = labelsOn(p);
    const { size, camera } = state;
    const mobile = size.width < 600;
    const dt = Math.min(0.05, delta);
    axisPoint(0.5, rot, tmp.e).setX(0).setZ(0).project(camera);
    const cx = (tmp.e.x * 0.5 + 0.5) * size.width;
    let bbMin = Infinity;
    let bbMax = -Infinity;
    if (lo > 0) {
      for (let k2 = 0; k2 <= 10; k2++) {
        axisPoint(k2 / 10, rot, tmp.b).project(camera);
        const sx = (tmp.b.x * 0.5 + 0.5) * size.width;
        bbMin = Math.min(bbMin, sx - size.width * 0.035);
        bbMax = Math.max(bbMax, sx + size.width * 0.035);
      }
      for (let i = 0; i < INGREDIENTS.length; i++) {
        const g = ingRefs.current[i];
        if (!g || !g.visible) continue;
        g.getWorldPosition(tmp.b).project(camera);
        const sx = (tmp.b.x * 0.5 + 0.5) * size.width;
        bbMin = Math.min(bbMin, sx - size.width * 0.03);
        bbMax = Math.max(bbMax, sx + size.width * 0.03);
      }
    }
    for (let n = 0; n < CALLOUTS.length; n++) {
      const c = callouts[n];
      let target = lo;
      let ii = LABEL_ING[n];
      if (ii < 0) {
        // the rope: anchor on its surface facing the camera
        axisPoint(0.58, rot, tmp.a);
        tmp.d.copy(camera.position).sub(tmp.a).setY(0).normalize().multiplyScalar(0.18);
        tmp.a.add(tmp.d);
      } else {
        const front = lo > 0 && !mobile ? isFront(ii, camera) : true;
        if (!front) {
          // the annotated piece went behind the rope: wait 0.35 s (hysteresis), then hand the label to a
          // visible piece of the same kind (it fades out and back in, no jump)
          hiddenFor[n] += dt;
          if (hiddenFor[n] > 0.35 && c.vis < 0.05) {
            const kind = INGREDIENTS[ii].kind;
            for (let i = 0; i < INGREDIENTS.length; i++) {
              if (i !== ii && INGREDIENTS[i].kind === kind && isFront(i, camera)) {
                LABEL_ING[n] = ii = i;
                hiddenFor[n] = 0;
                break;
              }
            }
          }
        } else hiddenFor[n] = 0;
        const g = ingRefs.current[ii];
        if (!g || !g.visible || (LABEL_ING[n] === ii && hiddenFor[n] === 0 ? !front : !isFront(ii, camera))) target = 0;
        if (g) g.getWorldPosition(tmp.a);
      }
      if (mobile) target = lo; // phones: chip row, always listed
      c.vis = lo <= 0 ? 0 : THREE.MathUtils.damp(c.vis, target, 7, dt);
      c.op = c.vis;
      tmp.a.project(camera);
      if (tmp.a.z > 1) c.op = 0;
      c.x = (tmp.a.x * 0.5 + 0.5) * size.width;
      c.y = (-tmp.a.y * 0.5 + 0.5) * size.height;
      // sticky side (hysteresis 40 px around the helix centre)
      if (c.x > cx + 40) c.side = 1;
      else if (c.x < cx - 40) c.side = -1;
    }
    const TW = mobile ? 92 : 170;
    const gap = mobile ? 30 : 50;
    const roomR = size.width - 70 - (bbMax + 24);
    const roomL = bbMin - 24 - 14;
    for (const c of callouts) {
      let sd = c.side;
      if (sd > 0 && roomR < TW) sd = roomL >= TW || roomL > roomR ? -1 : 1;
      if (sd < 0 && roomL < TW) sd = roomR >= TW || roomR > roomL ? 1 : -1;
      c.col = sd;
      c.tx = sd > 0 ? Math.min(bbMax + 24, size.width - 70 - TW) : Math.max(bbMin - 24, 14 + TW);
      // very long leaders stay faint so they never dominate the helix
      c.lineK = Math.abs(c.tx - c.x) > size.width * 0.45 ? 0.3 : 1;
    }
    // slot order per column with hysteresis (one bubble pass, swap only on a clear 40 px inversion)
    for (let j = 0; j < order.length - 1; j++) {
      const A = callouts[order[j]];
      const B2 = callouts[order[j + 1]];
      if (A.y > B2.y + 10) {
        const t2 = order[j];
        order[j] = order[j + 1];
        order[j + 1] = t2;
      }
    }
    for (const sd of [1, -1]) {
      let prev = -Infinity;
      for (let j = 0; j < order.length; j++) {
        const c = callouts[order[j]];
        if (c.col !== sd || c.op < 0.05) continue;
        const floor = mobile ? 200 : sd < 0 && c.tx - TW < 520 ? 330 : 90;
        c.ty = Math.max(c.y, prev + gap, floor);
        prev = c.ty;
      }
      let limit = size.height - (mobile ? 150 : 120);
      for (let j = order.length - 1; j >= 0; j--) {
        const c = callouts[order[j]];
        if (c.col !== sd || c.op < 0.05) continue;
        if (c.ty > limit) c.ty = limit;
        limit = c.ty - gap;
      }
    }
  });

  return (
    <group ref={root}>
      <group ref={plate}>
        <mesh geometry={geos.plate} material={plateGlaze} {...plateBind} />
        <mesh ref={pool} geometry={geos.pool} material={mats.pool} position={[0.02, 0.044, 0.03]}>
          {/* a few beads of olive oil floating on the sauce */}
          {OIL.map(([x, z, s2], j) => (
            <mesh key={j} geometry={geos.drop} material={mats.oil} position={[x, 0.044, z]} scale={[s2, 0.06, s2]} />
          ))}
        </mesh>
      </group>
      <mesh ref={shadow} geometry={geos.disc} material={mats.shadow} position={[0.08, PLATE_Y - 0.03, 0.06]} rotation={[-Math.PI / 2, 0, 0]} scale={1.45} renderOrder={-1} />
      <mesh ref={pastaMesh} geometry={geos.pasta} material={pasta.material} frustumCulled={false} {...pastaBind} />
      <mesh ref={sauce} geometry={geos.sauce} material={mats.sauce} position={[0.02, PLATE_FLOOR + 0.27, 0.0]} />
      <group ref={drops}>
        {DROPS.map(([x, z, h], j) => {
          const rr = Math.hypot(x, z);
          const y = PLATE_FLOOR + 0.035 + 0.3 * (1 - Math.pow(Math.min(1, rr / 0.56), 2)) * 0.82 + h * 0.15;
          return <mesh key={j} geometry={geos.drop} material={mats.sauce} position={[x, y, z]} scale={[1, 0.55, 1]} />;
        })}
      </group>
      <instancedMesh ref={flecks} args={[geos.fleck, mats.fleck, 44]} frustumCulled={false} />
      <mesh ref={fork} geometry={geos.fork} material={mats.fork} />
      {INGREDIENTS.map((d, i) => (
        <group key={i} ref={(el) => void (ingRefs.current[i] = el)}>
          <IngredientMesh kind={d.kind} mats={mats} geos={geos} binds={binds} />
        </group>
      ))}
    </group>
  );
}
