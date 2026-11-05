# QC JUDGE (Agent 05) — `/automotive` · AXIOM T1

Ngày: 04/11/2026 · Giám khảo độc lập.
Skill `3d-visual-qc`: **đã load và dùng được**.
Điều kiện đo: dev server `vite --port 5199` (DEV), Chrome (Playwright MCP, headed), `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác.
Ảnh của tôi: `qc-evidence/judge/shots/automotive-*.jpg` · Script: `qc-evidence/judge/scripts/judge_automotive.js`.
Ảnh builder đã xem: toàn bộ `qc-evidence/shots/automotive/*.jpg` (22 ảnh).

## Điểm: **75 / 100** — CHƯA đạt 90

| Hạng mục | Điểm | Lý do |
|---|---|---|
| Chất lượng 3D (30) | **18** | Hình khối góc cạnh đúng ý đồ nhưng đọc là **low-poly phẳng**: thân inox gần như không có phản chiếu dải sáng, kính là mảng xanh-đen phẳng, gương là hộp đen, mặt trong vách thùng nâu không được chiếu sáng, tấm "sail" bay lơ lửng khi exploded. Trái với yêu cầu "không cảm giác low-poly rẻ tiền". |
| Animation & tương tác (30) | **24** | Orbit 360°, reset, 4 biến thể, hover theo bộ phận (body/glass/wheels/chassis), exploded + đèn hậu theo scroll, khôi phục pose đều đúng số đo; hover nhìn rất nhẹ, kéo pitch tối đa cho camera gần top-down làm xe đè tiêu đề và bị cắt đáy. |
| Bám tinh thần mẫu (20) | **16** | Bố cục chương `.01/.02/.03`, bảng số phải, progress bar gạch chéo đáy, trời→cát, exploded với bánh "ghost", dải đèn đỏ sau — rất sát F; thiếu chuyển vật liệu thân sang clay ở `.02`, không có bụi/bánh quay ở `.01`, phản chiếu inox (điểm nhấn của F) yếu. |
| Thiết kế frontend (10) | **8** | HUD kỹ thuật sạch, mono + condensed đẹp, không chồng chữ ở 3 viewport; mobile xe nhỏ, khoảng trời trống lớn. |
| Hiệu suất & ổn định (10) | **9** | 0 error; ready 1,2–2,2 s; rAF ~68 fps idle / ~70 fps khi scrub (điều kiện trên). |

## Lỗi bắt buộc sửa

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mô hình 3D tương tác thật | **PASS** | `judge/shots/automotive-orbit-*.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal −6,287`; reset ⇒ `[6.6,1.55,11.4]` | `automotive-orbit-front/right/back/left/full360.jpg` |
| Đổi màu/vật liệu | **PASS** — `#d6d8d8` (metal 1, r .27) / `#36383b` (metal .5, r .48) / `#b39f7f` (cc 1) / `#6f8e9a` (cc 1) | `automotive-variant-0..3.jpg` |
| Hover có phản hồi | **PASS (yếu)** — `hover.value 0,999`, `extra.hoverPart` = body/glass/wheels/chassis; mắt thường chỉ thấy ánh ấm nhẹ trên nắp capo/mâm | `automotive-hover-0-axiom_t1.jpg`, `automotive-25-hover-3-axiom_t1_wheels.jpg` vs `automotive-25-hover-off.jpg` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược; `exploded` 0→1→0, `rearLight` 0→1→.5; nhảy 1→0,3 hội tụ ~450 ms, không pop (camera lướt qua pose exploded trong ~150 ms — chấp nhận) | `automotive-scroll-fwd-*.jpg`, `-back-*.jpg`, `-jitter-settled-30.jpg` |
| Không trắng/crash | **PASS** | 0 console error |
| Không sai lệch nghiêm trọng | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | `automotive-orbit-low.jpg` (nhìn từ trên) |

## Danh sách lỗi (theo mức nghiêm trọng)

1. **Thân "inox chải" không có phản chiếu — đọc như nhựa xám/đất sét low-poly** — ở mọi mốc, hông xe là dải gradient be-xám trơn, không có dải lightformer ngang chạy dọc thân, không thấy trời/cát phản lên (`shots/automotive/timeline-0.jpg`, `timeline-25.jpg`, `judge/shots/automotive-1920x1080-0.jpg`); `metalness 1, roughness .27` nhưng env quá nghèo. Spec: "Phản chiếu là yếu tố sống còn". **Sửa:** thêm `Environment` với ≥ 3 Lightformer: dải ngang dài `[0,1.2,-6] scale [14,.5] intensity 3`, softbox trên `[0,6,2] scale [10,4] intensity 2.5`, tấm bounce cát `#d9c9a8` dưới; `envMapIntensity 1.4`; thêm `roughnessMap` xước ngang + `anisotropy .6` cho inox; tách normal mỗi panel (đã flat) và thêm bevel 0,02 trên mọi cạnh để cạnh bắt highlight.
2. **Kính phẳng, chết; một điểm cháy sáng trên kính chắn gió** — cửa sổ là mảng `#0a1c24` đồng màu, không phản chiếu (`timeline-25.jpg`); từ trước-trái có đốm trắng tròn cháy trên kính chắn gió (`judge/shots/automotive-orbit-left.jpg` x≈700,y≈465). **Sửa:** kính `MeshPhysicalMaterial({color:'#0a0c10', roughness:.04, envMapIntensity:1.6, clearcoat:1})` để phản dải lightformer; hạ cường độ/thu nhỏ bán kính đèn điểm gây đốm hoặc chuyển nó thành Lightformer dạng dải.
3. **Mặt trong vách thùng/"sail" màu nâu ô-liu không được chiếu sáng** — thấy rõ khi nhìn từ sau, 3/4 sau và từ trên (`judge/shots/automotive-orbit-right.jpg` x≈430–560,y≈410–500; `automotive-orbit-back.jpg` x≈850–1040; `automotive-orbit-low.jpg`; `shots/automotive/timeline-75.jpg`). Đọc như mặt sau bị lộ (back-face). **Sửa:** cho mặt trong vật liệu thân (DoubleSide hoặc mesh riêng với normal hướng vào), hoặc đóng kín bằng tấm cùng vật liệu inox tối hơn 15%.
4. **Exploded `.02`: tấm sail bay lơ lửng tách rời, thân không có sàn** — nhìn 3/4 sau ở 50% thấy một tam giác phẳng (sail) treo riêng trên thùng, không nối với cột C (`judge/shots/automotive-orbit-at50-back.jpg` x≈845–1045,y≈250–380). **Sửa:** gom sail vào group `body` (cùng offset nâng), hoặc nếu chủ ý tách thì cho nó đi theo trục hợp lý + nhãn; thêm tấm sàn thân (floor pan) để exploded không thấy rỗng.
5. **Không có chuyển vật liệu clay ở `.02` và không bụi/bánh quay ở `.01`** — F: `.02` thân chuyển "clay" xám-be + bánh/khung ghost; `.01` bánh quay + bụi + underglow. Ta: thân vẫn inox (chỉ thêm viền cam), không thấy bụi; underglow chỉ là một vạch xanh 1 px (`timeline-25.jpg`, `timeline-50.jpg`). **Sửa:** ở 0,4–0,6 lerp `primary` sang `{color:'#c4baa9', metalness:0, roughness:.9}` rồi trả lại; ở `.01` quay bánh theo tốc độ scroll + `Points` bụi phía sau bánh (≤ 300 hạt, alpha mờ); underglow = plane emissive `#6fb7ff` dưới ngưỡng cửa có bloom nhẹ.
6. **Kéo pitch lên cao: xe che tiêu đề và bị cắt đáy** — kéo dọc 400 px ⇒ pitch 1,2 rad gần top-down; xe đè lên "AXIOM T1"/tagline và đuôi xe bị cắt ở mép dưới, chồng lên progress bar (`judge/shots/automotive-orbit-low.jpg`). **Sửa:** giới hạn pitch ≤ 0,7 rad (≈40°) và tăng dolly khi pitch tăng để xe vẫn nằm trong khung an toàn (dưới tiêu đề, trên HUD).
7. **Gương chiếu hậu là hộp đen không chân, chi tiết nhỏ thiếu** — gương là khối hộp đen đặt trên vai capo, không có chân nối cột A (`automotive-orbit-left.jpg` x≈470,y≈488; `timeline-0.jpg`); không thấy tay nắm âm có chiều sâu, khe panel chỉ là vạch đen vẽ, mâm là đĩa 5 lỗ phẳng. **Sửa:** gương = thân vát + chân mảnh nối vào chân cột A, vật liệu inox+kính; mâm dùng spoke extrude có chiều sâu + đĩa phanh/caliper thấy sau mâm (đã có caliper đỏ — giữ); khe panel bằng geometry lõm 4 mm.
8. **Vũng sáng đỏ trên cát tách rời xe ở `.03`** — vệt glow đỏ trên mặt cát nằm cách cản sau ~150 px về phía dưới-trái, đọc như vết bẩn (`shots/automotive/timeline-75.jpg` x≈240–450,y≈720–770; `judge/shots/automotive-orbit-at75-right.jpg` x≈1030–1220,y≈700–780). **Sửa:** đặt decal/area light phản đỏ ngay dưới cản sau (chiếu xuống), cường độ tỉ lệ `rearLight`, bán kính ≤ 0,8 m, falloff mềm.
9. **Hover khó thấy** — đổi bộ phận đúng nhưng hiệu ứng chỉ là ánh ấm nhạt; trên bánh gần như không phân biệt (`automotive-25-hover-3-axiom_t1_wheels.jpg` vs `automotive-25-hover-off.jpg`). Spec: "dải đèn sáng lên". **Sửa:** mỗi bộ phận có phản hồi riêng rõ: body rim Fresnel trắng-ấm 0,6; glass tăng env 2×; wheels mâm sáng + caliper emissive; lightbar emissive ×2.
10. **Mobile: xe nhỏ, trời trống** — 390×844: xe chỉ cao ~12% màn hình, ~45% chiều cao là trời trống giữa tiêu đề và xe (`shots/automotive/390x844-0.jpg`, `judge/shots/automotive-390x844-25.jpg`). **Sửa:** mobile dùng FOV rộng hơn + đặt target thấp hơn để xe rộng ~90% bề ngang và nằm ở 45–60% chiều cao; hoặc đưa bảng số lên cao hơn.
11. **(Ghi chú IP)** Silhouette (nêm, dải đèn ngang trước/sau, thùng sail) vẫn gợi Cybertruck rõ; khác biệt chủ yếu ở cabin 4 cửa kiểu sedan. Đề nghị Founder xác nhận; nếu cần tách xa hơn: đổi đỉnh mái thành 2 mặt gãy, thêm vòm bánh vuông, đèn trước dạng 2 khối.

## Độ giống mẫu (contact sheet F)
- **Vị trí/tỉ lệ:** hero xe rộng ~58% khung, tâm ~(50%,61%) — F 49%/(54%,64%): khớp. `.01` side profile rộng ~64% (F 59%) — khớp. `.02` camera cao 3/4 (pos y 5,4) — F 3/4 trước-phải cao ~20°: khớp. `.03` 3/4 sau + đèn đỏ — khớp.
- **Camera:** orbit quanh xe theo chương — đúng cơ chế F; nhưng ta scrub liên tục (F gần như snap theo chương) — chấp nhận.
- **Màu:** trời `#c1d7db`-ish → cát be đúng PALETTES; thân xe quá xám-be, thiếu ánh lạnh thép của F (`#d8d9d8` với vùng tối `#292927`).
- **Typography/HUD:** `.01 PERFORMANCE & RANGE`, bảng 3 số phải, progress gạch chéo, danh sách có vạch active ở `.03` — gần như 1:1 với F (đã thay tag graffiti bằng wordmark "AXIOM T1" — hợp lệ).
- **Layering:** F cho xe chồng nhẹ lên cột chữ trái; ta để xe giữa, không chồng — khác nhẹ.
- **Sai lệch chính:** vật liệu (thiếu phản chiếu), thiếu clay ở `.02`, thiếu bụi/bánh quay.

## Kết luận
Chưa đạt (75). Bộ sửa tối thiểu để ≥ 90: **#1 + #2** (env/lightformer, inox anisotropic, kính phản chiếu — riêng hai mục này kéo 3D từ 18 lên ~25), **#3 + #4** (mặt trong thùng, sail khi exploded), **#5** (clay `.02` + bụi/bánh quay `.01`), **#9** (hover rõ theo bộ phận). Mục 6–8, 10 là ổn định khung hình.
