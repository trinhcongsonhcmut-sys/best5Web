/**
 * Wet forecourt reflection — cheaper than drei's MeshReflectorMaterial:
 *  - three's Reflector as a 256 px, no-MSAA render-to-texture, drawn as a transparent glaze over the PBR pavers
 *  - mirror pass re-renders only layer 0 (villa, palms, sky — never the tree line / city / lawn on layer 1)
 *  - updates every other frame while the camera/scroll moves, NOT AT ALL once the view is still
 *    (a static view = a static mirror), only when the court is in the frustum and the scroll mark shows it
 *  - puddle mask (paver roughness) × Fresnel drive the opacity → wet joints and puddles, dry stone elsewhere
 */
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { scrollState } from '../../lib/scroll';

const WET_SHADER = {
  name: 'BahaWetCourt',
  uniforms: {
    color: { value: null as THREE.Color | null },
    tDiffuse: { value: null as THREE.Texture | null },
    textureMatrix: { value: null as THREE.Matrix4 | null },
    tMask: { value: null as THREE.Texture | null },
    uRepeat: { value: new THREE.Vector2(1, 1) },
    uStrength: { value: 0.85 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    uniform vec2 uRepeat;
    varying vec4 vRefl;
    varying vec2 vMaskUv;
    varying vec3 vWorld;
    void main() {
      vRefl = textureMatrix * vec4(position, 1.0);
      vMaskUv = uv * uRepeat;
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform sampler2D tMask;
    uniform float uStrength;
    varying vec4 vRefl;
    varying vec2 vMaskUv;
    varying vec3 vWorld;
    void main() {
      vec2 uv = vRefl.xy / vRefl.w;
      vec2 o = vec2(2.2 / 256.0);
      vec3 c = texture2D(tDiffuse, uv).rgb * 0.4
        + (texture2D(tDiffuse, uv + vec2(o.x, 0.0)).rgb + texture2D(tDiffuse, uv - vec2(o.x, 0.0)).rgb
         + texture2D(tDiffuse, uv + vec2(0.0, o.y)).rgb + texture2D(tDiffuse, uv - vec2(0.0, o.y)).rgb) * 0.15;
      float rough = texture2D(tMask, vMaskUv).g;           // 0.25 (puddle) … 0.55 (dry)
      float wet = clamp((0.56 - rough) / 0.28, 0.0, 1.0);
      vec3 V = normalize(cameraPosition - vWorld);
      float fres = 0.2 + 0.8 * pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
      float a = clamp(uStrength * fres * (0.3 + 0.7 * wet), 0.0, 0.92);
      gl_FragColor = vec4(c * color, a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

export function WetCourt({ mask, repeat, position, size }: { mask: THREE.Texture; repeat: THREE.Vector2; position: [number, number, number]; size: [number, number] }) {
  const refl = useMemo(() => {
    const r = new Reflector(new THREE.PlaneGeometry(size[0], size[1]), {
      textureWidth: 256,
      textureHeight: 256,
      clipBias: 0.003,
      multisample: 0,
      color: new THREE.Color('#d8dbe4'),
      shader: WET_SHADER,
    });
    const m = r.material as THREE.ShaderMaterial;
    m.transparent = true;
    m.depthWrite = false;
    m.polygonOffset = true;
    m.polygonOffsetFactor = -1;
    m.uniforms.tMask.value = mask;
    m.uniforms.uRepeat.value.copy(repeat);
    r.rotation.x = -Math.PI / 2;
    r.position.set(...position);
    r.renderOrder = 1;
    // throttle the mirror pass to every other frame and keep it on layer 0
    const orig = r.onBeforeRender;
    let f = 0;
    let settled = 0;
    const lastM = new THREE.Matrix4();
    let lastP = -1;
    r.onBeforeRender = function (this: Reflector, renderer, scene, camera, geometry, material, group) {
      const still = lastM.equals(camera.matrixWorld) && Math.abs(scrollState.smooth - lastP) < 1e-4;
      lastM.copy(camera.matrixWorld);
      lastP = scrollState.smooth;
      settled = still ? settled + 1 : 0;
      if (settled > 3) return; // view unchanged → the mirror texture is still valid
      if (f++ % 2 !== 0 && settled === 0) return;
      this.getReflectionCamera(camera).layers.set(0);
      orig.call(this, renderer, scene, camera, geometry, material, group);
    };
    return r;
  }, [mask, repeat, position, size]);
  useEffect(() => () => refl.dispose(), [refl]);
  useFrame(() => {
    const p = scrollState.smooth;
    refl.visible = p < 0.44 || p > 0.84; // the court is out of frame around Level 1–Rooftop
  });
  return <primitive object={refl} />;
}
