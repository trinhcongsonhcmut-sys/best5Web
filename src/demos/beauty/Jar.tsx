/**
 * Hero object: frosted thick-glass cream jar (the ONE transmission material in the scene), whipped cream core,
 * soft-touch ribbed cap with foil-printed top, neck thread, wrap label. Registered as bridge "primary".
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { addRim, useHoverRim } from '../../lib/rim';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import { pose } from './anim';
import { look, WORLDS } from './palette';
import { backLabelTexture, capFoilTexture, dotTexture, labelTexture, whenFonts } from './textures';
import { backLabelGeometry, capGeometry, creamBodyGeometry, creamTopGeometry, jarBodyGeometry, labelGeometry, threadGeometry, JAR } from './geometry';
import { JS, rig, steadyHover } from './rig';
import type { RimUniforms } from '../../lib/rim';

/**
 * Chains a one-shot "light sweep" band onto a rim material: a bright vertical streak that crosses the object
 * (view-space normal.x from -1.6 to 1.6) each time the hover starts.
 */
function addSweep(mat: THREE.Material, sweep: { value: number }) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev.call(mat, sh, r);
    sh.uniforms.uSweep = sweep;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uSweep;')
      .replace(
        '#include <opaque_fragment>',
        'float bahaSw = exp(-pow((normalize(normal).x - (uSweep * 3.2 - 1.6)) * 4.5, 2.0)) * sin(3.14159 * clamp(uSweep, 0.0, 1.0));\noutgoingLight += vec3(1.0) * bahaSw * 0.85;\n#include <opaque_fragment>',
      );
  };
  mat.customProgramCacheKey = () => 'baha-rim-sweep-v1';
}

const RIM_COLOR = '#eaffff';

export function Jar() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const cream = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Group>(null);
  const index = variantStore.use((s) => s.index);

  const geo = useMemo(
    () => ({
      body: jarBodyGeometry(),
      thread: threadGeometry(),
      label: labelGeometry(),
      back: backLabelGeometry(),
      creamBody: creamBodyGeometry(),
      creamTop: creamTopGeometry(),
      cap: capGeometry(),
      foil: new THREE.CircleGeometry(0.5, 72),
    }),
    [],
  );

  const mats = useMemo(() => {
    const glass = addRim(
      new THREE.MeshPhysicalMaterial({
        color: WORLDS[0].glass,
        metalness: 0,
        roughness: 0.2,
        transmission: 0.45,
        thickness: 0.8,
        ior: 1.5,
        attenuationColor: new THREE.Color(WORLDS[0].atten),
        attenuationDistance: 0.35,
        clearcoat: 0.6,
        clearcoatRoughness: 0.06,
        specularIntensity: 1,
        envMapIntensity: 1.0,
      }),
      { color: RIM_COLOR, power: 3.4 },
    );
    const capM = addRim(
      new THREE.MeshPhysicalMaterial({
        color: WORLDS[0].cap,
        roughness: 0.52,
        metalness: 0.05,
        clearcoat: 0.18,
        clearcoatRoughness: 0.5,
        envMapIntensity: 0.9,
      }),
      { color: RIM_COLOR, power: 4.5 },
    );
    const creamM = new THREE.MeshPhysicalMaterial({
      color: WORLDS[0].cream,
      roughness: 0.62,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.7,
    });
    const labelM = new THREE.MeshStandardMaterial({
      color: WORLDS[0].labelInk,
      transparent: true,
      depthWrite: false,
      roughness: 0.45,
      metalness: 0,
      emissive: new THREE.Color(WORLDS[0].labelInk),
      emissiveIntensity: 0.22,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const backM = labelM.clone();
    const foilM = new THREE.MeshStandardMaterial({ color: WORLDS[0].foil, metalness: 0.85, roughness: 0.3, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const sweep = { value: 0 };
    addSweep(glass.material, sweep);
    addSweep(capM.material, sweep);
    const halo = new THREE.SpriteMaterial({ map: dotTexture(), color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, depthTest: true, toneMapped: false });
    return { glass, cap: capM, cream: creamM, label: labelM, back: backM, foil: foilM, sweep, halo };
  }, []);

  // labels are drawn lazily: only the active variant at start, the others the first time they are picked
  const tex = useMemo(() => ({ labels: WORLDS.map((w) => labelTexture(w.name)), drawn: new Set<number>(), foil: capFoilTexture(), back: backLabelTexture() }), []);
  const fontsOk = useRef(false);

  useEffect(() => {
    let alive = true;
    whenFonts().then(() => {
      if (!alive) return;
      fontsOk.current = true;
      tex.labels.forEach((l, i) => {
        l.draw();
        tex.drawn.add(i);
      });
      tex.foil.draw();
      tex.back.draw();
    });
    mats.foil.map = tex.foil.texture;
    mats.foil.needsUpdate = true;
    mats.back.map = tex.back.texture;
    mats.back.needsUpdate = true;
    return () => {
      alive = false;
    };
  }, [tex, mats]);

  useEffect(() => {
    if (fontsOk.current && !tex.drawn.has(index)) {
      tex.labels[index].draw();
      tex.drawn.add(index);
    }
    mats.label.map = tex.labels[index].texture;
    mats.label.needsUpdate = true;
  }, [index, tex, mats]);

  useEffect(() => {
    bridge.registerMaterial('primary', mats.glass.material, mats.glass.uniforms.uRim);
    bridge.registerMaterial('cap', mats.cap.material, mats.cap.uniforms.uRim);
    bridge.registerMaterial('cream', mats.cream);
    return () => {
      bridge.unregisterMaterial('primary');
      bridge.unregisterMaterial('cap');
      bridge.unregisterMaterial('cream');
    };
  }, [mats]);

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      [mats.glass.material, mats.cap.material, mats.cream, mats.label, mats.back, mats.foil, mats.halo].forEach((m) => m.dispose());
      mats.halo.map?.dispose();
      tex.labels.forEach((l) => l.texture.dispose());
      tex.foil.texture.dispose();
      tex.back.texture.dispose();
    },
    [geo, mats, tex],
  );

  const uniforms: RimUniforms[] = [mats.glass.uniforms, mats.cap.uniforms];
  const { bind, value: hover } = useHoverRim(() => uniforms, 'jar', 1.5);
  const halo = useRef<THREE.Sprite>(null);
  const st = useRef({ introAt: -1, sweepAt: -10, wasOn: false });
  const tmpV = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    const a = pose(scrollState.smooth);
    const h = hover.current;
    const g = mats.glass.material;
    g.color.copy(look.glass);
    g.attenuationColor.copy(look.atten);
    g.envMapIntensity = 1.0 + h * 0.65;
    g.emissive.copy(look.glass).multiplyScalar(0.3 * h);
    mats.cap.material.emissive.copy(look.cap).multiplyScalar(0.18 * h);
    // one light sweep each time the hover starts
    const on = h > 0.15;
    if (on && !st.current.wasOn) st.current.sweepAt = t;
    st.current.wasOn = on;
    const sw = (t - st.current.sweepAt) / 0.75;
    mats.sweep.value = sw >= 0 && sw <= 1 ? sw : 0;
    rig.jarHover = h;
    // one-shot assembly once the scene is ready (A1: cap drops in from above, body rises from below)
    if (st.current.introAt < 0 && bridge.state.ready) st.current.introAt = t;
    const ip = st.current.introAt < 0 ? 0 : Math.min(1, (t - st.current.introAt) / 1.25);
    const e = 1 - Math.pow(1 - ip, 3);
    rig.intro = e;
    const fly = 1 - e;
    mats.cap.material.color.copy(look.cap);
    mats.cream.color.copy(look.cream);
    mats.label.color.copy(look.labelInk);
    mats.label.emissive.copy(look.labelInk);
    mats.back.color.copy(look.labelInk);
    mats.back.emissive.copy(look.labelInk);
    mats.foil.color.copy(look.foil);

    if (root.current) {
      const r = root.current;
      // tiny idle float — time-based but non-accumulating (pure function of t), never fights the scroll pose
      const bob = Math.sin(t * 0.9) * 0.012 * (1 - a.plinth);
      r.position.set(a.jarX, a.jarLift + bob, 0);
      r.rotation.set(a.jarPitch, a.jarYaw + Math.sin(t * 0.35) * 0.02, a.jarRoll);
      r.scale.setScalar(JS);
      r.updateMatrixWorld();
      rig.jarCenter.set(0, 0.5, 0);
      r.localToWorld(rig.jarCenter);
    }
    if (halo.current) {
      tmpV.copy(rig.jarCenter).sub(camera.position).normalize();
      halo.current.position.copy(rig.jarCenter).addScaledVector(tmpV, 1.8);
      halo.current.scale.setScalar(4.2 * JS * (0.9 + 0.1 * h));
      mats.halo.opacity = 0.5 * h;
      halo.current.visible = h > 0.002;
    }
    if (cap.current) {
      cap.current.position.y = JAR.capY + a.capLift + fly * 2.3;
      cap.current.rotation.y = a.capTwist + fly * 2.2;
      cap.current.rotation.z = Math.sin(Math.min(1, a.capLift * 2.5) * Math.PI) * 0.05;
      rig.capCenter.set(0, 0.15, 0);
      cap.current.localToWorld(rig.capCenter);
    }
    if (cream.current) {
      cream.current.position.y = a.explode * 0.5 - fly * 2.1;
      cream.current.rotation.y = a.explode * 0.5;
      rig.creamCenter.set(0, 0.45, 0);
      cream.current.localToWorld(rig.creamCenter);
    }
    if (body.current) {
      body.current.position.y = -fly * 2.1;
      rig.bodyCenter.set(0, 0.32, 0);
      body.current.localToWorld(rig.bodyCenter);
    }
  });

  return (
    <>
    <sprite ref={halo} material={mats.halo} renderOrder={-5} raycast={() => null} />
    <group ref={root}>
      <group {...steadyHover(bind)}>
        <group ref={body}>
          <mesh geometry={geo.body} material={mats.glass.material} frustumCulled={false} />
          <mesh geometry={geo.thread} material={mats.glass.material} />
          <mesh geometry={geo.label} material={mats.label} position-y={0.3} renderOrder={2} />
          <mesh geometry={geo.back} material={mats.back} position-y={0.3} renderOrder={2} />
        </group>
        <group ref={cream}>
          <mesh geometry={geo.creamBody} material={mats.cream} frustumCulled={false} />
          <mesh geometry={geo.creamTop} material={mats.cream} />
        </group>
        <group ref={cap} position-y={JAR.capY}>
          <mesh geometry={geo.cap} material={mats.cap.material} frustumCulled={false} />
          <mesh geometry={geo.foil} material={mats.foil} position-y={0.3045} rotation-x={-Math.PI / 2} renderOrder={2} />
        </group>
      </group>
    </group>
    </>
  );
}
