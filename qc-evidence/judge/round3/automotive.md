# QC JUDGE vòng 3 — `/automotive` · AXIOM T1

Ngày: 05/11/2026 · Giám khảo độc lập · Skill `3d-visual-qc` đã load. Chấm theo cái nhìn thấy vòng này.
Điều kiện đo: dev server riêng port 5199 (DEV), Chrome qua Playwright MCP, `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác. **Agent khác dùng cùng GPU/CPU cùng lúc — tranh chấp nặng hơn vòng 2 (idle chỉ 42 fps so với 70–75 vòng trước)**; mọi số FPS chỉ tham khảo, orchestrator đo lại trên máy yên tĩnh (production build).
Ảnh: `qc-evidence/judge/round3/shots/automotive-*.jpg`. Script: `.playwright-mcp/r3_automotive_A.js`, `_B.js`.

## Điểm: **80 / 100** (vòng 2: 79) — CHƯA đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **22** | Có tiến bộ thật: vòm bánh vát + lót đen, gân vai, nắp capo có gờ, gương có chân, mâm 6 chấu turbine, tấm hậu hết cháy; nhưng khối tổng thể vẫn là hộp cabin + hộp thùng + nêm mũi, cạnh vát gần như không bắt highlight, mặt trước (đèn = hình chữ nhật trắng trong khung đen, cản = hộp) thô, nhìn xuyên qua hốc vòm trước thấy cát. |
| Animation & tương tác (30) | **25** | Orbit 360°/reset/4 biến thể/hover 5 bộ phận/exploded/scroll xuôi = ngược đều đạt; trừ vì **pitch giờ lên tới ~62°** (vòng 2 ~35°): nhìn trên xuống xe tràn mép dưới, đè progress bar và chữ SCROLL (hồi quy). |
| Bám tinh thần mẫu (20) | **16** | Chương .01/.02/.03, bảng số, progress gạch chéo, trời→cát, exploded bánh trắng ghost, đèn đỏ đuôi — cơ chế sát F; nhưng F là khối thép đơn mảnh có cạnh dao sắc và mặt phản trời lớn, ta là pickup cabin kép kiểu thập niên 90. |
| Thiết kế frontend (10) | **9** | HUD sạch ở 1920/1440/390, tagline mobile giờ ngắt 2 dòng đúng; còn khoảng trời trống ~30% ở mobile 0%. |
| Hiệu suất & ổn định (10) | **8** | 0 console error/pageerror/HTTP lỗi; ready lạnh 4,5 s / ấm 3,3 s; idle 42,6 fps, scrub 10,5 fps (p95 253 ms) trong tranh chấp GPU nặng — không quyết định, cần đo lại. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `automotive-orb{0,50,100}-*.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal −6,287` (tích lũy −12,57 / −18,85); reset ⇒ `[6.7,1.6,11.5]` / `[7.3,5.4,9.4]` / `[8.5,1,8.7]` đúng pose mốc; kéo lên dừng ở mặt cát (camera y = 1,6 / 1,9 / 1,0, không chui dưới) | `automotive-orb0-dragUp.jpg` |
| Đổi màu/vật liệu | **PASS** — `#d9dbdc` metal 1 r .17 / `#2f3134` metal .40 r .42 cc .60 / `#b39f7f` metal .55 r .34 cc 1 / `#6f8e9a` metal .60 r .30 cc 1; giống nhau ở 0% và 100%, phản chiếu giữ | `automotive-var0-0..3.jpg`, `automotive-var100-0..3.jpg` |
| Hover có phản hồi | **PASS** — `hoverPart` body/glass/lights/wheels/chassis, `hover.value` ≈ 1, rời ⇒ 0 ở cả 5 mốc; body có viền cam + ấm lên, mâm sáng trắng, đèn sáng | `automotive-hov0-off.jpg` vs `-0-axiom_t1_body.jpg`, `-4-axiom_t1_wheels.jpg`; `automotive-hov75-3-axiom_t1_lights.jpg` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược (FOV lệch ≤ 0,005°); nhảy 1→0,3 hội tụ ~360 ms không pop | `automotive-fwd-*.jpg`, `automotive-back-*.jpg` |
| Không trắng/crash | **PASS** | 0 error, 1 warning |
| Không sai lệch nghiêm trọng | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Lỗi vòng 2 → trạng thái vòng 3

| # | Lỗi vòng 2 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Xe đọc là low-poly hộp | **PARTIAL** | `automotive-1920x1080-0.jpg`: có vòm vát, gân vai, capo gờ, gradient phản chiếu dài trên cửa; nhưng cạnh vát 3 dải không thấy bắt sáng ở khoảng cách hero (crop mũi xe: mép capo chỉ có 1 vệt sáng mảnh), cabin/thùng vẫn là hộp vuông góc |
| 2 | Tấm hậu trắng cháy | **FIXED** | `automotive-fwd-75.jpg` (crop): tấm hậu cùng chất thép thân, có gradient ấm từ cát, chữ AXIOM dập |
| 3 | Quầng đỏ trên cát tách rời | **FIXED** | `automotive-fwd-75.jpg`: không còn vệt đỏ dưới đất; dải đèn có halo bám sát |
| 4 | Khe trắng trong vòm bánh sau | **FIXED** (sau) / **mới** ở vòm trước | vòm sau có lót đen; nhưng vòm trước nhìn 3/4 thấy xuyên ra cát giữa lốp và cản (`automotive-1920x1080-0.jpg` x≈1200–1260,y≈660–700) — xem N2 |
| 5 | Top view xe đè tagline | **REGRESSED** | không còn đè tagline, nhưng pitch giờ tới ~62° (camera y 11,6 ở 0%): xe tràn mép dưới khung, đè thanh tiến độ + "SCROLL" (`automotive-orb0-dragDown.jpg`, `automotive-orb50-dragDown.jpg`, `automotive-orb100-dragDown.jpg`) |
| 6 | Gương/mâm/tay nắm thô | **PARTIAL** | gương có chân trụ (crop mũi xe), mâm 6 chấu xoáy có chiều sâu + tâm cam; tay nắm vẫn là thanh đen phẳng dán lên, đèn pha là chữ nhật trắng |
| 7 | Mobile tagline xấu, trời trống | **FIXED** (tagline) / PARTIAL (trống) | `automotive-390x844-0.jpg`: "ELECTRIC UTILITY / FOLDED STEEL · ZERO COMPROMISE" 2 dòng; vẫn ~30% trời trống giữa tiêu đề và xe |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **N1 — Khối xe vẫn hộp, không "premium"** — mọi góc (`automotive-1920x1080-0.jpg`, `automotive-orb0-*.jpg`, `automotive-orb100-*.jpg`). Cabin là hộp có kính thụt, thùng là hộp, mũi là nêm phẳng, đáy là thanh đen thẳng; tỷ lệ đọc như pickup thập niên 90. **Sửa (giá trị cao nhất):** thay thân bằng GLB có giấy phép (concept/generic electric pickup, 80–200k tri, Draco/Meshopt + KTX2, tách node body/glass/wheels/lights/chassis để giữ hover + exploded + `primary`), ghi `ASSET_LICENSES.md`. Nếu bắt buộc procedural: dựng thân thành MỘT khối liền (không ghép hộp cabin/thùng) theo profile F — đường mái một nét từ mũi tới đuôi, kính là mặt phẳng nghiêng đồng phẳng với thân, thêm 2–3 `Lightformer` dải dài (scale 16×0,3) đặt ngang trên cao để mỗi cạnh vát cho một vệt sáng liên tục.
2. **N2 — Hốc vòm trước nhìn xuyên ra cát** — 0%, 3/4 trước, 1440 & 1920 (`automotive-1920x1080-0.jpg` x≈1200–1260,y≈660–700; `automotive-hov0-off.jpg`). **Sửa:** thêm tấm chắn bùn trong (inner wheel-well) bằng nửa trụ đen nhám `roughness .9` bán kính = vòm + 2 cm, đóng khe giữa vòm và cản trước.
3. **N3 — Pitch top-view quá cao, xe tràn mép dưới** — `automotive-orb{0,50,100}-dragDown.jpg`. **Sửa:** kẹp pitch `≤ 0,65 rad`, hoặc khi pitch > 0,5 rad nội suy target y về +0,8 và dolly ×1,2 để xe nằm giữa 35–80% chiều cao khung, không chạm progress bar (y < 820 ở 1440×900).
4. **N4 — Mặt trước thô** — crop `automotive-1920x1080-0.jpg` mũi xe: đèn pha là 2 hình chữ nhật trắng trong khung đen, cản là hộp đen với 2 ô cam. **Sửa:** dải LED ngang liền mạch toàn chiều rộng mũi (như F/đuôi xe của ta) dạng tube mảnh emissive `#e8f2ff` intensity 2, cản tích hợp vào thân (cùng `primary`, chỉ để tấm skid đen ở dưới).
5. **N5 — Cạnh vát không đọc được** — builder nói "bevelled 3-band edges catch highlights", nhưng ở khung hero chỉ thấy viền mảnh 1 px ở mép capo và mép cửa sổ. **Sửa:** tăng bevelSize lên 0,035–0,05 m ở các cạnh chính (vai, mép mái, mép capo), đặt lightformer để dải giữa của bevel phản sáng trắng.
6. **N6 — Tay nắm/khe cửa là vạch dán** — `automotive-1920x1080-0.jpg` x≈760–795,y≈628. **Sửa:** tay nắm âm = hốc `roughness .6` lõm 1 cm + thanh inox; khe cửa thành rãnh có độ sâu (normal map line).
7. **N7 — Mobile 0%: trời trống ~30%** — `automotive-390x844-0.jpg`. **Sửa:** khi `aspect < 0.6` dịch target y −0,4 để xe lên vùng 45–60% chiều cao.

## Xe giờ "premium" hay vẫn hộp low-poly?
**Vẫn là hộp low-poly — một bản hộp được trau chuốt hơn.** Chi tiết phụ (vòm vát, gương có chân, mâm, gân vai) đã nâng từ "game mobile" lên "asset game tầm trung", nhưng hình khối cấp 1 (cabin hộp + thùng hộp + nêm mũi) và mặt trước thô vẫn quyết định cảm nhận. Không đạt mức sản phẩm ô tô cao cấp như F.
**Thay đổi giá trị cao nhất còn lại:** thay thân xe bằng **GLB có giấy phép** (generic/concept electric pickup, tách node đúng bộ phận) — đây là cách duy nhất khả thi để qua ngưỡng "premium" trong một vòng; procedural thêm nữa cho lợi nhuận giảm dần.

## Độ giống mẫu (F)
- Bố cục/HUD/chương/tiến độ/bảng số: ~90% giống F.
- Camera: hero 3/4 trước, .01 profile ngang, .02 3/4 cao exploded với bánh ghost trắng, .03 3/4 sau + dải đỏ — đúng nhịp F (`automotive-fwd-*.jpg` vs `F-contact.jpg`).
- Hình khối/vật liệu: ~55% — F là khối đơn có mặt lớn phản trời-cát và cạnh dao; ta là nhiều hộp ghép, phản chiếu dọc kiểu brushed.

## Có đạt ≥ 90 không? — **Chưa (80).** Sửa tối thiểu:
1. N1 (GLB có giấy phép hoặc thân một khối + lightformer dải) → +6–8.
2. N2 + N3 (bịt hốc vòm, kẹp pitch top-view) → +2.
3. N4 + N5 (mặt trước LED liền, bevel đọc được) → +1–2.
Không có N1 thì trần thực tế ~84–85.
