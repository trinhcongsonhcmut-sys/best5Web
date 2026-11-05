import { useEffect, useRef, type CSSProperties } from 'react';
import { useStageIndex, VariantPicker, type DemoMeta } from '../../lib/ui';
import { scrollToProgress } from '../../lib/scroll';
import { scrollState } from '../../lib/scroll';
import { clockOf, hoverUi, LEVELS, railOf } from './state';

const COPY = [
  { eyebrow: 'Halcyon House · Private Villa', title: ['Ánh chiều', 'giữ lại trong đá.'], line: 'Hai tầng mái bằng, sàn đua sâu, một bãi cỏ rộng. Cuộn để bay vào ngôi nhà.' },
  { eyebrow: 'Ground · Arrival', title: ['Hiên đá', 'dưới sàn đua 2,2 m.'], line: 'Trụ đá khối, ốp gỗ ấm, đèn âm trần hắt vệt sáng xuống mặt đá.' },
  { eyebrow: 'Level 1 · Living & Suite', title: ['Tường kính,', 'lan can kính.'], line: 'Kính sàn-trần phản chiếu trời chạng vạng; phòng ngủ chính mở ra ban công.' },
  { eyebrow: 'Roof · Infinity', title: ['Hồ tràn bờ', 'trên mái đua.'], line: 'Mặt nước, sàn gỗ và ống khói đá — trỏ chuột để xem từng phần.' },
  { eyebrow: 'Overview · Night', title: ['Đêm xuống,', 'ngôi nhà thắp sáng.'], line: 'Kéo để xoay 360° quanh biệt thự, hoặc đổi vật liệu mặt tiền.' },
];

const PART_LABEL: Record<string, [string, string]> = {
  mass: ['Stone Cladding', 'Trụ & tường ốp đá khối'],
  glass: ['Glass Wall', 'Kính sàn-trần · lan can kính'],
  roof: ['Cantilever Slabs', 'Sàn đua & mái bê tông sẫm'],
  fins: ['Timber & Slats', 'Ốp gỗ ấm · lam thép đứng'],
  pool: ['Infinity Pool', 'Hồ tràn bờ trên mái'],
};

function container() {
  return document.querySelector<HTMLElement>('main.demo-real-estate');
}

/** right-hand level rail: continuous marker driven by the camera flight, clickable levels */
function LevelRail() {
  const marker = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const big = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let last = -1;
    let lastClock = '';
    const tick = () => {
      const r = railOf(scrollState.smooth);
      if (marker.current) marker.current.style.setProperty('--rail', r.toFixed(4));
      const i = Math.round(r);
      if (i !== last && root.current) {
        last = i;
        root.current.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i));
        if (big.current) big.current.textContent = LEVELS[i].label;
      }
      const c = clockOf(scrollState.smooth);
      if (c !== lastClock && clock.current) {
        lastClock = c;
        clock.current.textContent = c;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="re-rail" ref={root}>
      <div className="re-rail-track" ref={marker}>
        <i className="re-rail-marker" />
        {LEVELS.map((l, i) => (
          <button key={l.id} type="button" className={i === 0 ? 'on' : ''} style={{ '--slot': i } as CSSProperties} onClick={() => scrollToProgress(container(), l.p)} aria-label={`Đến ${l.label}`}>
            <span>{l.label}</span>
            <b />
          </button>
        ))}
      </div>
      <div className="re-rail-read">
        <span className="re-rail-time" ref={clock}>18:05</span>
        <span className="re-rail-big" ref={big}>Overview</span>
      </div>
    </div>
  );
}

function HoverLabel() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    hoverUi.el = ref.current;
    return () => {
      hoverUi.el = null;
    };
  }, []);
  return (
    <div className="re-hover" ref={ref} data-part="" aria-hidden>
      {Object.entries(PART_LABEL).map(([k, [en, vi]]) => (
        <div key={k} className="re-hover-card" data-for={k}>
          <b>{en}</b>
          <span>{vi}</span>
        </div>
      ))}
    </div>
  );
}

export function Hud({ meta }: { meta: DemoMeta }) {
  const idx = useStageIndex();
  const c = COPY[idx];
  return (
    <div className="re-hud" data-stage={idx}>
      <div className="re-brand">
        <span className="re-mark">HALCYON</span>
        <span className="re-sub">BAHA · Luxury Villa 3D</span>
      </div>
      <section className="re-copy" key={idx}>
        <p className="re-eyebrow">{c.eyebrow}</p>
        <h1>
          <span>{c.title[0]}</span>
          <span>{c.title[1]}</span>
        </h1>
        <p className="re-line">{c.line}</p>
      </section>
      <LevelRail />
      <div className="re-picker" data-interactive>
        <span className="re-picker-k">Façade</span>
        <VariantPicker variants={meta.variants} label="Vật liệu mặt tiền" />
      </div>
      <HoverLabel />
    </div>
  );
}
