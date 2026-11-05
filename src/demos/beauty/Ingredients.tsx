/**
 * Five botanicals orbiting the jar (aloe slice, vitamin-E capsule, squalane drop, shea nut, green-tea leaf)
 * + a ring of dew droplets. Each ingredient is hoverable (rim + spring scale + its callout brightens).
 * World positions are projected every frame to drive DOM callouts that are pushed OUTWARD from the jar
 * (never on top of the mesh) and clamped inside the viewport; the three "craft" labels at 75 % use the same layout.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { addRim, useHoverRim, type RimUniforms } from '../../lib/rim';
import { pose } from './anim';
import { calloutEls, JS, rig, warm, steadyHover } from './rig';
import { aloeSliceGeometries, dropGeometry, nutGeometry, teaLeafGeometry } from './geometry';

const RING_R = 1.12 * JS;
const TILT = 0.32;
const DEW = 18;

/** Hover wrapper: rim on the item's materials + spring scale; mirrors the amount to rig.ingHover[i]. */
function Hot({ i, uniforms, children }: { i: number; uniforms: RimUniforms[]; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const { bind, value } = useHoverRim(() => uniforms, `ingredient-${i}`, 1.8);
  useFrame(() => {
    rig.ingHover[i] = value.current;
    if (g.current) g.current.scale.setScalar(1 + 0.16 * value.current);
  });
  return (
    <group ref={g} {...steadyHover(bind)}>
      {children}
    </group>
  );
}

const rim = <T extends THREE.MeshStandardMaterial>(m: T) => addRim(m, { color: '#ffffff', power: 2 });

export function Ingredients() {
  const group = useRef<THREE.Group>(null);
  const items = useRef<(THREE.Group | null)[]>([]);
  const dew = useRef<THREE.InstancedMesh>(null);
  const { camera, size } = useThree();

  const res = useMemo(() => {
    const slice = aloeSliceGeometries();
    const tea = teaLeafGeometry();
    const geos = {
      skin: slice.skin,
      gel: slice.gel,
      capsule: new THREE.CapsuleGeometry(0.045, 0.12, 8, 20),
      drop: dropGeometry(0.068),
      nut: nutGeometry(),
      tea: tea.leaf,
      stem: tea.stem,
      dew: new THREE.SphereGeometry(1, 20, 14),
    };
    const m = {
      skin: rim(new THREE.MeshPhysicalMaterial({ color: '#1a6b34', roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.2 })),
      gel: rim(new THREE.MeshPhysicalMaterial({ color: '#dff5d8', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, emissive: new THREE.Color('#bfe3a8'), emissiveIntensity: 0.35, transparent: true, opacity: 0.9 })),
      capsule: rim(new THREE.MeshPhysicalMaterial({ color: '#f0a92a', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, emissive: new THREE.Color('#a85a00'), emissiveIntensity: 0.35 })),
      oil: rim(new THREE.MeshPhysicalMaterial({ color: '#f2d27a', roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.92, emissive: new THREE.Color('#b8902e'), emissiveIntensity: 0.2, iridescence: 0.75, iridescenceIOR: 1.47, envMapIntensity: 1.7 })),
      nut: rim(new THREE.MeshStandardMaterial({ color: '#8b5a37', roughness: 0.72 })),
      tea: rim(new THREE.MeshPhysicalMaterial({ color: '#4f8a3a', roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3, side: THREE.DoubleSide })),
    };
    // dew droplets: clear centre, bright Fresnel rim + one specular glint → read as water, never as a grey disc
    const dewMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec3 vN; varying vec3 vV;
        void main(){
          vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `varying vec3 vN; varying vec3 vV;
        void main(){
          float f = pow(1.0 - abs(dot(vN, vV)), 2.2);
          float g = smoothstep(0.9, 0.985, dot(vN, normalize(vec3(-0.45, 0.6, 0.66))));
          float a = clamp(f * 0.75 + g, 0.0, 1.0);
          gl_FragColor = vec4(vec3(1.0), a);
        }`,
    });
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const seeds = Array.from({ length: DEW }, () => ({ a: rnd() * Math.PI * 2, r: (1.35 + rnd() * 0.5) * JS, y: (rnd() - 0.5) * 0.9, s: 0.012 + rnd() * 0.016, sp: 0.4 + rnd() * 0.8 }));
    return { geos, m, dewMat, seeds };
  }, []);

  useEffect(
    () => () => {
      Object.values(res.geos).forEach((g) => g.dispose());
      Object.values(res.m).forEach((x) => x.material.dispose());
      res.dewMat.dispose();
    },
    [res],
  );

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), p: new THREE.Vector3(), c: new THREE.Vector3(), r: new THREE.Vector3(), sc: new THREE.Vector3() }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = pose(scrollState.smooth);
    const k = a.ingredients;
    const g = group.current;
    if (!g) return;
    g.visible = k > 0.001 || warm.on;
    g.position.copy(rig.jarCenter);
    const portrait = size.width / size.height < 0.8;
    items.current.forEach((it, i) => {
      if (!it) return;
      const ang = (i / 5) * Math.PI * 2 + a.orbitAngle + 1.085;
      // never closer than jar radius + 0.3 (no ingredient poking through the jar mouth)
      const rr = Math.max(RING_R * (0.55 + 0.45 * k) * (portrait ? 0.8 : 1), (portrait ? 0.92 : 1.0) * JS * (0.6 + 0.4 * k));
      const x = Math.sin(ang) * rr;
      const z = Math.cos(ang) * rr;
      it.position.set(x, -z * 0.2 + Math.sin(t * 0.8 + i) * 0.03 + (i % 2 ? 0.08 : -0.08), z * Math.cos(TILT));
      it.scale.setScalar(Math.max(0.0001, k) * 1.75 * JS);
      // gentle rock — faces (slice cross-section, leaf blade) stay mostly toward the viewer
      it.rotation.set(0.25 * Math.sin(t * 0.45 + i), Math.sin(t * 0.3 + i * 1.7) * 0.7, 0.3 * Math.sin(t * 0.5 + i));
      it.getWorldPosition(rig.ingredients[i]);
    });
    const d = dew.current;
    if (d) {
      res.seeds.forEach((sd, i) => {
        const ang = sd.a + a.orbitAngle * 0.6 + t * 0.05 * sd.sp;
        const rr = sd.r * (0.6 + 0.4 * k);
        tmp.p.set(Math.sin(ang) * rr, sd.y + Math.sin(t * sd.sp + i) * 0.04, Math.cos(ang) * rr * 0.9);
        tmp.sc.setScalar(sd.s * Math.max(0.0001, k));
        tmp.q.identity();
        tmp.m.compose(tmp.p, tmp.q, tmp.sc);
        d.setMatrixAt(i, tmp.m);
      });
      d.instanceMatrix.needsUpdate = true;
    }

    // ── DOM callouts: obstacle-aware layout ──
    const W = size.width;
    const H = size.height;
    const mobile = W < 720;
    const proj = (v: THREE.Vector3) => {
      tmp.v.copy(v).project(camera);
      return [(tmp.v.x * 0.5 + 0.5) * W, (-tmp.v.y * 0.5 + 0.5) * H] as const;
    };
    tmp.r.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    tmp.p.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    /** screen radius of a world-space sphere (projected silhouette bound) */
    const sr = (c: THREE.Vector3, rad: number, cx: number) => {
      tmp.c.copy(c).addScaledVector(tmp.r, rad);
      return Math.abs(proj(tmp.c)[0] - cx);
    };
    const [jx, jy] = proj(rig.jarCenter);
    const jr = sr(rig.jarCenter, 0.62 * JS, jx);
    // jar silhouette as a box (body + cap, follows the lift / tilt loosely)
    tmp.c.copy(rig.jarCenter).addScaledVector(tmp.p, 0.62 * JS);
    const jTop = proj(tmp.c)[1];
    tmp.c.copy(rig.jarCenter).addScaledVector(tmp.p, -0.62 * JS);
    const jBot = proj(tmp.c)[1];
    const jarBox = { x0: jx - jr, x1: jx + jr, y0: Math.min(jTop, jBot), y1: Math.max(jTop, jBot) };
    const jarDist = camera.position.distanceTo(rig.jarCenter);

    // every ingredient's projected silhouette (circle) = obstacle for ALL labels
    const circles = rig.ingredients.map((w, i) => {
      const it = items.current[i];
      const s = it ? it.scale.x * (1 + 0.16 * rig.ingHover[i]) : 0;
      const [x, y] = proj(w);
      return { x, y, r: sr(w, 0.17 * s, x) + 6, d: camera.position.distanceTo(w) };
    });
    type Box = { x0: number; x1: number; y0: number; y1: number };
    const hitBox = (b: Box, o: Box) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0;
    const hitCircle = (b: Box, c: { x: number; y: number; r: number }) => {
      const dx = c.x - Math.max(b.x0, Math.min(c.x, b.x1));
      const dy = c.y - Math.max(b.y0, Math.min(c.y, b.y1));
      return dx * dx + dy * dy < c.r * c.r;
    };
    const placed: Box[] = [];
    const LW = 168;
    const LH = 40;
    const labelBox = (ex: number, ey: number, side: 'l' | 'r'): Box =>
      side === 'r' ? { x0: ex + 4, x1: ex + 10 + LW, y0: ey - 19, y1: ey + LH - 19 } : { x0: ex - 10 - LW, x1: ex - 4, y0: ey - 19, y1: ey + LH - 19 };

    /** writes dot/leader/label transforms for a label whose text box starts at (ex, ey) */
    const write = (el: HTMLElement, x: number, y: number, ex: number, ey: number, side: 'l' | 'r') => {
      const lx = ex - x;
      const ly = ey - y;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      const lead = el.children[1] as HTMLElement | undefined;
      const txt = el.children[2] as HTMLElement | undefined;
      if (lead) {
        lead.style.width = `${Math.hypot(lx, ly).toFixed(1)}px`;
        lead.style.transform = `rotate(${Math.atan2(ly, lx).toFixed(4)}rad)`;
      }
      if (txt) txt.style.transform = side === 'r' ? `translate(${(lx + 8).toFixed(1)}px, ${(ly - 15).toFixed(1)}px)` : `translate(calc(${(lx - 8).toFixed(1)}px - 100%), ${(ly - 15).toFixed(1)}px)`;
      if (el.dataset.side !== side) el.dataset.side = side;
    };

    /**
     * Pushes the label outward from the jar centre along its ray until its box clears the jar, every ingredient
     * silhouette and every label already placed (nearest ingredients are placed first). Returns false if no
     * free spot was found within the viewport.
     */
    const solve = (i: number, x: number, y: number, el: HTMLElement) => {
      let dx = x - jx;
      let dy = (y - jy) * 0.5;
      const n = Math.hypot(dx, dy) || 1;
      dx /= n;
      dy /= n;
      if (Math.abs(dx) < 0.4) dx = Math.sign(dx || 1) * 0.4;
      const side: 'l' | 'r' = dx < 0 ? 'l' : 'r';
      const tries: [number, number][] = [];
      for (let L = 70; L <= 330; L += 26) for (const off of [0, -34, 34, -68, 68]) tries.push([L, off]);
      for (const [L, off] of tries) {
        let ex = x + dx * L;
        ex = side === 'r' ? Math.min(ex, W - 16 - LW) : Math.max(ex, 16 + LW);
        const ey = THREE.MathUtils.clamp(y + dy * L + off, 74, H - 140);
        const b = labelBox(ex, ey, side);
        if (hitBox(b, jarBox)) continue;
        if (circles.some((c, j) => (j === i || c.r > 7) && rig.ingredients[j] && hitCircle(b, c))) continue;
        if (placed.some((p) => hitBox(b, { x0: p.x0 - 6, x1: p.x1 + 6, y0: p.y0 - 8, y1: p.y1 + 8 }))) continue;
        placed.push(b);
        write(el, x, y, ex, ey, side);
        return true;
      }
      return false;
    };

    const order = [0, 1, 2, 3, 4].sort((p, q) => circles[p].d - circles[q].d);
    for (const i of order) {
      const el = calloutEls.ing[i];
      if (!el) continue;
      const c = circles[i];
      const { x, y } = c;
      // hidden when the ingredient is behind the jar silhouette, or largely covered by a nearer ingredient
      const depth = c.d - jarDist;
      const overJar = 1 - THREE.MathUtils.smoothstep(Math.hypot(x - jx, (y - jy) * 0.8) / Math.max(1, jr), 0.55, 0.8);
      const coveredBy = circles.some((o, j) => j !== i && o.d < c.d - 0.05 && Math.hypot(o.x - x, o.y - y) < o.r * 0.8);
      let op = a.callouts * (1 - THREE.MathUtils.smoothstep(depth, 0.0, 0.3) * overJar) * (coveredBy ? 0 : 1);
      if (mobile) {
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      } else if (op > 0.01 && !solve(i, x, y, el)) op = 0;
      el.style.opacity = op.toFixed(3);
      el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
      const hot = rig.ingHover[i] > 0.3;
      if (el.classList.contains('hot') !== hot) el.classList.toggle('hot', hot);
    }

    // craft labels (75 %): leader from the right silhouette edge of each separated layer, stacked without overlap
    const layers: [THREE.Vector3, number][] = [
      [rig.capCenter, 0.6 * JS],
      [rig.creamCenter, 0.46 * JS],
      [rig.bodyCenter, 0.58 * JS],
    ];
    const dW = mobile ? 104 : 170;
    let lastY = -1e9;
    calloutEls.detail.forEach((el, i) => {
      if (!el) return;
      const [cc, r] = layers[i];
      tmp.c.copy(cc).addScaledVector(tmp.r, r);
      const [x, y] = proj(tmp.c);
      const ex = Math.min(x + (mobile ? 34 : 70), W - 16 - dW);
      const ey = Math.max(THREE.MathUtils.clamp(y, 74, H - 140), lastY + 48);
      lastY = ey;
      write(el, x, y, Math.max(ex, x + 20), ey, 'r');
      el.style.opacity = a.details.toFixed(3);
      el.style.visibility = a.details < 0.01 ? 'hidden' : 'visible';
    });
  });

  const set = (i: number) => (el: THREE.Group | null) => {
    items.current[i] = el;
  };
  const { m, geos } = res;
  return (
    <group ref={group}>
      <group ref={set(0)}>
        <Hot i={0} uniforms={[m.skin.uniforms, m.gel.uniforms]}>
          <mesh geometry={geos.skin} material={m.skin.material} />
          <mesh geometry={geos.gel} material={m.gel.material} renderOrder={1} />
        </Hot>
      </group>
      <group ref={set(1)}>
        <Hot i={1} uniforms={[m.capsule.uniforms]}>
          <mesh geometry={geos.capsule} material={m.capsule.material} rotation-z={0.6} />
        </Hot>
      </group>
      <group ref={set(2)}>
        <Hot i={2} uniforms={[m.oil.uniforms]}>
          <mesh geometry={geos.drop} material={m.oil.material} />
        </Hot>
      </group>
      <group ref={set(3)}>
        <Hot i={3} uniforms={[m.nut.uniforms]}>
          <mesh geometry={geos.nut} material={m.nut.material} />
        </Hot>
      </group>
      <group ref={set(4)}>
        <Hot i={4} uniforms={[m.tea.uniforms]}>
          <mesh geometry={geos.tea} material={m.tea.material} />
          <mesh geometry={geos.stem} material={m.tea.material} />
        </Hot>
      </group>
      <instancedMesh ref={dew} args={[geos.dew, res.dewMat, DEW]} raycast={() => null} />
    </group>
  );
}
