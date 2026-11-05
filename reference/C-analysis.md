# C — "ROSSO" (nhà hàng Ý, scroll-story món mì) — phân tích kỹ thuật

- URL: https://www.pinterest.com/pin/1131740581423900186/
- Trạng thái: **VERIFIED (media)** · Loại: video 7,77 s, 720×1280, không loop · đăng 22/10/2026
- Người đăng công khai: **Ennomark** (Pinterest `enno_mark`); nguồn: Instagram reel https://www.instagram.com/reel/DexA7C_icLg/ (trang IG công khai chỉ có caption hashtag #Entrepreneurship #LeadGeneration #WordPress #Shopify…; có login prompt, **không xem lại video trên IG**). Tiêu đề pin chung chung ("Pin on Education post").
- Bản chất: điện thoại quay một laptop (ánh nắng cửa sổ, bàn gỗ tối) chạy site thương hiệu giả định **"ROSSO — Italian restaurant"**. Ảnh món/nguyên liệu trông là **render/AI cắt nền**; nhãn callout bị méo ("Gentum Rigafing") → nghi video AI/composite. Không có URL site thật.
- Bằng chứng: `shots/C-page.jpg`, `C-contact.jpg` (12 khung: t = 0; 0,71; 1,41; 2,12; 2,82; 3,53; 4,24; 4,94; 5,65; 6,35; 7,06; 7,72 s), `C-v000…v100.jpg`.
- "Viewport" = màn hình laptop (≈ 470×455 px trong khung; tỉ lệ ~ 1,25:1 do laptop quay gần).

## Timeline quan sát (giây video)

| t (s) | Quan sát |
|---|---|
| 0–1,4 | **Hero** nền burgundy `#682319` (đo 80%): kicker "THE TWIRL", headline serif HOA 3 dòng **"LOVE AT FIRST TWIRL."** (kem), phụ đề sans "Fresh from the sea. Straight to your heart.", nút pill kem "EXPLORE THE MENU →"; **nĩa inox xoắn một ổ mì** (có tôm + lá húng quế trên) ở phải, cán nĩa nghiêng ~35° vượt ra mép trên-phải; nhãn dọc "SECTION 01" + vạch dọc ở trái; 3 chấm phân trang dọc ở phải + 4 vạch dưới giữa |
| 1,4–2,8 | Bắt đầu cuộn: **panel kem `#eee7d2` trượt từ đáy lên** che dần nền đỏ; nhãn "THE TWIRL" lặp ở đầu panel; **sợi mì + nước sốt kéo dài xuống (elastic stretch/drip)** xuyên qua ranh giới hai section — vật thể nằm *trên* cả hai section |
| 2,8–4,2 | Section **"A LITTLE BIT OF EVERYTHING."** (serif HOA nhỏ, góc trái trên) + tiêu đề giữa "THE INGREDIENT BALLET": mì xoắn thành **helix dọc**, cà chua, tôm, vẹm đen, húng quế **bay quanh**; callout chữ nghiêng mảnh có đường dẫn (4 nhãn) |
| 4,2–5,6 | Helix uốn thành chữ S, nguyên liệu tản ra rộng hơn; mũi tên "<" trái xuất hiện (carousel) — nội dung vẫn dọc |
| 5,6–6,4 | Nguyên liệu và mì **rơi/xoắn xuống một chiếc đĩa** trồi lên từ đáy; tiêu đề đổi "THE MASTERPIECE / YOUR TABLE IS WAITING." |
| 6,4–7,7 | **Final**: đĩa mì hoàn chỉnh (tôm, vẹm, cà chua bi, húng quế, sốt đỏ) giữa màn hình; nút viền "RESERVE A TABLE"; section "03" |

## 10 điểm kỹ thuật

1. **Vị trí & tỉ lệ vật thể**: Hero — cụm nĩa+mì rộng ~30% màn hình, cao ~45%, tâm (63%, 50%), cán nĩa chạy tới góc phải trên (cắt cố ý). Ballet — helix cao ~70% màn hình, rộng ~25%, tâm (48%, 55%); các nguyên liệu bán kính quỹ đạo ~18–25% bề rộng. Final — **đĩa rộng ~87% bề rộng màn hình**, tâm (53%, 57%), cao ~25%; ổ mì cao ~18%.
2. **Camera** (render sẵn): Hero chính diện ngang tầm, FOV tele ~25°. Final: **nhìn xuống ~27–32°** (đĩa elip tỉ lệ ~0,45), 3/4 nhẹ, FOV ≈ 30°, khoảng cách ≈ 2,5 lần đường kính đĩa; target = tâm đĩa. Giữa chừng camera "tilt-down" theo cuộn.
3. **Nền/môi trường/ánh sáng**: hero burgundy phẳng có vignette nhẹ (đo `#682319`; tối `#3d140d`; sáng `#70261d`); các section sau kem `#eee7d2`. Ánh sáng món ăn: key mềm trên-trái (softbox), fill cam ấm; highlight mạnh trên sốt/tôm/cà chua; bóng đổ mềm dưới đĩa `rgba(0,0,0,.18)` bán kính lớn. Bối cảnh ngoài (laptop): ánh nắng xiên qua cửa sổ, tường be `#b4a79b`, bàn gỗ `#251912`/`#4c3328` (không thuộc thiết kế).
4. **Vật liệu**: mì spaghetti vàng ấm `#f4b276`/`#e8b787`/`#d79867`, bóng dầu nhẹ (roughness ≈ 0,35, clearcoat ≈ 0,3), sợi Ø ≈ 0,9 mm thực; sốt cà chua đỏ `#9f1d13` (đo)–`#c9381f`, bóng ướt (clearcoat 1, roughness 0,15); tôm cam hồng `#e8864f`, bán trong (thickness/subsurface); vẹm vỏ đen xanh `#1b1717`/`#3c2a2b`, rất bóng (clearcoat 1) với vân; cà chua bi đỏ bóng, cuống xanh; húng quế xanh `#3f7a2a`, mỏng, gân lá; **đĩa sứ trắng ngà** (roughness ≈ 0,25, clearcoat 0,6, viền hơi dày, lòng đĩa lõm); inox nĩa (metalness 1, roughness ≈ 0,18).
5. **Typography & UI**: serif tương phản vừa, kiểu Cormorant/Playfair/"Editorial New"; headline HOA ~9–10% chiều cao màn hình/dòng (hero) và ~5–7% (các section); kicker/nhãn nhỏ sans HOA tracking rộng ("THE TWIRL", "THE MASTERPIECE", "THE INGREDIENT BALLET"); callout serif italic mảnh với đường dẫn; nút pill (fill kem ở nền tối; viền mảnh ở nền sáng); nav "ROSSO" serif + sub "Italian restaurant", links sans nhỏ, pill "SCAN NOW" viền; chấm phân trang dọc phải. Màu chữ: kem `#fad7c7`/`#f4e4d6` trên đỏ; nâu đậm `#4a2216`(suy ra) trên kem.
6. **Chuyển động**: (a) panel section slide-up (parallax, 100% chiều cao); (b) **mì kéo dài đàn hồi** + giọt sốt (soft-body/spline stretch) bắc cầu giữa 2 section; (c) helix xoay và xoắn thêm (twist ~1–1,5 vòng trên toàn cuộn); (d) nguyên liệu quay quanh trục dọc (orbit) + tự xoay; (e) rơi xuống đĩa với ease-in + scatter ngẫu nhiên → settle; (f) callout fade/draw-line; (g) chữ headline thay bằng fade+rise theo dòng.
7. **Mốc thời gian**: hero 0–1,4; panel-in 1,4–2,8; helix/ballet 2,8–5,6; rơi xuống đĩa 5,6–6,4; final settle 6,4–7,7 s. Mỗi chuyển section ≈ 1,2–1,5 s video (tương ứng ~1 viewport cuộn).
8. **Mapping scroll**: cuộn xuống = chuyển section; vật thể chính đi **từ trên xuống dưới** (nĩa trên → mì rơi → đĩa dưới); chữ "SECTION 01/03" và chấm phân trang đồng bộ. Có vẻ **scrub liên tục** (khung trung gian nội suy: mì kéo dài theo vị trí cuộn). Cuộn ngược: not observable.
9. **Hover/chuột**: **not observable** (không thấy con trỏ; nút "EXPLORE THE MENU", "SCAN NOW", "RESERVE A TABLE" chỉ là nhìn thấy).
10. **Phải là WebGL thật**: nĩa + ổ mì (hero), **sợi mì procedural (nhiều Tube)**, tôm/vẹm/cà chua/húng, đĩa, bàn, hơi nóng; **scroll-scrub** biến "xoắn ốc" → "đĩa". **DOM**: chữ, nút, callout leader lines (SVG), phân trang. Không dùng video món ăn làm cảnh chính.

## Dựng bằng Three.js (Cảnh B — Restaurant)

- **Spaghetti**: 120–180 sợi, mỗi sợi `TubeGeometry(curve, 64, 0.011, 6)` hoặc **một shader duy nhất**: mỗi sợi là dải `InstancedBufferGeometry` với thuộc tính `aSeed`, vị trí tính trong vertex shader theo `uProgress` ∈ [0,1] giữa 3 trạng thái: (A) *xoắn nĩa* (helix bán kính 0,35 quấn quanh trục nghiêng), (B) *ballet* (helix cao, bán kính 0,5, twist theo y), (C) *nest* (xoắn ốc dẹt trên đĩa: r = 0,12 + 0,02·θ, y = 0,02·sin(3θ) + rối noise). Nội suy `mix(A,B,smoothstep(0,.5,p))` rồi `mix(B,C,smoothstep(.5,1,p))`. Vật liệu `MeshPhysicalMaterial({ color:'#e8b787', roughness:0.38, clearcoat:0.25, sheen:0.2, sheenColor:'#fff0c8' })` + vertex-color ngẫu nhiên ±6% độ sáng.
- **Kéo dài giữa 2 section** (frame 2,1–3,0 s): thêm uniform `uStretch` kéo các điểm cuối của sợi theo −y (curve mở rộng + giảm bán kính), kèm một "giọt sốt" = `SphereGeometry` scale y 1,6 trượt xuống theo `uStretch`.
- **Tôm**: `TubeGeometry` trên `CatmullRomCurve3` cong chữ C, bán kính thay đổi (`radius = base*(1-0.7*t)`), 7 đốt bằng displacement sin; `MeshPhysicalMaterial({ color:'#e8864f', roughness:0.4, thickness:0.6, transmission:0.15 })`. **Vẹm**: nửa vỏ = `SphereGeometry` cắt/scale (1, 0.45, 0.6) + noise vân, `{ color:'#15151f', roughness:0.15, clearcoat:1 }`. **Cà chua bi**: sphere nhẹ lệch, `{ color:'#c9301d', roughness:0.2, clearcoat:1 }` + cuống 5 cánh. **Húng**: `ShapeGeometry` lá + uốn nhẹ, `DoubleSide`, `{ color:'#3f7a2a', roughness:0.55 }` + alphaMap gân.
- **Đĩa**: `LatheGeometry` profile (r,y): (0,0.02)→(0.55,0.02)→(0.62,0.05) lòng→(0.78,0.09)→(0.95,0.12) viền→(1.0,0.115)→(0.98,0.08)→(0.8,0.0)→(0,0); `{ color:'#f3efe6', roughness:0.26, clearcoat:0.6, clearcoatRoughness:0.2 }`. Bàn: plane kem `#eee7d2` + `ContactShadows` (opacity 0,4, blur 3).
- **Env**: Lightformer softbox lớn trên-trái (`[−3,5,2] scale [6,3] intensity 3.5`), strip ấm cam phải (`#ffc999`, intensity 1,5); `Bloom` nhẹ (0,2) cho highlight sốt. Nền DOM đổi `#682319 → #eee7d2` (canvas alpha).
- **Hybrid**: nên prototype shader mì trên 1 ổ trước (kiểm tra FPS mobile); fallback = giảm sợi xuống 60 + tăng bán kính.

### Storyboard camera/scroll (0/25/50/75/100%)

| % | Camera | Cảnh |
|---|---|---|
| 0 | pos [0,0.2,5], target [0,0,0], FOV 26, pitch 0° | hero burgundy; nĩa+mì lệch phải; text trái |
| 25 | pitch +8° (nhìn xuống), pos [0,0.5,5.2] | panel kem trượt lên; mì kéo dài qua ranh giới; nĩa mờ dần ra khỏi khung |
| 50 | pos [0,0.2,6.5] FOV 32 (lùi) | helix cao giữa khung, nguyên liệu orbit r 1,2, 1 vòng; callout hiện |
| 75 | pos [0,1.6,5.5] pitch +24° | helix gục xuống, nguyên liệu rơi (curl noise), đĩa trồi lên y −2 → −0,3 |
| 100 | pos [0,2.2,4.6] pitch +30°, target [0,0.1,0] | đĩa hoàn chỉnh; hơi nóng; CTA "RESERVE A TABLE" (DOM, không có chức năng đặt bàn) |
