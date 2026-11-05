# E2 — "JACKET MASTERS" (áo puffer, đổi màu = đổi cả trang) — phân tích kỹ thuật

- URL: https://www.pinterest.com/pin/1093671090781192414/
- Trạng thái: **VERIFIED (media)** · Loại: video **vuông 720×720** (JSON-LD: 1080×1080), 8,68 s, không loop · 2.609 repin
- Người đăng công khai: **Nicolai Palmkvist** (Pinterest `nicolaipalmkvist`); caption "Check this out ❄️🔥 #Elementor #webdesign #design #elementorpro" → trang dựng bằng **Elementor** (WordPress). Ngày đăng JSON-LD 01/05/2026 (mô tả trang ghi 17/08/2026 — hai nguồn lệch, chưa xác minh được ngày thật). Không có URL ngoài.
- Bản chất: **screen-capture/mockup**: khung trình duyệt bo góc **nổi** trên nền gradient cam→hổ phách (kiểu showcase Dribbble/Behance), nội dung trang là hero **store "JACKET MASTERS"**. Áo trông là **ảnh/render cutout 2D** (có dấu hiệu AI/3D render) lơ lửng + bóng elip; chữ rõ nét, **không** có dấu hiệu méo — đây là nguồn chữ/UI đáng tin nhất trong 8 link.
- Bằng chứng: `shots/E2-page.jpg`, `E2-contact.jpg` (12 khung: t = 0; 0,79; 1,58; 2,37; 3,16; 3,95; 4,74; 5,53; 6,32; 7,10; 7,89; 8,63 s), `E2-v000…v100.jpg`.
- "Viewport" = khung trình duyệt (≈ 590×280 px/600 px khung video).

## Chuỗi biến thể quan sát (giây video)

Danh sách màu theo thứ tự điều hướng nội suy từ thumbnail "kế tiếp" ở góc dưới phải: **Cam → Đen → Bạc/Trắng → Đỏ → (quay lại Cam)**. Video đi tới/lui bằng hai mũi tên `‹ ›` cạnh headline (con trỏ nhỏ thấy ở 0 s và 4,7 s).

| t (s) | Màu | Nền khung |
|---|---|---|
| 0–0,3 | Đen/than (thumb kế: trắng) | `#282725` |
| 0,8 | Cam (thumb kế: đen) | `#e66914`→`#b85613` |
| 1,6 | **chuyển** — áo cam mờ bay lên-trái, áo đen vào giữa | cam→đen |
| 2,4 | Đen (thumb: trắng) | `#282725` |
| 3,2 | Bạc/trắng (thumb: đỏ) | `#bbc1c6`→`#7c8286` |
| 4,0 | Đỏ | `#a80102`→`#780505` |
| 4,7 | Bạc (lùi) | `#bbc1c6` |
| 5,5 | Đen (thumb: trắng) | `#282725` |
| 6,3–7,1 | Cam (thumb: đen) | `#e66914` |
| 7,9 | Đen | `#282725` |
| 8,6 | Bạc (thumb: đỏ) | `#bbc1c6` |

→ mỗi lần đổi ≈ 0,8–0,9 s (nhanh vì người thao tác bấm liên tục); **mỗi màu giữ lâu nhất ~1–1,5 s** trong video.

## 10 điểm kỹ thuật

1. **Vị trí & tỉ lệ**: trong khung trình duyệt — áo hero rộng ~23% và cao ~47% khung, tâm ≈ (43%, 52%) (hơi lệch trái tâm để chừa cột giá bên phải), bóng elip ở y ≈ 85% (rộng ~14%); **thumbnail màu kế tiếp** ~9% rộng ở góc dưới phải (x≈ 90%, y ≈ 82%); headline chiếm x 5–35%; cột giá/size x 80–96%. Khung trình duyệt chiếm ~98% bề rộng video, y 23–77% (nền cam bao quanh trên/dưới).
2. **Camera** (ảnh): chính diện, ngang tầm ngực, nhìn xuống ≈ 3–6°, tele FOV ≈ 20°; áo **lơ lửng** (không có mặt bàn), không xoay trong clip — chuyển đổi chỉ bằng scale/translate/fade giữa hai ảnh; không thấy orbit.
3. **Nền/ánh sáng**: **nền cả trang = màu biến thể** (xem bảng), dạng radial/linear gradient: tâm sáng, rìa tối (vignette `#a80102→#780505` với đỏ; `#bbc1c6→#7c8286` với bạc). Nền ngoài khung: gradient dọc **`#fe5702` (trên) → `#fe9802` (dưới)** (đo). Key mềm trên-trước, rim yếu; phản chiếu highlight dọc theo mép baffle; bóng elip mờ `rgba(0,0,0,.35)` dưới áo.
4. **Vật liệu**: áo puffer nylon **bóng (ciré)** ở cam/đỏ — highlight cứng dọc mỗi baffle (roughness ≈ 0,25–0,3, clearcoat ≈ 0,6–0,8); **đen/than**: bóng nhẹ, highlight xám; **bạc/trắng**: satin mờ hơn (roughness ≈ 0,4, sheen). Baffle ngang (torso ~6 ống, tay ~5 ống), cổ đứng cao, bo gấu thun; nếp nhăn nhỏ ở khuỷu và gấu.
5. **Typography & UI**: logo "Jx JACKET MASTERS" serif nhỏ ở trái trên; **nav pill** giữa trên (nền tối mờ bo tròn; mục active = pill trắng "PUFFER JACKET", sau đó ALL PRODUCTS, ABOUT US, CONTACT xuống dòng 2); headline **"Stand out / Without trying"** sans hình học (Montserrat Medium), trắng, ~9% chiều cao khung/dòng, căn trái; mô tả 5 dòng nhỏ; nút trắng "Get the look ›"; **giá "$149"** (~7%) + **"$199" gạch ngang** (mờ hơn); "Choose your size" nhỏ; 3 chip tròn **36/38/40** (36 active trắng, 38/40 xám tối); tagline giữa dưới "Confidence, wrapped in warmth" (Montserrat, 2 dòng căn giữa); social icons trái dưới; icon giỏ/yêu thích phải trên. Chữ trắng nhìn rõ trên than/cam/đỏ, **kém** trên bạc (tương phản thấp) → ở bản dựng dùng chữ than trên nền bạc.
6. **Chuyển động**: (a) áo hiện tại **trôi lên-trái, nhỏ lại ~0,35× và mờ (blur + opacity)** trong ~0,6 s; (b) áo kế tiếp **phóng từ thumbnail** (scale ~0,35→1, từ góc dưới-phải về tâm) với ease-out; (c) **nền cả khung crossfade** qua tông trung gian (thấy tông hồng-nâu `#b07a7a` ở giữa khi trắng→đỏ); (d) text không đổi (ngoại trừ màu có thể); (e) bob lơ lửng nhẹ (~±1% chiều cao, chu kỳ ~2,5 s) + bóng co giãn theo.
7. **Mốc thời gian**: mỗi lần đổi biến thể ~0,8 s (0,0–0,3 giữ; 0,3–0,8 vào; thực tế liên tục do bấm nhanh); chu kỳ đủ 4 màu ≈ 4–6 s.
8. **Mapping scroll**: **not observable** — điều hướng bằng mũi tên/click thumbnail, không phải scroll.
9. **Hover/chuột**: **not observable** (chỉ thấy con trỏ nhỏ).
10. **Phải là WebGL thật**: áo puffer 3D (lơ lửng, xoay, đổi màu vật liệu thật giữ phản chiếu nylon), bóng elip, backdrop gradient shader/CSS đồng bộ; **thumbnail "màu kế tiếp"** = mesh nhỏ thứ hai (viewport phụ/`<View>` của drei) hoặc ảnh chụp render; **DOM**: tất cả chữ, giá, chip size, nav. Không dùng ảnh PNG áo thay mô hình.

## Dựng bằng Three.js (Demo 4 — Fashion, phương án "puffer jacket hero")

- **Hình học puffer (procedural)**: *thân* = bề mặt tham số (u quanh 0..2π, v dọc 0..1) bán kính `r(v) = R(v)·(1 + 0.12·pow(|sin(π·N·v)|, 0.6))` với N=6 (baffle phồng, rãnh nhọn), `R(v)` thu nhỏ ở eo/gấu; mặt trước tách đường khóa kéo (đường rãnh sâu + `TubeGeometry` r 0,008 màu `#222`); *tay* = 2 `TubeGeometry` trên `CatmullRomCurve3` có khuỷu, bán kính baffle N=5, cuff thun ở cổ tay; *cổ* = lathe cao 0,18 có 1 baffle; gộp bằng `mergeGeometries`; 128×192 đoạn, `computeVertexNormals`; thêm noise nhỏ làm nếp nhăn.
- **Vật liệu**: `MeshPhysicalMaterial({ color, roughness:0.28, metalness:0, clearcoat:0.7, clearcoatRoughness:0.25, sheen:0.3, sheenColor, normalMap:crinkle(0.3) })`; 4 biến thể đo từ video: **than `#2b2a28`**, **cam `#e8691a`**, **bạc `#b8bec4`** (roughness 0,4, clearcoat 0,3), **đỏ `#a80102`** (nền tương ứng ở trên).
- **Nền đồng bộ**: một object `{ bg0, bg1, text }` cho mỗi biến thể; GSAP timeline tween `mesh.material.color`, CSS variables (`--bg0/--bg1/--fg`) và `DirectionalLight.color` cùng lúc 0,7 s `power2.inOut`; tránh tween opacity cả canvas.
- **Lơ lửng + bóng**: `useFrame` bob `y += sin(t·2.4)·0.03`; bóng = `ContactShadows` (opacity 0,5, scale 3, blur 2,8, far 1,2) đặt dưới áo; tỉ lệ co giãn ngược với y.
- **Thumbnail kế tiếp**: drei `<View>` (scissor) hoặc `RenderTexture` hiển thị mesh áo màu kế tiếp, scale 0,35, góc dưới-phải; khi chuyển → tween vị trí/scale về tâm.
- **Env**: studio — Lightformer softbox trên (`[0,4,3] scale [6,3] intensity 3`), 2 dải đứng cho highlight baffle (`[±3,1,1] scale [0.5,5] intensity 2.2`), nền tối đáy.
- **Lưu ý khó**: puffer procedural cần thử nghiệm sớm; nếu không đạt, đổi sang phương án rack (E1) hoặc asset được cấp phép.

### Storyboard camera/scroll (0/25/50/75/100%) — đề xuất scroll-scrub thay cho nút bấm

| % | Camera | Cảnh |
|---|---|---|
| 0 | pos [0,0.2,5], target [0,0,0], FOV 24 | áo than ở tâm-trái, nền than; thumbnail bạc dưới phải; headline "Stand out Without trying" |
| 25 | orbit yaw −60° | **áo xoay turntable** (cạnh bên), nền chuyển than → cam `#e66914`; thumbnail → đen |
| 50 | yaw −180°, dolly 4,2 | mặt lưng, zoom chi tiết baffle + khóa kéo; nền cam → bạc |
| 75 | yaw −300°, FOV 20 | màu bạc → đỏ; highlight quét dọc baffle (hover-lighting) |
| 100 | yaw −360° (về chính diện), pos [0,0.1,5.2] | đỏ ở hero; giá $149 / chip size (DOM) hiện; bob nhẹ |
