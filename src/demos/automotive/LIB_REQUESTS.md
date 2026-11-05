# LIB_REQUESTS — automotive

1. ~~`src/lib/Stage.tsx` clear alpha = 1 breaks drei `<ContactShadows>`~~ — resolved in lib (`gl.setClearAlpha(0)` in
   `Stage` `onCreated`). v2 bakes its own contact shadows (closed + open pose, cross-faded) so no lib change is needed.
2. (v2, info) `Stage`'s probe flags `bridge.state.ready` as soon as the loading manager is idle — for a large GLB that is
   *before* it is parsed/mounted. Automotive works around it locally by holding one item open on
   `THREE.DefaultLoadingManager` until the car is mounted, its shadow baked and its programs compiled (`anim.ts`
   `holdReady/releaseReady`). A lib-level "scene ready" hook would let other GLB demos do the same.
