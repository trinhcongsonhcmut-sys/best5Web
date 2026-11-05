# QC JUDGE vòng 6 — `/automotive` · AXIOM T1

Ngày: 05/11/2026 · Giám khảo độc lập · Skill `3d-visual-qc` đã load, checklist 1–8. Chấm theo ảnh vòng này, không neo vòng 5.
Điều kiện: dev server riêng port 5199 (DEV, tôi khởi động). Mọi số đo trong **Chrome riêng do script Node tự launch** (`channel:'chrome'`, headed, DPR 1), 1440×900 trừ khi ghi khác. Không dùng FPS làm bằng chứng.
Script (scratchpad): `sweep.js`, `autogrid.js` (lưới hover 45 px + đo clip), `autohov.js`, `autohov2.js`, `fstats.js`, `diff.js`, `warn.js`. Số liệu thô: `qc-evidence/judge/round6/automotive-sweep.json`, `automotive-viewports.json`, `automotive-grid.json`. Ảnh: `qc-evidence/judge/round6/shots/automotive-*.jpg|png`.

## Điểm: **88 / 100** (vòng 5: 84) — CHƯA đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **25** | Kính giờ tối, có gradient trời + gioăng + nội thất mờ, kính chắn gió nêm ~26°, cabin nghiêng, thép hết cháy theo số đo bbox; nhưng capo/cowl vẫn có dải trắng-kem phẳng như decal (cả trên Graphite), mặt nạ trước đứng + capo phẳng dài + mái phẳng ⇒ vẫn đọc là asset game. |
| Animation & tương tác (30) | **28** | Orbit/reset/4 biến thể/exploded/scroll xuôi=ngược/jump/jitter đúng; hover kính sống ở cả 5 mốc (0 ô chết); còn 2–11 ô/mốc trả `axiom-t1` không part với value 0 (mặt nạ trước, cowl, mép mái) và một lần vào đầu tiên ở 25% bị rơi về null. |
| Bám tinh thần mẫu (20) | **17** | HUD/chương/progress/bảng số/trời→cát/exploded ghost/dải đỏ rất sát F; nêm kính chắn gió đưa dáng gần F hơn, nhưng F là một nêm thép liền từ đỉnh mái xuống mũi, ta vẫn là capo + mặt nạ hộp. |
| Thiết kế frontend (10) | **9** | Không tràn ngang ở 1920/1440/390; nhãn biến thể khớp màu thân ở .02; mobile 0% khoảng trời trống còn ~175 px (từ ~250). |
| Hiệu suất & ổn định (10) | **9** | 0 console error / pageerror / HTTP ≥ 400 / requestfailed; 3 lần chuyển route heap 128 MB; chỉ cảnh báo `THREE.Clock deprecated`. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `automotive-orb{0,50,75,100}-*.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ Δyaw −6,287 ở 0/50/75/100%; reset ⇒ `[6.7,1.6,11.5]` / `[7.3,5.4,9.4]` / `[-8.4,2.4,6.8]` / `[8.5,1,8.7]` | `automotive-orb*-{front,right,back,left,high,low}.jpg` |
| Đổi màu/vật liệu | **PASS** — `#cfd1d2` m1 r.32 / `#2f3134` m.4 r.42 cc.6 / `#b39f7f` m.55 cc1 / `#6f8e9a` m.6 cc1; ở 50% chỉ Stainless bị trung tính hóa (`#cfd0cf` m.6 r.55), sơn giữ màu (clearcoat .6→.36) | `automotive-var{0..3}-{0,50,100}.jpg`, `automotive-var1-50.jpg` (thân đen ở .02) |
| Hover có phản hồi | **PASS** — body/glass/wheels/chassis/lights value 1 khi trỏ; hover kính sáng toàn xe (`automotive-hvdiff100-glass.jpg`) | `automotive-grid.json` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược (FOV lệch ≤ 0,003°); nhảy 1→0,3 hội tụ ~480 ms không pop; wheel-jitter về 0 ~250 ms | `automotive-fwd-*.jpg`, `automotive-back-*.jpg` |
| Không trắng/crash | **PASS** | `warn.js` |
| Không sai lệch nghiêm trọng | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Số đo của tôi

**Clip thép (Brushed Stainless, chuột ngoài canvas, PNG; clip = cả 3 kênh ≥ 250; bbox = hợp các ô lưới 45 px có hover id, nới 22 px):**

| Mốc | bbox | clip trong bbox | có kênh = 255 | ô body 45×45 xấu nhất | số ô body > 3% clip |
|---|---|---|---|---|---|
| 0% | 128–1298 × 408–723 | **0,31%** | 0,34% | 17,5% | 5 / 43 |
| 25% | 218–1163 × 363–678 | **0%** | 0% | 0% | 0 / 53 |
| 50% | 353–1163 × 228–813 | **0%** | 0,54% | 0% | 0 / 62 |
| 75% | 263–1208 × 228–768 | **0%** | 0,47% | 0% | 0 / 74 |
| 100% | 353–1163 × 363–678 | **0,21%** | 0,35% | 13,3% | 2 / 48 |

⇒ Khớp tuyên bố builder (≤ 0,38%). **Nhưng** ngưỡng ≥ 250 bỏ sót vùng trắng-kem gần cháy: cowl/chân cột A 1920×1080 0% median **`#fcf7ed`** (55% pixel ≥ 235, `automotive-1920x1080-0.jpg` x 1040–1095, y 575–605); capo nhìn cao 0% hai dải `#e6e6de` / `#f7f4e9` (`automotive-orb0-high.jpg`); capo 75% góc trái 6% clip (`automotive-orb75-left.jpg` x 1020–1200, y 480–510); capo 50% (Stainless) 37% pixel ≥ 235 (`automotive-fwd-50.jpg`). Trên Graphite 50% vẫn hai dải trắng trên capo (`automotive-var1-50.jpg`).

**Kính (median ô 12×12 tại các ô hover = glass):** 0% `#1b2c33`–`#29404b` (hàng trên) / `#353637`–`#3a3c3b` (hàng dưới); 25% `#12252f`–`#162831` trên / `#2b363a`–`#2f383c` dưới ⇒ có gradient dọc thật, tông xanh-đen từ nền `#0d1418`; 75% nhìn thấy lưng ghế/tựa đầu qua kính (`automotive-fwd-75.jpg`). Gioăng đen quanh kính rõ ở `automotive-fwd-25.jpg`.

**Hình học:** kính chắn gió ở `automotive-fwd-25.jpg` (side view gần ortho) từ cowl (920,452) tới mép mái (748,370) ⇒ **25,5°** so với phương ngang ✓ ~26°. Tumblehome theo section `cab` trong `loft.ts` (0,95→0,72 qua 0,66 m) ≈ 19° ✓ — thấy rõ ở `automotive-fwd-75.jpg`. Mặt nạ trước vẫn đứng (`automotive-fwd-0.jpg` x 1050–1140).

**Lưới hover 45 px (230 ms/ô, ô < 0,4 được đo lại sau 500 ms):** glass 12/12/18/25/13 ô ở 0/25/50/75/100%, **0 ô chết** ✓. Ô `axiom-t1` không có part (value 0): 2 / 3 / 11 / 6 / 5 — ví dụ 50%: (870,295) mép mái, (1005,385) cowl, (645,430) vách thân, (1140,520–565) mặt nạ trước; 100%: (1140,475–565) mặt nạ trước, (915,430) chân cột A. `autohov2`: ở 25% lần đầu đưa chuột từ (2,2) vào kính (690,430) ⇒ `axiom-t1` 0,03 → **null** trong 1 s; nhích 3 px ⇒ glass 0,97 (vào lần đầu bị rơi).

## Lỗi vòng 5 → trạng thái vòng 6

| # | Lỗi vòng 5 | Trạng thái | Bằng chứng |
|---|---|---|---|
| N1a | Thép cháy trắng (`#fcf8ef` vách cabin, capo 50% clip) | **PARTIALLY** — bbox ≤ 0,31% ✓ nhưng điểm nóng cục bộ 13–17% ô, cowl `#fcf7ed`, dải capo trắng ở góc cao / 50% / 75%-trái | bảng trên |
| N1b | Kính hông tấm xám phẳng | **FIXED** | median kính + gradient, gioăng, nội thất |
| N2 | Silhouette "pickup đời 80" | **PARTIALLY** | nêm 25,5° + tumblehome ✓; mặt nạ đứng, capo phẳng dài, mái phẳng còn |
| N3 | Hover kính chết | **FIXED cho kính / PARTIALLY toàn xe** | 0 ô kính chết; 27 ô no-part chết trên 5 mốc |
| N4 | Biến thể bị trung tính hóa ở .02 | **FIXED** | `automotive-var1-50.jpg` thân đen, `primary` `#2f3134` |
| N5 | Mobile 0% trời trống ~250 px | **PARTIALLY** | `automotive-390x844-0.jpg`: tagline đáy y≈270, nóc xe y≈445 ⇒ ~175 px |
| N6 | Gương trên capo | **FIXED** | `automotive-fwd-0.jpg`, `-fwd-100.jpg`: gương ở chân cột A hai bên |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **A1 — Dải trắng-kem phẳng trên capo/cowl đọc như decal (mọi biến thể)** — 50% mặc định (`automotive-fwd-50.jpg`, `automotive-var1-50.jpg` trên Graphite), 0% nhìn cao (`automotive-orb0-high.jpg`), 75% góc trái (`automotive-orb75-left.jpg`), 0% 1920 cowl (`automotive-1920x1080-0.jpg`). Là phản chiếu lightformer dải ngang cứng mép trên mặt phẳng tuyệt đối. **Sửa:** lightformer dải dài dùng `form="rect"` với texture gradient (mép mềm) hoặc hạ intensity ~1 và scale Y ×2; thêm `roughnessMap` xước chải ngang lên capo/cowl (roughness .32–.45) để phản chiếu loang; với clearcoat sơn hạ `clearcoatRoughness` lên .12. Nghiệm thu: không vùng 60×60 px nào trên thân có median ≥ `#ececec` ở 5 mốc + orbit high/left, cả 4 biến thể.
2. **A2 — Hình khối vẫn asset game** — mọi góc ngang (`automotive-fwd-0.jpg`, `automotive-fwd-25.jpg`, `automotive-orb0-low.jpg`). **Sửa (giá trị cao nhất):** gộp capo + mặt nạ trước thành **một mặt nêm liên tục** từ chân kính chắn gió dốc ~12–15° xuống mũi, kết thúc bằng một dải LED ngang mảnh toàn bề rộng (bỏ hộp lưới tản nhiệt + 2 cụm đèn chữ nhật); thêm đỉnh mái dạng gờ (ridge) để mái dốc liền về bửng như F. Phụ: mâm 5 cánh dày quá đơn giản — thêm vành mâm có bậc và nắp mâm phẳng kiểu aero.
3. **A3 — Ô hover không part chết** — 2–11 ô/mốc (`automotive-grid.json` → `deadCells`), nhiều nhất ở mặt nạ trước (1140, 475–565) và cowl. **Sửa:** khi intersection không có `userData.part`, đi ngược `parent` tới node có part; nếu không có thì map `front`/`gaps`/`lips`/`edges`/`gaskets`/`mirrors` → `body`, `front` LED → `lights`. Nghiệm thu: 0 ô `hover.id ≠ null && value < 0,4` trên lưới 45 px ở 5 mốc.
4. **A4 — Lần vào đầu tiên sau cuộn rơi về null** — 25%, `autohov2` (jump 0,03 → null; nhích 3 px mới bật). **Sửa:** khi part rỗng ở frame đầu, giữ id cũ và raycast lại ở frame kế; không clear hover chỉ vì part chưa resolve.
5. **A5 — Mobile 0% trời trống ~175 px** — `automotive-390x844-0.jpg`. **Sửa:** `aspect < 0,6` ⇒ khối tiêu đề top 26% hoặc xe scale ×1,15 (rộng 310 → ~355 px vẫn trong 390).

## Xe giờ "premium" hay vẫn asset game low-poly?
**Vẫn là asset game low-poly — nhưng đã là asset game tốt.** Kính (tối, gradient, gioăng, nội thất) là bước nhảy thật và loại bỏ cảm giác "tấm xám"; nêm kính chắn gió + tumblehome làm cabin đúng dáng. Cái còn kéo xuống: mặt nạ trước hộp đứng + capo dài phẳng có dải trắng như decal, mâm 5 cánh thô. **Một thay đổi giá trị nhất:** nêm mũi liên tục (A2: capo + mặt nạ thành một mặt dốc kết thúc bằng dải LED mảnh) — nó vừa đổi silhouette sang ngôn ngữ F, vừa xóa luôn mặt capo phẳng đang sinh dải trắng (A1).

## Độ giống mẫu (F)
- HUD/chương/tiến độ/bảng số/typography: ~90% (`automotive-fwd-25.jpg` vs `F-contact.jpg` hàng 1).
- Nhịp camera hero 3/4 → .01 ngang → .02 3/4 cao exploded bánh ghost → .03 3/4 sau dải đỏ → FIN: đúng F.
- Hình khối/vật liệu: ~67% (vòng 5: 62%) — kính và thép giờ gần F (phản chiếu trời mờ), khối vẫn là pickup capo + mũi hộp thay vì nêm một nét.

## Có đạt ≥ 90? — **Chưa (88).** Sửa tối thiểu:
1. A1 (bỏ dải trắng capo bằng lightformer mềm + roughnessMap) → 3D 26.
2. A3 + A4 (hover không còn ô chết, không rơi lần vào đầu) → Animation 29.
Hai mục ⇒ ~90. A2 (nêm mũi) ⇒ +1 3D +1 bám mẫu ⇒ ~92 và trả lời được câu "premium".
