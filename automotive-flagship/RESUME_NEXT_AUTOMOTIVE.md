# RESUME_NEXT_AUTOMOTIVE — điểm tiếp tục cho automotive-builder

Cập nhật: 05/11/2026 — sau Stage 3 (chờ giám khảo J1/J2 + Founder).

## Đã xong
- **Stage 0** — đóng băng hiện trạng:
  - `npx tsc --noEmit` ⇒ exit 0.
  - `QC_MODE=dev QC_PORT=5195 QC_ID=automotive npx playwright test -g "automotive"` ⇒ **10/10 passed** (2,2 phút) trên mã đang dở (World.tsx dùng `evening_road_01_2k.hdr` + GroundedSkybox).
  - `node scripts/capture-baseline.mjs automotive --base http://localhost:5195 --tag v2-golden-before` ⇒ `baseline/v2-golden-before/automotive/` (fps 73,4 dev, 0 lỗi).

- **Stage 1** — scene contract + khớp camera:
  - `src/demos/automotive/contract.ts` = nguồn số liệu chung (camera stops, SUN, HDRI/uOff, road/ground/shrub, lights, fog, tone); Scene/World/anim/index đọc từ đây (hành vi không đổi: tsc 0, QC 10/10 lại).
  - `node automotive-flagship/tools/make-contract.mjs` (cần dev 5195) ⇒ `contract/scene-contract.json` + `mask-rt-*.png` + `rt-*.png` + `plate.png`. Sinh từ module thật của trang + ma trận world của 117 node rig ở p = 0/0,5/0,75 + 42 instance bụi cây.
  - `blender/build_scene.py` (mode preview/mask/bake/hero) — áp ma trận node từ contract (100/100 object khớp tên), HDRI xoay −2π·uOff, năng lượng trời > cap 3,0 chuyển sang sun lamp (E = 0,666 W/m², góc 0,75°), dome GroundedSkybox, road asphalt_02, shoulder, shrub.
  - **IoU silhouette = 1,0000 / 1,0000 / 1,0000** (p 0 / 0,5 / 0,75; 64 040 / 92 647 / 99 598 px trùng từng pixel; kiểm chéo bằng sharp).
  - **Hệ số render đo thật** (Cycles CPU i5-6500T, OIDN, adaptive 0,02, 960×540×32): 31,1 / 41,7 / 44,4 s ⇒ 0,37–0,53 M px·spp/s (TB ≈ 0,43). Hero 1920×1080×128 dự kiến ≈ 10 phút.
  - Log: `renders/render-log.csv`.

- **Stage 2** — realtime trong thế giới hoàng hôn (PIPELINE §3), từng điểm:
  1. Trời = ảnh HDRI thật, chỉ grade nhẹ `contract.GRADE` (gain 1,10/1,00/0,88 · sat 1,08 · vá biển báo). Cùng công thức ở `World.tsx` (GPU) và `build_scene.py` (numpy) ⇒ kiểm 3 pixel trời: realtime = giá trị tính tay ±1/255.
  2. Bỏ `Ridges` + gradient mây tự vẽ. Fog chỉ còn ở xa (150–900 m), màu đo từ dải trời ngay trên chân trời.
  3. IBL = ảnh grade, cắt ở cap 3,0 + dải chân trời mảnh (2,4 · 1,6° · mạnh hơn phía mặt trời). Năng lượng trên cap ⇒ **directional sun đo được** (realtime 0,710 / Cycles 0,705 W/m², màu 1,47/0,93/0,29) — không còn mặt trời "3,0 cam" tự chỉnh.
  4. `NeutralToneMapping` exposure 1,0 (= Khronos PBR Neutral của Blender); fill phía camera 0,1; lốp roughness 0,82 env 1; mâm gunmetal kim loại + vành bạc; cabin env 0,35.
  5. Pearl `#d9d6d0` coat 0,025; Carmine `#b3121f` (đọc là đỏ); sơn ior 1,5 (bỏ specularIntensity 2,2).
  6. Bỏ sweep screen-space; sunRim 0,75 → 0,2 chỉ trên sơn; bỏ 160 hạt bụi vàng; hover rim mâm chỉ khi hover bánh.
  7. Bóng/AO đường **bake Cycles** 2 lần (đóng/mở, 1024² × 64 spp, 263 s + 253 s) ⇒ `src/demos/automotive/bake/road-shadow.png` (R đóng, G mở, cross-fade theo `anim.explode`); bỏ `useShadowBake` blur.
  8. Kính opacity 0,55.
  9. Post nhẹ = vignette + grain 3,5 % bằng lớp CSS trên canvas (0 ms WebGL). **Bloom bỏ** (rủi ro fps HD 530 — đúng thứ tự giảm thiểu của plan).
  10. Bụi cây: 12 cụm trên vai đường, loại mọi cụm nằm trong tầm nhìn của đường camera (51 mẫu × desktop/tablet/phone) + AO chân; mobile 0 %: hết bụi chắn, hết "đĩa cam" (camera.far 400 → 1200), xe trọn khung.
  - ΔE2000 trung vị sơn Pearl realtime ↔ Cycles: **3,87 / 4,87 / 2,84** (p 0 / 0,5 / 0,75; ≤ 6 ✓) — `tools/compare.mjs`, ảnh `renders/match/cmp-p*-fix.jpg`.
  - Dev perf (vite dev, 1440×900, DPR 1, HD 530, Chrome 156): ready 7,1 s; idle 68 fps (p95 26,6 ms); cuộn 72,8 fps (p95 13,5 ms); 119 draw call; 437 k tam giác (dome 96 → 64). File `renders/perf-dev-stage2.json`. **Chưa phải số production.**
  - QC dev **10/10**; tsc 0; `capture-baseline --tag flagship` ⇒ `baseline/flagship/automotive/` (0 lỗi).
  - Sự cố đã sửa: EXR do Blender `save()` bị mã hóa sRGB (10,0 → 2,70) làm trời Blender nhạt ⇒ ảnh float để `Non-Color` trước khi lưu. Các preview `s2-*-a/-b` và 2 bake được render trước khi sửa (bake là tỉ lệ che sáng nên sai số nhỏ; không bake lại để giữ ngân sách 2 bake).

- **Stage 3** — 4 still hero 1920×1080 × 128 spp (Cycles CPU, OIDN, Khronos PBR Neutral, glare 0,45 + vignette 0,22 trong `-comp`), `renders/test/`:
  - H1 Pearl 3/4 trước p0 — 243,7 s · H2 Carmine cùng pose — 211,5 s · H3 Pearl 3/4 sau p0,75 đèn hậu — 308,6 s · H4 Pearl vai + bánh trước 85 mm f/3,2 — 378,7 s.
  - Crop 100 %: không thấy firefly/vệt denoise; không logo (biển BAHA·GT 01).
  - So với realtime cùng pose 1920×1080: ΔE2000 trung vị sơn H1 3,68 · H3 2,61 (`renders/match/cmp-H1-…-vs-realtime.jpg`, `cmp-H3-…`).
- **Ngân sách render thực tế** (`renders/render-log.csv`): tổng 34,4 phút CPU (≤ 1,2 h) — 11 preview 960×540 (≤ 15), 2 bake, 4 hero, mọi lần < 15 phút.
- **Cuối phiên**: tsc 0 · QC dev 10/10 · perf dev (`renders/perf-dev-final.json`): ready 7,2 s, idle 64 fps, cuộn 69 fps, 119 draw call, 437 k tam giác, 0 lỗi console.

## Tiếp theo
- Giám khảo J1 (realtime, `baseline/flagship/automotive/`) + J2 (still `renders/test/*-comp.jpg`); orchestrator đo production.
- Điểm yếu đã biết: nền HDRI 2K vẫn nhòe/kéo giãn ở .03 và .02 (đất chiếu); dải chân trời phản chiếu thành "vòng" trên cửa ở H3; chữ .03 trên dải đồng cỏ khó đọc; chưa có bloom; cần gạt mưa model lộ lưới ở H4; bake bóng làm trước khi sửa lỗi EXR.
- Prerender lên web (opener / still chương / fallback): **hoãn theo PIPELINE §1 + §6** cho tới khi Founder duyệt still.
- Đề nghị thêm `automotive-flagship/renders/cache/*.exr` vào `.gitignore` (2 × 25 MB, sinh lại được).

## Lệnh
```
cd BAHA_3D_SHOWCASE
npx vite --port 5195 --strictPort            # dev server (chỉ cổng 5195)
npx tsc --noEmit
QC_MODE=dev QC_PORT=5195 QC_ID=automotive npx playwright test -g "automotive"
node scripts/capture-baseline.mjs automotive --base http://localhost:5195 --tag flagship
node automotive-flagship/tools/make-contract.mjs            # contract + mask realtime
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python automotive-flagship/blender/build_scene.py -- --root <BAHA_3D_SHOWCASE> --pose 0 --mode mask --out automotive-flagship/renders/match/mask-bl-0000
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python automotive-flagship/blender/build_scene.py -- --root <BAHA_3D_SHOWCASE> --pose 0 --mode preview --variant pearl --res 960x540 --spp 32 --out automotive-flagship/renders/preview/<name>
# bake bóng/AO (đóng = pose 0, mở = pose 0.5) rồi đóng gói cho realtime
... build_scene.py -- --root <..> --pose 0 --mode bake --res 1024x1024 --spp 64 --out automotive-flagship/renders/bake/shadow-closed
... build_scene.py -- --root <..> --pose 0.5 --mode bake --res 1024x1024 --spp 64 --out automotive-flagship/renders/bake/shadow-open
node automotive-flagship/tools/pack-shadow.mjs 1024
# so khớp realtime ↔ Cycles (ΔE2000 sơn + ảnh cạnh nhau) và đo perf dev
node automotive-flagship/tools/compare.mjs automotive-flagship/contract/rt-0000.png automotive-flagship/renders/preview/s2-p0000-pearl-fix.jpg automotive-flagship/contract/mask-rt-0000.png out.jpg
node automotive-flagship/tools/perf-dev.mjs
bash automotive-flagship/renders/test/run-heroes.sh     # 4 still hero, mỗi lần ≤ 15 phút
```
