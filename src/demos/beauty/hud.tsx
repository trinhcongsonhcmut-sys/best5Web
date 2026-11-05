import '@fontsource/bodoni-moda/400.css';
import '@fontsource/bodoni-moda/400-italic.css';
import '@fontsource/bodoni-moda/500.css';
import '@fontsource-variable/manrope';
import './beauty.css';
import { useStageIndex, VariantPicker, type VariantDef } from '../../lib/ui';
import { variantStore } from '../../lib/store';
import { calloutEls } from './rig';
import { WORLDS } from './palette';

const COPY = [
  { no: '', title: ['Bright,', 'held in glass.'], line: 'Serum cô đặc trong thủy tinh dày nhuộm màu — chắn tia UV, giữ hoạt chất luôn tươi.' },
  { no: '01 — Unveil', title: ['Twist.', 'Draw.'], line: 'Nắp gân mảnh xoay mở, ống hút thủy tinh rút lên một giọt serum.' },
  { no: '02 — Actives', title: ['Five bright', 'actives.'], line: 'Năm thành phần quay quanh một mục tiêu: da sáng, đều màu, căng mọng.' },
  { no: '03 — Craft', title: ['Made in', 'layers.'], line: 'Bầu bóp — ống hút thủy tinh — chai thủy tinh dày: mỗi lớp được làm riêng.' },
  { no: '04 — Ritual', title: ['Skin,', 'awake.'], line: 'Ba giọt mỗi sáng, ba sắc thái — chọn màu để cả thế giới đổi theo.' },
];

const INGREDIENTS = [
  { k: 'Sweet orange', v: 'Vitamin C tự nhiên · làm sáng' },
  { k: 'Vitamin C 15%', v: 'Ascorbic acid · chống oxy hoá' },
  { k: 'Hyaluronic acid', v: 'Cấp ẩm đa tầng' },
  { k: 'Vitamin E', v: 'Ổn định vitamin C' },
  { k: 'Orange peel oil', v: 'Tinh dầu vỏ · hương tươi' },
];

export function BeautyHud({ variants }: { variants: VariantDef[] }) {
  const idx = useStageIndex();
  const vi = variantStore.use((s) => s.index);
  const world = WORLDS[vi] ?? WORLDS[0];
  const details = [
    { k: 'Soft bulb', v: 'Cao su mềm · bóp một giọt' },
    { k: 'Glass pipette', v: 'Ống hút thủy tinh · nắp 96 gân' },
    { k: world.glassName, v: 'Thành dày · chắn UV · 30 ml' },
  ];
  return (
    <div className="bt" data-stage={idx} style={{ ['--bt-ink' as string]: world.ink }}>
      <div className="bt-mark" aria-hidden>
        <span>BAHA</span>
        <em>botanica</em>
      </div>

      {COPY.map((c, i) => (
        <section key={i} className={`bt-copy${idx === i ? ' on' : ''}${i === 0 ? ' bt-hero' : ''}`} aria-hidden={idx !== i}>
          {i === 0 ? <p className="bt-kicker">{world.name} serum · {world.active} · 30 ml</p> : <p className="bt-kicker">{c.no}</p>}
          <h2>
            <span>{c.title[0]}</span>
            <em>{c.title[1]}</em>
          </h2>
          <p className="bt-line">{c.line}</p>
        </section>
      ))}

      <div className="bt-callouts" aria-hidden={idx !== 2}>
        {INGREDIENTS.map((it, i) => (
          <div key={it.k} className="bt-co" data-side="r" ref={(el) => { calloutEls.ing[i] = el; }}>
            <i className="bt-dot" />
            <span className="bt-lead" />
            <div className="bt-txt">
              <b>{i === 0 ? world.fruit : i === 4 ? world.peel : it.k}</b>
              <small>{it.v}</small>
            </div>
            <span className="bt-num">{i + 1}</span>
          </div>
        ))}
        {details.map((it, i) => (
          <div key={i} className="bt-co bt-detail" data-side="r" ref={(el) => { calloutEls.detail[i] = el; }}>
            <i className="bt-dot" />
            <span className="bt-lead" />
            <div className="bt-txt">
              <b>{it.k}</b>
              <small>{it.v}</small>
            </div>
          </div>
        ))}
      </div>

      <ol className="bt-inglist" aria-hidden={idx !== 2}>
        {INGREDIENTS.map((it, i) => (
          <li key={it.k}>
            <i>{i + 1}</i>
            {i === 0 ? world.fruit : i === 4 ? world.peel : it.k}
          </li>
        ))}
      </ol>

      <p className="bt-fine" aria-hidden>Thiết kế gốc BAHA · số liệu minh hoạ</p>
      <VariantPicker variants={variants} label="Sắc thái" className="bt-picker" />
    </div>
  );
}
