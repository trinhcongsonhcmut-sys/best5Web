import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import { addRim, useHoverRim, type RimUniforms } from '../../lib/rim';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import { damp, smoothstep } from '../../lib/math';
import { FINISHES, createCarMaterials, plateTexture, sunRim, sweep, type CarMaterials } from './materials';
import { SUN, anim, carDims, releaseReady } from './anim';
import { FX_LAYER } from './layers';

/**
 * AXIOM GT — the approved photoreal GLB (CarConcept, CC-BY 4.0) re-rigged into the v1 motion mount points:
 *   body    (panels, pillars, roof, glazing, front + rear clamshells, doors)   ← lifts at .02  (v1 slab/cab groups)
 *   chassis (underside, axles, drive unit, cabin interior)                    ← stays          (v1 chassisGroup)
 *   4 wheels: root (slides out at .02) › spin (rolls at .01; tyre, rim, disc) + fixed caliper  (v1 Wheel root/spin)
 * Car frame = v1 frame: nose +X, up +Y, right flank +Z, ground y = 0, centred on the bounding box.
 * Shipped asset: CarConcept.baha.glb (built by tools/build-car.mjs — logos removed, WebP textures; local, no CDN).
 */
export const CAR_URL = '/assets/models/CarConcept.baha.glb';

type Part = 'body' | 'glass' | 'lights' | 'wheels' | 'chassis';
const NO_STOP = { stopPropagation() {} } as unknown as ThreeEvent<PointerEvent>;
const noRay = () => null;

/* reveal amplitudes (metres / radians) */
/* exploded layers move along the car's own axes only (no tilts → nothing interpenetrates, every offset reads) */
const LIFT = 0.17; // whole shell rises just enough to show the glowing seam above the skateboard
const DOOR = 0.86; // door swing (rad) …
const DOOR_OUT = 0.06; // … after a short outward hinge travel so the leading edge clears the fender
const CLAM_UP = 0; // front + rear clamshells float one more layer above the shell …
const CLAM_OUT = 0; // … and slide fore / aft (same offset front and rear → symmetric)
const WHEEL_OUT = 0.12;

interface Pivot {
  node: THREE.Object3D;
  q0: THREE.Quaternion;
  p0: THREE.Vector3;
}
interface WheelRig {
  root: THREE.Group;
  spin: THREE.Group;
  side: 1 | -1;
  z0: number;
}
interface Rig {
  car: THREE.Group;
  body: THREE.Group;
  chassis: THREE.Group;
  doorL: Pivot | null;
  doorR: Pivot | null;
  hood: Pivot | null;
  rearClam: Pivot | null;
  wheels: WheelRig[];
  tail: THREE.Box3;
  head: THREE.Box3;
  size: THREE.Vector3;
  mechRim: RimUniforms | null;
}

const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });
const Y = new THREE.Vector3(0, 1, 0);
const qa = new THREE.Quaternion();

function buildRig(src: THREE.Object3D, mats: CarMaterials, plateMap: THREE.Texture): Rig {
  const scene = src.clone(true);
  const car = new THREE.Group();
  car.name = 'AXIOM_GT';
  const turn = new THREE.Group();
  turn.rotation.y = Math.PI / 2; // GLB nose +Z → v1 frame nose +X
  turn.add(scene);
  car.add(turn);
  car.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(turn, true); // precise: the rolled wheels' AABBs would lift the car ~16 cm
  const c = bb.getCenter(new THREE.Vector3());
  turn.position.set(-c.x, -bb.min.y, -c.z);
  car.updateMatrixWorld(true);
  const size = bb.getSize(new THREE.Vector3());

  const N = (name: string) => car.getObjectByName(name) ?? null; // search the whole rig (nodes get re-parented below)
  const body = new THREE.Group();
  body.name = 'mount:body';
  const chassis = new THREE.Group();
  chassis.name = 'mount:chassis';
  car.add(body, chassis);

  // ── wheels: pivot at the hub, spin group rolls about the car's lateral (Z) axis, caliper stays put ──
  const wheels: WheelRig[] = [];
  for (const name of ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR']) {
    const node = N(name);
    if (!node) continue;
    const wp = node.getWorldPosition(new THREE.Vector3());
    const root = new THREE.Group();
    root.name = `mount:${name}`;
    root.position.copy(wp);
    car.add(root);
    root.updateMatrixWorld(true);
    const spin = new THREE.Group();
    root.add(spin);
    // the sample model ships its front wheels steered → straighten every wheel so its axle is the car's Z axis
    const straight = new THREE.Group();
    const fixed = new THREE.Group();
    spin.add(straight);
    root.add(fixed);
    root.updateMatrixWorld(true);
    const axle = new THREE.Vector3(1, 0, 0).applyQuaternion(node.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const corr = new THREE.Quaternion().setFromUnitVectors(axle, new THREE.Vector3(0, 0, axle.z >= 0 ? 1 : -1));
    for (const ch of [...node.children]) (/BrakePad/.test(ch.name) ? fixed : straight).attach(ch);
    straight.quaternion.copy(corr);
    fixed.quaternion.copy(corr);
    node.removeFromParent();
    const side = (wp.z >= 0 ? 1 : -1) as 1 | -1;
    wheels.push({ root, spin, side, z0: wp.z });
    root.traverse((o) => (o.userData.part = 'wheels'));
  }
  if (wheels.length === 4) {
    const fr = wheels.filter((w) => w.root.position.x > 0);
    const re = wheels.filter((w) => w.root.position.x < 0);
    carDims.wheelR = wheels.reduce((s, w) => s + w.root.position.y, 0) / 4;
    carDims.frontX = fr.reduce((s, w) => s + w.root.position.x, 0) / Math.max(1, fr.length);
    carDims.rearX = re.reduce((s, w) => s + w.root.position.x, 0) / Math.max(1, re.length);
    carDims.trackZ = wheels.reduce((s, w) => s + Math.abs(w.z0), 0) / 4;
  }
  carDims.noseX = size.x / 2;
  carDims.tailX = -size.x / 2;

  // ── body shell (+ glazing, clamshells, doors) ──
  const rearClamNode = N('BodyRearPanelsColor1');
  for (const name of [
    'BodyPanelsColor2', 'BodyPillars', 'BodyRoofPanel', 'BodyRearPanelsColor1', 'BodyWindshield', 'BodyWindshieldGasket',
    'BodyWindshieldWipers', 'BodyWindshieldWipersBase', 'BodyHood', 'BodyDoorLColor1', 'BodyDoorRColor1', 'InteriorPillar', 'InteriorCage',
  ]) {
    const n = N(name);
    if (n) body.attach(n);
  }
  const plateNode = N('License_Plate') ?? N('License Plate');
  if (plateNode) (rearClamNode ?? body).attach(plateNode);
  // ── everything left (underside, axles, drive unit, cabin interior) = chassis ──
  for (const ch of [...scene.children]) chassis.attach(ch);
  turn.removeFromParent();

  const pivot = (n: THREE.Object3D | null): Pivot | null => (n ? { node: n, q0: n.quaternion.clone(), p0: n.position.clone() } : null);
  const dA = N('BodyDoorLColor1'), dB = N('BodyDoorRColor1');
  const zOf = (n: THREE.Object3D | null) => (n ? n.getWorldPosition(new THREE.Vector3()).z : 0);
  // name says L/R in the model's own frame — decide by the real side in the car frame (+Z = right flank)
  const [doorR, doorL] = zOf(dA) > zOf(dB) ? [pivot(dA), pivot(dB)] : [pivot(dB), pivot(dA)];

  // ── materials: GLB paint/glass/lights/wheels → BAHA materials (AO + flake maps of the model are kept) ──
  let mechRim: RimUniforms | null = null;
  const adopt = (m: THREE.MeshStandardMaterial, from: THREE.MeshStandardMaterial, normalScale?: number, ao = 1) => {
    if (!m.aoMap && from.aoMap) {
      m.aoMap = from.aoMap;
      m.aoMapIntensity = ao; // baked AO also occludes env specular in three → keep it light on clear-coated paint
    }
    if (normalScale !== undefined && !m.normalMap && from.normalMap) {
      m.normalMap = from.normalMap;
      m.normalScale.set(normalScale, normalScale);
    }
    m.needsUpdate = true;
  };
  car.updateMatrixWorld(true);
  const proxies: THREE.Mesh[] = [];
  car.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.name.startsWith('HIT_')) {
      // low-poly raycast proxy baked into the asset (tools/build-car.mjs): never drawn, always picked
      mesh.material = HIT_MAT;
      proxies.push(mesh);
      return;
    }
    mesh.raycast = noRay; // the 213k-triangle render meshes are never ray-tested
    let part: Part = (mesh.userData.part as Part) ?? 'body';
    let inChassis = false;
    for (let p: THREE.Object3D | null = mesh; p; p = p.parent) if (p === chassis) inChassis = true;
    if (inChassis && part !== 'wheels') part = 'chassis';
    const m = mesh.material as THREE.MeshStandardMaterial;
    const name = m.name ?? '';
    if (name.startsWith('Paint 1')) {
      adopt(mats.paint, m, undefined, 0.3); // no flake normal: grain read as noise, not metallic
      mesh.material = mats.paint;
    } else if (name.startsWith('Paint 2')) {
      adopt(mats.accent, m, undefined, 0.6);
      mesh.material = mats.accent;
    } else if (name === 'Glass') {
      mesh.material = mats.glass;
      mesh.renderOrder = 2;
      part = 'glass';
    } else if (name === 'Headlight') {
      mesh.material = mats.front;
      part = 'lights';
    } else if (name === 'Brakelight') {
      mesh.material = mats.rear;
      part = 'lights';
    } else if (name === 'Signallight') {
      mesh.material = mats.signal;
      part = 'lights';
    } else if (name === 'Rim1') {
      adopt(mats.rimDark, m);
      mesh.material = mats.rimDark;
    } else if (name === 'Rim2') {
      adopt(mats.rimLip, m);
      mesh.material = mats.rimLip;
    } else if (name === 'Brake') {
      adopt(mats.caliper, m);
      mesh.material = mats.caliper;
    } else if (name.startsWith('Interior 3')) {
      adopt(mats.interior, m, 1);
      mesh.material = mats.interior;
    } else if (name === 'License') {
      adopt(mats.plate, m);
      mats.plate.map = plateMap;
      mesh.material = mats.plate;
    } else if (name === '' && !m.userData.bahaLiner) {
      m.userData.bahaLiner = true;
      m.color.set('#232427'); // wheel-well liners, gaskets and inner trims: satin dark grey with real shading
      m.roughness = 0.62;
      m.metalness = 0;
      m.envMapIntensity = 1;
    } else if (name === 'Tireside' || name === 'Tiretread') {
      m.roughness = 1; // rubber: the sample's 0.4 mirrored the orange sky / back-light as a rim around every tyre
      m.envMapIntensity = 0.3;
    } else if (name === 'Disc') {
      m.color.set('#4d4f53'); // cast-iron rotor: the sample's white metal mirrored the sunset like gold behind the spokes
      m.envMapIntensity = 0.6;
    } else if (name === 'Mechanical' && !mechRim) {
      m.normalScale.multiplyScalar(0.3); // the tiled greeble normal read like lettering on the exposed nose block
      mechRim = addRim(m, { color: '#9fd0ff', power: 2 }).uniforms;
    }
    if (part === 'body' && (name === 'Headlight' || name === 'Brakelight')) part = 'lights';
    mesh.userData.part = part;
  });

  for (const px of proxies) {
    const parent = px.parent;
    const sib = parent?.children.find((c) => (c as THREE.Mesh).isMesh && !c.name.startsWith('HIT_'));
    px.userData.part = parent?.userData.part ?? sib?.userData.part ?? 'body';
  }

  const box = (name: string) => {
    const o = N(name);
    return o ? new THREE.Box3().setFromObject(o, true) : new THREE.Box3(new THREE.Vector3(-0.1, 0.5, -0.5), new THREE.Vector3(0.1, 0.7, 0.5));
  };
  car.updateMatrixWorld(true);
  return {
    car,
    body,
    chassis,
    doorL,
    doorR,
    hood: pivot(N('BodyHood')),
    rearClam: pivot(rearClamNode),
    wheels,
    tail: box('BodyTaillights'),
    head: box('BodyHeadlights'),
    size,
    mechRim,
  };
}

interface Pose {
  doors: number;
  wheelsOut: number;
  lift: number;
  clams: number;
}
function applyPose(r: Rig, a: Pose) {
  r.body.position.y = a.lift * LIFT;
  const door = (d: Pivot | null, side: 1 | -1) => {
    if (!d) return;
    const out = smoothstep(0, 0.35, a.doors); // hinge travel first, then the swing
    const sw = smoothstep(0.2, 1, a.doors);
    d.node.position.set(d.p0.x, d.p0.y, d.p0.z + side * out * DOOR_OUT);
    d.node.quaternion.copy(d.q0).premultiply(qa.setFromAxisAngle(Y, side * sw * DOOR));
  };
  door(r.doorR, 1);
  door(r.doorL, -1);
  if (r.hood) r.hood.node.position.set(r.hood.p0.x + a.clams * CLAM_OUT, r.hood.p0.y + a.clams * CLAM_UP, r.hood.p0.z);
  if (r.rearClam) r.rearClam.node.position.set(r.rearClam.p0.x - a.clams * CLAM_OUT, r.rearClam.p0.y + a.clams * CLAM_UP, r.rearClam.p0.z);
  for (const w of r.wheels) w.root.position.z = w.z0 + w.side * a.wheelsOut * WHEEL_OUT;
}

/* ───────────── baked contact shadows (closed + open pose, cross-faded) ───────────── */
const SH = { w: 7.4, h: 4.6, far: 1.6, res: 512 };
function useShadowBake() {
  return useMemo(() => {
    const mk = () => {
      const t = new THREE.WebGLRenderTarget(SH.res, SH.res);
      t.texture.generateMipmaps = false;
      return t;
    };
    const a = mk(), b = mk(), tmp = mk();
    const cam = new THREE.OrthographicCamera(-SH.w / 2, SH.w / 2, SH.h / 2, -SH.h / 2, 0, SH.far);
    cam.rotation.x = Math.PI / 2; // looks straight up from the road
    cam.position.y = 0.003;
    cam.updateMatrixWorld(true);
    const depth = new THREE.MeshDepthMaterial();
    depth.depthTest = depth.depthWrite = false;
    depth.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        'vec4( vec3( 0.0 ), pow( 1.0 - fragCoordZ, 1.6 ) );',
      );
    };
    const hb = new THREE.ShaderMaterial(HorizontalBlurShader);
    const vb = new THREE.ShaderMaterial(VerticalBlurShader);
    hb.depthTest = vb.depthTest = false;
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), hb);
    quad.position.z = -0.5;
    const qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const display = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { tA: { value: a.texture }, tB: { value: b.texture }, uMix: { value: 0 }, uOpacity: { value: 0.92 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader:
        'uniform sampler2D tA; uniform sampler2D tB; uniform float uMix; uniform float uOpacity; varying vec2 vUv;' +
        'void main(){ float s = mix(texture2D(tA, vUv).a, texture2D(tB, vUv).a, uMix); gl_FragColor = vec4(0.035, 0.025, 0.02, min(1.0, s * 1.5) * uOpacity); }',
    });
    const bake = (gl: THREE.WebGLRenderer, scene: THREE.Scene, out: THREE.WebGLRenderTarget) => {
      const bg = scene.background;
      const cc = gl.getClearColor(new THREE.Color());
      const ca = gl.getClearAlpha();
      scene.background = null;
      scene.overrideMaterial = depth;
      gl.setClearColor(0x000000, 0);
      gl.setRenderTarget(out);
      gl.clear();
      gl.render(scene, cam);
      scene.overrideMaterial = null;
      for (const k of [3.2, 1.4]) {
        quad.material = hb;
        hb.uniforms.tDiffuse.value = out.texture;
        hb.uniforms.h.value = k / SH.res;
        gl.setRenderTarget(tmp);
        gl.render(quad, qcam);
        quad.material = vb;
        vb.uniforms.tDiffuse.value = tmp.texture;
        vb.uniforms.v.value = k / SH.res;
        gl.setRenderTarget(out);
        gl.render(quad, qcam);
      }
      gl.setRenderTarget(null);
      gl.setClearColor(cc, ca);
      scene.background = bg;
    };
    const dispose = () => {
      [a, b, tmp].forEach((t) => t.dispose());
      [depth, hb, vb, display].forEach((m) => m.dispose());
      quad.geometry.dispose();
    };
    return { a, b, bake, display, dispose };
  }, []);
}

/* additive glow decal (tail-light halo, light pools on the asphalt) */
function glowMaterial(color: string, shape: 'bar' | 'pool') {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color(color) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader:
      shape === 'bar'
        ? 'uniform float uA; uniform vec3 uC; varying vec2 vUv; void main(){ vec2 d = abs(vUv-0.5)*2.0; float a = pow(clamp(1.0-d.y,0.0,1.0), 2.2) * (1.0 - smoothstep(0.7, 1.0, d.x)); gl_FragColor = vec4(uC * a * uA * 0.55, 1.0); }'
        : 'uniform float uA; uniform vec3 uC; varying vec2 vUv; void main(){ vec2 q = (vUv - 0.5) * 2.0; float a = pow(1.0 - smoothstep(0.0, 1.0, length(q)), 2.0); gl_FragColor = vec4(uC * a * uA * 0.5, 1.0); }',
  });
}

export function Car() {
  const gltf = useGLTF(CAR_URL, false, false);
  const mats = useMemo(() => createCarMaterials(), []);
  const plateMap = useMemo(() => plateTexture(), []);
  const rig = useMemo(() => buildRig(gltf.scene, mats, plateMap), [gltf.scene, mats, plateMap]);
  const shadow = useShadowBake();
  const baked = useRef(false);
  const bakeWait = useRef(0);
  const readyWait = useRef(0);
  const vIndex = variantStore.use((s) => s.index);
  const events = useThree((st) => st.events);
  const lastP = useRef(-1);
  const driveAcc = useRef(0);
  const sweepOn = useRef(false);
  const sweepT = useRef(2);

  const halo = useMemo(() => glowMaterial('#ff2a34', 'bar'), []);
  // .02 "structure lines": the skateboard outline + cross members glow while the shell is lifted (v1 exoskeleton cue)
  const skate = useMemo(() => {
    // premium reveal cue: a warm light seam traced around the skateboard, in the gap the lifted shell opens
    const x0 = carDims.rearX - 0.3, x1 = carDims.frontX + 0.25, z = carDims.trackZ - 0.1, y = 0.36, t = 0.022;
    const parts: THREE.BufferGeometry[] = [];
    const bar = (len: number, along: 'x' | 'z', cx: number, cz: number) => {
      const g = along === 'x' ? new THREE.BoxGeometry(len, t, t) : new THREE.BoxGeometry(t, t, len);
      g.translate(cx, y, cz);
      parts.push(g);
    };
    const xm = (x0 + x1) / 2, L = x1 - x0;
    bar(L, 'x', xm, -z);
    bar(L, 'x', xm, z);
    bar(2 * z, 'z', x0, 0);
    bar(2 * z, 'z', x1, 0);
    const g = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.6, 0.95), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    return { g, m };
  }, [rig]); // eslint-disable-line react-hooks/exhaustive-deps
  const redPool = useMemo(() => glowMaterial('#ff1f2a', 'pool'), []);
  const beam = useMemo(() => glowMaterial('#fff1dc', 'pool'), []);

  // hover: one master rim for the whole car (feeds the QC bridge) + per-part emphasis
  const master: RimUniforms = useMemo(() => ({ uRim: { value: 0 }, uRimColor: { value: new THREE.Color() }, uRimPower: { value: 1 } }), []);
  const { bind, value } = useHoverRim(() => [master], 'axiom-gt', 1, 8);
  const hovered = useRef<Part | null>(null);
  const partAmt = useRef<Record<Part, number>>({ body: 0, glass: 0, lights: 0, wheels: 0, chassis: 0 });
  const pickPart = (e: ThreeEvent<PointerEvent>) => {
    const o = e.intersections[0]?.object;
    hovered.current = e.intersections.length ? ((o?.userData.part as Part | undefined) ?? 'body') : null;
  };

  useEffect(() => {
    bridge.registerMaterial('primary', mats.paint, mats.paintRim.uRim);
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
      for (const m of Object.values(mats)) if (m instanceof THREE.Material) m.dispose();
      plateMap.dispose();
      shadow.dispose();
      [halo, redPool, beam, skate.m].forEach((m) => m.dispose());
      skate.g.dispose();
    },
    [mats, plateMap, shadow, halo, redPool, beam, skate],
  );

  const tgt = useMemo(() => ({ c: new THREE.Color(), a: new THREE.Color(), i: new THREE.Color() }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = scrollState.smooth;

    // one-time: bake the closed + open contact shadows (car on layer 0 only; world/FX live on layer 1) — only once the
    // car is really on screen (a sibling still loading keeps the Suspense boundary hidden for a few frames)
    let shown = true;
    for (let o: THREE.Object3D | null = rig.car; o; o = o.parent) if (!o.visible) shown = false;
    if (!baked.current && shown && ++bakeWait.current > 2) {
      baked.current = true;
      applyPose(rig, { doors: 0, wheelsOut: 0, lift: 0, clams: 0 });
      rig.car.updateMatrixWorld(true);
      shadow.bake(state.gl, state.scene, shadow.a);
      applyPose(rig, { doors: 1, wheelsOut: 1, lift: 1, clams: 1 });
      rig.car.updateMatrixWorld(true);
      shadow.bake(state.gl, state.scene, shadow.b);
      const hidden: THREE.Object3D[] = [];
      state.scene.traverse((o) => {
        if (!o.visible) {
          hidden.push(o);
          o.visible = true;
        }
      });
      state.gl.compile(state.scene, state.camera); // every program (incl. later-beat FX) built before we report ready
      hidden.forEach((o) => (o.visible = false));
      if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__axDebug = { gl: state.gl, shadow, rig, scene: state.scene };
    }
    if (baked.current && ++readyWait.current === 4) releaseReady();

    // ── scroll timeline (pure functions of p → scrubbing back restores everything) ──
    anim.p = p;
    if (Math.abs(p - lastP.current) > 0.0005) {
      lastP.current = p;
      events.update?.(); // the car moves under a still pointer → re-resolve hover
    }
    const out = 1 - smoothstep(0.58, 0.68, p);
    anim.explode = smoothstep(0.34, 0.47, p) * out;
    // staggered: doors → wheels → shell → clamshells, closing in exact reverse order
    anim.doors = smoothstep(0.34, 0.42, p) * (1 - smoothstep(0.61, 0.68, p));
    anim.wheelsOut = smoothstep(0.38, 0.45, p) * (1 - smoothstep(0.59, 0.65, p));
    anim.lift = smoothstep(0.42, 0.48, p) * (1 - smoothstep(0.57, 0.62, p));
    anim.clams = smoothstep(0.44, 0.5, p) * (1 - smoothstep(0.55, 0.6, p));
    const drive = smoothstep(0.1, 0.2, p) * (1 - smoothstep(0.31, 0.4, p));
    anim.drive = drive;
    driveAcc.current += dt * 9 * drive;
    anim.roll = p * 26 + driveAcc.current;
    anim.rear = smoothstep(0.6, 0.73, p) * (1 - 0.5 * smoothstep(0.88, 1, p));
    anim.glow = 0.12 + 0.88 * smoothstep(0.08, 0.2, p) * (1 - smoothstep(0.32, 0.42, p));

    applyPose(rig, anim);
    sunRim.dir.value.copy(SUN).transformDirection(state.camera.matrixWorldInverse);
    for (const w of rig.wheels) w.spin.rotation.z = -anim.roll / carDims.wheelR;
    // driving: a whisper of body float on the springs (only while the .01 beat is on screen)
    const t = state.clock.elapsedTime;
    rig.body.position.y += drive * (Math.sin(t * 11.0) * 0.0025 + Math.sin(t * 3.7) * 0.002);
    rig.body.rotation.z = drive * (-0.004 + Math.sin(t * 2.3) * 0.0015);
    shadow.display.uniforms.uMix.value = anim.explode;
    shadow.display.uniforms.uOpacity.value = 0.92 - anim.lift * 0.12;
    skate.m.opacity = anim.lift;

    // ── hover emphasis per part ──
    const pa = partAmt.current;
    for (const k of Object.keys(pa) as Part[]) pa[k] = damp(pa[k], hovered.current === k && value.current > 0.05 ? 1 : 0, 8, dt);
    const h = value.current;
    mats.paintRim.uRim.value = h * (0.4 + 0.75 * pa.body);
    mats.accentRim.uRim.value = 0; // carbon trim keeps its colour on hover
    // light sweep: travels across the panels once each time the pointer lands on the car, then a soft hold
    if (h > 0.05 && !sweepOn.current) {
      sweepOn.current = true;
      sweepT.current = 0;
    } else if (h <= 0.02) sweepOn.current = false;
    sweepT.current = Math.min(1.4, sweepT.current + dt);
    sweep.pos.value = -0.55 + Math.min(1, sweepT.current / 0.9) * 1.1;
    sweep.amount.value = h * (sweepT.current < 0.9 ? 0.9 : 0.25);
    const hb = h * pa.body;
    mats.glassRim.uRim.value = h * (0.12 + 0.9 * pa.glass);
    mats.glass.envMapIntensity = 0.85 + 1.6 * h * pa.glass;
    mats.rimDarkRim.uRim.value = h * (0.15 + 1.0 * pa.wheels);
    mats.rimLipRim.uRim.value = h * (0.15 + 1.0 * pa.wheels);
    mats.caliper.emissiveIntensity = 1.5 * h * pa.wheels;
    if (rig.mechRim) rig.mechRim.uRim.value = h * (0.05 + 0.9 * pa.chassis);
    const lh = pa.lights * h;
    mats.frontRim.uRim.value = lh;
    mats.rearRim.uRim.value = lh;

    // ── paint finish (damped, real material params) ──
    const f = FINISHES[vIndex] ?? FINISHES[0];
    const k = 1 - Math.exp(-6 * dt);
    mats.paint.color.lerp(tgt.c.set(f.color), k);
    mats.paint.metalness = damp(mats.paint.metalness, f.metalness, 6, dt);
    mats.paint.roughness = damp(mats.paint.roughness, f.roughness, 6, dt);
    mats.paint.clearcoat = damp(mats.paint.clearcoat, f.clearcoat, 6, dt);
    mats.paint.clearcoatRoughness = damp(mats.paint.clearcoatRoughness, f.clearcoatRoughness, 6, dt);
    mats.paint.envMapIntensity = damp(mats.paint.envMapIntensity, f.env + 0.7 * hb, 6, dt);
    mats.pearl.value = damp(mats.pearl.value, vIndex === 0 ? 1 : 0, 6, dt);
    mats.accent.color.lerp(tgt.a.set(f.accent), k);
    mats.accent.metalness = damp(mats.accent.metalness, f.accentMetal, 6, dt);
    mats.accent.roughness = damp(mats.accent.roughness, f.accentRough, 6, dt);
    mats.interior.color.lerp(tgt.i.set(f.interior), k);

    // ── lights: DRL/headlights at .01, tail-light signature at .03 ──
    mats.front.emissiveIntensity = (0.8 + anim.glow * 2.0) * (1 + lh);
    mats.rear.emissiveIntensity = (0.5 + anim.rear * 3.4) * (1 + lh) + lh * 1.6;
    mats.signal.emissiveIntensity = 0.25 + lh * 1.2;
    halo.uniforms.uA.value = anim.rear;
    redPool.uniforms.uA.value = anim.rear * 0.55;
    beam.uniforms.uA.value = smoothstep(0.3, 1, anim.glow) * 0.7;

    const x = bridge.state.extra;
    x.exploded = Number(anim.explode.toFixed(3));
    x.rearLight = Number(anim.rear.toFixed(3));
    x.hoverPart = hovered.current ?? '';
  });

  // light decals placed from the real lamp bounding boxes
  const tailC = rig.tail.getCenter(new THREE.Vector3());
  const tailS = rig.tail.getSize(new THREE.Vector3());
  const headC = rig.head.getCenter(new THREE.Vector3());
  const fx = (m: THREE.Object3D) => m.layers.set(FX_LAYER);

  return (
    <group
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
        bind.onPointerOut();
      }}
    >
      <primitive object={rig.car} />
      <mesh geometry={skate.g} material={skate.m} raycast={noRay} onUpdate={fx} />
      {/* baked contact shadow (closed ↔ open cross-fade) */}
      <mesh material={shadow.display} rotation-x={-Math.PI / 2} scale={[1, -1, 1]} position-y={0.006} raycast={noRay} onUpdate={fx} renderOrder={1}>
        <planeGeometry args={[SH.w, SH.h]} />
      </mesh>
      {/* .03 tail-light halo + red spill on the asphalt */}
      <mesh material={halo} position={[rig.tail.min.x - 0.05, tailC.y, tailC.z]} rotation-y={-Math.PI / 2} raycast={noRay} onUpdate={fx}>
        <planeGeometry args={[Math.max(1.2, tailS.z * 1.35), 0.26]} />
      </mesh>
      <mesh material={redPool} position={[carDims.tailX - 0.35, 0.012, tailC.z]} rotation-x={-Math.PI / 2} raycast={noRay} onUpdate={fx}>
        <planeGeometry args={[1.5, Math.max(1.6, tailS.z * 1.45)]} />
      </mesh>
      {/* .01 headlight spill ahead of the nose */}
      <mesh material={beam} position={[rig.head.max.x + 2.2, 0.012, headC.z]} rotation-x={-Math.PI / 2} raycast={noRay} onUpdate={fx}>
        <planeGeometry args={[4.6, 2.6]} />
      </mesh>
    </group>
  );
}

useGLTF.preload(CAR_URL, false, false);
