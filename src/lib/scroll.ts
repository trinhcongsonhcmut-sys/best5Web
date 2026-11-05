import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bridge } from './bridge';

gsap.registerPlugin(ScrollTrigger);

/**
 * Module-level scroll progress (0..1) of the active demo.
 *  - raw    : exact scroll position of the demo's tall container (ScrollTrigger progress)
 *  - smooth : GSAP ScrollTrigger *scrub* output (eased follow) — drive camera/scene from THIS one.
 * A singleton is used on purpose: R3F <Canvas> is a separate React root, so Context would not reach the scene.
 */
export const scrollState = { raw: 0, smooth: 0 };

/**
 * Binds the tall scroll container to `scrollState` with a real GSAP ScrollTrigger scrub, writes `--p` on the
 * container (CSS-driven DOM layers) and mirrors the values into the QC bridge. Re-measures on resize.
 */
export function useScrollProgress(containerRef: RefObject<HTMLElement | null>, scrub = 0.7) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    scrollState.raw = 0;
    scrollState.smooth = 0;
    const proxy = { p: 0 };
    const paint = () => {
      bridge.state.scroll.raw = scrollState.raw;
      bridge.state.scroll.smooth = scrollState.smooth;
      el.style.setProperty('--p', scrollState.smooth.toFixed(4));
      el.style.setProperty('--p-raw', scrollState.raw.toFixed(4));
    };
    const tween = gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        scrub,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          scrollState.raw = self.progress;
          paint();
        },
      },
      onUpdate: () => {
        scrollState.smooth = proxy.p;
        paint();
      },
    });
    bridge.setHooks({
      scrollTo: (p) => {
        const max = el.scrollHeight - window.innerHeight;
        window.scrollTo({ top: Math.max(0, Math.min(1, p)) * max, behavior: 'instant' as ScrollBehavior });
      },
    });
    paint();
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('orientationchange', onResize);
      tween.scrollTrigger?.kill();
      tween.kill();
      scrollState.raw = 0;
      scrollState.smooth = 0;
    };
  }, [containerRef, scrub]);
}

/** Scroll the page so the active demo sits at progress p (0..1) — used by the stage dots in the HUD. */
export function scrollToProgress(container: HTMLElement | null, p: number, smooth = true) {
  if (!container) return;
  const max = container.scrollHeight - window.innerHeight;
  window.scrollTo({ top: Math.max(0, Math.min(1, p)) * max, behavior: smooth ? 'smooth' : 'instant' as ScrollBehavior });
}
