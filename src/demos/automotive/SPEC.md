# SPEC — Demo 5 · Automotive (`/automotive`)

Đọc trước: `BUILDER_BRIEF.md`, `reference/F-analysis.md`, `reference/PALETTES.md`; xem `reference/shots/F-contact.jpg`.

## Mẫu → cơ chế (đã quan sát)
Mẫu F là video: trang giới thiệu xe bán tải thân góc cạnh, nền sa mạc (trời xanh nhạt → cát be), xe nhìn ngang ở hero; cuộn: `.01 PERFORMANCE AND EFFICIENCY` (xe ngang, thông số bên phải), `.02 EXOSKELETON` (xe xoay 3/4, **bánh/khung tách ra, thân hiện cấu trúc**), `.03 VERSATILE UTILITY` (nhìn từ sau, **dải đèn đỏ phía sau sáng**); thanh tiến độ ngang phía dưới, chữ đánh số lớn bên trái, bảng số liệu mảnh bên phải.
Hybrid: video render ⇒ dựng realtime.

## ⚠ Bản quyền
Mẫu là một mẫu xe thương hiệu cụ thể. **Không** dùng tên/logo/chữ thương hiệu; thiết kế xe là **bản gốc của BAHA**: *xe bán tải điện thân góc cạnh (faceted)* với tên giả lập (vd "AXIOM T1"), khác biệt đủ về tỉ lệ/chi tiết; chỉ tái dựng cơ chế trình diễn.

## Mô hình (không low-poly rẻ tiền)
Thân: profile bên (polyline) → ExtrudeGeometry có **bevel nhỏ** ⇒ mặt phẳng lớn + cạnh vát sắc; kính (panel nghiêng, tối, phản chiếu mạnh, clearcoat), cột/khung, mui tonneau, **dải đèn LED trước/sau (emissive)**, gầm/khung gầm + hệ treo thấy khi tách, 4 bánh: lốp (Lathe có tread/rãnh bằng normal procedural hoặc geometry) + mâm (spokes extrude, phanh đĩa thấy sau mâm), vòm bánh, gương, tay nắm âm, khe panel (rãnh mảnh), chi tiết nhỏ tạo "độ đắt". Đối xứng nhưng thêm chi tiết bất đối xứng (cổng sạc). Phải đẹp ở mọi góc 360°.

## Timeline (5 mốc)
0% xe ngang giữa khung, tiêu đề lớn phía trên (typography đồ họa mạnh) · 25% `.01` — xe nhích 3/4, bảng số liệu hiện bên phải · 50% `.02 EXOSKELETON` — **tách panel/exploded**: bánh hạ ra, thân nhấc lên, khung hiện, camera 3/4 cao · 75% `.03` — vòng ra phía sau, dải đèn đỏ sáng dần, macro sơn/kính/phản chiếu · 100% khung cuối ngang/3-4 thấp, xe lắp lại hoàn chỉnh. (Mở cửa/exploded: ưu tiên chất lượng phần chính trước.)

## Biến thể (≥3) — sơn/vật liệu
Thép chải (metalness 1, roughness .35) · Đen nhám · Cát sa mạc/olive (sơn + clearcoat). `primary` = vật liệu thân; đổi trực tiếp, giữ phản chiếu.

## Hover
Trỏ vào thân/kính/dải đèn/mâm ⇒ rim + emissive theo bộ phận (vd dải đèn sáng lên), mượt.

## Ánh sáng
Studio/sa mạc: lightformer dải dài ngang trên thân (cho phản chiếu thép đẹp), softbox bên, rim ngược; sàn cát với bóng mờ (`ContactShadows`) + gradient trời → cát; bụi nhẹ (ít). Phản chiếu là yếu tố sống còn của demo.

## Phong cách
Kỹ thuật – tối giản – công nghiệp: sans geometric đậm + mono mảnh cho số liệu (Space Grotesk / Unbounded / JetBrains Mono), đánh số `.01 .02 .03`, thanh tiến độ dưới đáy, bảng số liệu bên phải; nền trời-cát (khác nền tối của các demo khác).
