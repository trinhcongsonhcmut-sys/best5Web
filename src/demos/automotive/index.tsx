/**
 * Demo 5 — Automotive v2: AXIOM GT, a pearl-white electric grand tourer at golden hour on a mountain road.
 * Photoreal model: CarConcept (© 2024 Eric Chadwick / Darmstadt Graphics Group, CC BY 4.0 — credited on the page),
 * re-rigged into the v1 motion (chaptered scroll orbit · side profile · open-architecture reveal · tail-light signature).
 */
import { useEffect } from 'react';
import { Stage } from '../../lib/Stage';
import { ShowcasePage, type DemoMeta } from '../../lib/ui';
import { AutomotiveScene } from './Scene';
import { AutomotiveHud } from './hud';
import { holdReady, releaseReady } from './anim';

const META: DemoMeta = {
  id: 'automotive',
  title: 'AXIOM GT — Automotive 3D',
  scrollVh: 720,
  ink: '#1d1d1b',
  paper: '#efe2cf',
  accent: '#d9452b',
  variants: [
    { id: 'pearl', label: 'Pearl White', swatch: ['#fbfaf6', '#d6d0c6'] },
    { id: 'carmine', label: 'Carmine Candy', swatch: ['#c11f2c', '#4f060c'] },
    { id: 'graphite', label: 'Torched Graphite', swatch: ['#5a5d63', '#1b1c1f'] },
    { id: 'bronze', label: 'Dusk Bronze', swatch: ['#c39b6c', '#5e4026'] },
  ],
};

export default function Automotive() {
  // bridge.ready waits for the car to be parsed, mounted, shadow-baked and compiled (released in Car.tsx)
  useEffect(() => {
    holdReady();
    return releaseReady;
  }, []);
  return (
    <ShowcasePage
      meta={META}
      scene={
        <Stage background="#d69a68" fov={27} tone="aces" exposure={0.88} shadows={false} dprMax={1.5}>
          <AutomotiveScene />
        </Stage>
      }
      overlay={<AutomotiveHud variants={META.variants} />}
    />
  );
}
