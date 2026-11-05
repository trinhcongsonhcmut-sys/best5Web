# TASKS — BAHA 3D SHOWCASE V2

Ký hiệu: `[x]` xong có bằng chứng · `[~]` đang làm · `[ ]` chưa · `[!]` BLOCKED (ghi nguyên nhân)

## T0 · Môi trường & skill
- [x] Đọc spec, lưu `MASTER_PROMPT.md`
- [x] Ralph Loop active (state file + Stop hook)
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
- [ ] Bổ sung nguồn Instagram Reels/TikTok/YouTube/Behance/Dribbble/GitHub (Agent 01 chưa làm — ưu tiên thấp)
- [x] Founder xác nhận cách xem Pinterest: "Đồng ý" (04/11/2026)

## T2 · Framework
- [x] scroll (GSAP ScrollTrigger scrub) · CameraRig · rim hover · variant store · HUD · gallery · 5 route
- [x] QC harness (`tests/qc`) + cầu nối `window.__baha3d` — 10/10 trên placeholder
- [x] Đo FPS có điều kiện (ghi GPU/browser/viewport)

## T3 · Dựng demo (mỗi demo: model thật, ≥5 mốc timeline, orbit, ≥3 biến thể, hover, scroll)
> Mỗi demo có `src/demos/<id>/SPEC.md` (đặc tả từ mẫu đã quan sát) + `BUILDER_BRIEF.md` (hợp đồng chung).
- [~] D1 Beauty — hũ kem thủy tinh + lá lô hội + nguyên liệu quỹ đạo (A1/A2) — builder opus đang chạy
- [~] D2 F&B — **đã dựng** (cafe + restaurant, mì shader, 30 sợi 1 geometry); chờ giám khảo; việc còn: lá húng phẳng, vẹm đôi khi thành khối đen, HUD mobile đè vật, nhãn callout chồng mesh ở 75%
- [~] D3 Real Estate — **đã dựng** (biệt thự HALCYON 3 tầng); chờ giám khảo; việc còn: **tối ưu hiệu năng (FPS ~30, ready 12–19 s)**, cọ đen/gai, rào tiền cảnh, chữ chồng kính ở ~50%, nhãn "LEVEL I" bị cắt
- [~] D4 Fashion — áo phao nylon 3D + nền gradient đổi colorway (E2) — builder opus đang chạy
- [~] D5 Automotive — **đã dựng** (AXIOM T1, exploded 3 lớp, đèn hậu); chờ giám khảo; việc còn: hông phẳng/cabin giống sedan/phản chiếu thép nhẹ/mobile 25% xe sát mép + chạm stage-dots
- [x] Script quay video thật `scripts/record-demo.mjs` (CDP screencast + ffmpeg hệ thống; chưa chạy thử)
- [ ] Gallery đánh bóng (frontend-design + Impeccable)

## T4 · QC (mỗi demo, bằng trình duyệt thật)
- [ ] QC A hình ảnh 1920×1080, 1440×900, 390×844 so với mẫu (overlay/diff khi có ảnh phù hợp)
- [ ] QC B animation 0/25/50/75/100, xuôi + ngược
- [ ] QC C tương tác thật (orbit/đổi màu/hover/scroll/resize/cảm ứng)
- [ ] QC D hiệu suất & lỗi (FPS có điều kiện, WebGL/console/asset, rò rỉ khi chuyển route)
- [ ] QC E giám khảo khó tính ≥ 90/100 mỗi demo (Agent 05, không tự chấm code của mình)

## T5 · Bàn giao
- [ ] 5 video demo 20–40s (tương tác thật)
- [ ] Screenshot trạng thái chính
- [ ] `QC_REPORT.md` đầy đủ + danh sách lỗi còn lại
- [ ] `ASSET_LICENSES.md` hoàn chỉnh
- [ ] `BAHA_3D_START.cmd` thử chạy thật từ thư mục sạch
