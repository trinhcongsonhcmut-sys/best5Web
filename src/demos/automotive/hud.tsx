import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource-variable/space-grotesk';
import './automotive.css';
import { useEffect } from 'react';
import { useStageIndex, VariantPicker, type VariantDef } from '../../lib/ui';
import { scrollToProgress } from '../../lib/scroll';

interface Spec {
  k: string;
  v: string;
  u?: string;
}
interface Chapter {
  no: string;
  title: [string, string];
  line: string;
  specs?: Spec[];
  list?: string[];
}

const CHAPTERS: Record<number, Chapter> = {
  1: {
    no: '.01',
    title: ['Performance', '& range'],
    line: 'Hai mô-tơ trên nền pin 800 V phẳng — lực kéo tức thì, êm như lướt trên đường đèo.',
    specs: [
      { k: 'Range · WLTP', v: '640', u: 'km' },
      { k: 'Power', v: '560', u: 'kW · dual motor' },
      { k: '0–100 km/h', v: '2.9', u: 's' },
    ],
  },
  2: {
    no: '.02',
    title: ['Open', 'architecture'],
    line: 'Clamshell trước/sau, cửa mở rộng, bánh tách ra — vỏ liền khối nhấc khỏi khung pin để lộ cabin.',
    specs: [
      { k: 'Shell', v: 'Carbon', u: 'one-piece composite' },
      { k: 'Glass', v: '4', u: 'layer acoustic' },
      { k: 'Frame', v: 'Skate', u: 'board · 800 V' },
    ],
  },
  3: {
    no: '.03',
    title: ['Signature', 'light'],
    line: 'Dải đèn hậu liền khối, sáng dần khi hoàng hôn tắt.',
    list: ['Full-width light bar', 'Pearl tri-coat paint', 'Adaptive air ride −30 mm', '800 V · 10–80 % in 18 min'],
  },
};

export function AutomotiveHud({ variants }: { variants: VariantDef[] }) {
  const idx = useStageIndex();
  // once the visitor starts orbiting, the "Scroll" hint has done its job — hide it (it would sit on the car in top views)
  useEffect(() => {
    const root = document.querySelector('.demo-automotive');
    const canvas = root?.querySelector('canvas');
    if (!root || !canvas) return;
    const on = () => root.classList.add('ax-orbited');
    canvas.addEventListener('pointerdown', on);
    return () => canvas.removeEventListener('pointerdown', on);
  });
  return (
    <div className="ax" data-stage={idx}>
      <div className="ax-mark" aria-hidden>
        <span>AXIOM</span>
        <i />
        <em>GT · concept</em>
      </div>

      <section className={`ax-hero${idx === 0 ? ' on' : ''}`} aria-hidden={idx !== 0}>
        <p className="ax-kicker">BAHA motion lab — concept 05</p>
        <h1>
          <span>AXIOM</span>
          <span className="ax-t1">GT</span>
        </h1>
        <p className="ax-tag">
          <span>Electric grand tourer</span>
          <span className="ax-sep"> · </span>
          <span>Pearl &amp; carbon · zero compromise</span>
        </p>
      </section>

      {[1, 2, 3].map((i) => {
        const c = CHAPTERS[i];
        return (
          <section key={i} className={`ax-ch${idx === i ? ' on' : ''}`} aria-hidden={idx !== i}>
            <div className="ax-left">
              <span className="ax-no">{c.no}</span>
              <h2>
                <span className={c.title[0].endsWith('-') ? 'hy' : undefined}>{c.title[0]}</span>
                <span>{c.title[1]}</span>
              </h2>
              <p>{c.line}</p>
            </div>
            <div className="ax-right">
              {c.specs && (
                <dl>
                  {c.specs.map((s) => (
                    <div key={s.k}>
                      <dt>{s.k}</dt>
                      <dd>
                        <b>{s.v}</b>
                        {s.u && <small>{s.u}</small>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {c.list && (
                <ul>
                  {c.list.map((l, j) => (
                    <li key={l} className={j === 0 ? 'act' : ''}>
                      {l}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}

      <section className={`ax-final${idx === 4 ? ' on' : ''}`} aria-hidden={idx !== 4}>
        <h2>
          <span>Built for the</span>
          <span>long way round.</span>
        </h2>
        <p>Chọn lớp sơn — trắng ngọc trai, đỏ carmine, graphite hay đồng hoàng hôn.</p>
        <p className="ax-fine">Thiết kế gốc BAHA · số liệu minh hoạ</p>
      </section>

      <nav className="ax-progress" aria-label="Chương">
        <div className="ax-track">
          <i className="ax-fill" />
          <i className="ax-thumb" />
        </div>
        <ol>
          {['Intro', '.01', '.02', '.03', 'Fin'].map((l, i) => (
            <li key={l} className={i === idx ? 'on' : ''}>
              <button type="button" onClick={() => scrollToProgress(document.querySelector('.demo-automotive'), i / 4)} aria-current={i === idx ? 'step' : undefined}>
                {l}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <VariantPicker variants={variants} label="Lớp sơn" className="ax-picker" />

      {/* CC BY 4.0 attribution (required by the model licence — see ASSET_LICENSES.md) */}
      <p className="ax-credit">
        Car model: CarConcept © 2024 Eric Chadwick / Darmstadt Graphics Group —{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY 4.0
        </a>
        <span className="ax-credit-x"> · modified (paint, lights, logos removed)</span>
      </p>
    </div>
  );
}
