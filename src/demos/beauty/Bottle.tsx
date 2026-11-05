/**
 * Hero object: 30 ml amber Boston-round dropper bottle, built in code.
 *   glass   — thick-walled lathe shell, the ONE transmissive material (bridge "primary")
 *   liquid  — opaque serum volume with meniscus (seen refracted + attenuated through the glass)
 *   label   — wrap-around paper (canvas print, fibre normal map), plain paper back seen through the glass
 *   dropper — 96-rib moulded collar · soft rubber bulb · glass pipette with a serum column
 * Mount points (driven by the pure scroll pose): root (whole bottle) · body · label · dropper · bulb.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { addRim, useHoverRim, type RimUniforms } from '../../lib/rim';
import { bridge } from '../../lib/bridge';
import { scrollState } from '../../lib/scroll';
import { variantStore } from '../../lib/store';
import { pose } from './anim';
import { look, WORLDS } from './palette';
import { dotTexture, labelTexture, paperNormalTexture, whenFonts } from './textures';
import { BOT, bottleGlassGeometry, bulbGeometry, collarGeometry, labelGeometry, liquidGeometry, pipetteCoreGeometries, pipetteGeometry, threadGeometry } from './geometry';
import { glassMaterial, waterMaterial } from './materials';
import { JS, rig, steadyHover } from './rig';

export function Bottle() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const label = useRef<THREE.Group>(null);
  const dropper = useRef<THREE.Group>(null);
  const bulb = useRef<THREE.Group>(null);
  const index = variantStore.use((s) => s.index);

  const geo = useMemo(() => {
    const cores = pipetteCoreGeometries();
    return {
      glass: bottleGlassGeometry(),
      thread: threadGeometry(),
      liquid: liquidGeometry(),
      label: labelGeometry(),
      collar: collarGeometry(80),
      bulb: bulbGeometry(),
      pipette: pipetteGeometry(),
      core: cores.liquid,
      hollow: cores.hollow,
    };
  }, []);

  const mats = useMemo(() => {
    const glass = glassMaterial();
    glass.material.color = look.glass;
    glass.material.attenuationColor = look.atten;
    const liquid = new THREE.MeshPhysicalMaterial({ roughness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 0.9 });
    liquid.color = look.liquid;
    // light passing through the serum column: brighter where we look straight through it, darker at grazing walls
    liquid.onBeforeCompile = (sh) => {
      sh.uniforms.uLiq = { value: look.liquid };
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uLiq;')
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
           float lqNv = saturate(abs(dot(normalize(normal), normalize(vViewPosition))));
           // backlit serum: light through the column glows at the curved edges, a softer bloom through the middle
           totalEmissiveRadiance += uLiq * (0.06 + 0.22 * pow(lqNv, 2.5) + 0.6 * pow(1.0 - lqNv, 1.6) * (1.0 - smoothstep(0.35, 0.85, abs(normalize(normal).y))));`,
        );
    };
    liquid.customProgramCacheKey = () => 'baha-serum-liquid-v2';
    const collar = addRim(
      new THREE.MeshPhysicalMaterial({ roughness: 0.26, clearcoat: 0.3, clearcoatRoughness: 0.25, envMapIntensity: 1.1 }),
      { color: '#ffffff', power: 4.5 },
    );
    collar.material.color = look.collar;
    const bulbM = addRim(
      // same program as the collar (fewer cold shader compiles): soft rubber = rough base + faint coat
      new THREE.MeshPhysicalMaterial({ roughness: 0.6, clearcoat: 0.12, clearcoatRoughness: 0.6, envMapIntensity: 0.95 }),
      { color: '#ffffff', power: 4.5 },
    );
    bulbM.material.color = look.bulb;
    const pipette = waterMaterial();
    const hollow = new THREE.MeshStandardMaterial({ color: '#e6dccd', roughness: 0.06, metalness: 0, envMapIntensity: 1.4 });
    const paperN = paperNormalTexture(256, 13);
    paperN.repeat.set(5, 4);
    const labelM = new THREE.MeshStandardMaterial({
      roughness: 0.66,
      metalness: 0,
      normalMap: paperN,
      normalScale: new THREE.Vector2(0.14, 0.14),
      envMapIntensity: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const labelBack = new THREE.MeshStandardMaterial({ roughness: 0.85, side: THREE.BackSide, envMapIntensity: 0.6 });
    const halo = new THREE.SpriteMaterial({ map: dotTexture(), color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, depthTest: true, toneMapped: false });
    // soft halo behind the bottle, tinted by the world accent so it reads on the pale set (never over the product)
    return { glass, liquid, collar, bulb: bulbM, pipette, hollow, label: labelM, labelBack, paperN, halo };
  }, []);

  // one label canvas, redrawn when the variant changes (after the self-hosted fonts are in)
  const tex = useMemo(() => labelTexture(), []);
  const fontsOk = useRef(false);
  useEffect(() => {
    mats.label.map = tex.texture;
    mats.label.needsUpdate = true;
  }, [mats, tex]);
  useEffect(() => {
    let alive = true;
    whenFonts().then(() => {
      if (!alive) return;
      fontsOk.current = true;
      tex.draw(WORLDS[variantStore.get().index] ?? WORLDS[0]);
    });
    return () => {
      alive = false;
    };
  }, [tex]);
  useEffect(() => {
    if (fontsOk.current) tex.draw(WORLDS[index] ?? WORLDS[0]);
  }, [index, tex]);

  useEffect(() => {
    bridge.registerMaterial('primary', mats.glass.material, mats.glass.uniforms.uRim);
    bridge.registerMaterial('collar', mats.collar.material, mats.collar.uniforms.uRim);
    bridge.registerMaterial('liquid', mats.liquid);
    return () => {
      bridge.unregisterMaterial('primary');
      bridge.unregisterMaterial('collar');
      bridge.unregisterMaterial('liquid');
    };
  }, [mats]);

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      [mats.glass.material, mats.liquid, mats.collar.material, mats.bulb.material, mats.pipette.material, mats.hollow, mats.label, mats.labelBack, mats.halo].forEach((m) => m.dispose());
      mats.halo.map?.dispose();
      mats.paperN.dispose();
      tex.texture.dispose();
    },
    [geo, mats, tex],
  );

  const uniforms: RimUniforms[] = [mats.glass.uniforms, mats.collar.uniforms, mats.bulb.uniforms];
  const { bind, value: hover } = useHoverRim(() => uniforms, 'jar', 1.5);
  const halo = useRef<THREE.Sprite>(null);
  const st = useRef({ introAt: -1 });
  const tmpV = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    const a = pose(scrollState.smooth);
    const h = hover.current;
    // hover never washes the colours out: only a touch more env reflection + the thin rim + the halo behind
    mats.glass.material.envMapIntensity = 1.15 + h * 0.35;
    mats.labelBack.color.copy(look.paper).multiplyScalar(0.8);
    rig.jarHover = h;
    if (st.current.introAt < 0 && bridge.state.ready) st.current.introAt = t;
    const ip = st.current.introAt < 0 ? 0 : Math.min(1, (t - st.current.introAt) / 1.25);
    const e = 1 - Math.pow(1 - ip, 3);
    rig.intro = e;
    const fly = 1 - e;

    if (root.current) {
      const r = root.current;
      const bob = Math.sin(t * 0.9) * 0.012 * (1 - a.plinth);
      r.position.set(a.jarX, a.jarLift + bob, 0);
      r.rotation.set(a.jarPitch, a.jarYaw + Math.sin(t * 0.35) * 0.02, a.jarRoll);
      r.scale.setScalar(JS);
      r.updateMatrixWorld();
      rig.jarCenter.set(0, 0.89, 0);
      r.localToWorld(rig.jarCenter);
    }
    if (halo.current) {
      tmpV.copy(rig.jarCenter).sub(camera.position).normalize();
      halo.current.position.copy(rig.jarCenter).addScaledVector(tmpV, 1.6);
      halo.current.scale.set(2.3 * JS * (0.92 + 0.08 * h), 3.4 * JS * (0.92 + 0.08 * h), 1);
      mats.halo.color.copy(look.accent).lerp(look.glow, 0.35);
      mats.halo.opacity = 0.42 * h;
      halo.current.visible = h > 0.002;
    }
    if (body.current) {
      body.current.position.y = -fly * 2.1;
      body.current.updateMatrixWorld();
      rig.bodyAnchor.set(0, 0.42, 0);
      body.current.localToWorld(rig.bodyAnchor);
    }
    if (label.current) {
      const k = a.labelSep;
      label.current.scale.set(1 + 0.2 * k, 1, 1 + 0.2 * k);
      label.current.position.y = (BOT.labelY0 + BOT.labelY1) / 2 + 0.04 * k;
      label.current.rotation.y = -0.3 * k;
    }
    if (dropper.current) {
      const d = dropper.current;
      d.position.set(a.dropperX, BOT.collarY + a.dropperY + fly * 2.3, 0);
      // a little wobble while the collar leaves the thread
      d.rotation.set(0, a.dropperTwist + fly * 2.2, a.dropperTilt + Math.sin(Math.min(1, a.dropperY * 2.2) * Math.PI) * 0.04);
      d.updateMatrixWorld();
      rig.pipetteAnchor.set(0, BOT.tipY + 0.3, 0);
      d.localToWorld(rig.pipetteAnchor);
    }
    if (bulb.current) {
      bulb.current.position.y = BOT.collarH + a.bulbLift;
      bulb.current.updateMatrixWorld();
      rig.bulbAnchor.set(0, 0.2, 0);
      bulb.current.localToWorld(rig.bulbAnchor);
    }
  });

  const labelY = (BOT.labelY0 + BOT.labelY1) / 2;
  return (
    <>
      <sprite ref={halo} material={mats.halo} renderOrder={-5} raycast={() => null} />
      <group ref={root}>
        <group {...steadyHover(bind)}>
          <group ref={body}>
            <mesh geometry={geo.liquid} material={mats.liquid} />
            <mesh geometry={geo.glass} material={mats.glass.material} frustumCulled={false} />
            <mesh geometry={geo.thread} material={mats.glass.material} />
            <group ref={label} position-y={labelY}>
              <mesh geometry={geo.label} material={mats.label} renderOrder={2} />
              <mesh geometry={geo.label} material={mats.labelBack} />
            </group>
          </group>
          <group ref={dropper} position-y={BOT.collarY}>
            <mesh geometry={geo.core} material={mats.liquid} />
            <mesh geometry={geo.hollow} material={mats.hollow} />
            <mesh geometry={geo.pipette} material={mats.pipette.material} renderOrder={4} />
            <mesh geometry={geo.collar} material={mats.collar.material} frustumCulled={false} />
            <group ref={bulb} position-y={BOT.collarH}>
              <mesh geometry={geo.bulb} material={mats.bulb.material} />
            </group>
          </group>
        </group>
      </group>
    </>
  );
}
