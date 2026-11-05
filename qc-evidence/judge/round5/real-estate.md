# QC JUDGE vòng 5: `/real-estate` · HALCYON Luxury Villa

Ngày 05/11/2026. Giám khảo độc lập, không viết code demo này. Đã load skill `3d-visual-qc` và áp checklist 1–8. Đã đọc MASTER_PROMPT phần VI, VII, IX, `SPEC.md`, `D-analysis.md`, PALETTES, xem `D-contact.jpg` và báo cáo vòng 4. Điểm chấm theo những gì thấy ở vòng này, không neo vào điểm vòng 4 (85).

## Điều kiện đo
- **Server:** dev server riêng `npx vite --port 5197 --strictPort`. Port 5198 đang bị PID 16436 (node) chiếm sẵn, không phải tiến trình của tôi. Đã tắt server của mình sau khi đo.
- **Trình duyệt:** Chrome qua Playwright MCP. Mỗi phép đo chạy trong một `browser.newContext()` riêng, viewport 1440×900, DPR 1, trừ khi ghi khác.
- **Draw call:** init script bọc `drawElements`, `drawArrays`, `*Instanced` và `drawRangeElements`, đếm theo từng rAF, tức số đếm thật ở tầng GL.
- **Kiểm tra "không có pointer":** mở context mới, **không có bất kỳ sự kiện chuột nào**, chỉ gọi `scrollTo` qua bridge. Làm ở cả 1440 và 1920.
- **Cảm ứng:** context có `hasTouch`/`isMobile` ở 390×844, dùng `touchscreen.tap` và CDP `Input.dispatchTouchEvent`.
- **Ảnh:** `qc-evidence/judge/round5/shots/real-estate-*.jpg`. Contact sheet: `real-estate-{nop,orb0,orb50,orb100,var,hov0,hov75,1920,390}-sheet.jpg`.
- FPS không dùng làm bằng chứng (orchestrator đã đo bản production). Lúc ready, bridge tự báo khoảng 70 fps, chỉ để tham khảo.

## Điểm: **89 / 100**, chưa đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **26** | Tre không còn che kính mặt tiền ở góc bên/sau. Nội thất 50% có vũng sáng ấm trên tường, đèn vòng trần và đèn cây. Vẫn trừ: nội thất be-xám phẳng, trần chưa "phát sáng"; cây cối low-poly; mặt bên/sau là khối đá trơn ít chi tiết. |
| Animation & tương tác (30) | **28** | Hover ma đã hết. Scroll 5 mốc xuôi = ngược tuyệt đối. Nhảy 1 → 0,3 hội tụ khoảng 450 ms. Wheel giật trả về 0. Nhãn tự xóa khi cuộn. Trừ: **chạm (tap) trên cảm ứng không hiện nhãn** vì nhãn bị xóa sau 2 ms; không có auto-orbit (có chủ đích). |
| Bám tinh thần mẫu (20) | **17** | Cơ chế D đủ: toàn cảnh → GROUND → LEVEL 1 → ROOFTOP có lưới hologram → toàn cảnh đêm, có rail và giờ. Chất hình vẫn stylized, cách xa render photoreal D (sảnh đá bóng, đèn trần hữu cơ, rèm, phòng phát sáng ấm). |
| Thiết kế frontend (10) | **9** | Hint góc phải dưới đã có nền tối, đọc rõ. Brand đọc được trên kính. Mobile sạch. Trừ nhẹ: mép phải biệt thự sát mép màn hình ở 390@0%. |
| Hiệu suất & ổn định (10) | **9** | 0 console error / pageerror / HTTP ≥ 400; chỉ có warning deprecation (`THREE.Clock`, `PCFSoftShadowMap` bị thay bằng `PCFShadowMap`). Draw call khớp lời builder. Ready 4,0 s ở DEV. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `real-estate-orb0-low.jpg`, `orb100-lowright.jpg` (nhìn từ trên: hồ, sàn teak, pergola) |
| Xoay 360° | **PASS** | q = 271 px/90°. 4 lần kéo cho `yawTotal` −6,287 ở 0% và tăng thêm −6,287 ở 100% (−12,566 → −18,854). Ở 50%, yaw bị kẹp ở ±0,75 rad, đúng thiết kế chặng cận (right = full = −13,316). Reset trả camera đúng [25; 6,4; 38], [0,4; 7; 29,5], [−31; 17,5; 37]. Ảnh: `real-estate-orb{0,50,100}-*.jpg` |
| Đổi vật liệu | **PASS** (bấm nút `.re-picker` ở 0, 50 và 100%) | travertine `#e7dcc6` r .95, basalt `#4b5053` r .82, terracotta `#c46e48` r 1,0. Giống nhau ở cả 3 mốc. Ảnh: `real-estate-var{0,50,100}-{0,1,2}.jpg` |
| Hover phản hồi | **PASS** (desktop) | Ở 0%: roof, mass, glass, fins đều v = 1,00, có nhãn. Ở 75% và 100% có thêm pool. Rời chuột về null. Ảnh: `real-estate-hov0-{roof,mass,glass,fins}.jpg`, `hov75-pool.jpg`, `hov100-pool.jpg` |
| Scroll mượt, khôi phục được | **PASS** | Camera, FOV và `night` ở 0/.25/.5/.75 xuôi và ngược giống hệt. Wheel 15×900 xuống, 20×900 lên trả về s = 0, camera đúng gốc. Ảnh: `real-estate-fwd-*.jpg`, `back-*.jpg`, `wheel-settled.jpg` |
| Không trắng/crash; không dùng ảnh thay 3D | **PASS** | 0 lỗi |

## Kiểm các điểm builder tuyên bố

| Tuyên bố | Kết luận | Bằng chứng |
|---|---|---|
| Hết hover ma: hover rỗng cho tới khi có sự kiện chuột/bút thật; nhãn rỗng ở 0/25/50/100% khi mới tải | **ĐÚNG** | Context mới, không có pointer: 1440 cho `hover = {null, 0}` và `data-part = ""` ở 0/.25/.5/1. 1920 cũng vậy ở 0/.25/.5/.75/1. Ảnh: `real-estate-nopointer-{0,25,50,100}.jpg` sạch. |
| Nội thất 50% có vũng sáng ấm trên sàn/tường/trần và trần phát sáng | **MỘT PHẦN** (builder cũng tự nhận) | `real-estate-nopointer-50.jpg`: có 2 vũng sáng ấm trên tường sau, đèn cây, vòng cove trần, tầng trệt cũng có vũng sáng. Nhưng trần chỉ be nhạt chứ không phát sáng. Sàn không thấy phản chiếu. Không có rèm. Tổng thể vẫn be-xám phẳng, chưa có cảm giác "phòng ấm" như D (LEVEL 34). |
| Tre tự ẩn khi đứng trước biệt thự | **PHẦN LỚN ĐÚNG** | `real-estate-orb0-right.jpg`: tre ở bên trái, không che kính (chỉ chạm góc sàn ở x 400–500). `orb0-back.jpg` sạch. `orb0-left.jpg`: cụm tre x 975–1135 vẫn đứng trước mép cánh thấp bên phải (x 975–1000). |
| Nền cho brand/hint | **ĐÚNG** (hint), **không cần thiết** (brand) | Hint góc phải dưới có nền tối, đọc rõ trên sân sáng ở 50% (`nopointer-50.jpg`). Brand HALCYON ở 25% đè khung kính nhưng vẫn đọc được (`nopointer-25.jpg`). |
| Không auto-orbit (có chủ đích) | **Ghi nhận** | Hero đứng im. Trừ nhẹ ở Animation. |
| Draw call 55 idle / 66 trung bình / 127 đỉnh khi cuộn | **ĐÚNG** (tôi đo lại) | Idle, trung bình 60 frame: 0% 65,8 (min 54); 25% 64,4; 50% 55,3; 75% 54,9; 100% 66,4 (đỉnh lẻ 97–99, có lẽ do cập nhật shadow). Khi wheel 60×150 (277 frame): trung bình 66,2, p95 99, đỉnh 129. |

## Bảng lỗi vòng 4

| # | Lỗi vòng 4 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Hover ma "GLASS WALL" ở tâm hero khi chưa có pointer | **FIXED** | `real-estate-nopointer-{0,25,50,100}.jpg`, số liệu 1920 |
| 2 | Cụm tre che mặt tiền ở góc bên/sau | **PARTIAL (phần lớn đã sửa)** | Sạch: `orb0-right.jpg`, `orb0-back.jpg`. Còn chạm mép: `orb0-left.jpg` (x 975–1000). Lá vẫn bão hòa, kiểu bìa cứng. |
| 3 | Nội thất 50% phẳng, không ấm | **PARTIAL** | `nopointer-50.jpg`, `1920x1080-50.jpg`: có vũng sáng ấm, chưa có sàn phản chiếu, rèm hay trần phát sáng |
| 4 | Hint góc phải dưới không đọc được ở 50% | **FIXED** | `nopointer-50.jpg` |
| 5 | Logo HALCYON đè khung kính ở 25% | **NOT FIXED nhưng chấp nhận được** | `nopointer-25.jpg`: chữ trắng trên kính tối, đọc được |
| 6a | Ở 0%, hover dải mái tối lại hiện "INFINITY POOL" | **FIXED** | Quét lưới ở 0% chỉ ra roof, mass, glass, fins; pool chỉ xuất hiện ở 75% và 100%, nơi thấy mặt nước |
| 6b | Chạm trên cảm ứng không có nhãn | **NOT FIXED** (code đã có đường tap nhưng không chạy) | Xem lỗi mới #1 |
| 6c | Không có auto-orbit | **NOT FIXED (có chủ đích)** | — |

## Lỗi mới / còn mở (xếp theo mức nghiêm trọng)

**1. Tap trên cảm ứng: nhãn hiện rồi bị xóa sau khoảng 2 ms** (390×844, `hasTouch`, mọi mốc)
- **Bằng chứng:** MutationObserver trên `.re-hover` ghi được `19350:glass`, rồi `19352:` (rỗng). `hover.id` vẫn null. Ảnh `real-estate-390-tap.jpg` không có nhãn. Sự kiện chạm có tới canvas: `pointerdown:touch`, `pointerup:touch`, `click`.
- **Nguyên nhân** (đọc code, không sửa): với pointer cảm ứng, trình duyệt bắn `pointerleave` ngay sau `pointerup`. Handler `leave` trong `Villa.tsx` (dòng 59–63) gọi `clearHover()` vô điều kiện, nên xóa nhãn mà tap vừa đặt (dòng 75–83). `onPointerOut` của R3F (dòng 256) cũng có thể xóa.
- **Sửa:**
  - Đổi `leave` thành `(e: PointerEvent) => { if (e.pointerType === 'touch') return; … }`.
  - Đổi `onOut` thành `(e) => { if (e.nativeEvent.pointerType === 'touch') return; clearHover(); }`.
  - Giữ timer 2 s để tự xóa.

**2. Nội thất vẫn chưa tới mức "căn hộ ấm" của D** (50%, 1440 và 1920: `nopointer-50.jpg`, `1920x1080-50.jpg`; 25%: `nopointer-25.jpg`)
- **Sửa:**
  - Trần mỗi tầng dùng `emissive #ffd9a8` × .35 khi `night > .3`. Hiện trần chỉ be, nên đây là điểm phân biệt "trần phát sáng".
  - Sàn nội thất `roughness .15`, `envMapIntensity 1.2`, và một plane `MeshReflectorMaterial` (256 px, mixStrength .4) chỉ cho tầng LEVEL 1, để có phản chiếu đèn.
  - Thêm rèm voan sau kính ở mép trái và mép phải (`PlaneGeometry` lượn sin, opacity .45, màu `#f3e6d2`, emissive .1).
  - Tăng tương phản ấm–lạnh: mặt kính ngoài phản trời xanh, trong phòng 2700 K.

**3. Cây cối low-poly, tán tre bão hòa** (`orb0-left.jpg`, `orb0-right.jpg`, `fwd-0.jpg`)
- **Sửa:**
  - Lá tre/cọ hạ saturation khoảng 25%, thêm biến thiên hue ±6% theo instance, alphaTest lá thay cho dải phẳng.
  - Cụm tre ở `orb0-left` cũng phải fade theo occluder test (hiện test có lẽ chỉ xét khối chính, chưa xét cánh thấp bên phải).

**4. Mặt bên/sau là khối đá trơn** (`orb0-back.jpg`, `orb0-left.jpg`, `orb100-back.jpg`)
- **Sửa:** thêm lam gỗ dọc hoặc khe sáng LED ngang ở mặt sau tầng 1–2, và ô cửa sổ phát sáng ấm vào ban đêm, để biệt thự đẹp ở mọi góc (PHẦN VII mục 8).

**5. Nhỏ**
- 390@0%: mép phải biệt thự (chậu cây tầng 1) chạm mép viewport khoảng x 375 (`real-estate-390x844-0.jpg`). Sửa: dolly mobile thêm khoảng 6% ở mốc 0%.
- Không auto-orbit. Builder chủ động bỏ, nhưng một drift yaw ±5° theo sin, chu kỳ 20 s, khi không có input sẽ tăng cảm giác "điện ảnh" của D.
- Console có warning `PCFSoftShadowMap has been removed`. Sửa: đặt `shadows="percentage"` hoặc `PCFShadowMap` tường minh.

## Độ giống mẫu (D)
- **Cơ chế:** khoảng 90%. Đủ chuỗi toàn cảnh hoàng hôn → GROUND → LEVEL 1 xuyên kính → ROOFTOP có hồ và wireframe hologram → toàn cảnh đêm có skyline. Có rail tầng và giờ trong ngày (18:05 → 21:40). Ánh sáng chuyển từ hoàng hôn sang đêm.
- **Hình ảnh:** khoảng 62–65%.
  - D là render photoreal: sảnh đá bóng, đèn thả hữu cơ, rèm voan, phòng phát sáng ấm, LED vàng chạy dọc tháp.
  - Ta là stylized-clean: nội thất be-xám có vài vũng sáng, cây low-poly, đêm thiếu bloom và LED dọc.
  - Hero 0% sạch và cân đối.
- **Typography/UI:** sát D: serif mảnh, rail dọc có panel, nhãn "LEVEL 1" lớn kèm giờ, picker vật liệu dạng pill.

## Có đạt ≥ 90 không? Sửa tối thiểu
**Chưa (89).** Cần khoảng +1 đến +3:
1. Lỗi #1, bỏ qua `pointerleave` của touch (sửa 2 dòng, +0,5 đến +1 Animation). Bắt buộc, vì chạm là cơ chế hover trên mobile.
2. Lỗi #2, trần phát sáng, sàn phản chiếu và rèm ở LEVEL 1 (+1 3D, +1 Bám mẫu).
3. Lỗi #3, giảm bão hòa tre/cọ và xét occluder cho cả cánh thấp (+0,5 3D).
