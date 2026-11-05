import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { bridge } from './bridge';
import { resetOrbit, zoomBy } from './CameraRig';
import { scrollState, scrollToProgress, useScrollProgress } from './scroll';
import { STAGE_NAMES, stageIndex } from './math';
import { variantStore } from './store';

export interface VariantDef {
  id: string;
  label: string;
  /** one colour, or [from, to] for a gradient chip */
  swatch: string | [string, string];
}

export interface DemoMeta {
  id: string;
  title: string;
  /** height of the scroll track in vh — the timeline is spread over (scrollVh - 100)vh of scrolling */
  scrollVh: number;
  /** HUD palette (CSS custom properties on the page root) */
  ink: string;
  paper: string;
  accent: string;
  variants: VariantDef[];
}

/** Re-renders only when the 5-stage index changes (0/25/50/75/100%) — safe to use for DOM copy swaps. */
export function useStageIndex() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const i = stageIndex(scrollState.smooth);
      setIdx((p) => (p === i ? p : i));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return idx;
}

export function VariantPicker({ variants, label = 'Màu / vật liệu', className = '' }: { variants: VariantDef[]; label?: string; className?: string }) {
  const index = variantStore.use((s) => s.index);
  return (
    <div className={`variant-picker ${className}`} role="radiogroup" aria-label={label}>
      <span className="variant-label">{variants[index]?.label}</span>
      <div className="variant-chips">
        {variants.map((v, i) => (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={i === index}
            aria-label={v.label}
            data-testid={`variant-${i}`}
            className={`chip${i === index ? ' on' : ''}`}
            onClick={() => variantStore.set({ index: i })}
            style={{ background: Array.isArray(v.swatch) ? `linear-gradient(135deg, ${v.swatch[0]}, ${v.swatch[1]})` : v.swatch }}
          />
        ))}
      </div>
    </div>
  );
}

function Hud({ meta, containerRef }: { meta: DemoMeta; containerRef: RefObject<HTMLElement | null> }) {
  const idx = useStageIndex();
  return (
    <div className="hud">
      <Link to="/" className="hud-back" data-testid="back-link">
        <span aria-hidden>←</span> BAHA 3D
      </Link>
      <nav className="stage-dots" aria-label="Timeline">
        {[0, 25, 50, 75, 100].map((pct, i) => (
          <button
            key={pct}
            type="button"
            data-testid={`stage-dot-${i}`}
            className={i === idx ? 'on' : ''}
            aria-label={`${pct}% — ${STAGE_NAMES[i]}`}
            title={STAGE_NAMES[i]}
            onClick={() => scrollToProgress(containerRef.current, pct / 100)}
          >
            <i />
            <span>{pct}</span>
          </button>
        ))}
      </nav>
      <div className="hud-controls">
        <button type="button" data-testid="zoom-in" aria-label="Phóng to" onClick={() => zoomBy(0.86)}>＋</button>
        <button type="button" data-testid="zoom-out" aria-label="Thu nhỏ" onClick={() => zoomBy(1 / 0.86)}>－</button>
        <button type="button" data-testid="reset-view" onClick={resetOrbit}>Reset view</button>
      </div>
      <div className="scroll-hint" aria-hidden>
        <span>Scroll</span>
        <i />
      </div>
      <p className="hud-help">Kéo để xoay · cuộn để dẫn cảnh · chạm đúp để về góc nhìn gốc</p>
    </div>
  );
}

/**
 * Page chrome shared by all demos: a tall scroll track + one sticky full-viewport stage.
 * `scene`   → a <Stage>…</Stage> element (WebGL)
 * `overlay` → DOM layers (typography, picker…). Read progress with CSS `var(--p)` or `useStageIndex()`.
 */
export function ShowcasePage({ meta, scene, overlay }: { meta: DemoMeta; scene: ReactNode; overlay?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref);

  useEffect(() => {
    bridge.begin(meta.id);
    const writeVariant = () => {
      const i = variantStore.get().index;
      bridge.state.variant = { id: meta.variants[i]?.id ?? '', index: i, count: meta.variants.length };
    };
    variantStore.set({ index: 0 });
    writeVariant();
    const unsub = variantStore.subscribe(writeVariant);
    bridge.setHooks({ resetView: resetOrbit, setVariant: (i) => variantStore.set({ index: i }) });
    document.title = `${meta.title} — BAHA 3D Showcase`;
    window.scrollTo(0, 0);
    return () => {
      unsub();
      bridge.clearMaterials();
      bridge.state.ready = false;
    };
  }, [meta]);

  const vars = { '--ink': meta.ink, '--paper': meta.paper, '--accent': meta.accent, height: `${meta.scrollVh}vh` } as CSSProperties;
  return (
    <main ref={ref} className={`showcase demo-${meta.id}`} style={vars} data-demo={meta.id}>
      <div className="stage-sticky">
        <div className="canvas-wrap" data-testid="canvas-wrap">{scene}</div>
        <div className="overlay">{overlay}</div>
        <Hud meta={meta} containerRef={ref} />
      </div>
    </main>
  );
}
