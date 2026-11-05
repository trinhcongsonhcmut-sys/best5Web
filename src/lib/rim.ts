import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { bridge } from './bridge';
import { damp } from './math';

/**
 * Hover lighting = a Fresnel rim + emissive lift injected INTO the PBR material's fragment shader
 * (onBeforeCompile). It reacts to the object only — no CSS filter, no post effect on the whole canvas.
 * Reflections / clearcoat / transmission keep working because the rim is added to outgoingLight.
 */
export interface RimUniforms {
  uRim: { value: number };
  uRimColor: { value: THREE.Color };
  uRimPower: { value: number };
}

export function addRim<T extends THREE.MeshStandardMaterial>(
  mat: T,
  opts: { color?: THREE.ColorRepresentation; power?: number; base?: number } = {},
): { material: T; uniforms: RimUniforms } {
  const uniforms: RimUniforms = {
    uRim: { value: opts.base ?? 0 },
    uRimColor: { value: new THREE.Color(opts.color ?? '#ffffff') },
    uRimPower: { value: opts.power ?? 2.6 },
  };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = uniforms.uRim;
    shader.uniforms.uRimColor = uniforms.uRimColor;
    shader.uniforms.uRimPower = uniforms.uRimPower;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uRim;\nuniform vec3 uRimColor;\nuniform float uRimPower;')
      .replace(
        '#include <opaque_fragment>',
        'float bahaRim = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), uRimPower);\n' +
          'outgoingLight += uRimColor * bahaRim * uRim;\n#include <opaque_fragment>',
      );
  };
  mat.customProgramCacheKey = () => 'baha-rim-v1';
  return { material: mat, uniforms };
}

/**
 * Spread `bind` on a <group>/<mesh>. While the pointer is over it the rim eases in (and eases out on leave,
 * exponential smoothing → no flicker). `max` scales the rim strength; the live value is mirrored to the QC bridge.
 */
export function useHoverRim(getUniforms: () => RimUniforms[], id = 'object', max = 1, speed = 9) {
  const target = useRef(0);
  const value = useRef(0);
  useFrame((_, delta) => {
    value.current = damp(value.current, target.current, speed, Math.min(delta, 0.05));
    if (value.current < 0.002 && target.current === 0) value.current = 0;
    for (const u of getUniforms()) u.uRim.value = value.current * max;
    const h = bridge.state.hover;
    if (value.current > 0 && (value.current >= h.value || h.id === id)) {
      h.value = value.current;
      h.id = id;
    } else if (h.id === id && value.current === 0) {
      h.value = 0;
      h.id = null;
    }
  });
  const bind = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      target.current = 1;
    },
    onPointerOut: () => {
      target.current = 0;
    },
  };
  return { bind, value };
}
