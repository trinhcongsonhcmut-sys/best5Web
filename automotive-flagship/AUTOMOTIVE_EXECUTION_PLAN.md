# AUTOMOTIVE_EXECUTION_PLAN — Automotive flagship (Master Prompt V4)

- Tác giả: automotive-architect (Opus).
- Ngày: 05/11/2026. **Bản sửa theo quyết định của Founder cùng ngày.**
- **Mọi owner là Opus:**
  - **Builder** = `automotive-builder` (claude-opus-5-5);
  - **Judge** = `automotive-luxury-judge` (Opus);
  - Orchestrator đo production.
- Đọc kèm: `REFERENCE_MATRIX_AUTOMOTIVE.md` (hướng đã chốt) và `AUTOMOTIVE_HYBRID_PIPELINE.md` (kỹ thuật + ngân sách render).

**Phạm vi đã chốt:**
- Hoàng hôn đường đèo, mặc định Pearl White.
- Chỉ dùng CarConcept.
- Realtime là sản phẩm.
- Blender chỉ để khớp/bake/test ≤ 4 still.
- Tổng CPU render ≤ khoảng 1,2 h.

## Luật chung
- Chỉ 1 builder 3D nặng.
- Không đo FPS và không chạy QC khi Blender đang render. Mỗi lần render ≤ 15 phút.
- **Mỗi lỗi tối đa 3 lượt sửa.** Sau đó ghi "phương án phải đổi" + 2 phương án thay thế vào `RESUME_NEXT_AUTOMOTIVE.md`, rồi chờ quyết định.
- Giữ nguyên storyboard camera, 5 mốc, HUD, chuỗi reveal, cầu nối QC (`AUTOMOTIVE_VISUAL_GAP_REPORT.md` §5).
- Không sửa `src/lib/**`, test, demo khác. Không commit. Không tải gì. Không logo thương hiệu.
- **Lệnh kiểm:**
  - `npx tsc --noEmit`
  - `QC_MODE=dev QC_PORT=5195 QC_ID=automotive npx playwright test -g "automotive"` (10/10, không sửa test)
  - `node scripts/capture-baseline.mjs automotive --base http://localhost:5195 --tag flagship`

## Stage 0 — Đóng băng hiện trạng (khoảng 1 h)
- **Việc:**
  - Chạy `tsc`.
  - Chạy QC 10/10 trên mã hiện tại (vòng terrain đang dở, chưa xác nhận).
  - `capture-baseline --tag v2-golden-before`.
  - Tạo `RESUME_NEXT_AUTOMOTIVE.md`.
- **Nghiệm thu:**
  - Có log PASS/FAIL thật. Nếu FAIL thì chỉ ghi lại, chưa sửa.
  - Có ảnh BEFORE.

## Stage 1 — Scene contract + khớp camera Blender ↔ realtime (khoảng 0,5–1 ngày) ★ stage đầu tiên
- **Việc:**
  1. Sinh `contract/scene-contract.json` **từ mã realtime**: transform xe, 7 pose desktop + portrait, `SUN` + góc xoay HDRI, `FINISHES`, tone/exposure.
  2. `blender/build_scene.py` dựng cảnh test hoàng hôn tối thiểu (PIPELINE §4): CarConcept + road + world HDRI xoay theo contract + sun lamp.
  3. Render 3 preview 960×540 × 32 spp (t = 0 / 0,5 / 0,75). Ghi thời gian ⇒ hiệu chỉnh hệ số px·spp/s.
  4. Chụp realtime cùng pose, orbit = 0, cùng kích thước ⇒ tính IoU silhouette.
- **Nghiệm thu:**
  - IoU ≥ 0,97 ở 3 pose.
  - Contract sinh lại bằng 1 lệnh.
  - Có hệ số render đo thật.
  - Realtime không đổi hành vi (`tsc` + QC 10/10).

## Stage 2 — Nâng cấp realtime trong thế giới hoàng hôn (khoảng 2 ngày)
- **Việc:** 10 điểm ở PIPELINE §3:
  - trời dùng ảnh thật, bỏ `Ridges`;
  - IBL có đường chân trời sắc;
  - fill phía camera + `NeutralToneMapping`;
  - Pearl mặc định, Carmine chỉnh lại;
  - bỏ các hack shader;
  - bóng/AO đường **bake bằng Cycles** (2 bake khoảng 3 phút);
  - kính sáng hơn;
  - post nhẹ;
  - cây gom cụm và sửa mobile.
- Dùng preview Blender cùng pose làm **ảnh mục tiêu**. Tối đa 12 preview, mỗi preview 960×540.
- **Checkpoint J1 (judge):** 5 mốc × desktop/mobile, 8 góc orbit, 4 biến thể, hover. So realtime với preview Blender cùng pose và với tham chiếu.
- **Nghiệm thu:**

| Hạng mục | Tiêu chí |
|---|---|
| QC | 10/10 dev |
| Hiệu năng (production) | ≥ 55 fps idle và cuộn, p95 ≤ 22 ms |
| Lỗi | 0 lỗi console |
| Màu | ΔE2000 trung vị sơn realtime ↔ Blender ≤ 6 |
| Phản chiếu | Thấy một đường chân trời sắc trên cửa/capo Pearl ở yaw 0/90/180 |
| Nửa dưới xe | Không đen bệt: mâm và lốp có specular đọc được |
| Mobile 0 % | Không vật chắn trước xe, xe nằm trọn khung, không đĩa cam lạ |
| Giám khảo | Photoreal ≥ 25/30, bám mẫu ≥ 16/20, tổng ≥ 88 |

- **Rủi ro:**
  - Ảnh trời thật vẫn nhòe vì HDRI chỉ 2K ⇒ dùng fog/haze + bloom mặt trời; không phóng to vùng trời.
  - Post làm tụt fps ⇒ bỏ bloom trước.

## Stage 3 — Still hero test để Founder duyệt (≤ 1 h CPU)
- **Việc:**
  - Render H1–H4 (PIPELINE §5), 1920×1080 × 128 spp, mỗi ảnh ≤ 15 phút. Chỉ chụp cận ở những chi tiết CarConcept giữ được.
  - Comp nhẹ: glare trên đèn/mặt trời, vignette.
  - Xuất JPG/AVIF vào `automotive-flagship/renders/test/`.
- **Checkpoint J2 (judge):**
  - So H1–H4 với tham chiếu: chất sơn, kính, kim loại, mức luxury.
  - So H1/H3 với realtime cùng pose ⇒ liệt kê khoảng cách còn lại.
- **Nghiệm thu:**
  - Không firefly và không vệt denoise ở crop 100 %.
  - Không logo.
  - Thời gian render nằm trong log.
  - Judge nghệ thuật ≥ 88 cho bộ still.
- **Bàn giao:** Founder xem 4 still ⇒ quyết định có mở phần cinematic hay không (PIPELINE §6).

## Stage 4 — QC cuối + BEFORE/AFTER
- **Chủ:** judge. Orchestrator đo production trên máy rảnh.
- **Việc:**
  - `BEFORE_AFTER_AUTOMOTIVE.md`: v1 / v2-golden-before / flagship.
  - `QC_REPORT_AUTOMOTIVE.md`: kỹ thuật PASS/FAIL + nghệ thuật /100.
- **Nghiệm thu:**
  - Mọi mục bắt buộc PASS.
  - Điểm ≥ 90.
  - 0 lỗi mức Cao.
  - Chỉ khi đạt đủ mới báo `AUTOMOTIVE_FLAGSHIP_READY_FOR_FOUNDER_REVIEW`.
- **Nếu < 90:** quay lại Stage 2, vẫn giới hạn 3 lượt/lỗi.

## Rủi ro chính

| Rủi ro | Giảm thiểu |
|---|---|
| Trần thế giới hoàng hôn: HDRI 2K nhòe, đất chiếu bị kéo giãn (6+ vòng trước đã dừng ở 70–83) | Trời là ảnh thật; haze; tập trung vào phản chiếu sơn + tiếp xúc đất là 2 lỗi nặng nhất; bỏ các dải shader |
| Trần chi tiết CarConcept (đèn pha 288 vertex, lốp ống) | Không có cảnh cận ở các chi tiết đó; cảnh .02 giữ khoảng cách trung |
| HD 530 không gánh post | Ngân sách ≤ 3 ms, bỏ bloom trước |
| Render ăn CPU khi đang đo | Render chỉ khi không chạy QC; ghi điều kiện đo |
| API Blender 5.2 khác kiến thức cũ | Kiểm bằng `dir()`, script nhỏ |
| Pearl vẫn "trắng sữa" | Dùng ảnh mục tiêu Blender + đo ΔE; albedo `#d9d6d0`; dải sáng trên chân trời trong IBL |

## Ước tính
- Khoảng **3,5–4 ngày công** builder.
- CPU render **≤ khoảng 1,2 h** (không có đêm nào).
- 3 checkpoint judge: J1, J2, cuối.
