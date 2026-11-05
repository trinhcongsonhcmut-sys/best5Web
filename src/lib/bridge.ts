import type * as THREE from 'three';
import type { Vec3 } from './math';

/**
 * QC bridge — exposes REAL runtime state of the 3D scene on `window.__baha3d` so browser tests can prove that
 * orbit / colour / hover / scroll actually changed the WebGL scene (camera matrices, material values), instead of
 * trusting that a button exists. Every demo must register its materials and keep this state fresh.
 *
 * Contract used by tests/qc:
 *   - register the material whose colour changes with variants under key "primary"
 *   - hover rim/emissive amount goes to `state.hover.value` (0..1) and the registered `rim` uniform
 *   - `ready` becomes true once the first frames rendered with all assets loaded
 */
export interface BridgeState {
  demo: string;
  ready: boolean;
  scroll: { raw: number; smooth: number };
  camera: { position: Vec3; target: Vec3; fov: number };
  /** yaw = view angle wrapped to (-π, π]; yawTotal = unwrapped cumulative rotation (360° ⇒ |yawTotal| ≥ 2π) */
  orbit: { yaw: number; yawTotal: number; pitch: number; dolly: number };
  variant: { id: string; index: number; count: number };
  hover: { value: number; id: string | null };
  fps: { avg: number; frames: number };
  errors: string[];
  /** free-form per-demo extras (e.g. current scene name for fnb, exploded amount for automotive) */
  extra: Record<string, number | string | boolean>;
}

interface MatEntry {
  mat: THREE.Material;
  rim?: { value: number };
}

const state: BridgeState = {
  demo: '',
  ready: false,
  scroll: { raw: 0, smooth: 0 },
  camera: { position: [0, 0, 0], target: [0, 0, 0], fov: 0 },
  orbit: { yaw: 0, yawTotal: 0, pitch: 0, dolly: 1 },
  variant: { id: '', index: 0, count: 0 },
  hover: { value: 0, id: null },
  fps: { avg: 0, frames: 0 },
  errors: [],
  extra: {},
};

const mats = new Map<string, MatEntry>();
const hooks: { scrollTo?: (p: number) => void; resetView?: () => void; setVariant?: (i: number) => void } = {};

const hex = (c: unknown) => (c && typeof (c as THREE.Color).getHexString === 'function' ? '#' + (c as THREE.Color).getHexString() : null);

export const bridge = {
  state,
  begin(demo: string) {
    state.demo = demo;
    state.ready = false;
    state.errors = [];
    state.extra = {};
    state.hover = { value: 0, id: null };
    state.fps = { avg: 0, frames: 0 };
  },
  /** Called when the demo page unmounts (scenes also unregister their own materials in effect cleanups). */
  clearMaterials() {
    mats.clear();
  },
  registerMaterial(key: string, mat: THREE.Material, rim?: { value: number }) {
    mats.set(key, { mat, rim });
  },
  unregisterMaterial(key: string) {
    mats.delete(key);
  },
  setHooks(h: typeof hooks) {
    Object.assign(hooks, h);
  },
  logError(msg: string) {
    if (state.errors.length < 50) state.errors.push(msg);
  },
};

export interface MaterialReadout {
  color: string | null;
  emissive: string | null;
  emissiveIntensity: number | null;
  roughness: number | null;
  metalness: number | null;
  transmission: number | null;
  clearcoat: number | null;
  rim: number | null;
  opacity: number;
}

function readMaterial(key: string): MaterialReadout | null {
  const e = mats.get(key);
  if (!e) return null;
  const m = e.mat as unknown as Record<string, unknown> & { opacity: number };
  const num = (v: unknown) => (typeof v === 'number' ? v : null);
  return {
    color: hex(m.color),
    emissive: hex(m.emissive),
    emissiveIntensity: num(m.emissiveIntensity),
    roughness: num(m.roughness),
    metalness: num(m.metalness),
    transmission: num(m.transmission),
    clearcoat: num(m.clearcoat),
    rim: e.rim ? e.rim.value : null,
    opacity: m.opacity,
  };
}

declare global {
  interface Window {
    __baha3d?: {
      getState(): BridgeState;
      materials(): string[];
      material(key: string): MaterialReadout | null;
      scrollTo(p: number): void;
      resetView(): void;
      setVariant(i: number): void;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__baha3d = {
    getState: () => JSON.parse(JSON.stringify(state)) as BridgeState,
    materials: () => [...mats.keys()],
    material: readMaterial,
    scrollTo: (p) => hooks.scrollTo?.(p),
    resetView: () => hooks.resetView?.(),
    setVariant: (i) => hooks.setVariant?.(i),
  };
  window.addEventListener('error', (e) => bridge.logError(`window.error: ${e.message}`));
  window.addEventListener('unhandledrejection', (e) => bridge.logError(`unhandledrejection: ${String(e.reason)}`));
}
