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
  { no: '', title: ['Calm,', 'held in glass.'], line: 'Kem dưỡng đánh bông từ gel lô hội tươi — mát, nhẹ, tan ngay trên da.' },
  { no: '01 — Unveil', title: ['Twist.', 'Breathe.'], line: 'Nắp gân soft-touch xoay mở, để lộ lớp kem xoáy bông như mây.' },
  { no: '02 — Botanicals', title: ['Five quiet', 'actives.'], line: 'Năm thành phần quay quanh một mục tiêu: cấp ẩm sâu và làm dịu.' },
  { no: '03 — Craft', title: ['Made in', 'layers.'], line: 'Nắp — lõi kem — thân thủy tinh mờ: mỗi lớp được làm riêng.' },
  { no: '04 — Ritual', title: ['Skin,', 'at rest.'], line: 'Một nghi thức, ba sắc thái — chọn màu để cả thế giới đổi theo.' },
];

const INGREDIENTS = [
  { k: 'Aloe gel', v: 'Làm dịu · cấp ẩm tức thì' },
  { k: 'Vitamin E', v: 'Chống oxy hoá' },
  { k: 'Squalane', v: 'Khoá ẩm, không bết' },
  { k: 'Shea butter', v: 'Nuôi hàng rào da' },
  { k: 'Green tea', v: 'Thanh lọc · làm sáng' },
];

const DETAILS = [
  { k: 'Soft-touch cap', v: '72 gân · in foil' },
  { k: 'Whipped core', v: 'Kem bông · 92% lô hội' },
  { k: 'Frosted glass', v: 'Thành dày · tái nạp được' },
];

export function BeautyHud({ variants }: { variants: VariantDef[] }) {
  const idx = useStageIndex();
  const vi = variantStore.use((s) => s.index);
  const world = WORLDS[vi] ?? WORLDS[0];
  return (
    <div className="bt" data-stage={idx} style={{ ['--bt-ink' as string]: world.ink }}>
      <div className="bt-mark" aria-hidden>
        <span>BAHA</span>
        <em>botanica</em>
      </div>

      {COPY.map((c, i) => (
        <section key={i} className={`bt-copy${idx === i ? ' on' : ''}${i === 0 ? ' bt-hero' : ''}`} aria-hidden={idx !== i}>
          {i === 0 ? <p className="bt-kicker">{world.name} Cloud Cream · 50 ml</p> : <p className="bt-kicker">{c.no}</p>}
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
              <b>{it.k}</b>
              <small>{it.v}</small>
            </div>
            <span className="bt-num">{i + 1}</span>
          </div>
        ))}
        {DETAILS.map((it, i) => (
          <div key={it.k} className="bt-co bt-detail" data-side="r" ref={(el) => { calloutEls.detail[i] = el; }}>
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
            {it.k}
          </li>
        ))}
      </ol>

      <p className="bt-fine" aria-hidden>Thiết kế gốc BAHA · số liệu minh hoạ</p>
      <VariantPicker variants={variants} label="Sắc thái" className="bt-picker" />
    </div>
  );
}
