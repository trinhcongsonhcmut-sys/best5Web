import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { useHoverRim, type RimUniforms } from '../../lib/rim';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import { damp, smoothstep } from '../../lib/math';
import { DIM, box, crown, flareGeometry, plateTexture, linerGeometry, merge, mirrorGeometry, planarUV as planarUV2, wellWallGeometry, wordmarkTexture } from './geometry';
import { FLOOR_Y, NOSE_X, TAIL_X, buildLoft, ringAtX, surfacePatch } from './loft';
import { FINISHES, createMaterials } from './materials';
import { Wheel } from './Wheel';
import { anim } from './anim';
import { FX_LAYER } from './layers';

type Part = 'body' | 'glass' | 'lights' | 'wheels' | 'chassis';
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const noRay = () => null;
/** stand-in event for useHoverRim's over-handler (no propagation stop) */
const NO_STOP = { stopPropagation() {} } as unknown as ThreeEvent<PointerEvent>;

/** Builds every static mesh geometry once. */
function useGeometries() {
  return useMemo(() => {
    const loft = buildLoft();
    const lower = loft.lower; // lower body (sills, doors, arches, nose/tail lower faces)
    const upper = loft.upper; // top shell (hood skin, greenhouse, roof, rear glass slope, bed rails, floor, tailgate face)
    const zF = (x: number) => ringAtX(x)[4][0] + 0.006; // flank surface z (door crown)
    // glazing sampled from the same surface (flush with the body)
    // each pane: glass (crowned normals → a bright-to-dark sky/horizon gradient) over a slightly larger black gasket
    const g: THREE.BufferGeometry[] = [];
    const gk: THREE.BufferGeometry[] = [];
    const pane = (xa: number, xb: number, ch: number[], t0: number, t1: number, nx: number, nt: number) => {
      g.push(surfacePatch(xa, xb, ch, t0, t1, 0.007, nx, nt));
      const dx = Math.sign(xb - xa) * 0.035;
      gk.push(surfacePatch(xa - dx, xb + dx, ch, Math.max(0, t0 - 0.045), Math.min(1, t1 + 0.03), 0.004, nx, nt));
    };
    for (const s of [1, -1]) {
      const ch = [6 * s, 7 * s];
      pane(1.12, 0.06, ch, 0.12, 0.95, 6, 3);
      pane(-0.02, -0.6, ch, 0.12, 0.95, 4, 3);
      pane(-0.7, -1.0, ch, 0.18, 0.86, 3, 2); // quarter glass in the sail
    }
    pane(1.66, 0.48, [7, 8, 9, -8, -7], 0.05, 0.95, 8, 12); // windscreen
    pane(-0.68, -1.06, [8, 9, -8], 0.07, 0.93, 6, 8); // rear glass
    g.push(surfacePatch(0.22, -0.42, [8, 9, -8], 0.2, 0.8, 0.004, 4, 4)); // roof panel
    const glass = crown(merge(g), V(-0.1, 1.55, 0), [0.04, 0.9, 0.25]);
    const gaskets = merge(gk);
    // faint cabin interior behind the tinted glass: dark shell (back faces) + seat backs and headrests
    const cabinShell = box([1.25, 0.62, 1.2], [-0.05, 1.58, 0]);
    const seats = merge([0.16, -0.42].flatMap((x) => [1, -1].flatMap((s) => [
      box([0.1, 0.4, 0.44], [x, 1.47, s * 0.33]),
      box([0.08, 0.15, 0.24], [x - 0.01, 1.74, s * 0.33]),
    ])));

    const liners = merge([linerGeometry(DIM.axleX), linerGeometry(-DIM.axleX), wellWallGeometry(DIM.axleX), wellWallGeometry(-DIM.axleX)]);
    const flareParts: THREE.BufferGeometry[] = [];
    for (const cx of [DIM.axleX, -DIM.axleX]) {
      for (const s of [1, -1]) {
        const f = flareGeometry(cx);
        f.translate(0, 0, s * (zF(cx) - 0.01));
        flareParts.push(f);
      }
    }
    const flares = merge(flareParts);
    // mirrors sit on the door at the A-pillar base (the windscreen base moved forward with the wedge)
    const mirrors = merge([mirrorGeometry(1), mirrorGeometry(-1)]).translate(0.38, -0.04, 0);
    const lens = merge([box([0.006, 0.07, 0.1], [1.094, 1.445, 1.115]), box([0.006, 0.07, 0.1], [1.094, 1.445, -1.115])]).translate(0.38, -0.04, 0);

    // shut lines: dark recess + hair-thin bright lip (gap with depth); flush handles with recess + bar + lip
    const gp: THREE.BufferGeometry[] = [];
    const lip: THREE.BufferGeometry[] = [];
    for (const s of [1, -1]) {
      for (const x of [1.22, 0.06, -0.9, -2.66]) {
        const z = s * zF(x);
        gp.push(box([0.01, 0.33, 0.005], [x, 0.94, z]));
        lip.push(box([0.004, 0.33, 0.005], [x + 0.008, 0.94, z + s * 0.0005]));
      }
      for (const x of [0.62, -0.42]) {
        const z = s * zF(x);
        gp.push(box([0.25, 0.055, 0.004], [x, 1.0, z]));
        lip.push(box([0.25, 0.008, 0.012], [x, 1.031, z + s * 0.003]));
      }
    }
    gp.push(box([0.006, 0.01, 1.7], [TAIL_X - 0.003, FLOOR_Y, 0])); // tailgate shut line
    gp.push(box([0.006, 0.07, 1.74], [TAIL_X - 0.002, 1.27, 0])); // light-bar recess
    gp.push(box([0.006, 0.15, 0.56], [TAIL_X - 0.003, 0.9, 0])); // plate recess
    const gaps = merge(gp);
    const lips = merge(lip);
    const handles = merge([1, -1].flatMap((s) => [0.62, -0.42].map((x) => box([0.19, 0.016, 0.012], [x, 0.995, s * (zF(x) + 0.004)]))));

    // tailgate thickness (the tail cap is the outer skin) + bed floor liner/ribs
    const tailgate = box([0.07, 0.225, 1.72], [TAIL_X + 0.04, FLOOR_Y + 0.1125, 0]);
    const bp: THREE.BufferGeometry[] = [box([1.56, 0.012, 1.66], [-2.08, FLOOR_Y + 0.006, 0])];
    for (let i = -3; i <= 3; i++) bp.push(box([1.52, 0.014, 0.05], [-2.08, FLOOR_Y + 0.018, i * 0.22]));
    const bedLiner = merge(bp);

    // front fascia: steel bumper shell; black only for intake / skid
    const frontBumper = new ConvexGeometry([
      V(2.6, 0.6, 0.92), V(2.6, 0.6, -0.92), V(2.99, 0.62, 0.82), V(2.99, 0.62, -0.82),
      V(2.62, 0.74, 0.95), V(2.62, 0.74, -0.95), V(2.985, 0.73, 0.86), V(2.985, 0.73, -0.86),
    ]);
    const rearBar = new ConvexGeometry([
      V(-2.6, 0.63, 0.93), V(-2.6, 0.63, -0.93), V(-2.97, 0.64, 0.88), V(-2.97, 0.64, -0.88),
      V(-2.62, 0.73, 0.95), V(-2.62, 0.73, -0.95), V(-2.96, 0.73, 0.9), V(-2.96, 0.73, -0.9),
    ]);
    const bodyExtras = merge([frontBumper, rearBar, tailgate].map((q) => { planarUV2(q); return q; }));

    // grained composites
    const tp: THREE.BufferGeometry[] = [];
    tp.push(new ConvexGeometry([
      V(2.6, 0.48, 0.86), V(2.6, 0.48, -0.86), V(2.96, 0.52, 0.78), V(2.96, 0.52, -0.78),
      V(2.6, 0.6, 0.9), V(2.6, 0.6, -0.9), V(2.98, 0.6, 0.82), V(2.98, 0.6, -0.82),
    ]));
    tp.push(new ConvexGeometry([
      V(-2.6, 0.5, 0.88), V(-2.6, 0.5, -0.88), V(-2.94, 0.53, 0.82), V(-2.94, 0.53, -0.82),
      V(-2.6, 0.63, 0.92), V(-2.6, 0.63, -0.92), V(-2.96, 0.63, 0.86), V(-2.96, 0.63, -0.86),
    ]));
    for (let i = -2; i <= 2; i++) tp.push(box([0.2, 0.09, 0.016], [-2.87, 0.53, i * 0.2])); // diffuser fins
    tp.push(box([0.05, 0.02, 1.2], [-2.965, 0.74, 0])); // step pad
    tp.push(box([0.16, 0.08, 0.2], [-3.03, 0.58, 0])); // hitch receiver
    tp.push(box([0.012, 0.045, 1.5], [NOSE_X + 0.004, 0.86, 0])); // inset sensor band across the nose
    tp.push(box([0.02, 0.05, 1.1], [2.995, 0.56, 0])); // lower intake slot
    const trim = merge(tp.map((q) => { planarUV2(q); return q; }));
    const slats = merge([box([0.008, 0.008, 1.5], [NOSE_X + 0.006, 0.83, 0])]); // steel lip under the sensor band

    const skid = merge([box([0.46, 0.025, 1.3], [2.7, 0.47, 0], [0, 0, 0.18]), box([0.3, 0.025, 1.2], [-2.76, 0.5, 0], [0, 0, -0.2])]);
    const hooks = merge([box([0.06, 0.05, 0.1], [3.01, 0.56, 0.6]), box([0.06, 0.05, 0.1], [3.01, 0.56, -0.6])]);

    // lights
    // one slim full-width LED line inset at the nose tip (lamp and DRL in one stroke)
    const drl = box([0.014, 0.022, 1.66], [NOSE_X + 0.004, 0.93, 0]);
    const front = merge([drl, box([0.012, 0.012, 1.4], [NOSE_X + 0.004, 0.9, 0])]);
    const rear = merge([
      box([0.02, 0.05, 1.7], [TAIL_X - 0.008, 1.27, 0]),
      box([0.012, 0.03, 0.18], [-2.977, 0.68, 0.72]),
      box([0.012, 0.03, 0.18], [-2.977, 0.68, -0.72]),
    ]);
    const plate = box([0.006, 0.11, 0.5], [TAIL_X - 0.007, 0.9, 0]);
    const rocker = merge([box([2.0, 0.016, 0.014], [0, 0.55, 0.86]), box([2.0, 0.016, 0.014], [0, 0.55, -0.86])]);
    const portDoor = box([0.17, 0.15, 0.006], [-2.68, 0.94, -(zF(-2.68) + 0.003)]);
    const portRing = new THREE.TorusGeometry(0.032, 0.006, 6, 24);
    portRing.translate(-2.68, 0.94, -(zF(-2.68) + 0.008));

    const edges = new THREE.EdgesGeometry(lower, 25);
    const cabEdges = new THREE.EdgesGeometry(upper, 25);

    return { lower, upper, glass, gaskets, cabinShell, seats, liners, flares, mirrors, lens, gaps, lips, handles, trim, slats, bodyExtras, bedLiner, skid, hooks, front, rear, plate, rocker, portDoor, portRing, edges, cabEdges };
  }, []);
}

/* ───────────────────────── chassis (visible when exploded) ───────────────────────── */
function useChassisGeo() {
  return useMemo(() => {
    const frame: THREE.BufferGeometry[] = [];
    for (const s of [1, -1]) frame.push(box([4.9, 0.13, 0.09], [-0.05, 0.56, s * 0.46]));
    for (const x of [-2.4, -1.25, -0.4, 0.45, 1.25, 2.35]) frame.push(box([0.07, 0.09, 0.84], [x, 0.56, 0]));
    const pack = box([2.5, 0.14, 1.22], [0, 0.42, 0]);
    const cells: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 12; i++) cells.push(box([0.16, 0.018, 1.12], [-1.12 + i * 0.205, 0.5, 0]));
    const motor = new THREE.CylinderGeometry(0.16, 0.16, 0.5, 28);
    motor.rotateX(Math.PI / 2);
    const motors = merge([
      motor.clone().translate(DIM.axleX, DIM.wheelR, 0),
      motor.clone().translate(-DIM.axleX, DIM.wheelR, 0),
      box([0.34, 0.28, 0.3], [DIM.axleX - 0.22, DIM.wheelR + 0.02, 0]),
      box([0.34, 0.28, 0.3], [-DIM.axleX + 0.22, DIM.wheelR + 0.02, 0]),
    ]);
    const shaft = new THREE.CylinderGeometry(0.026, 0.026, 1, 10);
    shaft.rotateX(Math.PI / 2);
    const arm = new THREE.BoxGeometry(0.26, 0.035, 1);
    const shock = new THREE.CylinderGeometry(0.035, 0.045, 0.42, 14);
    const helix: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const a = t * Math.PI * 2 * 6;
      helix.push(V(Math.cos(a) * 0.062, -0.15 + t * 0.3, Math.sin(a) * 0.062));
    }
    const spring = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 220, 0.011, 6, false);
    return { frame: merge(frame), pack, cells: merge(cells), motors, shaft, arm, shock, spring };
  }, []);
}

function Corner({ x, side, g, mats }: { x: number; side: 1 | -1; g: ReturnType<typeof useChassisGeo>; mats: ReturnType<typeof createMaterials> }) {
  const shaft = useRef<THREE.Mesh>(null);
  const lo = useRef<THREE.Mesh>(null);
  const up = useRef<THREE.Mesh>(null);
  const coil = useRef<THREE.Group>(null);
  useFrame(() => {
    const hub = DIM.trackZ + anim.explode * 0.62 - 0.12;
    const span = (m: THREE.Object3D | null, z0: number, z1: number) => {
      if (!m) return;
      m.scale.z = Math.max(0.01, z1 - z0);
      m.position.z = side * (z0 + z1) * 0.5;
    };
    span(shaft.current, 0.24, hub);
    span(lo.current, 0.44, hub - 0.02);
    span(up.current, 0.48, hub - 0.08);
    if (coil.current) coil.current.position.z = side * (0.6 + anim.explode * 0.36);
  });
  return (
    <group position-x={x}>
      <mesh ref={shaft} geometry={g.shaft} material={mats.disc} position-y={DIM.wheelR} />
      <mesh ref={lo} geometry={g.arm} material={mats.chassis} position-y={DIM.wheelR - 0.12} />
      <mesh ref={up} geometry={g.arm} material={mats.chassis} position-y={DIM.wheelR + 0.17} scale-x={0.8} />
      <group ref={coil} position-y={DIM.wheelR + 0.16} rotation-x={side * 0.22}>
        <mesh geometry={g.shock} material={mats.disc} />
        <mesh geometry={g.spring} material={mats.caliper} />
      </group>
    </group>
  );
}

/* ───────────────────────── truck ───────────────────────── */
const CLAY = new THREE.Color('#e7e1d4');
const CLAY_BODY = new THREE.Color('#cfcfcb');

export function Truck() {
  const G = useGeometries();
  const C = useChassisGeo();
  const mats = useMemo(() => createMaterials(), []);
  const vIndex = variantStore.use((s) => s.index);

  const slabGroup = useRef<THREE.Group>(null);
  const cabGroup = useRef<THREE.Group>(null);
  const chassisGroup = useRef<THREE.Group>(null);
  const pool = useRef<THREE.Mesh>(null);
  const driveAcc = useRef(0);
  const events = useThree((st) => st.events);
  const lastP = useRef(-1);
  const halo = useRef<THREE.Mesh>(null);

  // hover: one master rim for the whole vehicle (feeds the QC bridge) + per-part emphasis
  const master: RimUniforms = useMemo(() => ({ uRim: { value: 0 }, uRimColor: { value: new THREE.Color() }, uRimPower: { value: 1 } }), []);
  const { bind, value } = useHoverRim(() => [master], 'axiom-t1', 1, 8);
  const hovered = useRef<Part | null>(null);
  const partAmt = useRef<Record<Part, number>>({ body: 0, glass: 0, lights: 0, wheels: 0, chassis: 0 });
  // which part is under the pointer = the NEAREST hit (glass sits 5 mm over the body, so first-hit order matters)
  const pickPart = (e: ThreeEvent<PointerEvent>) => {
    let o: THREE.Object3D | null = e.intersections[0]?.object ?? null;
    while (o && !o.userData.part) o = o.parent;
    hovered.current = e.intersections.length ? ((o?.userData.part as Part | undefined) ?? 'body') : null;
  };

  const base = useMemo(() => ({ tyre: mats.tyre.color.clone(), rim: mats.rim.color.clone(), chassis: mats.chassis.color.clone() }), [mats]);
  const tgtColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    bridge.registerMaterial('primary', mats.body, mats.bodyRim.uRim);
    bridge.registerMaterial('glass', mats.glass, mats.glassRim.uRim);
    bridge.registerMaterial('rearLight', mats.rear, mats.rearRim.uRim);
    return () => {
      bridge.unregisterMaterial('primary');
      bridge.unregisterMaterial('glass');
      bridge.unregisterMaterial('rearLight');
    };
  }, [mats]);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => {
        if (m && typeof (m as THREE.Material).dispose === 'function') (m as THREE.Material).dispose();
      });
      Object.values(G).forEach((g) => g.dispose());
      Object.values(C).forEach((g) => g.dispose());
    },
    [mats, G, C],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = scrollState.smooth;

    // ── scroll timeline (pure functions of p → scrubbing back restores everything) ──
    anim.p = p;
    // the scene moves under a still pointer while scrolling → re-raycast so hover resolves on the first frame
    if (Math.abs(p - lastP.current) > 0.0005) {
      lastP.current = p;
      events.update?.();
    }
    anim.explode = smoothstep(0.34, 0.47, p) * (1 - smoothstep(0.58, 0.68, p));
    // .01 beat: wheels keep turning and the desert keeps sliding while that chapter is on screen (decorative,
    // time-based; every scroll-owned state below stays a pure function of p)
    const drive = smoothstep(0.1, 0.2, p) * (1 - smoothstep(0.31, 0.4, p));
    anim.drive = drive;
    driveAcc.current += dt * 7.5 * drive;
    anim.roll = p * 26 + driveAcc.current;
    anim.rear = smoothstep(0.6, 0.73, p) * (1 - 0.5 * smoothstep(0.88, 1, p));
    anim.glow = 0.12 + 0.88 * smoothstep(0.08, 0.2, p) * (1 - smoothstep(0.32, 0.42, p));
    const e = anim.explode;
    const ee = e * e * (3 - 2 * e);
    if (slabGroup.current) slabGroup.current.position.y = ee * 0.78;
    if (cabGroup.current) cabGroup.current.position.y = ee * 1.0; // cab rides 22 cm above the shell = layered, still aligned
    if (chassisGroup.current) chassisGroup.current.position.y = ee * 0.05;

    // ── hover emphasis per part ──
    const pa = partAmt.current;
    for (const k of Object.keys(pa) as Part[]) pa[k] = damp(pa[k], hovered.current === k && value.current > 0.05 ? 1 : 0, 8, dt);
    const h = value.current;
    mats.bodyRim.uRim.value = h * (0.55 + 0.65 * pa.body);
    mats.glassRim.uRim.value = h * (0.2 + 1.0 * pa.glass);
    mats.glass.envMapIntensity = 1.6 + 1.8 * h * pa.glass;
    mats.rimRim.uRim.value = h * (0.2 + 1.0 * pa.wheels);
    mats.rim.emissiveIntensity = 0.35 * h * pa.wheels;
    mats.caliper.emissiveIntensity = 1.6 * h * pa.wheels;
    mats.chassisRim.uRim.value = h * (0.1 + 0.9 * pa.chassis);
    mats.frontRim.uRim.value = h * pa.lights;
    mats.rearRim.uRim.value = h * pa.lights;

    // ── variant finish (damped, real material params) ──
    // (exoskeleton step: the shell drifts toward a matte clay study model, as in the reference's .02 chapter)
    const f = FINISHES[vIndex] ?? FINISHES[0];
    // .02 bare-steel study only for the stainless finish; paints keep their colour (just lose the clearcoat a bit)
    const c = vIndex === 0 ? e * 0.4 : 0;
    const k = 1 - Math.exp(-6 * dt);
    tgtColor.set(f.color).lerp(CLAY_BODY, c);
    mats.body.color.lerp(tgtColor, k);
    mats.body.metalness = damp(mats.body.metalness, f.metalness * (1 - c), 6, dt);
    mats.body.roughness = damp(mats.body.roughness, f.roughness + (0.9 - f.roughness) * c, 6, dt);
    mats.body.clearcoat = damp(mats.body.clearcoat, f.clearcoat * (1 - c) * (1 - 0.4 * e), 6, dt);
    mats.body.clearcoatRoughness = damp(mats.body.clearcoatRoughness, f.clearcoatRoughness, 6, dt);
    mats.body.anisotropy = damp(mats.body.anisotropy, f.anisotropy * (1 - c), 6, dt);
    mats.body.envMapIntensity = damp(mats.body.envMapIntensity, f.env * (1 - 0.6 * c), 6, dt);

    // ── exoskeleton x-ray: running gear turns to ivory clay, structure lines glow ──
    mats.tyre.color.copy(base.tyre).lerp(CLAY, e * 0.82);
    mats.rim.color.copy(base.rim).lerp(CLAY, e * 0.7);
    mats.chassis.color.copy(base.chassis).lerp(CLAY, e * 0.75);
    // structure lines = exoskeleton read at .02, and a clear hover cue on the shell everywhere else
    mats.edges.opacity = Math.max(e * 0.9, h * pa.body * 0.7);
    mats.battery.emissiveIntensity = e * 1.1;

    // ── lights ──
    const lh = pa.lights * h;
    mats.front.emissiveIntensity = 1.8 * (1 + lh);
    mats.rear.emissiveIntensity = (0.45 + anim.rear * 5.5) * (1 + lh) + lh * 2.5;
    mats.glow.emissiveIntensity = (anim.glow * 2.4 + lh * 1.5) * (1 + lh);
    poolMat.uniforms.uA.value = anim.rear;
    if (halo.current) (halo.current.material as THREE.ShaderMaterial).uniforms.uA.value = anim.rear;

    const x = bridge.state.extra;
    x.exploded = Number(e.toFixed(3));
    x.rearLight = Number(anim.rear.toFixed(3));
    x.hoverPart = hovered.current ?? '';
  });

  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color('#ff3b3f') } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform float uA; uniform vec3 uC; varying vec2 vUv; void main(){ vec2 d = abs(vUv-0.5)*2.0; float a = pow(clamp(1.0-d.y,0.0,1.0), 2.0) * (1.0 - smoothstep(0.75, 1.0, d.x)); gl_FragColor = vec4(uC * a * uA * 0.5, 1.0); }',
      }),
    [],
  );

  // red light spill on the sand right behind the tailgate (additive decal instead of a point light)
  const poolMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color('#ff2a2f') } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform float uA; uniform vec3 uC; varying vec2 vUv; void main(){ vec2 q = vec2((vUv.x - 0.85) * 2.4, (vUv.y - 0.5) * 2.0); float a = pow(1.0 - smoothstep(0.0, 1.0, length(q)), 1.8); gl_FragColor = vec4(uC * a * uA * 0.42, 1.0); }',
      }),
    [],
  );
  const plateMat = useMemo(() => new THREE.MeshStandardMaterial({ map: plateTexture(), roughness: 0.5, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2 }), []);
  useEffect(() => () => { plateMat.map?.dispose(); plateMat.dispose(); }, [plateMat]);
  const badgeMat = useMemo(() => {
    const t = wordmarkTexture();
    return new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.6, roughness: 0.35, alphaMap: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  }, []);
  useEffect(() => () => { poolMat.dispose(); badgeMat.alphaMap?.dispose(); badgeMat.dispose(); }, [poolMat, badgeMat]);

  return (
    <group
      // Hover is (re)asserted on every pointer move over ANY part — glass sits in front of the body, and the
      // stock over-handler's stopPropagation made R3F cancel the hits behind it (same group) → flip-flop to 0.
      onPointerOver={(e) => {
        pickPart(e);
        bind.onPointerOver(NO_STOP);
      }}
      onPointerMove={(e) => {
        pickPart(e);
        bind.onPointerOver(NO_STOP);
      }}
      onPointerOut={() => {
        hovered.current = null;
        bind.onPointerOut(); // keep useHoverRim's ease-out
      }}
    >
      {/* lower body + everything bolted to it */}
      <group ref={slabGroup}>
        <group userData={{ part: 'body' }}>
          <mesh geometry={G.lower} material={mats.body} />
          <mesh geometry={G.bodyExtras} material={mats.body} />
          <mesh geometry={G.slats} material={mats.body} />
          <mesh geometry={G.mirrors} material={mats.body} />
          <mesh geometry={G.lens} material={mats.glass} />
          <mesh geometry={G.handles} material={mats.disc} />
          <mesh geometry={G.lips} material={mats.disc} />
          <mesh geometry={G.plate} material={mats.plate} />
          <mesh material={plateMat} position={[TAIL_X - 0.0112, 0.9, 0]} rotation-y={-Math.PI / 2} raycast={noRay}>
            <planeGeometry args={[0.49, 0.107]} />
          </mesh>
          <mesh geometry={G.flares} material={mats.trim} />
          <mesh geometry={G.trim} material={mats.trim} />
          <mesh geometry={G.skid} material={mats.disc} />
          <mesh geometry={G.hooks} material={mats.caliper} />
          <mesh geometry={G.liners} material={mats.liner} />
          <mesh geometry={G.gaps} material={mats.gap} />
          <mesh geometry={G.portDoor} material={mats.body} />
        </group>
        <group userData={{ part: 'lights' }}>
          <mesh geometry={G.front} material={mats.front} />
          <mesh geometry={G.rocker} material={mats.glow} />
          <mesh geometry={G.portRing} material={mats.glow} />
        </group>
        <lineSegments geometry={G.edges} material={mats.edges} raycast={noRay} />
      </group>

      {/* top shell: hood skin, greenhouse, roof, rear glass slope, bed rails + floor, tailgate face */}
      <group ref={cabGroup}>
        <group userData={{ part: 'body' }}>
          <mesh geometry={G.upper} material={mats.body} />
          <mesh geometry={G.bedLiner} material={mats.trim} />
        </group>
        <mesh geometry={G.cabinShell} material={mats.cabin} raycast={noRay} />
        <mesh geometry={G.seats} material={mats.trim} raycast={noRay} />
        <group userData={{ part: 'glass' }}>
          <mesh geometry={G.gaskets} material={mats.trim} />
          <mesh geometry={G.glass} material={mats.glass} />
        </group>
        <group userData={{ part: 'lights' }}>
          <mesh geometry={G.rear} material={mats.rear} />
        </group>
        <mesh ref={halo} material={haloMat} position={[TAIL_X - 0.03, 1.27, 0]} rotation-y={-Math.PI / 2} raycast={noRay} onUpdate={(m) => m.layers.set(FX_LAYER)}>
          <planeGeometry args={[1.9, 0.22]} />
        </mesh>
        <mesh ref={pool} visible={false} material={poolMat} position={[-3.05, 0.012, 0]} rotation-x={-Math.PI / 2} raycast={noRay}>
          <planeGeometry args={[0.9, 2.0]} />
        </mesh>
        <mesh material={badgeMat} position={[TAIL_X - 0.006, FLOOR_Y + 0.075, 0]} rotation-y={-Math.PI / 2} raycast={noRay}>
          <planeGeometry args={[0.62, 0.0775]} />
        </mesh>
        <lineSegments geometry={G.cabEdges} material={mats.edges} raycast={noRay} />
      </group>

      {/* skateboard chassis */}
      <group ref={chassisGroup} userData={{ part: 'chassis' }}>
        <mesh geometry={C.frame} material={mats.chassis} />
        <mesh geometry={C.pack} material={mats.chassis} />
        <mesh geometry={C.cells} material={mats.battery} />
        <mesh geometry={C.motors} material={mats.disc} />
        {[DIM.axleX, -DIM.axleX].map((x) =>
          ([1, -1] as const).map((s) => <Corner key={`${x}${s}`} x={x} side={s} g={C} mats={mats} />),
        )}
      </group>

      <group userData={{ part: 'wheels' }}>
        {[DIM.axleX, -DIM.axleX].map((x) => ([1, -1] as const).map((s) => <Wheel key={`${x}${s}`} x={x} side={s} mats={mats} />))}
      </group>
    </group>
  );
}
