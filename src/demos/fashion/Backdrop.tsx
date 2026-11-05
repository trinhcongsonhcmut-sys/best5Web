/**
 * Full-screen colour-block world (WebGL, not CSS): saturated radial glow centred on the garment's screen position,
 * a soft cyclorama sweep under it, a giant editorial word behind it, and the colourway change as an organic
 * radial wipe that starts at the jacket. Rendered first (depth off), so the jacket always sits in front of the type.
 */
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { smoothstep } from '../../lib/math';
import { world } from './state';
import { wordAtlas } from './textures';

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;

const frag = /* glsl */ `
uniform vec3 uIn, uOut, uPIn, uPOut, uWordTint, uPWordTint;
uniform float uWipe, uAspect, uTime, uW0, uW1, uWordShift, uWordAlpha, uPWordAlpha, uPortrait;
uniform vec2 uCenter, uWordPos, uWipeOrigin;
uniform sampler2D uWord;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
vec3 world(vec3 cin, vec3 cout, vec3 tint, float wa) {
  vec2 q = vUv - uCenter; q.x *= uAspect;
  float d = length(q * vec2(0.82, 1.0));
  float glow = 1.0 - smoothstep(0.0, 1.15, d);
  vec3 c = mix(cout, cin, pow(glow, 1.25));
  // cyclorama: soft darker sweep under the floating garment
  float fy = uCenter.y - mix(0.36, 0.2, uPortrait);
  float fl = smoothstep(fy + 0.05, fy - 0.22, vUv.y);
  c = mix(c, c * 0.78, fl * 0.55);
  // giant word (row 0 filled, row 1 outlined), sized to the screen width
  float ww = mix(0.94, 0.84, uPortrait);
  float wh = ww * uAspect / 4.0;
  vec2 w = vec2((vUv.x - uWordPos.x - uWordShift) / ww + 0.5, (vUv.y - uWordPos.y) / wh + 0.5);
  float inside = step(0.0, w.x) * step(w.x, 1.0) * step(0.0, w.y) * step(w.y, 1.0);
  float a0 = texture2D(uWord, vec2(w.x, 0.5 + w.y * 0.5)).a;
  float a1 = texture2D(uWord, vec2(w.x, w.y * 0.5)).a;
  float word = inside * (a0 * uW0 + a1 * uW1);
  c = mix(c, tint, clamp(word * wa, 0.0, 1.0));
  return c;
}
void main() {
  vec3 next = world(uIn, uOut, uWordTint, uWordAlpha);
  // the previous world is only needed while a wipe is running (saves half the full-screen work otherwise)
  vec3 prev = uWipe < 0.9999 ? world(uPIn, uPOut, uPWordTint, uPWordAlpha) : next;
  // crisp circular wipe growing out of the "next look" preview (or the garment, mid-scroll):
  // sharp edge + a thin bright ring, never a soft grey blob
  // exact circle in aspect-corrected space; edge anti-aliased over ~1 px (fwidth), no noise, no halo
  vec2 q = (vUv - uWipeOrigin) * vec2(uAspect, 1.0);
  float d = length(q);
  vec2 o = uWipeOrigin;
  float maxD = length(vec2(max(o.x, 1.0 - o.x) * uAspect, max(o.y, 1.0 - o.y))) + 0.02;
  float e = uWipe * uWipe * (3.0 - 2.0 * uWipe);
  float r = e * maxD;
  float px = fwidth(d);
  float on = step(0.0001, uWipe);
  float m = (1.0 - smoothstep(r - px, r + px, d)) * on;
  vec3 col = mix(prev, next, m);
  // thin bright rim riding the front (~2 px), hue of the incoming world
  float ring = (1.0 - smoothstep(0.0, 2.0 * px, abs(d - r))) * on * step(uWipe, 0.999);
  col = mix(col, mix(next, vec3(1.0), 0.5), ring * 0.85);
  // fine grain (kills 8-bit banding on the big gradients)
  // interleaved gradient noise: pattern-free dither (the sin-hash showed diagonal lines on some GPUs)
  vec2 fc = gl_FragCoord.xy + vec2(floor(fract(uTime * 0.37) * 64.0) * 5.588238);
  float ign = fract(52.9829189 * fract(dot(fc, vec2(0.06711056, 0.00583715))));
  col += (ign - 0.5) * (1.6 / 255.0);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export function Backdrop() {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const tex = useMemo(() => wordAtlas('CUMULUS'), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uIn: { value: new THREE.Color() },
          uOut: { value: new THREE.Color() },
          uPIn: { value: new THREE.Color() },
          uPOut: { value: new THREE.Color() },
          uWordTint: { value: new THREE.Color() },
          uPWordTint: { value: new THREE.Color() },
          uWordAlpha: { value: 0.5 },
          uPWordAlpha: { value: 0.5 },
          uWipe: { value: 1 },
          uAspect: { value: 1 },
          uPortrait: { value: 0 },
          uTime: { value: 0 },
          uW0: { value: 1 },
          uW1: { value: 0 },
          uWordShift: { value: 0 },
          uCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uWordPos: { value: new THREE.Vector2(0.5, 0.5) },
          uWipeOrigin: { value: new THREE.Vector2(0.9, 0.2) },
          uWord: { value: tex },
        },
      }),
    [tex],
  );
  const geo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useEffect(
    () => () => {
      mat.dispose();
      geo.dispose();
      tex.dispose();
    },
    [mat, geo, tex],
  );

  useFrame((state) => {
    const p = scrollState.smooth;
    const u = mat.uniforms;
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 0.9 ? 1 : 0;
    u.uAspect.value = aspect;
    u.uPortrait.value = portrait;
    u.uTime.value = state.clock.elapsedTime;
    // colours: target palette = world.to, previous = world.from, wipe progress = world.wipe
    u.uIn.value.copy(world.to.bgIn);
    u.uOut.value.copy(world.to.bgOut);
    u.uWordTint.value.copy(world.to.word);
    u.uWordAlpha.value = world.to.wordAlpha;
    u.uPIn.value.copy(world.from.bgIn);
    u.uPOut.value.copy(world.from.bgOut);
    u.uPWordTint.value.copy(world.from.word);
    u.uPWordAlpha.value = world.from.wordAlpha;
    u.uWipe.value = world.wipe;
    // garment screen position → glow + wipe origin follow the editorial layout shifts
    tmp.copy(world.anchor).project(camera);
    const cx = THREE.MathUtils.clamp(tmp.x * 0.5 + 0.5, 0.15, 0.85);
    const cy = THREE.MathUtils.clamp(tmp.y * 0.5 + 0.5, 0.2, 0.8);
    u.uCenter.value.set(cx, cy);
    // wipe origin is latched for the whole wipe (no drifting circle)
    if (world.wipe <= 0.0001 || world.wipe >= 0.9999) {
      if (world.mode === 'fly') {
        tmp.copy(world.previewOnPlane).project(camera);
        u.uWipeOrigin.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5);
      } else u.uWipeOrigin.value.set(cx, cy);
    }
    // giant word: hero (filled, slides away) → final frame (outline)
    u.uW0.value = 1 - smoothstep(0.05, 0.19, p);
    u.uW1.value = smoothstep(0.86, 0.985, p) * 0.7;
    u.uWordShift.value = -p * 1.4 * (1 - smoothstep(0.5, 0.86, p));
    const wy = portrait ? cy + 0.02 : cy + 0.1;
    u.uWordPos.value.set(0.5, wy);
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={-1000} raycast={() => null} />;
}
