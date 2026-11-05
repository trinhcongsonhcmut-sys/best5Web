# A1 — "VERA / NOURISH" (hũ kem dưỡng da) — phân tích kỹ thuật

- URL: https://www.pinterest.com/pin/463800461647405738/ (pin chuyển hướng canonical sang `in.pinterest.com/pin/pinterest--998673286111641569/` — cùng nội dung, chuỗi repin)
- Trạng thái: **VERIFIED (media)** · Loại: video 5,07 s, 720×1280, không loop (player trang pin: `loop=false`), ~279,9 nghìn lượt xem (JSON-LD)
- Người đăng công khai: Alex Silverio (`alexsilverio794`, bảng "Vídeo"). Tiêu đề: "Website design for skincare in Figma". **Không có link ngoài / tác giả gốc hiển thị**; bình luận hỏi "how you create this?", "I wonder how well this scales?" — không có câu trả lời của tác giả.
- Bản chất: điện thoại quay một MacBook đang cuộn landing page; chữ phủ "Say less 😎" của người quay (không thuộc thiết kế). Camera điện thoại đứng yên → **mọi chuyển động 3D là của trang web**, không phải camera quay.
- Bằng chứng: `shots/A1-page.jpg` (login modal), `A1-contact.jpg` (11 khung, t = 0, 0,51, 1,01 … 5,02 s), `A1-v000/025/050/075/100.jpg`.
- "Viewport" dưới đây = vùng màn hình laptop (≈443×307 px trong khung video, tỉ lệ ~16:10).

## Timeline quan sát (giây video)

| t (s) | Quan sát |
|---|---|
| 0,0–0,4 | **Hero**: chữ "NOURISH" khổng lồ (serif Didone đen) trên nền xanh trời; lá nha đam lớn **đè lên chữ** (lá che các chữ U-R-I) |
| 0,5–1,0 | Bắt đầu cuộn: lá trượt lên/ra khỏi khung; nắp hũ xuất hiện ở mép trên, thân hũ ở mép dưới (mờ chuyển động) — gợi ý nắp và thân bay vào từ hai hướng rồi lắp lại (khung mờ, không chắc 100%) |
| 1,0–2,0 | Hũ lắp xong, nằm giữa; "NOURISH" mờ còn ~10–15% opacity (xám-xanh) phía sau; nhãn "VERA SKIN NOURISH" rõ; hũ xoay nhẹ quanh trục Y |
| 2,5 | Hũ nghiêng ~8° (roll cùng chiều kim đồng hồ), dịch lên-trái, hơi nhỏ lại; các icon thành phần (rất nhỏ, mờ) bắt đầu xuất hiện quanh hũ |
| 3,0–3,5 | 5 callout thành phần mở rộng ra các góc: Aloe Vera Extract (trên-trái), Vitamin E (giữa-trái), Shea Butter (dưới-giữa), Squalane (trên-phải), Green Tea Extract (dưới-phải); hũ ở giữa-trên ~36% bề rộng |
| 4,0 | Callout mờ dần/trượt ra; hũ đi sang phải và nhỏ lại (~16–20% bề rộng) |
| 4,5–5,0 | Section mới: danh sách trái (Deep Hydration / Soothes Irritated Skin / Promotes Skin Healing / Rich in Antioxidants, mỗi mục có icon tròn) + **vòng tròn mint** bên phải chứa **bàn tay (ảnh cắt) ngửa lòng bàn tay, hũ lơ lửng phía trên**; cuối video section tiếp theo đang cuộn lên, lộ một khối vòng xoáy kem vàng-olive ở đáy |

## 10 điểm kỹ thuật

1. **Vị trí & tỉ lệ vật thể** (so với màn hình web): hero hũ chiếm ~44% bề rộng, ~58% chiều cao, tâm ≈ (51%, 55%) — hơi thấp hơn giữa. Khi có callout: ~36% rộng, tâm (50%, 40%). Ở section tay: hũ ~16–20% rộng, tâm (72%, 47%); vòng mint đường kính ~33% bề rộng. Chữ NOURISH rộng ~90% màn hình, chiều cao chữ hoa ~24% chiều cao màn hình.
2. **Camera** (ước lượng từ hình hũ — render sẵn): tele nhẹ, FOV ≈ 20–30°; camera ngang tầm nắp (không thấy mặt trên nắp, nhưng thấy cạnh đáy hơi cong "cười") → pitch ≈ 5–8° nhìn xuống, khoảng cách ≈ 5–6 lần đường kính hũ; không có parallax camera — hũ chỉ xoay/dịch. Target = tâm hũ.
3. **Nền/môi trường/ánh sáng**: nền gradient xanh trời, đo `#7ab9e6` (chiếm ~48%), vùng sáng `#95dafd` ở góc dưới-trái, vùng tối nhẹ `#6b99b9` ở rìa phải. Ánh sáng key mềm từ trên-trái (softbox lớn), highlight dọc trên vai hũ bên trái; rim lạnh (xanh) yếu bên phải; bóng đổ rất nhẹ vì hũ lơ lửng (không có mặt phẳng nền). Không thấy hạt/bokeh.
4. **Vật liệu**: *thân hũ* xanh lục sâu satin/frosted — đo `#04381a`/`#01451b` (vùng tối) và `#165a37` (vùng sáng), highlight dọc mờ → roughness ≈ 0,30–0,40, metalness 0, clearcoat ≈ 0,4–0,6; *nắp* nhựa/mờ than chì `#12141b` (đo `#19202e`), soft-touch roughness ≈ 0,5–0,6, cạnh vát nhẹ; *nhãn* chữ serif xanh nhạt in trực tiếp (in nổi hoặc decal) + khối chữ nhỏ dạng mono ở phải; *lá nha đam* xanh nhiều tông (`#044825`, `#27654a`, `#498378`, `#017438`), bề mặt bóng ẩm (roughness ≈ 0,35–0,45, clearcoat nhẹ), có mép lá nhạt hơn.
5. **Typography & lớp UI**: "NOURISH" — serif tương phản cực cao (Didone: kiểu Bodoni/Playfair), đen `#050405`, về sau xám-xanh ~12% opacity; wordmark "VERA" serif caps ở giữa trên cùng, nhỏ; nav sans nhỏ (Home gạch chân, Shop, About Us, Blog) trái trên, "Profile"+icon phải trên; tiêu đề callout sans semi-bold (~12–13 px tương đương 4% chiều cao màn hình), mô tả 8 px xám; icon tròn viền mảnh (~11% bề rộng). Bố cục đối xứng ở hero/callout, lệch trái–phải (list | hũ) ở section tay.
6. **Chuyển động**: (a) lá + chữ: parallax khác tốc độ, lá đi nhanh hơn chữ; (b) hũ: translate vào từ biên + xoay Y nhẹ + roll −8° + scale 1 → 0,8 → 0,45, có motion blur khi nhanh; (c) callout: scale-in + fade với stagger (~0,1 s), sau đó fade-out; (d) ghost text: opacity 1 → 0,12 khi hũ tới; (e) vòng mint: scale-in từ tâm; (f) bàn tay: ảnh cắt trượt vào.
7. **Mốc thời gian hiệu ứng** (xem bảng trên): lá/chữ 0–1,0 s; hũ vào 0,5–1,2 s; xoay + roll 1,0–2,6 s; callout 2,6–3,9 s (vào 2,6–3,2, giữ 3,2–3,7); hũ → phải 3,8–4,5 s; section tay 4,3–5,0 s; section kế 4,9 s+.
8. **Mapping scroll**: cuộn xuống (theo bàn tay trên trackpad) — tiến độ section tuyến tính với cuộn; chiều chuyển động: hũ đi từ dưới/trên vào giữa, rồi sang phải; section sau trượt từ dưới lên. Có vẻ **scrub liên tục** (khung giữa các mốc nội suy mượt). Không quan sát được cuộn ngược.
9. **Hover/chuột**: **not observable** (không thấy con trỏ, tay chỉ trên trackpad).
10. **Phần phải là WebGL thật**: hũ (thân+nắp+nhãn), lá nha đam (instanced), vòng mint (disc mesh/shader), hạt/giọt (nếu thêm), hiệu ứng tách lớp nắp/thân; **chỉ DOM**: chữ NOURISH/ghost text, callout (HTML overlay theo toạ độ project), nav. **Không nên dựng**: bàn tay thật (ảnh cắt) — thay bằng đĩa phát sáng/bục mờ. Video gốc là chuỗi render + web 2D ghép — **không** dùng video làm sản phẩm chính.

## Dựng bằng Three.js (gợi ý cho builder Beauty)

- **Hũ kem**: `LatheGeometry` 2 mảnh. Thân (đơn vị m, đường kính 1,0): profile (r, y) = (0,000,−0,00) → (0,46,−0,00) → (0,50,0,03) bo cung → (0,50,0,58) → (0,48,0,62) vai → (0,47,0,64). Nắp: (0,00,0,86) → (0,47,0,86) → (0,50,0,82) → (0,50,0,66) → (0,47,0,64), thêm gờ mảnh (r +0,005) ở đáy nắp. 96–128 segment, `computeVertexNormals`. Nhãn: `CylinderGeometry(0.502, 0.502, 0.4, 96, 1, true, thetaStart, 2.2)` dán `CanvasTexture` (chữ "VERA/SKIN/NOURISH" serif, màu `#cfe3d0`, nền trong suốt) — **đặt tên thương hiệu BAHA/giả định, không dùng "VERA"**.
- **Vật liệu thân**: `MeshPhysicalMaterial({ color:'#0a4a26', roughness:0.34, metalness:0, clearcoat:0.5, clearcoatRoughness:0.3, sheen:0.2, sheenColor:'#6fcf8f' })`. **Nắp**: `{ color:'#1a202c', roughness:0.55, metalness:0.1 }` + bevel normal nhẹ. 3 biến thể màu (yêu cầu ≥3): xanh lục / kem-sage / berry (`#682b46`, xem A2).
- **Lá nha đam**: 9–12 lá, mỗi lá `BufferGeometry` dải thon cong (14 đoạn × 6 cạnh, tiết diện hơi lòng máng), InstancedMesh, `MeshPhysicalMaterial({ color:'#1a6b34', roughness:0.4, clearcoat:0.3 })`; lerp màu mép (`#7fcf9a`) bằng vertex color; wiggle vertex shader (sin theo `uTime` + noise nhỏ).
- **Env**: drei `<Environment resolution={512}>` + `<Lightformer>`: (1) softbox lớn trên `position=[0,4,2] scale=[6,2,1] intensity=3 color="#ffffff"`; (2) dải rim trái `[−4,0.5,1] scale=[0.6,5,1] intensity=2 color="#bfe3ff"`; (3) dải phải ấm nhẹ `[4,0.5,0] scale=[0.5,4,1] intensity=1 color="#fff2d6"`. Nền: CSS gradient `#7ab9e6 → #cdeeff` phía sau canvas trong suốt (alpha) để giữ chữ DOM xen kẽ với 3D.
- **Layer**: DOM chữ NOURISH (z0) < `<Canvas alpha>` (z1) < DOM callout/nav (z2) → lá/hũ tự che chữ như bản gốc.
- **Bóng/hậu kỳ**: `ContactShadows` rất nhẹ (opacity 0,2, blur 3,5, `#2a6a8a`) ở y = −1,3; `Bloom` rất nhẹ cho highlight; DOF nhẹ khi hũ bay vào (motion blur giả bằng `velocity` → blur dọc).

### Storyboard camera/scroll (0/25/50/75/100%)

| % | Camera | Hũ | Lá / UI |
|---|---|---|---|
| 0 | pos [0,0.3,7.5], target [0,0.2,0], FOV 28 | ẩn ngoài khung (y=±5) | lá che chữ NOURISH (z gần camera), chữ đen 100% |
| 25 | dolly → 6,4, giữ target | nắp từ trên xuống, thân từ dưới lên, **lắp tại 25%**; yaw 0 → −0,3 rad | lá trượt lên y+6 và xoay ra; ghost text → 12% |
| 50 | pos [0.4,0.2,6.0] | yaw −0,8 rad, roll −0,14 rad, scale 0,8, dịch lên-trái | 5 callout scale-in quanh hũ (stagger 0,1) |
| 75 | pos [1.0,0,6.5] (pan phải) | dịch phải x=+1,8, scale 0,5, yaw −0,2 | callout tan; xuất hiện đĩa mint + list trái |
| 100 | pos [1.2,−0.3,5.5], target [1.6,0.1,0] | nắp tách lên +0,9, lộ lõi kem (disc + shader xoáy vàng-olive), hũ lơ lửng, xoay chậm | final frame: "dĩa" mint phát sáng + CTA |
