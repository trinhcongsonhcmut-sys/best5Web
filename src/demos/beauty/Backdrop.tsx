/**
 * World layers rendered IN WebGL (canvas is opaque — nothing behind it in the DOM):
 *  - Sky: screen-space gradient + soft glow + grain, colours lerped per variant (identical from every orbit angle)
 *  - GiantWord: Didone display word billboarded BEHIND the jar (depth-tested → the jar/leaves occlude it)
 *  - Motes: ≤150 slow dust/dew specks
 *  - BlobShadow: baked soft contact shadows (no shadow-map pass on the iGPU)
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import { pose } from './anim';
import { look, WORLDS } from './palette';
import { rig, warm } from './rig';
import { blobTexture, dotTexture, whenFonts, wordTexture } from './textures';

export function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTop: { value: look.bgTop },
          uMid: { value: look.bgMid },
          uBot: { value: look.bgBot },
          uGlow: { value: look.glow },
          uAspect: { value: 1 },
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }',
        fragmentShader: `uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBot; uniform vec3 uGlow; uniform float uAspect; varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main(){
            float y = vUv.y;
            vec3 c = mix(uBot, uMid, smoothstep(0.0, 0.5, y));
            c = mix(c, uTop, smoothstep(0.45, 1.05, y));
            vec2 q = (vUv - vec2(0.5, 0.46)) * vec2(uAspect, 1.0);
            float g = exp(-dot(q, q) * 2.6);
            c = mix(c, uGlow, g * 0.55);
            // faint floor horizon: brighter band low in frame
            c = mix(c, uGlow, smoothstep(0.32, 0.12, y) * 0.25);
            vec2 v = vUv - 0.5;
            c *= 1.0 - dot(v, v) * 0.16;
            c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(({ size }) => {
    mat.uniforms.uAspect.value = size.width / Math.max(1, size.height);
  });
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-1000} raycast={() => null}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export function GiantWord() {
  const ref = useRef<THREE.Mesh>(null);
  const index = variantStore.use((s) => s.index);
  const size = useThree((s) => s.size);
  const portrait = size.width / Math.max(1, size.height) < 0.85;
  // landscape: one line (2048×512) · portrait: two stacked lines (1024²) — created only when needed
  const words = useMemo(() => WORLDS.map(() => wordTexture(portrait)), [portrait]);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: WORLDS[0].ink, transparent: true, depthWrite: false, toneMapped: false, fog: false }),
    [],
  );
  const st = useRef({ drawn: -1, want: 0, swap: 0, ready: false, aspect: 4 });
  useEffect(() => {
    let alive = true;
    st.current.ready = false;
    st.current.aspect = portrait ? 1 : 4;
    mat.map = words[st.current.want].texture;
    mat.needsUpdate = true;
    whenFonts().then(() => {
      if (!alive) return;
      words.forEach((w, i) => w.draw(WORLDS[i].word));
      st.current.drawn = st.current.want;
      st.current.ready = true;
    });
    return () => {
      alive = false;
      words.forEach((w) => w.texture.dispose());
    };
  }, [words, mat, portrait]);
  useEffect(() => {
    st.current.want = index;
  }, [index]);
  useEffect(() => () => mat.dispose(), [mat]);

  const tmp = useMemo(() => ({ dir: new THREE.Vector3(), pos: new THREE.Vector3(), up: new THREE.Vector3(), s: new THREE.Vector3() }), []);

  useFrame((_, delta) => {
    const s = st.current;
    const dt = Math.min(delta, 0.05);
    // cross-fade the word when the variant changes (fade out → redraw → fade in)
    if (s.ready && s.drawn !== s.want) {
      s.swap = Math.max(0, s.swap - dt * 4);
      if (s.swap === 0) {
        mat.map = words[s.want].texture;
        s.drawn = s.want;
      }
    } else if (s.ready) s.swap = Math.min(1, s.swap + dt * 2.2);
    mat.color.copy(look.ink);
    mat.opacity = pose(scrollState.smooth).word * s.swap;
  });

  // place as a camera-facing backdrop layer just behind the jar, after the camera rig has moved this frame
  const onBeforeRender = (_r: THREE.WebGLRenderer, _s: THREE.Scene, camera: THREE.Camera) => {
    const m = ref.current;
    if (!m) return;
    const cam = camera as THREE.PerspectiveCamera;
    cam.getWorldDirection(tmp.dir);
    const D = cam.position.distanceTo(rig.jarCenter) + 2.3;
    const visH = 2 * Math.tan((cam.fov * Math.PI) / 360) * D;
    const visW = visH * cam.aspect;
    const asp = st.current.aspect;
    const w = asp === 4 ? Math.min(visW * 0.88, visH * 2.5) : Math.min(visW * 0.98, visH * 0.62);
    tmp.up.setFromMatrixColumn(cam.matrixWorld, 1);
    // sits slightly BELOW the frame centre so the copy block above never touches the cap height
    tmp.pos.copy(cam.position).addScaledVector(tmp.dir, D).addScaledVector(tmp.up, asp === 4 ? -visH * 0.035 : visH * 0.0);
    tmp.s.set(w, w / asp, 1);
    m.matrixWorld.compose(tmp.pos, cam.quaternion, tmp.s);
    m.modelViewMatrix.multiplyMatrices(cam.matrixWorldInverse, m.matrixWorld);
    m.normalMatrix.getNormalMatrix(m.modelViewMatrix);
  };

  return (
    <mesh ref={ref} material={mat} frustumCulled={false} matrixAutoUpdate={false} renderOrder={-10} onBeforeRender={onBeforeRender} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export function Motes() {
  const N = 140;
  const { geo, mat, base } = useMemo(() => {
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const base = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      base[i * 4] = (r() - 0.5) * 6;
      base[i * 4 + 1] = r() * 3.2 - 0.9;
      base[i * 4 + 2] = (r() - 0.5) * 4.5;
      base[i * 4 + 3] = 0.3 + r();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const mat = new THREE.PointsMaterial({ size: 0.028, map: dotTexture(), color: '#ffffff', transparent: true, opacity: 0.75, depthWrite: false, sizeAttenuation: true });
    return { geo, mat, base };
  }, []);
  useEffect(() => () => { geo.dispose(); mat.map?.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const sp = base[i * 4 + 3];
      const y = ((base[i * 4 + 1] + t * 0.05 * sp + 0.9) % 3.2) - 0.9;
      a.setXYZ(i, base[i * 4] + Math.sin(t * 0.3 * sp + i) * 0.08, y, base[i * 4 + 2] + Math.cos(t * 0.25 * sp + i) * 0.06);
    }
    a.needsUpdate = true;
  });
  return <points geometry={geo} material={mat} raycast={() => null} frustumCulled={false} />;
}

/** Soft baked contact shadow that follows a target x (and fades/spreads as the object lifts). */
export function BlobShadow({ getX, getLift, getAlpha, radius = 0.75, strength = 0.5, z = 0 }: { getX: () => number; getLift: () => number; getAlpha?: () => number; radius?: number; strength?: number; z?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#000', alphaMap: blobTexture(), transparent: true, depthWrite: false, toneMapped: false }), []);
  useEffect(() => () => { mat.alphaMap?.dispose(); mat.dispose(); }, [mat]);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const lift = getLift();
    m.position.set(getX(), 0.003, z);
    const s = radius * (1 + lift * 1.1);
    m.scale.set(s * 2, s * 1.25, 1);
    mat.color.copy(look.shadow);
    const al = getAlpha ? getAlpha() : 1;
    m.visible = al > 0.001 || warm.on;
    mat.opacity = (al * strength) / (1 + lift * 3.5);
  });
  return (
    <mesh ref={ref} material={mat} rotation-x={-Math.PI / 2} renderOrder={1} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
