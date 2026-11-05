# Giám khảo độc lập — V2 vòng 2 · Beauty (`/beauty`, BAHA botanica · Radiance Serum)

- Ngày 05/11/2026. Giám khảo không viết code này và chỉ đọc mã nguồn, không sửa gì.
- Điều kiện tự kiểm:
  - Server: `vite` dev :5196.
  - Trình duyệt: Chrome (channel chrome, headless, `--use-angle=d3d11`), GPU Intel HD 530.
  - Ảnh thường chụp ở DPR 1; ảnh zoom chụp ở DPR 2.
  - Script độc lập. Log: `shots/beauty-judge-log.json`, `shots/perf-dev-judge.json`.
- Chuẩn hình ảnh: `reference/v2/beauty-ref-1.webp`. Chuẩn chuyển động và UI: `baseline/v1/beauty/MOTION_SPEC.md`.
- Không trừ điểm: nhãn BAHA ("RADIANCE serum · Vitamin C 15%") thay cho nhãn thương hiệu thật.
- FPS ở đây đo trên bản dev nên chỉ để tham khảo. Số chính thức do điều phối đo trên bản production.

## Điểm: **83 / 100** (vòng trước 78 · mục tiêu ≥ 90 → KHÔNG ĐẠT)

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| 3D / photoreal | **23/30** | Chai hổ phách đẹp hơn rõ: có backlight ấm, strip highlight dọc sắc, hết vệt "lá", lõi dịch sáng ở vai. Nhưng nước bắn vẫn là các dải mỏng trong như màng bọc, múi cam trông như in pattern, mặt cắt lát quý có sọc cam/trắng lỗi. |
| Animation & tương tác | **27/30** | Orbit 360°, 3 thế giới đổi thật, hover chai và lát cam hero (mới), 5 ingredient, cuộn khôi phục Δ = 0, cảm ứng đều đạt. Mốc 25 % vẫn thưa. |
| Bám mẫu v2 | **16/20** | Lát cam to hơn, sát và chồng lên chai. Có nhiều giọt nước, glow ấm sau chai, bố cục rất gần mẫu. Vẫn thiếu khối nước bắn dày, đặc trưng nhất của mẫu. |
| Frontend | **9/10** | Callout 50 % hết va chạm. Typography biên tập đẹp. Mobile gọn, có chú giải đánh số. |
| Hiệu năng & ổn định | **8/10** | 0 lỗi. Ready dev giảm từ 12 s xuống 3.5–5.9 s. Cuộn ở 1440: 66 fps, worst 54–67 ms. Ở 1920 dev còn 40–55 fps, worst 67–80 ms. Chờ số production. |

## Hạng mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | PASS | Chai, nắp, ống hút, trái cây, splash và 96 giọt là mesh WebGL. Bokeh là impostor DOF, chỉ trang trí. |
| Orbit 360° | PASS | 8 × 45° đủ vòng ở 0/50/100 % (yawTotal −6.264 mỗi vòng), pitch ±0.928. `resetView` đưa về 0 và Δpos = 0. `shots/beauty-sheet-orbit-p0/p50/p100.jpg` |
| ≥ 3 biến thể đổi vật liệu thật | PASS | `primary` (glass): #f2b878 / #f2b2b9 / #b4cf8e, transmission 1, roughness 0.035. Trái cây, nền và chữ lớn đổi theo. `shots/beauty-sheet-variants-hover.jpg` (hàng 1) |
| Hover nhìn thấy được | PASS | Chai: value 1, rim 1.5, chênh pixel 5.15/255 (7.4 % pixel > 20). Lát cam hero: value 1, chênh 4.19/255. Rời chuột → 0. `beauty-sheet-variants-hover.jpg` (hàng 2) |
| Scroll mượt + khôi phục | PASS | Cuộn ngược 0.75/0.5/0.25/0 cho Δcamera = 0. Kênh dropperLift/explode/ingredients/splash khớp. Sau jitter `scrollTo(0.3)` vẫn đúng. |
| Không crash / trắng | PASS | 0 error. Chỉ có warning `THREE.Clock deprecated` và `willReadFrequently`. Không tràn ngang ở 1920/1440/390. |
| Không dùng ảnh/video giả 3D | PASS | |
| Không low-poly/cartoon làm sản phẩm cuối | PASS | Chai đạt. Splash và múi cam còn chất CG (N1, N2) nhưng không cartoon. |
| Cảm ứng | PASS | Vuốt ngang cho yaw 1.253 trong khi scroll không đổi. `shots/beauty-390-touch-orbit.jpg` |

## Lỗi vòng trước → trạng thái hiện tại

| # | Lỗi vòng trước | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| 1 | Nước bắn không giống chất lỏng | **PARTIAL** | Đã có fake refraction (code: ior 1.333), 96 giọt (BEADS = 96), giọt bám trên lát cam, burst ở đầu lát quý, crown sau chai (code: 11 spike). Nhìn thực tế vẫn là các ribbon mỏng, trong và phẳng như màng bọc thực phẩm. Burst ở đầu lát quý trông như nhựa nhàu. Crown sau chai gần như bị chai che, không đọc ra hình vương miện (`beauty-zoom-hero-splash-left.png`, `beauty-zoom-hero-orange-right.png`). |
| 2 | Ánh sáng phẳng | **FIXED (phần lớn)** | Có glow ấm sau chai. Vai chai và lõi dịch sáng cam. Có strip highlight dọc sắc ở hai bên thân (`beauty-zoom-hero-bottle.png`). Rim cam ở viền chai còn yếu. Chai vẫn hơi tối so với mẫu (mẫu hổ phách trong, sáng hơn). |
| 3 | Vệt phản chiếu hình "lá" | **FIXED** | Vai chai sạch, chỉ còn highlight softbox (`beauty-zoom-hero-bottle.png`). |
| 4 | Callout 50 % chen nhau | **FIXED** | 5 nhãn tách rời ở mốc 50 % (`beauty-1920-fwd-0500.jpg`). Đã xem cả 8 góc orbit ở 50 % và không thấy chồng (`beauty-sheet-orbit-p50.jpg`). |
| 5 | Tải chậm, khung khựng | **PARTIAL → tốt hơn** | Ready dev 3.5–5.9 s (vòng trước 12 s). 1440: worst 54–67 ms, tức khớp claim 67 ms. 1920: worst 67–80 ms, idle hero 39 fps (dev) (`perf-dev-judge.json`). |
| 6 | Mốc 25 % trống | **PARTIAL** | Đã thêm 2 bokeh cam và glow, nhưng vẫn chỉ có chai trên nền be, không có giọt hay lát cam ở hậu cảnh (`beauty-compare-25-prev-vs-now.jpg`). |
| 7 | Lát cam hero không hover được | **FIXED** | `citrus-hero` hover = 1 và hình thay đổi (chênh 4.19/255). |
| 8 | Lát cam "sạch CG" | **PARTIAL** | Đã có giọt nước trên mặt cắt. Nhưng múi cam vẫn là pattern chấm đều lặp lại, thiếu độ trong mọng và bóng ướt của tép (`beauty-zoom-hero-orange-right.png`). |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **[Cao] Splash chưa có khối và độ dày của nước thật.** Mẫu có một vương miện nước dày, nhiều nhánh xoắn, phản sáng mạnh, ôm từ sau chai lên lát cam. V2 là các tấm mỏng phẳng, mép không có highlight cong, trông như màng nilon.
   - Bằng chứng: `beauty-zoom-hero-splash-left.png`, `beauty-zoom-hero-wide.png`.
   - Cách sửa:
     - Dùng tube có tiết diện tròn với bán kính thay đổi (bó lại và phình ra theo noise) thay cho sheet dẹt.
     - Thêm specular fresnel viền sáng mạnh và một lớp tối mỏng ở mép (refraction edge) để nước "đọc" được trên nền kem.
     - Đẩy crown sang hai bên chai cho lộ ra khỏi bóng chai, cao khoảng 1.2 lần chiều cao chai như mẫu.
     - Phương án khác: xin Founder duyệt một GLB splash CC0.
2. **[Trung bình] Mặt cắt lát cam quý có sọc cam/trắng xen kẽ (lỗi UV/texture), múi cam như in pattern.**
   - Bằng chứng: cạnh trái lát cam phía trên trong `beauty-zoom-hero-orange-right.png`, mặt tép trong `beauty-zoom-hero-splash-left.png`.
   - Cách sửa:
     - Sửa UV mặt cắt múi (dùng planar projection theo pháp tuyến cắt).
     - Thêm SSS giả (wrap lighting màu cam đậm) và biến thiên kích thước/hướng tép.
     - Tăng clearcoat cho tép để có bóng ướt.
3. **[Trung bình] Mốc 25 % ("Twist. Draw.") vẫn thưa.** Bằng chứng: `beauty-compare-25-prev-vs-now.jpg`. Cách sửa: giữ 1–2 lát cam mờ DOF và vài giọt serum rơi từ ống hút trong khung này.
4. **[Thấp] Chai hơi tối và đục so với mẫu.** Mẫu có hổ phách trong, thấy rõ mực dịch và màu sáng ở đáy. Cách sửa: giảm attenuation distance của glass/liquid khoảng 20 %, thêm caustic sáng nhẹ dưới đáy chai.
5. **[Thấp] Hiệu năng 1920 dev thấp hơn 1440:** idle hero 39 fps, cuộn ngược worst 80 ms. Cách sửa: kiểm tra 96 giọt transmissive-fake (gom instanced) và bokeh blur ở DPR/viewport lớn.

## So với ảnh mẫu (`beauty-ref-1.webp`)

- **Khớp:**
  - Nền kem.
  - Chai dropper hổ phách nắp trắng có gân, nhãn kem serif ở giữa.
  - 3–4 lát cam lớn chồng sát chai, cam mờ DOF ở các góc.
  - Nhiều giọt nước, glow ấm.
  - Bố cục trung tâm.
- **Không khớp:**
  - Khối nước bắn: mẫu dày, xoắn, phản sáng; v2 là ribbon mỏng.
  - Múi cam: mẫu mọng nước và trong; v2 như in.
  - Chai: v2 tối hơn mẫu một chút.
- Không trừ điểm: chữ "GLOW" lớn phía sau (giữ từ v1).

## Đủ chuẩn giới thiệu khách hàng?

**CHƯA (rất gần).** Bố cục, chai và tương tác đã ở mức trình diễn được, và tốt hơn rõ so với vòng trước. Thứ còn thiếu để đạt "ultra-luxury" là khối nước bắn photoreal. Đây vẫn là yếu tố "wow" của mẫu và là thứ khách nhìn vào đầu tiên. Sửa N1 và N2 có khả năng đưa điểm lên khoảng 88–90.
