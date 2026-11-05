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
    line: 'Ba mô-tơ trên khung pin phẳng — mô-men tức thì trên cát, đá và nhựa đường.',
    specs: [
      { k: 'Range · WLTP', v: '610', u: 'km' },
      { k: 'Towing', v: '4.9', u: 't' },
      { k: '0–100 km/h', v: '2.9', u: 's' },
    ],
  },
  2: {
    no: '.02',
    title: ['Exo-', 'skeleton'],
    line: 'Vỏ thép cán nguội 3 mm chịu lực: khung xương nằm bên ngoài, không phải bên trong.',
    specs: [
      { k: 'Shell', v: '3.0', u: 'mm cold-rolled steel' },
      { k: 'Glass', v: '6', u: 'layer laminated' },
      { k: 'Frame', v: 'Skate', u: 'board · 4-link' },
    ],
  },
  3: {
    no: '.03',
    title: ['Versatile', 'utility'],
    line: 'Thùng 1,9 m khoá kín, dải đèn sau liền khối 1,88 m.',
    list: ['Vault bed · 1.9 m', 'Rugged steel shell', 'Adaptive air ride +100 mm', 'On-board 240 V power'],
  },
};

export function AutomotiveHud({ variants }: { variants: VariantDef[] }) {
  const idx = useStageIndex();
  // once the visitor starts orbiting, the "Scroll" hint has done its job — hide it (it would sit on the truck in top views)
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
        <em>T1 · concept</em>
      </div>

      <section className={`ax-hero${idx === 0 ? ' on' : ''}`} aria-hidden={idx !== 0}>
        <p className="ax-kicker">BAHA motion lab — concept 05</p>
        <h1>
          <span>AXIOM</span>
          <span className="ax-t1">T1</span>
        </h1>
        <p className="ax-tag">
          <span>Electric utility</span>
          <span className="ax-sep"> · </span>
          <span>Folded steel · zero compromise</span>
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
        <p>Chọn lớp hoàn thiện — thép chải, graphite nhám, dune hay mist.</p>
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

      <VariantPicker variants={variants} label="Lớp hoàn thiện" className="ax-picker" />
    </div>
  );
}
