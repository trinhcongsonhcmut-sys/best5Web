# AUTOMOTIVE_ASSET_DECISION — model xe cho realtime và prerender

> **CẬP NHẬT 05/11/2026 — Founder đã quyết định:**
> - **Chỉ dùng CarConcept.** Không tải mesh gốc CC0 (ứng viên A) và không mua model khác (B, C). Mục 3 chỉ còn giá trị tham khảo.
> - Cảnh cận chỉ dành cho những chi tiết CarConcept giữ được: sơn vai/cửa, mâm + caliper ở trung cảnh, dải đèn hậu, gương.
> - Môi trường dùng HDRI hoàng hôn + `asphalt_02` + `shrub_03/04` (đã duyệt), không dùng studio.

- Tác giả: automotive-architect (Opus). Ngày 05/11/2026.
- **Chưa tải gì.** Mọi ứng viên bên dưới phải được Founder duyệt trước khi tải hoặc mua.

## 1. Đánh giá CarConcept hiện tại

Số liệu đo bằng `gltf-transform inspect`:

| Mục | Số liệu |
|---|---|
| File gốc | `public/assets/models/CarConcept.glb`, 11,8 MB |
| Bản ship | `CarConcept.baha.glb`, 9,0 MB (WebP, đã gỡ logo, có proxy `HIT_*`) |
| Giấy phép | CC BY 4.0, Eric Chadwick / Darmstadt Graphics Group (2024) |
| Gốc của model | "Free Concept Car 004" của Unity Fan, **CC0** |
| Tổng vertex upload | ~213 k vertex upload / ~640 k vertex render ⇒ khoảng **213 k tam giác** |
| Thân chính | `BodyPanelsColor2` 13,4 k · `BodyHood` 13,3 k · `BodyRearPanelsColor1` 13,0 k vertex |
| Cửa | `BodyDoorL/RColor1` ~2,6 k vertex mỗi cửa |
| Đèn pha | **`BodyHeadlights` chỉ 288 vertex** |
| Chi tiết khác | Gạt mưa 24 k vertex (thừa); caliper 3,15 k vertex/bánh |
| Xử lý (README Khronos) | RapidPipeline đã xóa chi tiết < 3 cm và một số bộ phận cơ khí; lốp thay bằng ống + normal map lát gạch; **bánh giảm từ 10 260 xuống 324 vertex**; AO bake chung 1 texture 2K; UV thân tạo lại bằng LSCM; mặt trong bị xóa (shell `doubleSided`) |
| Texture | Tối đa 2K (AO). Phần lớn ≤ 1K, PNG |
| Phần đã tách sẵn | Cửa L/R (cửa thường, không dihedral), capo, 4 bánh, có nội thất cơ bản |

### Có đủ cho render hero cấp quảng cáo không?

| Loại khung | Kết luận | Lý do |
|---|---|---|
| **Wide và trung cảnh** (xe ≥ 60 % bề ngang, 1440p–2560p) | **ĐỦ** | Mặt panel liền, normal tốt. Với studio + Cycles + clearcoat, phản chiếu sẽ sạch. Hero 3/4, đuôi đối xứng, top-down cửa mở và profile đều dùng được. |
| **Cận cảnh / macro** (đèn pha, mâm–lốp, mép cửa mở, nội thất) | **KHÔNG ĐỦ** | Đèn pha 288 vertex, lốp là ống trơn, mép cửa không có độ dày, nội thất thô ⇒ lộ ngay ở 2400 px. |
| **Realtime web** | **ĐỦ VÀ PHÙ HỢP** | 213 k tam giác, 9 MB là ngân sách đúng cho HD 530. |

## 2. QUYẾT ĐỊNH

1. **GIỮ CarConcept (`CarConcept.baha.glb`) làm asset realtime và asset Blender mặc định.**
   - Giấy phép đã duyệt.
   - Rig, hover proxy và motion đã khớp.
   - Prerender wide/trung cảnh dùng chính file này để **realtime và prerender là cùng một chiếc xe**. Đây là điều kiện để chuyển cảnh mượt giữa hai lớp.
2. **Thiết kế shot né điểm yếu.** Không có macro đèn pha hay macro lốp. Macro chỉ dành cho:
   - mặt sơn/vai xe (panel lớn);
   - mâm ở khoảng cách trung bình (thay vật liệu, không cần mesh mới);
   - cửa mở nhìn từ trên (top-down), mép cửa có Solidify 2–3 mm trong Blender.
3. **ĐỀ NGHỊ FOUNDER DUYỆT (miễn phí)** tải **mesh gốc CC0 "Free Concept Car 004"** (ứng viên A bên dưới), **chỉ dùng trong Blender** làm nguồn chi tiết cho prerender:
   - bánh/lốp nhiều vertex hơn;
   - các chi tiết < 3 cm đã bị xóa ở bản Khronos.
   - Cùng thiết kế nên không phá tính nhất quán với realtime.
   - Không bắt buộc cho Stage 1–4. Kế hoạch chạy được nếu không có nó (xem EXECUTION_PLAN, cổng A1).
4. **KHÔNG khuyến nghị đổi sang xe khác lúc này.** Một xe khác buộc phải làm lại realtime: rig, proxy, camera, test. Ước tính mất thêm 2–3 ngày công và đổi nhận diện "AXIOM GT". Chỉ cân nhắc nếu sau Stage 8 giám khảo kết luận model là nút thắt còn lại. Khi đó dùng ứng viên B hoặc C, do Founder mua.

## 3. Ứng viên (để Founder duyệt — CHƯA TẢI)

| # | Tên | Nguồn | Giấy phép | Kích thước / độ chi tiết | Chi phí | Ghi chú và rủi ro |
|---|---|---|---|---|---|---|
| **A** (khuyến nghị) | **Free Concept Car 004 – public domain (CC0)**, tác giả Unity Fan | https://sketchfab.com/3d-models/free-concept-car-004-public-domain-cc0-4cba124633eb494eadc3bb0c4660ad7e (được README Khronos CarConcept dẫn là nguồn gốc) | Tiêu đề và README Khronos ghi **CC0**. Trang Sketchfab hiện hiển thị nhãn "Free Standard" ⇒ **phải xác nhận giấy phép trên trang tải** trước khi dùng | **406,5 k tam giác / 235,3 k vertex**. Dung lượng file không ghi trên trang; ước 30–80 MB FBX + texture | 0 | **Cùng thiết kế với AXIOM GT.** Cần tài khoản Sketchfab/Fab để tải; agent không được tạo tài khoản ⇒ **Founder tự tải** rồi đặt vào `automotive-flagship/source/` (không vào `public/`). FBX có skin, transform âm (README) ⇒ cần dọn trong Blender khoảng nửa ngày. Gốc có logo Khronos? Không, logo do Khronos thêm sau; nhưng vẫn phải soát logo/chữ. |
| B | **Crossblade CB16** — "Concept sports car with rig and full interior" (argentum3d / thiết kế pixelpoems.de) | https://superhivemarket.com/products/concept-sports-car-with-rig-and-full-interior | Royalty Free ("for any purposes", theo trang) | Full quad, subdivision-ready, nội thất đầy đủ, có rig và studio setup Cycles. Trang không ghi số polygon/dung lượng. Blender 2.8–2.9 | **25 USD** | Xe khác ⇒ phải làm lại realtime (mục 2.4). Trang ghi tác giả không thống nhất ⇒ phải xác minh quyền thương mại. File cho Blender 2.9 ⇒ mở được trong 5.2 nhưng có thể cần sửa shader. |
| C | **Hyper Vision AK24** (CGTrader) | https://www.cgtrader.com/3d-models/car/concept-car/hyper-vision-ak24 | Royalty Free, no-AI (theo kết quả tìm kiếm; **không mở được trang để xác minh**) | Native .blend, modifier chưa apply, có nội thất, khoang máy, khung gầm | **120 USD** (theo snippet) | Phải xác minh: thiết kế gốc hay "inspired by" một hãng; điều khoản no-AI có thể xung đột với quy trình dùng agent. Xe khác ⇒ như B. |
| — (loại) | Các model "P1-inspired", "Veyron style", "Zenvo"… | CGTrader / Superhive | — | — | — | **Loại**: mô phỏng xe thương hiệu thật, vi phạm quy tắc trade dress. |
| — (loại) | Model free trên OpenGameArt/CGTrader dạng low-poly | — | CC0 / RF | low-poly | 0 | **Loại**: kéo chất lượng xuống (đã đánh giá ở v1, xem MASTER_STATUS). |

Nguồn tra cứu (05/11/2026):
- [Khronos CarConcept README](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept)
- [Sketchfab FCC004](https://sketchfab.com/3d-models/free-concept-car-004-public-domain-cc0-4cba124633eb494eadc3bb0c4660ad7e)
- [Superhive Crossblade](https://superhivemarket.com/products/concept-sports-car-with-rig-and-full-interior)
- [CGTrader AK24](https://www.cgtrader.com/3d-models/car/concept-car/hyper-vision-ak24)

## 4. Tài sản môi trường (không cần xin thêm)

| Tài sản | Dùng cho | Ghi chú |
|---|---|---|
| `concrete_floor_02` (CC0, đã duyệt) | Sàn studio | Cả Blender và realtime |
| `studio_small_09_2k.hdr` (CC0, đã duyệt) | Fill/IBL phụ | Chỉ dùng trong Blender, cường độ thấp |

- Softbox, strip và cyclorama **dựng bằng hình học trong script** (sở hữu BAHA).
- **Không cần HDRI hay backplate mới.**
- Logo: không có. Biển số: giữ texture "BAHA·GT 01" (`plateTexture`).
- Prerender phải dùng cùng nội dung biển số. Builder xuất canvas biển số thành PNG để dùng trong Blender.
