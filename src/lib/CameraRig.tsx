import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bridge } from './bridge';
import { scrollState } from './scroll';
import { buildPoseSampler, clamp, damp, type PoseStop } from './math';

/**
 * ONE camera controller for the whole showcase:
 *   final camera = scroll-driven path (Catmull-Rom through PoseStops)  +  user orbit offset (drag / arrows / buttons).
 * They never fight: orbit is an *offset around the path's current target*; after the user scrolls on, the offset
 * relaxes back to zero (relaxOnScroll) so the scripted shot is always readable, and "Reset view" eases it home.
 * Touch: only horizontal drags orbit (page keeps vertical scrolling via touch-action: pan-y).
 */
export interface OrbitLimits {
  /** absolute camera elevation limits in radians (0 = horizon) */
  elevMin: number;
  elevMax: number;
  /** ± yaw limit in radians, Infinity = full 360° */
  yawRange: number;
  dollyMin: number;
  dollyMax: number;
  /** radians per pixel */
  sensitivity: number;
}

export const DEFAULT_LIMITS: OrbitLimits = { elevMin: -0.1, elevMax: 1.25, yawRange: Infinity, dollyMin: 0.6, dollyMax: 1.5, sensitivity: 0.0058 };

export const orbit = {
  yaw: 0,
  pitch: 0,
  dolly: 1,
  tYaw: 0,
  tPitch: 0,
  tDolly: 1,
  dragging: false,
  lastInputAt: -1e9,
  scrollAtInput: 0,
};

let activeLimits: OrbitLimits = DEFAULT_LIMITS;

const TAU = Math.PI * 2;
export function resetOrbit() {
  orbit.tYaw = Math.round(orbit.yaw / TAU) * TAU; // shortest way home, never spins back a full turn
  orbit.tPitch = 0;
  orbit.tDolly = 1;
}
export function zoomBy(factor: number) {
  orbit.tDolly = clamp(orbit.tDolly * factor, activeLimits.dollyMin, activeLimits.dollyMax);
  orbit.lastInputAt = performance.now();
  orbit.scrollAtInput = scrollState.smooth;
}
export const hasUserInputRecently = (ms = 2500) => performance.now() - orbit.lastInputAt < ms;

export interface CameraRigProps {
  stops: PoseStop[];
  limits?: Partial<OrbitLimits>;
  defaultFov?: number;
  /** below this aspect ratio the camera backs off so the subject still fits (portrait phones) */
  fitAspect?: number;
  relaxOnScroll?: boolean;
  /** extra per-frame offset hook (e.g. subtle breathing) applied to the final camera position */
  onAfter?: (camera: THREE.PerspectiveCamera, dt: number) => void;
}

export function CameraRig({ stops, limits, defaultFov = 35, fitAspect = 1.6, relaxOnScroll = true, onAfter }: CameraRigProps) {
  const { camera, gl, size } = useThree();
  const lim = useMemo(() => ({ ...DEFAULT_LIMITS, ...limits }), [limits]);
  const sample = useMemo(() => buildPoseSampler(stops, defaultFov), [stops, defaultFov]);
  const tmp = useRef({ pos: new THREE.Vector3(), tgt: new THREE.Vector3(), off: new THREE.Vector3(), sph: new THREE.Spherical() });

  useEffect(() => {
    activeLimits = lim;
    // fresh demo → fresh orbit
    orbit.yaw = orbit.pitch = orbit.tYaw = orbit.tPitch = 0;
    orbit.dolly = orbit.tDolly = 1;
    orbit.dragging = false;
  }, [lim]);

  useEffect(() => {
    const el = gl.domElement;
    let sx = 0, sy = 0, lx = 0, ly = 0, lock: 'x' | 'y' | null = null;
    const touch = (e: PointerEvent) => e.pointerType === 'touch';
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      orbit.dragging = true;
      sx = lx = e.clientX;
      sy = ly = e.clientY;
      lock = null;
      try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const move = (e: PointerEvent) => {
      if (!orbit.dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      if (touch(e) && !lock) {
        if (Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
        lock = Math.abs(e.clientX - sx) > Math.abs(e.clientY - sy) * 1.15 ? 'x' : 'y';
      }
      if (touch(e) && lock === 'y') return; // let the page scroll
      orbit.tYaw -= dx * lim.sensitivity;
      if (!touch(e)) orbit.tPitch += dy * lim.sensitivity;
      if (Number.isFinite(lim.yawRange)) orbit.tYaw = clamp(orbit.tYaw, -lim.yawRange, lim.yawRange);
      orbit.tPitch = clamp(orbit.tPitch, -1.2, 1.2);
      orbit.lastInputAt = performance.now();
      orbit.scrollAtInput = scrollState.smooth;
    };
    const up = (e: PointerEvent) => {
      orbit.dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const dbl = () => resetOrbit();
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(input|textarea|select)$/i.test(t.tagName)) return;
      if (e.key === 'ArrowLeft') orbit.tYaw += 0.18;
      else if (e.key === 'ArrowRight') orbit.tYaw -= 0.18;
      else return;
      orbit.lastInputAt = performance.now();
      orbit.scrollAtInput = scrollState.smooth;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('dblclick', dbl);
    window.addEventListener('keydown', key);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('dblclick', dbl);
      window.removeEventListener('keydown', key);
    };
  }, [gl, lim]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const { pos, tgt, off, sph } = tmp.current;
    const fov = sample(scrollState.smooth, pos, tgt);

    if (relaxOnScroll && !orbit.dragging && Math.abs(scrollState.smooth - orbit.scrollAtInput) > 0.035) resetOrbit();

    orbit.yaw = damp(orbit.yaw, orbit.tYaw, 9, dt);
    orbit.pitch = damp(orbit.pitch, orbit.tPitch, 8, dt);
    orbit.dolly = damp(orbit.dolly, orbit.tDolly, 8, dt);

    off.copy(pos).sub(tgt);
    sph.setFromVector3(off);
    const aspect = size.width / Math.max(1, size.height);
    const fit = aspect < fitAspect ? clamp(Math.pow(fitAspect / aspect, 0.75), 1, 2.2) : 1;
    sph.radius *= orbit.dolly * fit;
    sph.theta += orbit.yaw;
    const baseElev = Math.PI / 2 - sph.phi;
    const elev = clamp(baseElev + orbit.pitch, Math.min(lim.elevMin, baseElev), Math.max(lim.elevMax, baseElev));
    sph.phi = Math.PI / 2 - elev;
    off.setFromSpherical(sph);

    const cam = camera as THREE.PerspectiveCamera;
    cam.position.copy(tgt).add(off);
    cam.lookAt(tgt);
    if (Math.abs(cam.fov - fov) > 0.005) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    onAfter?.(cam, dt);

    const b = bridge.state;
    b.orbit.yawTotal = orbit.yaw; // unwrapped: proves a full 360° was really turned
    b.orbit.yaw = ((((orbit.yaw + Math.PI) % TAU) + TAU) % TAU) - Math.PI; // wrapped to (-π, π] = actual view angle
    b.orbit.pitch = orbit.pitch;
    b.orbit.dolly = orbit.dolly;
    b.camera.target[0] = tgt.x;
    b.camera.target[1] = tgt.y;
    b.camera.target[2] = tgt.z;
  });

  return null;
}
