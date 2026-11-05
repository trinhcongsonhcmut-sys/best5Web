import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import { damp, range, smoothstep } from '../../lib/math';
import { buildVilla, Y } from './architecture';
import type { Part } from './kit';
import { createLib, FACADES, type Lib } from './materials';
import { colliders, hoverUi, nightOf } from './state';

const PARTS: Exclude<Part, 'none'>[] = ['mass', 'glass', 'roof', 'fins', 'pool'];
/** rim strength per part (glass/water need more to read) */
const STRENGTH: Record<Exclude<Part, 'none'>, number> = { mass: 1.5, glass: 2.4, roof: 0.75, fins: 1.9, pool: 0.9 };

export function Villa({ lib }: { lib: Lib }) {
  const { parts, edges } = useMemo(() => {
    const v = buildVilla();
    // camera collision: every volume + the cantilever slabs / roofs + terrace + roof terrace
    colliders.boxes = [
      ...v.edges,
      { min: [-12.4, Y.gfCeil, -6.1], max: [4.6, Y.l1, 6.2] },
      { min: [-12.4, Y.l1Ceil, -6.1], max: [4.6, Y.roof, 6.2] },
      { min: [5.9, Y.gfCeil, -5.4], max: [13.8, Y.l1, 5.0] },
      { min: [5.9, Y.bCeil, -5.4], max: [13.8, Y.bRoof, 5.0] },
      { min: [-12.9, 0, -6.6], max: [14.4, Y.terrace, 8.8] },
      { min: [-9.9, Y.roof, -5.5], max: [3.7, Y.deck + 1.1, 3.5] },
    ];
    return v;
  }, []);
  const index = variantStore.use((s) => s.index);
  const hovered = useRef<Part | null>(null);
  const hoverGroup = useRef<THREE.Group>(null);
  const lastCam = useRef(new THREE.Vector3(1e9, 0, 0));
  const camDirty = useRef(false);
  /** a REAL mouse/pen position over the canvas (never the default centre pointer) */
  const pointerIn = useRef(false);
  const ndc = useRef(new THREE.Vector2(9, 9));
  const tapTimer = useRef(0);
  const repick = useRef(0);
  const gl = useThree((s) => s.gl);
  const raycaster = useThree((s) => s.raycaster);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const el = gl.domElement;
    const toNdc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.current.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      hoverUi.x = e.clientX;
      hoverUi.y = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointerIn.current = true;
      toNdc(e);
    };
    const leave = (e?: PointerEvent) => {
      if (e && e.pointerType === 'touch') return; // touch fires pointerleave right after a tap — keep the tap label
      pointerIn.current = false;
      ndc.current.set(9, 9);
      clearHover();
    };
    const docOut = (e: MouseEvent) => {
      if (!e.relatedTarget) leave();
    };
    // touch: a short tap picks once and shows the label for 2 s
    let downAt = 0, dx = 0, dy = 0;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      downAt = performance.now();
      dx = e.clientX;
      dy = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || performance.now() - downAt > 220 || Math.hypot(e.clientX - dx, e.clientY - dy) > 8) return;
      toNdc(e);
      const part = pick();
      if (!part) {
        clearHover(); // tapping empty space dismisses the label
        return;
      }
      setHover(part, e.clientX, e.clientY);
      window.clearTimeout(tapTimer.current);
      tapTimer.current = window.setTimeout(clearHover, 2000);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    document.addEventListener('mouseout', docOut);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
      document.removeEventListener('mouseout', docOut);
      window.clearTimeout(tapTimer.current);
    };
  }, [gl]);
  const hv = useRef<Record<string, number>>({ mass: 0, glass: 0, roof: 0, fins: 0, pool: 0 });
  const tint = useMemo(() => new THREE.Color(), []);
  const water = useRef<THREE.Mesh>(null);
  const holo = useRef<THREE.LineSegments>(null);

  // primary → QC bridge
  useEffect(() => {
    lib.primary.material.emissive.set('#3a2610');
    bridge.registerMaterial('primary', lib.primary.material, lib.primary.uniforms.uRim);
    bridge.registerMaterial('glass', lib.get('glass', 'glass'));
    bridge.registerMaterial('water', lib.get('pool', 'water'));
    return () => {
      bridge.unregisterMaterial('primary');
      bridge.unregisterMaterial('glass');
      bridge.unregisterMaterial('water');
    };
  }, [lib]);

  // variant → swap the actual PBR scan (albedo + normal + AO/roughness); tint / roughness / relief ease in useFrame
  useEffect(() => {
    const set = lib.sets[FACADES[index].set];
    for (const m of lib.stones) {
      m.map = set.map;
      m.normalMap = set.normal;
      m.roughnessMap = set.arm;
      m.aoMap = set.arm;
    }
    bridge.state.extra.facade = FACADES[index].id;
  }, [index, lib]);

  // hologram wireframe of the volumes (reference D's "outline overlay" at the rooftop beat)
  const holoGeo = useMemo(() => {
    const pts: number[] = [];
    for (const e of edges) {
      const [x0, y0, z0] = e.min, [x1, y1, z1] = e.max;
      const c = [
        [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
        [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1],
      ];
      const L = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
      for (const [a, b] of L) pts.push(...c[a], ...c[b]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [edges]);
  const holoMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#9fdcff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false, blending: THREE.AdditiveBlending }), []);

  useEffect(() => () => {
    parts.forEach((p) => p.geometry.dispose());
    holoGeo.dispose();
    holoMat.dispose();
  }, [parts, holoGeo, holoMat]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = scrollState.smooth;
    const n = nightOf(p);

    // façade variant (colour + roughness + relief) eased
    const f = FACADES[index];
    tint.set(f.tint);
    for (const m of lib.stones) {
      m.color.lerp(tint, 1 - Math.exp(-7 * dt));
      m.roughness = damp(m.roughness, f.rough, 7, dt);
      const ns = damp(m.normalScale.x, f.normal, 7, dt);
      m.normalScale.set(ns, ns);
    }
    lib.stoneSat.value = damp(lib.stoneSat.value, f.sat, 7, dt);

    // interior / LED / downlight ramps dusk → night (pure function of p)
    for (const [m, a, b] of lib.ramps) m.emissiveIntensity = a + (b - a) * n;
    for (const [m, a, b] of lib.cards) m.opacity = a + (b - a) * n;

    // camera flying (scroll / orbit) → drop the hover; once it settles, re-pick under the still pointer
    const cp = state.camera.position;
    if (cp.distanceToSquared(lastCam.current) > 1e-4) {
      camDirty.current = true;
      if (hovered.current) clearHover();
    } else if (camDirty.current) {
      camDirty.current = false;
      if (pointerIn.current) {
        const part = pick();
        if (part) setHover(part, hoverUi.x, hoverUi.y);
      }
    }
    lastCam.current.copy(cp);
    // fast pointer jumps (part → sky in one event) can skip R3F's pointerout: while the pointer is on the canvas
    // and the camera is still, re-pick every 4th frame and drop / switch the hover to what is really under it
    if (pointerIn.current && !camDirty.current && ++repick.current % 4 === 0) {
      const part = pick();
      if (!part) {
        if (hovered.current) clearHover();
      } else if (part !== hovered.current) setHover(part, hoverUi.x, hoverUi.y);
    }

    // hover per part (exponential smoothing → no flicker)
    let best = 0;
    let bestId: string | null = null;
    let any = 0;
    for (const part of PARTS) {
      const v = (hv.current[part] = damp(hv.current[part], hovered.current === part ? 1 : 0, 9, dt));
      if (v < 0.002 && hovered.current !== part) hv.current[part] = 0;
      any = Math.max(any, hv.current[part]);
      if (hv.current[part] > best) {
        best = hv.current[part];
        bestId = part;
      }
    }
    for (const part of PARTS) {
      const rims = lib.rims.get(part) ?? [];
      // the main mass also glows softly whenever any part of the house is pointed at
      const v = part === 'mass' ? Math.max(hv.current.mass, any * 0.45) : hv.current[part];
      for (const u of rims) u.uRim.value = v * STRENGTH[part];
    }
    const glass = lib.get('glass', 'glass') as THREE.MeshPhysicalMaterial;
    glass.opacity = 0.32 - 0.1 * n + hv.current.glass * 0.1;
    const pool = lib.get('pool', 'water');
    pool.emissiveIntensity += hv.current.pool * 0.25;
    const stone = lib.primary.material;
    stone.emissiveIntensity = Math.max(hv.current.mass, any * 0.45) * 0.35;
    const h = bridge.state.hover;
    h.value = best;
    h.id = best > 0.002 ? bestId : null;
    bridge.state.extra.night = Number(n.toFixed(3));

    // water: scrolling normal map + overflow sheet
    const t = state.clock.elapsedTime;
    lib.waterN.offset.set(t * 0.012, t * 0.02);


    // hologram outline fades in around the rooftop beat and out again
    holoMat.opacity = smoothstep(0.66, 0.75, p) * (1 - range(0.82, 0.92, p)) * 0.32;
    if (holo.current) holo.current.visible = holoMat.opacity > 0.002;
  });

  /** the pool basin seen from below the roof deck reads as roof, not water */
  function resolve(part: Part | null): Part | null {
    return part === 'pool' && camera.position.y < Y.deck ? 'roof' : part;
  }
  function pick(): Part | null {
    if (!hoverGroup.current || Math.abs(ndc.current.x) > 1 || Math.abs(ndc.current.y) > 1) return null;
    raycaster.setFromCamera(ndc.current, camera);
    const hit = raycaster.intersectObject(hoverGroup.current, true).find((h) => h.object.userData.part);
    return hit ? resolve(hit.object.userData.part as Part) : null;
  }
  function setHover(part: Part | null, x: number, y: number) {
    hovered.current = part;
    hoverUi.part = part;
    hoverUi.x = x;
    hoverUi.y = y;
    const el = hoverUi.el;
    if (el) {
      el.dataset.part = part ?? '';
      // keep the card fully on screen: flip to the left of / above the pointer near the right / bottom edges
      const card = part ? el.querySelector<HTMLElement>(`[data-for='${part}']`) : null;
      let tx = x, ty = y;
      if (card) {
        const w = card.offsetWidth, h = card.offsetHeight, m = 8;
        if (x + 18 + w > window.innerWidth - m) tx = x - w - 36; // card sits at +18 px → mirror it to −18 px
        if (y + 14 + h > window.innerHeight - m) ty = y - h - 28;
        tx = Math.max(m - 18, Math.min(tx, window.innerWidth - m - 18 - w));
        ty = Math.max(m - 14, Math.min(ty, window.innerHeight - m - 14 - h));
      }
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    }
  }
  function clearHover() {
    hovered.current = null;
    hoverUi.part = null;
    if (hoverUi.el) hoverUi.el.dataset.part = '';
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.nativeEvent.pointerType === 'touch') return; // touch uses the tap path
    if (camDirty.current) return; // camera still moving: wait for it to settle
    pointerIn.current = true;
    setHover(resolve((e.object.userData.part as Part) ?? null), e.nativeEvent.clientX, e.nativeEvent.clientY);
  };
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.pointerType === 'touch') return; // touch label lives on its 2 s timer
    clearHover();
  };

  return (
    <group name="villa">
      <group ref={hoverGroup} onPointerMove={onMove} onPointerOut={onOut}>
        {parts.map(({ part, mat, geometry }) => {
          const material = lib.get(part, mat);
          const transparent = mat === 'glass' || mat === 'curtain' || mat === 'wash' || mat === 'scallop';
          const emissiveOnly = mat === 'glow' || mat === 'led' || mat === 'glowCool' || mat === 'wash' || mat === 'scallop';
          return (
            <mesh
              key={`${part}:${mat}`}
              name={`${part}:${mat}`}
              geometry={geometry}
              material={material}
              castShadow={!transparent && !emissiveOnly}
              receiveShadow={!transparent && !emissiveOnly}
              userData={{ part: part === 'none' ? null : part }}
              raycast={part === 'none' ? () => undefined : undefined}
              renderOrder={transparent ? 2 : 0}
            />
          );
        })}
        {/* infinity pool water + overflow sheet */}
        <mesh name="pool:waterplane" ref={water} position={[-2.0, Y.water, 0.02]} rotation-x={-Math.PI / 2} material={lib.get('pool', 'water')} userData={{ part: 'pool' }} renderOrder={3}>
          <planeGeometry args={[8.6, 3.66]} />
        </mesh>
      </group>
      <lineSegments ref={holo} geometry={holoGeo} material={holoMat} visible={false} renderOrder={5} />
    </group>
  );
}

export { createLib };
