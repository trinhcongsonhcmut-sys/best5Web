/**
 * Demo 5 — Automotive: AXIOM T1, an ORIGINAL BAHA faceted electric utility truck (no third-party brand / shape copy).
 * Mechanics reproduced from reference F: chaptered scroll orbit · side profile · exoskeleton explode · rear light bar.
 */
import { Stage } from '../../lib/Stage';
import { ShowcasePage, type DemoMeta } from '../../lib/ui';
import { AutomotiveScene } from './Scene';
import { AutomotiveHud } from './hud';

const META: DemoMeta = {
  id: 'automotive',
  title: 'AXIOM T1 — Automotive 3D',
  scrollVh: 720,
  ink: '#1d1d1b',
  paper: '#ece5d6',
  accent: '#d9452b',
  variants: [
    { id: 'stainless', label: 'Brushed Stainless', swatch: ['#eef0f0', '#9a9d9f'] },
    { id: 'graphite', label: 'Graphite Matte', swatch: ['#3a3b3e', '#1d1e20'] },
    { id: 'dune', label: 'Dune Metallic', swatch: ['#cbb895', '#8f7b5c'] },
    { id: 'mist', label: 'Mist Blue', swatch: ['#9ab4bf', '#56717c'] },
  ],
};

export default function Automotive() {
  return (
    <ShowcasePage
      meta={META}
      scene={
        <Stage background="#e4dccb" fov={28} tone="neutral" exposure={1.0} shadows={false} dprMax={1.75}>
          <AutomotiveScene />
        </Stage>
      }
      overlay={<AutomotiveHud variants={META.variants} />}
    />
  );
}
