/**
 * Demo 4 — Fashion: CUMULUS 01 by BAHA Atelier (original label). A procedural glossy puffer floats in a saturated
 * colour-block world; the colourway re-dyes the garment AND the whole world (backdrop shader, rim light, shadow,
 * type tone). Mechanics from references E2 (colourway = world swap, floating hero + shadow) and E1 (garment rail).
 */
import { Stage } from '../../lib/Stage';
import { ShowcasePage, type DemoMeta } from '../../lib/ui';
import { FashionScene } from './Scene';
import { FashionOverlay } from './Overlay';
import { COLOURWAYS } from './palette';

const META: DemoMeta = {
  id: 'fashion',
  title: 'CUMULUS 01 — Fashion 3D',
  scrollVh: 760,
  ink: '#fff8f0',
  paper: '#1a1918',
  accent: '#fff8f0',
  variants: COLOURWAYS.map((c) => ({ id: c.id, label: c.label, swatch: [c.shell, c.bgOut] as [string, string] })),
};

export default function Fashion() {
  return (
    <ShowcasePage
      meta={META}
      scene={
        <Stage background="#a8400a" fov={30} tone="neutral" exposure={1.0} shadows={false} dprMax={1.5}>
          <FashionScene />
        </Stage>
      }
      overlay={<FashionOverlay variants={META.variants} />}
    />
  );
}
