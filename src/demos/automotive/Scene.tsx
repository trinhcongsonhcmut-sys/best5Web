import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig, orbit } from '../../lib/CameraRig';
import { smoothstep } from '../../lib/math';
import type { PoseStop, Vec3 } from '../../lib/math';
import { Truck } from './Truck';
import { dotTexture, sandTexture, shadowTexture } from './geometry';
import { anim } from './anim';
import { FX_LAYER } from './layers';

export const SKY = { top: '#a9c8d6', mid: '#c1d7db', horizon: '#e4dccb', sand: '#cfc3ae' };

/* Camera storyboard (from reference/F-analysis.md: hero 3/4 front low → side profile → high 3/4 exploded → rear 3/4 → final). */
const BASE: PoseStop[] = [
  { t: 0, pos: [6.7, 1.6, 11.5], target: [0.15, 1.62, 0], fov: 27 },
  { t: 0.25, pos: [0.25, 1.2, 12.8], target: [0.2, 1.45, 0], fov: 27 },
  { t: 0.5, pos: [7.3, 5.4, 9.4], target: [0.1, 1.65, 0], fov: 30 },
  { t: 0.625, pos: [-2.4, 3.6, 11.8], target: [-0.3, 1.38, 0], fov: 29 },
  { t: 0.75, pos: [-8.4, 2.4, 6.8], target: [-0.45, 1.28, 0], fov: 27 },
  { t: 0.875, pos: [-0.6, 1.45, 12.4], target: [0, 1.28, 0], fov: 28 },
  { t: 1, pos: [8.5, 1.0, 8.7], target: [0.2, 1.38, 0], fov: 29 },
];

/** Portrait screens: same shots, pulled back further and the subject lowered under the copy block. */
function stopsFor(aspect: number): PoseStop[] {
  if (aspect >= 1.05) return BASE;
  // phones: truck ~85–90% of the width, centred low (≈62–75% of the height) — clear of the copy and the stage dots
  const k = aspect < 0.7 ? 1.04 : 1.08;
  const lift = aspect < 0.7 ? 0.8 : 0.55;
  return BASE.map((s) => {
    const off = [s.pos[0] - s.target[0], s.pos[1] - s.target[1], s.pos[2] - s.target[2]];
    const target: Vec3 = [s.target[0], s.target[1] + lift, s.target[2]];
    return { ...s, target, pos: [target[0] + off[0] * k, target[1] + off[1] * k - lift * 0.4, target[2] + off[2] * k] as Vec3 };
  });
}

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color(SKY.top) },
          mid: { value: new THREE.Color(SKY.mid) },
          hor: { value: new THREE.Color(SKY.horizon) },
          sand: { value: new THREE.Color(SKY.sand) },
        },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 sand; varying vec3 vDir;
          void main(){
            float y = vDir.y;
            vec3 c = mix(hor, mid, smoothstep(0.0, 0.16, y));
            c = mix(c, top, smoothstep(0.16, 0.6, y));
            // faint high cloud bands
            float cl = sin(vDir.x*7.0 + vDir.z*3.0) * sin(vDir.z*5.0 - vDir.x*2.0);
            c = mix(c, vec3(0.96,0.96,0.95), smoothstep(0.55, 1.0, cl) * smoothstep(0.05, 0.25, y) * (1.0 - smoothstep(0.3,0.6,y)) * 0.35);
            c = mix(c, sand, smoothstep(0.0, -0.08, y));
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  return (
    <mesh material={mat} scale={180} renderOrder={-1}>
      <sphereGeometry args={[1, 40, 20]} />
    </mesh>
  );
}

function Ground() {
  const tex = useMemo(() => {
    const t = sandTexture();
    t.repeat.set(46, 46);
    return t;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8b99f', map: tex, roughness: 1, metalness: 0, envMapIntensity: 0.5 }), [tex]);
  useEffect(() => () => { tex.dispose(); mat.dispose(); }, [tex, mat]);
  useFrame(() => {
    // the desert slides under the truck = the truck drives forward (wheels roll the same distance)
    tex.offset.x = anim.roll / (320 / 46);
  });
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position-y={0}>
      <circleGeometry args={[160, 64]} />
    </mesh>
  );
}

/** Baked soft body shadow (static truck → no per-frame shadow render on the iGPU). Fades as the body lifts. */
function BodyShadow() {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#2e2418', map: shadowTexture(256, 128, 0.16, 12), transparent: true, depthWrite: false, opacity: 0.95 }), []);
  useEffect(() => () => { mat.map?.dispose(); mat.dispose(); }, [mat]);
  useFrame(() => {
    mat.opacity = 0.95 - anim.explode * 0.45;
  });
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position-y={0.004} raycast={() => null} renderOrder={1}>
      <planeGeometry args={[7.2, 3.2]} />
    </mesh>
  );
}

/** Very little dust: slow drifting motes hugging the ground. */
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat, base } = useMemo(() => {
    const N = 140;
    const base = new Float32Array(N * 3);
    let s = 3;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      base[i * 3] = (r() - 0.5) * 22;
      base[i * 3 + 1] = 0.05 + r() * r() * 1.6;
      base[i * 3 + 2] = (r() - 0.5) * 14;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
    const mat = new THREE.PointsMaterial({ size: 0.05, map: dotTexture(), color: '#e8dcc2', transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true });
    return { geo, mat, base };
  }, []);
  useEffect(() => () => { geo.dispose(); mat.map?.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < a.count; i++) {
      let x = base[i * 3] - ((t * 0.35 + anim.roll * 0.9 + i) % 22);
      x = ((x + 11) % 22 + 22) % 22 - 11;
      a.setXYZ(i, x, base[i * 3 + 1] + Math.sin(t * 0.6 + i) * 0.04, base[i * 3 + 2]);
    }
    a.needsUpdate = true;
  });
  useEffect(() => {
    ref.current?.layers.set(FX_LAYER);
  }, []);
  return <points ref={ref} geometry={geo} material={mat} raycast={() => null} />;
}

/** 360° light band (open cylinder seen from inside) — a cyclorama strip the flat panels reflect from every orbit angle. */
function Band({ y, h, intensity, color = '#ffffff', R = 30 }: { y: number; h: number; intensity: number; color?: string; R?: number }) {
  const c = useMemo(() => new THREE.Color(color).multiplyScalar(intensity), [color, intensity]);
  return (
    <mesh position-y={y}>
      <cylinderGeometry args={[R, R, h, 64, 1, true]} />
      <meshBasicMaterial color={c} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}
/** y on the R=30 cylinder for an elevation angle in degrees (env cube camera sits at the origin). */
const elev = (deg: number) => 30 * Math.tan((deg * Math.PI) / 180);

/**
 * Studio-in-the-desert reflection rig. The stainless body is read entirely through these shapes.
 * Flat flanks mirror the band just BELOW the horizon (−1…−6° from a standing camera), so that is where the
 * light bands and the dark floor contrast live; roof/hood/windscreen see the overhead strips and the sky.
 */
function Reflections() {
  const envSky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          top: { value: new THREE.Color('#6f93a8') },
          sky: { value: new THREE.Color('#c6d8df') },
          hor: { value: new THREE.Color('#e2dfd8') },
          sand: { value: new THREE.Color('#9e9b95') },
          deep: { value: new THREE.Color('#585652') },
        },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform vec3 top; uniform vec3 sky; uniform vec3 hor; uniform vec3 sand; uniform vec3 deep; varying vec3 vDir;
          void main(){ float y = vDir.y;
            vec3 c = mix(hor, sky, smoothstep(0.0, 0.14, y));
            c = mix(c, top, smoothstep(0.14, 0.8, y));
            c = mix(c, sand, smoothstep(0.0, -0.01, y));
            c = mix(c, deep, smoothstep(-0.01, -0.06, y));
            gl_FragColor = vec4(c, 1.0); }`,
      }),
    [],
  );
  return (
    <Environment resolution={512} frames={1} environmentIntensity={1}>
      <mesh material={envSky} scale={60}>
        <sphereGeometry args={[1, 48, 24]} />
      </mesh>
      {/* horizon cyclorama: bright line right under the horizon + two softer bands lower down */}
      <Band y={(elev(-0.15) + elev(-0.8)) / 2} h={elev(-0.15) - elev(-0.8)} intensity={1.0} color="#fffaf2" />
      <Band y={(elev(-1.5) + elev(-1.75)) / 2} h={elev(-1.5) - elev(-1.75)} intensity={1.0} />
      <Band y={(elev(-2.7) + elev(-3.4)) / 2} h={elev(-2.7) - elev(-3.4)} intensity={0.95} color="#fffaf2" />
      <Band y={(elev(-5) + elev(-6)) / 2} h={elev(-5) - elev(-6)} intensity={1.0} />
      <Band y={(elev(-10) + elev(-12)) / 2} h={elev(-10) - elev(-12)} intensity={0.7} color="#fff1df" />
      <Band y={(elev(2.5) + elev(4.5)) / 2} h={elev(4.5) - elev(2.5)} intensity={1.15} color="#f4f8ff" />
      {/* tall softboxes around the truck → vertical light breaks that slide along long panels as you orbit */}
      {[30, 125, 215, 300].map((a, i) => (
        <Lightformer
          key={a}
          form="rect"
          intensity={i % 2 ? 0.7 : 1.0}
          position={[Math.cos((a * Math.PI) / 180) * 22, 1.5, Math.sin((a * Math.PI) / 180) * 22]}
          scale={[2.6, 16, 1]}
        />
      ))}
      {/* long flank strips slightly above the horizon → one continuous band along shoulder + doors on both sides */}
      <Lightformer form="rect" intensity={1.1} position={[0, 3.6, 13]} scale={[40, 0.7, 1]} />
      <Lightformer form="rect" intensity={1.0} position={[0, 3.6, -13]} scale={[40, 0.7, 1]} />
      {/* 45° rails along both sides: every 45° chamfer strip (shoulder, roof edge, hood edge) mirrors one */}
      <Lightformer form="rect" intensity={0.8} position={[0, 8, 8]} scale={[30, 0.9, 1]} />
      <Lightformer form="rect" intensity={0.7} position={[0, 8, -8]} scale={[30, 0.9, 1]} />
      <Lightformer form="rect" intensity={0.9} position={[9, 8, 0]} scale={[0.5, 20, 1]} />
      {/* overhead: one long strip + two thin side strips = three clean lines on hood / roof / bed rails */}
      <Lightformer form="rect" intensity={0.75} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[28, 3.4, 1]} />
                </Environment>
  );
}

/** Ground glow decal (additive) — rocker underglow pools and similar light spill on the sand. */
function GlowPool({ x, z, w, d, color, get }: { x: number; z: number; w: number; d: number; color: string; get: () => number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color(color) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform float uA; uniform vec3 uC; varying vec2 vUv; void main(){ vec2 q = (vUv - 0.5) * 2.0; float a = (1.0 - smoothstep(0.55, 1.0, abs(q.x))) * pow(1.0 - smoothstep(0.0, 1.0, abs(q.y)), 2.0); gl_FragColor = vec4(uC * a * uA * 0.4, 1.0); }',
      }),
    [color],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    mat.uniforms.uA.value = get();
  });
  return (
    <mesh material={mat} position={[x, 0.011, z]} rotation-x={-Math.PI / 2} raycast={() => null} onUpdate={(m) => m.layers.set(FX_LAYER)}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

/** .01 beat: dust kicked up behind the four tyres while the truck "drives" (opacity follows anim.drive). */
function DustTrail() {
  const ref = useRef<THREE.Points>(null);
  const N = 240;
  const { geo, mat, seed } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 4), 4));
    const seed = new Float32Array(N * 3);
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N * 3; i++) seed[i] = r();
    const mat = new THREE.PointsMaterial({ size: 0.42, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true });
    return { geo, mat, seed };
  }, []);
  useEffect(() => {
    ref.current?.layers.set(FX_LAYER);
    return () => { geo.dispose(); mat.map?.dispose(); mat.dispose(); };
  }, [geo, mat]);
  useFrame(({ clock }) => {
    const d = anim.drive;
    if (ref.current) ref.current.visible = d > 0.01;
    if (d <= 0.01) return;
    const t = clock.elapsedTime;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const col = geo.getAttribute('color') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const e = i % 4;
      const ex = (e < 2 ? 1.85 : -1.85) - 0.38;
      const ez = (e % 2 ? -1 : 1) * 0.95;
      const life = (t * 0.55 + seed[i * 3]) % 1;
      const spread = seed[i * 3 + 1];
      pos.setXYZ(i, ex - life * (1.6 + spread * 1.6), 0.06 + life * (0.25 + seed[i * 3 + 2] * 0.55), ez + Math.sign(ez) * life * spread * 0.55);
      const a = Math.sin(Math.PI * life) * (1 - life * 0.4) * d * 0.32;
      col.setXYZ(i, 0.88, 0.82, 0.71);
      col.setW(i, a);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });
  return <points ref={ref} geometry={geo} material={mat} raycast={() => null} frustumCulled={false} />;
}

export function AutomotiveScene() {
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const portrait = aspect < 1.05;
  const stops = useMemo(() => stopsFor(aspect), [portrait, aspect < 0.7]); // eslint-disable-line react-hooks/exhaustive-deps
  const camera = useThree((st) => st.camera);
  useEffect(() => {
    camera.layers.enable(FX_LAYER);
  }, [camera]);
  // looking down from high up: back off and slide the frame so the roof stays below the title block
  const tv = useMemo(() => ({ up: new THREE.Vector3(), back: new THREE.Vector3() }), []);
  const topViewSafe = useCallback(
    (cam: THREE.PerspectiveCamera) => {
      // small re-frame only (no extra pitch): slide the camera along its own up axis so the truck sits a bit
      // lower in frame (clear of the title) and back off slightly — never toward the bottom HUD
      const k = smoothstep(0.12, 0.5, orbit.pitch);
      if (k <= 0) return;
      tv.up.set(0, 1, 0).applyQuaternion(cam.quaternion);
      tv.back.set(0, 0, 1).applyQuaternion(cam.quaternion);
      cam.position.addScaledVector(tv.back, 3.0 * k);
    },
    [tv],
  );
  // pitch capped at ~36° so a vertical drag never turns the frame top-down onto the title / HUD
  const limits = useMemo(() => ({ elevMin: 0.02, elevMax: 0.5, dollyMin: 0.62, dollyMax: 1.45 }), []);

  return (
    <>
      <fog attach="fog" args={[SKY.horizon, 30, 120]} />
      <CameraRig stops={stops} limits={limits} defaultFov={28} fitAspect={1.5} onAfter={topViewSafe} />
      <Reflections />
      <hemisphereLight args={['#eef4f7', '#b59a70', 0.55]} />
      <directionalLight position={[-6, 11, 7]} intensity={1.25} color="#fff2df" />
      <Sky />
      <Ground />
      <BodyShadow />
      <Truck />
      <Dust />
      <DustTrail />
      <GlowPool x={0} z={1.18} w={2.7} d={0.75} color="#6fb7ff" get={() => anim.glow} />
      <GlowPool x={0} z={-1.18} w={2.7} d={0.75} color="#6fb7ff" get={() => anim.glow} />
    </>
  );
}
