# QC JUDGE vòng 4 — `/real-estate` · HALCYON Luxury Villa

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này) · Đã load skill `3d-visual-qc`, áp dụng checklist 1–8. Chấm theo những gì thấy ở vòng này, không neo theo điểm vòng 3 (82).

**Điều kiện đo**
- Dev server riêng: `npx vite --port 5197 --strictPort`. **Port 5198 đã bị PID 16436 chiếm từ trước** (không phải tiến trình của tôi, tôi không đụng vào), nên tôi dùng 5197.
- Chrome qua Playwright MCP. Mỗi phép đo chạy trong một `browser.newContext()` riêng, không động vào tab của judge kia (5199). Viewport 1440×900, DPR 1, trừ khi ghi khác.
- Draw call: tôi bọc `drawElements/drawArrays/*Instanced` của WebGL bằng init script rồi đếm theo từng rAF. Đây là đếm thực ở tầng GL. `renderer.info` không lộ ra bridge.
- FPS: không dùng làm bằng chứng nghiệm thu, theo chỉ đạo. Orchestrator đã đo bản production: scroll 58,6 fps.
- Ảnh: `qc-evidence/judge/round4/shots/real-estate-*.jpg`.

## Điểm: **85 / 100**, chưa đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **25** | Đèn đường đã ra khỏi hero; thân cọ không còn cắt mặt tiền ở bất kỳ góc nào tôi thử. Bị trừ vì: cụm tre dày che 30–40% mặt tiền ở các góc bên/sau; tán tre như dải bìa low-poly; nội thất vẫn phẳng, xám-be, thiếu ấm; mặt sau lúc 100% tối đục. |
| Animation & tương tác (30) | **27** | Scroll 5 mốc xuôi = ngược tuyệt đối. Nhảy 1→0,3 hội tụ trong ~400 ms. Wheel giật trả về đúng 0. Nhãn hover tự xóa khi cuộn. Bị trừ vì **hover "ma"**: khi chưa có pointer, raycast ở tâm màn hình nên nhãn "GLASS WALL" hiện sẵn trên hero. Chưa có auto-orbit. |
| Bám tinh thần mẫu (20) | **17** | Cơ chế D đủ: toàn cảnh → GROUND → LEVEL → ROOFTOP có lưới hologram → toàn cảnh đêm, rail tầng + giờ. Chất hình vẫn stylized, cách xa render photoreal của D (sảnh đá bóng, đèn trần hữu cơ, rèm, nội thất phát sáng ấm). |
| Thiết kế frontend (10) | **8** | Phụ đề thương hiệu đã đọc được; mobile sạch. Bị trừ vì: nhãn hover ma ở tâm hero; dòng gợi ý góc phải dưới gần như không đọc được trên sân sáng ở 50%; logo HALCYON đè khung kính mặt tiền ở 25%. |
| Hiệu suất & ổn định (10) | **8** | 0 lỗi console / pageerror / HTTP ≥ 400 trên 3 viewport. Draw call khớp lời builder: idle 53. FPS lấy theo số orchestrator (58,6 khi scroll). Ready 9,1 s ở DEV khi máy đang chia sẻ. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `real-estate-orb0-high.jpg`, `real-estate-orb100-highright.jpg` (nhìn từ trên xuống, thấy hồ, mái, sàn gỗ) |
| Xoay 360° | **PASS**: 4×271 px ⇒ `yawTotal` 6,287 ở 0% và 100%. Ở 50% yaw kẹp 0,75 rad, đúng thiết kế chặng cận. Reset ⇒ đúng pose gốc ở 0/50/100% (cam [25; 6,4; 38], [0,4; 7; 29,5], [−31; 17,5; 37]). | `real-estate-orb{0,100}-{front,right,back,left}.jpg` |
| Đổi vật liệu | **PASS**: `#e7dcc6` r .95 → `#4b5053` r .82 → `#c46e48` r 1,0, đo ở 0/50/100% | `real-estate-var{0,50,100}-{0,1,2}.jpg` |
| Hover phản hồi | **PASS**: fins, glass, roof, pool đều cho `hover.value` ≈ 1, rim .40 và nhãn DOM đúng. Rời chuột ⇒ 0, nhãn rỗng. | `real-estate-hov0-fins.jpg`, `hov0-glass.jpg`, `hov0-roof.jpg`, `hov75-pool.jpg`, `hov100-pool.jpg`, `hov100-off.jpg` |
| Scroll mượt / khôi phục | **PASS**: 0/.25/.5/.75/1 xuôi và ngược cho camera và `night` giống hệt nhau. Wheel 15×900 xuống, 10×900 lên ⇒ raw/smooth = 0, camera đúng gốc. | `real-estate-fwd-*.jpg`, `real-estate-back-*.jpg`, `real-estate-wheel-jitter-settled.jpg` |
| Không trắng/crash; không thay 3D bằng ảnh | **PASS** | 0 lỗi |

## Bảng lỗi vòng 3

| # | Lỗi vòng 3 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Cột đèn đường chẻ đôi hero 0% | **FIXED** | `real-estate-fwd-0.jpg`, `real-estate-1920x1080-0.jpg`, `real-estate-390x844-0.jpg`: giữa khung chỉ còn bollard thấp, không có cột hay thanh sáng nào đè mặt tiền. `real-estate-orb0-low.jpg` cũng sạch. |
| 2 | Thân cọ cắt mặt tiền khi orbit | **FIXED** | Đã kiểm yaw 0/90/180/270 × pitch 0 / −1,2 (thấp) / +1,2 (cao) ở 0% và 100%: `real-estate-orb0-{right,back,left,low,lowright,lowback,lowleft,high,highback}.jpg`, `real-estate-orb100-{right,back,left,low,lowright,lowback,lowleft,high,highright,highleft}.jpg`. Không thân cọ nào đi qua khối nhà. Ở `orb0-lowleft` còn một thân cọ ở x≈1270, nằm ngoài khối nhà, chỉ cắt qua rail HUD. |
| 3 | Draw call / hiệu năng | **FIXED (về số đo)** | Đếm thực ở tầng GL: idle 53/frame ở cả 5 mốc (50% là 52). Khi scroll 0→1 trong 6 s: trung bình 63,8, p95 93, đỉnh 95 (builder nói 61 / 93). Khớp trong sai số. FPS lấy theo orchestrator. |
| 4 | Phụ đề thương hiệu khó đọc | **FIXED** | `real-estate-fwd-0.jpg` y≈60: "BAHA · LUXURY VILLA 3D" màu trắng .82 có shadow, đọc rõ trên trời hồng. |
| 5 | Nội thất chưa tới mức D | **PARTIAL** | `real-estate-1920x1080-50.jpg`, `real-estate-fwd-25.jpg`: đã có vòng đèn cove trên trần (rõ ở 25%). Nhưng ở 50% nội thất vẫn sáng phẳng màu be-xám. Sàn bóng không thấy phản chiếu trong nội thất (chỉ sân ngoài là có). Không có rèm. Ánh ấm phát ra từ cửa kính lúc đêm yếu. |
| 6 | Không có auto-orbit | **NOT FIXED (builder chủ động bỏ)** | Hero đứng im. Trừ nhẹ ở hạng mục Animation. |

## Lỗi mới / còn mở (xếp theo mức nghiêm trọng)

**1. Hover "ma" khi chưa có pointer: nhãn "GLASS WALL" hiện ở tâm hero** (desktop, mọi mốc, 1440 và 1920)
- Bằng chứng: trang mới mở, chưa có sự kiện chuột nào ⇒ `hover = {id:"glass", value:1}`, `.re-hover[data-part="glass"]`. Ảnh: `real-estate-fwd-0.jpg` (nhãn ở 615–820 × 430–480), `real-estate-fwd-25/50/75/100.jpg` (lần lượt glass/glass/pool/mass), `real-estate-1920x1080-*.jpg`. Đưa chuột ra góc thì nhãn mất (`hoverCorner` = null).
- Mobile 390 không bị (`real-estate-390x844-*.jpg`, hover null).
- Tác động: khung đầu tiên người dùng desktop thấy (khi con trỏ đang ở thanh địa chỉ hoặc ngoài cửa sổ) có tooltip treo giữa mặt tiền, và glass/mass sáng rim sẵn.
- Sửa:
  - Khởi tạo pointer NDC = `(9, 9)` (ngoài màn hình) và cờ `hasPointer = false`.
  - Chỉ raycast khi đã nhận ít nhất một `pointermove` có `pointerType === 'mouse'`.
  - Trên `pointerleave` của canvas và `mouseout` của document với `relatedTarget == null`, đặt lại `hasPointer = false`.

**2. Cụm tre che mặt tiền ở các góc bên/sau** (0%, yaw 90/180/270, cả góc thấp)
- Bằng chứng: `real-estate-orb0-right.jpg` (3 cụm che tầng 1 từ x≈200 đến 1130), `real-estate-orb0-back.jpg`, `real-estate-orb0-lowright.jpg`, `real-estate-orb0-lowleft.jpg` (cụm 280–690 che kính tầng 1), `real-estate-orb100-lowback.jpg`.
- Tán là các dải lá phẳng xanh bão hòa, đọc như bìa cứng.
- Sửa:
  - Áp cơ chế occluder-fade đang dùng cho cọ lên cả tre: ẩn hoặc fade instance nằm giữa camera và hình chiếu khối nhà.
  - Hoặc giảm chiều cao cụm tre xuống ≤ 3,2 m (dưới mép sàn tầng 1) và dời ra sát tường rào.
  - Hạ saturation lá khoảng 25%, thêm biến thiên hue ±6% mỗi instance.

**3. Nội thất 50% vẫn phẳng, không ấm** (`real-estate-1920x1080-50.jpg`, 19:53 đêm)
- Sửa:
  - Nội thất dùng `MeshStandardMaterial` có emissive ấm `#ffdcae` × .15 trên tường và trần khi `night > .3`.
  - Mỗi tầng một `RectAreaLight` (hoặc PointLight giả) màu 2700 K.
  - Sàn nội thất `roughness .12` + `envMapIntensity 1.3` để có vệt phản chiếu.
  - Rèm voan `PlaneGeometry` lượn sin, `opacity .5`, sau kính tầng 1–2.
  - Kết quả cần đạt: nhìn từ ngoài thấy các ô kính phát sáng ấm như D.

**4. Dòng gợi ý góc phải dưới không đọc được ở 50%** (`real-estate-fwd-50.jpg`, x 1180–1400, y 845–865: chữ xám nhạt trên sân lát sáng)
- Sửa: thêm `text-shadow: 0 1px 6px rgba(10,12,30,.7)` cho dòng hint, hoặc đặt nền `rgba(12,14,30,.45)` bo góc như panel tầng.

**5. Logo HALCYON đè lên khung kính mặt tiền ở 25%** (`real-estate-fwd-25.jpg`, `real-estate-1920x1080-25.jpg`)
- Sửa: ở mốc GROUND hạ `target.y` khoảng 0,6 m, hoặc thêm gradient tối 0→.35 ở 120 px trên cùng (giống panel mobile).

**6. Nhỏ**
- Ở 0%, hover vào dải mái tối (không thấy nước) lại hiện nhãn "INFINITY POOL" (`real-estate-hov0-pool-at0.jpg`). Sửa: ở overview, chỉ cho phép pick pool khi mặt nước nhìn thấy, hoặc gộp phần đó vào "roof".
- Trên cảm ứng, chạm không cho nhãn (`real-estate-390x844-tap.jpg`, hover null). Sửa: tap ngắn (< 200 ms, < 8 px) ⇒ pick một lần và giữ nhãn 2 s.
- Không có auto-orbit. Sửa: drift yaw ±6° theo sin, chu kỳ 20 s, khi không có input.

## Độ giống mẫu (D)
- **Cơ chế:** khoảng 90%. Đủ chuỗi toàn cảnh hoàng hôn → sảnh → tầng nhìn xuyên kính → hồ tầng thượng có lưới hologram → toàn cảnh đêm có skyline; rail tầng bên phải + giờ; ánh sáng chuyển hoàng hôn → đêm.
- **Hình ảnh:** khoảng 60–65%. D là render photoreal: sảnh đá bóng có đèn trần hữu cơ, căn hộ phát sáng ấm qua rèm, dải LED dọc tháp. Ta là stylized-clean, nội thất xám-be phẳng, cây low-poly. Hero 0% nay sạch, gần tinh thần "tháp + trời + headline" của D.
- **Typography/UI:** sát D (serif mảnh, rail dọc, "LEVEL 1" lớn, giờ trong ngày).

## Có đạt ≥ 90 không? Sửa tối thiểu
**Chưa (85).** Lộ trình tối thiểu, khoảng +5:
1. Lỗi #1, bỏ hover ma (+1 Animation, +1 Frontend). Rẻ và bắt buộc, vì đây là khung đầu tiên trên desktop.
2. Lỗi #3, nội thất phát sáng ấm + sàn bóng + rèm (+2 3D, +1 Bám mẫu).
3. Lỗi #2, fade hoặc hạ cụm tre (+1 3D).
4. Lỗi #4 và #5, chữ hint và logo (+0,5).
