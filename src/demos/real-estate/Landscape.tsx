/**
 * Site + world: wet forecourt (low-res reflector), road with lamps, lawn, site walls, instanced palms / bamboo /
 * canopy trees, a baked AO decal grounding everything, and the hazy depth layers (tree line, city, two hill rings).
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { WetCourt } from './WetCourt';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Lib } from './materials';
import { colliders, nightOf } from './state';
import { cached, cityWindows, frondTexture, glowTexture, grainTexture, groundAO, leafCardTexture, paverTexture, rng, trunkTexture, TILE } from './textures';
import { boxUV } from './kit';

// ───────── placements ─────────
type P3 = [number, number, number]; // x, z, scale
// placed by projecting every palm into the 0/25/50/62/75/100 % framings (± orbit yaw): no trunk closer than ~16 m
// crosses the middle of a scripted shot — near palms frame the edges instead of splitting the subject.
const PALMS: P3[] = [
  [-15, 11, 1.05], [-17.5, 15.5, 0.92], [-21, 20, 1.12], [21, 10, 1.0], [23, 15, 1.15], [25, 21, 0.9],
  [-26, 24, 1.1], [-38, 23, 1.0], [30, 23, 1.05], [42, 24, 0.95], [-21, -10, 1.1], [-16, -15, 0.95],
  [22, -15, 1.05], [25, -6, 0.9], [8, -15, 1.1], [-6, -16, 1.0], [26, 4, 1.2], [-22, 4, 1.15],
  [33, 37, 1.25], [-30, 38, 1.2], [21, 41, 1.15], [-12, 41, 1.1], [52, 10, 1.1], [-50, 6, 1.0],
];
const CANOPY_SEED = 4242;
const COURT_POS: [number, number, number] = [1, 0.016, 15.6];
const COURT_SIZE: [number, number] = [30, 13];

/**
 * Foliage shading fix: thin alpha cards lit with their geometric normal go black whenever the back face points at
 * the camera. Instead every blade gets BOTH windings (front-side material only) and a normal bent towards the sky
 * plus outwards from the plant axis — so leaves read lit-from-above from every orbit angle, like real canopy.
 */
function foliage(src: THREE.BufferGeometry, axisX = 0, axisZ = 0, up = 0.75) {
  const g = src.index ? src.toNonIndexed() : src.clone();
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const n = pos.count;
  const P = new Float32Array(n * 2 * 3), N = new Float32Array(n * 2 * 3), U = new Float32Array(n * 2 * 2);
  const v = new THREE.Vector3(), nn = new THREE.Vector3(), upV = new THREE.Vector3(0, up, 0);
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i);
    nn.set(v.x - axisX, 0, v.z - axisZ);
    if (nn.lengthSq() < 1e-6) nn.set(1, 0, 0);
    nn.normalize().multiplyScalar(1 - up).add(upV).normalize();
    for (const k of [0, 1]) {
      // second copy: reversed winding (swap vertices 1 and 2 of each triangle)
      const tri = Math.floor(i / 3), c = i % 3;
      const j = k === 0 ? i : tri * 3 + (c === 0 ? 0 : 3 - c);
      const o = k * n + j;
      P.set([v.x, v.y, v.z], o * 3);
      N.set([nn.x, nn.y, nn.z], o * 3);
      U.set([uv.getX(i), uv.getY(i)], o * 2);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  g.dispose();
  return out;
}

function makePalmGeometries() {
  // trunk: tapered, gently curved
  const trunk = new THREE.CylinderGeometry(0.16, 0.27, 9, 8, 10, true);
  trunk.translate(0, 4.5, 0);
  const tp = trunk.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i) / 9;
    tp.setX(i, tp.getX(i) + Math.pow(y, 2) * 0.9);
  }
  trunk.computeVertexNormals();
  const tuv = trunk.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < tuv.count; i++) tuv.setY(i, tuv.getY(i) * 3);

  // crown: 14 drooping fronds (strip geometry), leaflet alpha texture
  const fronds: THREE.BufferGeometry[] = [];
  const r = rng(7);
  for (let i = 0; i < 14; i++) {
    const len = 3.6 + r() * 0.9;
    const g = new THREE.PlaneGeometry(len, 1.5, 10, 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const lift = 0.35 + r() * 0.5;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k) + len / 2; // 0..len along the spine
      const t = x / len;
      const z = p.getY(k); // across
      // arch up then droop, leaflets fold into a V
      const y = Math.sin(t * Math.PI * 0.6) * lift * 1.6 - t * t * (1.6 + lift);
      p.setXYZ(k, x, y - Math.abs(z) * 0.35, z * (1 - t * 0.25));
    }
    g.computeVertexNormals();
    const tilt = (i % 2 ? 0.1 : -0.05) + r() * 0.15;
    g.rotateZ(tilt);
    g.rotateY((i / 14) * Math.PI * 2 + r() * 0.3);
    fronds.push(g);
  }
  const merged = mergeGeometries(fronds)!;
  const crown = foliage(merged, 0, 0, 0.7);
  crown.translate(0.9, 9, 0);
  merged.dispose();
  fronds.forEach((f) => f.dispose());
  return { trunk, crown };
}

/**
 * Palms that would split the subject fade out (screen-door dither, per instance) instead of cutting the façade:
 * a trunk whose screen position falls inside the villa's projected footprint while standing in front of it —
 * or any palm within 7 m of the lens — eases to invisible, and back when the view clears.
 */
const FADE_VERT = ['attribute float aFade;\nvarying float vFade;\n', 'vFade = aFade;\n'];
const FADE_FRAG = 'varying float vFade;\n';
const FADE_DISCARD = 'if (vFade < 0.999 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) > vFade) discard;\n';
function withFade<T extends THREE.Material>(m: T) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = FADE_VERT[0] + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + FADE_VERT[1]);
    sh.fragmentShader = FADE_FRAG + sh.fragmentShader.replace('void main() {', 'void main() {\n' + FADE_DISCARD);
  };
  m.customProgramCacheKey = () => 'baha-palm-fade';
  return m;
}
const VILLA_CORNERS = [-12.5, 13.6].flatMap((x) => [0, 16].flatMap((y) => [-8.6, 9.5].map((z) => new THREE.Vector3(x, y, z))));
const _v = new THREE.Vector3();

function Instanced({ geometry, material, mats, colors, castShadow = true, receiveShadow = false }: { geometry: THREE.BufferGeometry; material: THREE.Material; mats: THREE.Matrix4[]; colors?: THREE.Color[]; castShadow?: boolean; receiveShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    mats.forEach((x, i) => m.setMatrixAt(i, x));
    colors?.forEach((c, i) => m.setColorAt(i, c));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [mats, colors]);
  return <instancedMesh ref={ref} args={[geometry, material, mats.length]} castShadow={castShadow} receiveShadow={receiveShadow} />;
}

const M = (x: number, y: number, z: number, ry = 0, s = 1, sy = s, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, sy, s));

export function Landscape({ lib }: { lib: Lib }) {
  const res = useMemo(() => {
    const frond = cached('frond2', frondTexture);
    const leaf = cached('leaf2', leafCardTexture);
    const trunkT = cached('trunk', trunkTexture);
    const lawn = cached('lawn', () => grainTexture([52, 66, 44], 0.5, 11, 256, 8));
    lawn.repeat.set(60, 60);
    const asphalt = cached('asphalt', () => grainTexture([40, 42, 46], 0.35, 23, 128, 24));
    asphalt.repeat.set(80, 2);
    const pav = cached('pavers', paverTexture);
    pav.map.repeat.set(30 / TILE, 13 / TILE);
    pav.rough.repeat.copy(pav.map.repeat);
    const city = cached('city', cityWindows);
    const glow = cached('glow', glowTexture);
    const palms = makePalmGeometries();
    const fade = new THREE.InstancedBufferAttribute(new Float32Array(PALMS.length).fill(1), 1);
    fade.setUsage(THREE.DynamicDrawUsage);
    palms.trunk.setAttribute('aFade', fade);
    palms.crown.setAttribute('aFade', fade);

    const mats = {
      trunk: withFade(new THREE.MeshLambertMaterial({ map: trunkT, color: '#b6a58c' })),
      frond: withFade(new THREE.MeshLambertMaterial({ map: frond, alphaTest: 0.5, color: '#c9ccbd', emissive: '#1a2316', emissiveIntensity: 0.28 })),
      leaf: withFade(new THREE.MeshLambertMaterial({ map: leaf, alphaTest: 0.5, color: '#a9ae9e', emissive: '#192214', emissiveIntensity: 0.2 })),
      cane: withFade(new THREE.MeshLambertMaterial({ color: '#7f8a4a' })),
      canopy: new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#16220f', emissiveIntensity: 0.4 }),
      hedge: new THREE.MeshLambertMaterial({ color: '#2f4429' }),
      lawn: new THREE.MeshLambertMaterial({ map: lawn, color: '#d6e0ca' }),
      asphalt: new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.42, metalness: 0.0, color: '#9a9ca4', envMapIntensity: 0.9 }),
      curb: new THREE.MeshLambertMaterial({ color: '#8d8a84' }),
      line: new THREE.MeshStandardMaterial({ color: '#cfcab8', roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.05 }),
      pole: new THREE.MeshLambertMaterial({ color: '#1a1b1e' }),
      lamp: new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffd7a0', emissiveIntensity: 2 }),
      ao: new THREE.MeshBasicMaterial({ color: '#000', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      city: new THREE.MeshStandardMaterial({ color: '#141a26', roughness: 0.6, emissiveMap: city, emissive: '#ffffff', emissiveIntensity: 0.4 }),
      hillNear: new THREE.MeshBasicMaterial({ color: '#1a2333', side: THREE.DoubleSide }),
      hillFar: new THREE.MeshBasicMaterial({ color: '#2a3650', side: THREE.DoubleSide }),
      glow: new THREE.SpriteMaterial({ map: glow, color: '#ffcf8f', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }),
    };
    // alpha-tested shadows for leaves
    const depthFrond = new THREE.MeshDepthMaterial({ map: frond, alphaTest: 0.45, depthPacking: THREE.RGBADepthPacking });
    const depthLeaf = new THREE.MeshDepthMaterial({ map: leaf, alphaTest: 0.45, depthPacking: THREE.RGBADepthPacking });

    // ── instances ──
    const r = rng(CANOPY_SEED);
    // local +x is the trunk's bend direction → rotate it to point away from the villa (+ a little jitter)
    const palmM = PALMS.map(([x, z, s], i) => M(x, 0, z, Math.atan2(-z, x) + ((i * 0.37) % 0.6) - 0.3, s));
    // bamboo: clusters along the west + east boundary and the back courtyard
    const caneM: THREE.Matrix4[] = [];
    const leafM: THREE.Matrix4[] = [];
    const clusters: [number, number][] = [
      [-13.6, -7], [-13.8, -4], [-13.6, -1], [-13.8, 2], [-13.6, 5], [17.6, -7.5], [17.8, -4], [17.6, -0.5],
      [-8, -10.5], [-4, -10.8], [5, -10.6], [9, -10.4],
    ];
    for (const [cx, cz] of clusters)
      for (let i = 0; i < 9; i++) {
        const x = cx + (r() - 0.5) * 1.6, z = cz + (r() - 0.5) * 1.6;
        const h = 4.2 + r() * 2.4;
        caneM.push(M(x, h / 2, z, 0, 1, h, (r() - 0.5) * 0.08, (r() - 0.5) * 0.08));
        for (let j = 0; j < 3; j++) {
          const lx = x + (r() - 0.5) * 0.6, ly = h * (0.55 + j * 0.17), lz = z + (r() - 0.5) * 0.6, ry = r() * Math.PI, ls = 1.6 + r() * 0.6;
          leafM.push(M(lx, ly, lz, ry, ls), M(lx, ly, lz, ry + Math.PI / 2, ls));
        }
      }
    // tree line ring: dark canopies at 40–90 m (depth layer, also behind the house)
    const canopyM: THREE.Matrix4[] = [];
    for (let i = 0; i < 170; i++) {
      const a = r() * Math.PI * 2;
      const d = 82 + r() * 55;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (z > 20 && Math.abs(x) < 70) continue; // keep the street side open
      const s = 3.5 + r() * 4;
      canopyM.push(M(x, s * 0.9, z, r() * 6, s, s * (0.75 + r() * 0.3)));
    }
    // a few garden canopy trees close to the house (frangipani-like)
    // collision volumes for the camera (spheres: x, y, z, r)
    colliders.spheres = [
      ...PALMS.map(([x, z, s]) => [x + 0.9 * s, 9 * s, z, 4.3 * s] as [number, number, number, number]),
      ...PALMS.flatMap(([x, z, s]) => [0.25, 0.5, 0.75].map((f) => [x + f * f * 0.9 * s, 9 * s * f, z, 0.9] as [number, number, number, number])),
      ...canopyM.map((m) => {
        const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
        m.decompose(p, q, sc);
        return [p.x, p.y, p.z, Math.max(sc.x, sc.y) * 1.05] as [number, number, number, number];
      }),
      ...clusters.map(([x, z]) => [x, 3, z, 2.2] as [number, number, number, number]),
    ];
    // city: towers at 140–230 m, mostly behind (−z) and to the sides
    const cityM: THREE.Matrix4[] = [];
    for (let i = 0; i < 240; i++) {
      const a = -Math.PI * 0.08 - r() * Math.PI * 1.05; // behind arc: a low valley town between tree line and hills
      const d = 120 + r() * 60;
      const w = 4 + r() * 7;
      const h = 4 + Math.pow(r(), 3) * 24;
      cityM.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * d, h / 2 - 1, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * Math.PI, 0)), new THREE.Vector3(w, h, w * (0.6 + r() * 0.6))));
    }
    // street lamps along the far kerb + bollards along the drive
    const lampPos: [number, number, number][] = [];
    // the hero camera stands at x≈25 just behind this kerb — keep a 16 m gap in the lamp row there
    for (let x = -52.5; x <= 52.5; x += 15) if (Math.abs(x - 25) > 8) lampPos.push([x, 6.2, 34.4]);
    const bollards: [number, number, number][] = [];
    for (const x of [-12.5, -6, 0.5, 13.5]) bollards.push([x, 0.7, 21.3]);
    for (const z of [12.5, 16, 19.5]) { bollards.push([6.5, 0.7, z]); bollards.push([12.8, 0.7, z]); }

    // ── geometry ──
    const cane = new THREE.CylinderGeometry(0.045, 0.06, 1, 6, 1);
    const leafCardSrc = new THREE.PlaneGeometry(1, 1.2);
    const leafCard = foliage(leafCardSrc, 0, 0, 0.8);
    leafCardSrc.dispose();
    // per-instance fade for bamboo (one value per cluster, expanded to every cane / leaf card)
    const caneFade = new THREE.InstancedBufferAttribute(new Float32Array(caneM.length).fill(1), 1);
    const leafFade = new THREE.InstancedBufferAttribute(new Float32Array(leafM.length).fill(1), 1);
    caneFade.setUsage(THREE.DynamicDrawUsage);
    leafFade.setUsage(THREE.DynamicDrawUsage);
    cane.setAttribute('aFade', caneFade);
    leafCard.setAttribute('aFade', leafFade);
    const leafC = leafM.map((_, i) => new THREE.Color().setHSL(0.24 + ((i * 0.618) % 1) * 0.05 - 0.025, 0.26 + ((i * 0.37) % 1) * 0.1, 0.5 + ((i * 0.71) % 1) * 0.12));
    const canopy = mergeVertices(new THREE.IcosahedronGeometry(1, 1).deleteAttribute('normal').deleteAttribute('uv'));
    {
      const p = canopy.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const k = 0.86 + 0.1 * Math.sin(v.x * 4.1 + v.y * 2.3) * Math.cos(v.z * 3.7 - v.y * 1.9) + 0.06 * Math.sin(v.x * 9 + v.z * 7);
        v.multiplyScalar(k);
        if (v.y < -0.3) v.y = -0.3 + (v.y + 0.3) * 0.4; // flatter underside
        p.setXYZ(i, v.x, v.y, v.z);
      }
      canopy.computeVertexNormals();
    }
    const cityBox = new THREE.BoxGeometry(1, 1, 1);

    // hills: two silhouette rings
    const hill = (radius: number, base: number, amp: number, seed: number) => {
      const N = 480;
      const rr = rng(seed);
      const ph = [rr() * 6, rr() * 6, rr() * 6, rr() * 6, rr() * 6];
      const pos: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const ridge = 1 - Math.abs(Math.sin(a * 5 + ph[3]));
        const h = base + amp * (0.35 + 0.25 * Math.sin(a * 3 + ph[0]) + 0.12 * Math.sin(a * 9 + ph[1]) + 0.05 * Math.sin(a * 23 + ph[2]) + 0.025 * Math.sin(a * 61 + ph[4]) + 0.3 * ridge * ridge);
        pos.push(Math.cos(a) * radius, -2, Math.sin(a) * radius, Math.cos(a) * radius, h, Math.sin(a) * radius);
        if (i < N) {
          const k = i * 2;
          idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      return g;
    };
    const hillNear = hill(185, 6, 26, 5);
    const hillFar = hill(260, 18, 48, 9);

    // AO decal: house footprint, plinth, walls, every tree
    const aoSize = 110;
    const ao = groundAO(
      aoSize,
      [[-12.5, -8.6, 13.6, 9.5, 1.1], [-1, -8.2, 2.6, -5.5, 0.8], [-30, 22.6, 6, 23.4, 0.7], [12, 22.6, 30, 23.4, 0.7]],
      [...PALMS.map(([x, z, s]) => [x + 0.6, z, 1.8 * s, 0.55] as [number, number, number, number]), ...clusters.map(([x, z]) => [x, z, 2.2, 0.6] as [number, number, number, number])],
    );
    mats.ao.alphaMap = ao;
    mats.ao.opacity = 0.75;

    const canopyC = canopyM.map(() => new THREE.Color().setHSL(0.22 + r() * 0.08, 0.32 + r() * 0.15, 0.12 + r() * 0.08));
    return { fade, caneFade, leafFade, leafC, clusters, canopyC, mats, depthFrond, depthLeaf, pav, palms, palmM, cane, caneM, leafCard, leafM, canopy, canopyM, cityBox, cityM, hillNear, hillFar, lampPos, bollards, aoSize };
  }, []);

  useEffect(
    () => () => {
      Object.values(res.mats).forEach((m) => {
        const mm = m as THREE.MeshStandardMaterial;
        mm.map?.dispose();
        mm.emissiveMap?.dispose();
        mm.alphaMap?.dispose();
        mm.dispose();
      });
      res.pav.map.dispose(); // GPU copy only — the canvas stays cached and re-uploads on remount
      res.pav.rough.dispose();
      [res.palms.trunk, res.palms.crown, res.cane, res.leafCard, res.canopy, res.cityBox, res.hillNear, res.hillFar].forEach((g) => g.dispose());
    },
    [res],
  );

  // site walls (stone → follows the façade variant) + kerbs, as merged geometry
  const site = useMemo(() => {
    const walls: THREE.BufferGeometry[] = [];
    const add = (arr: THREE.BufferGeometry[], x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
      const g = boxUV(x1 - x0, y1 - y0, z1 - z0);
      g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      arr.push(g);
    };
    add(walls, -30, 0, 22.6, 6, 0.6, 23.2);
    add(walls, 12.8, 0, 22.6, 30, 0.6, 23.2);
    add(walls, -30, 0, -20, -29.4, 1.1, 22.6);
    add(walls, 29.4, 0, -20, 30, 1.1, 22.6);
    add(walls, 5.6, 0, 22.4, 6.4, 1.2, 23.4); // gate piers
    add(walls, 12.4, 0, 22.4, 13.2, 1.2, 23.4);
    const kerbs: THREE.BufferGeometry[] = [];
    add(kerbs, -200, 0, 25.6, 200, 0.14, 26.0);
    add(kerbs, -200, 0, 33.0, 200, 0.14, 33.4);
    add(kerbs, 6.5, 0.006, 20.9, 12.7, 0.012, 26.3); // drive apron
    add(kerbs, -200, 0.01, 33.5, 200, 0.016, 38.5); // far pavement
    const hedges: THREE.BufferGeometry[] = [];
    add(hedges, -29.3, 0, 21.4, 5.4, 1.0, 22.5);
    add(hedges, 13.3, 0, 21.4, 29.3, 1.0, 22.5);
    add(hedges, -29.2, 0, -19.5, -27.8, 2.2, 21.2);
    add(hedges, 27.8, 0, -19.5, 29.2, 2.2, 21.2);
    add(hedges, -29.2, 0, -21, 29.2, 2.6, -19.5);
    const w = mergeGeometries(walls)!;
    const k = mergeGeometries(kerbs)!;
    const h = mergeGeometries(hedges)!;
    [...walls, ...kerbs, ...hedges].forEach((g) => g.dispose());
    return { walls: w, kerbs: k, hedges: h };
  }, []);
  useEffect(() => () => { site.walls.dispose(); site.kerbs.dispose(); site.hedges.dispose(); }, [site]);

  // road dashes
  const dashes = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let x = -200; x <= 200; x += 6) out.push(M(x, 0.035, 29.5));
    return out;
  }, []);
  const dashGeo = useMemo(() => new THREE.BoxGeometry(2.6, 0.01, 0.16), []);
  const poleGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.1, 6.2, 8), []);
  const headGeo = useMemo(() => new THREE.BoxGeometry(0.9, 0.12, 0.3), []);
  const bollardGeo = useMemo(() => new THREE.CylinderGeometry(0.09, 0.09, 0.7, 10), []);
  const bollardCapGeo = useMemo(() => new THREE.CylinderGeometry(0.095, 0.095, 0.06, 10), []);
  const furniture = useMemo(() => {
    const at = (g: THREE.BufferGeometry, x: number, y: number, z: number) => g.clone().translate(x, y, z);
    const dark = [
      ...res.lampPos.map(([x, , z]) => at(poleGeo, x, 3.1, z)),
      ...res.bollards.map(([x, , z]) => at(bollardGeo, x, 0.35, z)),
    ];
    const lit = [
      ...res.lampPos.map(([x, y, z]) => at(headGeo, x, y, z - 0.35)),
      ...res.bollards.map(([x, , z]) => at(bollardCapGeo, x, 0.62, z)),
    ];
    const out = { dark: mergeGeometries(dark)!, lit: mergeGeometries(lit)! };
    [...dark, ...lit].forEach((g) => g.dispose());
    return out;
  }, [res, poleGeo, bollardGeo, headGeo, bollardCapGeo]);
  useEffect(() => () => { furniture.dark.dispose(); furniture.lit.dispose(); }, [furniture]);
  useEffect(() => () => { [dashGeo, poleGeo, headGeo, bollardGeo, bollardCapGeo].forEach((g) => g.dispose()); }, [dashGeo, poleGeo, headGeo, bollardGeo, bollardCapGeo]);

  const glowGeo = useMemo(() => {
    const mk = (pts: [number, number, number][]) => new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
    return {
      lamps: mk(res.lampPos.map(([x, y, z]) => [x, y - 0.1, z - 0.35] as [number, number, number])),
      bollards: mk(res.bollards.map(([x, , z]) => [x, 0.62, z] as [number, number, number])),
    };
  }, [res]);
  const glowMat = useMemo(() => {
    const mk = (size: number) => new THREE.PointsMaterial({ map: res.mats.glow.map, color: '#ffcf8f', size, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 });
    return { lamps: mk(3.2), bollards: mk(1.1) };
  }, [res]);
  useEffect(() => () => { glowGeo.lamps.dispose(); glowGeo.bollards.dispose(); glowMat.lamps.dispose(); glowMat.bollards.dispose(); }, [glowGeo, glowMat]);
  const far = useRef<THREE.Group>(null);
  useEffect(() => {
    far.current?.traverse((o) => o.layers.set(1));
  }, []);
  const fadeNow = useMemo(() => new Float32Array(PALMS.length).fill(1), []);
  const clusterFade = useMemo(() => new Float32Array(res.clusters.length).fill(1), [res]);
  useFrame(({ camera }, delta) => {
    // occluder fade: project the villa footprint, test every palm trunk against it
    let x0 = 1, x1 = -1;
    let villaDist = 0;
    for (const c of VILLA_CORNERS) {
      _v.copy(c).project(camera);
      x0 = Math.min(x0, _v.x);
      x1 = Math.max(x1, _v.x);
    }
    villaDist = camera.position.distanceTo(_v.set(0.5, 6, 0.5));
    const k = 1 - Math.exp(-6 * Math.min(delta, 0.05));
    let dirty = false;
    PALMS.forEach(([x, z, s], i) => {
      let want = 1;
      const near = Math.hypot(camera.position.x - x, camera.position.z - z);
      if (near < 7) want = 0;
      else if (near < villaDist - 9) {
        for (const f of [0.35, 0.7]) {
          _v.set(x + f * f * 0.9 * s, 9 * s * f, z).project(camera);
          if (_v.z < 1 && _v.x > x0 + 0.04 && _v.x < x1 - 0.04 && Math.abs(_v.y) < 1) want = 0;
        }
      }
      const cur = fadeNow[i];
      const nxt = Math.abs(want - cur) < 0.01 ? want : cur + (want - cur) * k;
      if (nxt !== cur) {
        fadeNow[i] = nxt;
        res.fade.setX(i, nxt);
        dirty = true;
      }
    });
    if (dirty) res.fade.needsUpdate = true;
    // bamboo clusters between the lens and the villa fade out the same way (side/back orbits)
    let bDirty = false;
    res.clusters.forEach(([x, z], ci) => {
      let want = 1;
      const near = Math.hypot(camera.position.x - x, camera.position.z - z);
      if (near < 6) want = 0;
      else if (near < villaDist - 3) {
        for (const y of [2.5, 5]) {
          _v.set(x, y, z).project(camera);
          if (_v.z < 1 && _v.x > x0 - 0.06 && _v.x < x1 + 0.06 && Math.abs(_v.y) < 1) want = 0; // incl. the low wings at the footprint edges
        }
      }
      const cur = clusterFade[ci];
      const nxt = Math.abs(want - cur) < 0.01 ? want : cur + (want - cur) * k;
      if (nxt !== cur) {
        clusterFade[ci] = nxt;
        for (let i = 0; i < 9; i++) res.caneFade.setX(ci * 9 + i, nxt);
        for (let i = 0; i < 54; i++) res.leafFade.setX(ci * 54 + i, nxt);
        bDirty = true;
      }
    });
    if (bDirty) {
      res.caneFade.needsUpdate = true;
      res.leafFade.needsUpdate = true;
    }
    const n = nightOf(scrollState.smooth);
    const m = res.mats;
    m.lamp.emissiveIntensity = 1.2 + 3.5 * n;
    m.city.emissiveIntensity = 0.14 + 0.55 * n;
    glowMat.lamps.opacity = glowMat.bollards.opacity = 0.25 + 0.6 * n;
    m.hillNear.color.setRGB(0.1 - 0.07 * n, 0.135 - 0.09 * n, 0.2 - 0.12 * n);
    m.hillFar.color.setRGB(0.17 - 0.11 * n, 0.21 - 0.13 * n, 0.31 - 0.17 * n);
    m.line.emissiveIntensity = 0.05 + 0.25 * n;
  });

  const stoneSite = lib.get('none', 'stone');
  return (
    <group>
      {/* wet forecourt + drive (reflector) */}
      <mesh rotation-x={-Math.PI / 2} position={[1, 0.012, 15.6]} receiveShadow>
        <planeGeometry args={[30, 13]} />
        <meshStandardMaterial map={res.pav.map} roughnessMap={res.pav.rough} color="#a9a7a2" roughness={1} metalness={0.05} envMapIntensity={0.8} />
      </mesh>
      <WetCourt mask={res.pav.rough} repeat={res.pav.map.repeat} position={COURT_POS} size={COURT_SIZE} />
      <mesh geometry={site.kerbs} material={res.mats.curb} receiveShadow />
      <Instanced geometry={dashGeo} material={res.mats.line} mats={dashes} castShadow={false} />
      {/* site walls, hedges */}
      <mesh geometry={site.walls} material={stoneSite} castShadow receiveShadow />
      <mesh geometry={site.hedges} material={res.mats.hedge} castShadow receiveShadow />
      {/* vegetation */}
      <Instanced geometry={res.palms.trunk} material={res.mats.trunk} mats={res.palmM} />
      <PalmCrowns res={res} />
      {/* layer 1 = rendered by the main camera only, skipped by the wet-floor reflection camera (cheap mirror) */}
      <group ref={far}>
        <Instanced geometry={res.cane} material={res.mats.cane} mats={res.caneM} />
        <LeafCards res={res} />
        <Instanced geometry={res.canopy} material={res.mats.canopy} mats={res.canopyM} colors={res.canopyC} />
        <Instanced geometry={res.cityBox} material={res.mats.city} mats={res.cityM} castShadow={false} />
        <mesh geometry={res.hillNear} material={res.mats.hillNear} />
        <mesh geometry={res.hillFar} material={res.mats.hillFar} />
        <mesh rotation-x={-Math.PI / 2} receiveShadow material={res.mats.lawn}>
          <circleGeometry args={[340, 64]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 29.5]} receiveShadow material={res.mats.asphalt}>
          <planeGeometry args={[400, 7]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} material={res.mats.ao} renderOrder={1}>
          <planeGeometry args={[res.aoSize, res.aoSize]} />
        </mesh>
      </group>
      {/* lamps */}
      <mesh geometry={furniture.dark} material={res.mats.pole} castShadow />
      <mesh geometry={furniture.lit} material={res.mats.lamp} />
      {/* lamp glows: two Points draws instead of ~20 sprite draw calls */}
      <points geometry={glowGeo.lamps} material={glowMat.lamps} renderOrder={2} />
      <points geometry={glowGeo.bollards} material={glowMat.bollards} renderOrder={2} />
    </group>
  );
}

type Res = { mats: { frond: THREE.Material; leaf: THREE.Material }; depthFrond: THREE.Material; depthLeaf: THREE.Material; palms: { crown: THREE.BufferGeometry }; palmM: THREE.Matrix4[]; leafCard: THREE.BufferGeometry; leafM: THREE.Matrix4[]; leafC: THREE.Color[] };

function PalmCrowns({ res }: { res: Res }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current!;
    res.palmM.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    m.customDepthMaterial = res.depthFrond;
  }, [res]);
  return <instancedMesh ref={ref} args={[res.palms.crown, res.mats.frond, res.palmM.length]} castShadow />;
}

function LeafCards({ res }: { res: Res }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current!;
    res.leafM.forEach((x, i) => m.setMatrixAt(i, x));
    res.leafC.forEach((c, i) => m.setColorAt(i, c));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    m.customDepthMaterial = res.depthLeaf;
  }, [res]);
  return <instancedMesh ref={ref} args={[res.leafCard, res.mats.leaf, res.leafM.length]} castShadow />;
}
