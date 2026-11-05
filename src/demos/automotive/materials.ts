import * as THREE from 'three';
import { addRim, type RimUniforms } from '../../lib/rim';
import { brushedTexture, grainTexture, orangePeelTexture } from './geometry';

/** Finish presets — each one rewrites the real body material (colour + PBR params), never a CSS tint. */
export interface Finish {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  /** brushed-metal anisotropy (stretches the light-band reflections along the panels) */
  anisotropy: number;
  /** environment reflection strength */
  env: number;
}
export const FINISHES: Finish[] = [
  { color: '#cfd1d2', metalness: 1, roughness: 0.32, clearcoat: 0, clearcoatRoughness: 0.2, anisotropy: 0.2, env: 0.85 }, // brushed stainless
  { color: '#2f3134', metalness: 0.4, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.18, anisotropy: 0, env: 1.0 }, // graphite satin
  { color: '#b39f7f', metalness: 0.55, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.04, anisotropy: 0, env: 0.95 }, // dune metallic
  { color: '#6f8e9a', metalness: 0.6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, anisotropy: 0, env: 0.95 }, // mist blue
];

export interface TruckMaterials {
  body: THREE.MeshPhysicalMaterial;
  bodyRim: RimUniforms;
  glass: THREE.MeshPhysicalMaterial;
  glassRim: RimUniforms;
  trim: THREE.MeshStandardMaterial;
  liner: THREE.MeshStandardMaterial;
  gap: THREE.MeshBasicMaterial;
  tyre: THREE.MeshStandardMaterial;
  rim: THREE.MeshStandardMaterial;
  rimRim: RimUniforms;
  disc: THREE.MeshStandardMaterial;
  caliper: THREE.MeshStandardMaterial;
  barrel: THREE.MeshStandardMaterial;
  plate: THREE.MeshStandardMaterial;
  cabin: THREE.MeshStandardMaterial;
  chassis: THREE.MeshStandardMaterial;
  chassisRim: RimUniforms;
  battery: THREE.MeshStandardMaterial;
  front: THREE.MeshStandardMaterial;
  frontRim: RimUniforms;
  rear: THREE.MeshStandardMaterial;
  rearRim: RimUniforms;
  glow: THREE.MeshStandardMaterial;
  edges: THREE.LineBasicMaterial;
  brushed: THREE.Texture;
}

const RIM = '#ffc690';

export function createMaterials(): TruckMaterials {
  const brushed = brushedTexture();
  const f = FINISHES[0];
  const bodyM = new THREE.MeshPhysicalMaterial({
    color: f.color,
    metalness: f.metalness,
    roughness: f.roughness,
    roughnessMap: brushed,
    clearcoatNormalMap: orangePeelTexture(),
    clearcoatNormalScale: new THREE.Vector2(0.12, 0.12),
    clearcoat: f.clearcoat,
    clearcoatRoughness: f.clearcoatRoughness,
    anisotropy: f.anisotropy,
    anisotropyRotation: 0,
    envMapIntensity: f.env,
  });
  const body = addRim(bodyM, { color: RIM, power: 1.7 });
  // Ambient-occlusion gradient in object space (survives the exploded lift): sills and the areas around the
  // wheel arches darken like a real underbody shadow; chained after the rim injection.
  const rimCompile = bodyM.onBeforeCompile;
  bodyM.onBeforeCompile = (shader, renderer) => {
    rimCompile(shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAxObj;\nvarying float vAxUp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAxObj = transformed;\nvAxUp = objectNormal.y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAxObj;\nvarying float vAxUp;')
      // up-facing panels (bonnet, cowl, roof) get a rougher micro-surface → overhead strips spread, no white decal bands
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = min(1.0, roughnessFactor + 0.16 * smoothstep(0.55, 0.95, vAxUp));',
      )
      .replace(
        '#include <opaque_fragment>',
        'float axAO = mix(0.42, 1.0, smoothstep(0.55, 1.0, vAxObj.y));\n' +
          'vec2 axQ = vec2(abs(vAxObj.x) - 1.85, vAxObj.y - 0.5);\n' +
          'axAO *= mix(0.5, 1.0, smoothstep(0.62, 0.95, length(axQ)));\n' +
          'outgoingLight *= axAO;\n#include <opaque_fragment>',
      );
  };
  bodyM.customProgramCacheKey = () => 'axiom-body-ao-v2';

  const glass = addRim(
    new THREE.MeshPhysicalMaterial({ color: '#0d1418', metalness: 0, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, reflectivity: 0.7, transparent: true, opacity: 0.86 }),
    { color: '#bfe3ff', power: 1.8 },
  );
  const rim = addRim(new THREE.MeshStandardMaterial({ color: '#a7abb0', metalness: 0.95, roughness: 0.26, envMapIntensity: 1.3, emissive: '#fff3e2', emissiveIntensity: 0 }), { color: RIM, power: 2 });
  const chassis = addRim(new THREE.MeshStandardMaterial({ color: '#3a3936', metalness: 0.6, roughness: 0.45 }), { color: '#9fd0ff', power: 2 });
  const front = addRim(new THREE.MeshStandardMaterial({ color: '#111', emissive: '#f4f8ff', emissiveIntensity: 2.2, roughness: 0.3 }), { color: '#ffffff', power: 1.5 });
  const rear = addRim(new THREE.MeshStandardMaterial({ color: '#1a0405', emissive: '#e8383d', emissiveIntensity: 0.6, roughness: 0.3 }), { color: '#ff6b6b', power: 1.5 });

  return {
    body: body.material,
    bodyRim: body.uniforms,
    glass: glass.material,
    glassRim: glass.uniforms,
    trim: new THREE.MeshStandardMaterial({ color: '#1d1e1f', metalness: 0, roughness: 0.74, envMapIntensity: 0.9, normalMap: grainTexture(), normalScale: new THREE.Vector2(0.35, 0.35) }), // grained matte composite
    liner: new THREE.MeshStandardMaterial({ color: '#0f0f0f', roughness: 1, envMapIntensity: 0.3 }), // dead-matte liner
    gap: new THREE.MeshBasicMaterial({ color: '#0a0a0a' }),
    tyre: new THREE.MeshStandardMaterial({ color: '#181816', roughness: 0.93, metalness: 0, envMapIntensity: 0.55 }), // rubber
    rim: rim.material,
    rimRim: rim.uniforms,
    disc: new THREE.MeshStandardMaterial({ color: '#8d8f92', metalness: 0.9, roughness: 0.42 }),
    caliper: new THREE.MeshStandardMaterial({ color: '#d2461f', metalness: 0.2, roughness: 0.38, emissive: '#ff5a1f', emissiveIntensity: 0 }),
    barrel: new THREE.MeshStandardMaterial({ color: '#2c2e31', metalness: 0.8, roughness: 0.4 }),
    plate: new THREE.MeshStandardMaterial({ color: '#d9d6cc', roughness: 0.55, metalness: 0.1 }),
    cabin: new THREE.MeshStandardMaterial({ color: '#1b1c1e', roughness: 0.85, metalness: 0, side: THREE.BackSide }),
    chassis: chassis.material,
    chassisRim: chassis.uniforms,
    battery: new THREE.MeshStandardMaterial({ color: '#2b2d30', metalness: 0.5, roughness: 0.5, emissive: '#5fb4ff', emissiveIntensity: 0 }),
    front: front.material,
    frontRim: front.uniforms,
    rear: rear.material,
    rearRim: rear.uniforms,
    glow: new THREE.MeshStandardMaterial({ color: '#0d1a26', emissive: '#6fb7ff', emissiveIntensity: 0.4, roughness: 0.4 }),
    edges: new THREE.LineBasicMaterial({ color: '#e2431e', transparent: true, opacity: 0, depthWrite: false }),
    brushed,
  };
}
