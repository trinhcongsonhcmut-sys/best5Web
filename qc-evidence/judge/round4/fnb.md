# QC JUDGE vòng 4 — `/fnb` · Ember & Bean → Vermiglio

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này) · Skill `3d-visual-qc` đã load, checklist 1–8. Chấm theo cái nhìn thấy ở vòng này, không neo vòng 3.
Điều kiện: dev server riêng `npx vite --port 5199 --strictPort` (DEV), Chrome qua Playwright MCP, `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác. Máy dùng chung với judge khác ⇒ **không dùng FPS làm bằng chứng nghiệm thu** (orchestrator đã đo bản production: 58–75 fps desktop).
Ảnh: `qc-evidence/judge/round4/shots/fnb-*.jpg`. Script: `.playwright-mcp/r4_fnb_A.js`, `r4_fnb_B.js` + các đoạn đo callout/màu chạy trực tiếp.

## Điểm: **89 / 100** (vòng 3: 86) — CHƯA đạt 90 (sát nút)

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **26** | Tôm giờ có đốt + quạt đuôi + râu, vẹm có ruột cam + vân, mì nest có hạt rau; nhưng men đĩa **Matte Black/Terracotta ở cảnh B vẫn sai màu rõ** (đo pixel), sốt vẫn đỏ nhựa phẳng, râu vẹm là chiếc "lược" đen cứng, đầu helix vẫn xòe như chổi. |
| Animation & tương tác (30) | **28** | Orbit/reset/biến thể/hover/scroll xuôi = ngược/nhảy/wheel-jitter đều đúng; callout không còn phụ thuộc chuột, đổi có fade, leader không chéo; trừ vì ở góc mặc định 75% nhãn **"Gamberi" chỉ vào một con vẹm** và leader mất hút khi băng qua mì. |
| Bám tinh thần mẫu (20) | **17** | Nhịp B (SLOW ROAST + bão hạt) và C (nĩa xoắn → ballet + callout serif → đĩa nhìn xuống) đúng; thực phẩm vẫn stylised, đĩa men đen/đất nung đọc như be/hồng; không có mì kéo xuyên section. |
| Thiết kế frontend (10) | **9** | Hạt không còn đè đoạn mô tả (1920/390), nĩa mobile 50% nằm gọn, hộp tối quanh "SLOW" đã bỏ; trừ: mobile 50% vành đĩa chạm mép trái. |
| Hiệu suất & ổn định (10) | **9** | 0 console error / pageerror / HTTP lỗi qua toàn bộ phiên; không thấy pop khi qua 0,5; chưa tự xác minh được "pre-compile" trên máy yên tĩnh. |

## Mục bắt buộc (không bù bằng điểm)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `fnb-orb100-back.jpg`, `fnb-orb75-right.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal −6,287` (0%), −12,57 (50%), −18,85 (100%, tích lũy); `resetView()` ⇒ `[0,0.18,5.4]` / `[0.15,0.95,4.3]` / `[0,2.05,3.55]` | `fnb-orb{0,50,100}-{front,right,back,left}.jpg`, `fnb-orb75-*.jpg` |
| Đổi màu/vật liệu | **PASS (cơ chế)** — `primary` `#efe3d0` → `#1c1918` (r .66, cc .20) → `#b5523a` (r .50, cc .50) ở 0% và 100%. Màu thật ở cảnh B **sai** — xem N1 | `fnb-var0-0..2.jpg`, `fnb-var100-0..2.jpg` |
| Hover có phản hồi | **PASS** — 0/25%: `cup`, `saucer`; 50%: `shrimp`, `plate`; 75%: `mussel`, `tomato`, `plate`; 100%: `plate`, `mussel`, `shrimp`, `tomato`; `hover.value` = 1, rời ⇒ 0 | `fnb-hov100-off.jpg` vs `fnb-hov100-0-plate.jpg` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược (lệch FOV ≤ 0,005°); nhảy 1→0,3 hội tụ ~480 ms không pop; wheel 15×900/10×−900 ⇒ về 0 ~120 ms | `fnb-fwd-*.jpg`, `fnb-back-*.jpg`, `fnb-wheel-jitter-settled.jpg` |
| Không trắng/crash | **PASS** — 0 error; warning duy nhất `THREE.Clock deprecated` | log phiên |
| Không sai lệch nghiêm trọng với mẫu | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Lỗi vòng 3 → trạng thái vòng 4

| # | Lỗi vòng 3 | Trạng thái | Bằng chứng |
|---|---|---|---|
| N1 | Thực phẩm "toy" (vẹm, tôm, húng, sốt) | **PARTIALLY** | `fnb-crop100-plate.jpg`: tôm có đốt chồng, quạt đuôi, râu mảnh — đọc được là tôm; vẹm có ruột cam viền nhăn + vân tăng trưởng nhẹ trên vỏ. Còn: râu vẹm là chùm gai đen thẳng như cái lược (x≈150–190,y≈300–335 trong crop; `fnb-crop75-bottom.jpg` đầu vẹm như đuôi cá); lá húng chỉ thấy gân giữa, gân bên/viền sáng không đọc được ở khoảng cách hero; vũng sốt vẫn đỏ bão hòa phẳng `#d00`-ish, không thấy biến thiên theo độ dày. |
| — | Mì bóng + hạt rau | **FIXED (cơ bản)** | `fnb-crop100-plate.jpg`: sợi có highlight, lấm tấm xanh |
| N2 | Callout nhảy theo chuột, leader chéo | **FIXED** (logic) / lỗi phụ mới N2' | Đo DOM 75%: chuột (5,5)/(720,450)/(200,800)/(1300,150)/(1000,700) ⇒ Cozze/Pomodorini/Spaghetti y không đổi (313/363/413), Gamberi/Basilico chỉ trôi ≤ 17 px theo vật; khi orbit chậm nhãn đổi vật có fade (opacity .55→1, .19→.9). `fnb-orb75-right.jpg`, `fnb-orb75-back.jpg`: không cặp leader nào cắt nhau. |
| N3 | Matte Black / Terracotta cảnh B sai màu | **NOT FIXED** | Đo pixel trung bình 7×7 trên vành/lòng đĩa 100%: Matte Black = `#bcaa98`–`#c7b9aa` (be-taupe sáng, L≈70%) trong khi swatch `#1c1918`; Terracotta = `#e0b9a5`–`#e3c5b6` (hồng phấn) trong khi swatch `#b5523a`. Ở 0% ly đen thật `#080402`–`#281d15`. `fnb-var100-1.jpg`, `fnb-var100-2.jpg` |
| N4 | Đầu sợi helix cắt bằng/xòe | **NOT FIXED** | `fnb-fwd-75-again.jpg` x≈760–860,y≈145–165: đỉnh helix vẫn xòe như chổi; `fnb-orb75-back.jpg` đáy helix kết thúc lơ lửng trên đĩa |
| N5 | Hạt đè chữ mô tả 25% | **FIXED** | `fnb-1920x1080-25.jpg` (khối chữ x 1257–1531,y 645–690 sạch), `fnb-390x844-25.jpg`, `fnb-fwd-25.jpg` |
| N6 | Mobile 50% nĩa cắt mép phải | **FIXED** | `fnb-390x844-50.jpg`: đầu cán nĩa x≈352 < 390. Lỗi phụ: vành đĩa trái chạm x≈0 |
| N7 | Quầng tối quanh "SLOW" | **FIXED** | `fnb-fwd-25.jpg`, `fnb-1920x1080-25.jpg` |
| N8 | Hitch khi qua ranh giới cảnh | **NOT VERIFIED** (không có pop nhìn thấy) | Máy đang tranh chấp; dựa vào số đo production của orchestrator |
| N9 | Mì kéo xuyên section | **NOT FIXED** (builder tự nhận) | `fnb-fwd-50.jpg` → `fnb-fwd-75.jpg` vẫn là crossfade |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **N1 — Men Matte Black / Terracotta ở cảnh B vẫn bạc màu** (claimed fixed, thực tế NOT FIXED) — 100%, 1440, góc mặc định; `fnb-var100-1.jpg` (đĩa taupe `#c0af9e`), `fnb-var100-2.jpg` (hồng phấn `#e2beac`). Đây là lỗi "đổi màu không đúng màu thật" — người xem chọn đen nhận đĩa be. **Sửa:** kiểm tra lại đường đi màu thực tế của đĩa cảnh B: (a) log `plateMaterial.color.getHexString()` sau `setVariant(1)` — nếu đã `#1c1918` thì nguyên nhân là ánh sáng: giảm `envMapIntensity` men đĩa về ≤ .25 khi luminance(color) < .1, giảm hemisphere/bounce light cảnh kem 50%, và **tắt sheen/clearcoat trắng** (clearcoat .2 + env cảnh kem sáng đang phủ một lớp phản xạ trắng toàn mặt do góc nhìn xuống grazing); (b) nếu đĩa có lớp "glaze overlay"/vertex color cream nhân màu thì bỏ. Mục tiêu nghiệm thu: pixel lòng đĩa Matte Black L* < 25, Terracotta hue 10–20°, S > 45%.
2. **N2' — Nhãn "Gamberi" chỉ vào con vẹm ở góc mặc định 75%** — `fnb-fwd-75.jpg`, `fnb-fwd-75-again.jpg` (dot x≈572,y≈634 nằm trên vẹm há miệng, tôm bị vẹm che chỉ lộ râu). Nhãn đúng logic (neo vào tôm) nhưng người xem đọc sai. **Sửa:** khi chọn vật cho nhãn, loại instance bị che > 50% (raycast từ camera tới anchor, nếu chạm mesh khác trước thì bỏ) hoặc dời con tôm cụm dưới ra trước vẹm (z +0,25) ở pose 75%.
3. **N3' — Sốt vẫn đỏ nhựa** — `fnb-crop100-plate.jpg` y≈280–330: vũng `#d0141a`-ish, phẳng, viền cắt gọn. **Sửa:** màu sốt nội suy `#7a1208` (dày) → `#c8401c` (mỏng/viền) theo vertex attribute độ dày, `roughness .25`, thêm normal noise mịn + vài giọt dầu cam nhạt; làm mép vũng loang không đều (noise bán kính ±15%).
4. **N4 — Đầu helix xòe chổi + đáy lơ lửng** — `fnb-fwd-75-again.jpg`, `fnb-orb75-back.jpg`. **Sửa:** taper bán kính tube → 0 trong 6% cuối, jitter độ dài ±8%, cuộn đầu sợi vào trong; đáy helix chạm tổ mì trên đĩa.
5. **N5' — Râu vẹm thành "lược"/"đuôi cá"** — `fnb-crop100-plate.jpg` (vẹm trái, gai đen thẳng song song), `fnb-crop75-bottom.jpg`. **Sửa:** râu = 15–25 sợi Tube mảnh cong ngẫu nhiên, màu nâu-olive `#4a3b22` roughness .8, dài ≤ 12% chiều dài vỏ, mọc từ khe bản lề chứ không từ mũi vỏ.
6. **N6' — Leader line chìm khi băng qua mì** — `fnb-fwd-75.jpg`: đoạn Pomodorini/Spaghetti qua vùng sợi mì gần như vô hình (nâu 60% trên nâu). **Sửa:** stroke kép (1 px `#3b1a12` + halo 3 px kem .6) hoặc dừng leader ở mép bbox vật.
7. **N7' — Mobile 50%: vành đĩa trái chạm mép** — `fnb-390x844-50.jpg` x≈0–4. **Sửa:** khi `aspect < 0.7` scale cụm cảnh B ×0,92 hoặc dịch target x −0,1.
8. **N9 — Mì kéo xuyên section** (đặc trưng C, chưa có) — giữ đề xuất vòng 3 (CatmullRom tube 8–12 sợi từ nĩa 50% xuống helix 75%, `drawRange` theo scroll 0,45–0,6).

## Độ giống mẫu (B, C)
- B: "SLOW | ROAST" kẹp ly, nền nâu → caramel, bão hạt có chiều sâu, hơi nước — ~85% bố cục B.
- C: 50% nĩa xoắn mì + tôm trên nền burgundy có motion-blur ngang ("from the bean to the table"); 75% "A little bit of everything." + helix + callout serif nghiêng với leader — rất gần C; 100% "Your table is waiting." đĩa nhìn xuống — đúng nhịp.
- Lệch thật: C là thực phẩm ướt bóng ăn được; ta vẫn stylised (sốt nhựa, râu vẹm cứng); không có sợi mì nối section; đĩa men tối/đất nung hiển thị sai màu.
- Trung thực: bố cục/nhịp ~88%, chất liệu thực phẩm ~70% (vòng 3: 65%).

## Có đạt ≥ 90? — **Chưa (89).** Sửa tối thiểu:
1. N1 (men đen/đất nung đúng màu ở cảnh B — lỗi đã báo 2 vòng) → +1–2.
2. N2' (nhãn Gamberi trỏ đúng tôm) + N6' (leader đọc được) → +1.
3. N3' + N5' (sốt theo độ dày, râu vẹm sợi) → +1.
Làm 1+2 là qua 90; cả ba ⇒ ~92.
