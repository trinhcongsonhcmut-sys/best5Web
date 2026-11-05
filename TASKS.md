# TASKS — BAHA 3D SHOWCASE V2

Ký hiệu: `[x]` xong có bằng chứng · `[~]` đang làm · `[ ]` chưa · `[!]` BLOCKED (ghi nguyên nhân) · `[⏸]` tạm dừng theo `CURRENT_GOAL.md` · `[–]` không còn hiệu lực

> **Mục tiêu hiện hành: `../CURRENT_GOAL.md`** (Founder xác nhận 05/11/2026). Phần "Việc hiện hành" dưới đây là danh sách đang có hiệu lực; các phần T0–T5 phía dưới là **lịch sử giai đoạn v1** (giữ nguyên, chỉ chú thích trạng thái).

## Việc hiện hành — V2 photoreal (Automotive · Beauty · Real Estate)
- [x] Bảo toàn v1: branch `showcase/baseline-v1` + tag `showcase-v1-baseline`; gói `baseline/v1/<id>/` (ảnh, `baseline.json`, `MOTION_SPEC.md`, video)
- [x] Mẫu chuẩn hình ảnh v2 nhận từ Founder (`reference/v2/`, local); kế hoạch `ASSET_SWAP_PLAN.md`; brief `V2_BUILDER_BRIEF.md`
- [x] Founder duyệt + đã tải tài sản: CarConcept.glb (CC-BY 4.0), 3 HDRI CC0, 5 bộ texture CC0 (`ASSET_LICENSES.md`)
- [~] V2 automotive: thay xe procedural bằng CarConcept (trắng ngọc, hoàng hôn đường đèo, gỡ logo Khronos, ghi công CC-BY) — **lượt 1 xong**: "AXIOM GT", `CarConcept.baha.glb` 9,0 MB do `tools/build-car.mjs` tạo (gỡ logo, proxy raycast, WebP), QC dev 10/10, pixel cháy ≤ 0,02 %, FPS dev 51,7/55,1 khi máy bận; ảnh `baseline/v2/automotive/`. Orchestrator xem ảnh: hero đã ra xe thật; **sơn còn hơi lì, khung toàn tông nâu cam thiếu tương phản, cảnh tách lớp .02 rối** ⇒ **lượt 2 xong**: sơn pearl bóng (clearcoatRoughness 0,012, IOR 1,8), trời vàng đậm chân trời → tối dần, núi tím-xanh có mù, nhựa đường tối bóng; .02 bỏ xoay clamshell, các lớp dời theo trục và mở lần lượt (không xuyên khối ở 3 góc); "AS…" là normal map họa tiết khung (đã làm nhạt); QC dev 10/10; pixel cháy ≤ 0,04 %. Builder phát hiện script chụp để con trỏ trên xe (ảnh scroll v1/v2 ở trạng thái hover) ⇒ đã sửa `capture-baseline.mjs` (đặt con trỏ ở góc trống)
- [~] V2 beauty: chai serum hổ phách dropper + lát cam + nước bắn (dựng bằng code, HDRI studio) — **lượt 1 xong** (QC dev 10/10, pixel cháy ≤ 0,05 %, FPS dev 61,7/56,8 khi máy bận; ảnh `baseline/v2/beauty/`). Orchestrator xem ảnh: chai/nhãn/ống nhỏ giọt đạt, **lát cam còn kiểu minh họa, nước bắn giống ống thủy tinh** ⇒ **lượt 2 xong**: ruột cam vẽ theo từng tép + giả SSS + vỏ có lỗ dầu, miếng múi, lát mờ tiền/hậu cảnh, nước đứt thành giọt + chùm bắn, mốc 50 % đủ 5 callout, 62,5 % bầu bóp trong khung; QC dev 10/10; FPS dev 65/73; pixel cháy ≤ 0,06 %. Orchestrator xem ảnh 0 %: tốt hơn rõ, vạch màng múi trắng vẫn hơi đều — chờ giám khảo
- [~] V2 real-estate: biệt thự 2 tầng mái bằng, texture PBR thật, bãi cỏ, HDRI chạng vạng — **lượt 1 xong**: kiến trúc dựng lại sát mẫu (sàn đua 2,2 m, trụ đá, ốp gỗ, kính, garage), texture CC0 1K WebP (`scripts/make-textures.mjs`), 90k ngọn cỏ, ~40 draw call, QC dev 10/10, pixel cháy ≤ 0,12 %; FPS dev 29–46 khi máy bận (production chưa đo); có sự cố builder làm trống `node_modules/.vite` (đã tự khắc phục). Orchestrator xem ảnh: kiến trúc đạt; **trời xám hồng thiếu nắng vàng, cây như thẻ phẳng, cỏ sọc rõ kiểu game, nội thất trắng phẳng** ⇒ **lượt 2 xong**: trời gradient hoàng hôn + quầng sáng sau nhà, nắng thấp ấm, cây lùi xa có mù khí quyển, cỏ trầm sọc nhẹ, nội thất 2700K ấm; QC dev 10/10; draw call 40–41; pixel cháy 0 %; FPS dev 39–61 (GPU dùng chung). Orchestrator xem ảnh 0 %: tốt hơn rõ; cây vẫn hơi "thẻ" — chờ giám khảo
- [ ] Chụp v2 cùng khung v1 (`capture-baseline.mjs --tag v2`) + ghép ảnh so sánh trước/sau cho 3 demo
- [ ] QC 10/10 mỗi demo (dev) + `measure-prod.mjs` bản production trên máy rảnh (≥ 55 fps cuộn)
- [ ] Giám khảo độc lập chấm v2 (chuẩn hình ảnh = mẫu v2, chuẩn chuyển động = v1), mục tiêu ≥ 90
- [ ] Quay lại 3 video v2 (`record-demo.mjs`), commit tiến độ vào `showcase/v2-photoreal`
- [ ] Mẫu/tài sản mới khác từ Founder (nếu có) — **chỉ thay khi Founder cung cấp/phê duyệt**
- [ ] Kiểm thử trên điện thoại thật (mobile hiện chỉ giả lập) — cần thiết bị/Founder

> **05/11/2026 (chiều): Founder đã DỪNG builder Real Estate (đang thêm model CC0 nội thất/bụi cây, dừng ở bước "props component") và builder Automotive (đang chuyển nền sang HDRI địa hình `evening_road_01_2k.hdr`).** Mã của hai demo có thể đang dở; chưa kiểm tsc/QC sau khi dừng (lệnh kiểm cũng bị dừng). Beauty lượt 4 đã xong trước đó (QC 10/10). Điểm giám khảo gần nhất: beauty 83 (trước lượt 4) · automotive 73 · real-estate 68. Không tự khởi động lại — chờ Founder. **Founder: "Dừng hẳn"** — toàn bộ công việc v2 dừng; đã tắt mọi dev/preview server của showcase. Khi tiếp tục: kiểm `tsc` + QC cho automotive và real-estate trước tiên (mã có thể dở dang), rồi commit tiến độ vào `showcase/v2-photoreal`.

## Tạm dừng (theo CURRENT_GOAL.md)
- [⏸] Fashion và F&B: không nâng cấp tiếp. Lưu ý trạng thái: vòng sửa 7 bị dừng giữa chừng, mã dở dang nằm trong `showcase/baseline-v1`; `tsc`/build qua nhưng **bộ QC chưa chạy lại** trên mã đó. Điểm giám khảo cuối (vòng 6, trên mã trước vòng 7): fnb 90 · fashion 90.

---
# Lịch sử giai đoạn v1 (04–05/11/2026)

## T0 · Môi trường & skill
- [x] Đọc spec, lưu `MASTER_PROMPT.md`
- [–] Ralph Loop active (state file + Stop hook) — hook chưa từng nạp lại prompt; **đã hủy 05/11/2026** theo lệnh Founder
- [x] Three.js skills ×13 cài, đã đọc nguồn
- [x] Playwright MCP + Chrome DevTools MCP hiện diện
- [x] Tạo skill nội bộ `reference-3d-reconstruction`, `3d-visual-qc` (`.claude/skills/`)
- [x] 2 skill nội bộ đã được phiên nhận diện (xuất hiện trong danh sách skill)
- [ ] Gọi thử thật 2 skill nội bộ bằng Skill tool khi dùng lần đầu (Agent 05 / vòng sau)
- [x] Impeccable v4.8.0 cài (đã đọc nguồn, `--no-hooks`, phạm vi dự án) — `/impeccable init` chưa chạy
- [!] Superpowers + Skill Creator plugin: lệnh `/plugin install` chỉ chạy trong UI Claude Code — cần Founder

## T1 · Nghiên cứu tham khảo
- [x] Agent 01: 8 link → `REFERENCE_INDEX.md`, `reference/<id>-analysis.md`, `reference/PALETTES.md` (shots không commit)
- [x] `RECONSTRUCTION_MATRIX.md` điền phần Quan sát/Kỹ thuật (cột Tương đồng/Kiểm thử điền sau QC)
- [x] Không link nào UNVERIFIED; nhưng cả 8 là video ⇒ hover/scroll ngược "not observable" (đã ghi)
- [–] Bổ sung nguồn Instagram Reels/TikTok/YouTube/Behance/Dribbble/GitHub — không còn cần: chuẩn hình ảnh nay là mẫu v2 của Founder
- [x] Founder xác nhận cách xem Pinterest: "Đồng ý" (04/11/2026)

## T2 · Framework
- [x] scroll (GSAP ScrollTrigger scrub) · CameraRig · rim hover · variant store · HUD · gallery · 5 route
- [x] QC harness (`tests/qc`) + cầu nối `window.__baha3d` — 10/10 trên placeholder
- [x] Đo FPS có điều kiện (ghi GPU/browser/viewport)

## T3 · Dựng demo (mỗi demo: model thật, ≥5 mốc timeline, orbit, ≥3 biến thể, hover, scroll)
> Kết quả v1 cuối cùng (giám khảo vòng 6): beauty 92 · real-estate 91 · fnb 90 · fashion 90 · automotive 88. Các dòng `[~]` dưới đây là trạng thái lịch sử; việc hiện hành ở phần "V2" phía trên.
> Mỗi demo có `src/demos/<id>/SPEC.md` (đặc tả từ mẫu đã quan sát) + `BUILDER_BRIEF.md` (hợp đồng chung).
- [~] D1 Beauty — hũ kem thủy tinh + lá lô hội + nguyên liệu quỹ đạo (A1/A2) — builder opus đang chạy
- [~] D2 F&B — **đã dựng** (cafe + restaurant, mì shader, 30 sợi 1 geometry); chờ giám khảo; việc còn: lá húng phẳng, vẹm đôi khi thành khối đen, HUD mobile đè vật, nhãn callout chồng mesh ở 75%
- [~] D3 Real Estate — **đã dựng** (biệt thự HALCYON 3 tầng); chờ giám khảo; việc còn: **tối ưu hiệu năng (FPS ~30, ready 12–19 s)**, cọ đen/gai, rào tiền cảnh, chữ chồng kính ở ~50%, nhãn "LEVEL I" bị cắt
- [~] D4 Fashion — áo phao nylon 3D + nền gradient đổi colorway (E2) — builder opus đang chạy
- [~] D5 Automotive — **đã dựng** (AXIOM T1, exploded 3 lớp, đèn hậu); chờ giám khảo; việc còn: hông phẳng/cabin giống sedan/phản chiếu thép nhẹ/mobile 25% xe sát mép + chạm stage-dots
- [x] Script quay video thật `scripts/record-demo.mjs` (CDP screencast + ffmpeg hệ thống; chưa chạy thử)
- [–] Gallery đánh bóng (frontend-design + Impeccable) — ngoài phạm vi CURRENT_GOAL (chỉ làm nếu Founder yêu cầu)

## T4 · QC (mỗi demo, bằng trình duyệt thật)
> v1: các mục QC A–E đã được thực hiện qua 6 vòng giám khảo (xem `QC_REPORT.md`); với v2 làm lại cho 3 demo (xem phần V2).
- [ ] QC A hình ảnh 1920×1080, 1440×900, 390×844 so với mẫu (overlay/diff khi có ảnh phù hợp)
- [ ] QC B animation 0/25/50/75/100, xuôi + ngược
- [ ] QC C tương tác thật (orbit/đổi màu/hover/scroll/resize/cảm ứng)
- [ ] QC D hiệu suất & lỗi (FPS có điều kiện, WebGL/console/asset, rò rỉ khi chuyển route)
- [ ] QC E giám khảo khó tính ≥ 90/100 mỗi demo (Agent 05, không tự chấm code của mình)

## T5 · Bàn giao
- [–] 5 video demo 20–40s — thay bằng 3 video (Automotive, Beauty, Real Estate); video v1 của 3 demo đã có trong `baseline/v1/`, video v2 nằm ở phần V2
- [ ] Screenshot trạng thái chính
- [ ] `QC_REPORT.md` đầy đủ + danh sách lỗi còn lại
- [ ] `ASSET_LICENSES.md` hoàn chỉnh
- [ ] `BAHA_3D_START.cmd` thử chạy thật từ thư mục sạch
