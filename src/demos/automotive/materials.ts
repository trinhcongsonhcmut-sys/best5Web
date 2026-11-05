import * as THREE from 'three';
import { addRim, type RimUniforms } from '../../lib/rim';

/**
 * Paint finishes — each one rewrites the REAL body material (MeshPhysical colour, metalness, roughness, clearcoat,
 * pearl shift) on the GLB's "Paint 1" panels; never a CSS tint. Clearcoat stays > 0 in every finish so a variant change
 * never recompiles the shader (no hitch). The pearl is a cheap facing/grazing hue shift (no thin-film pass: iGPU budget).
 */
export interface Finish {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  env: number;
  /** "Paint 2" accent panels (roof, lower sills, mirror caps, splitter) */
  accent: string;
  accentMetal: number;
  accentRough: number;
  /** cabin accent leather ("Interior 3") */
  interior: string;
}

export const FINISHES: Finish[] = [
  // 0 · Pearl White — tri-coat pearl over a white base (the default, as in the v2 reference)
  { color: '#dbd8d2', metalness: 0.04, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, env: 1.7, accent: '#383a3f', accentMetal: 0.25, accentRough: 0.22, interior: '#7b4a2e' },
  // 1 · Carmine Candy — deep candy red over silver flake
  { color: '#7a0a12', metalness: 0.45, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, env: 1.7, accent: '#383a3f', accentMetal: 0.25, accentRough: 0.22, interior: '#3b0b0e' },
  // 2 · Torched Graphite — dark metallic grey
  { color: '#2c2e33', metalness: 0.75, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, env: 1.7, accent: '#303236', accentMetal: 0.25, accentRough: 0.26, interior: '#1c2633' },
  // 3 · Dusk Bronze — warm metallic
  { color: '#7d5a3a', metalness: 0.72, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, env: 1.7, accent: '#383a3f', accentMetal: 0.25, accentRough: 0.22, interior: '#2a221d' },
];

export interface CarMaterials {
  paint: THREE.MeshPhysicalMaterial;
  paintRim: RimUniforms;
  accent: THREE.MeshPhysicalMaterial;
  accentRim: RimUniforms;
  glass: THREE.MeshPhysicalMaterial;
  glassRim: RimUniforms;
  front: THREE.MeshStandardMaterial;
  frontRim: RimUniforms;
  rear: THREE.MeshStandardMaterial;
  rearRim: RimUniforms;
  signal: THREE.MeshStandardMaterial;
  rimDark: THREE.MeshStandardMaterial;
  rimDarkRim: RimUniforms;
  rimLip: THREE.MeshStandardMaterial;
  rimLipRim: RimUniforms;
  caliper: THREE.MeshStandardMaterial;
  interior: THREE.MeshStandardMaterial;
  plate: THREE.MeshStandardMaterial;
}

const RIM_WARM = '#ffcf9e';

/** Shared per-frame uniforms of the paint shader: low sun direction in VIEW space + back-light rim strength. */
export const sunRim = { dir: { value: new THREE.Vector3(0, 0, -1) }, amount: { value: 0.75 }, color: { value: new THREE.Color(1.0, 0.56, 0.24) } };
/** hover light sweep across the body (screen-space band travelling left → right) — driven from Car.tsx */
export const sweep = { pos: { value: -2 }, amount: { value: 0 } };

/**
 * Paint shader additions (chained after the hover rim):
 *  - pearl: facing/grazing hue shift (warm cream face → faint cool silver flank), weighted by `amount` (pearl finish only)
 *  - golden-hour back-light: a warm Fresnel rim only on the edges that face the low sun (roof line, shoulders, tail)
 */
function paintShader(mat: THREE.MeshPhysicalMaterial, amount: { value: number }, key: string, sunMul = 1, sweepMul = 1) {
  const mul = { value: sunMul };
  const swMul = { value: sweepMul };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    prev.call(mat, shader, renderer);
    shader.uniforms.uPearl = amount;
    shader.uniforms.uSunView = sunRim.dir;
    shader.uniforms.uSunRim = sunRim.amount;
    shader.uniforms.uSunCol = sunRim.color;
    shader.uniforms.uSunMul = mul;
    shader.uniforms.uSweepPos = sweep.pos;
    shader.uniforms.uSweepAmt = sweep.amount;
    shader.uniforms.uSweepMul = swMul;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uPearl;\nuniform vec3 uSunView;\nuniform float uSunRim;\nuniform vec3 uSunCol;\nuniform float uSunMul;\nuniform float uSweepPos;\nuniform float uSweepAmt;\nuniform float uSweepMul;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n{ float pf = 1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition)));\n' +
          '  diffuseColor.rgb *= mix(vec3(1.0), mix(vec3(1.02, 1.0, 0.965), vec3(0.93, 0.97, 1.03), pf * pf), uPearl); }',
      )
      .replace(
        '#include <opaque_fragment>',
        '{ vec3 vv = normalize(vViewPosition); float sf = pow(1.0 - saturate(dot(normal, vv)), 3.0);\n' +
          '  outgoingLight += uSunCol * sf * saturate(dot(normal, uSunView) + 0.3) * uSunRim * uSunMul;\n' +
          // hover: a soft studio light band sweeping across the panels (screen-space slope, slightly tilted)
          '  float sx = (vViewPosition.x + 0.35 * vViewPosition.y) / max(vViewPosition.z, 0.1);\n' +
          '  float band = exp(-pow((sx - uSweepPos) * 16.0, 2.0)); float swa = uSweepAmt * uSweepMul;\n' +
          // reads on white too: the panel dims 14 % outside the band while a specular streak rides inside it
          '  outgoingLight *= 1.0 - 0.2 * swa * (1.0 - band);\n' +
          '  outgoingLight += vec3(0.6, 0.55, 0.48) * band * swa * (0.45 + 0.55 * sf); }\n#include <opaque_fragment>',
      );
  };
  mat.customProgramCacheKey = () => key;
}

export function createCarMaterials(): CarMaterials & { pearl: { value: number } } {
  const f = FINISHES[0];
  const paint = addRim(
    new THREE.MeshPhysicalMaterial({
      name: 'BAHA Paint',
      color: f.color,
      metalness: f.metalness,
      roughness: f.roughness,
      clearcoat: f.clearcoat,
      clearcoatRoughness: f.clearcoatRoughness,
      envMapIntensity: f.env,
      ior: 1.8,
      specularIntensity: 2.2, // F0 ≈ 0.15 under the clearcoat → the sky reads in the white paint (no flake / grain)
      side: THREE.DoubleSide, // separated panels at .02 show a painted inner skin, not a see-through edge
    }),
    { color: RIM_WARM, power: 2.4 },
  );
  const pearl = { value: 1 };
  paintShader(paint.material, pearl, 'baha-car-paint-v5');

  const accent = addRim(
    // gloss carbon-black skirts / diffuser: dark but never a hole — clear-coated, reflective, AO'd
    new THREE.MeshPhysicalMaterial({ name: 'BAHA Accent', color: f.accent, metalness: f.accentMetal, roughness: f.accentRough, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6, side: THREE.DoubleSide }),
    { color: RIM_WARM, power: 2.4 },
  );
  paintShader(accent.material, { value: 0 }, 'baha-car-accent-v5', 0.15, 0); // trim keeps its colour on hover
  // tinted glazing, no transmission pass (one extra full-scene render would cost the iGPU ~40% of its frame)
  const glass = addRim(
    new THREE.MeshPhysicalMaterial({
      name: 'BAHA Glass',
      color: '#050608',
      metalness: 0,
      roughness: 0.02,
      envMapIntensity: 0.85,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    }),
    { color: '#ffe6c8', power: 1.8 },
  );
  const front = addRim(new THREE.MeshStandardMaterial({ name: 'BAHA Headlight', color: '#0d0f12', emissive: '#e9f1ff', emissiveIntensity: 1.2, roughness: 0.25, metalness: 0 }), {
    color: '#ffffff',
    power: 1.5,
  });
  const rear = addRim(new THREE.MeshStandardMaterial({ name: 'BAHA Taillight', color: '#1c0204', emissive: '#ff0a12', emissiveIntensity: 0.5, roughness: 0.3, metalness: 0 }), {
    color: '#ff6b6b',
    power: 1.5,
  });
  const signal = new THREE.MeshStandardMaterial({ name: 'BAHA Signal', color: '#1a0f04', emissive: '#ff8a1c', emissiveIntensity: 0.25, roughness: 0.3 });
  const rimDark = addRim(new THREE.MeshStandardMaterial({ name: 'BAHA Rim', color: '#0d0e10', metalness: 0.1, roughness: 0.3, envMapIntensity: 1.1, emissive: '#fff1de', emissiveIntensity: 0 }), {
    color: RIM_WARM,
    power: 2,
  });
  const rimLip = addRim(new THREE.MeshStandardMaterial({ name: 'BAHA Rim lip', color: '#0c0d0f', metalness: 0, roughness: 0.12, envMapIntensity: 1.5, emissive: '#fff1de', emissiveIntensity: 0 }), {
    color: RIM_WARM,
    power: 2,
  });
  const caliper = new THREE.MeshStandardMaterial({ name: 'BAHA Caliper', color: '#c2361c', metalness: 0.25, roughness: 0.36, emissive: '#ff5a1f', emissiveIntensity: 0 });
  const interior = new THREE.MeshStandardMaterial({ name: 'BAHA Leather', color: f.interior, roughness: 0.55, metalness: 0 });
  const plate = new THREE.MeshStandardMaterial({ name: 'BAHA Plate', color: '#ffffff', roughness: 0.45, metalness: 0.05 });

  return {
    paint: paint.material,
    paintRim: paint.uniforms,
    accent: accent.material,
    accentRim: accent.uniforms,
    glass: glass.material,
    glassRim: glass.uniforms,
    front: front.material,
    frontRim: front.uniforms,
    rear: rear.material,
    rearRim: rear.uniforms,
    signal,
    rimDark: rimDark.material,
    rimDarkRim: rimDark.uniforms,
    rimLip: rimLip.material,
    rimLipRim: rimLip.uniforms,
    caliper,
    interior,
    plate,
    pearl,
  };
}

/** BAHA number plate (EU proportions), drawn with the self-hosted IBM Plex Mono — replaces the sample-model logo plate. */
export function plateTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 112;
  const t = new THREE.CanvasTexture(c);
  const draw = () => {
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#e9e7e1';
    ctx.fillRect(0, 0, 512, 112);
    ctx.strokeStyle = '#1d1d1b';
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, 502, 102);
    ctx.fillStyle = '#1d1d1b';
    ctx.fillRect(10, 10, 40, 92);
    ctx.fillStyle = '#e9e7e1';
    ctx.font = '500 20px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VN', 30, 84);
    ctx.fillStyle = '#1d1d1b';
    ctx.font = '500 60px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText('BAHA·GT 01', 280, 60);
    t.needsUpdate = true;
  };
  draw();
  document.fonts?.load('500 60px "IBM Plex Mono"').then(draw).catch(() => undefined);
  t.flipY = false; // glTF UV convention
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Soft round sprite for dust motes. */
export function dotTexture() {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const gr = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Fine dust/gravel grain for the road shoulders and desert floor (tileable). */
export function grainTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(S, S);
  let s = 21;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S, T = Math.PI * 2;
      const low = Math.sin(u * T * 3 + Math.sin(v * T * 2) * 1.3) * 0.5 + Math.sin(v * T * 4 + u * T) * 0.5;
      const g = (r() - 0.5) * 46 + (r() > 0.985 ? -60 : 0);
      const base = 214 + low * 10 + g;
      const i = (y * S + x) * 4;
      img.data[i] = base;
      img.data[i + 1] = base * 0.97;
      img.data[i + 2] = base * 0.92;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
