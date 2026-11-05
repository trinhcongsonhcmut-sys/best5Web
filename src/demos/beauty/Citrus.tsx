/**
 * The v2 still-life cast around the bottle (replaces v1's aloe blades):
 *   HeroCitrus — a half-wheel, a wheel, a wedge and a big half framing the hero; they part over the first 20 % of
 *                the scroll (and when the visitor orbits high/low, like the v1 blades)
 *   Bokeh      — out-of-focus citrus impostors (photographic depth of field): foreground corners + one far behind
 *   Splash     — round ropes of water bursting from the big half across the bottle base, tearing into ligaments
 *                + drops; retracts mid-story (drops linger at the unveil), returns at the ritual
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bridge } from '../../lib/bridge';
import { damp, smoothstep } from '../../lib/math';
import { scrollState } from '../../lib/scroll';
import { pose } from './anim';
import { look } from './palette';
import { halfGeometries, sliceGeometries, streamGeometry } from './geometry';
import { citrusTextures, fleshMaterial, rindMaterial, skipTransmissionPass, waterMaterial } from './materials';
import { bokehSliceTexture } from './textures';
import { rig, steadyHover, warm } from './rig';
import { useHoverRim } from '../../lib/rim';

type V3 = [number, number, number];
interface Piece {
  kind: 'slice' | 'half';
  pos: V3;
  rot: V3;
  R: number;
  /** wheel = 2π, half-wheel = π, wedge < π */
  span?: number;
  /** where it goes when parting (added to pos at k = 1) */
  out: V3;
  spin: number;
  /** share of the parting it holds back during the unveil beat (keeps the 25 % frame layered) */
  stay?: number;
}

// hero set (bottle-local world units; camera looks from +Z). Behind/around the bottle like the v2 reference.
const PIECES: Piece[] = [
  // half-wheel top right (the reference's hero wedge), straight cut toward the bottle
  { kind: 'slice', pos: [0.58, 1.5, -0.52], rot: [1.2, 2.4, 0.12], R: 0.6, span: Math.PI, out: [1.9, 1.3, -0.2], spin: 1.2, stay: 0.5 },
  { kind: 'slice', pos: [-0.62, 0.98, -0.34], rot: [1.25, 0.75, 1.05], R: 0.46, out: [-1.9, -1.3, 0.3], spin: -1.4 },
  { kind: 'half', pos: [0.74, 0.2, -0.34], rot: [1.08, -0.15, -0.38], R: 0.6, out: [1.8, -1.4, 0.3], spin: 0.8, stay: 0.5 },
  // small wedge low left, in front of the splash
  { kind: 'slice', pos: [-0.62, 0.14, 0.2], rot: [1.0, 0.4, 0.5], R: 0.36, span: 1.3, out: [-1.5, -1.4, 0.4], spin: -1.0 },
];

function useCitrusMats(rim = false) {
  const m = useMemo(() => {
    // two different generated flesh textures (segment count, sac size) alternate between pieces
    const r = { flesh: fleshMaterial(rim, 0), flesh2: fleshMaterial(rim, 1), rind: rindMaterial([9, 0.4], rim), dome: rindMaterial([7, 2.2], rim) };
    Object.values(r).forEach((x) => skipTransmissionPass(x.material));
    return r;
  }, [rim]);
  useEffect(
    () => () => {
      m.flesh.material.dispose();
      m.flesh2.material.dispose();
      m.rind.material.normalMap?.dispose();
      m.rind.material.dispose();
      m.dome.material.normalMap?.dispose();
      m.dome.material.dispose();
    },
    [m],
  );
  return m;
}

export function HeroCitrus() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const mats = useCitrusMats(true);
  const rims = useMemo(() => [mats.flesh.uniforms!, mats.flesh2.uniforms!, mats.rind.uniforms!, mats.dome.uniforms!], [mats]);
  const { bind, value: hover } = useHoverRim(() => rims, 'citrus-hero', 1);
  const geos = useMemo(
    () =>
      PIECES.map((p, i) => {
        if (p.kind === 'slice') {
          const g = sliceGeometries(p.R, p.R * 0.2, p.span ?? Math.PI * 2, i + 1, i * 1.73);
          return { a: g.face, b: g.rind };
        }
        const g = halfGeometries(p.R, i * 1.73);
        return { a: g.face, b: g.dome };
      }),
    [],
  );
  useEffect(() => () => geos.forEach((g) => { g.a.dispose(); g.b.dispose(); }), [geos]);

  // juice/water beads clinging to every cut face (wet product-shot look)
  const wet = useMemo(() => {
    const mat = waterMaterial();
    const geo = new THREE.SphereGeometry(1, 14, 10);
    let sd = 41;
    const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const m = new THREE.Matrix4();
    const per = PIECES.map((p) => {
      const top = p.kind === 'half' ? 0.004 : p.R * 0.1 + 0.004;
      const span = p.span ?? Math.PI * 2;
      return Array.from({ length: 9 }, () => {
        const a = rnd() * span;
        const r = Math.sqrt(rnd()) * p.R * 0.82;
        const b = 0.007 + Math.pow(rnd(), 2) * 0.02;
        return m.clone().compose(new THREE.Vector3(Math.cos(a) * r, top + b * 0.35, Math.sin(a) * r), new THREE.Quaternion(), new THREE.Vector3(b, b * 0.55, b));
      });
    });
    return { mat, geo, per };
  }, []);
  useEffect(() => () => { wet.mat.material.dispose(); wet.geo.dispose(); }, [wet]);
  const setWet = (i: number) => (el: THREE.InstancedMesh | null) => {
    if (!el || el.userData.done) return;
    wet.per[i].forEach((mm, k) => el.setMatrixAt(k, mm));
    el.instanceMatrix.needsUpdate = true;
    el.userData.done = true;
  };

  const lift = useRef(0);
  const { size } = useThree();
  const portrait = size.width / Math.max(1, size.height) < 0.85;
  useFrame(({ clock, camera }, delta) => {
    const t = clock.elapsedTime;
    // orbiting high or low parts the set too (as the v1 blades did), so nothing pokes through the view
    const tg = bridge.state.camera.target;
    const dy = camera.position.y - tg[1];
    const dist = Math.hypot(camera.position.x - tg[0], dy, camera.position.z - tg[2]) || 1;
    const elev = Math.asin(Math.max(-1, Math.min(1, dy / dist)));
    lift.current = damp(lift.current, smoothstep(0.26, 0.52, elev) + smoothstep(-0.02, -0.12, elev), 6, Math.min(delta, 0.05));
    const k = Math.min(1, Math.max(pose(scrollState.smooth).slicePart, lift.current));
    const eAll = k * k * (3 - 2 * k);
    const sp = scrollState.smooth;
    const hold = ease3(win(0.1, 0.18, sp)) * (1 - ease3(win(0.32, 0.42, sp)));
    // gentle permanent back-rim on the fruit (studio edge light) + the hover lift on top
    const h = hover.current;
    rims.forEach((u) => (u.uRim.value = 0.2 + h * 0.9));
    wet.mat.fade.value = 1 - eAll * (1 - 0.5 * hold);
    PIECES.forEach((p, i) => {
      const g = refs.current[i];
      if (!g) return;
      const e = eAll * (1 - (p.stay ?? 0) * hold);
      const fl = Math.sin(t * 0.5 + i * 1.7) * 0.025;
      const sx = portrait ? 0.62 : 1;
      g.position.set((p.pos[0] + p.out[0] * e) * sx, p.pos[1] + p.out[1] * e + fl - (portrait ? 0.1 : 0), p.pos[2] + p.out[2] * e);
      g.rotation.set(p.rot[0] + Math.sin(t * 0.33 + i) * 0.04, p.rot[1] + p.spin * e, p.rot[2] + Math.cos(t * 0.29 + i) * 0.04);
      g.scale.setScalar((portrait ? 0.8 : 1) * (1 + 0.035 * h));
      g.visible = e < 0.999 || warm.on;
    });
  });

  return (
    <group {...steadyHover(bind)}>
      {PIECES.map((p, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <mesh geometry={geos[i].a} material={i % 2 ? mats.flesh2.material : mats.flesh.material} />
          <mesh geometry={geos[i].b} material={p.kind === 'slice' ? mats.rind.material : mats.dome.material} />
          <instancedMesh ref={setWet(i)} args={[wet.geo, wet.mat.material, 9]} renderOrder={7} raycast={() => null} />
        </group>
      ))}
    </group>
  );
}

/* ───────── photographic foreground bokeh ───────── */
interface Bk {
  /** screen position in viewport fractions (−0.5..0.5), size as a fraction of the view height */
  x: number;
  y: number;
  s: number;
  rot: number;
  /** push direction while parting */
  ox: number;
  oy: number;
  alpha: number;
  /** far = behind the bottle and the word (depth-tested, drawn first) */
  far?: boolean;
  /** share that stays in frame through the middle of the story (keeps the unveil shot rich) */
  stay?: number;
}
const BOKEH: Bk[] = [
  { x: -0.43, y: -0.4, s: 0.62, rot: 0.3, ox: -0.45, oy: -0.35, alpha: 0.92 },
  { x: 0.45, y: 0.4, s: 0.46, rot: 1.6, ox: 0.4, oy: 0.4, alpha: 0.82, stay: 0.55 },
  { x: 0.53, y: -0.08, s: 0.38, rot: 2.4, ox: 0.4, oy: 0.0, alpha: 0.8 },
  { x: -0.33, y: 0.12, s: 0.2, rot: 0.9, ox: -0.2, oy: 0.1, alpha: 0.5, far: true, stay: 1 },
  { x: 0.3, y: -0.3, s: 0.16, rot: 2.1, ox: 0.2, oy: -0.1, alpha: 0.45, far: true, stay: 1 },
];

export function Bokeh() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const { tex, mats, geo } = useMemo(() => {
    const tex = bokehSliceTexture(citrusTextures().face, 512, 15);
    const make = (b: Bk) => new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: !!b.far,
      uniforms: { map: { value: tex }, uRind: { value: look.rind }, uPulp: { value: look.pulp }, uPith: { value: look.pith }, uAlpha: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform vec3 uRind; uniform vec3 uPulp; uniform vec3 uPith; uniform float uAlpha; varying vec2 vUv;
        void main(){
          vec4 m = texture2D(map, vUv);
          float r = length(vUv - 0.5) * 2.0;
          vec3 c = mix(mix(uPith, uPulp, 0.12), uPulp * (0.62 + 0.5 * m.r) * mix(1.1, 0.88, r), clamp(m.g, 0.0, 1.0));
          c = mix(c, uRind * 0.95, clamp(m.b, 0.0, 1.0));
          // defocused highlights bloom a touch toward the centre (backlit fruit)
          c *= 1.0 + 0.12 * (1.0 - r);
          gl_FragColor = vec4(c, m.a * uAlpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    return { tex, mats: BOKEH.map((b) => make(b)), geo: new THREE.PlaneGeometry(1, 1) };
  }, []);
  useEffect(() => () => { tex.dispose(); mats.forEach((m) => m.dispose()); geo.dispose(); }, [tex, mats, geo]);
  const tmp = useMemo(() => ({ dir: new THREE.Vector3(), up: new THREE.Vector3(), right: new THREE.Vector3(), p: new THREE.Vector3() }), []);

  useFrame(({ camera, size, clock }) => {
    const cam = camera as THREE.PerspectiveCamera;
    const a = pose(scrollState.smooth);
    const k = 1 - a.splash; // 0 = framed, 1 = pushed out of frame
    const eAll = k * k * (3 - 2 * k);
    const portrait = size.width / Math.max(1, size.height) < 0.85;
    cam.getWorldDirection(tmp.dir);
    tmp.up.setFromMatrixColumn(cam.matrixWorld, 1);
    tmp.right.setFromMatrixColumn(cam.matrixWorld, 0);
    const tanH = 2 * Math.tan((cam.fov * Math.PI) / 360);
    const t = clock.elapsedTime;
    BOKEH.forEach((b, i) => {
      const m = refs.current[i];
      if (!m) return;
      const e = eAll * (1 - (b.stay ?? 0));
      const D = b.far ? cam.position.distanceTo(rig.jarCenter) + 3.4 : 2.0;
      const visH = tanH * D;
      const visW = visH * cam.aspect;
      const sc = b.s * visH * (portrait ? 0.7 : 1);
      const x = (b.x + b.ox * e) * visW + Math.sin(t * 0.21 + i) * 0.01;
      const y = (b.y + b.oy * e) * visH + Math.cos(t * 0.17 + i * 2) * 0.01;
      m.position.copy(cam.position).addScaledVector(tmp.dir, D).addScaledVector(tmp.right, x).addScaledVector(tmp.up, y);
      m.quaternion.copy(cam.quaternion);
      m.rotateZ(b.rot + t * 0.02 * (i % 2 ? 1 : -1));
      m.scale.set(sc, sc, 1);
      mats[i].uniforms.uAlpha.value = b.alpha * (1 - e);
      m.visible = e < 0.995 || warm.on;
    });
  });
  return (
    <group>
      {BOKEH.map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={geo} material={mats[i]} renderOrder={BOKEH[i].far ? -20 : 60} frustumCulled={false} raycast={() => null} />
      ))}
    </group>
  );
}

/* ───────── water splash ───────── */
interface Stream {
  pts: V3[];
  r0: number;
  r1: number;
  /** fraction of the length (from the tip) that breaks into ligaments + drops */
  brk?: number;
}
/**
 * The splash bursts out of the big half (impact point I, front-right of the bottle base), runs ACROSS the front of
 * the base to the left and climbs both visible sides — round ropes of water (no flat sheets) whose radius swells,
 * pinches and tears into ligaments and spherical drops. Bottle-local (base centre = origin).
 */
const I: V3 = [0.42, 0.16, 0.14];
const STREAMS: Stream[] = [
  // across the front of the base, curling up on the left
  { pts: [I, [0.02, 0.05, 0.48], [-0.45, 0.12, 0.47], [-0.86, 0.36, 0.3], [-1.06, 0.72, 0.12], [-1.0, 1.02, 0.02]], r0: 0.07, r1: 0.016, brk: 0.38 },
  // lower rope skimming under it
  { pts: [I, [0.06, -0.08, 0.42], [-0.5, -0.07, 0.4], [-0.96, 0.08, 0.22], [-1.26, 0.28, 0.06]], r0: 0.05, r1: 0.012, brk: 0.45 },
  // rising jet between the bottle and the right-hand fruit
  { pts: [I, [0.56, 0.52, 0.18], [0.62, 0.95, 0.08], [0.5, 1.3, -0.02], [0.4, 1.52, -0.08]], r0: 0.062, r1: 0.014, brk: 0.4 },
  // thrown out to the right over the half
  { pts: [I, [0.86, 0.34, 0.24], [1.22, 0.58, 0.14], [1.4, 0.94, 0.02]], r0: 0.05, r1: 0.012, brk: 0.45 },
  // climbing the left side of the bottle in front of the left wheel
  { pts: [[-0.3, 0.12, 0.2], [-0.62, 0.6, 0.02], [-0.72, 1.06, -0.1], [-0.58, 1.44, -0.18]], r0: 0.055, r1: 0.012, brk: 0.4 },
  // drips falling off the half's lower rim
  { pts: [[0.7, -0.08, 0.22], [0.72, -0.26, 0.24], [0.71, -0.46, 0.22]], r0: 0.026, r1: 0.012, brk: 0.6 },
  { pts: [[0.98, -0.02, 0.12], [1.0, -0.18, 0.12], [1.0, -0.34, 0.1]], r0: 0.02, r1: 0.01, brk: 0.6 },
  // small curls off the shoulders
  { pts: [[-0.36, 1.28, 0.2], [-0.54, 1.5, 0.14], [-0.5, 1.74, 0.06]], r0: 0.026, r1: 0.008 },
  { pts: [[0.4, 1.4, 0.12], [0.55, 1.58, 0.1], [0.52, 1.78, 0.04]], r0: 0.022, r1: 0.007 },
];
/** short ligaments fanning straight out of the impact (the burst/crown read) */
const LIGAMENTS: Stream[] = Array.from({ length: 8 }, (_, k) => {
  const a = 0.25 + (k / 7) * 2.5 + Math.sin(k * 2.3) * 0.1;
  const L = 0.22 + 0.24 * (0.5 + 0.5 * Math.sin(k * 1.9 + 0.7));
  const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.95 + 0.15, 0.35 + 0.25 * Math.sin(k * 1.3)).normalize();
  const p0 = new THREE.Vector3(...I);
  const p1 = p0.clone().addScaledVector(dir, L * 0.55);
  const p2 = p0.clone().addScaledVector(dir, L).add(new THREE.Vector3(0, -0.05, 0));
  return { pts: [p0.toArray(), p1.toArray(), p2.toArray()] as V3[], r0: 0.032 + 0.01 * Math.sin(k), r1: 0.006, brk: 0.55 };
});
/** small burst where the top half-wheel was cut (reference: top-right splash) */
const BURST_AT: V3 = [0.56, 1.34, -0.3];
const BURST: Stream[] = Array.from({ length: 6 }, (_, k) => {
  const a = -0.4 + (k / 5) * 2.4 + Math.sin(k * 2.7) * 0.12;
  const L = 0.22 + 0.2 * (0.5 + 0.5 * Math.sin(k * 1.9 + 0.4));
  const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.9 + 0.35, 0.3 + Math.sin(k * 1.3) * 0.25).normalize();
  const p0 = new THREE.Vector3(...BURST_AT);
  const p1 = p0.clone().addScaledVector(dir, L * 0.55);
  const p2 = p0.clone().addScaledVector(dir, L).add(new THREE.Vector3(0, -0.07, 0));
  return { pts: [p0.toArray(), p1.toArray(), p2.toArray()] as V3[], r0: 0.026 + 0.006 * Math.sin(k), r1: 0.006, brk: 0.55 };
});
const BEADS = 110;
const ease3 = (x: number) => x * x * (3 - 2 * x);
const win = (a: number, b: number, p: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

export function Splash() {
  const group = useRef<THREE.Group>(null);
  const spray = useRef<THREE.Group>(null);
  const beads = useRef<THREE.InstancedMesh>(null);
  const res = useMemo(() => {
    const water = waterMaterial();
    const drops = waterMaterial();
    const all = [...STREAMS, ...LIGAMENTS, ...BURST];
    const geos = all.map((s, i) => streamGeometry(s.pts, s.r0, s.r1, 1, i + 1, s.pts.length > 3 ? 110 : 40, 14, s.brk ?? 0.35));
    const bead = new THREE.SphereGeometry(1, 16, 12);
    let sd = 21;
    const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const items: { p: THREE.Vector3; s: number; st: number; ph: number }[] = [];
    const P = new THREE.Vector3();
    all.forEach((s) => {
      const curve = new THREE.CatmullRomCurve3(s.pts.map((q) => new THREE.Vector3(...q)), false, 'centripetal');
      const end = curve.getPointAt(1);
      const dir = curve.getTangentAt(1);
      // drops detaching from the tip, shrinking as they fly off
      for (let k = 1; k <= 3; k++) items.push({ p: end.clone().addScaledVector(dir, 0.04 * k + 0.012 * k * k), s: s.r1 * (1.7 - k * 0.35) + 0.004, st: 1.25, ph: rnd() * 6 });
      // spray thrown sideways off the breaking half of each rope
      if (s.pts.length > 3)
        for (let k = 0; k < 5; k++) {
          curve.getPointAt(0.45 + rnd() * 0.55, P);
          items.push({ p: P.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.26, (rnd() - 0.2) * 0.22, (rnd() - 0.3) * 0.16)), s: 0.006 + Math.pow(rnd(), 2) * 0.028, st: 1 + rnd() * 0.25, ph: rnd() * 6 });
        }
    });
    while (items.length < BEADS) {
      const p = new THREE.Vector3((rnd() - 0.5) * 3.0, -0.35 + rnd() * 2.5, (rnd() - 0.4) * 0.9);
      if (Math.hypot(p.x, p.z) < 0.42 && p.y < 1.85) continue;
      if (Math.abs(p.x) < 0.48 && p.z > -0.1 && p.y < 1.9 && p.y > 0.5) continue;
      items.push({ p, s: 0.004 + Math.pow(rnd(), 2.6) * 0.036, st: 1 + rnd() * 0.3, ph: rnd() * 6 });
    }
    return { water, drops, geos, bead, items };
  }, []);
  useEffect(
    () => () => {
      res.geos.forEach((g) => g.dispose());
      res.bead.dispose();
      res.water.material.dispose();
      res.drops.material.dispose();
    },
    [res],
  );
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), e: new THREE.Euler() }), []);

  useFrame(({ clock }) => {
    const g = group.current;
    const sp = spray.current;
    if (!g || !sp) return;
    const t = clock.elapsedTime;
    const p = scrollState.smooth;
    const a = pose(p);
    const k = a.splash;
    const e = ease3(k);
    // the unveil beat keeps a veil of drops hanging around the bottle (fuller 25 % frame)
    const hang = 0.75 * ease3(win(0.1, 0.18, p)) * (1 - ease3(win(0.32, 0.42, p)));
    g.visible = k > 0.002 || warm.on;
    sp.visible = k > 0.002 || hang > 0.002 || warm.on;
    // sits on the bottle's base (follows the final slide onto the pedestal, ignores the mid-story tilt)
    g.position.set(rig.jarCenter.x, 0, rig.jarCenter.z);
    sp.position.copy(g.position);
    g.scale.set(0.35 + 0.65 * e, 0.2 + 0.8 * e, 0.35 + 0.65 * e);
    g.rotation.y = Math.sin(t * 0.23) * 0.03 + (1 - e) * 0.6;
    const ds = Math.max(e, hang);
    sp.scale.set(0.5 + 0.5 * ds, 0.5 + 0.5 * ds, 0.5 + 0.5 * ds);
    sp.rotation.y = g.rotation.y * (e >= hang ? 1 : 0.3);
    res.water.fade.value = Math.pow(e, 1.4);
    res.drops.fade.value = Math.max(Math.pow(e, 1.4), hang);
    const b = beads.current;
    if (b) {
      res.items.forEach((it, i) => {
        tmp.p.copy(it.p);
        // slow fall + sway while hanging in the unveil shot, a gentle bob otherwise
        tmp.p.y += Math.sin(t * 0.6 + it.ph) * 0.012 - hang * (((t * 0.08 + it.ph) % 1) * 0.25);
        tmp.e.set(Math.sin(it.ph) * 0.6, 0, Math.cos(it.ph) * 0.6);
        tmp.q.setFromEuler(tmp.e);
        tmp.s.set(it.s, it.s * it.st, it.s);
        tmp.m.compose(tmp.p, tmp.q, tmp.s);
        b.setMatrixAt(i, tmp.m);
      });
      b.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={group}>
        {res.geos.map((geo, i) => (
          <mesh key={i} geometry={geo} material={res.water.material} renderOrder={6} raycast={() => null} />
        ))}
      </group>
      <group ref={spray}>
        <instancedMesh ref={beads} args={[res.bead, res.drops.material, res.items.length]} renderOrder={7} raycast={() => null} frustumCulled={false} />
      </group>
    </>
  );
}
