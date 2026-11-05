# F — Concept landing "Cybertruck" (xe điện, 3 chương) — phân tích kỹ thuật

- URL: https://www.pinterest.com/pin/688065649311070896/
- Trạng thái: **VERIFIED (media)** · Loại: video **4:3 — 640×480**, 14,38 s, không loop trên trang pin · ngày upload trong JSON-LD 21/07/2020 (mô tả pin ghi 27/06/2026 → chỉ là ngày repin; video có thể từ 2020)
- Người đăng công khai: pinner **Dashazlobina** (`dashazlobina0_0`); trường creator của video: "farai futi". Tiêu đề: "Tesla template [Video]". **Không có link ngoài / nguồn gốc xác minh được**; không biết dựng bằng gì (Principle/After Effects/Cinema 4D/WebGL?) → **UNVERIFIED về công nghệ gốc**.
- Bản chất: concept web hiển thị trong khung màu tan (khung ngoài: nửa trên `#c9b89a`, nửa dưới `#a6967d` — hai dải chia ngang như đường chân trời), nội dung trang là **ảnh render 3D xe** (low-poly bo mịn) trên nền sa mạc. **Có logo/wordmark Tesla + hình dáng Cybertruck → không dùng logo/tên/hình dáng giống hệt**.
- Bằng chứng: `shots/F-page.jpg`, `F-contact.jpg` (15 khung: t = 0; 1,03; 2,05; 3,08; 4,11; 5,14; 6,16; 7,19; 8,22; 9,25; 10,27; 11,30; 12,33; 13,36; 14,33 s), `F-v000…v100.jpg`.
- "Viewport" = trang web trong khung (≈ 600×338 px; x 21–620, y 70–408 trong khung 640×480).

## Timeline quan sát (giây video)

| t (s) | Chương | Quan sát |
|---|---|---|
| 0–1,5 | **Hero** | tag graffiti viết tay "CYBERTRUCK" + tagline HOA ("BETTER UTILITY THAN A TRUCK / WITH MORE PERFORMANCE THAN A SPORTS CAR"); xe nhìn **3/4 trước-trái**, thấp, trên cát; thanh tiến độ dưới ở vị trí 1; cursor ring tròn nhỏ ở 1,0 s |
| 1,5–3,0 | chuyển → **.01** | xe xoay về **cạnh hông**, tag + tagline mờ, tiêu đề ".01 PERFORMANCE AND EFFICIENCY" fade-in (xám → đen), cột chỉ số bên phải hiện dần |
| 3,0–7,0 | **.01 PERFORMANCE AND EFFICIENCY** | xe nhìn **chính ngang (side profile)**, bánh quay + bụi mờ ở bánh, dải **xanh lam nhạt** (underglow) dưới ngưỡng cửa; bảng chỉ số phải: RANGE **500** MILES · TOWING CAPACITY **10k+** LBS · ACCELERATION 0-60mph **2,9s** + "LEARN MORE" gạch chân; cursor dạng viên thuốc (pill) ở 7,2 s |
| 7,0–8,3 | chuyển → **.02** | thân xe **nâng lên**, gầm/bánh tách ra; vật liệu **chuyển từ inox sang "đất sét" xám-be**, ".02 EXOSKELETON" thay ".01" |
| 8,3–11,0 | **.02 EXOSKELETON** (exploded) | xe nhìn 3/4 trước-phải **từ góc cao (~20°)**, thân inox xám-be (clay) nâng cao ~0,25 m so với khung gầm; **bánh/khung gầm gần trong suốt (ghost/trắng ngà)**; thông số phải: GLASS — TESLA ARMOR GLASS; BODY — ULTRA-HARD 30X STAINLESS STEEL; "LEARN MORE" |
| 11,0–12,2 | chuyển → **.03** | xe xoay về hướng đuôi; tiêu đề ".02 EXOSKELETON" mờ chồng ".03" |
| 12,3–14,4 | **.03 VERSATILE UTILITY** | xe nhìn **3/4 sau-trái**, **dải đèn hậu đỏ phát sáng** (`~#e8383d`), thùng sau; danh sách phải (đánh dấu mục active bằng vạch dọc): VAULT-LIKE STORAGE · RUGGED STRENGTH · ADAPTIVE AIR SUSPENSION · AWESOME ADAPTABILITY |

## 10 điểm kỹ thuật

1. **Vị trí & tỉ lệ**: hero — xe rộng ~49% trang, cao ~35%, tâm (54%, 64%) (thấp, chân xe chạm 85% chiều cao). .01 — xe rộng ~59%, cao ~33%, tâm (50%, 61%). .02 — xe rộng ~60%, cao ~46% (do nâng + góc cao), tâm (50%, 60%). .03 — rộng ~52%, cao ~44%, tâm (56%, 62%). Chữ chiếm cột trái (x 5–35%) và cột phải (x 70–95%); xe luôn nằm giữa hai cột, **chồng nhẹ lên vùng text trái** ở .01/.02 (ưu tiên layering: xe trên text).
2. **Camera** (render): hero — **3/4 trước-trái, yaw ≈ 35°, pitch ≈ 6°**, thấp (cao ~0,9 m), FOV ≈ 25–30°; .01 — **side profile yaw 90°** (gần orthographic), pitch ≈ 2°; .02 — **3/4 trước-phải, yaw ≈ −30°, pitch ≈ 18–22°**, FOV ≈ 30°; .03 — **3/4 sau-trái, yaw ≈ 150°, pitch ≈ 12°**. Camera **orbit quanh xe** (xe đứng yên, nền cát/bầu trời xoay nhẹ theo parallax), target = tâm thân xe; khoảng cách gần như không đổi.
3. **Nền/môi trường/ánh sáng**: sa mạc — trời xanh nhạt xám `#c1d7db`/`#bdd4da` (đo), mây trắng mờ, nền cát `#cfc3ae`/`#aea9a0` (đo), chân trời mờ sương; khung ngoài tan `#c9b89a`/`#a6967d`. Ánh sáng: ban ngày mây mỏng — key khuếch tán trên-trái (mềm), bóng đổ xám mềm bên phải xe, **không có tia nắng cứng**; env phản chiếu trời xanh nhạt + cát lên thân inox (thân xe `#d8d9d8`, vùng tối `#292927`/`#474846`); underglow xanh lam nhạt (ước lượng bằng mắt `~#6fb7ff`), đèn hậu đỏ phát sáng.
4. **Vật liệu**: **inox xước/thép không gỉ** (thân phẳng, metalness cao, roughness ≈ 0,3–0,4, phản chiếu mờ trời/cát) — thấy phản chiếu bầu trời xanh nhạt + cát dải ngang; **kính tối** đen xanh (`#0a0c10`, roughness thấp, phản chiếu nhẹ); **lốp cao su đen** `#1a1917`, **mâm** xám nhôm có khe; nhựa đen chi tiết (vè bánh, cản); **.02**: thân đổi sang **clay/matte xám-be** (`#c4baa9`/`#9b9488`) hoặc ghost transparent cho bánh/khung — hiệu ứng "x-ray/exploded".
5. **Typography & UI**: tag graffiti viết tay (hand-lettered) đen; tagline sans HOA tracking rộng ~1,5% cao trang; tiêu đề chương — grotesque **đậm hẹp** (DIN/Bahnschrift-condensed style) đen, ".01" nhẹ hơn tiêu đề; mô tả 7 px xám; **bảng thông số** phải: nhãn nhỏ HOA xám + giá trị lớn đậm (500, 10k+, 2.9s) + đơn vị nhỏ, ngăn bằng đường mảnh; "LEARN MORE" HOA gạch chân; nút đen chữ trắng "ORDER NOW" góc dưới phải; icon social (facebook/youtube/twitter) trái dưới; **thanh tiến độ** dưới giữa — track gạch chéo (hatched) xám dài ~55% trang + thumb tối ngắn (~8% track) dịch sang phải mỗi chương; **cursor ring** viền mảnh (tròn → viên thuốc) xuất hiện 1,0 s, 7,2 s, 8,5 s.
6. **Chuyển động**: (a) **camera orbit** giữa các chương (yaw 35° → 90° → −30° → 150°) ~1,2–1,5 s mỗi lần, ease-in-out; (b) bánh xe quay + bụi (particle mờ) ở .01; (c) **exploded**: thân translateY +0,25, bánh/khung tách dọc/ngang (~0,15–0,2 m), vật liệu chuyển clay/ghost (~0,6 s); (d) text chương cũ fade-out (opacity 1→0 + nhẹ translate) và chương mới fade-in; bảng chỉ số trượt/fade từ phải; (e) progress thumb dịch phải; (f) đèn hậu **phát sáng bật dần** (emissive 0→1) ở .03; (g) nền mây/cát parallax nhẹ ngược chiều xe.
7. **Mốc thời gian**: hero 0–1,5; xoay → .01: 1,5–3,0; .01 hold 3,0–7,0; → .02: 7,0–8,3; .02 hold 8,3–11,0; → .03: 11,0–12,2; .03 hold 12,3–14,4 s (±0,3 s).
8. **Mapping scroll**: chuỗi **chương rời** (snap-like) hơn là scrub liên tục — mỗi chương giữ ~3–4 s rồi chuyển ~1,2 s; thanh tiến độ bên dưới tăng theo chương → gợi ý scroll/wheel dẫn **chương tiếp theo** (cursor ring/pill = custom cursor khi cuộn). Chiều: chương tăng = progress thumb sang phải, text cột trái đổi, xe xoay **luân phiên trái→phải→sau**. Không quan sát được cuộn ngược; không biết có scrub nội suy hay không.
9. **Hover/chuột**: **not observable** (chỉ có custom cursor ring/pill cho thấy trang có custom cursor; không có phản ứng lên xe).
10. **Phải là WebGL thật**: xe + bánh quay + exploded view (thân/khung/bánh tách), vật liệu inox ↔ clay ↔ ghost, dải underglow/đèn hậu, bụi bánh, nền sa mạc (ground + sky gradient), camera orbit scroll-driven. **DOM**: toàn bộ chữ, bảng thông số, progress bar, cursor tùy biến, nút. Không dùng ảnh render xe làm cảnh. **Phải tránh**: copy hình dáng Cybertruck + logo Tesla (trade dress/trademark) → dựng **xe điện bán tải/GT hư cấu của BAHA** với cùng cơ chế.

## Dựng bằng Three.js (Demo 5 — Automotive)

- **Thân xe**: thân góc cạnh = `ExtrudeGeometry` từ polygon silhouette cạnh hông (độ dày 1,9 m, `bevelEnabled` thickness 0,03 size 0,03 segments 2) + `flatShading: true`; hoặc `BufferGeometry` mặt phẳng tự xây từ 14–20 đỉnh (kiểu "origami") rồi `computeVertexNormals` theo mặt; kính = các mặt phẳng tách mesh riêng; chia nhóm: `body`, `glass`, `trim`, `wheelAssemblies[4]`, `chassis`, `lightbar` để exploded.
- **Bánh**: lốp = `LatheGeometry` profile hoặc `TorusGeometry(0.33, 0.12, 24, 48)` scale; mâm = `CylinderGeometry` + 5 khe (CSG hoặc extrude shape); normalMap tread canvas; quay `rotation.x += speed·dt`; bụi = `Points` với shader alpha mờ sinh phía sau bánh khi `speed>0`.
- **Vật liệu**: *inox*: `MeshPhysicalMaterial({ color:'#d6d8d9', metalness:1, roughness:0.32, anisotropy:0.6, anisotropyRotation:Math.PI/2, envMapIntensity:1.3 })` + `roughnessMap` nhiễu xước ngang; *sơn* (biến thể màu): `{ color, metalness:0.6, roughness:0.25, clearcoat:1, clearcoatRoughness:0.08 }`; *kính*: `{ color:'#0a0c10', roughness:0.05, metalness:0, transmission:0, envMapIntensity:1.5 }`; *ghost*: `{ transparent:true, opacity:0.35, depthWrite:false, color:'#f2efe6' }`; *clay*: `{ color:'#c4baa9', roughness:0.9 }`; *đèn hậu*: `MeshBasicMaterial('#e8383d')` + bloom, emissive tween.
- **Env/ánh sáng**: sa mạc studio — `Lightformer` softbox lớn trên (`[0,6,2] scale [10,4] intensity 2.5`), dải ngang dài tạo phản chiếu dọc thân (`[0,1,−6] scale [14,0.6] intensity 3`), tấm bounce cát ấm dưới (`#d9c9a8`, intensity 1,2); nền `scene.background` gradient `#c1d7db → #e4dbcb` + `fog('#cfc3ae', 12, 40)`; sàn = plane lớn `#cfc3ae` với `ContactShadows` (opacity 0,5, blur 2,5) hoặc `MeshReflectorMaterial` rất mờ (mixStrength 0,25). Hover: tween `emissive`/rim theo vùng (cửa, bánh, đèn).
- **Điều khiển**: `ScrollControls` hoặc GSAP ScrollTrigger scrub; orbit tay (OrbitControls, `enablePan:false`, `minPolarAngle` 0,9, giới hạn zoom) **chặn** khi scrub đang chạy (đổi quyền điều khiển có damping); nút "Reset view".

### Storyboard camera/scroll (0/25/50/75/100%)

| % | Camera (yaw, pitch, khoảng cách) | Cảnh |
|---|---|---|
| 0 | yaw 35°, pitch 6°, d = 9, FOV 28, target [0,0.8,0] | hero 3/4 trước, chữ tag + tagline; xe sơn bạc inox; thanh tiến độ 1 |
| 25 | yaw 90°, pitch 2°, d = 10 (gần ortho) | side profile; bánh quay, bụi, underglow xanh; hiện bảng chỉ số 500 / 10k+ / 2.9s |
| 50 | yaw −30°, pitch 20°, d = 8,5 | **exploded**: thân +0,3 m, bánh tách, vật liệu clay/ghost; nhãn GLASS/BODY |
| 75 | yaw 150°, pitch 12°, d = 9 | 3/4 sau, đèn hậu bật, thùng sau mở/nâng nắp (nếu asset cho phép); danh sách tính năng |
| 100 | yaw 210°→ rồi về 35°, pitch 8°, d = 7,5 | final cinematic: kéo gần, hơi orbit trở lại hero; đổi 3 màu sơn; "ORDER NOW" (DOM, không có chức năng mua) |
