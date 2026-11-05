import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/familjen-grotesk';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './fashion.css';
import { useStageIndex, VariantPicker, type VariantDef } from '../../lib/ui';
import { variantStore } from '../../lib/store';
import { COLOURWAYS } from './palette';
import { garmentStore, uiStore } from './state';

export function FashionOverlay({ variants }: { variants: VariantDef[] }) {
  const idx = useStageIndex();
  const vi = variantStore.use((s) => s.index);
  // tone + label flip with the garment (midpoint of the swap), not on click
  const gi = garmentStore.use((s) => s.index);
  const ti = garmentStore.use((s) => s.tone);
  const dim = uiStore.use((s) => s.dim);
  const cw = COLOURWAYS[gi];
  const tone = COLOURWAYS[ti].tone;
  const next = COLOURWAYS[(vi + 1) % COLOURWAYS.length];
  const on = (i: number) => (idx === i ? ' on' : '');

  return (
    <div className={`fx${dim ? ' dim' : ''}`} data-stage={idx} data-tone={tone}>
      <div className="fx-mark" aria-hidden>
        <b>BAHA</b>
        <span>Atelier</span>
        <i />
        <em>Outerwear · SS27</em>
      </div>

      {/* 0 — hero */}
      <section className={`fx-blk fx-hero${on(0)}`} aria-hidden={idx !== 0}>
        <p className="fx-kick">Look 01 / Down shell</p>
        <h1>
          <em>Weightless,</em>
          <span>wrapped</span>
          <span>in colour.</span>
        </h1>
        <p className="fx-line">Áo phao nylon bóng lơ lửng giữa khối màu — nhẹ như một đám mây.</p>
      </section>

      {/* 1 — 3/4 */}
      <section className={`fx-blk fx-r fx-s1${on(1)}`} aria-hidden={idx !== 1}>
        <p className="fx-kick">02 — Construction</p>
        <h2>
          <span>Chambered</span>
          <em>for still air.</em>
        </h2>
        <p className="fx-line">Khoang bông ngang khâu ép kín — giữ ấm mà không nặng vai.</p>
        <dl className="fx-spec">
          <div><dt>Fill</dt><dd>750 FP down</dd></div>
          <div><dt>Shell</dt><dd>20D ciré nylon</dd></div>
          <div><dt>Weight</dt><dd>610 g</dd></div>
        </dl>
      </section>

      {/* 2 — half turn, layout shift */}
      <section className={`fx-blk fx-l fx-s2${on(2)}`} aria-hidden={idx !== 2}>
        <p className="fx-kick">03 — Reverse</p>
        <h2>
          <span>Turn</span>
          <span>around.</span>
          <em>The back tells it too.</em>
        </h2>
        <p className="fx-line">Lưng liền mảnh, cổ đứng 14 cm, chữ in phản quang trên vai.</p>
      </section>

      {/* 3 — macro */}
      <section className={`fx-blk fx-macro${on(3)}`} aria-hidden={idx !== 3}>
        <div className="fx-panel">
        <p className="fx-kick">04 — Up close</p>
        <h2>
          <em>Closer.</em>
        </h2>
        <ol className="fx-notes">
          <li><b>Ciré finish</b><span>Bóng ướt, cản gió</span></li>
          <li><b>Box stitch · 4 mm</b><span>Đường may ép khoang</span></li>
          <li><b>Two-way zip</b><span>Răng kim loại gunmetal</span></li>
        </ol>
        </div>
      </section>

      {/* 4 — final */}
      <section className={`fx-blk fx-r fx-final${on(4)}`} aria-hidden={idx !== 4}>
        <p className="fx-kick">Cumulus 01 — four colourways</p>
        <h2>
          <span>Wear the</span>
          <span>weather.</span>
        </h2>
        <p className="fx-line">Chọn một màu — cả thế giới đổi theo.</p>
      </section>

      {/* caption for the 3D "next look" preview that sits just below it */}
      <p className={`fx-nextlabel${idx === 3 ? ' off' : ''}`} aria-hidden>
        Next look <i>↘</i>
      </p>

      <div className="fx-pick" data-interactive>
        <div className="fx-pick-head">
          <span>Colourway</span>
          <b>{cw.label}</b>
        </div>
        <VariantPicker variants={variants} label="Colourway" className="fx-chips" />
        <button
          type="button"
          className="fx-next"
          onClick={() => variantStore.set({ index: (vi + 1) % COLOURWAYS.length })}
          aria-label={`Next colourway: ${next.label}`}
        >
          <i style={{ background: `linear-gradient(135deg, ${next.shell}, ${next.bgOut})` }} />
          <span>Next — {next.label.split(' ')[0]}</span>
          <svg viewBox="0 0 16 16" aria-hidden>
            <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
