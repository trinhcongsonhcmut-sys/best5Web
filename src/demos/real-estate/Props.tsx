/**
 * CC0 Poly Haven furniture + planting (public/assets/models/polyhaven/<id>/<id>_lite.glb — optimised copies made by
 * `gltf-transform optimize --texture-compress webp --join` from the approved *_1k.gltf; plant / shrub_04 simplified
 * to 40 %). Every glTF primitive becomes ONE InstancedMesh (geometry baked to the model's node transforms), so all
 * sofas share a draw call, all shrubs share one … ≈ 10 draws for the whole set.
 * Interior pieces get a warm emissive lift (map-tinted, ramped dusk → night) — they sit in lamp-lit rooms.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Y } from './architecture';
import type { Lib } from './materials';

export const MODELS = ['sofa_03', 'modern_arm_chair_01', 'modern_ceiling_lamp_01', 'potted_plant_02', 'shrub_03', 'shrub_04'] as const;
type ModelId = (typeof MODELS)[number];
const url = (id: ModelId) => `/assets/models/polyhaven/${id}/${id}_lite.glb`;
const URLS = MODELS.map(url);
export function preloadProps() {
  useLoader.preload(GLTFLoader, URLS);
}

/** [model, x, y, z, rotY, scale] */
type Place = [ModelId, number, number, number, number, number];
const T = Y.terrace;
const PLACES: Place[] = [
  // ground floor living + dining
  ['sofa_03', -6.1, T, -0.75, 0, 1],
  ['modern_arm_chair_01', -8.3, T, 0.2, Math.PI / 2, 1],
  ['modern_arm_chair_01', -8.3, T, 1.8, Math.PI / 2, 1],
  ['modern_arm_chair_01', -3.9, T, 1.7, -1.8, 1],
  ['modern_ceiling_lamp_01', -6.0, Y.gfCeil - 1.17 * 1.2, 1.0, 0, 1.2],
  ['modern_ceiling_lamp_01', 0.3, Y.gfCeil - 1.17, 1.2, 0, 1],
  ['modern_ceiling_lamp_01', 1.4, Y.gfCeil - 1.17, 1.2, 0, 1],
  ['potted_plant_02', -10.6, T, 3.05, 0.4, 2.5],
  ['potted_plant_02', 2.95, T, 3.1, 1.9, 2.1],
  // level 1 suite + lounge
  ['sofa_03', 0.0, Y.l1, 0.3, 0, 1],
  ['modern_arm_chair_01', 2.3, Y.l1, 2.7, -1.85, 1],
  ['modern_arm_chair_01', -2.2, Y.l1, 2.2, 1.6, 1],
  ['modern_ceiling_lamp_01', 0.0, Y.l1Ceil - 1.17 * 1.2, 2.0, 0, 1.2],
  ['modern_ceiling_lamp_01', -7.0, Y.l1Ceil - 1.17, 1.4, 0, 1],
  ['potted_plant_02', -10.6, Y.l1, 3.6, 1.1, 2.3],
  // wing B upper room
  ['sofa_03', 11.0, Y.l1, -0.8, 0, 1],
  ['modern_arm_chair_01', 8.7, Y.l1, 1.5, -2.5, 1],
  ['modern_ceiling_lamp_01', 9.8, Y.bCeil - 1.17, 0.8, 0, 1],
  ['potted_plant_02', 12.6, Y.l1, 2.6, 0.7, 2.0],
  // terrace + roof deck
  ['modern_arm_chair_01', -6.6, T, 5.6, 0.25, 1],
  ['modern_arm_chair_01', -5.2, T, 5.5, -0.25, 1],
  ['modern_arm_chair_01', -7.9, T, 7.0, 1.4, 1],
  ['potted_plant_02', -11.4, T, 7.9, 0.2, 1.7],
  ['potted_plant_02', 3.5, T, 7.6, 1.2, 1.5],
  ['modern_arm_chair_01', -8.4, Y.deck, -4.4, Math.PI / 2, 1],
  ['modern_arm_chair_01', -8.4, Y.deck, -3.2, Math.PI / 2, 1],
];

/**
 * foundation planting beds (x, z, scale, variant): the scans are small perennials (shrub_03 ≈ 0.4 m, shrub_04
 * ≈ 0.25 m), so each bed is a tight clump of 6–7 rotated instances → reads as one lush mixed planting
 */
export const SHRUB_BEDS: [number, number, number, 0 | 1][] = [];
{
  const r = (i: number) => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
  const bed = (cx: number, cz: number, n: number, seed: number) => {
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + seed, d = 0.25 + 0.75 * Math.sqrt((i + 0.5) / n);
      SHRUB_BEDS.push([cx + Math.cos(a) * d, cz + Math.sin(a) * d, 2.1 + r(seed * 7 + i) * 0.9, i % 3 === 1 ? 1 : 0]);
    }
  };
  bed(-12.3, 9.65, 8, 1);
  bed(-9.7, 9.75, 6, 2);
  bed(12.2, 9.65, 8, 3);
  bed(14.75, 8.4, 6, 4);
  bed(15.1, 3.2, 5, 5);
  bed(-13.6, 2.4, 5, 6);
}

/** dusk → night emissive lift for interior furniture (fake lamp light) */
const INTERIOR: Partial<Record<ModelId, [number, number]>> = {
  sofa_03: [0.12, 0.28],
  modern_arm_chair_01: [0.12, 0.28],
  potted_plant_02: [0.06, 0.14],
};

interface Part {
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
}
function bake(scene: THREE.Object3D): Part[] {
  scene.updateMatrixWorld(true);
  const byMat = new Map<THREE.MeshStandardMaterial, THREE.BufferGeometry[]>();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (mat.transparent && mat.name.includes('fringe')) return; // sofa_03 fringe (alpha-blended) — not worth a sorted pass
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    const list = byMat.get(mat) ?? [];
    list.push(g);
    byMat.set(mat, list);
  });
  return [...byMat.entries()].map(([material, geos]) => ({ geometry: geos.length > 1 ? mergeGeometries(geos)! : geos[0], material }));
}
/** shrub scans: split the joined row back into clumps around the origin (each sprig re-centred on x/z) */
function recentre(g: THREE.BufferGeometry) {
  g.computeBoundingBox();
  const b = g.boundingBox!;
  g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  return g;
}

function PropMesh({ part, mats, shadow }: { part: Part; mats: THREE.Matrix4[]; shadow: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current!;
    mats.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [mats]);
  return <instancedMesh ref={ref} args={[part.geometry, part.material, mats.length]} castShadow={shadow} receiveShadow raycast={() => undefined} />;
}

export function Props({ lib }: { lib: Lib }) {
  const gltfs = useLoader(GLTFLoader, URLS);
  const groups = useMemo(() => {
    const M = (x: number, y: number, z: number, ry: number, s: number) =>
      new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s));
    const out: { key: string; part: Part; mats: THREE.Matrix4[]; shadow: boolean }[] = [];
    MODELS.forEach((id, i) => {
      let mats: THREE.Matrix4[];
      if (id === 'shrub_03' || id === 'shrub_04') {
        const v = id === 'shrub_03' ? 0 : 1;
        mats = SHRUB_BEDS.filter((b) => b[3] === v).map(([x, z, s], k) => M(x, 0, z, k * 2.39, s * (v ? 1.5 : 1)));
      } else mats = PLACES.filter((p) => p[0] === id).map(([, x, y, z, ry, s]) => M(x, y, z, ry, s));
      if (!mats.length) return;
      for (const part of bake(gltfs[i].scene)) {
        if (id.startsWith('shrub')) {
          recentre(part.geometry);
          part.material.color.set('#7f9a5c'); // deeper, healthier green than the pale scan under the dusk haze
        }
        const m = part.material;
        if (m.alphaTest > 0 || m.alphaMap || m.name.includes('leaves') || id.startsWith('shrub')) {
          m.alphaTest = Math.max(m.alphaTest, 0.5);
          m.transparent = false;
        }
        const ramp = INTERIOR[id];
        if (ramp) {
          m.emissive = new THREE.Color('#ff9a52');
          m.emissiveMap = m.map;
          m.emissiveIntensity = ramp[0];
          lib.ramps.push([m, ramp[0], ramp[1]]);
        }
        if (id === 'modern_ceiling_lamp_01' && /globe|glass/i.test(m.name)) {
          m.emissive = new THREE.Color('#ffc27e');
          m.emissiveIntensity = 1.6;
          lib.ramps.push([m, 1.6, 3.2]);
        }
        out.push({ key: `${id}:${m.name}`, part, mats, shadow: !id.startsWith('modern_ceiling') });
      }
    });
    return out;
  }, [gltfs, lib]);
  return (
    <group name="props">
      {groups.map((g) => (
        <PropMesh key={g.key} part={g.part} mats={g.mats} shadow={g.shadow} />
      ))}
    </group>
  );
}
