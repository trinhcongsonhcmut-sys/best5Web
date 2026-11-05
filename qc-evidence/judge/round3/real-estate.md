# QC JUDGE vòng 3 — `/real-estate` · HALCYON Luxury Villa

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này) · Skill `3d-visual-qc` đã load, checklist 1–8 áp dụng. Chấm theo cái thấy ở vòng này, không neo theo điểm vòng 2.

**Điều kiện đo:** dev server riêng `npx vite --port 5197 --strictPort` (DEV). Port 5198 đã bị một tiến trình vite khác của cùng repo chiếm sẵn (PID 16436, không phải của tôi, tôi không đụng vào), nên tôi dùng 5197. Chrome qua Playwright MCP, nhưng mọi phép đo chạy trong **browser context riêng** (`browser.newContext()`), để không đụng tab của judge kia (đang ở 5199/beauty). GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, viewport 1440×900 trừ khi ghi khác.
**⚠ GPU/CPU đang bị các agent khác dùng chung, nên mọi số FPS dưới đây KHÔNG có tính quyết định.** Orchestrator sẽ đo lại trên build production, máy rảnh.

- Ảnh: `qc-evidence/judge/round3/shots/real-estate-*.jpg`
- Script tái lập: `.playwright-mcp/r3j2_re_A.js`, `r3j2_re_B.js`

## Điểm: **82 / 100**, chưa đạt 90 (vòng 2: 79)

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **24** | Nội thất 50% có ghế bành, thảm, đèn sàn, kệ (tốt hơn hộp trơn); cọ không còn chẻ khung chính diện. Nhưng có lỗi mới nặng: **cột đèn đường đứng cách camera ~4 m ngay giữa khung hero 0%, đầu đèn thành một thanh sáng kem 290×35 px đè lên mặt tiền**. Thân cọ vẫn cắt mặt tiền ở góc orbit 0% bên/sau và 100% góc thấp. |
| Animation & tương tác (30) | **27** | Nhãn hover nay tự xóa khi camera bay và chọn lại khi dừng (đã đo). Scroll 5 mốc xuôi = ngược chính xác. Không còn kéo thấp ở 100% (pitch kẹp −0,02). Hover có ở cả 5 mốc. Bị trừ vì cột đèn chắn giữa khung khi orbit 0% kéo thấp, và không có auto-orbit (yaw đứng 0 suốt 16 s). |
| Bám tinh thần mẫu (20) | **17** | Cơ chế D đủ (toàn cảnh → GROUND → LEVEL → ROOFTOP có hologram → toàn cảnh đêm, rail tầng + giờ). Chất hình vẫn stylized, kém xa render photoreal của D. |
| Thiết kế frontend (10) | **8** | Chữ 50% và logo đã thoát pergola. Mobile có panel sau chữ ở cả 5 mốc. Bị trừ vì bố cục hero 0% bị cột đèn chẻ đôi, và phụ đề "BAHA · LUXURY VILLA 3D" gần như không đọc được trên trời hồng ở 0%. |
| Hiệu suất & ổn định (10) | **6** | 0 console error / pageerror / HTTP ≥ 400. Auto-DPR hoạt động (canvas 1425×900 → 1140×720). Nhưng FPS đo được rất thấp: idle 34 / scrub 8,9; có tranh chấp GPU. Draw call thực đếm được là 99 ở 0%, không phải 79 như builder nói. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `real-estate-orb50-dragDown.jpg` (nhìn từ trên xuống mái và hồ) |
| Orbit 360° | **PASS**: 0% và 100% quay đủ 4×271 px ⇒ `yawTotal` −6,287 / −12,57. Ở 25/50/75% yaw kẹp ±0,75 rad, đúng thiết kế chặng cận. Reset ⇒ đúng pose gốc ở cả 5 mốc. | `real-estate-orb{0,100}-{front,right,back,left}.jpg` |
| Đổi màu/vật liệu | **PASS**: `#e7dcc6` r .95 → `#4b5053` r .82 → `#c46e48` r 1,0, đo ở 0/50/100% | `real-estate-var{0,50,100}-{0,1,2}.jpg` |
| Hover có phản hồi | **PASS**: pool/glass/roof/fins/mass đều có `hover.value` = 1 kèm nhãn DOM, ở 0/25/50/75/100%. Rời chuột ⇒ 0 và nhãn rỗng. | `real-estate-hov75-2-pool.jpg`, `real-estate-hov0-4-fins.jpg`, `real-estate-hov100-3-glass.jpg`, `real-estate-orb25-right.jpg` (fins) |
| Scroll mượt / khôi phục | **PASS**: 5 mốc xuôi = ngược đến 3 chữ số thập phân (camera và `night`). Nhảy 1→0,3 hội tụ trong ~420 ms, không pop. Wheel giật 15×900 xuống rồi 10×900 lên ⇒ về 0, không kẹt. | `real-estate-fwd-*.jpg`, `real-estate-back-*.jpg`, `real-estate-wheel-jitter-settled.jpg` |
| Cảm ứng | **PASS** (390×844, DPR 2, touch qua CDP): vuốt ngang ⇒ yaw +1,276 rad và scroll giữ 0; vuốt dọc ⇒ scroll .057 và yaw không đổi | — |
| Không trắng/crash | **PASS** | 0 lỗi trong cả 2 phiên đo |
| Không sai lệch nghiêm trọng / không ảnh giả 3D | **PASS** | — |

## Bảng lỗi vòng 2

| # | Lỗi vòng 2 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Nhãn hover kẹt khi cuộn | **FIXED** | Chuột đứng trên `fins` ở 0% rồi `scrollTo(.75)`: ngay ở mốc 100 ms nhãn đã về rỗng (`data-part=""`), `hover.value` .53 → .02 trong 400 ms. Khi dừng: chọn lại đúng (với wheel thì sau khi dừng là `glass`). Khi kéo orbit: nhãn rỗng suốt lúc kéo. `real-estate-stale-during-400ms.jpg`, `real-estate-stale-wheel-after.jpg`, `real-estate-hov-during-drag.jpg`. Có 1 lần (không tái lập được) `hover=mass` còn 1,0 sau khi rời chuột ở 50%. |
| 2 | Hiệu năng thấp | **NOT FIXED (theo số đo của tôi; không kết luận vì có tranh chấp)** | Idle 0% 34,4 fps (p95 53 ms, tệ nhất 173 ms); 50% 30,8; 75% 32,7; scrub 8,9 fps (p95 294 ms). Mobile DPR 2: 38,6. Cold ready **12,2 s**, warm 5,6 s (vòng 2: 4,2 s; máy đang tải nặng hơn). Draw call đếm thực (`drawElements*`) mỗi frame: **99** ở 0% (đỉnh 129–142), **55–56** ở 50/75%. Builder nói 79, tôi không xác nhận được. Auto-DPR **có** hoạt động: 1425×900 → 1140×720. |
| 3 | Thân cọ tiền cảnh chẻ đôi khung | **PARTIAL / REGRESSED về bố cục** | Thân cọ đã rời khung chính diện ở 0/50%: `real-estate-fwd-0.jpg`, `real-estate-orb50-right.jpg` (cọ chỉ còn ở mép trái). Nhưng một **cột đèn đường đen** (Landscape: `lampPos` x = 22,5, z = 34,4, cao 6,2 m; camera ở [25; 6,4; 38]) nay đứng **ngay giữa khung hero**, đầu đèn là một khối sáng kem đè mặt tiền tầng trệt (`real-estate-fwd-0.jpg` x≈740–790; `real-estate-1920x1080-0.jpg` x≈985–1040; `real-estate-orb0-dragUp.jpg` x≈825; mobile `real-estate-390x844-0.jpg`). Thân cọ vẫn cắt mặt tiền ở `real-estate-orb0-right.jpg` (3 thân ở x≈800/940/1100), `real-estate-orb0-back.jpg` (x≈780) và `real-estate-orb100-dragUp.jpg` (x≈830). |
| 4 | Vòm tre chữ "A" mép trái | **FIXED** | `real-estate-fwd-0.jpg` mép trái chỉ còn cọ thẳng và tre đứng |
| 5 | Chữ 50% trên vùng sáng; logo đè pergola | **FIXED** | `real-estate-fwd-50.jpg`, `real-estate-1920x1080-50.jpg`: khối chữ nằm trên nền tối bên trái; HALCYON nằm trên trời, pergola thấp hơn |
| 6 | Mobile 25%: cạnh mái gạch ngang phụ đề | **FIXED** | `real-estate-390x844-25.jpg`: có panel mờ sau khối chữ (cả 5 mốc) |
| 7 | Nội thất hộp | **PARTIAL** | `real-estate-fwd-50.jpg`, `real-estate-1920x1080-50.jpg`: có ghế bành bo, gối, thảm, đèn sàn, kệ, bàn ăn + ghế. Sofa chính vẫn là khối thấp; trần trống, không có rèm hay đèn trần cong như D. |
| 8 | 100% kéo thấp: tường chiếm 1/4 khung | **FIXED** | Kéo lên 400 px ở 100% ⇒ pitch chỉ −0,02 (kẹp), `real-estate-orb100-dragUp.jpg` không còn tường rào. Vẫn còn một thân cọ giữa khung (xem lỗi mới #2). |

## Lỗi mới / còn mở (xếp theo mức nghiêm trọng)

**1. Cột đèn đường chẻ đôi hero, đầu đèn thành thanh sáng kem đè mặt tiền** (0%, mọi viewport, góc mặc định và khi kéo thấp)
- Bằng chứng: `real-estate-fwd-0.jpg`, `real-estate-1920x1080-0.jpg`, `real-estate-orb0-dragUp.jpg`, `real-estate-390x844-0.jpg`.
- Đây là khung đầu tiên người xem thấy. Cột đen dày đứng ở tâm, "đầu đèn" (`headGeo` emissive cộng glow Points) phóng to thành một thanh sáng chắn tầng trệt.
- Sửa (chọn 1):
  - Trong `Landscape.tsx`, loại khỏi `lampPos` các đèn có `|x − camX| < 8` và `z > 30`. Hoặc đổi vòng lặp thành `for (let x = -52.5; x <= 52.5; x += 15) if (Math.abs(x - 22.5) > 1) …`.
  - Hoặc dời hàng đèn ra mép xa của đường (z ≈ 44), sau lưng camera.
  - Hoặc fade các mesh trong bán kính 7 m quanh camera: `material.opacity = smoothstep(4, 7, dist)` với `transparent: true` + `depthWrite: false`.

**2. Thân cọ vẫn cắt mặt tiền khi orbit ở 0% (bên/sau) và 100% (góc thấp)**
- Bằng chứng: `real-estate-orb0-right.jpg` (3 thân đen dọc qua tầng 1–2), `real-estate-orb0-back.jpg` (x≈780), `real-estate-orb100-dragUp.jpg` (x≈830).
- Sửa: áp dụng chung cơ chế "occluder fade" cho thân và tán cọ. Mỗi frame, raycast từ camera tới `target`; mesh instance nào nằm trên đoạn đó thì giảm opacity về .15. Hoặc, gọn hơn, ẩn các instance cọ có khoảng cách tới đường camera→target < 1,5 m.

**3. Hiệu năng / khởi động (không quyết định, có tranh chấp GPU)**
- Đo được: idle 34 fps, scrub 8,9 fps, cold ready 12,2 s, draw call 99 ở 0%.
- Sửa:
  - Đo lại trên `vite preview`.
  - Ở 0%, `drawCallsMax` 129–142 trùng lúc reflector cập nhật: cho reflector cập nhật 1/3 frame khi camera đứng yên, hoặc dừng hẳn khi `|Δcam| < ε`.
  - Gộp `Instanced` pole/bollard/cap/head thành một mesh merged (cùng `MeshLambert`).
  - Bake glow đèn vào texture mặt sân thay cho Points.

**4. Phụ đề thương hiệu 0% không đọc được**
- Bằng chứng: `real-estate-fwd-0.jpg` y≈60, "BAHA · LUXURY VILLA 3D" màu vàng nhạt trên trời hồng, tương phản khoảng 1,3:1.
- Sửa: ở 0%, đặt `color: rgba(255,255,255,.78)` cho `.re-sub`, kèm `text-shadow: 0 1px 8px rgba(20,16,40,.45)`.

**5. Nội thất chưa tới mức D** (`real-estate-1920x1080-50.jpg`)
- Còn thiếu: đèn trần cong/hữu cơ phát sáng, rèm voan ở mép kính, sàn đá bóng phản chiếu.
- Sửa:
  - `RoundedBox` cho sofa chính (radius .06, 2 lớp đệm).
  - Rèm bằng `PlaneGeometry` lượn sin, `opacity` .55, đặt sau kính.
  - Sàn nội thất roughness .15, `envMapIntensity` 1,2.

**6. Không có auto-orbit / chuyển động nhàn ở 0%** (yaw 0 suốt 4 lần chụp cách nhau 4 s: `real-estate-auto0-*.jpg`)
- Mức nhẹ: hero đứng im.
- Sửa: drift yaw ±6° theo sin, chu kỳ 20 s, khi không có input. Lưu ý giữ cột đèn và cọ ra khỏi cung này.

## Độ giống mẫu (D)
- **Cơ chế:** khớp ~90%: đi lên theo scroll, nhãn tầng lớn bên phải + giờ, hoàng hôn → đêm, hồ hologram ở tầng thượng, toàn cảnh đêm có skyline.
- **Hình ảnh:** ~60–65%. D là render photoreal: sảnh đá bóng, đèn trần hữu cơ, rèm, nội thất ấm phong phú, dải LED dọc tháp. Ta là stylized-clean, ánh sáng phẳng hơn, nội thất thưa. Hero 0% bị cột đèn phá bố cục, trong khi D có hero rất sạch (tháp, trời, headline).
- **Typography/UI:** sát D (serif nhẹ, rail dọc phải, "LEVEL 1" lớn, giờ trong ngày).

## Có đạt ≥ 90 không? Sửa tối thiểu
**Chưa (82).** Lộ trình tối thiểu:
1. Lỗi #1: bỏ hoặc dời cột đèn khỏi hero (+3: 3D +2, frontend +1). Bắt buộc, vì đây là khung đầu tiên.
2. Lỗi #2: fade cây chắn đường camera ở 0%/100% (+2).
3. Lỗi #3: chứng minh ≥ 50 fps idle / ≥ 40 scrub trên build production, máy rảnh (+2–3).
4. Lỗi #5: nội thất kiểu D (+1–2).
5. Lỗi #4: phụ đề 0% (+0,5).
