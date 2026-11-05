/**
 * "Next look" preview (mechanic from reference E2): a small real 3D jacket in the NEXT colourway, pinned to the
 * lower-right of the viewport (camera-anchored, slow turntable). Click = next colourway. It is also the launch
 * point of the swap: the incoming hero jacket flies out of this spot (state.previewOnPlane / previewScaleOnPlane).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import { easeInOutCubic, range, smoothstep } from '../../lib/math';
import { buildLowJacket, MIDRES } from './geometry';
import { COLOURWAYS } from './palette';
import { FLY_LAND, FLY_START, world } from './state';
import { useHoverRim } from '../../lib/rim';
import { createShellMaterial } from './materials';
import { palC } from './colours';

const JACKET_H = 1.45;
/** after the hand-over, the next "next look" grows back in at the thumbnail spot from here */
const REGROW = 0.82;

export function NextPreview() {
  const geo = useMemo(() => buildLowJacket(MIDRES), []);
  // the SAME shell shading as the hero (crinkle, stitches, sheen, fabric-tinted rim) but without the dissolve:
  // when this copy lands on the hero pose the two swap in one frame with no visible change
  const shell = useMemo(() => createShellMaterial(false), []);
  const mat = shell.material;
  const uniforms = shell.uniforms;
  const ref = useRef<THREE.Group>(null);
  const hitRef = useRef<THREE.Group>(null);
  const wasSwapping = useRef(false);
  const hitGeo = useMemo(() => buildLowJacket(), []);
  const hitMat = useMemo(() => new THREE.MeshBasicMaterial({ visible: false }), []);
  useEffect(() => () => { hitGeo.dispose(); hitMat.dispose(); }, [hitGeo, hitMat]);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const tmp = useMemo(() => ({ dir: new THREE.Vector3(), fwd: new THREE.Vector3(), spin: new THREE.Quaternion(), up: new THREE.Vector3(0, 1, 0), o: new THREE.Vector3() }), []);
  const tmp2 = useMemo(() => ({ hq: new THREE.Quaternion(), he: new THREE.Euler(), camUp: new THREE.Vector3() }), []);
  // hover = rim light + scale up + pointer cursor, reported to the QC bridge as id "next"
  const { bind, value: hoverT } = useHoverRim(() => [uniforms], 'next', 1.5);
  useEffect(() => () => { geo.dispose(); mat.dispose(); gl.domElement.style.cursor = ''; }, [geo, mat, gl]);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const portrait = size.width / Math.max(1, size.height) < 0.9;
    const ndcX = portrait ? 0.5 : 0.855;
    const ndcY = portrait ? -0.62 : -0.42;
    const frac = portrait ? 0.085 : 0.12; // of the viewport height
    const D = 1.6;
    const { dir, fwd, spin, up, o } = tmp;
    camera.getWorldDirection(fwd);
    dir.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();
    const k = D / Math.max(1e-3, dir.dot(fwd));
    g.position.copy(camera.position).addScaledVector(dir, k);
    const H = 2 * D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const s0 = (frac * H) / JACKET_H;

    // where this spot lands on the garment's depth plane (launch point of the incoming jacket)
    o.set(0, 0.05, 0).sub(camera.position);
    const Dj = Math.max(0.5, o.dot(fwd));
    world.previewOnPlane.copy(camera.position).addScaledVector(dir, Dj / Math.max(1e-3, dir.dot(fwd)));
    world.previewScaleOnPlane = (s0 * Dj) / D;

    const p = scrollState.smooth;
    const visScroll = 1 - smoothstep(0.56, 0.64, p) * (1 - smoothstep(0.86, 0.92, p));
    const sw = world.swap;
    void delta;
    // always a 3/4-front view (a side-on puffer reads as a tube at thumbnail size), gently swaying
    spin.setFromAxisAngle(up, -0.55 + 0.32 * Math.sin(state.clock.elapsedTime * 0.7));
    g.quaternion.copy(camera.quaternion).multiply(spin);

    // fixed click/hover target at the thumbnail spot: it never flies away, so every rapid click lands
    const hit = hitRef.current;
    if (hit) {
      hit.position.copy(g.position);
      hit.quaternion.copy(g.quaternion);
      hit.scale.setScalar(Math.max(1e-4, s0 * visScroll));
    }
    // a swap just started: drop the thumbnail hover state (rim + QC bridge) so it isn't carried into the flight
    if (sw < 1 && !wasSwapping.current) bind.onPointerOut();
    wasSwapping.current = sw < 1;

    let idx = sw < 1 ? world.index : (world.index + 1) % COLOURWAYS.length;
    let sc = s0 * visScroll * (1 + 0.08 * hoverT.current);
    const flying = sw < 1 && world.mode === 'fly' && sw >= FLY_START;
    if (flying) {
      if (sw < FLY_LAND) {
        // this copy IS the incoming garment: it leaves the thumbnail spot while the old jacket is still burning
        // off near the centre (two jackets on screen) and lands on the hero pose
        const k = easeInOutCubic(range(FLY_START, FLY_LAND, sw));
        const { hq, he, camUp } = tmp2;
        he.set(0, world.heroRotY, world.heroRotZ);
        hq.setFromEuler(he);
        camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
        // mid-scroll the hero sits on the right, right above the colour picker: depart from above the
        // thumbnail and arc UP (clear of the picker); elsewhere arc down (clear of the headline)
        const mid = smoothstep(0.34, 0.42, p) * (1 - smoothstep(0.58, 0.64, p));
        g.position.addScaledVector(camUp, mid * 0.14 * H * (1 - k));
        g.position.lerp(world.heroPos, k);
        const depth = D + (Dj - D) * k;
        const bend = -0.55 + 0.85 * mid;
        g.position.addScaledVector(camUp, bend * Math.sin(Math.PI * k) * (depth / Dj));
        // turn to the hero pose early so the flight never shows a long side-on (tube) view
        g.quaternion.slerp(hq, Math.min(1, Math.sqrt(k) * 1.15));
        sc = s0 + (1 - s0) * k;
        idx = world.index;
      } else {
        // landed: the hero took over in this very frame; the next "next look" grows back in at the thumbnail
        sc *= smoothstep(REGROW, 1, sw);
      }
    }
    g.scale.setScalar(Math.max(1e-4, sc));
    g.visible = sc > 1e-3;
    const pc = palC[idx];
    mat.color.copy(pc.shell);
    mat.sheenColor.copy(pc.sheen);
    mat.roughness = COLOURWAYS[idx].roughness;
    mat.clearcoat = COLOURWAYS[idx].clearcoat;
    shell.extra.uStitch.value = 0.75 + 0.25 * range(0.6, 0.75, scrollState.smooth);
    uniforms.uRimColor.value.copy(pc.rim);
    // the hover rim belongs to the thumbnail only — never carried into the flight
    if (sw < 1) uniforms.uRim.value = 0;
  });

  return (
    <>
      <group ref={ref}>
        <mesh geometry={geo} material={mat} raycast={() => null} />
      </group>
      <group ref={hitRef}>
        <mesh
          geometry={hitGeo}
          material={hitMat}
          onClick={(e) => {
            e.stopPropagation();
            // every click advances exactly one colourway from the REQUESTED one (clicks queue up during a swap;
            // the running transition retargets, so jacket, world, label, tone and bridge always agree)
            variantStore.set({ index: (variantStore.get().index + 1) % COLOURWAYS.length });
          }}
          onPointerOver={(e) => {
            bind.onPointerOver(e);
            gl.domElement.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            bind.onPointerOut();
            gl.domElement.style.cursor = '';
          }}
        />
      </group>
    </>
  );
}
