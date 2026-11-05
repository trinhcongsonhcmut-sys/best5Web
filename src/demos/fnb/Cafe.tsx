/**
 * Scene A — Cafe. Levitating cappuccino (lathe cup + swept handle + latte-art crema + floating saucer),
 * soft procedural steam, and ~180 instanced roasted beans whose layout morphs with scroll:
 * scattered in depth → orbiting the cup → a horizontal corkscrew "wind" that carries the cafe away.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { useHoverRim, type RimUniforms } from '../../lib/rim';
import { lerp, range, smoothstep } from '../../lib/math';
import { makeBeanGeometry, makeCupGeometry, makeHandleGeometry, makeLatteTexture, makeSaucerGeometry } from './geometry';
import { cupExit } from './timeline';
import { glazeRim, hoverResets } from './hover';

/* ───────── steam ───────── */
const steamVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const steamFrag = /* glsl */ `
uniform float uTime, uOpacity, uSeed;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec2 uv = vUv;
  float t = uTime * 0.32 + uSeed * 10.0;
  float sway = (fbm(vec2(uv.y * 1.8 - t, uSeed * 3.0)) - 0.5) * 0.55 * uv.y;
  float x = uv.x - 0.5 - sway;
  float width = mix(0.05, 0.3, uv.y);
  float body = smoothstep(width, 0.0, abs(x));
  float n = fbm(vec2(x * 4.5 + uSeed, uv.y * 2.6 - t * 1.7));
  float a = body * smoothstep(0.38, 0.78, n) * smoothstep(0.0, 0.18, uv.y) * smoothstep(1.0, 0.5, uv.y);
  gl_FragColor = vec4(vec3(1.0, 0.96, 0.9), a * uOpacity);
}
`;

function Steam({ anchor }: { anchor: React.RefObject<THREE.Group | null> }) {
  const group = useRef<THREE.Group>(null);
  const mats = useMemo(
    () =>
      [0, 1, 2].map(
        (i) =>
          new THREE.ShaderMaterial({
            vertexShader: steamVert,
            fragmentShader: steamFrag,
            transparent: true,
            depthWrite: false,
            uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uSeed: { value: i * 1.7 + 0.3 } },
          }),
      ),
    [],
  );
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.5, 1.15);
    g.translate(0, 0.575, 0);
    return g;
  }, []);
  useEffect(
    () => () => {
      mats.forEach((m) => m.dispose());
      geo.dispose();
    },
    [mats, geo],
  );
  const wp = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    const g = group.current;
    const a = anchor.current;
    if (!g || !a) return;
    const p = scrollState.smooth;
    a.getWorldPosition(wp);
    g.position.copy(wp);
    g.quaternion.copy(state.camera.quaternion);
    const op = (0.55 + 0.35 * smoothstep(0.05, 0.25, p)) * (1 - smoothstep(0.3, 0.4, p));
    g.visible = op > 0.01;
    mats.forEach((m) => {
      m.uniforms.uTime.value = state.clock.elapsedTime;
      m.uniforms.uOpacity.value = op;
    });
  });
  return (
    <group ref={group}>
      <mesh geometry={geo} material={mats[0]} position={[-0.06, 0, 0]} renderOrder={5} />
      <mesh geometry={geo} material={mats[1]} position={[0.09, 0.05, 0.02]} scale={[0.8, 0.9, 1]} renderOrder={5} />
      <mesh geometry={geo} material={mats[2]} position={[0.0, 0.1, -0.02]} scale={[1.15, 1.2, 1]} renderOrder={5} />
    </group>
  );
}

/* ───────── cup ───────── */
export function Cup({ glaze, glazeU, saucerGlaze, saucerU }: { glaze: THREE.MeshPhysicalMaterial; glazeU: RimUniforms; saucerGlaze: THREE.MeshPhysicalMaterial; saucerU: RimUniforms }) {
  const root = useRef<THREE.Group>(null);
  const cup = useRef<THREE.Group>(null);
  const saucer = useRef<THREE.Mesh>(null);
  const steamAnchor = useRef<THREE.Group>(null);
  const { cupGeo, handleGeo, saucerGeo, coffeeGeo, latte, coffeeMat } = useMemo(() => {
    const latte = makeLatteTexture();
    return {
      cupGeo: makeCupGeometry(),
      handleGeo: makeHandleGeometry(),
      saucerGeo: makeSaucerGeometry(),
      coffeeGeo: new THREE.CircleGeometry(0.405, 64),
      latte,
      coffeeMat: new THREE.MeshPhysicalMaterial({ map: latte, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color('#fff1dc') }),
    };
  }, []);
  useEffect(
    () => () => {
      [cupGeo, handleGeo, saucerGeo, coffeeGeo].forEach((g) => g.dispose());
      latte.dispose();
      coffeeMat.dispose();
    },
    [cupGeo, handleGeo, saucerGeo, coffeeGeo, latte, coffeeMat],
  );

  // cup and saucer light up independently: Fresnel rim + warm emissive lift
  const hover = useHoverRim(() => [glazeU], 'cup', 0.6);
  const hoverS = useHoverRim(() => [saucerU], 'saucer', 0.6);
  useEffect(() => {
    const a = hover.bind.onPointerOut;
    const b2 = hoverS.bind.onPointerOut;
    hoverResets.add(a);
    hoverResets.add(b2);
    return () => {
      hoverResets.delete(a);
      hoverResets.delete(b2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // three.js still raycasts invisible meshes → ignore the cup once it has left the frame
  const gate = (fn: (e: ThreeEvent<PointerEvent>) => void) => (e: ThreeEvent<PointerEvent>) => {
    if (cupExit(scrollState.smooth) < 0.6) fn(e);
  };
  const cupOver = hover.bind.onPointerOver;
  const saucerOver = hoverS.bind.onPointerOver;
  const rearm = (fn: (e: ThreeEvent<PointerEvent>) => void) => (e: ThreeEvent<PointerEvent>) => {
    if (e.pointerType !== 'touch') gate(fn)(e);
  };
  const bind = useMemo(() => ({ onPointerOver: gate(cupOver), onPointerMove: rearm(cupOver), onPointerOut: hover.bind.onPointerOut }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const bindS = useMemo(() => ({ onPointerOver: gate(saucerOver), onPointerMove: rearm(saucerOver), onPointerOut: hoverS.bind.onPointerOut }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    const p = scrollState.smooth;
    const t = state.clock.elapsedTime;
    const e = cupExit(p);
    glazeRim(glaze, glazeU, hover.value.current, 0.12);
    glazeRim(saucerGlaze, saucerU, hoverS.value.current, 0.12);
    const r = root.current;
    const c = cup.current;
    const s = saucer.current;
    if (!r || !c || !s) return;
    r.visible = e < 0.999;
    const turn = range(0, 0.4, p);
    c.rotation.set(0.2 - 0.12 * turn + e * 0.9, -0.75 + turn * 2.6 + e * 1.2, -0.06 + e * 0.5);
    c.position.set(lerp(0, 0.4, e), -0.27 + 0.025 * Math.sin(t * 1.1) + e * e * 5.5, 0);
    c.scale.setScalar(1 - 0.35 * e);
    s.position.set(0, -0.42 + 0.018 * Math.sin(t * 1.1 + 0.9) - e * e * 5.5, 0);
    s.rotation.set(0.16 - 0.1 * turn - e * 0.6, turn * 1.2, 0.04 + e * 0.4);
  });

  return (
    <group ref={root}>
      <group ref={cup} {...bind}>
        <mesh geometry={cupGeo} material={glaze} castShadow />
        <mesh geometry={handleGeo} material={glaze} />
        <mesh geometry={coffeeGeo} material={coffeeMat} position={[0, 0.552, 0]} rotation={[-Math.PI / 2, 0, 0.75]} />
        <group ref={steamAnchor} position={[0, 0.6, 0]} />
      </group>
      <mesh ref={saucer} geometry={saucerGeo} material={saucerGlaze} {...bindS} />
      <Steam anchor={steamAnchor} />
    </group>
  );
}

/* ───────── beans ───────── */
const BEANS = 180;

export function Beans() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { geo, mat, data } = useMemo(() => {
    const geo = makeBeanGeometry();
    const mat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.35 });
    let seed = 11;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const data = Array.from({ length: BEANS }, () => {
      const side = rnd() < 0.5 ? -1 : 1;
      const front = rnd() < 0.14;
      const join = rnd() < 0.55;
      const pa = rnd() * Math.PI * 2;
      const pb = rnd() * 2 - 1;
      return {
        // scattered (hero): keep the centre clear for the cup, spread wide and deep
        sx: side * (1.05 + rnd() * 3.6),
        sy: (rnd() - 0.5) * 3.4,
        sz: front ? 1.4 + rnd() * 1.6 : -4 + rnd() * 5,
        // orbit (25%)
        or: 0.85 + rnd() * 0.6,
        oa: rnd() * Math.PI * 2,
        oh: -0.6 + rnd() * 1.35,
        ot: (rnd() - 0.5) * 0.7,
        ospd: 0.6 + rnd() * 0.8,
        // wind corkscrew (transition)
        wf: rnd(),
        wr: 0.25 + rnd() * 1.25,
        wa: rnd() * Math.PI * 2,
        // look
        scale: 0.055 + rnd() * 0.02,
        rx: rnd() * 6.28,
        ry: rnd() * 6.28,
        rz: rnd() * 6.28,
        spin: 0.6 + rnd() * 1.6,
        lag: rnd() * 0.05,
        tone: rnd(),
        join,
        // only ~1/4 of the beans ride the transition wind; the rest bow out so the fork hero reads
        wind: false,
        push: [Math.cos(pa) * Math.sqrt(1 - pb * pb), pb, Math.sin(pa) * Math.sqrt(1 - pb * pb)] as [number, number, number],
      };
    });
    data.forEach((d, i) => (d.wind = i % 4 === 0));
    return { geo, mat, data };
  }, []);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dark = new THREE.Color('#2c170c');
    const light = new THREE.Color('#6a3b1e');
    const c = new THREE.Color();
    data.forEach((d, i) => {
      c.copy(dark).lerp(light, d.tone * 0.85);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [data]);

  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );

  const o = useMemo(() => new THREE.Object3D(), []);
  const push = useMemo(() => new Float32Array(BEANS), []);
  // beans never sit on top of the small copy: DOM boxes of the active kicker/description (+24 px), refreshed 4×/s
  const hide = useMemo(() => new Float32Array(BEANS), []);
  const textBoxes = useRef<number[]>([]);
  const lastQuery = useRef(-1);
  const sp2 = useMemo(() => new THREE.Vector3(), []);
  const [L, P, Q, cupC] = useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(0, -0.12, 0)], []);
  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const p = scrollState.smooth;
    const t = state.clock.elapsedTime;
    const gone = smoothstep(0.47, 0.56, p);
    const dt = Math.min(delta, 0.05);
    const cam = state.camera.position;
    if (state.clock.elapsedTime - lastQuery.current > 0.25) {
      lastQuery.current = state.clock.elapsedTime;
      const boxes: number[] = [];
      const cr = state.gl.domElement.getBoundingClientRect();
      document.querySelectorAll('.fnb-split.on .sub, .fnb-split.on .kick').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width > 0) boxes.push(b.left - cr.left - 24, b.top - cr.top - 24, b.right - cr.left + 24, b.bottom - cr.top + 24);
      });
      textBoxes.current = boxes;
    }
    const boxes = textBoxes.current;
    const W = state.size.width;
    const H = state.size.height;
    m.visible = gone < 0.999;
    if (!m.visible) return;
    for (let i = 0; i < BEANS; i++) {
      const d = data[i];
      const w01 = d.join ? smoothstep(0.05 + d.lag, 0.24 + d.lag, p) : 0;
      const w12 = smoothstep(0.33 + d.lag, 0.45 + d.lag, p);
      const leave = d.wind ? 0 : smoothstep(0.34 + d.lag, 0.44 + d.lag, p);
      // scattered
      const bob = 0.06 * Math.sin(t * 0.6 + d.oa * 3);
      let x = d.sx + 0.08 * Math.sin(t * 0.25 + d.wa);
      let y = d.sy + bob;
      let z = d.sz;
      // orbit around the cup
      const th = d.oa + p * 7 * d.ospd + t * 0.05;
      const ox = Math.cos(th) * d.or;
      const oz = Math.sin(th) * d.or;
      const oy = d.oh + Math.sin(th) * d.or * d.ot + bob * 0.5;
      x = lerp(x, ox, w01);
      y = lerp(y, oy, w01);
      z = lerp(z, oz, w01);
      // horizontal corkscrew wind streaming left → right across the frame
      let fadeX = 1;
      if (w12 > 0 && d.wind) {
        const f = (d.wf + (p - 0.33) * 2.4) % 1;
        const wx = lerp(-5.5, 5.5, f);
        const wa = d.wa + wx * 1.4 + p * 10;
        // the stream passes BEHIND the hero (z < 0) and above the plate, never through the copy on the left
        const wy = 0.55 + wx * 0.12 + Math.cos(wa) * d.wr * 0.55;
        const wz = -1.5 + Math.sin(wa) * d.wr * 0.7;
        fadeX = smoothstep(-1.5, -0.6, wx);
        x = lerp(x, wx, w12);
        y = lerp(y, wy, w12);
        z = lerp(z, wz, w12);
      }
      // keep the cup's mouth and body readable: beans between the camera and the cup are pushed off that sight line
      if (w01 > 0 && w12 < 1) {
        L.copy(cupC).sub(cam);
        P.set(x, y, z).sub(cam);
        const tt = P.dot(L) / L.lengthSq();
        if (tt > 0 && tt < 1.05) {
          Q.copy(L).multiplyScalar(tt);
          P.sub(Q);
          const dd = P.length();
          const minD = 0.85 * Math.min(1, tt);
          if (dd < minD) {
            if (dd < 1e-4) P.set(0, 1, 0);
            P.setLength(lerp(dd, minD, w01 * (1 - w12)));
            x = cam.x + Q.x + P.x;
            y = cam.y + Q.y + P.y;
            z = cam.z + Q.z + P.z;
          }
        }
      }
      let inText = 0;
      if (boxes.length && p < 0.45) {
        sp2.set(x, y, z).project(state.camera);
        const sx = (sp2.x * 0.5 + 0.5) * W;
        const sy = (-sp2.y * 0.5 + 0.5) * H;
        for (let b = 0; b < boxes.length; b += 4) {
          if (sx > boxes[b] && sx < boxes[b + 2] && sy > boxes[b + 1] && sy < boxes[b + 3]) inText = 1;
        }
      }
      hide[i] = THREE.MathUtils.damp(hide[i], inText, 10, dt);
      const pu = (push[i] = Math.max(0, push[i] - dt * 1.6));
      const k = Math.sin(Math.min(1, pu) * Math.PI) * 0.16;
      o.position.set(x + d.push[0] * k, y + d.push[1] * k, z + d.push[2] * k);
      const sp = p * 9 * d.spin + t * 0.15 * d.spin;
      o.rotation.set(d.rx + sp, d.ry + sp * 0.7, d.rz + sp * 0.4);
      o.scale.setScalar(d.scale * (1 - gone) * (1 - leave) * (1 - hide[i]) * (d.wind ? lerp(1, fadeX * 1.15, w12) : 1));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  // hover: a bean under the pointer gets a soft springy nudge (decays back to its scripted path)
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId !== undefined && push[e.instanceId] < 0.2) push[e.instanceId] = 1;
  };
  return <instancedMesh ref={mesh} args={[geo, mat, BEANS]} frustumCulled={false} onPointerMove={onMove} />;
}
