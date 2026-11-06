# AUTOMOTIVE_HYBRID_PIPELINE — Realtime là chính + Blender/Cycles để test và bake

- Tác giả: automotive-architect (Opus).
- Ngày: 05/11/2026. **Bản sửa theo quyết định của Founder cùng ngày.**
- **Mọi owner là Opus:** `automotive-builder` (claude-opus-5-5) và `automotive-luxury-judge`.

**Các quyết định ràng buộc của Founder:**
- Hướng = hoàng hôn đường đèo, mặc định Pearl White (`REFERENCE_MATRIX` §3).
- Model = **chỉ CarConcept** (`CarConcept.baha.glb`).
- Blender = **chỉ render test ngắn**: vài still hero để Founder duyệt.
- Không có batch qua đêm. Không có image sequence. Không có opener video hay insert ở giai đoạn này.

## 0. Công cụ (đã kiểm) và hệ số render

- **Blender 5.2.3 LTS:** `"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python <script> -- <args>`.
  - Có: Cycles CPU, OIDN, light tree, view transform Khronos PBR Neutral, importer glTF.
  - Không có: CUDA/OptiX.
  - API compositor và một số thuộc tính đã đổi ở 5.x ⇒ kiểm bằng `dir()` trước khi viết script.
- **ffmpeg 9.0.2:** có libaom/svt-av1, libwebp, libx264.
- **three 0.187:** `Stage tone="neutral"` đã có sẵn.
- **Benchmark thật** (Cycles CPU i5-6500T, OIDN, adaptive 0,02, cảnh 3 quả cầu):
  - 960×540 × 64 spp = **34,8 s**;
  - 1920×1080 × 128 spp = **204,6 s** (≈ 1,3 M px·spp/s).
- **Hệ số lập kế hoạch cho xe thật:** 0,4 M px·spp/s. Hiệu chỉnh lại ở Stage 1.

## 1. Vai trò của từng lớp

| Lớp | Vai trò | Ghi chú |
|---|---|---|
| **Realtime three.js** | **Sản phẩm.** Toàn bộ route, 5 mốc QC, orbit/biến thể/hover/cuộn ngược | Nâng chất lượng hình ảnh trong thế giới hoàng hôn (§3) |
| **Blender/Cycles** | (1) **Ảnh mục tiêu (target)** ở cùng pose để chỉnh realtime cho khớp. (2) **Bake** bóng/AO trên đường. (3) **3–4 still hero** để Founder duyệt chất lượng | Không có ảnh nào của Blender hiển thị trên website ở giai đoạn này, trừ texture bóng đã bake |
| Cinematic (opener, insert, still mode) | **Hoãn.** Chỉ mở khi Founder duyệt still và cho phép thêm thời gian render | Thiết kế cũ được giữ trong lịch sử file; không thực hiện |

## 2. Hợp đồng chung `automotive-flagship/contract/scene-contract.json`

Builder sinh file này **từ mã realtime**, không chép tay. Nội dung:
- **Transform xe:** giống `buildRig`, tức xoay Y +π/2 và căn tâm, y = 0.
- **7 PoseStop:** desktop + portrait (`stopsFor`, `fitAspect`).
- **`SUN`:** vector và **góc xoay HDRI** (`uOff` ở `World.tsx`). Blender phải đặt mặt trời và xoay world đúng như realtime.
- **Bảng `FINISHES`, tone mapping, exposure.**
- **Đổi trục:** three `(x, y, z)` → Blender `(x, −z, y)`. Camera dùng `sensor_fit = 'VERTICAL'`, `angle_y = fov`.
- **Kiểm khớp:**
  - Silhouette IoU ≥ 0,97 ở 3 pose.
  - ΔE2000 trung vị của sơn giữa Blender và realtime ≤ 6 (sau Stage 2).

## 3. Realtime: nâng cấp trong thế giới hoàng hôn (sửa 10 nguyên nhân "cartoon" ở GAP_REPORT §2)

1. **Trời là ảnh thật:**
   - Bỏ phần vẽ lại trời bằng gradient + mask mây trong `GRADE_FRAG`.
   - Chỉ grade nhẹ ảnh HDRI gốc: white balance ấm, exposure, saturation ±10 %.
   - Mây trong ảnh giữ nguyên chất ảnh chụp.
   - Đĩa mặt trời có quầng nhờ bloom.
2. **Bỏ `Ridges`** (các dải núi "giấy cắt"). Dựa vào đường chân trời trong ảnh + fog/haze theo khoảng cách. Chỉnh `GroundedSkybox` (height/radius) để tỉ lệ ruộng/đường ảnh khớp với mặt đường 3D.
3. **IBL có đường chân trời sắc:**
   - PMREM lấy từ cùng ảnh, giữ tách trời sáng / đất tối.
   - Có thể tăng dải sáng ngay trên chân trời phía mặt trời, **chỉ trong nguồn IBL**, để cửa và capo có một "line" phản chiếu.
   - Kiểm ở yaw 0/90/180.
4. **Fill phía camera:** giữ key bounce, chỉnh cường độ; dùng `NeutralToneMapping` với exposure mới. Nửa dưới xe không đen bệt:
   - lốp: albedo khoảng 0,035, roughness 0,85, không nhận rim;
   - mâm: gunmetal/bạc có env;
   - ốp: carbon có env.
5. **Pearl White** là mặc định:
   - albedo khoảng `#d9d6d0` để phản chiếu nổi lên;
   - clearcoat roughness 0,02–0,03.
   - **Carmine** chỉnh sáng và bão hòa hơn để đọc là đỏ dưới ánh ấm.
6. **Bỏ các hack làm vật liệu trông "được tô":**
   - sweep screen-space thay bằng hover rim nhẹ;
   - giảm `sunRim`, và chỉ áp cho sơn;
   - bỏ hạt bụi vàng hoặc giảm còn ≤ 40 hạt.
7. **Tiếp xúc đất:**
   - Texture bóng + AO **bake bằng Cycles** (bóng dài theo `SUN` + AO dưới lốp) cho tư thế đóng và mở, cross-fade theo `anim.explode`.
   - Thay hoàn toàn `useShadowBake` (blur).
8. **Kính** opacity khoảng 0,5 để thấy nội thất (không dùng transmission).
9. **Post nhẹ:** bloom ngưỡng cao (mặt trời, DRL, đèn hậu) + vignette + grain tĩnh khoảng 3 %, tổng ≤ 3 ms.
10. **Cây và bố cục:**
    - `shrub_03/04` gom thành cụm ở vai đường, có AO chân.
    - Kiểm không cụm nào nằm trong vùng chiếu của camera ở cả 7 pose × desktop/portrait.
    - Sửa mobile 0 %: cây chắn camera, xe bị cắt mép, đĩa cam lạ sau tiêu đề.

**Ngân sách realtime** (production, máy rảnh, 1440×900, DPR 1, HD 530):

| Chỉ số | Mục tiêu |
|---|---|
| FPS idle và cuộn | ≥ 55 |
| Frame time p95 | ≤ 22 ms |
| Frame tệ nhất | ≤ 50 ms |
| Draw call | ≤ 150 |
| Tam giác/frame | ≤ 450 k |
| Tổng tải route | ≤ 20 MB |
| Ready | ≤ 5 s |

## 4. Blender: cảnh test

- **Thiết lập cảnh:**
  - Import `CarConcept.baha.glb` + transform từ contract.
  - Đường là plane `asphalt_02`, vai đường sỏi.
  - World = `evening_road_01_2k.hdr`, xoay theo contract.
  - **Sun lamp** đúng hướng `SUN`: góc 0,5–1°, khoảng 2800–3200 K, cường độ khớp với nắng trong HDRI.
  - Vài instance `shrub_03/04`.
- **Vật liệu:** Principled BSDF theo `FINISHES`.
  - Pearl: coat 1 / 0,02.
  - Carmine: dùng thêm coat tint.
  - Kính transmission, mâm, lốp, carbon.
  - Mép cửa Solidify 2–3 mm. Normal: Weighted Normal. **Không** Subdivision.
- **Cycles:** OIDN (albedo + normal), adaptive 0,02, light tree; bounce diffuse 3 / glossy 4 / transmission 8; tắt caustics; filter glossy 0,5; clamp indirect 8.
- **Nền độ phân giải thấp** (HDRI 2K): che bằng **DOF** (f/2,8–4 ở 85 mm) và haze cho still cận và trung cảnh. Không cố render nền sắc.
- **Cảnh cận chỉ ở những chi tiết CarConcept giữ được:**
  - mặt sơn vai/cửa có đường chân trời;
  - mâm + caliper ở trung cảnh;
  - dải đèn hậu phát sáng ở trung cảnh;
  - gương.
- **Không cận:**
  - đèn pha (288 vertex);
  - gai lốp (ống + normal map);
  - mép cửa mở;
  - nội thất;
  - gầm xe.

## 5. Ngân sách render (giới hạn cứng)

| Hạng mục | Thông số | Mỗi ảnh | Số lượng | Tổng |
|---|---|---|---|---|
| Hiệu chỉnh và khớp camera | 960×540 × 32 spp | khoảng 55 s | 3 | khoảng 3 min |
| Preview look-dev | 960×540 × 32 spp | khoảng 55 s | ≤ 12 | ≤ 12 min |
| Bake bóng/AO đường (ortho top-down) | 1024² × 64 spp | khoảng 3 min | 2 (đóng/mở) | khoảng 6 min |
| **Still hero để Founder duyệt** | 1920×1080 × 128 spp | khoảng 11–12 min | **≤ 4** | ≤ 48 min |
| **Tổng** | | | | **≤ khoảng 1,2 h CPU** |

- **Mỗi lần render ≤ 15 phút.** Quá thì hủy và giảm spp hoặc độ phân giải.
- Không chạy QC hay đo FPS trong lúc render.
- Mọi lần render ghi vào `automotive-flagship/renders/render-log.csv`.
- Xuất PNG 16-bit + JPG/AVIF xem trước. Đề nghị `.gitignore` các file EXR.

**4 still đề xuất** (biến thể in đậm):

| Still | Biến thể | Khung |
|---|---|---|
| H1 | **Pearl** | Hero 3/4 trước, pose t=0, khớp realtime |
| H2 | **Carmine** | Cùng pose H1 (kiểm biến thể đỏ dưới hoàng hôn) |
| H3 | **Pearl** | 3/4 sau, pose t=0,75, đèn hậu sáng |
| H4 | **Pearl** | Trung cận vai + bánh trước, 85 mm, DOF |

## 6. Hoãn (cần Founder duyệt riêng)

Các hạng mục sau **không được làm** cho tới khi có lệnh mới:
- opener video;
- editorial insert;
- still mode fallback;
- image sequence;
- render biến thể hàng loạt;
- model khác.
