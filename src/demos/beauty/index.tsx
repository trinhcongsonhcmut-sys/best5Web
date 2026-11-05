/**
 * Demo 1 — Beauty & Cosmetics: BAHA BOTANICA "Aloe Cloud Cream" (original brand; mechanics from references A1 + A2).
 * Frosted glass jar in a high-key pastel studio · giant Didone word behind the jar · aloe blades part on scroll ·
 * ingredients orbit with anchored callouts · layer separation · whole colour-world swaps per variant (in WebGL).
 */
import { Stage } from '../../lib/Stage';
import { ShowcasePage, type DemoMeta } from '../../lib/ui';
import { BeautyScene } from './Scene';
import { BeautyHud } from './hud';
import { WORLDS } from './palette';

const META: DemoMeta = {
  id: 'beauty',
  title: 'BAHA Botanica — Beauty 3D',
  scrollVh: 720,
  ink: '#14251d',
  paper: '#f4f8f6',
  accent: '#2f7f4b',
  variants: WORLDS.map((w) => ({ id: w.id, label: w.label, swatch: [w.bgMid, w.glass] as [string, string] })),
};

export default function Beauty() {
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
