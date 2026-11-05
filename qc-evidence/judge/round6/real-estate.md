# QC JUDGE vòng 6: `/real-estate` · HALCYON Luxury Villa

Ngày 05/11/2026. Giám khảo độc lập, không viết code demo này. Đã load skill `3d-visual-qc` và áp checklist 1–8. Đã đọc MASTER_PROMPT phần VI, VII, IX, `SPEC.md`, `D-analysis.md`, PALETTES, xem `D-contact.jpg` và báo cáo vòng 5. Chấm theo những gì thấy ở vòng này, không neo vào điểm vòng 5 (89).

## Điều kiện đo
- **Server:** dev server riêng `npx vite --port 5197 --strictPort`. Port 5198 đang bị PID 16436 (node) chiếm sẵn, không phải tiến trình của tôi; 5199 là của judge kia. Đã tắt server của mình sau khi đo.
- **Trình duyệt:** Chrome riêng (thư viện Playwright 1.64, `channel: chrome`, headless, `--use-angle=d3d11`, GPU *Intel HD Graphics 530 D3D11*). Mỗi phép đo chạy trong một context riêng, 1440×900, DPR 1, trừ khi ghi khác.
- **Không có pointer:** context mới, không có sự kiện chuột nào, chỉ gọi `scrollTo` qua bridge. Làm ở cả 1440 và 1920.
- **Draw call:** init script bọc `drawElements/Arrays(+Instanced)/drawRangeElements`, đếm theo từng rAF, tức số đếm thật ở tầng GL.
- **Cảm ứng:** context `devices['iPhone 13']` (390×664, DPR 3, `hasTouch`, `isMobile`). Tap bằng CDP `Input.dispatchTouchEvent` (touchStart, đợi 60 ms, touchEnd). Dùng MutationObserver trên `.re-hover[data-part]` và đọc opacity computed của card. Tọa độ các bộ phận lấy từ một lượt quét chuột riêng cùng kích thước viewport.
- Script đo nằm ở scratchpad (`j6fr/re_gen.js`, `re_touch.js`). FPS không dùng làm bằng chứng (orchestrator đo bản production: 60,1 fps khi cuộn).

## Điểm: **91 / 100**, đạt ngưỡng

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **26** | Nội thất 50% ấm rõ hơn: trần sáng ấm, vũng sáng tường, đèn vòng. Mặt sau/bên đã có tấm teak, dải LED đứng ở tháp thang và cửa sổ sáng ấm. Vẫn trừ: nội thất be phẳng, không có phản chiếu sàn, khó nhận ra rèm. Cây low-poly. Ban đêm 100% thiếu bloom/LED để đạt độ "điện ảnh". |
| Animation & tương tác (30) | **29** | Tap cảm ứng đã chạy (nhãn hiện sau khoảng 125 ms, giữ tới khoảng 2,13 s, tap chỗ trống thì xóa). Vuốt ngang xoay, vuốt dọc cuộn. Scroll xuôi = ngược (lệch ≤ 0,004). Hover 5 bộ phận. Trừ: nhãn chạm bị cắt hoặc ra hẳn ngoài màn hình khi tap ở nửa phải màn hình mobile. |
| Bám tinh thần mẫu (20) | **17** | Đủ chuỗi D: toàn cảnh → GROUND → LEVEL 1 → ROOFTOP có hologram → đêm, có rail và giờ. Chất hình vẫn stylized-clean, cách xa render photoreal D (sảnh đá bóng, đèn thả hữu cơ, rèm voan, LED vàng dọc tháp). |
| Thiết kế frontend (10) | **9** | Ở 390@0% biệt thự không còn chạm mép. Không tràn ngang (0 px ở 1920/390). Trừ: nhãn chạm tràn khỏi viewport trên mobile; trên desktop nhãn có thể đè lên rail (`real-estate-hov75-mass.jpg`). |
| Hiệu suất & ổn định (10) | **10** | 0 console error / pageerror / HTTP ≥ 400. Warning `PCFSoftShadowMap` **đã hết**, chỉ còn deprecation `THREE.Clock`. Draw call: idle 54–55, khi cuộn trung bình 64,7, p95 99, đỉnh 135. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `real-estate-orb{0,50,100}-sheet.jpg` (nhìn từ trên thấy hồ, sàn teak, pergola) |
| Xoay 360° | **PASS** | q = 271 px/90°. 4 lần kéo cho `yawTotal` −6,287 ở 0% và −12,570 ở 100% (cộng dồn từ −6,283). Ở 50% bị kẹp ±0,75 rad, đúng thiết kế chặng cận. Pitch ±1,2. Reset về đúng [25; 6,4; 38], [0,4; 7; 29,5], [−31; 17,5; 37]. |
| Đổi vật liệu | **PASS** (bấm `.re-picker` ở 0/50/100%) | travertine `#e7dcc6` r .95; basalt `#4b5053` r .82; terracotta `#c46e48` r 1,0. Giống nhau ở 3 mốc. Ảnh: `real-estate-var-sheet.jpg` |
| Hover phản hồi | **PASS** | Ở 0%: roof, mass, fins, glass đều v = 1,00 và có nhãn. Ở 75%: thêm pool. Rời chuột về null/0. Cuộn thì nhãn xóa ngay ("roof" → ""). Ảnh: `real-estate-hov0-{roof,mass,fins,glass}.jpg`, `hov75-{pool,glass,fins,roof,mass}.jpg`, `hov0-scrolling.jpg` |
| Scroll mượt, khôi phục được | **PASS** | Camera và FOV ở 0/.25/.5/.75 xuôi và ngược lệch tối đa 0,0026–0,0043. Nhảy 1 → 0,3 hội tụ trong khoảng 590 ms, không vọt quá. Wheel 15×900 xuống, 20×900 lên trả về s = 0, camera đúng gốc. Ảnh: `real-estate-scroll-sheet.jpg` |
| Không trắng/crash; không dùng ảnh thay 3D | **PASS** | 0 lỗi |

## Kiểm các điểm builder tuyên bố

| Tuyên bố | Kết luận | Bằng chứng |
|---|---|---|
| iPhone 13: tap lên bộ phận hiện nhãn, sau khoảng 1,15 s vẫn còn, tự xóa khoảng 2,6 s; tap chỗ trống thì xóa | **ĐÚNG** (thời điểm xóa đo được sớm hơn lời builder) | 8/8 tap (roof, mass, fins, glass ở 0% và 50%): `data-part` được đặt sau 119–137 ms; ở 600, 1150 và 1800 ms card opacity = 1; `data-part` xóa ở **2122–2155 ms**. Lúc 2300 ms nhãn đã mất, nên "khoảng 2,6 s" là thời điểm fade xong chứ không phải thời điểm xóa. Tap trời (195,120) sau khi tap roof: "roof" → "". Vuốt ngang 220 px: yaw 0 → 1,276. Vuốt dọc 350 px: scroll 0 → 0,063. Ảnh: `real-estate-touch-sheet.jpg` |
| Nội thất 50% ấm hơn (trần sáng ấm, vũng sáng mạnh hơn, 3 rèm; chưa có phản chiếu sàn) | **PHẦN LỚN ĐÚNG** | `real-estate-nopointer-50.jpg`: trần LEVEL 1 và tầng trệt sáng ấm, vũng sáng trên tường sau, đèn vòng trần. **Rèm khó nhận ra** ở khoảng cách này (chỉ thấy một tấm sáng ở tầng 2, x khoảng 860–960). Sàn không phản chiếu (builder đã tự nhận). |
| Giảm bão hòa cọ/tre | **ĐÚNG (nhẹ)** | `real-estate-orb0-sheet.jpg`: lá xanh sẫm hơn, bớt chói. Hình khối vẫn low-poly. |
| Cụm tre phía đông dời ra, vùng ẩn nới để phủ cánh thấp | **PHẦN LỚN ĐÚNG** | `real-estate-orb0-left.jpg`: cụm tre x 990–1145 đứng **cạnh** cánh thấp (mép cánh x khoảng 1000), chỉ chạm mép khoảng 10 px, không che kính. `orb0-right.jpg` và `orb0-back.jpg` sạch. |
| Lam teak và LED strip ở mặt sau/bên | **ĐÚNG** | `real-estate-orb0-back.jpg`: tấm teak đứng ở tầng 1 và tầng trệt, dải LED dọc tháp thang, cửa sổ sáng ấm. `orb100-right.jpg`, `orb100-back.jpg`: ban đêm thấy cửa sổ sáng. |
| Mobile 0% không còn chạm mép | **ĐÚNG** | `real-estate-390-sheet.jpg`, 390@0: mép phải biệt thự ở khoảng x 344 trên 390 |
| Hết warning PCFSoft | **ĐÚNG** | console chỉ có `THREE.Clock` deprecation |
| Giữ fix cũ: không có hover ma trước khi có pointer; draw call khoảng 55 idle / 66 trung bình | **ĐÚNG** | Không có pointer, ở 1440 và 1920, 0/.25/.5/.75/1: `hover = {0, null}`, `data-part = ""` (`real-estate-nopointer-{0,25,50,75,100}.jpg`). Draw call idle 55/55/54/55/55; khi cuộn wheel 60×150 trung bình 64,7. |

## Bảng lỗi vòng 5

| # | Lỗi vòng 5 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Tap cảm ứng: nhãn bị xóa sau khoảng 2 ms | **FIXED** | `re_touch.json`, `real-estate-touch-sheet.jpg` |
| 2 | Nội thất chưa ấm như D | **PARTIALLY** (ấm rõ hơn; chưa có phản chiếu sàn, rèm khó thấy) | `real-estate-nopointer-50.jpg`, `real-estate-1920-sheet.jpg` |
| 3 | Cây low-poly, tre bão hòa; tre chưa xét cánh thấp | **PARTIALLY** (bão hòa giảm, tre không còn che kính; vẫn low-poly, vẫn chạm mép khoảng 10 px) | `real-estate-orb0-left.jpg` |
| 4 | Mặt bên/sau là khối đá trơn | **PARTIALLY → phần lớn FIXED** (teak, LED, cửa sáng; cửa sổ vẫn là ô phẳng không có khung sâu) | `real-estate-orb0-back.jpg` |
| 5a | 390@0% chạm mép | **FIXED** | `real-estate-390x844-0.jpg` |
| 5b | Không auto-orbit | **NOT FIXED (có chủ đích)** | — |
| 5c | Warning PCFSoftShadowMap | **FIXED** | console |

## Lỗi mới / còn mở (xếp theo mức nghiêm trọng)

**1. Nhãn chạm (và nhãn hover sát mép) không được giữ trong viewport** (iPhone 13 390×664, mọi mốc; tap ở x > khoảng 230)
- **Bằng chứng:**
  - `real-estate-touch50-glass.jpg`: tap ở (270,410), card "GLASS WALL – Kính sàn-trần, …" bị cắt ở mép phải.
  - `real-estate-touch0-mass.jpg`: "Khối ốp đá mặt tiề…" bị cắt.
  - `real-estate-touch50-fins.jpg`: tap ở (370,460), `data-part = fins` nhưng card nằm **hoàn toàn ngoài màn hình**.
  - Desktop: `real-estate-hov75-mass.jpg`, card đè lên panel rail.
- **Sửa (`Villa.tsx` `setHover` hoặc trong Hud):**
  - Sau khi đặt `data-part`, đo `card.getBoundingClientRect()`.
  - `x = clamp(x, 12, innerWidth − w − 12)`. Nếu `x + 16 + w > innerWidth`, lật card sang trái con trỏ (`translateX(-100%) - 16px`).
  - Tương tự cho y.
  - Trên desktop, thêm vùng cấm là rect của `.re-rail` (lật trái khi giao nhau).

**2. Nội thất 50% vẫn là "hộp be" phẳng, chưa có phản chiếu sàn và rèm rõ ràng** (50%, 1440 và 1920)
- **Bằng chứng:** `real-estate-nopointer-50.jpg`, `real-estate-1920x1080-50.jpg`. So D frame LEVEL 34: sàn bóng phản chiếu đèn vòng, rèm voan trắng lượn sóng ở hai mép kính.
- **Sửa:**
  - Thêm `MeshReflectorMaterial` 256 px chỉ cho sàn LEVEL 1 (mixStrength .35, roughness .2, blur [200,60]), bật khi `0.4 < p < 0.62` để giữ draw call.
  - Rèm: 2 tấm `PlaneGeometry(1.2, 3, 24, 1)` lượn sin (biên độ 0,06), màu `#f3e6d2`, opacity .55, emissive .25 ở hai đầu kính LEVEL 1, sao cho thấy rõ ở khung 50%.
  - Sofa/bàn: bo cạnh `RoundedBoxGeometry` r 0,04 để không còn khối hộp.

**3. Ban đêm 100% thiếu "điểm nhấn điện ảnh" của D** (100%, `real-estate-fwd-100.jpg`, `orb100-sheet.jpg`)
- **Sửa:**
  - Bloom có chọn lọc (`luminanceThreshold` .85, intensity .5) cho LED và cửa sổ.
  - Dải LED vàng `#e8c98a` chạy dọc 2 cạnh khối chính và mép sàn cantilever (D: "dải đèn vàng chạy dọc tháp").
  - Mặt nước hồ thêm halo cyan nhẹ.

**4. Hover pool làm nước bạc trắng như băng** (75%, `real-estate-hov75-pool.jpg`)
- **Sửa:** với pool, rim/emissive nên tăng cyan (`#7fe3ff`) và giảm tint trắng. Mục tiêu: giữ hue nước (H khoảng 190°) và chỉ tăng độ sáng 20–30%.

**5. Nhỏ**
- Ở 0% high-angle, cột đèn đường đứng ngay giữa khung (`real-estate-orb0-high.jpg`). Có thể fade cột đèn theo occluder như tre.
- Ở 0% góc phải, thân cọ cắt ngang góc phải biệt thự (`real-estate-orb0-right.jpg`).
- Khi chuột đứng yên trên canvas, mỗi lần cuộn xong nhãn lại tự bật dưới con trỏ (`real-estate-fwd-25.jpg`: "STONE MASS"). Hành vi này có chủ đích nhưng khá ồn. Nên chỉ re-pick nếu pointer đã di chuyển sau lần cuộn.
- Không có auto-orbit (có chủ đích).

## Độ giống mẫu (D)
- **Cơ chế:** khoảng 90%. Đủ chuỗi hoàng hôn → GROUND → LEVEL 1 xuyên kính → ROOFTOP có wireframe hologram → toàn cảnh đêm có skyline, rail tầng và giờ (18:05 → 21:40).
- **Hình ảnh:** khoảng 65% (vòng 5: 62–65%). Nội thất ấm hơn, mặt sau có teak và LED nên đẹp ở nhiều góc hơn. Nhưng vẫn stylized-clean so với render photoreal của D (đá bóng, đèn thả hữu cơ, rèm voan, LED dọc tháp, bloom đêm).
- **Typography/UI:** sát D: serif mảnh, rail dọc có panel, nhãn "LEVEL 1" lớn kèm giờ, picker vật liệu dạng pill.

## Có đạt ≥ 90 không? Sửa tối thiểu
**Đạt (91).** Tất cả lỗi bắt buộc của vòng 5 đã đóng; lỗi tap cảm ứng đã sửa và được kiểm bằng sự kiện touch CDP. Để giữ vững trên 90:
1. Lỗi #1, clamp/lật nhãn trong viewport. Bắt buộc với mobile (+0,5 Animation, +0,5 Frontend).
2. Lỗi #2, sàn phản chiếu và rèm thấy rõ ở LEVEL 1 (+1 3D, +1 bám mẫu).
3. Lỗi #3, bloom và LED đêm ở 100% (+1 bám mẫu).
