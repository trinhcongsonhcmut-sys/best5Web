# QC JUDGE vòng 5 — `/automotive` · AXIOM T1

Ngày: 05/11/2026 · Giám khảo độc lập · Skill `3d-visual-qc` đã load, checklist 1–8. Chấm theo ảnh vòng này, không neo vòng 4.
Điều kiện: dev server riêng port 5199 (DEV). Trang Playwright MCP mặc định bị judge kia dùng chung ⇒ mọi số đo chạy trong **Chrome riêng do script tự launch** (`channel:'chrome'`, headed), 1440×900 DPR 1 trừ khi ghi khác. Không dùng FPS làm bằng chứng.
Ảnh: `qc-evidence/judge/round5/shots/automotive-*.jpg` (+ `automotive-var*.png` để lấy mẫu pixel). Script: `.playwright-mcp/r5_A_auto.js`, `r5_B_auto.js`, `r5_px.js`, `r5_auto_latch.js`.

## Điểm: **84 / 100** (vòng 4: 83) — CHƯA đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **24** | Thân giờ là một mặt loft liền (mũi → capo → kính chắn gió xiên → mái → kính sau xiên → thùng → bửng), góc sau/3-4 đọc đúng là pickup; nhưng ở 0% vách cabin cháy trắng `#fcf8ef`, kính hông là tấm xám phẳng `#454749` không phản chiếu, capo có dải trắng cháy 50% pixel, cabin vẫn vách đứng — vẫn là asset game. |
| Animation & tương tác (30) | **26** | Orbit/reset/4 biến thể/exploded 3 lớp/scroll xuôi=ngược/jump/jitter đúng; top-view đã sạch HUD, SCROLL ẩn; trừ: hover `glass` vẫn = 0 ở 25/50/75/100%, vùng kính chắn gió/capo trả `axiom-t1` không có part ⇒ hover 0. |
| Bám tinh thần mẫu (20) | **16** | HUD/chương/progress/bảng số/trời→cát/exploded bánh ghost/dải đỏ đuôi rất sát F; khối "một nêm thép" và mặt phản chiếu lớn của F vẫn chưa có. |
| Thiết kế frontend (10) | **9** | Không tràn ngang ở 1920/1440/390; mobile xe nằm 53–66% chiều cao, chấm ẩn, nhãn chương bấm được; biển số có viền; trừ: mobile 0% vẫn ~250 px trời trống, ở .02 nhãn "GRAPHITE MATTE" trong khi thân hiển thị xám trung tính. |
| Hiệu suất & ổn định (10) | **9** | 0 console error / pageerror / HTTP ≥400; chỉ warning `THREE.Clock deprecated`. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `automotive-orb{0,50,100}-*.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ Δyaw −6,287 ở 0/50/100%; reset ⇒ `[6.7,1.6,11.5]` / `[7.3,5.4,9.4]` / `[8.5,1,8.7]`; kéo xuống chạm mặt cát (y 1,6/1,9/1,0) | `automotive-orb0-low.jpg`, `-high.jpg` |
| Đổi màu/vật liệu | **PASS** — 0%/100%: `#d3d5d6` m1 r.27 / `#2f3134` m.40 r.42 cc.6 / `#b39f7f` m.55 cc1 / `#6f8e9a` m.60 cc1; ở 50% mọi biến thể bị kéo về trung tính (`#d1d3d2`, `#8d8d8b`, `#bfb4a3`, `#9facb0`, metalness .24–.60) — có chủ đích cho .02 nhưng làm biến thể khó nhận ra | `automotive-var{0..3}-{0,50,100}.png` |
| Hover có phản hồi | **PASS (body/lights/wheels/chassis = 1 ở mọi mốc, rời ⇒ 0)**; glass FAIL một phần (xem N3) | `automotive-hov0-off.jpg` vs `automotive-hov0-1-axiom_t1_body.jpg`, `-3-axiom_t1_lights.jpg` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược (FOV lệch ≤ 0,004°); nhảy 1→0,3 hội tụ ~480 ms, không pop; wheel-jitter về 0 ~200 ms | `automotive-fwd-*.jpg`, `automotive-back-*.jpg` |
| Không trắng/crash | **PASS** | 0 error |
| Không sai lệch nghiêm trọng | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Kiểm chứng nhận định của orchestrator
"Side view 0% có vùng cabin cháy trắng và kính là tấm xám phẳng" — **XÁC NHẬN**, có số đo (`automotive-var0-0.png`, `automotive-crop0-side.jpg`):
- Vách cabin phía sau kính hông (x 700–740, y 425–470): median **`#fcf8ef`** — gần clip, mất toàn bộ chi tiết thép chải.
- Kính hông (x 575–615, y 420–480): **`#454749`** đồng nhất, không có gradient/phản chiếu trời; ở 100% kính hông `#24343b` cũng phẳng.
- Capo 100% (x 940–1000, y 470–490): **`#f6f8f9`, 50% pixel clip**. Ở 50% (.02): nóc kính trời `#f0f2f2` và một dải capo trắng-kem đọc như decal (`automotive-fwd-50.jpg`, `automotive-var1-50.png`).
- Graphite ở 0% không cháy (`#898680`), nên nguyên nhân là env/lightformer quá mạnh với thép metalness 1 trên các mặt hướng lên/nghiêng về đèn.
"Rear / 3-4 đọc như pickup thật" — **ĐỒNG Ý một phần**: `automotive-fwd-75.jpg`, `automotive-orb0-right.jpg` đọc rõ pickup (kính sau xiên lớn, dải đỏ, bửng, AXIOM dập, biển có viền); nhưng là pickup đa giác phẳng kiểu thập niên 80, không phải xe cao cấp.

## Lỗi vòng 4 → trạng thái vòng 5

| # | Lỗi vòng 4 | Trạng thái | Bằng chứng |
|---|---|---|---|
| N1 | Khối cấp 1 là hộp ghép | **PARTIALLY** | Thân loft liền, kính chắn gió và kính sau xiên, không còn "hộp cabin + hộp thùng" rời (`automotive-orb0-high.jpg` nhìn từ trên: một khối liền). Còn: vách cabin đứng thẳng trên đường vai, cột B dày, capo dài phẳng + mặt nạ trước đứng ⇒ dáng pickup đời cũ (`automotive-crop0-side.jpg`) |
| N3 | Top-view 0% chạm progress, SCROLL đè capo | **FIXED** | `automotive-orb0-high.jpg`: cản trước y≈760 < thanh 835; không còn chữ SCROLL |
| N5 | Cạnh vát mảnh | **PARTIALLY** | Có dải phản chiếu dài trên vai/capo (lightformer mới) nhưng chính chúng gây cháy trắng (N1 mới); cạnh dao chưa đọc |
| N8 | Exploded 50% thép ra be | **FIXED (màu thân) / lỗi mới** | Cửa/thân 50% `#8d8f8c` trung tính bạc; nhưng nóc + dải capo cháy trắng (`automotive-fwd-50.jpg`) |
| N7 | Mobile 0% trời trống | **PARTIALLY** | `automotive-390x844-0.jpg`: xe y 450–555 (53–66% ✓), chấm ẩn ✓, nhãn chương ✓; khoảng trống tagline → nóc xe ~250 px vẫn còn |
| N6 | Hover kính không ổn định | **NOT FIXED** | `r5_B_auto`: `glass` hv = 1 ở 0% nhưng = 0 ở 25/50/75/100%; thêm điểm `axiom-t1` không part (x 855 ở mọi mốc — vùng kính chắn gió/capo) hv = 0 |
| N9 | Biển số chữ nhật trắng trơn | **FIXED** | `automotive-fwd-75.jpg`: biển "AXIOM · T1" có khung tối |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **N1 — Cháy trắng thép + kính phẳng** — 0% (vách cabin `#fcf8ef`), 50% (nóc/capo), 100% (capo 50% clip); 1440 & 1920; `automotive-crop0-side.jpg`, `automotive-fwd-50.jpg`, `automotive-fwd-100.jpg`. Kính hông `#454749` / `#24343b` phẳng. **Sửa:** (a) với body metalness 1: `envMapIntensity` ≤ 0,8 và lightformer dải dài hạ intensity 3 → 1,2, đặt dải hơi cao hơn để chỉ quét vai, không phủ mặt nghiêng cabin; giới hạn highlight bằng `toneMappingExposure` 0,9 hoặc ACES đã có + `roughness` tối thiểu .32 trên mặt hướng lên; nghiệm thu: không mặt thân nào > 3% pixel clip ở 5 mốc. (b) kính: `MeshPhysicalMaterial` color `#0d1418`, metalness 0, roughness .03, `envMapIntensity` 1,6, clearcoat 1 để nhận gradient trời — kính hông phải có chuyển sáng→tối theo chiều dọc, không đồng màu.
2. **N2 — Silhouette vẫn "pickup đời 80"** — mọi góc ngang; `automotive-crop0-side.jpg`, `automotive-orb0-low.jpg`. **Sửa (giá trị cao nhất):** đổi profile loft: hạ capo + kéo kính chắn gió thành một đường thẳng từ mũi tới đỉnh mái (góc ~22–25°), mái dốc liền xuống bửng ("sail" phủ thùng), nghiêng vách cabin vào trong 8–10° (tumblehome) và bỏ mặt nạ trước đứng (thay bằng mũi nêm + dải LED ngang). Hoặc GLB có giấy phép như đề xuất vòng 4.
3. **N3 — Hover kính/kính chắn gió chết** — 25/50/75/100%: `glass` hv 0; vùng (855, y) mọi mốc trả `axiom-t1` không part, hv 0 (`automotive-hov25-1-axiom_t1_glass.jpg` không khác `hov25-off`). **Sửa:** trong handler pick-nearest, map mọi intersection không có `userData.part` về part của mesh cha gần nhất (hoặc `body`), và khi hit đầu tiên là kính (transparent) vẫn dùng nó thay vì bỏ qua; nghiệm thu: lưới quét 45 px trên xe không còn ô nào `hover.id` ≠ null mà `value` = 0.
4. **N4 — Biến thể bị trung tính hóa ở .02** — `automotive-var1-50.png` (Graphite hiển thị `#8d8d8b`), `automotive-var2-50.png`, `automotive-var3-50.png`; UI vẫn ghi "GRAPHITE MATTE". **Sửa:** chỉ trung tính hóa biến thể Stainless; các biến thể sơn giữ màu và chỉ giảm clearcoat .6 ⇒ hoặc đổi nhãn swatch thành "Bare steel (exo view)" trong chương .02.
5. **N5 — Mobile 0% trời trống ~250 px** — `automotive-390x844-0.jpg`. **Sửa:** khi `aspect<0.6` dời khối tiêu đề xuống (top 22%) hoặc tăng scale xe ×1,15 để nóc xe ở ~45%.
6. **N6 (nhỏ) — Gương đặt trên capo xa phía trước cột A** — `automotive-orb0-low.jpg` (x≈910,y≈470). **Sửa:** dời gương về chân cột A (x −0,35 m theo trục xe), gắn vào cửa.

## Xe giờ "premium" hay vẫn asset game low-poly?
**Vẫn là asset game low-poly — nhưng là một pickup đọc đúng ở góc sau/3-4.** Thân loft liền là bước tiến thật (không còn hộp ghép), chi tiết cấp 2 (đèn, biển, tay nắm âm, vòm bánh, khung exploded) đủ. Cái giữ nó ở mức game: vách cabin đứng, mặt nạ trước đứng, kính là tấm xám phẳng, thép bị cháy trắng thay vì phản chiếu trời–cát mượt như F.
**Một thay đổi giá trị nhất:** sửa ánh sáng/vật liệu thép + kính (N1) — ít công nhất mà đổi cảm nhận nhiều nhất (thép có gradient trời-cát, kính có phản chiếu). Về dài hạn, đổi profile thành một đường nêm mũi → mái (N2) mới đưa lên "premium".

## Độ giống mẫu (F)
- HUD/chương/tiến độ/bảng số/typography: ~90%.
- Nhịp camera hero 3/4 → .01 ngang → .02 3/4 cao exploded bánh ghost → .03 3/4 sau dải đỏ → FIN: đúng F (`automotive-fwd-*.jpg` vs `F-contact.jpg`).
- Hình khối/vật liệu: ~62% (vòng 4: 58%) — F là nêm thép một nét với mặt lớn phản chiếu trời mờ; ta là pickup loft đa giác, mặt cháy trắng và kính phẳng.

## Có đạt ≥ 90? — **Chưa (84).** Sửa tối thiểu:
1. N1 (thép không clip + kính có phản chiếu) → +2–3 (3D 26–27).
2. N3 (hover kính/kính chắn gió) → +1–2 (Animation 27–28).
3. N2 (profile nêm, vách cabin nghiêng) → +2–3 (3D + bám mẫu).
Cả ba ⇒ ~90–91; thiếu N2 thì trần ~87.
