import { DEMOS } from '../demos/registry';

/** One card of the home cascade. Names, routes and taglines come from the demo registry; only the visuals are added here. */
export interface HomeCard {
  id: string;
  path: string;
  /** "01" … "05" */
  no: string;
  name: string;
  tagline: string;
  /** Hero frame of the route, captured by `scripts/capture-home-thumbs.mjs` (5:4). */
  thumb: string;
  /** Dominant colour of the thumbnail — tints the page glow while this card is in front. */
  tint: string;
  /** Alt text for the thumbnail. */
  alt: string;
}

const LOOK: Record<string, { tint: string; alt: string }> = {
  beauty: { tint: '#f4a259', alt: 'Chai serum thủy tinh hổ phách với lát cam và nước bắn' },
  fnb: { tint: '#8a4a2a', alt: 'Tách cà phê latte art trên nền nâu, hạt cà phê bay' },
  'real-estate': { tint: '#e8b283', alt: 'Biệt thự hai tầng lúc hoàng hôn, kính và đá' },
  fashion: { tint: '#f58a2b', alt: 'Áo phao cam bóng lơ lửng trên nền cam' },
  automotive: { tint: '#e6b9a0', alt: 'Xe điện trắng ngọc trên đường lúc hoàng hôn' },
};

/** Order of the cascade, front card first (Founder, 06/11/2026). Numbers on the cards follow this order, not the registry's. */
const ORDER = ['automotive', 'real-estate', 'beauty', 'fashion', 'fnb'];

export const HOME_CARDS: HomeCard[] = ORDER.map((id) => DEMOS.find((d) => d.id === id)!).map((d, i) => ({
  id: d.id,
  path: d.path,
  no: String(i + 1).padStart(2, '0'),
  name: d.name,
  tagline: d.tagline,
  thumb: `/thumbs/${d.id}.jpg`,
  tint: LOOK[d.id]?.tint ?? d.tile,
  alt: LOOK[d.id]?.alt ?? d.name,
}));
