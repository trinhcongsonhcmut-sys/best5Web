# Giám khảo độc lập — V2 Automotive (`/automotive`, AXIOM GT)

- Ngày: 05/11/2026 · Giám khảo không viết code này · chỉ đọc mã nguồn, không sửa.
- Điều kiện tự kiểm: `vite` dev :5199, Chrome (channel chrome, headless, `--use-angle=d3d11`), Intel HD 530, DPR 1 (zoom crop DPR 2). Script độc lập + log: `shots/automotive-judge-log.json`.
- FPS chính thức (production, đo bởi điều phối): idle 68.3 / scroll 62.2 fps, p95 26.7 ms, worst 53.6 ms, cold ready 3.6 s, 0 console error.
- Chuẩn hình ảnh: `reference/v2/automotive-ref-1.webp` · chuẩn chuyển động/UI: `baseline/v1/automotive/MOTION_SPEC.md`.
- Không trừ điểm: xe là CarConcept (CC-BY 4.0) thay mẫu thương hiệu, có dòng ghi công, đã gỡ logo Khronos (đã kiểm: không thấy logo ở mâm, đuôi, mũi).

## Điểm: **70 / 100** (mục tiêu ≥ 90 → KHÔNG ĐẠT)

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| 3D / photoreal | **18/30** | GLB thật, PBR, HDRI, asphalt PBR, đèn hậu đỏ hắt xuống đường là điểm tốt. Nhưng sơn trông lì như phấn/thạch cao, có hạt nhiễu, hầu như không phản chiếu trời và đường chân trời. Ốp sườn dưới đen tuyền như lỗ hổng. Mâm xe đen bệt. Núi procedural loang lổ và có vết nối khối. |
| Animation & tương tác | **25/30** | Orbit 360°, 4 biến thể, hover theo phần và cuộn xuôi/ngược khôi phục chính xác (Δ = 0) đều đạt. Storyboard v1 (hero → profile → mở khối → đuôi xe → final) được giữ. Trừ điểm vì hover còn nhạt và cảnh mở khối (.02) trông như mô hình bị vỡ. |
| Bám mẫu v2 | **11/20** | Tông hoàng hôn vàng cam, đường đèo, xe trắng góc 3/4 trước đều đúng. Thiếu lớp sơn bóng gương, các lớp núi mờ sương, mây hoàng hôn kịch tính, sườn đồi có bụi cây và chất asphalt thật. |
| Frontend | **8/10** | Giữ nguyên UI v1, typography mạnh, có dòng ghi công. Chữ ở mốc 75% đè lên dải núi nên khó đọc. Tiêu đề final gần như biến mất khi orbit nhìn từ trên. |
| Hiệu năng & ổn định | **8/10** | ~62–68 fps, 0 lỗi. p95 26.7 ms nghĩa là có khoảng 5% khung hình khựng (dưới 37 fps). |

## Hạng mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | PASS | GLB `CarConcept.baha.glb` render WebGL; camera đổi thật (log `scroll.fwd`). |
| Orbit 360° | PASS | 8 bước × 135 px, mỗi bước −0.783 rad, sau 8 bước yaw = 0.019 (đủ một vòng); `resetView` → yaw 0. `shots/automotive-sheet-orbit-p0/p50/p100.jpg` |
| ≥ 3 biến thể đổi vật liệu thật | PASS | `primary`: #e9e7e2 / #7e0b14 / #2c2e33 / #7d5a3a, metalness 0.06→0.78, clearcoat 1 giữ nguyên. `shots/automotive-sheet-variants.jpg` |
| Hover có phản hồi nhìn thấy | PASS (nhạt) | body/glass/wheels: hover.value = 1, rim 0.82; rời chuột về 0. Chênh pixel trung bình chỉ 5.15/255. `shots/automotive-sheet-hover.jpg` |
| Scroll mượt + khôi phục | PASS | Cuộn ngược 0.75/0.5/0.25/0 cho Δcamera = 0.0000. Wheel giật 32 nhịp xong `scrollTo(0.3)` khôi phục Δ = 0. Khung tệ nhất 66.7 ms (dev). |
| Không crash/trắng | PASS | 0 error, chỉ có 1 warning `THREE.Clock deprecated`. Không tràn ngang ở 1920/1440/390. |
| Không dùng ảnh/video giả 3D | PASS | Nền là shader/HDRI, xe là mesh thật. |
| Không low-poly/cartoon làm sản phẩm cuối | PASS (sát ngưỡng) | Mesh đủ chi tiết, nhưng sơn và mâm trông như asset game (xem lỗi 1–2). |
| Cảm ứng | PASS | Vuốt ngang CDP → yaw −1.39, scroll không đổi. |

## Danh sách lỗi (theo mức nghiêm trọng)

1. **Sơn không photoreal: lì, có hạt, thiếu phản chiếu.** Gặp trên toàn bộ thân xe, mọi biến thể (carmine trông như nhung đỏ). Bằng chứng: `shots/automotive-zoom-door.png`, `automotive-zoom-front.png`, `automotive-sheet-variants.jpg`. Cách sửa:
   - Bỏ hoặc giảm mạnh normal/roughness noise (flake) trên base. Flake chỉ nên nằm ở lớp metal dưới clearcoat, scale rất nhỏ.
   - Đặt clearcoatRoughness khoảng 0.02–0.05 và envMapIntensity cho thân 1.5–2.5.
   - IBL phải có đường chân trời tương phản (trời sáng / đất tối) để thân xe phản chiếu một vệt horizon sắc như ảnh mẫu.
   - Kiểm tra lại PMREM tự render có đủ độ phân giải không (tối thiểu 256 mỗi mặt).
2. **Ốp sườn dưới và cản sau đen tuyền như lỗ hổng.** Gặp ở mọi góc. Bằng chứng: `automotive-zoom-door.png`, `automotive-orbit-p0-135.jpg`. Cách sửa: cho vật liệu này thành carbon hoặc nhựa nhám có màu (#1a1a1a, roughness 0.5, có normal weave) và envMapIntensity > 0, để nhìn ra khối và phản chiếu nhẹ.
3. **Phông núi procedural loang lổ, có vết nối hình hộp và cắt cứng với mặt đất.** Gặp ở orbit 135° (vách núi bậc thang hình chữ nhật ở bên trái) và mốc 75% (dải tím phẳng, chân núi cắt thẳng). Bằng chứng: `automotive-orbit-p0-135.jpg`, `automotive-scroll-fwd-0750.jpg`, `automotive-scroll-fwd-0000.jpg` (sườn đồi trái như vải rằn ri). Cách sửa:
   - Sửa hàm "extra local hill" để không còn bậc.
   - Thêm fog hoặc aerial perspective theo khoảng cách, làm 3–4 lớp núi mờ dần như ảnh mẫu.
   - Thêm dải chuyển tiếp ground–núi (vai đường, sỏi, bụi cây instanced).
   - Hoặc dùng HDRI có địa hình thật làm nền thay cho dải núi shader.
4. **Cảnh mở khối ".02 Open Architecture" trông như mô hình vỡ.** Nắp/clamshell trôi lơ lửng, lộ mép shell không có độ dày, hốc bánh đen, nội thất nâu thô. Bằng chứng: `automotive-zoom-explode.png`, `automotive-sheet-orbit-p50.jpg`. Cách sửa:
   - Giảm biên độ tách cho gọn và đối xứng.
   - Bật `side: DoubleSide` hoặc thêm mặt trong (inner skin) cho các tấm tách.
   - Phủ vật liệu trong hốc bánh (liner xám).
   - Thêm "structure lines" hoặc khung skate phát sáng như tinh thần v1 để đọc ra đây là chủ đích.
5. **Mâm/lốp đen bệt, nan mâm không thấy rõ; viền lốp có quầng cam lạ.** Bằng chứng: `automotive-zoom-front.png`, `automotive-scroll-fwd-0250.jpg` (viền cam quanh lốp). Cách sửa: tăng metalness/env cho mâm (gunmetal #3a3c40, roughness 0.3), lốp roughness 0.85 không nhận rim, và giới hạn rim/hover chỉ cho thân xe.
6. **Chữ khó đọc.** Đoạn mô tả ".03" và danh sách bên phải ở mốc 75% đè lên dải núi tím (`automotive-zoom-rear-text.png`). Tiêu đề final gần như biến mất khi orbit nhìn từ trên xuống mặt đường tối (`automotive-sheet-orbit-p100.jpg`, ô hàng 3 cột 2). Cách sửa: thêm scrim gradient sau khối chữ, hoặc tự đổi màu chữ theo độ sáng nền.
7. **Hover body nhạt** (chênh pixel 5/255). Cách sửa: tăng rim body lên khoảng 0.9–1.2 và thêm light sweep một lần như hover của beauty.
8. **Khựng nhẹ:** p95 26.7 ms, worst 53.6 ms. Cách sửa: giảm kích thước PMREM/IBL tự render, bake mây tĩnh và kiểm tra shader núi (fragment noise nặng).
9. **Mobile 390:** xe nhỏ, nửa dưới màn hình trống; danh sách mốc 75% bị xuống dòng ("−30 / MM"). Bằng chứng: `shots/automotive-sheet-390.jpg`. Cách sửa: tăng `k` portrait để xe lớn hơn, cho list một cột.

## Đủ chuẩn giới thiệu khách hàng?

**KHÔNG.** Phần tương tác và chuyển động tốt, giữ được tinh thần v1. Nhưng chất lượng hình ảnh mới ở mức "asset game / CG thời gian thực", chưa đạt photoreal hay ultra-luxury. Lý do chính là lớp sơn không có phản chiếu bóng gương (yếu tố quyết định cảm giác xe sang), ốp đen như lỗ hổng và phông núi lộ lỗi. Khách hàng sẽ thấy ngay khoảng cách so với ảnh mẫu.

## So với ảnh mẫu

- **Khớp:**
  - Bảng màu hoàng hôn cam vàng, mặt trời thấp.
  - Xe trắng ngọc, góc 3/4 trước, trên đường nhựa có vạch.
  - Dãy núi xa, mood ấm áp.
  - Đèn LED mảnh ở mũi xe.
- **Không khớp:**
  - Sơn: mẫu bóng gương, có vệt sáng trời chạy dọc nắp capo và cửa; v2 lì và có hạt.
  - Mâm: mẫu là mâm đen bóng có viền phanh cam; v2 đen bệt.
  - Phông: mẫu có sườn đồi đá, cây bụi và đường đất; v2 là đất phẳng nâu với núi procedural mờ nhòe.
  - Bầu trời: mẫu có mây tầng phản sáng; v2 ở góc hero chủ yếu là gradient.
  - Khung hình: mẫu dọc, xe chiếm khoảng 60% bề ngang; v2 ngang và xe nhỏ hơn. Chấp nhận được vì đây là website.
  - Khác biệt không trừ điểm: dáng xe (coupe concept thay sedan 4 cửa).
