# QC JUDGE (Agent 05) — `/fnb` · Cafe & Restaurant 3D

Ngày: 04/11/2026 · Giám khảo độc lập (không viết code demo này).
Skill `3d-visual-qc`: **đã load và dùng được** (checklist 1–8 áp dụng bên dưới).
Điều kiện đo: dev server riêng `npx vite --port 5199` (chế độ DEV, không phải build), Chrome (Playwright MCP, headed), GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, viewport 1440×900 (trừ khi ghi khác).
Ảnh của tôi: `qc-evidence/judge/shots/fnb-*.jpg` · Script tái lập: `qc-evidence/judge/scripts/judge_fnb.js`.
Ảnh builder đã xem: toàn bộ `qc-evidence/shots/fnb/*.jpg` (21 ảnh).

## Điểm: **78 / 100** — CHƯA đạt mục tiêu 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **22** | Ly/đĩa sứ, hạt cà phê, đĩa mì cuối đẹp; nhưng "helix" mì ở 75% là một dải ruy-băng phẳng các sợi song song, sốt là mảng decal đỏ phẳng, vẹm là khối đen bóng thô, đĩa lót ly có đường nối lathe. |
| Animation & tương tác (30) | **24** | Orbit 360°/reset/biến thể/scroll xuôi-ngược đều đúng số đo; nhưng chuyển cảnh 50% bị hạt cà phê lấn át (gần như "nhiễu"), hover phản hồi yếu và chỉ có 1 đối tượng/cảnh, callout đè nguyên liệu. |
| Bám tinh thần mẫu (20) | **16** | Bố cục chữ tách hai bên ly (B), nền nâu→caramel, hạt có chiều sâu; burgundy→kem, nĩa+mì, ballet có callout, đĩa cuối nhìn xuống (C) — đúng khung; thiếu nhịp "nĩa xoắn mì là hero" (nĩa chỉ xuất hiện nhỏ ở 50% giữa bão hạt) và mì không "kéo dài xuyên section". |
| Thiết kế frontend (10) | **7** | Typography 2 giọng đẹp, đúng spec; nhưng mobile có va chạm UI (kicker đè nút Back, "SCROLL" đè swatch, mô tả đè nhãn men, "Pomodorini" bị cắt mép phải). |
| Hiệu suất & ổn định (10) | **9** | 0 console error/pageerror/request fail; ready 1,2–4,0 s; rAF đo được ~66 fps idle / ~64 fps khi scrub (điều kiện ở trên). |

## Lỗi bắt buộc sửa (không bù bằng điểm)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mô hình 3D tương tác thật | **PASS** | `judge/shots/fnb-orbit-low.jpg` (nhìn từ trên xuống thấy latte art), `fnb-orbit-back.jpg` |
| Orbit 360° | **PASS** — kéo 4×271 px ⇒ `yawTotal = −6,287` (≥ 2π); `resetView()` ⇒ camera về `[0,0.18,5.4]` | `fnb-orbit-front/right/back/left/full360.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary`: `#efe3d0` (r .32, cc 1) → `#2b2623` (r .62, cc .25) → `#b5523a` (r .48, cc .6); đổi cả men đĩa | `fnb-variant-0/1/2.jpg` |
| Hover có phản hồi | **PASS (yếu)** — cup: `hover.value 0,9998`, rim 1,25; rời ⇒ 0. Dish ở 100% cũng phản hồi. Nhìn bằng mắt chỉ là viền sáng ấm nhẹ | `fnb-hover-0-cup.jpg` vs `fnb-hover-off.jpg`; `fnb-100-hover-on.jpg` vs `fnb-100-hover-off.jpg` |
| Scroll mượt / khôi phục | **PASS** — camera ở 0/25/50/75/100 xuôi và ngược trùng nhau (sai lệch FOV ≤ 0,005°); nhảy 1→0,3 hội tụ trơn trong ~450 ms, không pop; wheel thật 1000 px ⇒ progress 0,139 (scrub theo tiến độ) | `fnb-scroll-fwd-*.jpg`, `fnb-scroll-back-*.jpg`, `fnb-jitter-settled-30.jpg` |
| Không trắng/crash | **PASS** — 0 error; chỉ warning `THREE.Clock deprecated` | log console phiên đo |
| Không sai lệch nghiêm trọng với mẫu | **PASS** (có sai lệch vừa, xem dưới) | — |
| Không dùng ảnh/video giả 3D | **PASS** — mọi vật thể là mesh (nhìn từ dưới/ trên đều có hình khối) | `fnb-orbit-high.jpg` (đáy đĩa lót) |

## Danh sách lỗi (xếp theo mức nghiêm trọng)

1. **Chuyển cảnh 50% bị "bão hạt" che hết câu chuyện** — 1440×900 và 1920×1080 ở 50%: >80 hạt cà phê phủ toàn khung, vài hạt ở rất gần camera to bằng 1/4 màn hình (`fnb-orbit-at50-right.jpg`: hạt ở phải chiếm ~280×320 px), hạt đè lên tiêu đề "to the table." và nằm trong lòng đĩa. Nĩa+mì (vật thể hero của mẫu C) chỉ cao ~25% khung và bị cán chạm/đè logo "Vermiglio". Bằng chứng: `qc-evidence/shots/fnb/timeline-50.jpg`, `1920x1080-50.jpg`, `judge/shots/fnb-scroll-fwd-50.jpg`, `fnb-orbit-at50-right.jpg`.
   **Sửa:** ở pha 0,40–0,55 giảm số hạt hiển thị xuống ≤ 40 (fade/scale-out phần còn lại theo `sceneMix`), clamp khoảng cách hạt tới camera ≥ 1,5 đơn vị (hoặc ẩn hạt có `z_view < near+1.2`), đẩy quỹ đạo hạt ra khỏi vùng chữ trái (x < −1,2 world) và khỏi hộp bao đĩa; phóng nĩa+mì lên ~40% chiều cao khung, hạ nó xuống để cán không chạm logo (đỉnh cán ≤ 12% từ trên).
2. **"Ingredient ballet" 75%: mì đọc như một dải ruy-băng phẳng, không phải xoắn ốc mì** — 30–40 sợi chạy song song sát nhau thành một băng dẹt chữ S (`fnb-scroll-fwd-75.jpg`, `fnb-orbit-at75-back.jpg`), không có độ dày/thể tích, không thấy từng vòng xoắn như mẫu C (helix tròn đầy với nguyên liệu bám). **Sửa:** tạo helix trên ống bán kính 0,18–0,25 (mỗi sợi lệch pha góc θ ngẫu nhiên quanh trục helix + nhiễu bán kính ±0,04), tăng lên 60–90 sợi mảnh hơn, twist 1–1,5 vòng theo y; thêm vertex-color ±6% để sợi tách nhau.
3. **Callout nhãn đè lên/chỉ sai nguyên liệu** — 75%: "Basilico" có chấm dẫn đặt trên sợi mì còn lá húng nằm chỗ khác, chữ "Basilico" bị con tôm và vỏ vẹm đè; phụ đề "ALLA CHITARRA" bị quả cà chua che; "Cozze" trỏ vào mì vì vẹm khuất sau helix (`fnb-scroll-fwd-75.jpg`, builder `timeline-75.jpg`). 390×844: "Pomodorini" bị cắt còn "Pomo" ở mép phải và đè thước 0–100 (`judge/shots/fnb-390x844-75.jpg`). **Sửa:** neo mỗi callout vào tâm world của đúng mesh (lá húng/tôm/vẹm…), chạy kiểm tra che khuất (raycast từ camera tới anchor, nếu bị che thì giảm opacity nhãn) và đặt nhãn ở phía ngoài helix (x của nhãn = x anchor ± 120 px hướng xa tâm), clamp nhãn trong `[16px, vw − 16px − rail]`; ở mobile chỉ hiện 3 nhãn và đặt dưới helix.
4. **Va chạm UI trên mobile 390×844** — (a) pill "SINGLE ORIGIN · CẦU ĐẤT 1.600 M" chồng lên nút "← BAHA 3D" (`qc-evidence/shots/fnb/mobile-touch.jpg`); (b) chữ "SCROLL" + vạch nằm đè lên swatch men (`shots/fnb/390x844-0.jpg`, `mobile-touch.jpg`); (c) đoạn mô tả "Rang mộc theo mẻ nhỏ…" dính sát/đè nhãn "MEN GỐM · LY & ĐĨA" (`mobile-touch.jpg`); (d) thước 0–100 bên phải đè lên đĩa ở 100% (`shots/fnb/390x844-100.jpg`). **Sửa:** mobile: đẩy kicker xuống `top ≥ 72px`; ẩn chỉ báo SCROLL khi `vw < 600` hoặc đặt nó trên khối swatch; dành `padding-bottom` cho khối mô tả = chiều cao panel men + 16 px; ẩn thước tiến độ dọc ở mobile (hoặc thu thành chấm 4 px sát mép).
5. **Sốt cà chua là mảng decal đỏ phẳng, đỏ quá bão hòa** — 100%: vệt `#c00`-ish dưới ổ mì không có độ dày, không có bóng ướt, viền răng cưa (`shots/fnb/1920x1080-100.jpg`, `judge/shots/fnb-100-hover-on.jpg`); mẫu C đo `#9f1d13`–`#c9381f`, sốt bóng ướt bám lên mì. **Sửa:** thay decal bằng mesh có độ cao (displaced disc / metaball nhẹ) `MeshPhysicalMaterial({color:'#a8261a', roughness:.15, clearcoat:1})`, vài giọt sốt trên sợi mì, giảm diện tích vệt 30%.
6. **Đường nối (seam) lathe trên đĩa lót ly** — một khía/đường dọc thấy rõ ở mép trước đĩa lót tại tâm-dưới (x≈718, y≈600 ở 1440×900) trong mọi biến thể (`shots/fnb/timeline-0.jpg`, `variant-1.jpg`, `judge/shots/fnb-hover-0-cup.jpg`). **Sửa:** `LatheGeometry` của đĩa lót: dùng `phiLength = 2π` với segments ≥ 96 và `mergeVertices()` + `computeVertexNormals()` để hàn đường nối, hoặc xoay seam ra phía sau (rotation.y = π).
7. **Hover quá nhẹ, chỉ 1 vật mỗi cảnh** — quét lưới 1440×900 ở 0% chỉ tìm thấy `cup`; ở 100% chỉ `dish`; khác biệt hình ảnh là viền ấm mờ, khó thấy ở men Cream (`fnb-hover-0-cup.jpg` vs `fnb-hover-off.jpg`). Spec yêu cầu "rim + highlight trên ly/đĩa/món đang trỏ; hạt gần chuột có thể nảy". **Sửa:** tách hover ly / đĩa lót / hạt (instanceId) ở cảnh A; tôm / vẹm / cà chua / ổ mì ở cảnh B; tăng rim lên mức thấy rõ (thêm 0,25 emissive ấm + rim Fresnel power 2) và cho hạt gần con trỏ đẩy lệch 0,1–0,2 với spring.
8. **Chữ cảnh trước còn "bóng ma" khi đang chuyển 50→75** — builder bắt được "FROM THE BEAN / to the table." mờ chồng dưới "A little bit of everything." (`qc-evidence/shots/fnb/timeline-75.jpg`); ở ảnh của tôi (chờ 2,2 s) đã hết, tức là crossfade quá dài so với vị trí dừng. **Sửa:** kết thúc fade-out của khối chữ 50% trước khi khối 75% bắt đầu fade-in (không overlap > 0,03 progress), hoặc dịch khối cũ ra khỏi vùng khối mới.
9. **Vẹm thô** — vỏ vẹm là ellipsoid đen bóng không vân, ruột cam là đĩa phẳng; ở 75% vẹm cắm thẳng đứng vào lòng đĩa (`fnb-scroll-fwd-75.jpg` x≈790,y≈720). **Sửa:** vỏ = sphere cắt nửa scale (1,.45,.6) + noise vân/đường tăng trưởng, mép mỏng màu xanh-tím `#3c2a2b`; tránh pose cắm đứng khi gần đĩa (giữ góc nghiêng ≤ 50°).
10. **Hạt cam phát sáng lạ ở 0%** — vài "hạt" nhỏ màu cam sáng như viên thuốc ở phải khung (`shots/fnb/timeline-0.jpg` x≈1040–1120,y≈130–330) đọc như lỗi màu, không giống hạt rang. **Sửa:** các hạt xa/mờ DOF không được tint cam bão hòa; giới hạn vertex-color trong dải `#3a1f12`–`#6b3b1f`.

## Độ giống mẫu (so contact sheet B, C)
- **Vị trí/tỉ lệ hero:** B đặt sản phẩm lệch phải, chữ trái; ta đặt ly ở giữa, chữ "RICH | AROMA" kẹp hai bên — giống frame "RICH AROMA" của B (chữ hai bên ly), chấp nhận được. Ly cao ~30% khung (B ~35–40%) — ổn.
- **Góc camera:** B chính diện hơi nhìn xuống — khớp (pos y .18, FOV 30). C final nhìn xuống ~30° — ta 100% `pos [0,2.15,3.75]` ⇒ ≈33° — khớp; đĩa rộng ~58% khung (C ~87%) — nhỏ hơn mẫu.
- **Màu:** nâu `#240d03`-ish → caramel ở 25% đúng tinh thần B; burgundy → kem đúng C. Chuyển cảnh 50% có vệt ngang kiểu motion-blur (ăn theo B) — tốt.
- **Typography:** sans đậm condensed (B) và serif thanh lịch (C) đúng spec; C dùng serif HOA ("YOUR TABLE IS WAITING.") còn ta dùng chữ thường — khác nhẹ.
- **Cơ chế chuyển động:** hạt tụ quanh ly (B) có; mì "kéo dài xuyên ranh giới section" (C 1,4–2,8 s) **không có** — nĩa xuất hiện giữa bão hạt rồi biến mất; helix→rơi xuống đĩa có (75→100). Nĩa+mì là hero mở đầu của C nhưng ở ta chỉ là chi tiết thoáng qua.
- **Phân lớp:** chữ nằm sau/ngang vật đúng; nhưng hạt đè chữ quá nhiều ở 25–50%.

## Kết luận
Chưa đạt 90 (78). Bộ sửa tối thiểu để lên ≥ 90: **#1** (dọn bão hạt + nâng nĩa/mì hero ở 50%) ≈ +4, **#2** (helix mì thể tích) ≈ +3, **#3 + #4** (callout và va chạm UI mobile) ≈ +3, **#5 + #7** (sốt thật + hover rõ, nhiều bộ phận) ≈ +3. Các mục 6, 8–10 là đánh bóng.
