# LIB_REQUESTS — automotive

1. `src/lib/Stage.tsx` creates the canvas with `gl={{ alpha: false }}` → renderer clear alpha = 1. drei `<ContactShadows>`
   clears its render target with that alpha, so the whole shadow plane renders as an opaque dark rectangle.
   Workaround used here: baked soft shadow decals (no per-frame shadow pass). Suggestion: `gl.setClearAlpha(0)` in
   `Stage` `onCreated` (main pass is unaffected because every demo sets `scene.background`).
