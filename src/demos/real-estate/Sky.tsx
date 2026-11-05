/**
 * Sky dome (follows the camera, drawn on the far plane after the opaque scene so early-z skips covered pixels).
 * Dusk = the real CC0 HDRI (belfast_sunset_puresky, same texture + rotation as the image-based lighting, so the
 * glass reflects exactly the sky you see), warmed towards the founder's reference gradient near the horizon.
 * Night = blue-hour → navy gradient with stars + moon fading in. Pure function of scroll.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { ENV_ROT, GLOW_DIR, nightOf } from './state';

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w;
}`;

const frag = /* glsl */ `
uniform sampler2D uEnv;
uniform float uRot, uGain, uHdr, uNight, uGlowAmt;
uniform vec3 uZenith, uMid, uHorizon, uGlow, uGround;
uniform vec3 uSunDir, uMoonDir;
varying vec3 vDir;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }

vec2 equirect(vec3 d) {
  return vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5);
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  // HDRI, rotated exactly like scene.environmentRotation (lookup = R_y(-rot) · dir)
  float c = cos(uRot), s = sin(uRot);
  vec3 dl = vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
  vec3 hdr = min(texture2D(uEnv, equirect(vec3(dl.x, max(dl.y, 0.004), dl.z))).rgb * uGain, vec3(24.0));
  // analytic gradient (reference look: grey-blue zenith → warm peach horizon, glow towards the sun)
  vec3 grad = mix(uHorizon, uMid, smoothstep(0.0, 0.32, h));
  grad = mix(grad, uZenith, smoothstep(0.26, 0.95, h));
  float sd = max(dot(d, uSunDir), 0.0);
  grad += uGlow * (pow(sd, 4.0) * 0.9 + pow(sd, 30.0) * 0.9) * uGlowAmt * (1.0 - smoothstep(0.0, 0.5, h));
  // afterglow band all round the horizon, strongest towards the sun's azimuth
  float az = dot(normalize(vec3(d.x, 0.0, d.z) + 1e-5), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))) * 0.5 + 0.5;
  grad += uGlow * (0.22 + 0.35 * az * az) * exp(-max(h, 0.0) * 6.0) * uGlowAmt;
  vec3 col = mix(grad, hdr, uHdr);
  // stars + moon (night only)
  vec3 sp = d * 220.0;
  float star = hash(floor(sp));
  float tw = step(0.9965, star) * smoothstep(0.5, 0.0, length(fract(sp) - 0.5));
  col += vec3(0.9, 0.93, 1.0) * tw * uNight * smoothstep(0.08, 0.35, h) * 1.4;
  float md = dot(d, uMoonDir);
  col += vec3(0.85, 0.9, 1.0) * (smoothstep(0.99955, 0.99975, md) * 1.6 + pow(max(md, 0.0), 180.0) * 0.25) * uNight;
  col = mix(col, uGround, smoothstep(0.0, -0.08, h));
  col += (hash(vec3(gl_FragCoord.xy, 1.0)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const C = (h: string) => new THREE.Color(h);
export const SKY = {
  dusk: { zenith: C('#7b889c'), mid: C('#d6b296'), horizon: C('#f5a05a'), glow: C('#ff9a46'), ground: C('#3a3f3c') },
  night: { zenith: C('#03060d'), mid: C('#0b1528'), horizon: C('#1f2c48'), glow: C('#3a4565'), ground: C('#06080c') },
};

export function SkyDome({ env }: { env: THREE.Texture }) {
  const ref = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uEnv: { value: env },
      uRot: { value: ENV_ROT },
      uGain: { value: 0.55 },
      uHdr: { value: 0.15 },
      uZenith: { value: SKY.dusk.zenith.clone() },
      uMid: { value: SKY.dusk.mid.clone() },
      uHorizon: { value: SKY.dusk.horizon.clone() },
      uGlow: { value: SKY.dusk.glow.clone() },
      uGround: { value: SKY.dusk.ground.clone() },
      uSunDir: { value: GLOW_DIR.clone().setY(0.03).normalize() },
      uMoonDir: { value: new THREE.Vector3(0.45, 0.42, -0.79).normalize() },
      uNight: { value: 0 },
      uGlowAmt: { value: 1 },
    }),
    [env],
  );
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false }),
    [uniforms],
  );
  useFrame(({ camera }) => {
    const n = nightOf(scrollState.smooth);
    const u = uniforms;
    // the HDRI carries dusk; night is the analytic gradient → cross-fade, then deepen
    u.uHdr.value = 0.15 * (1 - THREE.MathUtils.smoothstep(n, 0.05, 0.6));
    u.uGain.value = 0.55 * (1 - 0.6 * n);
    u.uZenith.value.lerpColors(SKY.dusk.zenith, SKY.night.zenith, n);
    u.uMid.value.lerpColors(SKY.dusk.mid, SKY.night.mid, n);
    u.uHorizon.value.lerpColors(SKY.dusk.horizon, SKY.night.horizon, n);
    u.uGlow.value.lerpColors(SKY.dusk.glow, SKY.night.glow, Math.min(1, n * 1.15));
    u.uGround.value.lerpColors(SKY.dusk.ground, SKY.night.ground, n);
    u.uNight.value = n;
    u.uGlowAmt.value = 1 - n * 0.75;
    ref.current?.position.copy(camera.position);
  });
  return (
    <mesh name="sky" ref={ref} material={mat} renderOrder={1} frustumCulled={false}>
      <sphereGeometry args={[300, 48, 24]} />
    </mesh>
  );
}
