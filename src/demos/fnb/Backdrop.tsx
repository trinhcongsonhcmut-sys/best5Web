/**
 * Full-screen WebGL gradient behind everything. Two radial palettes (cafe, restaurant) are blended with an
 * organic radial wipe (not a hard cut) plus horizontal "wind" streaks during the transition.
 */
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { smoothstep } from '../../lib/math';
import { backdropColors, sceneMix } from './timeline';

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;

const frag = /* glsl */ `
uniform vec3 uCafeIn, uCafeOut, uRestIn, uRestOut;
uniform float uMix, uWind, uAspect, uTime;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec2 p = vUv - vec2(0.5, 0.52);
  p.x *= uAspect;
  float d = length(p);
  float fall = smoothstep(0.0, 0.95, d);
  vec3 cafe = mix(uCafeIn, uCafeOut, fall);
  vec3 rest = mix(uRestIn, uRestOut, fall);
  // organic radial wipe: wobbly front, soft edge
  float ang = atan(p.y, p.x);
  float front = uMix * 1.75 - 0.15;
  float wob = 0.07 * sin(ang * 5.0 + uMix * 9.0) + 0.05 * noise(vec2(ang * 3.0, uMix * 4.0));
  float m = 1.0 - smoothstep(front - 0.32, front, d + wob);
  vec3 col = mix(cafe, rest, m);
  // horizontal wind streaks (motion-blur feel) while the beans sweep across
  float streak = noise(vec2(vUv.x * 2.5 - uTime * 1.6, vUv.y * 70.0)) * noise(vec2(vUv.x * 6.0 - uTime * 2.4, vUv.y * 13.0));
  col += vec3(1.0, 0.78, 0.55) * streak * uWind * 0.08;
  // film grain / dither (kills banding on 8-bit gradients)
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * (2.0 / 255.0);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export function Backdrop() {
  const size = useThree((s) => s.size);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uCafeIn: { value: new THREE.Color() },
          uCafeOut: { value: new THREE.Color() },
          uRestIn: { value: new THREE.Color() },
          uRestOut: { value: new THREE.Color() },
          uMix: { value: 0 },
          uWind: { value: 0 },
          uAspect: { value: 1 },
          uTime: { value: 0 },
        },
      }),
    [],
  );
  const geo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  useEffect(
    () => () => {
      mat.dispose();
      geo.dispose();
    },
    [mat, geo],
  );
  useFrame((state) => {
    const p = scrollState.smooth;
    const u = mat.uniforms;
    backdropColors(p, u.uCafeIn.value, u.uCafeOut.value, u.uRestIn.value, u.uRestOut.value);
    u.uMix.value = sceneMix(p);
    u.uWind.value = smoothstep(0.36, 0.45, p) * (1 - smoothstep(0.52, 0.6, p));
    u.uAspect.value = size.width / Math.max(1, size.height);
    u.uTime.value = state.clock.elapsedTime;
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={-1000} />;
}
