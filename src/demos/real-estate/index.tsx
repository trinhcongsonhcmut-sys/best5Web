import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource-variable/jost';
import './real-estate.css';
import { Stage } from '../../lib/Stage';
import { ShowcasePage, type DemoMeta } from '../../lib/ui';
import { FACADES } from './materials';
import { RealEstateScene } from './Scene';
import { Hud } from './Hud';

// "Dusk & Brass" palette (reference/PALETTES.md — Demo 3)
const META: DemoMeta = {
  id: 'real-estate',
  title: 'Luxury Villa 3D',
  scrollVh: 900,
  ink: '#e8e2d4',
  paper: '#0e1626',
  accent: '#c5ac86',
  variants: FACADES.map((f) => ({ id: f.id, label: f.label, swatch: f.swatch })),
};

export default function RealEstate() {
  return (
    <ShowcasePage
      meta={META}
      scene={
        <Stage background="#0e1626" fov={34} exposure={1.0} tone="aces" dprMax={1.5}>
          <RealEstateScene />
        </Stage>
      }
      overlay={<Hud meta={META} />}
    />
  );
}
