# SPEC — Demo 3 · Luxury Real Estate (`/real-estate`)

Đọc trước: `BUILDER_BRIEF.md`, `reference/D-analysis.md`, `reference/PALETTES.md`; xem `reference/shots/D-contact.jpg`.

## Mẫu → cơ chế (đã quan sát)
Mẫu D là video: trang giới thiệu tòa nhà cao tầng lúc hoàng hôn, **cuộn = camera bay xuyên công trình**: toàn cảnh tháp → sảnh tầng trệt (nhãn "GROUND FLOOR") → các tầng (LEVEL 34, SKY LEVEL 48) nhìn vào căn hộ có nội thất ấm → hồ bơi tầng thượng (overlay lưới xanh, nhãn "INFINITY POOL") → quay lại toàn cảnh thành phố đêm; **thanh chỉ báo tầng bên phải** và nhãn góc phải đổi theo tiến độ; ánh sáng chuyển hoàng hôn → đêm.
Hybrid: video render sẵn ⇒ ta dựng công trình realtime.

## ⚠ Lệch đề bài có chủ đích (báo Founder)
Spec gốc yêu cầu "Luxury Villa", mẫu D là **tháp**. Giải pháp: **biệt thự hiện đại nhiều tầng** (3 tầng + mái hồ bơi infinity, tầng hầm/garage, cantilever, tường kính) giữ nguyên **cơ chế** của mẫu: camera bay từ toàn cảnh → từng tầng → chi tiết, chỉ báo tầng bên phải (`GROUND · LEVEL 1 · LEVEL 2 · ROOFTOP · OVERVIEW`), ánh sáng hoàng hôn → đêm, hover làm nổi bộ phận.

## Mô hình (dựng bằng code, vật liệu thuyết phục)
Khối kiến trúc: các hộp/tấm vát, mái chìa (cantilever), tường kính (MeshPhysical trong suốt nhẹ — KHÔNG transmission nặng; dùng opacity + env), khung thép đen, ốp đá travertine (texture canvas procedural có vân + normal/bump), gỗ lam đứng, lan can kính, hồ bơi (đáy xanh + mặt nước bằng `MeshReflectorMaterial` độ phân giải thấp hoặc shader nước nhẹ), cây (instanced cọ/tre đơn giản đẹp), đèn âm sàn/đèn tường phát sáng (emissive), nội thất ấm hiện qua kính (sofa, đèn treo — hộp/lathe đơn giản nhưng có hình), xe? (không bắt buộc). Nền đất + đường dẫn + ánh phản chiếu ướt. Dùng **ContactShadows/AO baked** (`frames={1}`) cho chiều sâu; sky dome gradient + sao nhẹ ban đêm.
Không "ảnh 2D phóng to": mọi lớp có độ sâu thật; camera luồn qua không gian có nhiều lớp (cây tiền cảnh, đường, tòa nhà, núi/đô thị mờ phía xa).

## Timeline (5 mốc)
0% toàn cảnh hoàng hôn (xanh dương tím + đèn nhà bật) · 25% hạ xuống lối vào/tầng trệt (nhãn GROUND) · 50% bay lên mặt tiền tầng 1–2, nhìn xuyên kính vào phòng khách ấm (nhãn LEVEL) · 75% tầng thượng/hồ bơi infinity, cận vật liệu (đá, gỗ, kính, nước) · 100% khung cuối điện ảnh toàn cảnh đêm. Ánh sáng/màu chuyển theo tiến độ (sky, đèn emissive tăng, fog).

## Biến thể (≥3) — vật liệu mặt tiền
Travertine · Basalt đen + gỗ · Terracotta. `primary` = vật liệu ốp mặt tiền chính (đổi màu + roughness trực tiếp, giữ AO/phản chiếu).

## Hover
Trỏ vào từng bộ phận (hồ bơi, tường kính phòng khách, mái, lam gỗ) ⇒ rim + emissive tăng + nhãn DOM nhỏ (tên bộ phận). Mốc 0% hover vào khối chính phải đạt `hover.value > 0.4`.

## Phong cách
Điện ảnh, sang trọng, tối giản: nền hoàng hôn xanh/vàng, chữ serif nhẹ + sans mảnh viền vàng nhạt (Marcellus / Tenor Sans / Cormorant), HUD chỉ báo tầng dạng thước dọc. Khác hẳn 4 demo còn lại: không gian rộng, camera bay dài.

## Hiệu năng
Tối đa ~250k tam giác; instancing cho cây/lam gỗ/cửa sổ; shadow ≤ 2048 một directional baked; MeshReflector ≤ 512; tắt shadow động nếu cần.

## v2 · photoreal (05/11/2026) — mẫu `reference/v2/real-estate-ref-1.webp`
- **Kiến trúc** (`architecture.ts`): biệt thự 2 tầng mái bằng kiểu "khung đua": khối A (sàn L1 + mái bê tông sẫm đua 2,2 m, trụ đá khối, ốp gỗ ấm, kính sàn-trần, lan can kính không khung, ống khói đá, hồ tràn trên mái), sảnh thang kính sau lam thép đen, cánh B (garage cửa gỗ + phòng trên có ban công kính). Đèn âm trần + vệt sáng "scallop" trên trụ/ốp gỗ, nội thất ấm.
- **Mốc camera giữ nhịp v1** (`Scene.tsx` STOPS): 0 hero trên bãi cỏ → 0,25 Ground (hiên dưới sàn đua) → 0,5 Level 1 (ban công kính) → 0,62 Suite (góc tây) → 0,75 Roof (hồ tràn + hologram) → 1 Overview đêm. Rail: Overview · Roof · Suite · Level 1 · Ground.
- **Vật liệu** (`materials.ts`): scan CC0 Poly Haven, UV theo mét thật (`kit.ts` `UV_TILE`), normal + ARM (AO/roughness): đá `sandstone_blocks_05`, fascia/sàn đua `concrete_floor_02` (Lambert mờ, khử bão hoà + nén tương phản), hiên `concrete_floor_02` sáng, gỗ `brown_planks_03` (ván ngang), cỏ `leafy_grass` (chuyển sắc xanh, sọc cắt cỏ, biến thiên macro, AO nền nướng trong shader). Contact-AO giải tích theo cao độ sàn/trần trên tường.
- **Biến thể mặt tiền** (`primary` = `mass:stone`): Sandstone (scan đá) · Basalt (cùng scan, tint lạnh, khử bão hoà, nhám 0,78, normal mạnh) · Board Concrete (đổi hẳn sang bộ scan bê tông).
- **Ánh sáng**: HDRI `belfast_sunset_puresky_2k.hdr` → `env.ts` lọc 2K→1K + nén đỉnh mặt trời (mặt trời do đèn key có bóng đảm nhận); cùng texture cho IBL và vòm trời (`Sky.tsx`, trộn gradient chạng vạng → đêm có sao). Key light thấp phía trước-trái, shadow map 2048 đóng băng sau 6 frame.
- **Cảnh quan** (`Landscape.tsx`): cỏ thật 90k ngọn (cửa sổ cuộn theo ống kính, neo theo thế giới), cây sồi/thông bằng thẻ lá alpha + lõi đặc (early-z), shader lá chiếu sáng theo đỉnh (rẻ ~3× Lambert), vòng cây xa, cây che chủ thể tự mờ dần.
- **Texture dẫn xuất**: `node src/demos/real-estate/scripts/make-textures.mjs` (sharp, lanczos3) tạo `<id>_{diff,nor_gl,arm}_1k.webp` cạnh bản 2K gốc trong `public/assets/textures/<id>/`.
