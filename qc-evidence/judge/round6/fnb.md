# QC JUDGE vòng 6 — `/fnb` · Ember & Bean → Vermiglio

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo) · Skill `3d-visual-qc` đã load, checklist 1–8. Chấm theo ảnh vòng này, không neo vòng 5.
Điều kiện: dev server riêng `npx vite --port 5199 --strictPort` (DEV, port trống, do tôi khởi động). Mọi số đo chạy trong **Chrome riêng do script Node tự launch** (`playwright` của repo, `channel:'chrome'`, headed, DPR 1), không dùng trang Playwright MCP chung. Viewport 1440×900 trừ khi ghi khác. Không dùng FPS làm bằng chứng.
Script (scratchpad, không nằm trong repo): `lib.js`, `sweep.js`, `fnbhover.js`, `fnbrehover.js`, `diff.js`, `warn.js`. Số liệu thô: `qc-evidence/judge/round6/fnb-sweep.json`, `fnb-viewports.json`, `fnb-hover.json`, `fnb-rehover.json`. Ảnh: `qc-evidence/judge/round6/shots/fnb-*.jpg|png`.

## Điểm: **90 / 100** (vòng 5: 89) — vừa chạm 90, chưa vững

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **27** | Ly/hạt/đĩa/mì đẹp, men đen/đất nung đúng màu cả khi hover; nguyên liệu 75% đã giãn ra nhưng vẫn còn cụm dính nhau (cà chua+tôm, vẹm+cà chua+tôm) ở góc mặc định và góc sau; sốt vẫn đỏ bão hòa, giọt dầu như hạt lựu. |
| Animation & tương tác (30) | **28** | Orbit/reset/biến thể/scroll xuôi=ngược/jump/wheel đều đúng; rim đĩa giờ mảnh và giữ men tối, hết kẹt hover; nhưng **lỗi mới**: sau cuộn hoặc kéo orbit, hover chết khi rê trong vật cho tới khi rời vật rồi vào lại; hover trên đĩa Cream gần như không thấy. |
| Bám tinh thần mẫu (20) | **17** | Nhịp B (RICH AROMA/SLOW ROAST, bão hạt, latte) và C (nĩa → ballet + callout serif → đĩa) đúng; vẫn chưa có sợi mì kéo liền giữa các section; thực phẩm stylised. |
| Thiết kế frontend (10) | **9** | 3 viewport không tràn ngang (scrollWidth = clientWidth), mobile dùng chip nhãn; trừ: leader vẫn đâm xuyên helix/vẹm ở mọi góc orbit 75%. |
| Hiệu suất & ổn định (10) | **9** | 0 console error / pageerror / HTTP ≥ 400 / requestfailed trong mọi phiên; 3 lần chuyển route heap 127 MB; chỉ còn cảnh báo `THREE.Clock deprecated`. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `fnb-orb{0,50,75,100}-*.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ Δyaw −6,287 rad ở 0/50/75/100%; `resetView()` về `[0,0.18,5.4]` / `[0.15,0.95,4.3]` / `[-3.2,1.05,3.25]` / `[0,2.05,3.55]` | `fnb-orb*-{front,right,back,left,high,low}.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary` `#efe3d0` (r .32 cc 1) → `#1c1918` (r .66 cc .15) → `#b5523a` (r .50 cc .35), giống nhau ở 0/50/100% | `fnb-var{0,1,2}-{0,50,100}.jpg` |
| Hover có phản hồi | **PASS (có điều kiện)** — cup/plate `hover.value` 1 khi vào, về 0 khi rời; nhưng xem lỗi N1 (chết sau cuộn/kéo) | `fnb-hover.json`, `fnb-rehover.json` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược (pos trùng 3 chữ số, FOV lệch ≤ 0,005°); nhảy 1→0,3 hội tụ ~420 ms đơn điệu; wheel 15×900 / 10×−900 về 0 sau ~300 ms | `fnb-fwd-*.jpg`, `fnb-back-*.jpg` |
| Không trắng/crash | **PASS** | `warn.js`: chỉ warning Clock |
| Không sai lệch nghiêm trọng với mẫu | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Đo hover rim (median RGB, 1440×900, PNG không nén, mỗi biến thể chọn ở 0% rồi cuộn; chuột ngoài canvas = OFF, chuột (320,600) trên vành đĩa = ON; ly: chuột (650,470))

| Biến thể | Vùng | OFF | ON (hover=1) | `rim` uniform |
|---|---|---|---|---|
| Cream | đĩa 100% vành trái [280–330, 470–520] | `#e3d8c9` | `#e4dacb` | 0,35 |
| Cream | đĩa 100% vành dưới | `#e3dacd` | `#e5dcce` | |
| Matte Black | đĩa 100% vành trái | `#15110f` | `#1a1411` | 0,09 |
| Matte Black | đĩa 100% vành dưới | `#191513` | `#1e1815` | |
| Matte Black | đĩa 100% lòng [560–700, 640–680] | `#1a1715` | `#201a17` | |
| Terracotta | đĩa 100% vành trái | `#bc5038` | `#be533a` | 0,14 |
| Terracotta | đĩa 100% vành dưới | `#bd563f` | `#c05a41` | |
| Cream | ly 0% thân [620–680, 440–500] | `#a98053` | `#bf9464` | 0,60 |
| Matte Black | ly 0% thân | `#030100` | `#0d0502` | 0,16 |
| Terracotta | ly 0% thân | `#791308` | `#7c200e` | 0,27 |

**Khớp số builder** (Black `#191513→#1e1815` ≈ builder `#181411→#1d1713`; Terracotta `#bd563f→#c05a41` ≈ `#bf553d→#c1583f`; ly Black `#030100→#0d0502` ≈ `#030100→#0d0501`). Rim plate đúng trần 0,35, cup 0,6, giảm theo men tối. Đĩa đen hover vẫn đen (`fnb-hv-plate100-black-on.png`).
Ảnh diff ×8 (`fnb-hvdiff-plate100-{cream,black,terra}.jpg`): thay đổi là một dải sáng mảnh ở mép trong lòng đĩa + viền ngoài, đúng mô tả "thin edge band". Số pixel đổi > 20/255: Cream 1 657 px, Black 1 485, Terracotta 950 (≈ 0,1% khung) ⇒ phản hồi có nhưng **rất yếu trên Cream** (lòng đĩa chỉ +2/255).

## Kiểm hover clear / re-hover (`fnb-hover.json`, `fnb-rehover.json`)
- Kéo orbit bắt đầu trên đĩa, nhả vẫn trên đĩa: `hover` 1 → 0,63 → … → `{value:0,id:null}` sau ~600 ms ✓. Nhả ngoài vật: null ngay ✓. Wheel khi đang hover: 0,44 sau 150 ms → null ✓. Touch tap (390×844, hasTouch) lên đĩa: hover luôn null ✓ (không rửa trắng trên cảm ứng).
- **Nhưng** sau khi bị clear, rê chuột **trong** đĩa không bật lại hover: 6 điểm khác nhau trên đĩa sau wheel ⇒ cả 6 `[null,0]`; sau drag ⇒ cả 6 `[null,0]`; ly 0% sau wheel ⇒ 3/3 `[null,0]`. Chỉ khi rời vật (60,300) rồi vào lại mới `plate 0,97`. ⇒ Fix N2 vòng 5 đã đổi "kẹt bật" thành "kẹt tắt" (N1 dưới).
- Ghi chú phương pháp: `blur`/`pointerleave`/`pointercancel` tổng hợp không kiểm được độc lập vì hover đã ở trạng thái "chết" này trước khi bắn sự kiện; đã kiểm thay bằng drag/wheel/touch thật.

## Lỗi vòng 5 → trạng thái vòng 6

| # | Lỗi vòng 5 | Trạng thái | Bằng chứng |
|---|---|---|---|
| N1 | Hover rim xóa men tối (Black ⇒ `#baa896`) | **FIXED** | Bảng đo: Black ON `#1a1411` (L* ≈ 6); `fnb-hv-plate100-black-on.png` |
| N2 | Hover kẹt sau kéo orbit / touch | **FIXED phần kẹt bật — REGRESSED thành kẹt tắt** | `fnb-hover.json` clear ✓; `fnb-rehover.json` B/C/E: rê trong vật sau cuộn/kéo ⇒ null |
| N3 | Nguyên liệu xuyên nhau ở 75% | **PARTIALLY** | `fnb-fwd-75.jpg`: phần lớn đã tách, còn cà chua dính tôm (x 580–680, y 160–240) và tôm phải + cà chua chồng (x 1160–1220, y 330–430); `fnb-orb75-back.jpg`: cụm cà chua+vẹm+tôm dính nhau (x 1110–1290, y 520–610); `fnb-orb75-right.jpg`: tôm cắm vào đầu helix (x 760–830, y 130–240) |
| N4 | Đáy helix lơ lửng góc sau | **FIXED (cơ bản)** | `fnb-orb75-back.jpg`, `-left.jpg`, `-right.jpg`: đuôi mì chạm/sát mặt đĩa ở cả 4 hướng |
| N5 | Leader xuyên vật | **NOT FIXED** (builder tự nhận) | `fnb-fwd-75.jpg` (Gamberi, Spaghetti băng qua helix), `fnb-orb75-back.jpg` (Basilico qua cả helix, Gamberi qua vẹm), `fnb-orb75-left.jpg` (Basilico/Cozze qua helix) |
| N6 | Sốt đỏ bão hòa, giọt dầu như hạt lựu | **NOT FIXED** | `fnb-fwd-100.jpg` (x 600–800, y 520–580; hạt đỏ tròn trên mì) |
| N7 | Mì kéo xuyên section | **NOT FIXED** (builder tự nhận) | `fnb-fwd-50.jpg` → `fnb-fwd-75.jpg` vẫn crossfade nĩa → helix |
| N8 | Hover saucer 25% value 0 | **FIXED** (hover saucer/cup đúng khi vào) | `fnb-hover.json` cup0 ON 1 |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **N1 — Hover "chết" sau cuộn/kéo cho tới khi rời vật** — mọi mốc (đã tái hiện 0% ly, 100% đĩa), 1440, góc mặc định. Tái hiện: rê lên đĩa (hover 1) → lăn chuột 1 nấc hoặc kéo xoay → rê khắp đĩa ⇒ `hover` mãi `{null,0}`; rời đĩa rồi vào lại mới sáng. Ở 100% đĩa chiếm ~60% khung nên người dùng cuộn tới đây gần như chắc chắn gặp. Bằng chứng: `fnb-rehover.json` (B_afterWheel_moveInside, C_afterDrag_moveInside, E_cup_afterWheel_inside). Nguyên nhân khả dĩ: reset chỉ đặt giá trị hover của ta về 0 nhưng R3F vẫn coi con trỏ "đang ở trong" mesh nên không phát `pointerover` mới. **Sửa:** dùng `onPointerMove` (không chỉ `onPointerOver`) để set lại hover khi `hoverId===null`; hoặc trong hàm reset gọi thêm `state.events.handlers.onPointerLeave?.()`/xóa `internal.hovered` rồi `events.update()` ở pointermove kế tiếp. Nghiệm thu: sau wheel/drag, rê 6 điểm trong đĩa ⇒ ≥ 5/6 `value > 0,4`.
2. **N2 — Nguyên liệu vẫn chồng nhau ở 75%** — `fnb-fwd-75.jpg`, `fnb-orb75-back.jpg`, `fnb-orb75-right.jpg` (tọa độ ở bảng trên). **Sửa:** sau bước relax 3D, thêm ràng buộc khoảng cách màn hình cho camera mặc định 75% (bán kính chiếu × 1,1) và ràng buộc tâm vật ≥ r_helix + r_vật so với trục helix; với góc sau, giảm z-spread cụm phải (cà chua/vẹm/tôm cùng y ≈ 0,6).
3. **N3 — Leader xuyên vật** — như bảng. **Sửa:** chọn instance có đoạn leader 2D không cắt bbox chiếu của helix; nếu không có, leader gấp khúc (ngang ra mép trái helix rồi xiên lên vật), hoặc ẩn leader và chỉ hiện chấm + nhãn khi bị che.
4. **N4 — Mì không kéo liền giữa section** (đặc trưng C) — `fnb-fwd-50.jpg`→`-75.jpg`. **Sửa:** 8–12 CatmullRom chung từ tổ trên nĩa (50%) nội suy điểm điều khiển sang helix (75%), `drawRange`/morph theo scroll 0,5–0,65 thay crossfade.
5. **N5 — Hover trên đĩa Cream gần như không thấy** — `fnb-hvdiff-plate100-cream.jpg` (lòng đĩa +2/255, chỉ dải mép trong đổi). **Sửa:** với men sáng thêm thay đổi nhẹ khác cộng sáng: hạ `roughness` .32→.2 + tăng clearcoat (bóng loang theo đèn) hoặc rim màu ấm đậm hơn `#e0a070` ở mép, giữ trần 0,35 cho men tối.
6. **N6 — Sốt bão hòa / giọt dầu hạt lựu** — `fnb-fwd-100.jpg`. Giữ đề xuất vòng 5 (màu mỏng `#b8461e`, giọt dầu cam trong dẹt).
7. **N7 (nhỏ) — Cán nĩa đa giác thấy rõ ở 1920×1080 50%** — `fnb-1920x1080-50.jpg` (x 1000–1480, y 50–420: mặt phẳng lớn). **Sửa:** tăng segment / smooth normals cho cán.

## Độ giống mẫu (B, C)
- B: "RICH AROMA"/"SLOW ROAST" kẹp ly, nền nâu → caramel, bão hạt có chiều sâu, hơi nước, latte art (`fnb-fwd-0.jpg`, `fnb-fwd-25.jpg` vs `B-contact.jpg` khung 3–6): ~85%.
- C: 50% nĩa xoắn mì + tôm trên nền burgundy motion-blur; 75% "A little bit of everything." helix + callout serif nghiêng; 100% "Your table is waiting." đĩa nhìn cao (`fnb-fwd-50/75/100.jpg` vs `C-contact.jpg`) — nhịp rất sát.
- Lệch thật: mẫu C có sợi mì tháo xoắn liên tục từ nĩa thành helix rồi rơi vào đĩa; ta crossfade. Thực phẩm stylised (sốt nhựa, mì như rơm), nguyên liệu C tách rời rõ, ta còn cụm dính.
- Trung thực: bố cục/nhịp ~88%, chất liệu thực phẩm ~72%.

## Có đạt ≥ 90? — **Vừa chạm (90), không có biên an toàn.** Sửa tối thiểu để vững ≥ 90:
1. N1 (re-hover sau cuộn/kéo) → Animation 29 (≈ 91).
2. N2 (tách nguyên liệu triệt để) → 3D 28 (≈ 92).
Muốn ≥ 93: thêm N4 (mì kéo liền giữa section, +1–2 bám mẫu).
