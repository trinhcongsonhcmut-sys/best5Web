# BAHA 3D SHOWCASE

Real-time 3D product showcase demos (Vite + React + React Three Fiber + GSAP ScrollTrigger). Frontend only.

Routes: `/` gallery · `/automotive` · `/beauty` · `/real-estate` · `/fashion` · `/fnb`

**Current goal (05/11/2026):** upgrade Automotive, Beauty and Real Estate to photoreal quality while keeping the v1 UI and motion; Fashion and F&B are paused. Work-in-progress — see `MASTER_STATUS.md`, `TASKS.md`, `QC_REPORT.md`.

## Run
```
npm install
npm run dev        # http://localhost:5180
npm run build && npm run preview   # production build on http://localhost:5181
```
Windows: double-click `BAHA_3D_START.cmd`.

## QC
`npx playwright test -g "<demo>"` (real Chrome, reads scene state through `window.__baha3d`); production performance: `node scripts/measure-prod.mjs`; screenshots/camera path: `node scripts/capture-baseline.mjs <demo> --tag <v>`.

## Third-party assets
See `ASSET_LICENSES.md`. The automotive car is **CarConcept © 2024 Eric Chadwick / Darmstadt Graphics Group — CC BY 4.0** (modified: paint, lights, Khronos logos removed). HDRIs, PBR textures and furniture/plant models are CC0 from Poly Haven.
