# D — "AURELIA RESIDENCES" (tháp căn hộ cao cấp, cuộn = lên từng tầng) — phân tích kỹ thuật

- URL: https://www.pinterest.com/pin/606086062401431878/
- Trạng thái: **VERIFIED (media)** · Loại: video 10,06 s, 720×1280, không loop · đăng 02/08/2026 · pin `og:url` chuyển sang `id.pinterest.com/pin/274086327319501913/`
- Người đăng công khai: **UI UX Bunker** (Pinterest `uiuxbunker`). Nguồn công khai (xác nhận bằng trang IG): https://www.instagram.com/reel/DbfrqB9jQKm/ — caption "Real estate Website · Designed by: @polanaeem.tech · Follow @uiuxbunker…" (20 likes, 1 comment lúc quan sát). Chữ phủ "Wait till end" là của người đăng.
- Bản chất: **video concept UI**: laptop trên bàn đá cẩm thạch đen trong nội thất sang trọng (bokeh); camera **dolly-in vào màn hình** (0–2,5 s) rồi nội dung trang cuộn. **Dấu hiệu AI/composite mạnh**: chữ méo khi chuyển ("SUGG RW", "Contrast your deanetroe I your nedimant"), ảnh các tầng là ảnh render/AI full-bleed. **Không có bằng chứng đây là site 3D realtime**; không tìm thấy URL site thật.
- Bằng chứng: `shots/D-page.jpg`, `D-contact.jpg` (12 khung: t = 0; 0,91; 1,83; 2,74; 3,66; 4,57; 5,48; 6,40; 7,31; 8,23; 9,14; 10,01 s), `D-v000…v100.jpg`.
- "Viewport" = màn hình laptop (sau khi dolly-in chiếm ~100% khung video).

## Timeline quan sát (giây video)

| t (s) | Quan sát |
|---|---|
| 0–1,8 | Laptop nhỏ trong cảnh; hero "AURELIA RESIDENCES": tháp kính ở hoàng hôn xanh `#365987` bên phải, headline serif **"YOUR LIFE. ELEVATED."** trái; chấm chỉ số `01` ở rail phải; "STREET LEVEL" + nút tròn vàng dưới phải |
| 1,8–3,0 | **Camera (video) dolly-in** vào màn hình; trang cuộn: ảnh hero zoom/nghiêng vào **cổng sảnh tầng trệt** (đêm, có cây, xe trắng) |
| 3,0–4,6 | **Sảnh nội thất ấm** (`#967c65`, `#dac3a9`): cửa kính trượt, đèn thả hữu cơ; nhãn "PRIVATE ARRIVAL", "ARRIVAL", "24/7 VALET"; chỉ báo "STREET LEVEL / GROUND FLOOR" (chữ serif lớn) |
| 4,6–6,4 | Zoom lên **mặt đứng kính**, "LEVEL 01" → **"LEVEL 34"**: nhìn xuyên kính vào phòng khách (đèn vòng, sofa), nhãn diện tích `245 m²`/"RESIDENCE"/"THREE-BEDROOM RESIDENCE" |
| 6,4–8,2 | **Sky Level — "LEVEL 48"**: cảnh hoàng hôn cam-xanh trên thành phố; thanh timeline dưới có mốc giờ `10:00 … 16:30 … 20:00 Dinning` |
| 8,2–9,1 | Cảnh **hồ bơi vô cực** màu xanh phát sáng trên tầng thượng; **lớp hologram wireframe** (đường outline toà nhà bán trong suốt) + nhãn "INFINITY POOL", "PRIVATE DINING" |
| 9,1–10,0 | **Cảnh cuối**: toàn cảnh tháp ban đêm, dải đèn vàng chạy dọc cạnh tháp, skyline đèn; headline **"LIVE ABOVE THE ORDINARY."**, nút "BOOK A PRIVATE VIEWING", "EXPLORE RESIDENCES", nhãn "SKY LEVEL – LEVEL 48" |

## 10 điểm kỹ thuật

1. **Vị trí & tỉ lệ**: hero — tháp cao ~75% chiều cao màn hình, rộng ~22%, tâm (62%, 52%), hơi nghiêng 8° (phối cảnh nhìn từ dưới). Sảnh — cửa kính chiếm ~100% bề rộng (camera "đi vào"). Mặt đứng tầng 34 — mỗi khoang kính ~35% bề rộng. Cảnh cuối — tháp cao ~85% màn hình, tâm (60%, 50%), skyline hai bên. Mỗi "tầng" là ảnh full-bleed.
2. **Camera** (trên ảnh render): hero — nhìn từ dưới lên (low angle, pitch ≈ +15°), FOV ≈ 35° (hơi rộng để tháp thon); sảnh — camera ngang tầm mắt (1,6 m), nhìn thẳng trục sảnh, FOV ≈ 50–55°; mặt đứng — nhìn thẳng song song kính (ortho-like, FOV 25°); cảnh cuối — drone cao ngang đỉnh tháp, FOV ≈ 40°. Camera (video) bên ngoài: dolly + hơi tilt xuống (0–2,5 s) — không thuộc thiết kế.
3. **Nền/môi trường/ánh sáng**: hoàng hôn → đêm. Đo: trời `#365987`/`#274a77`/`#3a6795`, mây-xám `#58544b`, nhà cao tầng nền `#293546`; nội thất ấm `#967c65`/`#775d47`/`#b59879`; ánh sáng dải vàng `#e8c98a`(suy ra) chạy dọc tháp; hồ bơi phát xanh cyan `#2a8fbf`(ước lượng bằng mắt). Key = ánh hoàng hôn cam-hồng chân trời + đèn nội thất ấm; rim = ánh viền LED vàng; phản chiếu skyline trên kính.
4. **Vật liệu**: kính cửa sổ/curtain wall (phản chiếu trời, độ trong cao, khung nhôm tối), đá/gạch sảnh bóng (marble, roughness ≈ 0,15, phản chiếu sàn), gỗ ấm ốp trần/vách, bê tông mịn các sàn nhô (`#8f8a80`), nước hồ bơi (xanh phát sáng, Fresnel mạnh), đèn LED emissive vàng ấm; thảm cây xanh tối.
5. **Typography & UI**: wordmark "AURELIA / RESIDENCES" serif nhỏ HOA + tagline; nav sans nhỏ, active gạch chân; **nút vàng `#c5ac86` "BOOK A VIEWING"** (chữ nâu đậm); headline **serif nhẹ/Light** (kiểu Cormorant/Optima), màu ngà `#e8e2d4`, ~6% chiều cao màn hình/dòng; chỉ báo tầng bên phải-dưới: nhãn nhỏ "SKY LEVEL" + **"LEVEL 48"** (từ "LEVEL" light nhạt, số 48 đậm hơn) ~7% chiều cao; **rail dọc bên phải** (chấm vàng/trắng trên đường mảnh, số 01–03 nhỏ, nhãn xoay dọc "ARRIVAL"); timeline ngang dưới với tick giờ; nhãn feature chữ HOA nhỏ trong khung đen mờ (callout "PRIVATE ARRIVAL").
6. **Chuyển động**: (a) mỗi tầng = một panel ảnh **trượt dọc** (ảnh cũ đi lên, ảnh mới vào từ dưới; thấy hai ảnh ghép ở 8,2 s) kèm **zoom-in nhẹ (scale 1 → 1,25)** để cảm giác "đi tới"; (b) nhãn/UI mỗi tầng fade+slide; (c) con số tầng đếm (34 → 48); (d) hologram wireframe fade-in 0,5 s; (e) chuyển màu thời gian (hoàng hôn → đêm) theo cuộn; (f) rail/chấm dịch theo tiến độ.
7. **Mốc thời gian**: hero 0–1,8; sảnh 3,0–4,6; mặt đứng/LEVEL 34 4,6–6,4; sky level 6,4–8,2; pool+hologram 8,2–9,1; final 9,1–10,0 s. Trung bình ~1,5 s video / "tầng".
8. **Mapping scroll**: cuộn xuống = **đi lên theo thang máy** (street → level 48), tiến độ ≈ tuyến tính (scrub); trục chính: dọc; thời gian trong ngày tăng cùng tiến độ (ban ngày/hoàng hôn → đêm). Cuộn ngược: not observable.
9. **Hover/chuột**: **not observable** (có thể có hotspot nhãn "PRIVATE ARRIVAL/INFINITY POOL" nhưng không thấy tương tác).
10. **Phải là WebGL thật** (theo yêu cầu Founder "Luxury Villa 3D" + realtime thật): toàn bộ công trình (khối, kính, sàn nhô, hồ bơi, cây), ánh sáng chuyển hoàng hôn → đêm, camera đi theo spline, hologram wireframe (LineSegments/EdgesGeometry), nhãn hotspot (Html). **DOM/2D**: UI, rail, chỉ báo. **Không dùng**: ảnh/video AI full-bleed làm cảnh chính (đó là cách bản gốc làm — không đạt yêu cầu "mô hình 3D tương tác thật").

## Dựng bằng Three.js (Demo 3 — Luxury Villa; học cơ chế "đi lên theo scroll" của D)

- **Công trình procedural**: biệt thự modular — 3 khối chữ nhật chồng lệch (`BoxGeometry` với bevel bằng `RoundedBoxGeometry` bán kính 0,02) + sàn nhô cantilever dày 0,25 (bê tông `#8f8a80`, roughness 0,85, noise bump), mái phẳng viền mỏng, cột tròn; **kính**: `MeshPhysicalMaterial({ color:'#a8c4d8', roughness:0.05, metalness:0, transmission:0.85, thickness:0.2, ior:1.45, envMapIntensity:1.5, transparent:true })` — chi phí transmission cao → dùng `MeshStandardMaterial` trong suốt + env phản chiếu ở mobile; **nội thất giả** bằng *interior-mapping shader* (box ảo phía sau kính) hoặc vài mesh đơn giản có emissive ấm.
- **Hồ bơi vô cực**: plane `MeshPhysicalMaterial({ color:'#1e8fbf', roughness:0.05, transmission:0.5, emissive:'#0a5f8a', emissiveIntensity:0.6 })` + sóng normalMap cuộn; mép tràn dùng gradient alpha.
- **Ánh sáng/thời gian**: drei `<Sky>` hoặc `Environment` custom + `DirectionalLight` (`#ffb36a` hoàng hôn → `#6a86c8` đêm); `sunElevation` lerp theo scroll; đèn nội thất `emissive` bật dần 40–100% khi tối; dải LED `MeshBasicMaterial('#ffe0a0')` + `Bloom`. Bóng: `PCFSoftShadowMap` 2048, `ContactShadows`; AO: `N8AO` (postprocessing) nhẹ.
- **Hotspot hover**: raycast các nhóm (hồ bơi, sảnh, ban công) → outline `Outline`/emissive tween; label HTML bằng drei `<Html>` với đường kẻ SVG (kiểu callout của D).
- **Hologram**: `EdgesGeometry` của khối chính + `LineBasicMaterial({ color:'#7fc4ff', transparent, opacity:0.5 })`, fade-in theo scroll 75%.

### Storyboard camera/scroll (0/25/50/75/100%)

| % | Camera | Cảnh |
|---|---|---|
| 0 | pos [28,2.5,32], target [0,6,0], FOV 32 (low angle) | toàn cảnh biệt thự lúc hoàng hôn xanh, headline "YOUR LIFE. ELEVATED." |
| 25 | spline → pos [9,1.7,16], FOV 45 | tiến vào cổng/sảnh; đèn sảnh ấm bật; nhãn "ARRIVAL" |
| 50 | pos [6,9,10] → target kính tầng 2, FOV 28 | **crane up** theo mặt đứng, nhìn xuyên kính vào phòng khách; số "LEVEL" đếm |
| 75 | pos [−4,12,6] orbit −35°, FOV 38 | sân thượng/hồ bơi lúc hoàng hôn cam; sun elevation thấp; hologram hiện |
| 100 | pos [−26,16,26], target [0,7,0], FOV 40 | toàn cảnh ban đêm, LED vàng, skyline; kéo xoay tự do (orbit giới hạn) |
