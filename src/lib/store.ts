import { useSyncExternalStore } from 'react';

/** Tiny external store (no extra dependency). Selectors MUST return primitives or stable references. */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const subs = new Set<() => void>();
  const subscribe = (f: () => void) => {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  };
  return {
    get: () => state,
    set(patch: Partial<T> | ((s: T) => Partial<T>)) {
      const p = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...p };
      subs.forEach((f) => f());
    },
    subscribe,
    /** React hook: re-renders only when the selected primitive changes. Works inside <Canvas> (no context needed). */
    use<S>(selector: (s: T) => S): S {
      return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
    },
  };
}

/** Shared "which colour variant is active" store. One demo is mounted at a time; demos reset it on mount. */
export const variantStore = createStore({ index: 0 });
