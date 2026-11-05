/**
 * Gradient sky dome (follows the camera so it is never clipped): blue hour → night, warm afterglow on the
 * western horizon, high cirrus lit by the glow, procedural stars + moon fading in. Pure function of scroll.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { nightOf } from './state';

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w; // on the far plane; drawn AFTER the opaque scene (renderOrder 1) so early-z skips every covered pixel
}`;

const frag = /* glsl */ `
uniform vec3 uZenith, uMid, uHorizon, uGlow, uGround, uCloud;
uniform vec3 uSunDir, uMoonDir;
uniform float uNight, uGlowAmt;
varying vec3 vDir;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1, 0)), u.x), mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { s += vnoise(p) * a; p *= 2.03; a *= 0.5; } return s; }

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  // vertical gradient
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
  col = mix(col, uZenith, smoothstep(0.18, 0.75, h));
  // afterglow around the set sun
  float sd = max(dot(d, uSunDir), 0.0);
  float glow = pow(sd, 6.0) * 0.9 + pow(sd, 32.0) * 0.6;
  col += uGlow * glow * uGlowAmt * (1.0 - smoothstep(0.0, 0.45, h));
  // horizon haze band (city light pollution at night)
  col += uGlow * 0.18 * exp(-abs(h) * 22.0) * (0.5 + uNight);
  // cirrus
  vec2 cp = d.xz / max(h + 0.12, 0.05);
  float c = fbm(cp * vec2(0.55, 1.6) + vec2(3.0, 1.0));
  c = smoothstep(0.52, 0.85, c) * smoothstep(0.02, 0.18, h) * (1.0 - smoothstep(0.5, 0.9, h));
  vec3 cloudCol = mix(uCloud, uGlow, pow(sd, 3.0) * uGlowAmt);
  col = mix(col, cloudCol, c * 0.55);
  // stars
  vec3 sp = d * 220.0;
  vec3 cell = floor(sp);
  float star = hash(cell);
  float tw = step(0.9965, star) * smoothstep(0.5, 0.0, length(fract(sp) - 0.5));
  col += vec3(0.9, 0.93, 1.0) * tw * uNight * smoothstep(0.08, 0.35, h) * (1.0 - c) * 1.4;
  // moon
  float md = dot(d, uMoonDir);
  col += vec3(0.85, 0.9, 1.0) * (smoothstep(0.99955, 0.99975, md) * 1.6 + pow(max(md, 0.0), 180.0) * 0.25) * uNight;
  // below horizon
  col = mix(col, uGround, smoothstep(0.0, -0.06, h));
  // dither against banding
  col += (hash(vec3(gl_FragCoord.xy, 1.0)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const C = (h: string) => new THREE.Color(h);
// dusk = blue hour (#365987) with sunset afterglow (#e0a070); night = #0e1626
export const SKY = {
  dusk: { zenith: C('#1d3462'), mid: C('#3a6795'), horizon: C('#c89a8a'), glow: C('#ffa968'), ground: C('#2a3346'), cloud: C('#5a6a8e') },
  night: { zenith: C('#03060d'), mid: C('#0b1528'), horizon: C('#1f2c48'), glow: C('#3a4565'), ground: C('#080c16'), cloud: C('#141c30') },
};

export function SkyDome() {
  const ref = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uZenith: { value: SKY.dusk.zenith.clone() },
      uMid: { value: SKY.dusk.mid.clone() },
      uHorizon: { value: SKY.dusk.horizon.clone() },
      uGlow: { value: SKY.dusk.glow.clone() },
      uGround: { value: SKY.dusk.ground.clone() },
      uCloud: { value: SKY.dusk.cloud.clone() },
      uSunDir: { value: new THREE.Vector3(-0.55, -0.02, -0.83).normalize() },
      uMoonDir: { value: new THREE.Vector3(0.45, 0.42, -0.79).normalize() },
      uNight: { value: 0 },
      uGlowAmt: { value: 1 },
    }),
    [],
  );
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false }),
    [uniforms],
  );
  useFrame(({ camera }) => {
    const n = nightOf(scrollState.smooth);
    const u = uniforms;
    u.uZenith.value.lerpColors(SKY.dusk.zenith, SKY.night.zenith, n);
    u.uMid.value.lerpColors(SKY.dusk.mid, SKY.night.mid, n);
    u.uHorizon.value.lerpColors(SKY.dusk.horizon, SKY.night.horizon, n);
    u.uGlow.value.lerpColors(SKY.dusk.glow, SKY.night.glow, Math.min(1, n * 1.15));
    u.uGround.value.lerpColors(SKY.dusk.ground, SKY.night.ground, n);
    u.uCloud.value.lerpColors(SKY.dusk.cloud, SKY.night.cloud, n);
    u.uNight.value = n;
    u.uGlowAmt.value = 1 - n * 0.75;
    ref.current?.position.copy(camera.position);
  });
  return (
    <mesh ref={ref} material={mat} renderOrder={1} frustumCulled={false}>
      <sphereGeometry args={[300, 48, 24]} />
    </mesh>
  );
}
