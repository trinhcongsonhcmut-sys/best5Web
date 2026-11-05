# QC JUDGE vòng 2 — `/real-estate` · HALCYON Luxury Villa

Ngày: 05/11/2026 · Giám khảo độc lập · Skill `3d-visual-qc` đã load.
Điều kiện đo: dev server riêng port 5199 (DEV), Chrome headed (Playwright MCP, tab riêng của tôi), `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác. **Builder khác chạy song song trên cùng GPU/CPU và cùng phiên trình duyệt (5198/beauty, 5198/fashion)** — FPS bị ảnh hưởng; lần chạy đầu của tôi bị tab kia điều hướng mất, đã chạy lại trên tab riêng.
Ảnh: `qc-evidence/judge/round2/shots/real-estate-*.jpg`.

## Điểm: **79 / 100** (vòng 1: 67) — CHƯA đạt 90; mục bắt buộc orbit nay **PASS**

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **23** | Kiến trúc, kính xuyên nội thất, hồ + hologram, skyline đêm thuyết phục; lá cọ nay xanh có ánh sáng; còn nội thất hộp, cụm tre uốn thành vòm chữ "A" đen ở mép trái hero, thân cọ tiền cảnh chẻ đôi khung ở nhiều góc. |
| Animation & tương tác (30) | **25** | Không còn khung đen khi orbit; yaw kẹp ±43° ở chặng cận, 360° ở 0/100%; scroll 5 chặng khôi phục chính xác; lỗi mới: nhãn hover "GLASS WALL" bị kẹt khi cuộn (không raycast lại). |
| Bám tinh thần mẫu (20) | **17** | Rail tầng phải có nền, nhãn tầng lớn + giờ, dusk→night, hồ hologram, toàn cảnh đêm — đúng cơ chế D; D có nội thất sảnh/căn hộ giàu chi tiết và dải LED dọc công trình nổi bật hơn. |
| Thiết kế frontend (10) | **8** | Rail có panel, "LEVEL 1" số lining, rào tiền cảnh đã hạ; còn chữ 50% nằm trên kính/sàn sáng, logo đè pergola ở 50%, mobile 25% cạnh mái gạch ngang phụ đề. |
| Hiệu suất & ổn định (10) | **6** | 0 error, ready lạnh 4,2 s (vòng 1: 10,5 s); nhưng 38,6 fps idle, 27,6 fps scrub, khung tệ nhất 160 ms (có tranh chấp GPU) — vẫn thấp nhất 3 demo. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `real-estate-orb0-dragDown.jpg` (mặt bằng mái/hồ từ trên) |
| Orbit 360° quan sát được | **PASS** — 0%: `yawTotal −6,29`, 4 hướng đều thấy công trình, không khung đen; 100%: 4 hướng sạch; 25/50/75%: yaw kẹp ±0,75 rad (±43°) đúng như builder mô tả; reset ⇒ `[25,6.4,38]` | `real-estate-orb0-{front,right,back,left}.jpg`, `real-estate-orb100-*.jpg`, `real-estate-orb25-drag180.jpg`, `real-estate-orb75-dragMinus180.jpg` |
| Đổi màu/vật liệu | **PASS** — `#e7dcc6` r .95 / `#4b5053` r .82 / `#c46e48` r 1,0, đổi trên ốp mặt tiền ở cả 0% và 100% | `real-estate-var0-*.jpg`, `real-estate-var100-*.jpg` |
| Hover có phản hồi | **PASS** — `roof, mass, pool, fins, glass` ở 0/25/75/100%, `hover.value` ≈ 1, có nhãn DOM, rời ⇒ 0 | `real-estate-hov0-off.jpg` vs `real-estate-hov0-0-roof.jpg` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược (`level` overview→ground→level1→rooftop→overview, `night` 0→.125→.517→.898→1); nhảy 1→0,3 hội tụ ~300 ms | `real-estate-fwd-*.jpg`, `real-estate-back-*.jpg` |
| Không trắng/crash | **PASS** | 0 console error/HTTP lỗi |
| Không sai lệch nghiêm trọng | **PASS** (tháp→villa có chủ đích, ghi trong SPEC) | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Bảng lỗi vòng 1

| # | Lỗi vòng 1 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Orbit chui vào đồi/đá, khung đen | **FIXED** | `real-estate-orb0-back.jpg`: thấy mặt sau, tre, đường; không còn khối che |
| 2 | Lá cọ đen gai | **FIXED** | `real-estate-fwd-0.jpg` góc phải trên: lá xanh có sáng; ban đêm (`orb100-*`) vẫn tối nhưng có màu |
| 3 | Hiệu năng/khởi động | **PARTIAL** | ready 4,2 s lạnh / 3,9 s ấm (trước 10,5/5,5); FPS 38,6 idle / 27,6 scrub (trước 44/38 — điều kiện khác, có tranh chấp GPU nên không kết luận là tụt) |
| 4 | Chữ đè mặt tiền 50% | **PARTIAL** | `real-estate-fwd-50.jpg`: khối chữ dời trái, đọc được, nhưng đoạn mô tả vẫn nằm trên sàn sáng + kính tầng trệt; logo HALCYON đè pergola |
| 5 | "LEVEL I" | **FIXED** | `real-estate-fwd-50.jpg`, `real-estate-390x844-50.jpg` hiện "LEVEL 1" |
| 6 | Rào tiền cảnh lấn hero | **FIXED** | `real-estate-fwd-0.jpg`: rào chỉ còn ~8% đáy; trụ đá không chắn chữ |
| 7 | Rail chìm trong cây | **FIXED** | rail có panel mờ, đọc rõ |
| 8 | Bụi/nội thất thô | **NOT FIXED** | sofa/ghế vẫn hộp (`real-estate-fwd-50.jpg`), bụi tròn topiary đơn giản |
| 9 | Mobile 0% villa nhỏ | **FIXED** | `real-estate-390x844-0.jpg`: villa ~45% chiều cao |
| 10 | Khối trắng mép trái hero | **FIXED** | không còn thấy ở `real-estate-fwd-0.jpg` |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **Nhãn hover kẹt khi cuộn — gán sai bộ phận** — để chuột yên ở (700,440) trên kính ở 0%, cuộn tới 75%: `hover.id` vẫn `glass` dù dưới chuột là hồ bơi, nhãn "GLASS WALL" hiện giữa hồ; nhích chuột 2 px ⇒ `pool` (`real-estate-stale-hover-75.jpg`, `real-estate-fwd-75.jpg`). Cùng hiện tượng ở mọi ảnh `fwd-*` (nhãn GLASS WALL giữa màn hình). **Sửa:** raycast lại mỗi frame khi `|Δcamera| > ε` hoặc khi `scroll.smooth` đổi (không chỉ trên `pointermove`); ẩn nhãn hover trong lúc camera đang bay (tốc độ > ngưỡng).
2. **Hiệu năng thấp nhất 3 demo** — 38,6 fps idle (p95 53 ms), 27,6 fps khi scrub (p95 107 ms, tệ nhất 160 ms), 35,6 fps ở 50% — đo trên tab foreground, có tranh chấp GPU. **Sửa:** `InstancedMesh` cho tre/cọ/lá + cửa sổ skyline (1 draw call mỗi loại), gộp tĩnh (`mergeGeometries`) cho khối kiến trúc theo vật liệu, `castShadow=false` cho cây và nội thất, shadow 1 directional 2048 với `autoUpdate=false` (chỉ cập nhật khi đổi `night`), DPR cap 1,25 khi fps < 45 (adaptive).
3. **Thân cọ tiền cảnh chẻ đôi khung** — ở 50% khi xoay −43° một thân cọ đen dày chạy dọc giữa khung (`real-estate-orb50-right.jpg`, `-back.jpg`, `-left.jpg`); ở 0% thân cọ cắt qua mặt tiền (`real-estate-fwd-0.jpg` x≈630). **Sửa:** fade-out (opacity → 0 theo khoảng cách camera < 6 m) cho cây tiền cảnh, hoặc dời các cây trong hành lang camera chặng 50% ra ngoài cung yaw ±43°.
4. **Cụm tre uốn thành vòm "A" đen ở mép trái hero** — `real-estate-fwd-0.jpg` x≈40–100,y≈240–360: hai thân tre cong chạm đỉnh thành hình chữ A tối, đọc như vật lạ. **Sửa:** giới hạn độ cong thân tre (bend ≤ 8°) và random hướng uốn; tăng lá ở ngọn.
5. **Chữ 50% vẫn nằm trên vùng sáng; logo đè pergola** — `real-estate-fwd-50.jpg`: "Phòng khách kính 14 m…" trên sàn sáng/kính, logo HALCYON đè lên mái pergola. **Sửa:** gradient tối trái `linear-gradient(90deg, rgba(10,14,28,.7) 0, transparent 38%)` chỉ ở chặng 50%; lùi camera chặng 50% thêm 2 m hoặc hạ target 1 m để mái nằm dưới logo.
6. **Mobile 25%: cạnh mái gạch ngang phụ đề** — `real-estate-390x844-25.jpg` x≈410–640,y≈130–160 (trong sheet): đường mái sáng chạy qua giữa dòng "Sản đá ướt phản chiếu đèn…". **Sửa:** mobile thêm nền mờ sau khối chữ (backdrop `rgba(12,16,30,.5)` + blur 6 px) hoặc hạ camera chặng 25% để mái ra khỏi 25% trên.
7. **Nội thất hộp** — sofa/ghế/bàn là hộp vuông (`real-estate-fwd-25.jpg`, `-50.jpg`). **Sửa:** RoundedBox (radius .04) cho đệm, chân mảnh trụ, thảm + đèn sàn; D cho thấy nội thất là yếu tố chính ở chặng tầng.
8. **100% kéo thấp: tường rào chiếm 1/4 khung, công trình khuất sau tre** — `real-estate-orb100-dragUp.jpg`. **Sửa:** clamp pitch tối thiểu ở chặng 100% ≥ 0 (không cho camera hạ dưới y=10 m).

## Độ giống mẫu (D)
- Cơ chế: toàn cảnh → sảnh (GROUND) → tầng nhìn xuyên kính (LEVEL 1) → hồ tầng thượng có lưới hologram (ROOFTOP) → toàn cảnh đêm, rail tầng + giờ trong ngày — khớp D ~90%.
- Hình ảnh: D là render photoreal (sàn đá bóng, đèn trần cong, rèm, nội thất phong phú); ta là stylized-clean, nội thất hộp, ánh sáng phẳng hơn — chất lượng hình ~60–65% so với D.
- Typography/UI: serif nhẹ + rail dọc phải + nhãn tầng lớn — rất sát D.

## Kết luận
79/100 — chưa đạt 90 nhưng hết lỗi bắt buộc. Bộ sửa tối thiểu để ≥ 90: **#1** (hover kẹt) +2, **#2** (≥ 50 fps idle/≥ 40 scrub cùng máy) +3, **#3 + #4** (cây tiền cảnh, vòm tre) +2, **#5 + #6** (lớp chữ) +1, **#7** (nội thất) +2.
