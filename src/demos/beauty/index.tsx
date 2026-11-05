/**
 * Demo 1 — Beauty & Cosmetics: BAHA BOTANICA "Radiance serum" (v2 photoreal; motion = v1 baseline).
 * Amber glass dropper bottle on a warm off-white set · giant Didone word behind the bottle · citrus + water splash
 * part on scroll · actives orbit with anchored callouts · layer separation · whole serum world swaps per variant.
 */
import { useEffect } from 'react';
import { Stage } from '../../lib/Stage';
import { ShowcasePage, type DemoMeta } from '../../lib/ui';
import { BeautyScene } from './Scene';
import { BeautyHud } from './hud';
import { WORLDS } from './palette';
import { prep } from './rig';

const META: DemoMeta = {
  id: 'beauty',
  title: 'BAHA Botanica — Beauty 3D',
  scrollVh: 720,
  ink: '#33200f',
  paper: '#f6efe6',
  accent: '#d9822f',
  variants: WORLDS.map((w) => ({ id: w.id, label: w.label, swatch: [w.bgMid, w.glass] as [string, string] })),
};

export default function Beauty() {
  // hold drei's loading manager open from the first paint until the scene has compiled (see rig.prep)
  useEffect(() => {
    prep.start();
    return () => prep.end();
  }, []);
  return (
    <ShowcasePage
      meta={META}
      scene={
        <Stage background={WORLDS[0].bgMid} fov={30} tone="neutral" exposure={1} shadows={false} dprMax={1.75}>
          <BeautyScene />
        </Stage>
      }
      overlay={<BeautyHud variants={META.variants} />}
    />
  );
}
