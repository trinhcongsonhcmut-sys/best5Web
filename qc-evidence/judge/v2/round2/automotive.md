# Giám khảo độc lập — V2 vòng 2 · Automotive (`/automotive`, AXIOM GT)

- Ngày 05/11/2026. Giám khảo không viết code này và chỉ đọc mã nguồn, không sửa gì.
- Điều kiện tự kiểm:
  - Server: `vite` dev :5196.
  - Trình duyệt: Chrome (channel chrome, headless, `--use-angle=d3d11`), GPU Intel HD 530.
  - Ảnh thường chụp ở DPR 1; ảnh zoom chụp ở DPR 2.
  - Script độc lập. Log: `shots/automotive-judge-log.json`, `shots/perf-dev-judge.json`.
- Chuẩn hình ảnh: `reference/v2/automotive-ref-1.webp`. Chuẩn chuyển động và UI: `baseline/v1/automotive/MOTION_SPEC.md`.
- Không trừ điểm: xe là CarConcept (CC-BY 4.0), không phải sedan thương hiệu trong ảnh mẫu, và có dòng ghi công.
- FPS ở đây đo trên bản dev nên chỉ để tham khảo. Số chính thức do điều phối đo trên bản production.

## Điểm: **73 / 100** (vòng trước 70 · mục tiêu ≥ 90 → KHÔNG ĐẠT)

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| 3D / photoreal | **20/30** | Sơn đã sạch hạt, bóng và đổi màu đẹp (carmine, graphite có vệt chân trời). Nhưng sơn trắng vẫn không phản chiếu gì sắc nét, phông là đồi pastel trơn kiểu minh họa, nền đất phẳng trống, cảnh .02 vẫn như mô hình tháo rời. |
| Animation & tương tác | **26/30** | Orbit 360°, 4 biến thể, hover theo phần, cuộn xuôi/ngược khôi phục Δ = 0, cảm ứng đều đạt. Light sweep khi hover hầu như không thấy trên sơn trắng, còn hover thân xe lại làm ốp carbon bạc màu. |
| Bám mẫu v2 | **12/20** | Đúng tông hoàng hôn, xe trắng góc 3/4, đường nhựa có vạch. Thiếu sườn đồi đá có bụi cây, mây tầng kịch tính và phản chiếu gương trên sơn trắng. Núi mới là các dải tím/hồng trơn, xa chất ảnh chụp hơn. |
| Frontend | **8/10** | Đã có scrim. List ở mobile thành một cột. Nhưng tiêu đề hero tan vào mặt đường khi nhìn từ trên, nhãn "PEARL WHITE" trắng trên nền đường sáng gần như không đọc được, và đoạn mô tả .03 nằm đúng mép chân trời. |
| Hiệu năng & ổn định | **7/10** | 0 lỗi console/HTTP, không tràn ngang. Dev: cuộn 41–50 fps, p95 40 ms, worst 81–133 ms, có 12–14 khung > 50 ms trong mỗi lượt cuộn. Ready dev 3.2–7.4 s. Chờ số production. |

## Hạng mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | PASS | GLB render WebGL, camera đổi thật theo cuộn (log `scroll.fwd`). |
| Orbit 360° | PASS | 8 × 135 px, mỗi bước −0.783 rad, đủ vòng ở cả 0/50/100 % (yawTotal −6.264 mỗi vòng). Pitch ±0.928. `resetView` đưa yaw/pitch về 0 và Δpos = 0. `shots/automotive-sheet-orbit-p0/p50/p100.jpg` |
| ≥ 3 biến thể đổi vật liệu thật | PASS | `primary`: #e6e4df / #7a0a12 / #2c2e33 / #7d5a3a. Metalness 0.04 → 0.75, roughness 0.10–0.12, clearcoat 1. `shots/automotive-sheet-variants.jpg` |
| Hover nhìn thấy được | PASS (vẫn nhạt) | body/glass/wheels: hover.value = 1, rim body 1.15. Rời chuột → 0. Chênh pixel toàn khung chỉ 1.3–1.5/255 khi giữ và 1.8–2.3/255 trong lúc sweep. `shots/automotive-sheet-hover.jpg`, `automotive-zoom-hover-sweep-300ms.png` |
| Scroll mượt + khôi phục | PASS | Cuộn ngược 0.75/0.5/0.25/0 cho Δcamera = 0 và kênh exploded/rearLight khớp. Sau jitter (140 nhịp wheel) `scrollTo(0.3)` vẫn đúng. Khựng xem lỗi N4. |
| Không crash / trắng | PASS | 0 error. Chỉ có warning `THREE.Clock deprecated` và `willReadFrequently`. |
| Không dùng ảnh/video giả 3D | PASS | Xe là mesh thật, nền là shader. |
| Không low-poly/cartoon làm sản phẩm cuối | PASS | Xe đạt. Phông núi hơi minh họa (N2) nhưng không phải sản phẩm. |
| Cảm ứng | PASS | Vuốt ngang CDP cho yaw 1.253 trong khi scroll không đổi. `shots/automotive-390-touch-orbit.jpg` |

## Lỗi vòng trước → trạng thái hiện tại

| # | Lỗi vòng trước | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| 1 | Sơn lì, có hạt, thiếu phản chiếu | **PARTIAL** | Hạt đã hết. Đo được roughness 0.10/0.12, clearcoatRoughness 0.03, sơn bóng (`automotive-zoom-hero-car.png`). Graphite đã thấy vệt chân trời (`automotive-zoom-graphite-hero.png`). Sơn trắng ở cả hero, side .01 và góc 180° vẫn chỉ có gradient mềm, không có đường chân trời sắc như ảnh mẫu (`automotive-zoom-pearl-side-25.png`, `automotive-zoom-rear-180.png`). |
| 2 | Ốp sườn / cản sau đen như lỗ hổng | **FIXED (phần lớn)** | Ốp giờ là carbon bóng, có dải phản chiếu xám và đọc ra khối (`automotive-zoom-hero-car.png`). Riêng khi hover, ốp bị bạc thành nâu xám (N3). |
| 3 | Núi loang lổ, vết nối khối, cắt cứng | **FIXED (vết nối) / REGRESSED (độ thật)** | Đã xem 8 hướng × 3 mốc, không còn bậc hay vết nối (`automotive-sheet-orbit-p0.jpg`). Đổi lại, núi thành 2–3 dải pastel trơn tuyệt đối, viền như giấy cắt. Ở 135–225° là một "bức tường" tím phẳng (`automotive-orbit-p0-180.jpg`). Mặt đất vẫn phẳng trống, không có vai đường, sỏi hay bụi cây. So cạnh nhau: `automotive-compare-prev-vs-now.jpg`. |
| 4 | Cảnh .02 như mô hình vỡ | **PARTIAL** | Khối tách gọn và đối xứng hơn (`automotive-sheet-orbit-p50.jpg`). Nhưng vẫn thấy cửa và tấm vè trôi rời, khe hở lộ khung cam, tấm vỏ không có độ dày. Khung skate phát sáng chỉ là vài nét cam mờ dưới gầm, không đọc ra là chủ đích (`automotive-zoom-explode.png`). |
| 5 | Mâm/lốp đen bệt, viền lốp có quầng cam | **PARTIAL** | Mâm đen giờ thấy rõ nan, caliper đỏ. Nhưng thành lốp vẫn có viền cam (sun rim ăn cả lốp) (`automotive-zoom-pearl-side-25.png`). Ở góc ngược nắng 90–180°, mâm thành nâu đồng, không còn "gloss black" (`automotive-zoom-rear-180.png`). |
| 6 | Chữ khó đọc (.03, final nhìn từ trên) | **PARTIAL** | Scrim đã có. Final nhìn từ trên đọc được tiêu đề, nhưng đoạn phụ vẫn mờ (`automotive-crop-p100-high-title.png`). Hero nhìn từ trên: "AXIOM" đen trên đường nâu sẫm, tagline không đọc được (`automotive-crop-p0-high-title.png`). Đoạn .03 vẫn nằm trên mép chân trời (`automotive-1920-fwd-0750.jpg`). |
| 7 | Hover body nhạt | **PARTIAL** | Rim body tăng lên 1.15 và có sweep. Nhưng chênh pixel thấp hơn vòng trước (1.4 so với 5.15 /255). Dải sweep không thấy trên sơn trắng ở 300 ms (`automotive-zoom-hover-sweep-300ms.png`). |
| 8 | Khựng nhẹ | **NOT FIXED (dev)** | Dev 1440/1920: worst 81–133 ms, 8–14 khung > 50 ms mỗi lượt cuộn (`perf-dev-judge.json`). Chờ số production của điều phối. |
| 9 | Mobile: xe nhỏ, list xuống dòng | **FIXED** | Xe chiếm gần hết bề ngang. List .03 một cột, không gãy dòng (`automotive-sheet-390.jpg`). |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **[Cao] Sơn trắng (biến thể mặc định) chưa có phản chiếu gương.** Đây là yếu tố "luxury" số 1 của ảnh mẫu. Hero, side .01, góc 180° và .03 chỉ thấy gradient mềm.
   - Bằng chứng: `automotive-zoom-hero-car.png`, `automotive-zoom-pearl-side-25.png`.
   - Cách sửa:
     - Với pearl: hạ base albedo xuống khoảng #d9d6d0 để vệt env nổi lên.
     - Tăng clearcoat env, hoặc thêm 1–2 strip sáng/tối nằm ngang trong env (cao bằng mui).
     - Giữ đất tối ngay dưới chân trời. Như vậy cửa và vè sẽ có một đường chân trời sắc chạy dọc thân xe.
     - Kiểm tra lại ở yaw 0/90/180.
2. **[Cao] Phông núi và mặt đất mang chất minh họa.** Các dải pastel trơn có viền "giấy cắt". Mặt đất là mặt phẳng nâu không có chi tiết. Ở yaw 135–225° là một bức tường tím phẳng.
   - Bằng chứng: `automotive-orbit-p0-180.jpg`, `automotive-1920-fwd-0750.jpg`, `automotive-compare-prev-vs-now.jpg`.
   - Cách sửa:
     - Thêm micro-relief (ridged noise biên độ thấp) và vệt sáng/tối theo hướng mặt trời cho lớp gần.
     - Thêm lớp sườn đồi gần có đá và bụi cây instanced (đã có texture CC0 được duyệt).
     - Thêm vai đường bằng sỏi.
     - Thêm mây tầng phản sáng ở dải chân trời phía mặt trời.
3. **[Trung bình] Hover thân xe làm ốp carbon bạc màu, còn dải sweep không thấy.** Ốp đen chuyển sang nâu xám đục (do `accentRim` 0.5 + 0.9).
   - Bằng chứng: `automotive-zoom-hover-sweep-300ms.png` so với `automotive-zoom-hero-car.png`.
   - Cách sửa:
     - Bỏ rim trên accent khi hover.
     - Sweep cần cộng specular (đẩy highlight theo dải), không trộn về màu sáng. Biên độ phải đủ để thấy trên nền trắng, ví dụ tối hóa phần ngoài dải 10–15 % để tạo tương phản.
4. **[Trung bình] Khựng khi cuộn (dev).** Worst frame 81–133 ms, p95 40 ms, có 8–14 khung > 50 ms mỗi lượt. Đo bằng in-page `scrollTo` theo rAF ở 1440 và 1920, nên không phải do CDP.
   - Cách sửa:
     - Profile shader nền núi/đất.
     - Tránh `getImageData` mỗi khung (đã có warning `willReadFrequently`).
     - Bake mây và hạt bụi.
5. **[Trung bình] Viền cam trên thành lốp; mâm thành nâu đồng khi ngược nắng.** Bằng chứng: `automotive-zoom-pearl-side-25.png`, `automotive-zoom-rear-180.png`. Cách sửa: tắt sun rim cho vật liệu lốp, giảm metalness/env của `rimDark`, tăng clearcoat để mâm giữ màu đen bóng.
6. **[Trung bình] Cảnh .02 vẫn đọc như mô hình tháo rời.** Bằng chứng: `automotive-zoom-explode.png`. Cách sửa:
   - Thêm độ dày hoặc viền vát cho mép tấm tách.
   - Cho khung skate sáng rõ (đường line phát sáng 2–3 px, màu trắng ấm).
   - Giảm tách vè trước.
   - Thêm nhãn chỉ dẫn (callout) 2–3 chi tiết để người xem hiểu đây là "kiến trúc" có chủ đích.
7. **[Thấp] Chữ không đọc được trên nền sáng hoặc tối.**
   - Nhãn biến thể "PEARL WHITE" (trắng) trên mặt đường sáng ở hero (`automotive-1920-fwd-0000.jpg`, góc phải dưới).
   - Hero tagline khi orbit nhìn từ trên (`automotive-crop-p0-high-title.png`).
   - Cách sửa: thêm scrim cho cụm swatch, và cho tiêu đề hero một scrim như final.
8. **[Thấp] Mặt trời ở hero là một đốm trắng mờ phẳng** (góc phải trên, `automotive-1920-fwd-0000.jpg`). Không có quầng hay tia, trông như sticker. Cách sửa: thêm glow nhiều lớp hoặc bloom mặt trời trong sky shader.

## So với ảnh mẫu (`automotive-ref-1.webp`)

- **Khớp:**
  - Tông hoàng hôn cam vàng.
  - Xe trắng góc 3/4 trước trên đường nhựa.
  - Mâm đen, caliper màu.
  - Đèn LED mảnh.
  - Các dải núi mờ dần về phía chân trời.
- **Không khớp:**
  - Sơn: mẫu bóng gương, có vệt trời và chân trời chạy dọc nắp capo và cửa; v2 trắng sữa, phản chiếu mềm.
  - Phông: mẫu có sườn đồi đá, bụi cây, đường đất và mây tầng phản sáng; v2 là các dải pastel trơn và đất phẳng.
  - Lốp và mâm: v2 có viền cam lạ.
  - Khung ảnh dọc so với ngang: chấp nhận vì đây là website.

## Đủ chuẩn giới thiệu khách hàng?

**KHÔNG.** Vòng này sửa được nhiều lỗi kỹ thuật: hết hạt sơn, ốp carbon, hết vết nối núi, mobile tốt. Tương tác và chuyển động vẫn chắc. Nhưng ảnh tổng thể vẫn là "CG thời gian thực sạch sẽ", chưa ra chất ảnh chụp ultra-luxury. Ba lý do chính:
- Sơn trắng thiếu phản chiếu gương.
- Phông núi thành đồ họa minh họa.
- Cảnh .02 vẫn rời rạc.

Sửa lỗi N1–N3 và N6 là điều kiện cần để vượt 85.
