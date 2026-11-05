# QC JUDGE vòng 3 — `/fnb` · Ember & Bean → Vermiglio

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này) · Skill `3d-visual-qc` đã load, checklist 1–8 áp dụng. Chấm theo cái nhìn thấy ở vòng này, không neo điểm vòng 2.
Điều kiện đo: dev server riêng `npx vite --port 5199 --strictPort` (DEV, không phải build), Chrome qua Playwright MCP, GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác. **Các agent khác dùng cùng GPU/CPU cùng lúc** — mọi số FPS/thời gian bên dưới KHÔNG mang tính quyết định (orchestrator sẽ đo lại trên máy yên tĩnh, bản production).
Ảnh: `qc-evidence/judge/round3/shots/fnb-*.jpg`. Script: `.playwright-mcp/r3_fnb_A.js`, `r3_fnb_B.js`.

## Điểm: **86 / 100** (vòng 2: 84) — CHƯA đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **26** | Vũng sốt giờ mượt, bóng, liền khối; ly/đĩa sạch, không lộ mặt dưới; còn: vẹm là vỏ elip trơn bóng như đồ chơi, đầu sợi helix cắt bằng xòe chổi, men "Matte Black" ở cảnh B ra taupe, đĩa terracotta ra hồng phấn. |
| Animation & tương tác (30) | **27** | Orbit/reset/biến thể/scroll xuôi = ngược đều đúng; elevation bị kẹp (không còn nhìn gầm); callout cột ngoài + leader line; trừ vì nhãn nhảy nhóm 205 px theo vị trí chuột và các leader line cắt chéo nhau khi orbit ở 75%. |
| Bám tinh thần mẫu (20) | **17** | 25% B (SLOW ROAST + bão hạt quanh ly), 50% "nĩa xoắn mì", 75% ballet + callout serif, 100% đĩa nhìn xuống — sát C về bố cục; vẫn thiếu sợi mì kéo xuyên ranh giới section, thực phẩm đọc là stylised/toy chứ không "ăn được" như C. |
| Thiết kế frontend (10) | **8** | Mobile giờ sạch (chip row, đĩa 100% vừa khung); trừ: hạt cà phê đè chữ mô tả ở 25% (1920 và 390), nĩa bị cắt mép phải ở mobile 50%, quầng tối hình chữ nhật quanh chữ "SLOW". |
| Hiệu suất & ổn định (10) | **8** | 0 console error/pageerror/HTTP lỗi; nhưng scrub đo 20,9 fps, khung tệ nhất 947 ms (tranh chấp GPU nặng, không quyết định) — cần orchestrator xác nhận không có hitch khi chuyển cảnh. |

## Mục bắt buộc (không bù bằng điểm)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `fnb-orb0-dragDown.jpg` (latte art nhìn từ trên), `fnb-orb100-*.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal −6,287` (0%), −12,57 (50%), −18,85 (100%) (tích lũy); `resetView()` ⇒ `[0,0.18,5.4]` / `[0.15,0.95,4.3]` / `[0,2.05,3.55]` đúng pose mốc | `fnb-orb{0,50,100}-{front,right,back,left}.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary` `#efe3d0` (r .32, cc 1) → `#221e1c` (r .62, cc .25) → `#b5523a` (r .48, cc .60), giống nhau ở 0% và 100% | `fnb-var0-0..2.jpg`, `fnb-var100-0..2.jpg` |
| Hover có phản hồi | **PASS** — 0%/25%: `cup`, `saucer`; 50%: `shrimp`, `plate`; 75%: `mussel`, `shrimp`, `tomato`, `plate`; 100%: `plate`, `mussel`, `shrimp`, `tomato`; `hover.value` = 1, rời ⇒ 0 ở mọi mốc | `fnb-hov0-off.jpg` vs `fnb-hov0-0-cup.jpg`; `fnb-hov100-off.jpg` vs `fnb-hov100-0-plate.jpg` |
| Scroll mượt / khôi phục | **PASS** — camera 0/25/50/75/100 xuôi = ngược (lệch FOV ≤ 0,008°); nhảy 1→0,3 hội tụ trong ~420 ms không pop; wheel 15×900 rồi 10×−900 ⇒ về 0 trong ~250 ms | `fnb-fwd-*.jpg`, `fnb-back-*.jpg`, `fnb-wheel-jitter-settled.jpg` |
| Không trắng/crash | **PASS** — 0 error, 1 warning (`THREE.Clock`) | log phiên |
| Không sai lệch nghiêm trọng | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Lỗi vòng 2 → trạng thái vòng 3

| # | Lỗi vòng 2 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Callout 75% bị che / đè mì; mobile đọc không được | **FIXED** (desktop mặc định + mobile) / còn lỗi phụ mới (N2) | `fnb-fwd-75.jpg`: 5 nhãn trong cột trái x≈285–480 có nền kem, leader line tới chấm trên vật; `fnb-390x844-75.jpg`: hàng chip Gamberi/Cozze/Pomodorini/Basilico/Spaghetti dưới đĩa, không đè helix |
| 2 | Vũng sốt răng cưa, không bóng | **FIXED** (hình) / PARTIAL (chất) | `fnb-fwd-100.jpg` x≈600–800,y≈500–575: vũng đỏ mượt liền, có highlight; màu đỏ bão hòa phẳng `#d00`-ish, vẫn đọc như nhựa đỏ hơn là sốt cà |
| 3 | Pitch chui dưới đĩa, mặt dưới nâu tối | **FIXED** | kéo lên tối đa ⇒ camera y = 0,18 (0%), 0,87 (50%), 0,31 (100%); `fnb-orb100-dragUp.jpg` nhìn ngang mép đĩa, không thấy gầm; `fnb-orb0-dragUp.jpg` ly bình thường. (Ghi chú: `orbit.pitch` trong bridge vẫn báo ±1,2 — kẹp xảy ra ở tầng camera; nên đồng bộ số liệu) |
| 4 | Mobile 100% đĩa bị cắt | **FIXED** | `fnb-390x844-100.jpg`: đĩa nằm trọn, cách mép ~12 px |
| 5 | Hiệu năng khi cuộn | **NOT VERIFIED / có dấu hiệu xấu** | scrub 20,9 fps, p95 80 ms, worst 947 ms (tranh chấp GPU nặng hơn vòng 2) — không kết luận được |
| 6 | 25%: hạt che lòng ly + chữ mô tả | **PARTIAL** | ly sạch hoàn toàn (`fnb-fwd-25.jpg`); nhưng hạt vẫn nằm trên dòng "Hương caramel, cacao và cam đường" ở 1920 (`fnb-1920x1080-25.jpg` x≈1260–1420,y≈640–690) và 390 (`fnb-390x844-25.jpg` x≈205,y≈660) |
| 7 | Hạt cam phát sáng | **FIXED** (cơ bản) | `fnb-fwd-0.jpg` crop vùng trên: hạt nâu đỏ có rim cam nhẹ, không còn viên "thuốc" sáng |
| 8 | "Matte Black" ở cảnh B ra taupe | **NOT FIXED** | `fnb-var100-1.jpg`: đĩa màu be-xám ~#a99d90 dù `primary.color = #221e1c`; ở 0% đĩa lót cũng xám nâu (`fnb-var0-1.jpg`) trong khi ly đen thật |
| 9 | Helix quá đều, đầu sợi xòe chổi | **PARTIAL** | `fnb-fwd-75.jpg` x≈740–870,y≈135–160: đầu trên cắt bằng xòe như lược; `fnb-orb75-back.jpg` đầu dưới lơ lửng cắt phẳng (x≈1590,y≈390 trong sheet) |
| — | Vẹm thô | **NOT FIXED** | `fnb-fwd-100.jpg` crop: vỏ elip đen-chrome trơn, không vân/gờ; con vẹm phía sau lơ lửng trên mì (x≈665,y≈270) |
| — | Mì kéo dài xuyên section | **NOT FIXED** (builder tự nhận) | `fnb-fwd-50.jpg`, `fnb-back-50.jpg`: cảnh A→B là crossfade, không có sợi mì nối |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **N1 — Vật liệu thực phẩm vẫn "toy" (vẹm, tôm, húng, sốt)** — 100%, 1440, góc mặc định (`fnb-fwd-100.jpg`; crop vùng đĩa). Vỏ vẹm elip trơn phản chiếu chrome; ruột vẹm là khối cam phẳng; tôm là ống tròn không đốt; lá húng là mặt phẳng xanh đồng màu. **Sửa:** vỏ vẹm = Lathe/Extrude tiết diện giọt nước có `normalMap` vân tăng trưởng đồng tâm (canvas texture 512, 20–30 vòng sin), `color #1d2230`, `roughness .35`, `sheen .4 sheenColor #4a5a7a`, mép vỏ thêm dải nâu-tím; tôm = TubeGeometry dọc spline với 6 đốt (scale bán kính theo `1−0.15·|sin(6πt)|`), vertex color cam→trắng ở bụng; húng = Shape lá có gân giữa (displacement theo khoảng cách tới trục) + `transmission .2`; sốt: thêm `normalMap` noise mịn và màu thay đổi `#a0180f → #c8321c` theo độ dày.
2. **N2 — Callout 75% nhảy nhóm và leader line cắt chéo** — 1440, 75%: nhãn "Gamberi" ở y = 363 khi chuột ở (5,5) nhưng y = 568 khi chuột ở (720,450) (đo DOM; `fnb-fwd-75.jpg` vs `fnb-hov75-off.jpg`, `fnb-callout-mouse-200-800.jpg`) — parallax chuột đổi thứ tự nhãn. Khi orbit 90°/180° (`fnb-orb75-right.jpg`, `fnb-orb75-back.jpg`) các line Basilico/Gamberi cắt nhau và line Gamberi băng ngang cả helix ~450 px. **Sửa:** gán slot cột cố định theo thứ tự `y` của anchor có hysteresis (chỉ đổi slot khi chênh > 40 px trong > 300 ms), sắp nhãn theo thứ tự y của anchor để line không chéo; chọn cột trái/phải theo dấu x của anchor so với tâm helix (nhãn phải cho vật bên phải); ẩn (opacity .2) line dài > 45% bề ngang viewport.
3. **N3 — "Matte Black" / "Terracotta" ở cảnh B sai màu** — `fnb-var100-1.jpg` (taupe), `fnb-var100-2.jpg` (hồng phấn thay vì đất nung như `fnb-var0-2.jpg`). **Sửa:** ở cảnh kem, nhân `envMapIntensity` men đĩa theo độ sáng màu (đen ≤ .35, terracotta ≤ .6), giảm cường độ hemisphere/bounce light ở mặt đĩa (bounce light mới đang làm bạc màu tối), kiểm tra `toneMappingExposure` cảnh B ≤ 1,0.
4. **N4 — Đầu sợi helix cắt bằng/xòe** — `fnb-fwd-75.jpg` (đỉnh), `fnb-orb75-back.jpg` (đáy lơ lửng). **Sửa:** taper bán kính tube về 0 trong 6% cuối mỗi sợi, uốn đầu sợi vào trong (offset theo pháp tuyến helix), jitter độ dài sợi ±8% để đầu không thẳng hàng; neo đầu dưới vào tổ mì trên đĩa.
5. **N5 — Hạt cà phê đè chữ mô tả ở 25%** — `fnb-1920x1080-25.jpg`, `fnb-390x844-25.jpg`. **Sửa:** mở rộng vùng loại trừ hạt (đã có cho ly) sang bbox DOM của đoạn mô tả + 24 px, dùng project từng instance mỗi khi resize/scroll pha 25%.
6. **N6 — Mobile 50%: nĩa bị cắt mép phải** — `fnb-390x844-50.jpg` x≈372: cán nĩa chạm/tràn mép. **Sửa:** khi `aspect < 0.7` dịch target x +0,25 hoặc xoay yaw nĩa thêm −12° để cán nằm trong 92% bề ngang.
7. **N7 — Quầng tối chữ nhật quanh "SLOW"** — `fnb-fwd-25.jpg` x≈205–485,y≈395–500. **Sửa:** bỏ nền/backdrop của khối chữ hoặc dùng `text-shadow` mềm (0 0 40px rgba(0,0,0,.25)) thay vì hộp.
8. **N8 — Hitch khi scrub (cần xác nhận)** — rAF worst 947 ms khi wheel 50×140 px qua ranh giới cảnh A→B. **Sửa nếu orchestrator xác nhận:** `renderer.compileAsync(sceneB)` lúc idle sau ready, giữ cả hai cảnh mounted (visible=false) thay vì mount khi qua 0,5.
9. **N9 — Mì kéo xuyên section** (đặc trưng C, chưa có). **Sửa:** một CatmullRom tube 8–12 sợi nối từ nĩa (50%) xuống helix (75%) với `drawRange` theo scroll 0,45–0,6.

## Độ giống mẫu (B, C)
- B: "RICH | AROMA" / "SLOW | ROAST" kẹp hai bên ly, nền nâu → caramel, bão hạt có chiều sâu ở 25% — ~85% giống bố cục B; ly sạch không bị hạt che (tốt hơn vòng 2).
- C: 50% nĩa xoắn mì + tôm trên nền đỏ burgundy với motion-blur ngang — sát frame "LOVE AT FIRST TWIRL"; 75% "A little bit of everything." + helix + callout serif nghiêng ở cột trái có leader line — rất gần C (C cũng dùng nhãn nghiêng với line mảnh); 100% "Your table is waiting." + đĩa nhìn xuống — đúng, đĩa ~64% bề ngang (C ~85%).
- Khác biệt: C là render ảnh thực phẩm ướt bóng; ta là stylised (vẹm chrome, tôm ống, húng phẳng). Không có mì kéo xuyên section.
- Trung thực: bố cục/nhịp ~88%; chất liệu thực phẩm ~65%.

## Có đạt ≥ 90 không? — **Chưa (86).** Sửa tối thiểu:
1. N1 (vẹm/tôm/húng/sốt ra chất thật) → +2–3 (3D + mẫu).
2. N2 + N4 (callout ổn định không chéo; đầu sợi helix) → +1–2.
3. N3 + N5 + N6 (màu men cảnh B, hạt khỏi chữ, nĩa mobile) → +1–2.
Cộng với xác nhận không hitch (N8) trên máy yên tĩnh ⇒ ~90–92.
