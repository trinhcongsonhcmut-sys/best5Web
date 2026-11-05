/**
 * Demo 02 — Cafe & Restaurant (/fnb). Two art directions in one scroll story:
 *   Cafe "Ember & Bean" (Bricolage Grotesque, espresso/caramel) → Restaurant "Vermiglio" (DM Serif Display, rosso/cream).
 */
import { useEffect, useRef } from 'react';
import '@fontsource-variable/bricolage-grotesque/wdth.css';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/dm-serif-display/400-italic.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/work-sans';
import './fnb.css';
import { ShowcasePage, VariantPicker, useStageIndex, type DemoMeta } from '../../lib/ui';
import { Stage } from '../../lib/Stage';
import { scrollState } from '../../lib/scroll';
import { FnbScene } from './FnbScene';
import { GLAZES, isLightTheme } from './timeline';
import { CALLOUTS, callouts } from './callouts';

const META: DemoMeta = {
  id: 'fnb',
  title: 'Cafe & Restaurant 3D',
  scrollVh: 900,
  ink: '#f5e2ca',
  paper: '#240d03',
  accent: '#e3b678',
  variants: GLAZES.map((g) => ({ id: g.id, label: g.label, swatch: g.swatch })),
};

function Chars({ text, base = 0 }: { text: string; base?: number }) {
  return (
    <>
      {[...text].map((c, i) => (
        <span key={i} className="ch" style={{ transitionDelay: `${(base + i) * 28}ms` }}>
          {c}
        </span>
      ))}
    </>
  );
}

function Overlay() {
  const stage = useStageIndex();
  const root = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const dots = useRef<(HTMLElement | null)[]>([]);
  const lines = useRef<(SVGGElement | null)[]>([]);

  // theme flip (cream background → dark ink) driven by real scroll progress
  useEffect(() => {
    const main = root.current?.closest('main');
    if (!main) return;
    let raf = 0;
    let last = '';
    const tick = () => {
      const p = scrollState.smooth;
      const theme = isLightTheme(p) ? 'light' : 'dark';
      const scene = p < 0.44 ? 'cafe' : 'restaurant';
      const k = theme + scene;
      if (k !== last) {
        main.setAttribute('data-fnb-theme', theme);
        main.setAttribute('data-fnb-scene', scene);
        last = k;
      }
      for (let i = 0; i < callouts.length; i++) {
        const el = labels.current[i];
        const dot = dots.current[i];
        const ln = lines.current[i];
        const c = callouts[i];
        if (!el || !dot || !ln) continue;
        const op = c.op.toFixed(3);
        el.style.opacity = op;
        dot.style.opacity = op;
        ln.style.opacity = (c.op * 0.85 * c.lineK).toFixed(3);
        if (c.op > 0) {
          dot.style.translate = `${c.x.toFixed(1)}px ${c.y.toFixed(1)}px`;
          el.style.translate = `${c.tx.toFixed(1)}px ${c.ty.toFixed(1)}px`;
          const x1 = c.x.toFixed(1);
          const y1 = c.y.toFixed(1);
          const x2 = c.tx.toFixed(1);
          const y2 = c.ty.toFixed(1);
          for (const l of ln.children) {
            l.setAttribute('x1', x1);
            l.setAttribute('y1', y1);
            l.setAttribute('x2', x2);
            l.setAttribute('y2', y2);
          }
          const side = c.col > 0 ? 'r' : 'l';
          if (el.dataset.side !== side) el.dataset.side = side;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const on = (i: number) => (stage === i ? ' on' : '');
  return (
    <div ref={root} className="fnb-ov">
      <div className="fnb-brand" aria-hidden>
        <span className="cafe">EMBER&nbsp;&amp;&nbsp;BEAN</span>
        <span className="rest">Vermiglio</span>
      </div>

      {/* 0 — cafe hero */}
      <section className={`fnb-split${on(0)}`} aria-hidden={stage !== 0}>
        <h1 className="w l">
          <Chars text="RICH" />
        </h1>
        <h1 className="w r">
          <Chars text="AROMA" base={3} />
        </h1>
        <p className="kick">Single origin · Cầu Đất 1.600 m</p>
        <p className="sub">Rang mộc theo mẻ nhỏ. Một tách mở đầu ngày.</p>
      </section>

      {/* 1 — slow roast */}
      <section className={`fnb-split${on(1)}`} aria-hidden={stage !== 1}>
        <h2 className="w l">
          <Chars text="SLOW" />
        </h2>
        <h2 className="w r">
          <Chars text="ROAST" base={3} />
        </h2>
        <p className="kick">Mẻ 12 kg · 14 phút</p>
        <p className="sub">Hương caramel, cacao và cam đường — rang chậm để giữ ngọt.</p>
      </section>

      {/* 2 — transition */}
      <section className={`fnb-bridge${on(2)}`} aria-hidden={stage !== 2}>
        <p className="from">FROM THE BEAN</p>
        <h2>
          <em>to the table.</em>
        </h2>
      </section>

      {/* 3 — ingredient ballet */}
      <section className={`fnb-ballet${on(3)}`} aria-hidden={stage !== 3}>
        <p className="kick">The ingredient ballet</p>
        <h2>
          A little bit
          <br />
          of everything.
        </h2>
      </section>

      {/* 4 — the dish */}
      <section className={`fnb-final${on(4)}`} aria-hidden={stage !== 4}>
        <p className="kick">Il capolavoro · 03</p>
        <h2>Your table is waiting.</h2>
        <p className="sub">Spaghetti hải sản · tôm · vẹm · cà chua bi · húng tây</p>
      </section>

      <div className="fnb-callouts" aria-hidden>
        <svg className="fnb-leaders">
          {CALLOUTS.map((c, i) => (
            <g key={c.title} data-i={i} ref={(el) => void (lines.current[i] = el)} style={{ opacity: 0 }}>
            {/* halo + ink: the leader stays readable where it crosses the pasta */}
            <line className="halo" />
            <line className="ink" />
          </g>
          ))}
        </svg>
        {CALLOUTS.map((c, i) => (
          <i key={`d${i}`} data-i={i} className="fnb-dot" ref={(el) => void (dots.current[i] = el)} style={{ opacity: 0 }} />
        ))}
        {CALLOUTS.map((c, i) => (
          <div key={c.title} data-i={i} ref={(el) => void (labels.current[i] = el)} className="fnb-callout" data-side={c.side} style={{ opacity: 0 }}>
            <em>{c.title}</em>
            <small>{c.sub}</small>
          </div>
        ))}
      </div>

      <div className="fnb-picker">
        <span className="fnb-picker-k">Men gốm · ly &amp; đĩa</span>
        <VariantPicker variants={META.variants} label="Men gốm" />
      </div>
    </div>
  );
}

export default function Fnb() {
  return (
    <ShowcasePage
      meta={META}
      scene={
        <Stage background="#240d03" exposure={1.0} tone="aces">
          <FnbScene />
        </Stage>
      }
      overlay={<Overlay />}
    />
  );
}
