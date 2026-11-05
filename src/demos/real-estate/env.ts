/**
 * HDRI preparation (runs once, before bridge.ready): belfast_sunset_puresky (CC0) is box-filtered 2K → 1K and its
 * sun is clamped. The analytic key light already carries the sun (with shadows); leaving the ~10⁴× sun disc in the
 * image-based light would add a second, shadowless orange sun as a specular sheen on every rough surface (dark
 * fascias turned brown). The clamped image keeps the whole dusk sky gradient + the warm glow around the sun.
 */
import * as THREE from 'three';

const { fromHalfFloat, toHalfFloat } = THREE.DataUtils;

export function prepareEnv(src: THREE.DataTexture, maxLum = 18): THREE.DataTexture {
  const { width: w, height: h, data } = src.image as { width: number; height: number; data: Uint16Array | Float32Array };
  const half = src.type === THREE.HalfFloatType;
  const read = half ? (i: number) => fromHalfFloat((data as Uint16Array)[i]) : (i: number) => (data as Float32Array)[i];
  const W = w >> 1, H = h >> 1;
  const out = new Uint16Array(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const i = ((y * 2 + dy) * w + (x * 2 + dx)) * 4;
          r += read(i);
          g += read(i + 1);
          b += read(i + 2);
        }
      r *= 0.25;
      g *= 0.25;
      b *= 0.25;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      // soft knee: values below 0.5·max pass, above roll off towards max
      if (lum > maxLum * 0.5) {
        const k = maxLum * 0.5;
        const t = k + (maxLum - k) * (1 - Math.exp(-(lum - k) / (maxLum - k)));
        const s = t / lum;
        r *= s;
        g *= s;
        b *= s;
      }
      const o = (y * W + x) * 4;
      out[o] = toHalfFloat(r);
      out[o + 1] = toHalfFloat(g);
      out[o + 2] = toHalfFloat(b);
      out[o + 3] = toHalfFloat(1);
    }
  const t = new THREE.DataTexture(out, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  t.flipY = src.flipY;
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.wrapS = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}
