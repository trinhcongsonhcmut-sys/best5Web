# SPEC — Demo 2 · Cafe & Restaurant (`/fnb`) — hai cảnh trong một route

Đọc trước: `BUILDER_BRIEF.md`, `reference/B-analysis.md` (cafe), `reference/C-analysis.md` (nhà hàng), `reference/PALETTES.md`; xem `reference/shots/B-contact.jpg`, `C-contact.jpg`.

## Mẫu → cơ chế (đã quan sát)
- **B (Coffee):** hero nền nâu sẫm, túi cà phê → ly cappuccino lơ lửng có hơi nước → **hạt cà phê bay tán loạn có chiều sâu** quanh sản phẩm → máy espresso; nền chuyển nâu sẫm → be/caramel; tiêu đề sans đậm khổng lồ hai bên vật ("RICH AROMA"-style), chuyển cảnh có motion blur ngang.
- **C (Rosso):** nền đỏ burgundy, nĩa với mì xoắn + tôm + húng quế; cuộn: mì **tháo xoắn thành dải xoắn ốc lơ lửng cùng nguyên liệu** (cà chua, trai, tôm, húng) có nhãn chỉ dẫn mảnh, nền chuyển kem; cuối: các nguyên liệu **rơi/gom lại thành món trên đĩa** ("YOUR TABLE IS WAITING"). Serif thanh lịch.
- Hybrid: cả hai mẫu là video render sẵn ⇒ dựng realtime toàn bộ: ly, hạt, hơi nước, đĩa, mì, tôm, trai, cà chua, húng.

## Hai cảnh độc lập, một route, chuyển cảnh mượt
**Cảnh A — Cafe (0–45%)** · **Chuyển cảnh (40–55%)**: hạt cà phê cuốn thành "gió" xoáy qua khung hình, nền nâu → burgundy bằng gradient WebGL (không cắt cứng) · **Cảnh B — Restaurant (50–100%)**.
5 mốc: 0% hero cafe (ly lơ lửng giữa, hạt tản xa) · 25% hạt bay quanh ly theo quỹ đạo, ly xoay, hơi nước · 50% **chuyển cảnh** (hạt xoáy, nền đổi, đĩa trống xuất hiện) · 75% nguyên liệu mì/tôm/trai/cà chua/húng xoắn ốc lơ lửng, camera quay quanh · 100% món hoàn chỉnh trên đĩa, camera cuối điện ảnh (high-angle nhẹ).

## Vật thể (dựng bằng code, chi tiết thật)
Ly: LatheGeometry (thành ly + quai là Tube), cà phê mặt có latte art (texture canvas tạo bằng code), hơi nước (sprite/particles mềm). Hạt cà phê: **InstancedMesh** (~150–250 hạt: ellipsoid bóp + rãnh giữa bằng displacement, roughness .35, màu nâu rang). Đĩa: Lathe (viền, gờ). Mì: nhiều TubeGeometry theo đường helix có nhiễu; tôm: chuỗi đốt thon cong; trai: vỏ lathe nửa + ruột; cà chua: cầu + đài; húng: lá cong. Sốt: vệt bóng. Ba nhóm vật phải **đẹp ở mọi góc** (orbit 360°).

## Biến thể (≥3)
Màu men ly (Cream · Matte Black · Terracotta) — đồng thời đổi men đĩa ở cảnh B. Vật liệu `primary` = men gốm.

## Hover
Rim + highlight trên ly/đĩa/món đang trỏ; hạt gần chuột có thể nảy nhẹ (tùy chọn, có kiểm soát).

## Phong cách
Hai bảng màu & hai kiểu chữ trong CÙNG route: cafe = nâu/caramel + sans đậm condensed-ish (Bricolage Grotesque / Syne / Unbounded); restaurant = burgundy/kem + serif thanh lịch (Instrument Serif / Fraunces). Chữ đổi theo mốc (`useStageIndex`).

## Hiệu năng
Hạt instanced, mì ≤ ~30 tube ≤ 2k tris mỗi tube; shadow map ≤ 1024; không transmission nặng; DPR do `Stage`.
