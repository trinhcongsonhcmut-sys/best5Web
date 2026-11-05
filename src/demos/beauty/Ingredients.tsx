/**
 * Five actives orbiting the bottle (orange wheel, vitamin-C softgel, hyaluronic water drop, vitamin-E oil drop,
 * peel twist with real rind thickness) + a ring of water beads. Each active is hoverable (rim + spring scale + its callout brightens).
 * World positions are projected every frame to drive DOM callouts that are pushed OUTWARD from the bottle
 * (never on top of the mesh) and clamped inside the viewport; the three "craft" labels at 75 % use the same writer.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scroll';
import { addRim, useHoverRim, type RimUniforms } from '../../lib/rim';
import { pose } from './anim';
import { look } from './palette';
import { calloutEls, rig, warm, steadyHover } from './rig';
import { BOT, dropGeometry, peelGeometries, sliceGeometries } from './geometry';
import { fleshMaterial, rindMaterial, skipTransmissionPass, waterMaterial } from './materials';

const RING_R = 1.12;
const TILT = 0.32;
const DEW = 18;
const ING_SCALE = 1.9;
/** orbit slots (rad) at the 50 % mark: front-right, right, back-left, left, front-left (0 = toward camera) — two actives right, three left, none in front of the label */
const SLOTS = [40, 112, 205, 262, 322].map((d) => (d * Math.PI) / 180);

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
    const wheel = sliceGeometries(0.15, 0.034);
    const peel = peelGeometries();
    const geos = {
      face: wheel.face,
      band: wheel.rind,
      capsule: new THREE.CapsuleGeometry(0.045, 0.12, 10, 24),
      drop: dropGeometry(0.07),
      oil: dropGeometry(0.06),
      peelRind: peel.rind,
      peelPith: peel.pith,
      dew: new THREE.SphereGeometry(1, 18, 12),
    };
    const flesh = fleshMaterial(true);
    const rind = rindMaterial([4, 0.3], true);
    const peelRind = rindMaterial([6, 1], true);
    peelRind.material.side = THREE.FrontSide;
    const m = {
      capsule: rim(new THREE.MeshPhysicalMaterial({ color: '#ff9a1a', roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.03, emissive: new THREE.Color('#c85400'), emissiveIntensity: 0.32 })),
      oil: rim(new THREE.MeshPhysicalMaterial({ color: '#f2d27a', roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.92, emissive: new THREE.Color('#b8902e'), emissiveIntensity: 0.2, envMapIntensity: 1.7 })),
      pith: rim(new THREE.MeshPhysicalMaterial({ color: '#fbf0d8', roughness: 0.7, side: THREE.DoubleSide })),
    };
    m.pith.material.color = look.pith;
    // same (transparent-flagged) programs as the hero citrus / oil drop → fewer cold shader compiles, and none of
    // these is ever needed inside the glass's transmission pre-pass
    [flesh, rind, peelRind, m.capsule, m.oil, m.pith].forEach((x) => skipTransmissionPass(x.material));
    const hyal = waterMaterial();
    const dewMat = waterMaterial();
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const seeds = Array.from({ length: DEW }, () => ({ a: rnd() * Math.PI * 2, r: 1.25 + rnd() * 0.45, y: (rnd() - 0.5) * 1.1, s: 0.012 + rnd() * 0.016, sp: 0.4 + rnd() * 0.8 }));
    return { geos, flesh, rind, peelRind, m, hyal, dewMat, seeds };
  }, []);

  useEffect(
    () => () => {
      Object.values(res.geos).forEach((g) => g.dispose());
      Object.values(res.m).forEach((x) => x.material.dispose());
      [res.flesh.material, res.rind.material, res.peelRind.material, res.hyal.material, res.dewMat.material].forEach((x) => x.dispose());
      res.rind.material.normalMap?.dispose();
      res.peelRind.material.normalMap?.dispose();
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
    res.hyal.fade.value = 1;
    res.dewMat.fade.value = Math.min(1, k * 1.5);
    const portrait = size.width / size.height < 0.8;
    items.current.forEach((it, i) => {
      if (!it) return;
      // uneven spacing keeps the front sector (the label) and the dead-back sector clear at the 50 % mark
      const ang = SLOTS[i] + a.orbitAngle;
      // never closer than the bottle radius + 0.45 (nothing pokes through the glass)
      const rr = Math.max(RING_R * (0.55 + 0.45 * k) * (portrait ? 0.82 : 1), (portrait ? 0.68 : 0.75) * (0.6 + 0.4 * k));
      const x = Math.sin(ang) * rr;
      const z = Math.cos(ang) * rr;
      it.position.set(x, -z * 0.2 + Math.sin(t * 0.8 + i) * 0.03 + (i % 2 ? 0.12 : -0.12), z * Math.cos(TILT));
      it.scale.setScalar(Math.max(0.0001, k) * ING_SCALE);
      // gentle rock — faces (wheel cross-section, peel) stay mostly toward the viewer
      it.rotation.set(0.25 * Math.sin(t * 0.45 + i), Math.sin(t * 0.3 + i * 1.7) * 0.7, 0.3 * Math.sin(t * 0.5 + i));
      it.getWorldPosition(rig.ingredients[i]);
    });
    const d = dew.current;
    if (d) {
      res.seeds.forEach((sd, i) => {
        const ang = sd.a + a.orbitAngle * 0.6 + t * 0.05 * sd.sp;
        const rr = sd.r * (0.6 + 0.4 * k);
        tmp.p.set(Math.sin(ang) * rr, sd.y + Math.sin(t * sd.sp + i) * 0.04, Math.cos(ang) * rr * 0.9);
        tmp.sc.setScalar(sd.s * Math.max(0.0001, k) * 1.4);
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
    const jr = sr(rig.jarCenter, 0.4, jx);
    // bottle silhouette as a box: glass + raised dropper (follows lift / tilt loosely)
    tmp.c.copy(rig.jarCenter).addScaledVector(tmp.p, 1.35);
    const jTop = proj(tmp.c)[1];
    tmp.c.copy(rig.jarCenter).addScaledVector(tmp.p, -0.95);
    const jBot = proj(tmp.c)[1];
    const jarBox = { x0: jx - jr, x1: jx + jr, y0: Math.min(jTop, jBot), y1: Math.max(jTop, jBot) };
    const jarDist = camera.position.distanceTo(rig.jarCenter);

    // every active's projected silhouette (circle) = obstacle for ALL labels
    const circles = rig.ingredients.map((w, i) => {
      const it = items.current[i];
      const s = it ? it.scale.x * (1 + 0.16 * rig.ingHover[i]) : 0;
      const [x, y] = proj(w);
      return { x, y, r: sr(w, 0.17 * s, x) + 6, d: camera.position.distanceTo(w) };
    });
    type Box = { x0: number; x1: number; y0: number; y1: number };
    const hitBox = (b: Box, o: Box) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0;
    /** distance from point (px,py) to segment a→b */
    const segDist = (ax: number, ay: number, bx: number, by: number, px: number, py: number) => {
      const vx = bx - ax;
      const vy = by - ay;
      const t = THREE.MathUtils.clamp(((px - ax) * vx + (py - ay) * vy) / Math.max(1e-6, vx * vx + vy * vy), 0, 1);
      return Math.hypot(ax + vx * t - px, ay + vy * t - py);
    };
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
     * Pushes the label outward from the bottle centre along its ray until its box clears the bottle, every active's
     * silhouette and every label already placed (nearest actives are placed first). Returns false if no free spot
     * was found within the viewport.
     */
    const solve = (i: number, x: number, y: number, el: HTMLElement, strict = true) => {
      let dx = x - jx;
      let dy = (y - jy) * 0.5;
      const n = Math.hypot(dx, dy) || 1;
      dx /= n;
      dy /= n;
      if (Math.abs(dx) < 0.4) dx = Math.sign(dx || 1) * 0.4;
      const side: 'l' | 'r' = dx < 0 ? 'l' : 'r';
      const tries: [number, number][] = [];
      for (let L = 70; L <= 330; L += 26) for (const off of [0, -34, 34, -68, 68, -110, 110, -150, 150]) tries.push([L, off]);
      for (const [L, off] of tries) {
        let ex = x + dx * L;
        ex = side === 'r' ? Math.min(ex, W - 16 - LW) : Math.max(ex, 16 + LW);
        const ey = THREE.MathUtils.clamp(y + dy * L + off, 74, H - 140);
        const b = labelBox(ex, ey, side);
        if (hitBox(b, jarBox)) continue;
        if (circles.some((c, j) => (j === i || c.r > 7) && rig.ingredients[j] && hitCircle(b, c))) continue;
        // the leader may not cut across another active
        if (strict && circles.some((c, j) => j !== i && c.r > 7 && segDist(x, y, ex, ey, c.x, c.y) < c.r * 0.95)) continue;
        const gy = strict ? 16 : 8;
        if (placed.some((p) => hitBox(b, { x0: p.x0 - 10, x1: p.x1 + 10, y0: p.y0 - gy, y1: p.y1 + gy }))) continue;
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
      // hidden when the active is behind the bottle silhouette, or largely covered by a nearer active
      const depth = c.d - jarDist;
      const inside = x > jarBox.x0 - 4 && x < jarBox.x1 + 4 && y > jarBox.y0 && y < jarBox.y1 ? 1 : 0;
      const overJar = inside * (1 - THREE.MathUtils.smoothstep(Math.abs(x - jx) / Math.max(1, jr), 0.7, 1.1));
      const coveredBy = circles.some((o, j) => j !== i && o.d < c.d - 0.05 && Math.hypot(o.x - x, o.y - y) < o.r * 0.8);
      let op = a.callouts * (1 - THREE.MathUtils.smoothstep(depth, 0.0, 0.3) * overJar) * (coveredBy ? 0 : 1);
      if (mobile) {
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      } else if (op > 0.01 && !solve(i, x, y, el) && !solve(i, x, y, el, false)) op = 0;
      el.style.opacity = op.toFixed(3);
      el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
      const hot = rig.ingHover[i] > 0.3;
      if (el.classList.contains('hot') !== hot) el.classList.toggle('hot', hot);
    }

    // craft labels (75 %): bulb + pipette on the right of the raised dropper, glass body on the left of the bottle
    const layers: [THREE.Vector3, number, 'l' | 'r'][] = [
      [rig.bulbAnchor, BOT.bulbR + 0.01, 'r'],
      [rig.pipetteAnchor, 0.035, 'r'],
      [rig.bodyAnchor, BOT.r + 0.012, 'l'],
    ];
    const dW = mobile ? 104 : 170;
    let lastY = -1e9;
    calloutEls.detail.forEach((el, i) => {
      if (!el) return;
      const [cc, r, sd] = layers[i];
      // phones: every craft label sits on the right of the stack (the left edge is too narrow)
      const side = mobile ? 'r' : sd;
      tmp.c.copy(cc).addScaledVector(tmp.r, side === 'r' ? r : -r);
      const [x, y] = proj(tmp.c);
      if (side === 'r') {
        const ex = Math.min(x + (mobile ? 34 : 70), W - 16 - dW);
        const ey = Math.max(THREE.MathUtils.clamp(y, 74, H - 140), lastY + 48);
        lastY = ey;
        write(el, x, y, Math.max(ex, x + 20), ey, 'r');
      } else {
        const ex = Math.max(x - (mobile ? 30 : 70), 16 + (mobile ? 96 : dW));
        const ey = THREE.MathUtils.clamp(y, 74, H - 140);
        write(el, x, y, Math.min(ex, x - 20), ey, 'l');
      }
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
        <Hot i={0} uniforms={[res.flesh.uniforms!, res.rind.uniforms!]}>
          <group rotation-x={Math.PI / 2 - 0.25}>
            <mesh geometry={geos.face} material={res.flesh.material} />
            <mesh geometry={geos.band} material={res.rind.material} />
          </group>
        </Hot>
      </group>
      <group ref={set(1)}>
        <Hot i={1} uniforms={[m.capsule.uniforms]}>
          <mesh geometry={geos.capsule} material={m.capsule.material} rotation-z={0.6} />
        </Hot>
      </group>
      <group ref={set(2)}>
        <Hot i={2} uniforms={[]}>
          <mesh geometry={geos.drop} material={res.hyal.material} renderOrder={6} />
        </Hot>
      </group>
      <group ref={set(3)}>
        <Hot i={3} uniforms={[m.oil.uniforms]}>
          <mesh geometry={geos.oil} material={m.oil.material} />
        </Hot>
      </group>
      <group ref={set(4)}>
        <Hot i={4} uniforms={[res.peelRind.uniforms!, m.pith.uniforms]}>
          <group rotation={[0.35, 0, 0.5]} scale={1.15}>
            <mesh geometry={geos.peelRind} material={res.peelRind.material} />
            <mesh geometry={geos.peelPith} material={m.pith.material} />
          </group>
        </Hot>
      </group>
      <instancedMesh ref={dew} args={[geos.dew, res.dewMat.material, DEW]} renderOrder={7} raycast={() => null} frustumCulled={false} />
    </group>
  );
}
