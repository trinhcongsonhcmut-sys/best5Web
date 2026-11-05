# QC JUDGE vòng 2 — `/fashion` · CUMULUS 01

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này). Chấm theo những gì nhìn thấy ở vòng này, không neo theo điểm vòng 1.
Skill `3d-visual-qc`: đã load, checklist 1–8 áp dụng.

**Điều kiện đo:** dev server riêng `npx vite --port 5198 --strictPort` (DEV). Chrome qua Playwright MCP, GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1. **GPU, CPU và cả phiên trình duyệt MCP dùng chung với judge khác (port 5199) và với bộ QC repo chạy song song**, nên FPS dao động mạnh giữa các lần đo.
Ảnh: `qc-evidence/judge/round2/shots/fashion-*.jpg`. Script tái lập: `.playwright-mcp/r2_fashion.js`.

## QC của repo (tôi tự chạy, vì builder chưa chạy lại sau chỉnh cuối)
`QC_MODE=dev QC_PORT=5196 QC_ID=judge-fashion npx playwright test -g "fashion"` ⇒ **10/10 PASS** (3,0 phút): load/no-error, orbit 360 + reset, ≥3 biến thể, hover, scroll 0–100 xuôi/ngược, resize 1920/1440/390, FPS, mobile touch. Chỉ có warning `THREE.Clock deprecated`.

## Điểm: **87 / 100**, chưa đạt 90

| Hạng mục | Điểm | Lý do |
|---|---|---|
| Chất lượng 3D (30) | **26** | Nylon ở macro 75% đã liền mạch, có lưới ripstop mịn ở cổ; răng khóa nhỏ; lót cổ, gấu và cổ tay đã đổi màu theo colourway; preview 3D sắc. Bị trừ vì áo vẫn đọc như đồ bơm hơi/latex (baffle tròn đều, bóng như cao su), tay áo nhìn ngang vẫn là chuỗi xúc xích, và viền dissolve lốm đốm kiểu "da bò" màu kem. |
| Animation & tương tác (30) | **27** | Chuyển colourway đúng thiết kế: áo cũ dissolve và bay lên-trái, nền wipe tròn, áo mới bay ra từ preview. Preview click được; rail rút khi orbit; scroll và orbit chuẩn. Bị trừ vì khung giữa chuyển cảnh có vệt xám mờ lớn như lỗi, preview không có hover, và áo mới thành mảnh vụn kéo dài ~300 ms. |
| Bám tinh thần mẫu (20) | **17** | Đủ cơ chế E2: nền bão hòa đổi theo 4 màu, áo kế tiếp ở góc dưới phải, áo bay ra/vào, bóng elip. E1: rail ngang. Lệch: áo ở giữa và to (≈ 36% rộng) so với E2 lệch trái ≈ 23%; chất liệu bóng nhựa hơn puffer thật của E2. |
| Thiết kế frontend (10) | **9** | Chữ không còn đè áo ở 25–30%; panel 75% có nền; mobile dùng chấm tiến độ. Trừ nhẹ vì panel 75% trên mobile phủ lên cổ áo, chữ nằm trên khóa kéo. |
| Hiệu suất & ổn định (10) | **8** | 0 console error, pageerror hay 4xx; warm ready 2,6–3,9 s, cold 5,5 s (DEV). FPS không ổn định: 1440 nhàn 31 / 43 / 74 fps qua 3 lần đo, 1920 ≈ 33 fps, 390 ≈ 57 fps. Nặng hơn beauty rõ rệt trong cùng điều kiện (GPU dùng chung). |

## Mục bắt buộc (không bù bằng điểm)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mô hình 3D tương tác thật | **PASS** | `fashion-orb0-high.jpg` (nhìn vào lòng cổ), `fashion-orb0-low.jpg` (nhìn vào gấu) |
| Orbit 360° | **PASS**: 4×271 px ⇒ `yawTotal −6,287` (0%), −12,57 (50%), −18,85 (100%); pitch ±1,2 rad; `resetView()` ⇒ yaw 4e-8, pitch −6e-7 | `fashion-orb{0,50,100}-*.jpg` |
| Đổi màu/vật liệu | **PASS**: `primary` `#ec6a17` (r .30, cc .60) → `#262523` (r .32, cc .55) → `#c3c9ce` (r .40, cc .32) → `#b3080c` (r .29, cc .62); nền shader, rail và preview đổi theo | `fashion-variant-0..3.jpg` |
| Hover có phản hồi | **PASS**: tại tâm áo `hover.value` 0,87 → 1,0 trong 360 ms, rời chuột ⇒ 0; viền baffle sáng thấy rõ | `fashion-hover-center-on.jpg` so với `fashion-hover-center-off.jpg` |
| Scroll mượt và khôi phục | **PASS**: 0/25/50/75/100 xuôi = ngược (FOV lệch ≤ 0,004°). Nhảy 1→0,3 hội tụ trơn trong ~400 ms (`smooth` .478→.300), không pop. Wheel 6×300 px ⇒ progress 0,303 | `fashion-fwd-*.jpg`, `fashion-back-*.jpg`, `fashion-jitter-settled-30.jpg` |
| Không trắng/crash | **PASS** | log phiên đo: 0 error |
| Không sai lệch nghiêm trọng với mẫu | **PASS** | xem phần so mẫu |
| Không dùng ảnh/video thay 3D | **PASS** | preview và rail đều là mesh |

## Lỗi vòng 1: trạng thái

| # vòng 1 | Lỗi | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| 1 | Nylon macro 75% loang lổ | **FIXED** (còn dư nhẹ) | `fashion-1920x1080-75.jpg`, `fashion-fwd-75.jpg`: bề mặt liền, có lưới ripstop ở cổ, highlight ciré liên tục. Mép baffle còn gợn nhỏ, chấp nhận được. |
| 2 | Đổi colourway chỉ tween màu | **FIXED** (cơ chế), chất lượng chưa sạch (N1) | `fashion-trans-1.jpg` (~134 ms, áo cũ bắt đầu dissolve), `fashion-trans-2.jpg` (~280 ms, áo cũ tan với mép sáng, lệch lên-trái), `fashion-trans-5.jpg` (~570 ms, nền wipe), `fashion-trans-6/7.jpg` (~640–700 ms, áo mới từ góc phải dưới), `fashion-trans-8.jpg` (~780 ms, gần xong). Tổng thời gian ≈ 0,8–1 s. |
| 3 | Thiếu áo kế tiếp 3D | **FIXED** | Preview 3D ở góc dưới phải (`fashion-fwd-0.jpg`). Click (1320,635) ⇒ variant carbon → glacier (`fashion-after-preview-click.jpg`). |
| 4 | Chữ va áo ở 25–30% và 75% | **FIXED** | `fashion-jitter-settled-30.jpg`: áo ≤ x 850, chữ ≥ x 962. 75%: danh sách trong panel nền nâu (`fashion-fwd-75.jpg`). |
| 5 | Hốc đen cổ/gấu/cổ tay | **FIXED** | `fashion-orb0-high.jpg` (lòng cổ cam đậm), `fashion-orb0-low.jpg` (lót gấu và cổ tay cam đậm, không còn đen đặc) |
| 6 | Tay áo xúc xích khi nhìn ngang | **NOT FIXED** | `fashion-orb0-right.jpg`: tay vẫn là chồng khoang tròn đều, không có khuỷu |
| 7 | Mobile thước tiến độ đè áo | **FIXED** | `fashion-390x844-0.jpg`: 5 chấm sát mép phải |
| 8 | Rail cắt chữ khi orbit | **FIXED** | Rail rút khi orbit (`fashion-orb0-high.jpg`, `fashion-orb0-right.jpg` không còn rail) |
| claim | Răng khóa mịn hơn | **FIXED** | `fashion-1920x1080-75.jpg` |

## Lỗi mới (xếp theo mức nghiêm trọng)

**N1. Khung giữa chuyển colourway bẩn** (0%, 1440, `setVariant(1)` ember → carbon)
- (a) ~360 ms: một vệt xám mờ khổng lồ, méo, ở giữa khung trước khi nền wipe định hình; nhìn như lỗi render (`fashion-trans-3.jpg`).
- (b) Dissolve dùng noise tần số thấp, nên áo tan thành mảng lớn kiểu "da bò". Mép sáng màu kem, không theo màu colourway (`fashion-trans-2.jpg`, `fashion-trans-6.jpg`, `fashion-trans-7.jpg`).
- (c) Áo mới còn đốm trắng sót ở ~780 ms (`fashion-trans-8.jpg`, x≈900, y≈330 và 580).

Sửa:
- Noise dissolve tần số cao hơn (scale ×3–4) cộng một gradient theo trục bay (`dot(pos, dir)`), để áo tan có hướng thay vì lốm đốm.
- Mép edge dày 0,03 lấy màu `mix(colourway.accent, white, .4)`.
- Thay vệt xám mờ ban đầu bằng wipe tròn có mép sắc (smoothstep độ rộng 0,04) bắt đầu từ vị trí preview.
- Cho uniform dissolve chạy hết về 1 bằng `onComplete` để không còn đốm sót.

**N2. Áo đọc như đồ bơm hơi/latex** (mọi mốc; rõ nhất ở `fashion-fwd-50.jpg`, `fashion-hover-center-on.jpg`)
- Baffle là ống tròn đều, phản xạ gương mạnh, không có nếp nhăn ở đường may. E2 có nếp nhăn ngang nhỏ và highlight vỡ.

Sửa:
- Thêm nếp nén tại đường may: displacement âm hẹp ±0,02, cộng nhiễu nếp tần số trung bình (biên độ 0,008) dọc baffle.
- Tăng roughness lên .38–.42 cho ember và red; dùng clearcoatRoughness .12 để highlight vẫn ướt nhưng bớt gương.

**N3. Tay áo vẫn như chuỗi xúc xích khi nhìn ngang** (lỗi vòng 1 #6, `fashion-orb0-right.jpg`)

Sửa:
- Bẻ đường CatmullRom tại khuỷu 15° về trước.
- Giảm bán kính baffle 15% về phía cổ tay.
- Nén baffle mặt trong khuỷu ×0,7.

**N4. FPS fashion thấp và dao động**
- 1440: 31 / 43 / 74 fps qua 3 lần đo; 1920 ≈ 33 fps; khi scroll ở 1440 có lần chỉ 31 fps.
- Tất cả trong điều kiện GPU dùng chung, nhưng beauty cùng lúc vẫn đạt 50–68 fps.

Sửa:
- Bỏ shadow map PCF (log báo `PCFSoftShadowMap has been removed`), thay bằng blob shadow.
- Preview: render ở tần suất 1/2 frame hoặc dùng geometry LOD (giảm 50% segment).
- Rail jackets: dùng geometry LOD thấp.
- Clamp DPR ≤ 1,5.
- Đo lại trên build `vite preview`.

**N5. Preview "áo kế tiếp" không có hover feedback**
- Rê vào (1320,635): `hover.id null` (đo được), không đổi con trỏ hay ánh sáng.

Sửa: đăng ký hover id `next`, `cursor:pointer`, scale 1→1,06 + rim. Nên thêm nhãn nhỏ "NEXT".

**N6. Mobile 75%: panel phủ cổ áo** (`fashion-390x844-75.jpg`)
- Chữ "Box stitch · 4 mm" nằm đè lên khóa và cúc bấm, thấy qua nền mờ.

Sửa: trên vw < 600 ở mốc 75%, dời `target.y` camera thêm −0,15 hoặc tăng độ đục của panel lên .7.

## Độ giống mẫu
- **E2 (chính):** cơ chế cốt lõi nay đã đủ: 4 colourway với nền bão hòa đổi đồng bộ (màu đo rất sát E2), áo kế tiếp 3D ở góc dưới phải click được, áo cũ bay ra / áo mới bay vào, bóng elip mềm dưới áo lơ lửng.
- **Lệch so với E2:**
  - Áo ở giữa khung và to hơn (≈ 36% rộng so với ≈ 23%, E2 lệch trái).
  - Chất liệu bóng kiểu latex, trong khi E2 là puffer nylon có nếp.
  - Chuyển cảnh dùng dissolve lốm đốm thay vì trượt + scale gọn như E2.
- **E1:** rail ngang + áo treo mờ ở 0%, rút đi khi orbit; mượn đúng mức spec cho phép.
- **Đánh giá chung:** khoảng 75–80% tinh thần E2.

## Kết luận
**87/100, chưa đạt ≥ 90.** Sửa tối thiểu:
1. N1: chuyển cảnh sạch (khoảng +2).
2. N2 + N3: bớt cảm giác bơm hơi, sửa tay áo (khoảng +2).
3. N4: FPS ổn định ≥ 50 ở 1440 trên build (khoảng +1).

N5–N6 là đánh bóng.
