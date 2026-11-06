# BEFORE_AFTER_AUTOMOTIVE — nhật ký ảnh trước/sau (automotive-builder)

Mỗi stage nối thêm một mục. Đường dẫn tương đối từ `BAHA_3D_SHOWCASE/`.

## Stage 0 — BEFORE (05/11/2026)
- Điều kiện: dev server `npx vite --port 5195`, Chrome headless `--use-angle=d3d11`, Intel HD 530, DPR 1.
- `capture-baseline --tag v2-golden-before` ⇒ `baseline/v2-golden-before/automotive/`
  - desktop 1440×900: `desktop/scroll-000…100.jpg` (9 mốc), `desktop/orbit-000…315.jpg`, `desktop/variant-0..3.jpg`, `desktop/hover-on.jpg`
  - mobile 390×844: `mobile/scroll-000.jpg`, `scroll-050.jpg`, `scroll-100.jpg`
  - `baseline.json`: fps 73,4 (dev, đo bởi script), 0 lỗi console.
- Lỗi nhìn thấy trên BEFORE: mobile 0 % có bụi cây đứng trước camera + "đĩa cam" sau tiêu đề; trời là gradient tự vẽ; dải núi `Ridges` kiểu giấy cắt; nửa dưới xe đen; bóng blur.

## Stage 1 — khớp Blender ↔ realtime (05/11/2026)
- Realtime cùng pose, không HUD, 960×540: `contract/rt-0000.png`, `rt-0500.png`, `rt-0750.png`
- Blender preview 960×540 × 32 spp (Pearl, HDRI gốc chưa grade): `renders/preview/s1-p0000-pearl.jpg`, `s1-p0500-pearl.jpg`, `s1-p0750-pearl.jpg`
- Silhouette: `contract/mask-rt-*.png` (realtime) · `renders/match/mask-bl-*.png` (Blender) · `renders/match/mask-bl-*-diff.png` (trắng = trùng)

## Stage 2 — realtime nâng cấp (05/11/2026)
Cùng điều kiện chụp với Stage 0 (dev 5195, Chrome D3D11, HD 530, DPR 1).

| Khung | BEFORE (`baseline/v2-golden-before/automotive/`) | AFTER (`baseline/flagship/automotive/`) |
|---|---|---|
| Hero 0 % | `desktop/scroll-000.jpg` | `desktop/scroll-000.jpg` |
| .01 25 % | `desktop/scroll-025.jpg` | `desktop/scroll-025.jpg` |
| .02 50 % | `desktop/scroll-050.jpg` | `desktop/scroll-050.jpg` |
| .03 75 % | `desktop/scroll-075.jpg` | `desktop/scroll-075.jpg` |
| Fin 100 % | `desktop/scroll-100.jpg` | `desktop/scroll-100.jpg` |
| Orbit 0/90/180/270° | `desktop/orbit-000/090/180/270.jpg` | `desktop/orbit-000/090/180/270.jpg` |
| 4 biến thể | `desktop/variant-0..3.jpg` | `desktop/variant-0..3.jpg` |
| Hover | `desktop/hover-on.jpg` | `desktop/hover-on.jpg` |
| Mobile 0/50/100 % | `mobile/scroll-000/050/100.jpg` | `mobile/scroll-000/050/100.jpg` |

Realtime ↔ Cycles cùng pose (trái realtime, phải Cycles 960×540×32): `renders/match/cmp-p0000-fix.jpg`, `cmp-p0500-fix.jpg`, `cmp-p0750-fix.jpg` (ΔE2000 trung vị sơn 3,87 / 4,87 / 2,84).
Bake bóng/AO Cycles: `renders/bake/shadow-closed.png`, `shadow-open.png` ⇒ `src/demos/automotive/bake/road-shadow.png`.

## Stage 3 — still hero Cycles (05/11/2026)
- `renders/test/H1-pearl-front34-comp.jpg` · `H2-carmine-front34-comp.jpg` · `H3-pearl-rear34-comp.jpg` · `H4-pearl-shoulder-comp.jpg` (+ PNG 16-bit, bản không comp)
- Realtime ↔ still cùng pose 1920×1080: `renders/match/cmp-H1-pearl-front34-vs-realtime.jpg`, `cmp-H3-pearl-rear34-vs-realtime.jpg`
