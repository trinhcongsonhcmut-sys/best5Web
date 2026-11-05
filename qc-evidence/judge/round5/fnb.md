# QC JUDGE vòng 5 — `/fnb` · Ember & Bean → Vermiglio

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo) · Skill `3d-visual-qc` đã load, checklist 1–8. Chấm theo ảnh vòng này, không neo vòng 4.
Điều kiện: dev server riêng `npx vite --port 5199 --strictPort` (DEV). **Lưu ý phương pháp:** trang Playwright MCP mặc định bị judge kia dùng chung (giữa lần chạy đầu trang bị điều hướng sang `/real-estate`), nên mọi số đo chính thức chạy trong **một Chrome riêng do script tự launch** (`browserType().launch({channel:'chrome', headless:false})`), 1440×900 DPR 1 trừ khi ghi khác. Lần chạy đầu trên trang dùng chung được giữ làm tham khảo (`fnb-run1-*`). Không dùng FPS làm bằng chứng.
Ảnh: `qc-evidence/judge/round5/shots/fnb-*.jpg` (+ `fnb-var*.png`, `fnb-glazeA-*.png`, `fnb-hv-*.png` để lấy mẫu pixel không nén). Script: `.playwright-mcp/r5_A.js`, `r5_B.js`, `r5_fnb_glaze.js`, `r5_fnb_hover.js`, `r5_fnb_latch.js`, `r5_fnb_bisect.js`.

## Điểm: **89 / 100** (vòng 4: 89) — CHƯA đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **27** | Men đĩa đen/đất nung giờ đúng màu khi đứng yên; râu vẹm thành sợi cong, sốt có vùng đậm/loang, đầu helix thuôn nhọn; còn cụm nguyên liệu xuyên vào nhau ở 75% (vẹm nuốt cà chua/tôm), đáy helix lơ lửng khi nhìn từ sau, sốt vẫn đỏ bão hòa. |
| Animation & tương tác (30) | **27** | Orbit/reset/biến thể/scroll xuôi=ngược/jump/wheel-jitter đều đúng, nhãn Gamberi trỏ đúng tôm, không leader nào cắt nhau; trừ nặng vì **hover đĩa xóa mất màu men tối** (Matte Black → taupe `#baa896`) và **hover bị "kẹt" sau khi kéo orbit** tới khi chuột nhúc nhích. |
| Bám tinh thần mẫu (20) | **17** | Nhịp B (SLOW ROAST + bão hạt) và C (nĩa → ballet + callout serif → đĩa) đúng; vẫn chưa có mì kéo xuyên section; thực phẩm stylised. |
| Thiết kế frontend (10) | **9** | Mobile 50% đĩa đã nằm gọn (x 18–300/390), 75% mobile dùng chip nhãn gọn, không tràn ngang ở 3 viewport; trừ: leader Cozze/Basilico/Pomodorini đâm xuyên qua vật khác ở góc orbit. |
| Hiệu suất & ổn định (10) | **9** | 0 console error / pageerror / HTTP ≥400 trong mọi phiên; chỉ warning `THREE.Clock deprecated`. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `fnb-orb{0,50,100}-*.jpg`, `fnb-orb75-*.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ Δyaw −6,287 rad ở 0/50/100%; `resetView()` về `[0,0.18,5.4]` / `[0.15,0.95,4.3]` / `[0,2.05,3.55]`; pitch kẹp ±1,2 | `fnb-orb*-{front,right,back,left,high,low}.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary` `#efe3d0` → `#1c1918` (r .66, cc .15) → `#b5523a` (r .50, cc .35); `plate` lerp tới `#141211` / `#9e4732` (bù sáng). Màu render đúng khi không hover (số đo bên dưới) | `fnb-glazeA-v{0,1,2}-{0,50,100}.png` |
| Hover có phản hồi | **PASS (cơ chế)** — 0%: cup/saucer; 50%: shrimp/plate; 75%: mussel/tomato/shrimp/plate; 100%: plate/mussel/shrimp/tomato, `hover.value`=1, rời ⇒ 0. Lỗi chất lượng: N1/N2 | `fnb-hov100-off.jpg` vs `fnb-hov100-0-plate.jpg` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược (pos trùng 3 chữ số, FOV lệch ≤ 0,005°); nhảy 1→0,3 hội tụ ~420 ms, đơn điệu không pop; wheel 15×900 / 10×−900 về 0 trong ~300 ms | `fnb-fwd-*.jpg`, `fnb-back-*.jpg`, `fnb-wheel-jitter-settled.jpg` |
| Không trắng/crash | **PASS** | log |
| Không sai lệch nghiêm trọng với mẫu | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Đo màu men (median RGB, 1440×900, chuột ngoài canvas, chọn biến thể ở 0% → chờ 2,2 s → cuộn, chờ 2,8 s mỗi mốc)

| Biến thể | 0% ly (thân) | 0% đĩa lót | 50% vành đĩa | 50% lòng đĩa | 100% vành đĩa | 100% lòng đĩa | 100% vành dưới |
|---|---|---|---|---|---|---|---|
| Cream | `#9e774c` (vùng bóng) | `#e4d8cb` | `#d7c4ad` | `#e5dbd0` | `#e3d8c9` | `#dccfbd` | `#e3dacd` |
| Matte Black | `#020100` L* 0,3 | `#3f3935` | `#16110e` L* 5 | `#2f2a28` L* 18 | `#15110f` L* 5 | `#0f0a08` L* 3 | `#191614` L* 7,5 |
| Terracotta | `#6c1007` | `#d37f6c` | `#b64833` h10° S56% | `#c7715f` | `#bc4f37` h11° S55% | `#b2422b` h10° S61% | `#bd5740` h11° S49% |

Đặt biến thể khi đang ở 50%/100% (thứ tự B) cho giá trị trùng tuyệt đối. Throttle CPU ×6: `plate` đạt `#1d1a19` sau 0,7 s ⇒ lerp thời gian thực đúng như builder nói.
**Kết luận:** khớp tuyên bố builder (`#191513` / `#bd5640` ≈ đo được `#191614` / `#bd5740`). Men đúng **khi không hover**.
**Nhưng:** chuột đặt trên đĩa (100%, x 300,y 490) ⇒ `hover=plate`, `rim 1.4` ⇒ vành đĩa Matte Black thành **`#baa896` (taupe, L*≈70)** — `fnb-hv-b.png` so với `fnb-hv-a.png`. Đây gần như chắc là cái vòng 4 đo được (chuột đậu trên đĩa). Thêm: sau khi kéo orbit bắt đầu trên đĩa và nhả ở ngoài, hover vẫn `plate` kể cả sau `resetView()` và cuộn sang 50%, chỉ mất khi chuột nhúc nhích (`fnb-latch-v1-50.jpg` đĩa kem/taupe dù chọn Matte Black ⇒ `fnb-latch-v1-50-nudged.jpg` đĩa đen). `fnb-var1-50.png`, `fnb-var1-100.png`, `fnb-run1-var1-*-FAIL.png` là chính lỗi này trong lượt quét tự động.

## Lỗi vòng 4 → trạng thái vòng 5

| # | Lỗi vòng 4 | Trạng thái | Bằng chứng |
|---|---|---|---|
| N1 | Men Matte Black/Terracotta bạc màu ở cảnh B | **FIXED khi đứng yên / REGRESSED-lộ ra khi hover** | Bảng đo trên; `fnb-glazeA-v1-100.png` đĩa đen thật; `fnb-hv-b.png` hover ⇒ taupe |
| N2' | Nhãn "Gamberi" trỏ vào vẹm | **FIXED** | `fnb-fwd-75.jpg`: chấm Gamberi (1115,372) nằm trên con tôm bên phải, không bị che; `fnb-orb75-right.jpg` chấm nằm trên tôm ở đáy |
| N3' | Sốt đỏ nhựa phẳng | **PARTIALLY** | `fnb-crop100-plate.jpg`: vũng sốt có mép loang không đều, vùng đậm `#a01810` ở chỗ dày, có bóng; vẫn đỏ-cam bão hòa, "giọt dầu" là các hạt đỏ tròn như hạt lựu trên mì |
| N4 | Đầu helix xòe chổi, đáy lơ lửng | **PARTIALLY** | `fnb-crop75-helix.jpg`: đỉnh thuôn nhọn thành mũi (không còn xòe) ✓; đáy chạm đĩa ở góc mặc định ✓ nhưng `fnb-orb75-back.jpg` đáy helix kết thúc giữa không trung (y≈700, đĩa y≈740) |
| N5' | Râu vẹm thành "lược" | **FIXED (cơ bản)** | `fnb-crop100-plate.jpg` (vẹm trái, x 240–290,y 415–440): chùm sợi mảnh cong, nâu tối; `fnb-crop75-helix.jpg` vẹm trên: viền sợi dưới vỏ, hơi giống "lông mi" |
| N6' | Leader chìm khi băng qua mì | **PARTIALLY** | Leader đậm hơn, đọc được trên mì (`fnb-fwd-75.jpg`), nhưng vẫn đâm xuyên vật (Cozze qua vẹm, Pomodorini qua cả helix — `fnb-orb75-back.jpg`) |
| N7' | Mobile 50% vành đĩa chạm mép | **FIXED** | `fnb-390x844-50.jpg` đĩa x 18–300 |
| N2 (cũ) | Leader cắt nhau | **FIXED** | 4 góc orbit 75% (`fnb-orb75-{front,right,back,left}.jpg`): không cặp leader nào giao nhau |
| N9 | Mì kéo xuyên section | **NOT FIXED** (builder tự nhận) | `fnb-fwd-50.jpg` → `fnb-fwd-75.jpg` vẫn crossfade |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **N1 — Hover rim xóa men tối của đĩa** — 100% (và 50%, 75%), 1440, góc mặc định, chuột trên đĩa; `fnb-hv-b.png` (Matte Black ⇒ `#baa896`), so `fnb-hv-a.png` (`#15110f`). Đĩa chiếm ~60% khung ở 100% nên người dùng gần như luôn rê trên nó ⇒ biến thể đen "không hoạt động" trong cảm nhận. **Sửa:** trong `useHoverRim` cho đĩa: rim cộng **có hệ số Fresnel** (`pow(1-dot(N,V),3)`) chỉ ở viền, cường độ ≤ 0,35 cho plate (thay 1,4), và nhân rim theo độ sáng men (`rim *= mix(0.25, 1, luminance(glaze))`) hoặc dùng rim màu ấm `#ffb070` thay cộng trắng. Nghiệm thu: hover Matte Black lòng đĩa L* < 25, viền sáng chỉ ở mép.
2. **N2 — Hover bị kẹt sau khi kéo orbit** — mọi mốc; `fnb-latch-v1-50.jpg` (hover `plate` rim 1,4 vẫn bật sau drag + reset + cuộn) → `fnb-latch-v1-50-nudged.jpg`. Trên cảm ứng (không có pointermove sau khi nhấc tay) đĩa sẽ bị rửa trắng vĩnh viễn. **Sửa:** ở `pointerup`/`pointercancel`/`pointerleave` và khi `scroll.smooth` thay đổi > 0,002 hoặc camera di chuyển: raycast lại tại vị trí con trỏ cuối (hoặc set hover = null); với `pointerType==='touch'` luôn clear hover khi nhấc tay.
3. **N3 — Nguyên liệu xuyên vào nhau ở 75%** — `fnb-fwd-75.jpg` (x 570–700,y 175–300: vẹm há chứa cà chua + tôm chồng vào; x 500–600,y 540–690 vẹm + tôm), `fnb-orb75-back.jpg` (x 1130–1270, y 130–240 và 550–650). Mẫu C mỗi nguyên liệu bay tách biệt. **Sửa:** khi sinh vị trí ballet, ràng buộc khoảng cách tâm ≥ (r1+r2)×1,15 giữa mọi cặp (rejection sampling hoặc vài vòng relax đẩy nhau), áp cho cả đường quỹ đạo 60–90%.
4. **N4 — Đáy helix lơ lửng ở góc sau** — `fnb-orb75-back.jpg`. **Sửa:** kéo dài 8% cuối các sợi theo trục −Y tới mặt đĩa (y = PLATE_Y + 0,01) và uốn tỏa thành tổ, không phụ thuộc góc nhìn.
5. **N5 — Leader xuyên vật** — `fnb-orb75-back.jpg` (Cozze qua vẹm), `fnb-orb75-right.jpg` (Basilico qua vẹm), `fnb-fwd-75.jpg` (Pomodorini qua helix). **Sửa:** khi chọn instance cho nhãn, ưu tiên instance có đoạn leader 2D không giao bbox chiếu của vật khác; nếu không có, gấp leader thành 2 đoạn (ngang rồi xiên) đi vòng mép trái helix.
6. **N6 — Sốt vẫn đỏ bão hòa, "giọt dầu" đọc như hạt lựu** — `fnb-crop100-plate.jpg`. **Sửa:** giảm saturation màu mỏng xuống `#b8461e`, giọt dầu dùng màu cam trong `#e8a050` opacity .7 dẹt (scaleY .3) thay vì cầu đỏ.
7. **N7 — Mì kéo xuyên section** (đặc trưng C) — giữ đề xuất cũ: 8–12 sợi CatmullRom từ tổ trên nĩa (50%) giãn thành helix (75%), `drawRange` theo scroll 0,45–0,62.
8. **N8 (nhỏ) — Hover saucer ở 25%** báo `hover.id=saucer` nhưng `value` 0 khi ghé lại (`r5_B` 25%). **Sửa:** cùng cơ chế pick-nearest như cup.

## Độ giống mẫu (B, C)
- B: "RICH AROMA"/"SLOW ROAST" kẹp ly, nền nâu→caramel, bão hạt sâu, hơi nước, latte art — ~85% bố cục B (`fnb-1920x1080-25.jpg` vs `B-contact.jpg`).
- C: 50% nĩa xoắn mì + tôm, nền burgundy motion-blur "from the bean to the table"; 75% "A little bit of everything." helix + callout serif nghiêng; 100% "Your table is waiting." đĩa high-angle — rất sát nhịp C.
- Lệch thật: thực phẩm vẫn stylised (mì như sợi rơm khô, sốt nhựa), nguyên liệu dính chùm, không có sợi mì liền mạch giữa section, mẫu C dùng đĩa kem — biến thể men là bổ sung của ta.
- Trung thực: bố cục/nhịp ~88%, chất liệu thực phẩm ~72%.

## Có đạt ≥ 90? — **Chưa (89).** Sửa tối thiểu:
1. N1 + N2 (hover rim Fresnel nhẹ cho men tối + clear hover sau drag/touch/scroll) → +2 (Animation 29, và đúng tinh thần "đổi màu thấy được").
2. N3 (tách nguyên liệu không xuyên nhau) → +1 (3D 28).
Làm 1 là chạm 90–91; cả hai ⇒ ~92.
