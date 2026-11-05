# B — "Coffee" hero slider (cà phê) — phân tích kỹ thuật

- URL: https://www.pinterest.com/pin/1114922451537812186/
- Trạng thái: **VERIFIED (media)** · Loại: video 13,37 s, 720×1280 (JSON-LD ghi 1080×1920), không loop trên trang pin · đăng 30/09/2026
- Người đăng công khai: **True Twist** (Pinterest `truetwist06`). Tiêu đề pin là quảng cáo dịch vụ làm web ("Still using an outdated website? … AI Chatbot, WhatsApp, Mobile Responsive…") — **không phải bài thiết kế cafe**; phần có giá trị là cảnh laptop chạy hero slider "Coffee". Không có link ngoài/IG gốc hiển thị.
- Bản chất: điện thoại cầm tay quay một MacBook trên bàn gỗ (bối cảnh quán tối, bokeh neon tím-cam). **Sản phẩm trong slider (túi, ly, máy espresso, hạt) trông như ảnh render/AI cắt nền**, không chắc 3D realtime. Chữ bị méo khi chuyển ("SLERCAIL ROAST", "BTRER") → hiệu ứng *scramble/glitch text* hoặc video AI.
- Bằng chứng: `shots/B-page.jpg`, `B-contact.jpg` (12 khung: t = 0; 1,22; 2,43; 3,65; 4,86; 6,08; 7,29; 8,51; 9,72; 10,94; 12,15; 13,32 s), `B-v000…v100.jpg`.
- "Viewport" dưới đây = vùng hero của site trên màn hình laptop (≈480×290 px trong khung video).

## Timeline quan sát (giây video)

| t (s) | Slide | Quan sát |
|---|---|---|
| 0–1,6 | 1 – **ARTISAN ROAST** | nền nâu chocolate `#240d03`→`#482514`, 3 túi cà phê nghiêng nhẹ (đen/kraft) xếp phối cảnh bên phải, hạt ít |
| 2,0–3,2 | chuyển 1→2 | **motion-blur ngang** (đồ vật bị vệt ngang), nền chuyển nâu → caramel, chữ cũ và mới chồng nhau |
| 3,3–6,6 | 2 – **RICH AROMA** | nền caramel `#bb743c`→`#e3b678`, vệt "swoosh" vàng kem uốn lượn; ly latte lơ lửng (có hơi nước, latte art) → ly rút đi, túi + ~20 hạt cà phê **bay ra theo hướng xuyên tâm** (kích thước/mờ khác nhau = chiều sâu); chữ phải "RICH AROMA" tối màu bên cạnh chữ trái trắng (đang chuyển/scramble) |
| 6,8–7,3 | chuyển 2→3 | scramble chữ, nền tối dần |
| 7,3–9,4 | 3 – (**SLERCAIL ROAST → SLEAFT CHECK**, chữ chưa ổn định) | nền espresso `#25130b`, máy pha cà phê đen + tách espresso, túi xám; chữ trắng decode từng ký tự |
| 9,5–10,6 | chuyển 3→4 | cross-fade nhanh, vài hạt bay qua, nền sáng dần |
| 10,8–13,4 | 4 – **ORDER FRESH** | nền kem `#f5e2ca`→`#ecd4b6`, ly sứ trắng lơ lửng + hạt xoay (giai đoạn đầu), sau đó **máy espresso** thay ly ở giữa, túi kraft hai bên, hạt cà phê lơ lửng quanh máy |

## 10 điểm kỹ thuật

1. **Vị trí & tỉ lệ**: bố cục 2 cột — headline trái (x 8–50%), cụm sản phẩm phải (x 45–92%). Slide 1: túi chính cao ~58% chiều cao hero, rộng ~18%, tâm (58%, 50%); túi phụ nhỏ hơn 20% ở (78%, 48%) và túi bị cắt ở mép trái (0–10%). Slide 4: máy espresso rộng ~26%, cao ~42%, tâm (52%, 55%); hạt cà phê 3–7% bề rộng, rải quanh. Sản phẩm **lơ lửng**, có bóng elip mờ dưới (y≈ 85–90%).
2. **Camera** (ước lượng): chính diện, hơi nhìn xuống 5–10°, tele FOV ≈ 20–28°; không có chuyển camera trong cảnh — thay vào đó đối tượng trượt ngang. DOF thấp: hạt gần/xa bị nhòe.
3. **Nền/ánh sáng**: nền gradient phẳng đổi theo slide — đo: nâu `#240d03` (56%) + `#482514`; caramel `#bb743c`/`#d69758`; kem `#f5e2ca`/`#ecd4b6`; slide 3 `#25130b`. Key sáng từ trên-trái, rim ấm từ phải; có **vệt sáng swoosh** vàng kem (slide 2) như tia/ribbon phản chiếu. Bối cảnh quanh laptop: tím-xanh `#060628/#161848/#233778` + neon cam (không thuộc thiết kế).
4. **Vật liệu**: túi giấy kraft mờ (`#d9b897`, roughness ≈ 0,7) và túi đen mờ có nhãn kem (roughness ≈ 0,5; có nếp nhăn mép trên); ly sứ men bóng (roughness ≈ 0,2, clearcoat ≈ 1); mặt cà phê nâu latte có latte art; hạt cà phê rang nâu đậm bóng nhẹ (roughness ≈ 0,35, có rãnh giữa) `#3a1f12`–`#6b3b1f`; máy espresso nhựa/kim loại đen bóng + inox (metalness cao); hơi nước = alpha mờ.
5. **Typography & UI**: headline sans đậm cực (Inter/Roboto Black), CHỮ HOA, 2 dòng, ~11% chiều cao hero/dòng, trắng (nền tối/caramel) hoặc nâu đậm `#3b2412` (nền kem); kicker dạng pill viền; đoạn mô tả nhỏ; 2 nút pill (đầy màu caramel + viền); mũi tên tròn trái/phải ở hai mép; **pagination = 3–4 vạch dưới giữa**; nút chat tròn dưới phải; logo "Coffee" serif đậm trái trên; nav sans nhỏ giữa.
6. **Chuyển động**: (a) slide ngang có **motion blur** (blur theo vận tốc, ~0,5–0,8 s); (b) chữ **scramble/decode** theo ký tự (~0,5 s); (c) sản phẩm lơ lửng với bob nhẹ (biên độ ~1–2% chiều cao, chu kỳ ~2–3 s); (d) hạt cà phê: bay xuyên tâm + xoay 3 trục, kích thước biểu kiến 2–7%, mờ DOF; (e) nền crossfade màu (0,6 s); (f) hơi nước cuộn lên liên tục.
7. **Mốc thời gian**: mỗi slide ≈ 3–3,5 s (giữ ~2,5 s + chuyển ~0,7 s): S1 0–2,0; T1 2,0–3,2; S2 3,3–6,6 (hạt bay 4,0–6,6); T2 6,6–7,3; S3 7,3–9,4; T3 9,4–10,6; S4 10,6–13,4.
8. **Mapping scroll**: **not observable** — slider tự chạy hoặc nút mũi tên; không thấy cuộn trong hero (phần dưới "Queet Coffees" là section kế).
9. **Hover/chuột**: **not observable** (không thấy con trỏ trên slide).
10. **Phải là WebGL thật**: ly cà phê (lathe + tay cầm), hạt cà phê (InstancedMesh, DOF), túi cà phê, máy espresso (hoặc thay bằng grinder/moka pot đơn giản dễ dựng), hơi nước, swoosh ribbon, ghế/bàn nếu cần chiều sâu; **DOM**: headline, nút, pagination, scramble text. Yêu cầu Founder: "hạt cà phê có chiều sâu, ly đổi màu, scroll làm nguyên liệu tập hợp thành sản phẩm" → *chuyển slider tự chạy thành scroll-scrub*: hạt bay rời rạc → hội tụ thành ly.

## Dựng bằng Three.js (Cảnh A — Cafe)

- **Hạt cà phê**: base = `SphereGeometry(1, 24, 16)` scale (1,0.62,0.78); vertex displace: rãnh giữa `y *= 1 - 0.18*exp(-pow(z/0.12,2))` theo trục dài; `InstancedMesh` 400–600 (mobile 200), `instanceMatrix` cập nhật mỗi frame (xem `webgl_instancing_dynamic`); `MeshPhysicalMaterial({ color:'#4a2814', roughness:0.38, clearcoat:0.3, clearcoatRoughness:0.5 })`, vertex color nhẹ để mỗi hạt hơi khác.
- **Quỹ đạo**: mỗi hạt có `seed`; vị trí `p(t) = lerp(scatter(seed), target(seed), ease(progress))` với `scatter` = điểm trên cầu bán kính 4–9 + curl-noise sway; `target` = điểm lấy mẫu trên **mặt trong thân ly** hoặc trên mặt cà phê → hạt "tập hợp thành sản phẩm". Xoay: `quaternion.slerp` quanh trục ngẫu nhiên.
- **Ly**: `LatheGeometry` (profile: đế r 0,32 y 0 → thân loe r 0,52 y 0,62, môi bo r 0,54; trong lòng r 0,47, đáy 0,06); quai bằng `TubeGeometry(CatmullRomCurve3([...]), 32, 0.045, 12)`; mặt cà phê = disc `MeshPhysicalMaterial({ color:'#7a4a2a', roughness:0.25, clearcoat:1 })` + `CanvasTexture` latte art (noise + swirl). Sứ: `{ color:'#efe3d0', roughness:0.22, clearcoat:1, clearcoatRoughness:0.1 }`; 3 biến thể màu men: kem / than / terracotta.
- **Hơi nước**: 3–4 plane billboard, shader alpha = `smoothstep` của fbm noise cuộn theo y, `depthWrite:false`, `AdditiveBlending` nhẹ.
- **Env**: Lightformer softbox trên-trái ấm (`#ffd9a8`, intensity 3), dải rim kem phải, **vệt swoosh** = 1–2 `TubeGeometry` phẳng uốn lượn với material `MeshBasicMaterial({ color:'#fff3d2', transparent, opacity:.6 })` + bloom nhẹ. DOF: `@react-three/postprocessing` `DepthOfField({ focusDistance, focalLength:0.03, bokehScale:3 })`.
- **Nền**: CSS gradient đổi theo biến thể (chocolate → caramel → kem) + `scene.fog` cùng màu để hạt xa chìm vào nền.

### Storyboard camera/scroll (0/25/50/75/100%)

| % | Camera | Cảnh |
|---|---|---|
| 0 | pos [0,0.4,6.5], target [0,0,0], FOV 26 | nền nâu đậm; hạt rải xa (r 6–9) mờ DOF; ly mờ phía sau; headline "ARTISAN ROAST" kiểu đã scramble xong |
| 25 | dolly 5,6 | hạt hội tụ vào quỹ đạo vòng quanh trục ly (xoắn ốc), nền → caramel; ly hiện rõ dần |
| 50 | pos [0.6,0.3,5.2] orbit +25° | hạt chui vào ly (đổ đầy), mặt cà phê hiện latte art; hơi nước bật; ly xoay Y 180° |
| 75 | pos [−0.4,0.5,4.4] FOV 22 | zoom cận cạnh ly + hạt cuối bay vòng; đổi màu men (biến thể) |
| 100 | pos [0,0.8,5.8] target [0,0.1,0] | final frame: ly kem trên nền kem, 3–5 hạt lơ lửng, headline "ORDER FRESH"; chuyển cảnh sang Restaurant (nền kem → burgundy cho C) |
