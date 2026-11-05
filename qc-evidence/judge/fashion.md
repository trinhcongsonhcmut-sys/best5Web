# QC JUDGE (Agent 05) — `/fashion` · CUMULUS 01 (Fashion 3D)

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này).
Skill `3d-visual-qc`: **đã load**, checklist 1–8 áp dụng bên dưới.
Điều kiện đo: dev server riêng `npx vite --port 5198 --strictPort` (DEV), Chrome qua Playwright MCP, GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, viewport 1440×900 (trừ khi ghi khác; có thanh cuộn dọc ~15 px).
Ảnh của tôi: `qc-evidence/judge/shots/fashion-*.jpg` · Script tái lập: `qc-evidence/judge/scripts/judge_fashion.js`.
Ảnh builder đã xem: toàn bộ 22 ảnh `qc-evidence/shots/fashion/*.jpg`. Mẫu đã xem: `reference/shots/E1-contact.jpg`, `E2-contact.jpg`.

## Điểm: **81 / 100** — CHƯA đạt mục tiêu 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **24** | Áo phao procedural thuyết phục ở trước/sau (baffle, khóa kéo răng, cúc bấm, patch, dây rút, bo gấu gân); nhưng ở macro 75% bề mặt có vệt loang/lồi lõm như nhựa chảy, lòng cổ/gấu/cổ tay là hốc đen, nhìn ngang tay áo thành “con sâu” xếp chồng. |
| Animation & tương tác (30) | **25** | Orbit 360°/reset/scroll xuôi-ngược/jitter chuẩn, hover thấy rõ; nhưng đổi colourway chỉ tween màu (không trượt/dissolve như spec + E2) và nền trễ sau áo. |
| Bám tinh thần mẫu (20) | **16** | Áo lơ lửng giữa khung + nền bão hòa đổi theo 4 colourway + bóng elip đúng E2; thiếu “áo kế tiếp” 3D ở góc dưới-phải và chuyển cảnh áo bay ra/vào. |
| Thiết kế frontend (10) | **7** | Typography editorial mạnh, bố cục bất đối xứng tốt; nhưng tay áo đè bảng thông số ở ~25–30%, danh sách 75% nằm trên áo thiếu tương phản, mobile thước tiến độ đè áo. |
| Hiệu suất & ổn định (10) | **9** | 0 console error/pageerror/request fail; rAF ~66 fps idle và ~66 khi scrub; warm ready 2,2 s; cold 11,2 s (DEV). (Ảnh perf headless của builder ghi 28 fps — điều kiện khác, cần đo lại trên build.) |

## Lỗi bắt buộc sửa (không bù bằng điểm)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mô hình 3D tương tác thật | **PASS** | `judge/shots/fashion-orbit-right.jpg`, `fashion-orbit-back.jpg`, `fashion-orbit-low.jpg` (nhìn từ trên vào cổ áo) |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal = −6,287`; pitch ±1,2 rad; `resetView()` ⇒ `[0,−0.32,5.7]` đúng gốc | `fashion-orbit-front/right/back/left/full360.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary`: `#ec6a17` (r .30, cc .60) → `#272523` (r .32, cc .55) → `#c3c9ce` (r .40, cc .32) → `#b30b0e` (r .29, cc .62); nền shader WebGL đổi cam/than/bạc/đỏ; áo rail đổi theo | `fashion-variant-0..3.jpg`, builder `variant-0..3.jpg` |
| Hover có phản hồi | **PASS** — `hover.value 0,9997`, rim 1,50; rời ⇒ 0; highlight viền baffle thấy rõ | `fashion-hover-0-jacket.jpg` vs `fashion-hover-off.jpg`; builder `hover-on.jpg` |
| Scroll mượt / khôi phục | **PASS** — camera 0/25/50/75/100 xuôi = ngược (FOV lệch ≤ 0,004°); jitter 0→1→0,3 hội tụ trơn ~300 ms không pop | `fashion-scroll-fwd-*.jpg`, `fashion-scroll-back-*.jpg`, `fashion-jitter-settled-30.jpg` |
| Không trắng/crash | **PASS** — 0 error; chỉ warning `THREE.Clock deprecated` | log phiên đo |
| Không sai lệch nghiêm trọng với mẫu | **PASS** (sai lệch vừa, xem dưới) | — |
| Không dùng ảnh/video giả 3D | **PASS** | `fashion-orbit-at100-low.jpg` |

## Danh sách lỗi (xếp theo mức nghiêm trọng)

1. **Bề mặt nylon ở macro 75% bị loang lổ/“nhựa chảy”** — 1440×900 & 1920×1080, 75%: normal/crinkle tần số thấp tạo vệt sáng-tối dạng mảng lớn, baffle trông lồi lõm méo (`judge/shots/fashion-orbit-at75-back.jpg` toàn khung, `fashion-1920x1080-75.jpg` các baffle giữa, builder `timeline-75.jpg`). Spec 75% là mốc “texture nylon” — đây là khung trưng bày chất liệu nên lỗi rất lộ.
   **Sửa:** tách crinkle thành 2 lớp: normalMap nếp nhăn tần số cao (tile 6–8 lần/baffle, `normalScale 0.25`) + bỏ/giảm mạnh nhiễu displacement tần số thấp (biên độ ≤ 0,15 hiện tại); thêm `clearcoatNormalMap` mịn riêng để highlight ciré liền mạch; kiểm bằng ảnh 75% không còn mảng sáng > 60 px vô hình dạng.
2. **Đổi colourway không có chuyển cảnh, nền trễ sau áo** — `setVariant(1)` ở 0%: tại 120 ms áo đã nâu (`#613422`) trong khi nền vẫn cam (`judge/shots/fashion-variant-transition-120ms.jpg`); không có áo trượt ra/vào. Spec: “Chuyển có trượt/dissolve mượt”; E2: áo cũ bay lên-trái thu nhỏ + mờ, áo mới phóng từ thumbnail (`reference/shots/E2-contact.jpg` khung 3).
   **Sửa:** timeline 0,8 s: (a) 0–0,35 s áo hiện tại translate (−0,6, +0,4), scale 1→0,4, opacity/dissolve noise 1→0; (b) đồng thời nền tween cùng easing `power2.inOut` 0,7 s (cùng một tiến độ với vật liệu); (c) 0,3–0,8 s áo mới từ vị trí thumbnail góc dưới-phải scale 0,35→1. Dùng cùng mesh hai material clone để tránh tạo geometry mới.
3. **Thiếu “áo kế tiếp” 3D ở góc dưới-phải (E2)** — ta chỉ có pill DOM “NEXT — CARBON” với chấm màu (`qc-evidence/shots/fashion/timeline-0.jpg`); E2 có một áo nhỏ màu kế tiếp ở x≈90%, y≈82% mọi khung.
   **Sửa:** render bản sao áo (cùng geometry, material màu kế tiếp, scale 0,3, xoay chậm) bằng drei `<View>`/scissor hoặc đặt thẳng trong scene ở góc dưới-phải (neo theo viewport), click = next; đây cũng là điểm xuất phát của chuyển cảnh #2.
4. **Va chạm chữ – áo ở 25–30% và 75%** — 1440×900 ~30%: tay áo phải đè chữ “FILL / SHELL / WEIGHT” của bảng thông số (`judge/shots/fashion-jitter-settled-30.jpg` x≈890–920); 75%: danh sách “Ciré finish / Box stitch / Two-way zip” nằm trên mặt áo cam, chữ “Box stitch” và “Two-way zip” bị tay áo chạm, tương phản thấp (`qc-evidence/shots/fashion/timeline-75.jpg`, `judge/shots/fashion-orbit-at75-right.jpg`); cổ áo trồi lên dưới logo header “BAHA Atelier” (`judge/shots/fashion-1920x1080-75.jpg`).
   **Sửa:** ở 0,22–0,35 dời target camera thêm −0,25 x hoặc khối chữ sang `left: 62vw`; ở 75% đặt danh sách trong panel nền `rgba(0,0,0,.28)` + blur 8 px hoặc dời ra mép trái ≤ 22vw và giảm FOV/dolly để áo bắt đầu từ x ≥ 26vw; hạ `target.y` 0,12 để cổ không chạm header (đỉnh cổ ≥ 72 px).
5. **Hốc đen ở cổ/gấu/cổ tay khi orbit** — nhìn từ trên/dưới: lòng cổ đen đặc, gấu áo và cổ tay có đáy đen (`judge/shots/fashion-orbit-low.jpg`, `fashion-orbit-high.jpg`, `fashion-orbit-at75-low.jpg`, `fashion-orbit-at100-low.jpg`).
   **Sửa:** thêm lớp lót (BackSide, `MeshStandardMaterial` màu lót `#2a2a2a`→ theo colourway tối 60%, roughness .8) + nắp ellipse tối mờ bên trong thân ở độ sâu 0,15 để không thấy xuyên; hoặc giới hạn pitch [−0,45, +0,5] rad.
6. **Nhìn ngang: tay áo như chuỗi xúc xích, thân mỏng hình hộp** — 0% yaw 90° và 50% yaw 90°: tay áo là các khoang tròn chồng đều không có khuỷu/độ rủ, cổ tay chìa ra trước (`judge/shots/fashion-orbit-right.jpg`, `fashion-orbit-at50-right.jpg`).
   **Sửa:** CatmullRom của tay có khuỷu 12–18° và hơi đổ ra trước 8°, bán kính baffle giảm dần 15% về cổ tay, nén baffle ở mặt trong khuỷu (×0,7), thêm nhiễu nếp nhỏ ở khuỷu.
7. **Mobile 390×844: thước tiến độ đè áo và chữ** — thước 0–100 nằm trên áo ở 0/25/50/75/100% và đè “CUMULUS” (`qc-evidence/shots/fashion/390x844-0.jpg`, `judge/shots/fashion-390x844-25.jpg`, `fashion-390x844-75.jpg`); ở 75% ba nhãn chi tiết chạm cổ áo.
   **Sửa:** `vw < 600`: ẩn thước dọc (hoặc thu thành 5 chấm 4 px sát mép `right: 6px`), dịch nhãn 75% lên `top` cố định trên panel tối.
8. **Rail E1 khi orbit lên/xuống cắt qua chữ hero** — pitch âm: dây treo chéo qua “LOOK 01” và hai áo rail chồng lên “Weightless,” (`judge/shots/fashion-orbit-high.jpg`).
   **Sửa:** fade rail theo `|pitch| > 0.25` hoặc `renderOrder`/layer để rail không vẽ trên vùng chữ (đặt chữ trên canvas là được — kiểm z-index của khối hero).

## Độ giống mẫu (so contact sheet E2, E1)
- **Vị trí/tỉ lệ hero:** E2 áo ≈23% rộng, 47% cao, tâm (43%,52%); ta 0% áo ≈37% rộng, 50% cao, tâm (50%,48%) — **to hơn và ở giữa** thay vì lệch trái; vẫn đúng tinh thần “áo lơ lửng giữa khối màu”.
- **Góc camera:** E2 chính diện nhìn xuống 3–6°; ta 0% `pos [0,−0.32,5.7]` ⇒ nhìn **lên** ≈3,5° (góc thấp nhẹ — đúng SPEC “góc thấp nhẹ”, khác E2 nhẹ).
- **Màu:** 4 colourway đo được rất sát E2: cam `#ec6a17` (E2 `#e8691a`), than `#272523` (`#2b2a28`), bạc `#c3c9ce` (`#b8bec4`), đỏ `#b30b0e` (`#a80102`); nền đổi đồng bộ, chữ than trên nền bạc ✓ (khắc phục điểm yếu tương phản của E2).
- **Vật liệu:** highlight cứng dọc baffle kiểu ciré ✓ (E2 cam/đỏ bóng); bạc satin mờ hơn ✓.
- **Typography:** E2 Montserrat Medium trắng; ta grotesk extended đậm + serif italic condensed — khác font nhưng hợp SPEC “editorial”.
- **Cơ chế chuyển động:** E2 = đổi áo bằng trượt/scale từ thumbnail — **không có**; bob lơ lửng + bóng co giãn ✓; scroll turntable (25% 3/4, 50% lưng, 75% macro, 100% 3/4 lưng) đúng storyboard SPEC.
- **E1:** rail ngang + áo treo móc mờ ở 0% ✓ (chỉ mượn đúng như SPEC), không có coverflow — chấp nhận được.
- **Phân lớp:** từ CUMULUS sau áo ✓, bóng elip dưới áo ✓.

## Kết luận
**81/100 — chưa đạt ≥90.** Bộ sửa tối thiểu: **#1** bề mặt nylon macro sạch (≈+3), **#2 + #3** chuyển colourway trượt/dissolve + áo kế tiếp 3D (≈+5), **#4 + #7** va chạm chữ desktop/mobile (≈+2), **#5** lót trong cổ/gấu (≈+1). Mục 6, 8 là đánh bóng.
