# E1 — Thanh treo đồ streetwear (Shopify editor) — phân tích kỹ thuật

- URL: https://www.pinterest.com/pin/1131740581423356428/
- Trạng thái: **VERIFIED (media)** · Loại: video 11,31 s, 720×1280, không loop · đăng 16/10/2026
- Người đăng công khai: **Ennomark** (Pinterest `enno_mark`); nguồn: IG reel https://www.instagram.com/reel/Dehp0nWgNWx/ — caption `Comment "ENNOMARK" Get free Demo` (trang IG công khai; có login prompt; **không xem lại video trên IG**). Tiêu đề pin = caption này → **quảng cáo dịch vụ làm web**, nội dung đáng học là cảnh màn hình.
- Bản chất: điện thoại quay **màn hình Shopify Theme Editor** (header editor: "Horizon [Active]", "Store default", "Home page"; khung xanh chọn block "Product"; popup AI "Ask for changes") đang xem section "rack showcase". **Không phải site đã publish**; có UI editor che phủ. Ảnh quần áo là ảnh sản phẩm cắt nền (2D), dưới là băng video lifestyle (người nhảy) toàn chiều ngang.
- Bằng chứng: `shots/E1-page.jpg`, `E1-contact.jpg` (12 khung: t = 0; 1,03; 2,06; 3,08; 4,11; 5,14; 6,17; 7,20; 8,22; 9,25; 10,28; 11,26 s), `E1-v000…v100.jpg`.
- "Viewport" = vùng section trên màn hình (≈ 540 px rộng trong khung quay).

## Timeline quan sát (giây video)

| t (s) | Quan sát |
|---|---|
| 0–0,5 | Thanh treo đang tải: chỉ vài món mờ ở mép trái, rest trống (animation vào) |
| 1,0–2,5 | Hàng 8–9 món treo móc trên **thanh ngang đen** (x 0–100%): hoodie xám (tag "−20%"), áo đen, **hoodie xanh lục "VEIRDO ORIGINAL" ở giữa, quay mặt chính diện (to nhất)**, áo be, áo hồng rosewood (tag "NEW")… Các món xa tâm **hiện nghiêng/ngang như silhouette mỏng**; chữ "Forest Green Hoodie" + nút pill "Shop the Collection" bên dưới; nhãn "NEW COLLECTION | PREMIUM STREETWEAR" phía trên |
| 3,0–5,5 | **Cuộn ngang**: hàng trượt trái; món chính đổi (tên đổi: "Rosewood Crewneck", "Crewneck Chestnut"…), món mới mờ hiện dần (fade-in + ghost); món ở giữa rõ, món hai bên nghiêng |
| 6,0–8,0 | Tiếp tục trượt; áo thun đen "Reign" vào giữa ("Jet Black Tee"); hoodie xanh ở vị trí phải |
| 8,2–9,5 | **Chuyển sang khung chi tiết**: hoodie xanh lục treo móc, **to ~45% chiều cao màn hình**, tên "Forest Green Hoodie", "05 / 09", "Oversized fit · Bottle green", chuyển đổi **Front | Back** (gạch chân Front) |
| 9,5–11,3 | Quay lại hàng treo; món chính xanh lục, mô tả "Crafted in heavyweight fleece. Cut oversized. Made to last." |

## 10 điểm kỹ thuật

1. **Vị trí & tỉ lệ**: món chính (chính diện) rộng ~29% và cao ~43% vùng section (≈ 155×215 px/540), tâm (50%, 47%); hàng xóm rộng ~7–10% (nghiêng) tại x≈ 12%, 24%, 63%, 76%, 88%. Thanh ngang ở y≈ 24% section. Chi tiết: hoodie ~44% chiều cao màn hình, tâm (50%, 38%).
2. **Camera** (ảnh 2D chụp studio): chính diện, ngang tầm ngực, tele nhẹ (không méo); không có chuyển camera 3D — chỉ pan ngang. FOV tương đương ≈ 20–25°.
3. **Nền/ánh sáng**: trắng xám rất sáng `#d8d7d5`–`#f3f3f3` (đo `#d8d7d5` góc trái, `#dcdbd9` giữa), không gradient mạnh; ánh sáng studio mềm đều từ trên-trước; bóng đổ gần như không có (hàng treo trên không). Thanh treo xám kim `#6f6f6a`.
4. **Vật liệu**: vải nỉ/fleece dày hoodie (xanh lục đo `#163023`; sờ mờ, roughness ≈ 0,9, sheen mạnh ở rìa), áo be `#b6a891`/cotton, áo thun đen có in, tag giấy/nhựa đen chữ trắng; móc gỗ nâu đậm (`#6b4a33` ước lượng bằng mắt) + dây thép; logo in chữ kem **lớn kiểu varsity** (không dùng).
5. **Typography & UI**: kicker "NEW COLLECTION | PREMIUM STREETWEAR" sans HOA tracking rộng nhỏ (xám đậm); tên sản phẩm sans trung bình (~3,5% chiều cao màn hình); nút pill viền xám bo tròn "Shop the Collection"; nav "Home / Catalog / Contact" sans nhỏ giữa trên; tag trên áo "−20%", "ONLY 3 LEFT", "NEW" (pill đen chữ trắng nhỏ); chi tiết: "05 / 09" nhỏ xám, tên đậm ~4,5%, tab "Front | Back" gạch chân. (Phần **editor chrome** của Shopify và dock macOS không thuộc thiết kế.)
6. **Chuyển động**: (a) **carousel ngang** với *easing mượt* và quán tính; (b) **rotation theo khoảng cách tới tâm** (coverflow): món ở giữa quay mặt chính diện, món xa xoay ~70–90° quanh trục Y → silhouette mỏng; (c) món mới fade/ghost-in; (d) tên sản phẩm cross-fade theo món ở giữa; (e) chuyển chi tiết: zoom-in/scale món chính + ẩn các món khác; (f) toggle Front/Back có thể là flip 180° quanh Y (not observable chuyển động).
7. **Mốc thời gian**: tải 0–0,6 s; hàng ổn định 1,0–2,6; cuộn ngang 3,0–8,0 (mỗi lần đổi món ~1,0–1,3 s); chi tiết 8,2–9,6; quay lại hàng 9,6–11,3 s.
8. **Mapping scroll**: **cuộn ngang** (trackpad/drag; không thấy cuộn dọc cho phần hàng); chiều: trái-phải; ghi chú: tay không xuất hiện (quay màn hình) nên **không rõ wheel hay drag**. Cuộn ngược: not observable.
9. **Hover/chuột**: **not observable** — con trỏ chỉ thấy hình bàn tay ở 3,1 s trên món bên phải (có thể hover/click chọn món); khung xanh "Product" là **UI editor**, không phải hiệu ứng site.
10. **Phải là WebGL thật** (theo yêu cầu "mannequin/quần áo 3D thật, kéo xoay mọi phía, ≥ 3 màu"): hàng treo 3D (móc + áo/hoodie) với **Y-rotation theo khoảng cách tới tâm**, khung chi tiết xoay 360°, đổi màu vải trực tiếp. **DOM**: kicker, tên, nút, "05/09". **Không dùng** ảnh sản phẩm 2D thay mô hình. Băng video lifestyle bên dưới không thuộc trình diễn 3D (bỏ).

## Dựng bằng Three.js (Demo 4 — Fashion, phương án "rack showcase")

- **Phương án khuyến nghị**: *Garment rack* — thanh treo nằm ngang, 5–7 món (hoodie/áo khoác/áo thun), camera dolly ngang theo scroll, món gần tâm quay mặt trước, món xa xoay −70°…+70°; click/gần-tâm → dolly-in đến món, orbit 360°, toggle màu 3–4 biến thể.
- **Mô hình áo (chưa có asset)**: hai hướng — (1) dùng GLB hoodie/áo khoác **CC0/được cấp phép** (ghi `ASSET_LICENSES.md`), (2) *procedural puffer/hoodie*: 2 panel `PlaneGeometry(1,1,64,80)` (trước/sau) hàn mép → vertex shader displacement tạo nếp rủ (`sin` + noise theo y), 2 tay áo = tapered `TubeGeometry` có elbow, mũ trùm = lathe hở; hoặc **mô phỏng vải bằng Verlet** vài trăm điểm (CPU) chỉ cho món đang chi tiết.
- **Vải**: `MeshPhysicalMaterial({ color:'#163023', roughness:0.88, metalness:0, sheen:1, sheenRoughness:0.45, sheenColor:'#5a8f6e', normalMap:knitNormal, normalScale:[0.6,0.6] })`; `knitNormal` = canvas sinh sọc rib/dệt (tileable); logo là decal canvas riêng của BAHA (không "VEIRDO").
- **Móc & thanh**: `TorusGeometry`+`TubeGeometry` đồng `#b08d57` (metalness 1, roughness 0,3); thanh `CylinderGeometry` r 0,03 xám kim `#6f6f6a`; áo lắc nhẹ quanh điểm treo (spring, damping 0,92; kích hoạt khi scroll nhanh).
- **Env**: studio trắng xám — `Lightformer` softbox lớn trước-trên (`[0,3,4] scale [8,4] intensity 2`), fill hai bên `intensity 1`; nền `#e9e8e6` + `ContactShadows` rất nhẹ ở sàn (nếu có).

### Storyboard camera/scroll (0/25/50/75/100%)

| % | Camera | Cảnh |
|---|---|---|
| 0 | pos [0,0.2,6], target [0,0,0], FOV 26 | thanh treo vào khung (các món xoay ngang, mờ dần vào), kicker + tên món giữa |
| 25 | dolly ngang x +1,5 (một món) | món kế tiếp xoay ra mặt trước, món cũ xoay −70°; đổi tên cross-fade |
| 50 | x +3,0, dolly 5,2 | món "Forest Green Hoodie" giữa; chọn → freeze rail; spin 90° |
| 75 | pos [0.6,0,3.0] FOV 22 | chi tiết: orbit 180° (Front → Back), vải sheen hiển thị, đổi màu 3 biến thể |
| 100 | pos [0,0.1,3.4] | final: món chính rotate chậm; rail mờ ở nền; CTA "Shop the Collection" (DOM, không có giỏ hàng) |
