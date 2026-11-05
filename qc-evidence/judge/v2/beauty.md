# Giám khảo độc lập — V2 Beauty (`/beauty`, BAHA botanica · Radiance Serum)

- Ngày: 05/11/2026 · Giám khảo không viết code này · chỉ đọc mã nguồn, không sửa.
- Điều kiện tự kiểm: `vite` dev :5199, Chrome (channel chrome, headless, `--use-angle=d3d11`), Intel HD 530, DPR 1 (zoom crop DPR 2). Script độc lập + log: `shots/beauty-judge-log.json`.
- FPS chính thức (production, đo bởi điều phối): idle 75.3 / scroll 72.7 fps, p95 13.5 ms, worst 133.4 ms, cold ready 7.5 s, 0 console error.
- Chuẩn hình ảnh: `reference/v2/beauty-ref-1.webp` · chuẩn chuyển động/UI: `baseline/v1/beauty/MOTION_SPEC.md`.
- Không trừ điểm: nhãn là thương hiệu BAHA ("RADIANCE serum · Vitamin C 15%") thay nhãn thương hiệu thật.

## Điểm: **78 / 100** (mục tiêu ≥ 90 → KHÔNG ĐẠT)

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| 3D / photoreal | **22/30** | Chai hổ phách transmission thật, thấy được dịch bên trong, nhãn BAHA in đẹp, collar có gân, lát cam có tép và màng múi, bokeh DOF. Nhưng "nước bắn" chỉ là các dải mỏng như màng nilon. Ánh sáng high-key phẳng, thiếu backlight xuyên thủy tinh. Có vệt specular hình lá lạ trên vai chai. |
| Animation & tương tác | **26/30** | Orbit 360°, 3 thế giới đổi toàn cảnh (thủy tinh, trái cây, chữ lớn), hover chai (rim, halo, sáng lên) và 5 ingredient có callout `.hot`, cuộn khôi phục chính xác. Storyboard v1 giữ đủ: unveil → actives → craft → ritual. Lát cam ở hero không hover được. |
| Bám mẫu v2 | **15/20** | Nền kem, chai dropper hổ phách nắp trắng, lát cam quanh chai, cam mờ ở góc, nhãn kem đều đúng. Thiếu vương miện nước bắn trong suốt, yếu tố đặc trưng nhất của mẫu. Lát cam nhỏ hơn và xa hơn. |
| Frontend | **8/10** | Typography biên tập đẹp, chữ "GLOW/BLOOM/CLEAR" khổng lồ đúng tinh thần v1. Ở mốc 50% callout "Vitamin C 15%" và "Hyaluronic acid" chen nhau, đường dẫn cắt qua viên nang. |
| Hiệu năng & ổn định | **7/10** | 72–75 fps, p95 13.5 ms tốt. Có khung 133 ms và cold ready 7.5 s (dev: 12 s), chậm gấp đôi automotive. |

## Hạng mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | PASS | Chai, nắp, ống hút, trái cây và splash là mesh WebGL. Bokeh là impostor làm mờ, chỉ là trang trí DOF, không thay sản phẩm. |
| Orbit 360° | PASS | 8 × 45°, yaw quay đủ vòng (0.019), reset về 0. Mặt sau nhãn thấy xuyên thủy tinh, không lộ lỗ. `shots/beauty-sheet-orbit-p0/p50/p100.jpg` |
| ≥ 3 biến thể đổi vật liệu thật | PASS | `primary` (glass) #f2b878 / #f2b2b9 / #b4cf8e, transmission 1, roughness 0.035 giữ nguyên. Cam/bưởi/chanh và nền đổi theo. `shots/beauty-sheet-variants.jpg` |
| Hover có phản hồi nhìn thấy | PASS | Chai: hover 1.0, rim 1.5, chênh pixel trung bình 11.2/255 (`shots/beauty-sheet-hover.jpg`). Ingredient 0–4 đều = 1 và callout sáng (`shots/beauty-hover-ingredient.jpg`). Rời chuột → 0. |
| Scroll mượt + khôi phục | PASS | Cuộn ngược 0.75/0.5/0.25/0 cho Δcamera = 0, kênh `dropperLift/explode/ingredients/splash` khớp. Wheel giật xong khôi phục Δ = 0. |
| Không crash/trắng | PASS | 0 error (1 warning `THREE.Clock deprecated`). Không tràn ngang ở 1920/1440/390. |
| Không dùng ảnh/video giả 3D | PASS | Sản phẩm là 3D thật. |
| Không low-poly/cartoon làm sản phẩm cuối | PASS (splash sát ngưỡng) | Chai và lát cam đạt. Splash trông như CG nhựa (lỗi 1). |
| Cảm ứng | PASS | Vuốt ngang → yaw −1.39, scroll không đổi. |

## Danh sách lỗi (theo mức nghiêm trọng)

1. **Nước bắn không giống chất lỏng.** Các ribbon mảnh, trong và vương miện nhỏ trông như màng nilon hoặc nhựa nhàu. Ảnh mẫu có một khối nước bắn lớn, dày, nhiều giọt, ôm quanh chai và là yếu tố quyết định vẻ "premium". Bằng chứng: `shots/beauty-zoom-splash.png`, `beauty-scroll-fwd-0000.jpg`. Cách sửa:
   - Dựng splash dày hơn: ống/sheet có độ dày, tube theo spline kèm noise displacement.
   - Vật liệu nước: transmission 1, ior 1.33, thickness 0.2–0.5, roughness 0, envMapIntensity cao. Thêm 30–60 giọt sphere có refraction, lớn nhỏ khác nhau.
   - Đặt một vương miện nước lớn phía sau và một bên cạnh chai như mẫu.
   - Hoặc xin Founder duyệt một GLB splash CC0.
2. **Ánh sáng phẳng, thiếu chiều sâu sang trọng.** Ảnh mẫu có backlight ấm xuyên thủy tinh hổ phách (lõi dịch phát sáng), highlight dọc cạnh chai và bóng tiếp xúc. V2 high-key đều, chai hơi "sticker". Bằng chứng: `beauty-zoom-label.png` so với ảnh mẫu. Cách sửa:
   - Thêm rim/back light ấm sau chai (rect light hoặc strip trong env).
   - Tăng attenuation để lõi dịch sáng hơn ở viền.
   - Thêm 2 strip dọc trong env tạo highlight thẳng đứng sắc trên thân chai.
   - Thêm contact shadow mềm khi chai đứng.
3. **Vệt phản chiếu hình "lá/lông vũ" lạ trên vai chai.** Bằng chứng: `beauty-zoom-label.png` (vùng vai). Cách sửa: kiểm tra env/HDRI `studio_small_09` với `environmentRotation`, bỏ hoặc xoay vật sáng nhỏ gây hình lạ, dùng softbox chữ nhật sạch.
4. **Callout chen nhau ở mốc 50%** ("Vitamin C 15%", "Hyaluronic acid"), đường dẫn cắt qua viên nang và chữ "W". Bằng chứng: `beauty-scroll-fwd-0500.jpg`. Cách sửa: tăng khoảng cách tối thiểu giữa nhãn trong solver tránh va chạm, hoặc cố định cột trái/phải theo góc quỹ đạo.
5. **Tải chậm, có khung khựng:** cold ready 7.5 s, worst frame 133 ms. Cách sửa:
   - Cache texture canvas (pulp/normal/bokeh) hoặc tạo trong worker.
   - Giảm HDRI 2k → 1k cho studio.
   - Tránh compile shader lúc đổi biến thể bằng cách `compileAsync` sẵn cả 3 thế giới.
6. **Mốc 25% ("Twist. Draw.") trống trải.** Trái cây và splash biến mất hết, chỉ còn chai lớn trên nền be nên mất độ giàu của hero. Bằng chứng: `shots/beauty-sheet-scroll.jpg`. Cách sửa: giữ 1–2 lát cam mờ ở hậu cảnh và vài giọt rơi từ ống hút.
7. **Lát cam hero không hover được** (chỉ chai có phản hồi). Bằng chứng: log `p0` hover = null tại 4 lát. Cách sửa: thêm rim nhẹ hoặc xoay nhẹ cho citrus khi rê.
8. **Lát cam hơi "sạch CG"**: vỏ thiếu lỗ chân lông và độ bóng dầu, mặt cắt chưa có độ ướt. Cách sửa: thêm clearcoat 0.6 cho mặt cắt (ướt) và normal dimple mạnh hơn cho vỏ.

## Đủ chuẩn giới thiệu khách hàng?

**KHÔNG (gần đạt).** Bố cục, bảng màu và sản phẩm chai đã rất gần mẫu, tương tác hoàn chỉnh, có thể dùng để demo nội bộ. Nhưng thiếu yếu tố "wow" của mẫu là khối nước bắn photoreal, và ánh sáng còn phẳng. Vì vậy chưa đạt mức ultra-luxury để đưa khách. Sửa lỗi 1–3 có khả năng đưa điểm lên khoảng 88–90.

## So với ảnh mẫu

- **Khớp:**
  - Nền kem sáng.
  - Chai dropper hổ phách nắp trắng có gân, nhãn kem kiểu serif và nhãn thương hiệu đặt giữa.
  - Lát cam lớn quanh chai, cam mờ out-of-focus ở các góc.
  - Bố cục trung tâm, tông cam ấm.
- **Không khớp:**
  - Nước bắn: mẫu có vương miện nước dày, phản sáng, nhiều giọt; v2 chỉ có ribbon mảnh.
  - Ánh sáng: mẫu chiếu ngược, dịch hổ phách phát sáng; v2 phẳng.
  - Lát cam: mẫu to, sát chai và chồng lên nhau; v2 nhỏ hơn và tách rời.
  - Mẫu có độ ướt và giọt nước bám trên cam; v2 khô.
  - Khác biệt không trừ điểm: v2 thêm chữ "GLOW" khổng lồ phía sau (giữ từ v1).
