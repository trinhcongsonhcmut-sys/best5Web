import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { HOME_CARDS, type HomeCard } from './data';
import { baseY, cardSize, clamp, easeOutCubic, poseFor } from './cascade';
import './home.css';

const N = HOME_CARDS.length;
const pad = (n: number) => String(n).padStart(2, '0');

interface Motion {
  pos: number; // animated (fractional) index of the front card
  target: number; // where pos is heading
  mx: number; // pointer parallax, smoothed −1‥1
  my: number;
  tmx: number;
  tmy: number;
  hover: number; // card under the pointer, −1 = none
  hIdx: number; // last hovered card (kept while the hover weight fades out)
  hw: number; // hover weight 0‥1
  hv: number[]; // per-card hover amount
  introT: number; // seconds since mount
  H: number; // card height in px
  dir: number; // direction of the last wheel / drag
  gestureStart: number;
  gesture: boolean;
  busy: boolean; // click transition running
  dragged: boolean;
}

export default function Home() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLUListElement>(null);
  const cardEls = useRef<(HTMLLIElement | null)[]>([]);
  const fillRef = useRef<HTMLElement>(null);
  const wakeRef = useRef<() => void>(() => {});
  const M = useRef<Motion>({
    pos: 0, target: 0, mx: 0, my: 0, tmx: 0, tmy: 0, hover: -1, hIdx: 0, hw: 0,
    hv: HOME_CARDS.map(() => 0), introT: 0, H: 400, dir: 1, gestureStart: 0, gesture: false, busy: false, dragged: false,
  });
  const [active, setActive] = useState(0);

  const reduceMotion = useRef(false);

  const goTo = useCallback((i: number) => {
    const m = M.current;
    m.target = clamp(Math.round(i), 0, N - 1);
    m.dir = m.target >= m.pos ? 1 : -1;
    wakeRef.current();
  }, []);

  /** Click → the card's hero image grows to full screen, then the route loads underneath while it fades out. */
  const open = useCallback(
    (card: HomeCard, face: HTMLElement | null) => {
      const m = M.current;
      if (m.busy) return;
      if (!face || reduceMotion.current) {
        navigate(card.path);
        return;
      }
      m.busy = true;
      const r = face.getBoundingClientRect();
      const ghost = document.createElement('div');
      ghost.setAttribute('aria-hidden', 'true');
      Object.assign(ghost.style, {
        position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
        borderRadius: getComputedStyle(face).borderRadius, backgroundImage: `url(${card.thumb})`, backgroundSize: 'cover',
        backgroundPosition: 'center', zIndex: '9999', pointerEvents: 'none', boxShadow: '0 40px 90px -30px rgba(10,10,20,.55)',
      } as Partial<CSSStyleDeclaration>);
      document.body.appendChild(ghost);
      rootRef.current?.classList.add('is-leaving');
      gsap.to(ghost, {
        left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0, duration: 0.72, ease: 'power3.inOut',
        onComplete: () => {
          navigate(card.path);
          gsap.to(ghost, { opacity: 0, duration: 0.7, delay: 0.55, ease: 'power1.out', onComplete: () => ghost.remove() });
        },
      });
    },
    [navigate],
  );

  useEffect(() => {
    document.title = 'BAHA Group — 3D Showcase';
    const root = rootRef.current!;
    const stage = stageRef.current!;
    const area = areaRef.current!;
    const m = M.current;
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reduce = reduceMotion.current;
    if (reduce) m.introT = 99;

    // Only touch the DOM when a value really changed, and write plain inline styles (no per-frame custom properties:
    // those invalidate the whole card subtree on every frame).
    const written = HOME_CARDS.map(() => ({ t: '', o: '', z: '', pe: '', veil: '', front: '' }));
    const parts = HOME_CARDS.map((_, i) => {
      const li = cardEls.current[i]!;
      return {
        veil: li.querySelector<HTMLElement>('.card-veil')!,
        scrim: li.querySelector<HTMLElement>('.card-scrim')!,
        info: li.querySelector<HTMLElement>('.card-info')!,
      };
    });

    let raf = 0;
    let running = false;
    let last = 0;
    let shown = -1;
    let idleTimer = 0;

    const layout = () => {
      const r = area.getBoundingClientRect();
      const { w, h } = cardSize(r.width, r.height);
      m.H = h;
      root.style.setProperty('--cw', `${w}px`);
      root.style.setProperty('--ch', `${h}px`);
      wake();
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const kPos = reduce ? 1 : 1 - Math.exp(-dt * 6.2);
      const kPar = reduce ? 1 : 1 - Math.exp(-dt * 4.5);
      const kHov = reduce ? 1 : 1 - Math.exp(-dt * 9);
      m.pos += (m.target - m.pos) * kPos;
      m.mx += (m.tmx - m.mx) * kPar;
      m.my += (m.tmy - m.my) * kPar;
      m.introT += dt;
      m.hw += ((m.hover >= 0 ? 1 : 0) - m.hw) * kHov;
      if (m.hover >= 0) m.hIdx = m.hover;
      let moving = Math.abs(m.target - m.pos) > 0.0004 || Math.abs(m.tmx - m.mx) > 0.002 || Math.abs(m.tmy - m.my) > 0.002 || m.introT < 1.5;
      if (Math.abs(m.hw - (m.hover >= 0 ? 1 : 0)) > 0.004) moving = true;

      const H = m.H;
      const by = baseY(N - 1 - m.pos);
      for (let i = 0; i < N; i++) {
        const el = cardEls.current[i];
        if (!el) continue;
        const tgt = m.hover === i ? 1 : 0;
        m.hv[i] += (tgt - m.hv[i]) * kHov;
        if (Math.abs(tgt - m.hv[i]) > 0.004) moving = true;

        const d = i - m.pos;
        const p = poseFor(d, H);
        // intro: cards rise into place one after another
        const ip = easeOutCubic(clamp((m.introT - 0.12 - i * 0.09) / 0.85, 0, 1));
        let y = p.y + by * H + (1 - ip) * H * 0.9;
        let s = p.s * (0.94 + 0.06 * ip);
        let z = p.z;
        // hover: the hovered card swells (from its bottom edge, so it never slides out from under the pointer);
        // cards in front of it step down to give it room, cards behind nudge up.
        if (m.hw > 0.001) {
          const dd = i - m.hIdx;
          if (dd === 0) {
            s *= 1 + 0.045 * m.hv[i] * m.hw;
            z += 24 * m.hv[i];
          } else if (dd < 0) {
            y += H * (dd === -1 ? 0.085 : dd === -2 ? 0.05 : 0.025) * m.hw;
          } else {
            y -= H * 0.03 * m.hw;
          }
        }
        // parallax: deeper cards drift more, and the whole stack tilts a little toward the pointer
        const depth = clamp(d, -1, 4);
        const x = p.x + m.mx * (6 + depth * 7);
        y += m.my * (3 + depth * 4);
        const tiltY = m.mx * 5;
        const tiltX = -m.my * 3.5;
        const w = written[i];
        const tr = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) perspective(1700px) rotateX(${(p.rx + tiltX).toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${s.toFixed(4)})`;
        if (tr !== w.t) {
          el.style.transform = tr;
          w.t = tr;
        }
        const op = (p.o * ip).toFixed(3);
        if (op !== w.o) {
          el.style.opacity = op;
          w.o = op;
        }
        const zi = d < 0 ? String(300 + Math.round(-d * 10)) : String(200 - Math.round(d * 10));
        if (zi !== w.z) {
          el.style.zIndex = zi;
          w.z = zi;
        }
        const pe = p.o * ip < 0.08 ? 'none' : 'auto';
        if (pe !== w.pe) {
          el.style.pointerEvents = pe;
          w.pe = pe;
        }
        const vl = (p.veil * (1 - m.hv[i] * 0.6)).toFixed(3);
        if (vl !== w.veil) {
          parts[i].veil.style.opacity = vl;
          w.veil = vl;
        }
        const fr = p.front.toFixed(3);
        if (fr !== w.front) {
          parts[i].scrim.style.opacity = fr;
          parts[i].info.style.opacity = fr;
          parts[i].info.style.transform = `translateY(${((1 - p.front) * 14).toFixed(2)}px)`;
          w.front = fr;
        }
      }

      if (fillRef.current) fillRef.current.style.transform = `scaleY(${(clamp(m.pos, 0, N - 1) / (N - 1)).toFixed(4)})`;
      const act = clamp(Math.round(m.pos), 0, N - 1);
      if (act !== shown) {
        shown = act;
        setActive(act);
      }
      if (moving) raf = requestAnimationFrame(frame);
      else running = false;
    };

    function wake() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    wakeRef.current = wake;

    // ── input ────────────────────────────────────────────────────────────────────────────────────
    // A wheel gesture = events separated by < GESTURE_GAP ms. One gesture moves at most one card, and the momentum
    // tail of a trackpad flick (events keep coming after the card has already snapped) is swallowed until it goes quiet.
    const GESTURE_GAP = 170;
    let locked = false;
    const snap = () => {
      const t = m.target;
      m.target = clamp(m.dir > 0 ? Math.ceil(t - 0.1) : Math.floor(t + 0.1), 0, N - 1);
      wake();
    };
    const onWheel = (e: WheelEvent) => {
      if (m.busy) return;
      e.preventDefault();
      const dy = (e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY) || e.deltaX;
      if (!dy) return;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        idleTimer = 0;
        locked = false;
        m.gesture = false;
        snap();
      }, GESTURE_GAP);
      if (locked) return;
      if (!m.gesture) {
        m.gesture = true;
        m.gestureStart = Math.round(m.target);
      }
      // one card per gesture — a trackpad flick must not fly through the whole deck
      m.target = clamp(m.target + dy / 520, Math.max(0, m.gestureStart - 1), Math.min(N - 1, m.gestureStart + 1));
      m.dir = dy > 0 ? 1 : -1;
      if (Math.abs(m.target - m.gestureStart) >= 0.999) {
        locked = true; // reached the neighbour: ignore the rest of this gesture
        m.gesture = false;
      }
      wake();
    };
    const onKey = (e: KeyboardEvent) => {
      if (m.busy || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown') goTo(m.target + 1);
      else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') goTo(m.target - 1);
      else if (k === 'Home') goTo(0);
      else if (k === 'End') goTo(N - 1);
      else return;
      e.preventDefault();
    };
    const onPointerMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType === 'touch') return;
      m.tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      m.tmy = (e.clientY / window.innerHeight - 0.5) * 2;
      wake();
    };
    const onResize = () => layout();
    const ro = new ResizeObserver(layout);
    ro.observe(area);
    layout();
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);
    wake();
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      ro.disconnect();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      wakeRef.current = () => {};
    };
  }, [goTo]);

  // ── drag / swipe on the stage ─────────────────────────────────────────────────────────────────
  const drag = useRef<{ id: number; y0: number; t0: number; on: boolean } | null>(null);
  const onStageDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { id: e.pointerId, y0: e.clientY, t0: M.current.target, on: false };
    M.current.dragged = false;
  };
  const onStageMove = (e: PointerEvent<HTMLDivElement>) => {
    const dr = drag.current;
    const m = M.current;
    if (!dr || dr.id !== e.pointerId || m.busy) return;
    const dy = e.clientY - dr.y0;
    if (!dr.on && Math.abs(dy) > 6) {
      dr.on = true;
      m.dragged = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      m.hover = -1;
    }
    if (!dr.on) return;
    const start = Math.round(dr.t0);
    m.target = clamp(dr.t0 - dy / (m.H * 0.62), Math.max(0, start - 1), Math.min(N - 1, start + 1));
    m.dir = dy < 0 ? 1 : -1;
    wakeRef.current();
  };
  const onStageUp = (e: PointerEvent<HTMLDivElement>) => {
    const dr = drag.current;
    if (!dr || dr.id !== e.pointerId) return;
    drag.current = null;
    if (!dr.on) return;
    const m = M.current;
    m.target = clamp(m.dir > 0 ? Math.ceil(m.target - 0.12) : Math.floor(m.target + 0.12), 0, N - 1);
    wakeRef.current();
  };
  /** A drag that ended over a card must not count as a click. */
  const swallowClick = (e: MouseEvent) => {
    if (M.current.dragged) {
      e.preventDefault();
      e.stopPropagation();
      M.current.dragged = false;
    }
  };

  const cur = HOME_CARDS[active];

  return (
    <main className="home" data-testid="gallery" ref={rootRef} style={{ '--tint': cur.tint } as CSSProperties}>
      <div className="home-bg" aria-hidden>
        {HOME_CARDS.map((c, i) => (
          <i key={c.id} className={`home-glow${i === active ? ' on' : ''}`} style={{ '--g': c.tint } as CSSProperties} />
        ))}
        <i className="home-grain" />
      </div>

      <header className="home-top">
        <span className="home-logo" aria-label="BAHA Group">
          <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden>
            <path d="M16 3.5l10.8 6.25v12.5L16 28.5 5.2 22.25V9.75z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M11 12.5h6.2a3 3 0 010 6H11zm0 6h7.2a3 3 0 010 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" transform="translate(1 -5)" />
          </svg>
          <b>BAHA</b>
          <span>Group</span>
        </span>
        <span className="home-top-note">Real-time 3D · WebGL</span>
      </header>

      <section className="home-brand">
        <p className="eyebrow" style={{ '--i': 0 } as CSSProperties}>
          <i />
          <span>3D Showcase · Vol. 01</span>
        </p>
        <h1 className="wordmark" aria-label="Baha 3D">
          <span className="wm-mask" aria-hidden>
            <span className="wm-line wm-ink" style={{ '--i': 0 } as CSSProperties}>Baha</span>
          </span>
          <span className="wm-mask" aria-hidden>
            <span className="wm-line wm-grad" style={{ '--i': 1 } as CSSProperties}>3D</span>
          </span>
        </h1>
        <p className="lede" style={{ '--i': 2 } as CSSProperties}>
          Năm trải nghiệm 3D thời gian thực — kéo để xoay, đổi màu trực tiếp trên mô hình, rê chuột để làm sáng, cuộn để dẫn camera.
        </p>
        <Link
          to={cur.path}
          className="cta"
          style={{ '--i': 3 } as CSSProperties}
          data-testid="home-cta"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            open(cur, cardEls.current[active]?.querySelector<HTMLElement>('.card-face') ?? null);
          }}
        >
          <span aria-live="polite">
            Mở <b>{cur.name}</b>
          </span>
          <i aria-hidden>
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </i>
        </Link>
      </section>

      <div
        className="home-stage"
        ref={stageRef}
        onPointerDown={onStageDown}
        onPointerMove={onStageMove}
        onPointerUp={onStageUp}
        onPointerCancel={onStageUp}
        onClickCapture={swallowClick}
      >
        <ul className="cards" ref={areaRef} aria-label="5 trải nghiệm 3D">
          {HOME_CARDS.map((c, i) => (
            <li
              key={c.id}
              className="card"
              ref={(el) => {
                cardEls.current[i] = el;
              }}
              style={{ '--tint': c.tint } as CSSProperties}
            >
              <Link
                to={c.path}
                className="card-face"
                data-testid={`gallery-link-${c.id}`}
                draggable={false}
                aria-label={`${c.name} — mở trải nghiệm 3D`}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse' && !drag.current?.on) {
                    M.current.hover = i;
                    wakeRef.current();
                  }
                }}
                onPointerLeave={() => {
                  if (M.current.hover === i) {
                    M.current.hover = -1;
                    wakeRef.current();
                  }
                }}
                onPointerMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const px = (e.clientX - r.left) / r.width;
                  const py = (e.clientY - r.top) / r.height;
                  const st = e.currentTarget.style;
                  st.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
                  st.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
                  st.setProperty('--mx', px.toFixed(3));
                  st.setProperty('--my', py.toFixed(3));
                }}
                onFocus={() => goTo(i)}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  open(c, e.currentTarget);
                }}
              >
                <img className="card-thumb" src={c.thumb} alt={c.alt} width={1250} height={1000} draggable={false} decoding="async" fetchPriority={i < 3 ? 'high' : 'auto'} />
                <span className="card-veil" />
                <span className="card-scrim" />
                <span className="card-glare" />
                <span className="card-top">
                  <span className="pill pill-no">{c.no} / {pad(N)}</span>
                  <span className="pill pill-tag">{c.name}</span>
                </span>
                <span className="card-info">
                  <span className="card-chapter">Chapter {c.no}</span>
                  <span className="card-title">{c.name}</span>
                  <span className="card-line">{c.tagline}</span>
                  <i className="card-go" aria-hidden>
                    <svg viewBox="0 0 16 16" width="16" height="16"><path d="M4 12L12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </i>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <aside className="home-rail" aria-label="Điều hướng các trải nghiệm">
        <div className="rail-count" aria-hidden>
          <b>{pad(active + 1)}</b>
          <span>/{pad(N)}</span>
        </div>
        <div className="rail-track">
          <i className="rail-line" />
          <i className="rail-fill" ref={fillRef} />
          {HOME_CARDS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={`rail-dot${i === active ? ' on' : ''}`}
              style={{ '--k': i / (N - 1) } as CSSProperties}
              aria-label={`${c.no} ${c.name}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <div className="rail-name" aria-hidden>{cur.name}</div>
      </aside>

      <footer className="home-foot">
        <span>© BAHA Group</span>
        <span className="home-hint">Cuộn · kéo · ↑ ↓</span>
        <span>React · Three.js · GSAP</span>
      </footer>
    </main>
  );
}
