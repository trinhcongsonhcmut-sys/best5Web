/**
 * /fnb scene root: one camera path through two art directions.
 *  Cafe (espresso → caramel, warm low key + caramel rim) → Restaurant (burgundy → cream, soft daylight softbox).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig } from '../../lib/CameraRig';
import { addRim } from '../../lib/rim';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import { damp, lerp, smoothstep } from '../../lib/math';
import { Backdrop } from './Backdrop';
import { Beans, Cup } from './Cafe';
import { Restaurant } from './Restaurant';
import { hoverResets } from './hover';
import { GLAZES, STOPS, lensShift, plateIn, sceneMix } from './timeline';

function makeGlaze(rim: string) {
  const g = GLAZES[0];
  const m = new THREE.MeshPhysicalMaterial({ color: g.color, roughness: g.roughness, clearcoat: g.clearcoat, clearcoatRoughness: 0.12, sheen: 0.15, sheenColor: new THREE.Color('#fff6ea'), emissive: new THREE.Color('#ffb070'), emissiveIntensity: 0 });
  return addRim(m, { color: rim, power: 2 });
}

/** absolute elevation window: never below the horizon (no views under the saucer / plate), never straight down */
const LIMITS = { elevMin: 0.15, elevMax: 1.0, dollyMin: 0.65, dollyMax: 1.45 };

/** Off-axis lens shift (keeps perspective, only re-frames): subject moves right of the copy on wide screens. */
function frameShift(cam: THREE.PerspectiveCamera) {
  const W = 1000;
  const H = W / Math.max(0.1, cam.aspect);
  const p = scrollState.smooth;
  const wide = Math.min(1, Math.max(0, (cam.aspect - 1.05) / 0.4));
  const tall = Math.min(1, Math.max(0, (0.8 - cam.aspect) / 0.25));
  const s = lensShift(p) * wide;
  // portrait phones: drop the cafe hero a little so the stacked headline above never touches the cup
  const v = tall * 0.06 * (1 - sceneMix(p));
  // portrait phones at the fork hero: nudge the frame so the fork handle stays inside the screen
  const fx = tall * 0.02 * smoothstep(0.4, 0.48, p) * (1 - smoothstep(0.56, 0.64, p));
  if (s < 0.0005 && v < 0.0005 && fx < 0.0005) {
    if (cam.view?.enabled) cam.clearViewOffset();
    return;
  }
  cam.setViewOffset(W, H, (fx - s) * W, -v * H, W, H);
}

const fwd = new THREE.Vector3();
/** portrait phones: back the final plated shot off a little more so the plate rim never touches the edges */
function cameraAfter(cam: THREE.PerspectiveCamera) {
  if (cam.aspect < 0.7) {
    const p = scrollState.smooth;
    // back off at the plated finale and a little at the fork hero (plate rim must stay inside a 390 px screen)
    const k = (smoothstep(0.8, 0.95, p) * 0.24 + 0.1 * smoothstep(0.4, 0.48, p) * (1 - smoothstep(0.58, 0.68, p))) * Math.min(1, (0.7 - cam.aspect) / 0.2);
    if (k > 0) {
      cam.getWorldDirection(fwd);
      cam.position.addScaledVector(fwd, -k * 4.2);
    }
  }
  frameShift(cam);
}

export function FnbScene() {
  const cup = useMemo(() => makeGlaze('#ffd7a3'), []);
  const saucer = useMemo(() => makeGlaze('#ffd7a3'), []);
  const plate = useMemo(() => makeGlaze('#fff0dc'), []);
  useEffect(() => {
    bridge.registerMaterial('primary', cup.material, cup.uniforms.uRim);
    bridge.registerMaterial('saucer', saucer.material, saucer.uniforms.uRim);
    return () => {
      bridge.unregisterMaterial('primary');
      bridge.unregisterMaterial('saucer');
      cup.material.dispose();
      saucer.material.dispose();
      plate.material.dispose();
    };
  }, [cup, saucer, plate]);

  // hover can never stay latched: clear on release / cancel / leaving the page / scrolling
  useEffect(() => {
    const clear = () => hoverResets.forEach((f) => f());
    let lastY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - lastY) > 4) clear();
      lastY = window.scrollY;
    };
    window.addEventListener('pointerup', clear);
    window.addEventListener('pointercancel', clear);
    document.documentElement.addEventListener('pointerleave', clear);
    window.addEventListener('blur', clear);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointerup', clear);
      window.removeEventListener('pointercancel', clear);
      document.documentElement.removeEventListener('pointerleave', clear);
      window.removeEventListener('blur', clear);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const index = variantStore.use((s) => s.index);
  const glazes = useMemo(() => [cup.material, saucer.material, plate.material], [cup, saucer, plate]);
  const target = useMemo(() => new THREE.Color(), []);

  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const cKeyCafe = useMemo(() => new THREE.Color('#ffc58a'), []);
  const cKeyRest = useMemo(() => new THREE.Color('#fff2e2'), []);
  const cHemiCafe = useMemo(() => new THREE.Color('#ffcfa0'), []);
  const cHemiRest = useMemo(() => new THREE.Color('#fff4e6'), []);
  const gHemiCafe = useMemo(() => new THREE.Color('#5a3420'), []);
  const gHemiRest = useMemo(() => new THREE.Color('#b8a184'), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const vdt = Math.min(delta, 0.5);
    // the plate is on screen (burgundy hand-off + cream finale) from ~45%: compensate from then on
    const p = scrollState.smooth;
    const m = sceneMix(p);
    const plateK = Math.max(m, plateIn(p));

    // glaze variants → cup/saucer + plate (keeps clearcoat & PBR response)
    const v = GLAZES[index];
    for (let gi = 0; gi < glazes.length; gi++) {
      const mat = glazes[gi];
      target.set(v.color);
      // the plate lives in the bright cream daylight scene: compensate exposure so dark glazes still read
      // near-black / terracotta instead of washing out to taupe / pink
      if (gi === 2) target.multiplyScalar(lerp(1, v.restK, plateK));
      // real-time step (not the 50 ms-clamped one): the glaze must finish its change in ~0.6 s even when the
      // GPU is busy and frames are slow, otherwise a dark glaze stays half-way (taupe) for seconds
      mat.color.lerp(target, 1 - Math.exp(-9 * vdt));
      mat.roughness = damp(mat.roughness, v.roughness, 9, vdt);
      mat.clearcoat = damp(mat.clearcoat, v.clearcoat, 9, vdt);
      mat.envMapIntensity = damp(mat.envMapIntensity, gi === 2 ? v.env * lerp(1, v.restK, plateK) : v.env, 9, vdt);
      mat.sheen = damp(mat.sheen, v.sheen, 9, vdt);
      // dark / earthy glazes: weaker grazing (Fresnel) reflection so the body colour reads instead of the sky
      mat.specularIntensity = damp(mat.specularIntensity, v.spec, 9, vdt);
    }

    // lighting art direction cross-fade
    const k = key.current;
    if (k) {
      k.position.set(lerp(-3.2, -2.4, m), lerp(3.6, 5.2, m), lerp(2.6, 2.8, m));
      k.color.copy(cKeyCafe).lerp(cKeyRest, m);
      k.intensity = lerp(2.4, 2.1, m);
    }
    if (rim.current) {
      rim.current.intensity = lerp(1.6, 0.6, m);
    }
    if (fill.current) fill.current.intensity = lerp(3, 7, m);
    if (hemi.current) {
      hemi.current.color.copy(cHemiCafe).lerp(cHemiRest, m);
      hemi.current.groundColor.copy(gHemiCafe).lerp(gHemiRest, m);
      hemi.current.intensity = lerp(0.35, 0.6, m);
    }

    const ex = bridge.state.extra;
    ex.scene = m < 0.15 ? 'cafe' : m > 0.85 ? 'restaurant' : 'transition';
    ex.sceneMix = Math.round(m * 1000) / 1000;
    ex.glaze = v.id;
  });

  return (
    <>
      <CameraRig stops={STOPS} limits={LIMITS} fitAspect={1.5} onAfter={cameraAfter} />
      <Backdrop />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3.2} color="#ffe2bd" position={[-3, 5, 2]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#ffc999" position={[4, 1, 1]} scale={[1.5, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.0} color="#ffffff" position={[0, 2, -5]} scale={[8, 2, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.4} color="#fff3e0" position={[2, 4, 4]} scale={1.8} target={[0, 0, 0]} />
      </Environment>
      <hemisphereLight ref={hemi} args={['#ffcfa0', '#2a140a', 0.4]} />
      <directionalLight ref={key} position={[-3.2, 3.6, 2.6]} intensity={2.4} />
      <directionalLight ref={rim} position={[2.2, 1.4, -3]} color="#ffc08a" intensity={1.6} />
      <pointLight ref={fill} position={[2.6, 0.4, 3]} color="#ffd9b8" intensity={3} distance={10} decay={2} />
      {/* soft cream bounce from below so ceramic undersides never go muddy-black */}
      <directionalLight position={[0.5, -4, 1.5]} intensity={0.2} color="#f3e6d0" />
      <Cup glaze={cup.material} glazeU={cup.uniforms} saucerGlaze={saucer.material} saucerU={saucer.uniforms} />
      <Beans />
      <Restaurant plateGlaze={plate.material} plateU={plate.uniforms} />
    </>
  );
}
