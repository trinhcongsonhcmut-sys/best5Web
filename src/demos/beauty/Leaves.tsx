/**
 * Aloe blades framing the hero (foreground + two behind the jar). Fleshy V-section, serrated edges, pale base,
 * white speckles (shader), glossy wet clearcoat. They part to both sides over the first 20 % of the scroll.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { bridge } from '../../lib/bridge';
import { damp, smoothstep } from '../../lib/math';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { pose } from './anim';
import { look } from './palette';
import { bladeGeometry } from './geometry';

interface Blade {
  root: [number, number, number];
  rot: [number, number, number];
  len: number;
  width: number;
  bend: number;
  twist: number;
  side: -1 | 1;
}

// grows along +Y; rotation.z > 0 leans the tip toward -X. Foreground clusters sit between camera and jar.
const BLADES: Blade[] = [
  // left foreground cluster (kept below the copy column)
  { root: [-1.1, -1.45, 1.6], rot: [-0.12, 0.5, -0.06], len: 2.15, width: 0.25, bend: 0.5, twist: 0.5, side: -1 },
  { root: [-0.95, -1.5, 1.9], rot: [-0.22, 0.3, -0.26], len: 2.2, width: 0.22, bend: 0.65, twist: -0.4, side: -1 },
  { root: [-1.6, -1.5, 1.25], rot: [-0.05, 0.8, 0.3], len: 2.3, width: 0.23, bend: 0.55, twist: 0.8, side: -1 },
  { root: [-0.7, -1.55, 2.3], rot: [-0.3, 0.1, -0.5], len: 1.9, width: 0.2, bend: 0.8, twist: 0.3, side: -1 },
  // right foreground cluster
  { root: [1.3, -1.45, 1.5], rot: [-0.12, -0.45, -0.24], len: 3.0, width: 0.26, bend: 0.55, twist: -0.5, side: 1 },
  { root: [1.0, -1.5, 1.9], rot: [-0.24, -0.25, 0.26], len: 2.2, width: 0.22, bend: 0.7, twist: 0.4, side: 1 },
  { root: [1.6, -1.5, 1.15], rot: [-0.05, -0.8, -0.32], len: 2.6, width: 0.23, bend: 0.45, twist: -0.8, side: 1 },
  { root: [0.72, -1.55, 2.3], rot: [-0.3, -0.1, 0.52], len: 1.85, width: 0.19, bend: 0.8, twist: -0.3, side: 1 },
  // behind the jar (between jar and the giant word)
  { root: [-0.75, -1.7, -1.2], rot: [0.05, 0.2, 0.3], len: 2.55, width: 0.23, bend: -0.35, twist: 0.4, side: -1 },
  { root: [0.8, -1.7, -1.3], rot: [0.05, -0.2, -0.36], len: 3.2, width: 0.23, bend: -0.3, twist: -0.4, side: 1 },
];

/** blades dropped on portrait phones (hero stays airy) */
const THIN = [1, 3, 5, 7];

export function Leaves() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const geos = useMemo(() => BLADES.map((b, i) => bladeGeometry({ len: b.len, width: b.width, bend: b.bend, twist: b.twist, seed: i * 1.7 })), []);
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: look.leaf.clone(),
      vertexColors: true,
      roughness: 0.38,
      clearcoat: 0.65,
      clearcoatRoughness: 0.3,
      side: THREE.DoubleSide,
      envMapIntensity: 0.9,
    });
    m.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vLeafUv;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLeafUv = uv;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vLeafUv;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          {
            vec2 g = vec2(vLeafUv.x * 9.0, vLeafUv.y * 70.0);
            vec2 id = floor(g); vec2 f = fract(g) - 0.5;
            float h = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
            vec2 o = vec2(fract(h * 13.7) - 0.5, fract(h * 7.3) - 0.5) * 0.45;
            float d = length((f - o) * vec2(1.0, 1.7));
            float spot = (1.0 - smoothstep(0.09, 0.17, d)) * step(0.5, h) * (1.0 - smoothstep(0.75, 0.95, vLeafUv.y));
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.7 + 0.1, spot * 0.6);
          }`,
        );
    };
    m.customProgramCacheKey = () => 'baha-aloe-v1';
    return m;
  }, []);
  useEffect(() => () => { geos.forEach((g) => g.dispose()); mat.dispose(); }, [geos, mat]);

  const lift = useRef(0);
  const { size } = useThree();
  const portrait = size.width / Math.max(1, size.height) < 0.85;
  useFrame(({ clock, camera }, delta) => {
    const t = clock.elapsedTime;
    // camera elevation above the jar: orbiting up (> ~17°) parts the blades too, so their bases never show
    const tg = bridge.state.camera.target;
    const dy = camera.position.y - tg[1];
    const dist = Math.hypot(camera.position.x - tg[0], dy, camera.position.z - tg[2]) || 1;
    const elev = Math.asin(Math.max(-1, Math.min(1, dy / dist)));
    lift.current = damp(lift.current, smoothstep(0.24, 0.5, elev) + smoothstep(-0.02, -0.12, elev), 6, Math.min(delta, 0.05));
    const k = Math.min(1, Math.max(pose(scrollState.smooth).leafPart, lift.current));
    mat.color.copy(look.leaf);
    BLADES.forEach((b, i) => {
      const m = refs.current[i];
      if (!m) return;
      const behind = b.root[2] < 0;
      const sway = Math.sin(t * 0.55 + i * 1.3) * 0.018;
      m.position.set(b.root[0] + b.side * (behind ? 1.1 : 1.9) * k, b.root[1] - (behind ? 1.6 : 0.9) * k - (portrait ? 1.35 : 0), b.root[2] + (behind ? 0 : 0.5) * k);
      m.scale.set(1, portrait ? 1.55 : 1, 1);
      m.rotation.set(b.rot[0] - 0.25 * k, b.rot[1], b.rot[2] - b.side * 0.75 * k + sway);
      m.visible = k < 0.999 && !(portrait && THIN.includes(i));
    });
  });

  return (
    <group>
      {BLADES.map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={geos[i]} material={mat} raycast={() => null} />
      ))}
    </group>
  );
}
