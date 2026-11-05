# PALETTES — bảng màu + font đề xuất cho 5 demo (đo từ 8 link tham khảo)

> Ký hiệu: **(đo)** = lấy mẫu 5×5 px từ ảnh chụp video tham khảo; **(suy ra)** = tính/điều chỉnh từ màu đo để dễ dùng (tương phản, sáng hơn/đậm hơn); **(ước)** = ước lượng bằng mắt (chưa đo được). Màn hình laptop quay bằng camera nên A1/B/C/D/E1 lệch nhẹ so với thiết kế gốc; E2 và F (screen-capture) sát hơn.
> Font: tất cả là Google Fonts (giấy phép OFL, dùng thương mại được) — 22 họ font **không trùng nhau** giữa các demo để 5 demo khác biệt rõ.
> Nguyên tắc tách biệt: mỗi demo một "họ màu" + một "giọng chữ" + một "nhịp chuyển động": Beauty = lạnh-xanh, thanh, nhẹ; F&B = nâu ấm → đỏ rượu, editorial; Real estate = navy–vàng đồng, điện ảnh chậm; Fashion = khối màu bão hoà, táo bạo; Automotive = sa mạc khử bão hoà + thép, kỹ thuật/HUD.

---

## Demo 1 — Beauty & Cosmetics (nguồn A1 + A2) — "Aloe & Sky"

| Vai trò | Hex | Nguồn |
|---|---|---|
| Nền trời chính | `#7ab9e6` | đo A1 (48% màn hình) |
| Nền sáng/vùng bloom | `#95dafd` → mở rộng `#cdeeff` | đo A1 / suy ra |
| Xanh lục sâu (thân hũ) | `#04381a` (tối) · `#165a37` (sáng) | đo A1 |
| Than chì (nắp) | `#19202e` | đo A1 |
| Ngà (chữ nhãn, UI) | `#f4f1e8` | suy ra |
| Nhấn lime | `#afd058` | đo A2 (nút) |

**3 biến thể sản phẩm/thế giới** (yêu cầu ≥3; đổi vật liệu + nền cùng lúc, theo A2):
- Berry: liquid `#682b46` (tối `#391733`, sáng `#b87788`), thế giới `#015b75`
- Cam: liquid `#f37803` (tối `#d74c01`), thế giới `#e3aa75`
- Kiwi/Sage: liquid `#034605` (sáng `#6aa386`), thế giới `#437b5a`

**Font (2 cặp)**
1. **Bodoni Moda** (display Didone, tương phản cao — gần "NOURISH" của A1) + **Inter Tight** (UI/nhãn).
2. **Playfair Display** (display + italic cho dòng phụ) + **Albert Sans** (UI).
Gợi ý chữ: tiêu đề cực lớn (~24% chiều cao viewport) đặt *sau* canvas; nhãn nhỏ tracking +4%.

---

## Demo 2 — F&B (Cafe nguồn B, Restaurant nguồn C) — "Crema → Rosso"

Hai cảnh dùng chung 1 hệ nhưng đổi chủ đạo khi chuyển cảnh.

| Cảnh | Vai trò | Hex | Nguồn |
|---|---|---|---|
| A Cafe | Espresso (nền tối) | `#240d03` | đo B |
| A Cafe | Mocha | `#482514` | đo B |
| A Cafe | Caramel | `#bb743c` | đo B |
| A Cafe | Crema | `#e3b678` | đo B |
| A Cafe | Foam/kem | `#f5e2ca` | đo B |
| A Cafe | Kraft (túi) | `#d9b897` | đo B |
| B Restaurant | Burgundy "rosso" | `#682319` (tối `#3d140d`) | đo C |
| B Restaurant | Kem nền | `#eee7d2` | đo C |
| B Restaurant | Cà chua | `#c9381f` (mẫu đo tối `#9f1d13`) | suy ra / đo C |
| B Restaurant | Mì vàng | `#e8b787` (sáng `#f4b276`) | đo C |
| B Restaurant | Húng quế | `#3f7a2a` | suy ra |
| B Restaurant | Vẹm đen | `#1b1717` | đo C |

Bộ 6 màu lõi để thiết kế UI chung: `#240d03` · `#bb743c` · `#e3b678` · `#f5e2ca` · `#682319` · `#c9381f`. Chuyển cảnh Cafe→Restaurant: nền kem `#f5e2ca` → burgundy `#682319` (gần ở khung cuối B và khung đầu C).
Biến thể ly (≥3): men kem `#efe3d0` / than `#2b2623`(suy ra) / terracotta `#b5523a`(suy ra).

**Font (2 cặp)** — Cafe dùng chữ đặc dày, Restaurant dùng serif ấm
1. **Archivo Black** (headline cafe, HOA, giống "ARTISAN ROAST") + **Fraunces** (headline restaurant, serif mềm, có trục SOFT/WONK) + **DM Sans** (body).
2. **Bricolage Grotesque** (cafe) + **DM Serif Display** (restaurant) + **Work Sans** (body).

---

## Demo 3 — Luxury Real Estate (nguồn D) — "Dusk & Brass"

| Vai trò | Hex | Nguồn |
|---|---|---|
| Đêm sâu | `#0e1626` | suy ra (tối hơn `#161919` đo) |
| Navy nền kính | `#293546` | đo D |
| Xanh hoàng hôn | `#365987` (sáng `#3a6795`) | đo D |
| Gỗ ấm nội thất | `#967c65` (sáng `#dac3a9`) | đo D |
| Vàng đồng (CTA) | `#c5ac86` | đo D (nút "BOOK A VIEWING") |
| Ngà (chữ/ánh đèn) | `#e8e2d4` | suy ra |

Phụ: xanh hồ bơi phát sáng `#2a8fbf` (ước), ánh LED vàng `#e8c98a` (suy ra), bầu trời hoàng hôn cam `#e0a070` (suy ra). Mã màu thời gian trong ngày: dusk `#365987` → sunset `#e0a070` → night `#0e1626` (lerp theo scroll).

**Font (2 cặp)**
1. **Cormorant Garamond** (Light/Medium cho headline "YOUR LIFE. ELEVATED."; số tầng "LEVEL 48" dùng weight 300 + số 600) + **Jost** (nhãn HOA tracking +12%, nav).
2. **Marcellus** (chữ La Mã HOA, kiến trúc) + **Outfit** (UI).

---

## Demo 4 — Fashion (nguồn E1 + E2) — "Colour-block Puffer"

| Vai trò | Hex | Nguồn |
|---|---|---|
| Than/đen | `#282725` | đo E2 |
| Cam | `#e66914` (tối `#b85613`) | đo E2 |
| Bạc | `#bbc1c6` (tối `#7c8286`) | đo E2 |
| Đỏ thẫm | `#a80102` (tối `#780505`) | đo E2 |
| Nền ngoài trên / dưới | `#fe5702` / `#fe9802` | đo E2 |
| Trắng giấy (rail E1) | `#d8d7d5` | đo E1 |

Phụ (rail E1): xanh rừng `#163023` (đo), be `#b6a891` (đo), rosewood `#9d6b78` (ước), thanh treo `#6f6f6a` (đo). **4 biến thể áo** đề xuất: than `#2b2a28`, cam `#e8691a`, bạc `#b8bec4`, đỏ `#a80102` — đổi nền trang đồng bộ (xem `E2-analysis.md`). Chữ trắng trên than/cam/đỏ; **chữ than `#1a1918` trên nền bạc** (bản gốc trắng-trên-bạc tương phản thấp).

**Font (2 cặp)**
1. **Instrument Serif** (italic cho dòng phụ "Without trying") + **Familjen Grotesk** (headline/UI, gần cảm giác sans của "Stand out").
2. **Syne** (ExtraBold, headline hơi kỳ lạ kiểu editorial) + **JetBrains Mono** (giá, size, nhãn kỹ thuật).
(Nếu cần bám sát nguồn E2: Montserrat Medium — nhưng sẽ gần Demo khác hơn.)

---

## Demo 5 — Automotive (nguồn F) — "Desert Steel"

| Vai trò | Hex | Nguồn |
|---|---|---|
| Trời nhạt | `#c1d7db` | đo F |
| Cát sáng (nền, fog) | `#cfc3ae` | đo F |
| Cát tối/đổ bóng | `#aea9a0` | đo F |
| Thép/inox (thân xe) | `#d8d9d8` (tối `#79746a`) | đo F |
| Than chì (lốp, trim, chữ) | `#292927` | đo F |
| Dải đèn hậu (nhấn) | `#e8383d` | ước (bằng mắt, chưa đo được pixel phát sáng) |

Phụ: khung ngoài `#c9b89a` / `#a6967d` (đo F); underglow xanh lam `#6fb7ff` (ước); clay ghost `#c4baa9` (đo F khung .02). **3 màu sơn** đề xuất (ngoài inox): cát `#b5a283`(suy ra), xanh sương `#7a9aa6`(suy ra), than `#2b2c2e`(suy ra) — giữ metalness 0,6 + clearcoat.

**Font (2 cặp)** — đối lập với Demo 1/3 (không serif)
1. **Barlow Condensed** (700, tiêu đề chương ".01 PERFORMANCE…" ) + **IBM Plex Mono** (số liệu 500 / 10k+ / 2.9s, nhãn HUD).
2. **Saira Condensed** (headline) + **Space Grotesk** (body/UI).
Gợi ý: tag/wordmark BAHA viết tay (SVG) thay cho tag graffiti "CYBERTRUCK" (không copy).

---

## Ma trận khác biệt nhanh

| Demo | Họ màu | Giọng chữ | Nhịp/camera | Nền |
|---|---|---|---|---|
| Beauty | xanh trời + lục + ngà | Didone cỡ siêu lớn | chậm, đối xứng, dolly-in nhẹ | sáng, mờ ảo |
| F&B | nâu → đỏ rượu + kem | grotesque đặc + serif ấm | chuyển cảnh rõ (2 cảnh), hạt bay | tối ấm → sáng kem |
| Real estate | navy + vàng đồng | serif nhẹ HOA + tracking | điện ảnh, crane/dolly dài | hoàng hôn → đêm |
| Fashion | cam/đỏ/than/bạc | serif italic + grotesque lạ | cắt nhanh theo màu, turntable | khối màu bão hoà |
| Automotive | cát + thép + đỏ nhấn | condensed + mono | orbit theo chương, exploded | sa mạc khử bão hoà |
