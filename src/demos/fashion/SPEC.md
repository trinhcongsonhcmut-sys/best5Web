# SPEC — Demo 4 · Fashion (`/fashion`)

Đọc trước: `BUILDER_BRIEF.md`, `reference/E1-analysis.md`, `reference/E2-analysis.md`, `reference/PALETTES.md`; xem `reference/shots/E1-contact.jpg`, `E2-contact.jpg`.

## Mẫu → cơ chế (đã quan sát)
- **E2 (áo phao):** áo phao bóng lơ lửng giữa khung trên nền **gradient bão hòa đổi màu theo colorway** (cam → than → xám bạc → đỏ), có bóng đổ mềm dưới áo; áo xoay/nghiêng nhẹ; áo kế tiếp ở góc phải dưới như "mục tiếp theo"; tiêu đề lớn bên trái, nút chọn size/màu bên phải; chuyển colorway có hiệu ứng áo trượt ra/vào + nền đổi.
- **E1 (cửa hàng hoodie):** giá treo áo ngang, chọn một áo ⇒ phóng to chi tiết (áo hoodie xanh rêu, chữ in). Là giao diện cửa hàng (ảnh 2D) — chỉ mượn cơ chế "treo trên thanh ray + zoom vào một sản phẩm", KHÔNG làm cửa hàng/giỏ hàng/giá.
- Hybrid: ảnh/video render ⇒ dựng áo 3D thật + nền gradient WebGL.

## Concept & sản phẩm chủ đạo
**Áo phao (puffer jacket) 3D** làm nhân vật chính (khớp E2, là sản phẩm có chất liệu đẹp để trình diễn: nylon bóng, khoang bông phồng, khóa kéo, cổ cao). Tên/nhãn giả lập của BAHA (không logo thật). Tùy chọn phụ: dải thanh ray + vài áo mờ phía sau (instanced) ở mốc 0% để gợi E1.

## Mô hình (dựng bằng code, thuyết phục)
Thân: lưới tham số (lathe không đối xứng/ellipse theo chiều cao) + **khoang bông (baffles) bằng vertex displacement** dạng sin theo chiều dọc, nén ở đường may; tay áo: chuỗi khoang cong theo đường CatmullRom, bo cổ tay; cổ cao có viền; gấu áo bo chun; khóa kéo (Tube + răng instanced), đường may (Line/Tube mảnh), cúc bấm/logo tab tự vẽ. Đối xứng nhưng có bất đối xứng nhỏ (nếp gấp) để không "nhựa". Phải đẹp ở mặt trước/sau/bên.

## Timeline (5 mốc) — camera như buổi chụp editorial
0% áo lơ lửng giữa khung, góc thấp nhẹ, tiêu đề lớn sau/bên áo · 25% dolly sang 3/4, nền gradient bắt đầu chuyển màu · 50% **áo xoay nửa vòng**, bố cục dịch sang phải, chữ đổi · 75% macro: texture nylon, khoang bông, khóa kéo, đường may (camera rất gần nhưng không cắt hỏng) · 100% khung cuối: nhìn từ phía sau/3-4 thấp, áo + chữ kết, bóng đổ mềm.

## Biến thể (≥3) — colorway, đổi trên mô hình 3D **và** gradient nền (WebGL)
Cam Bão Hòa · Than Đen · Đỏ Rượu (hoặc Xám Bạc). Chuyển có trượt/dissolve mượt; `primary` = vải áo (màu + sheen/clearcoat giữ nguyên).

## Hover
Rim sáng viền khoang bông + tăng sheen/clearcoat, áo nghiêng nhẹ theo con trỏ (parallax nhỏ có kiểm soát).

## Vật liệu/ánh sáng
Nylon ciré: `MeshPhysicalMaterial` roughness .28–.4, clearcoat .3–.6, sheen; softbox lớn + rim ngược sáng; nền gradient: shader plane lớn phía sau (không CSS filter). Bóng đổ: ContactShadows mềm trên mặt sàn vô hình / blob shadow dưới áo lơ lửng. Hạt lông vũ rất ít (tùy chọn).

## Phong cách
Editorial thời trang, bão hòa mạnh, tương phản: serif hiển thị lớn (Playfair/Bodoni Moda/Instrument Serif) + grotesk mảnh (Space Grotesk/Manrope) cho nhãn; layout bất đối xứng; màu chữ thích ứng theo nền (tối/sáng).
