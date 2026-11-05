# SPEC — Demo 1 · Beauty & Cosmetics (`/beauty`)

Đọc trước: `BUILDER_BRIEF.md`, `reference/A1-analysis.md`, `reference/A2-analysis.md`, `reference/PALETTES.md`, và xem ảnh `reference/shots/A1-contact.jpg`, `A2-contact.jpg` (ảnh chỉ để quan sát cục bộ).

## Mẫu → cơ chế cần tái dựng (đã quan sát, không bịa thêm)
- **A1 (hũ kem, nền xanh băng):** hũ kem thủy tinh xanh lá, nắp đen nhám, đặt giữa khung; chữ serif khổng lồ **nằm sau** hũ (hũ che một phần chữ); lá lô hội lớn ở tiền cảnh rẽ ra khi cuộn; hũ nghiêng/xoay; sau đó các thành phần (lô hội, vitamin E, squalane, bơ hạt mỡ, trà xanh) hiện ra quanh hũ có đường nối + nhãn; cuối: hũ lơ lửng trên nền sáng.
- **A2 (chai nước ép, đổi vị):** chai thủy tinh trong rất lớn, cắt khung; **màu nền + màu chất lỏng chuyển mượt** xanh dương → cam → tím → xanh lá theo cuộn; chữ sans tròn lớn bên trái; chai là điểm nhấn thị giác. (Con tắc kè là ảnh render — KHÔNG dựng.)
- Hybrid: ảnh/video mẫu là render sẵn → ta dựng toàn bộ vật thể bằng WebGL thật; nhãn thành phần làm bằng DOM + đường nối neo theo vị trí 3D (drei `Html`/project vector).

## Concept
Một lọ/hũ cao cấp (đề xuất: **hũ kem thủy tinh mờ + nắp nhám**, có thể thêm chai serum nhỏ dropper làm vật phụ) trong phòng chụp high-key, pastel, mềm mại. Tên thương hiệu giả lập của BAHA (không dùng "VERA"/"Chroma"/logo thật).

## Timeline (5 mốc, scroll scrub)
0% Hero: hũ giữa khung, chữ serif khổng lồ phía sau (lớp DOM `z-index` dưới canvas HOẶC mesh chữ phía sau vật — chọn cách cho hũ che chữ đúng), lá lô hội tiền cảnh (mesh lá uốn cong, vật liệu sss giả) · 25% First Reveal: lá rẽ/bay ra hai bên, nắp nâng lên · 50% Transformation: hũ xoay + nghiêng, các nguyên liệu (giọt dầu, hạt, lát lô hội, quả ô liu… dựng bằng mesh) quỹ đạo quanh hũ, nhãn thành phần hiện · 75% Detail/Material: camera lại gần, thấy thủy tinh/ren nắp/kem bên trong (tách lớp: nắp – thân – kem) · 100% Final: hũ + chữ kết, bố cục sạch.

## Biến thể (≥3, đổi trên 3D + nền)
3 phối màu kiểu A2: ví dụ *Forest Green · Rose Quartz · Amber* — thay màu thủy tinh/kem/nắp + gradient nền trong cảnh (nền là một phần WebGL, không CSS filter). Giữ clearcoat/transmission.

## Hover
Rim sáng trên thân hũ (`addRim`) + thủy tinh sáng nhẹ, nắp lóe highlight; vào/ra mượt.

## Vật liệu/ánh sáng gợi ý
Thủy tinh: `MeshPhysicalMaterial` transmission thấp (≤0.6, thickness, ior 1.5) + frosted roughness; **chỉ 1 lớp transmission** (iGPU). Kem: MeshPhysical sheen/clearcoat. Nắp: nhám, roughness 0.55. Env: Lightformer softbox lớn trên + dải sáng đứng bên cạnh; bóng mềm bằng `ContactShadows`. Hạt sáng: Points/instanced nhỏ, ít (≤200), additive nhẹ.

## Phong cách (khác 4 demo còn lại)
Sáng – thoáng – editorial thời trang mỹ phẩm; serif tương phản cao (Bodoni Moda / Cormorant Garamond / Italiana) cho chữ lớn, sans nhỏ (Inter/Manrope) cho nhãn; nhiều khoảng trắng; chuyển động chậm, mượt (ease dài).
