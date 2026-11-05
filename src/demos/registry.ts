/** Gallery metadata for the 5 routes. (Per-demo art direction/palettes live inside each demo folder.) */
export interface DemoCard {
  id: string;
  path: string;
  no: string;
  name: string;
  tagline: string;
  tile: string;
  tileInk: string;
}

export const DEMOS: DemoCard[] = [
  { id: 'beauty', path: '/beauty', no: '01', name: 'Beauty & Cosmetics', tagline: 'Thủy tinh · ánh sáng · tinh dầu', tile: '#e7a9b3', tileInk: '#ffd7dd' },
  { id: 'fnb', path: '/fnb', no: '02', name: 'Cafe & Restaurant', tagline: 'Từ hạt cà phê đến đĩa ăn', tile: '#c98a52', tileInk: '#ffd9ae' },
  { id: 'real-estate', path: '/real-estate', no: '03', name: 'Luxury Villa', tagline: 'Kiến trúc · hoàng hôn · chiều sâu', tile: '#7fb3a7', tileInk: '#cdeee5' },
  { id: 'fashion', path: '/fashion', no: '04', name: 'Fashion', tagline: 'Editorial · vải · da · kim loại', tile: '#b9a5e8', tileInk: '#e4daff' },
  { id: 'automotive', path: '/automotive', no: '05', name: 'Automotive', tagline: 'Sơn · kính · studio reflection', tile: '#e0482f', tileInk: '#ffc3b8' },
];
