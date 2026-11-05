# QC JUDGE vòng 4 — `/automotive` · AXIOM T1

Ngày: 05/11/2026 · Giám khảo độc lập · Skill `3d-visual-qc` đã load, checklist 1–8. Chấm theo cái nhìn thấy vòng này.
Điều kiện: dev server riêng port 5199 (DEV), Chrome qua Playwright MCP, `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác. Máy dùng chung ⇒ không dùng FPS làm bằng chứng (orchestrator đã đo production 58–75 fps).
Ảnh: `qc-evidence/judge/round4/shots/automotive-*.jpg`. Script: `.playwright-mcp/r4_automotive_A.js`, `_B.js` + crop 1920.

## Điểm: **83 / 100** (vòng 3: 80) — CHƯA đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **23** | Mặt trước giờ ra dáng (cản thép, lưới tản nhiệt nan, DRL ống, 3 projector/bên), hốc bánh có vách trong, đuôi có diffuser/đèn phản quang/hốc biển số, tay nắm âm, bevel bắt sáng mảnh, thép chải có vệt; nhưng khối cấp 1 vẫn là hộp cabin + hộp thùng + nêm capo — đọc là pickup vuông thập niên 90, không phải xe cao cấp. |
| Animation & tương tác (30) | **26** | Orbit/reset/4 biến thể/hover 5 bộ phận/exploded/scroll xuôi = ngược/jitter đều đạt; pitch top-view đã hạ (camera y 9,0 so với 11,6) nhưng ở 0% cản trước vẫn chạm thanh tiến độ và chữ "SCROLL" nằm đè lên capo; hover `glass` lúc có lúc không. |
| Bám tinh thần mẫu (20) | **16** | HUD/chương .01–.03/bảng số/progress gạch/trời→cát/exploded bánh ghost/dải đỏ đuôi rất sát F; hình khối và mặt phản chiếu lớn kiểu F vẫn thiếu. |
| Thiết kế frontend (10) | **9** | HUD sạch ở 1920/1440/390, không tràn ngang; mobile 0% vẫn ~30% trời trống giữa tagline và xe. |
| Hiệu suất & ổn định (10) | **9** | 0 console error / pageerror / HTTP lỗi; ready ấm 2,2 s. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `automotive-orb{0,50,100}-*.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal −6,287` (tích lũy −12,57 / −18,85); reset ⇒ `[6.7,1.6,11.5]` / `[7.3,5.4,9.4]` / `[8.5,1,8.7]`; kéo lên dừng ở mặt cát (y 1,6/1,9/1,0) | `automotive-orb0-dragUp.jpg` |
| Đổi màu/vật liệu | **PASS** — `#d3d5d6` metal 1 r .27 / `#2f3134` m .40 r .42 cc .60 / `#b39f7f` m .55 r .34 cc 1 / `#6f8e9a` m .60 r .30 cc 1, giống nhau ở 0% và 100%; phản chiếu giữ | `automotive-var0-0..3.jpg`, `automotive-var100-0..3.jpg` |
| Hover có phản hồi | **PASS** — body/lights/wheels/chassis `hover.value` ≈ 1 ở mọi mốc, rời ⇒ 0; `glass` = 1 ở 25% nhưng lần ghé lại ở 0/50/75/100% báo 0 (xem N6) | `automotive-hov0-off.jpg` vs `automotive-hov0-0-axiom_t1_body.jpg`, `-3-axiom_t1_lights.jpg` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược (FOV lệch ≤ 0,005°); nhảy 1→0,3 hội tụ ~420 ms không pop; wheel-jitter về 0 | `automotive-fwd-*.jpg`, `automotive-back-*.jpg` |
| Không trắng/crash | **PASS** | 0 error |
| Không sai lệch nghiêm trọng | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Lỗi vòng 3 → trạng thái vòng 4

| # | Lỗi vòng 3 | Trạng thái | Bằng chứng |
|---|---|---|---|
| N1 | Khối xe vẫn hộp, không premium | **NOT FIXED** (builder tự nhận) | `automotive-1920x1080-0.jpg`, `automotive-1920-75.jpg`, `automotive-orb100-dragDown.jpg` (nhìn từ trên: 3 hộp xếp + prism capo) |
| N2 | Hốc vòm trước nhìn xuyên ra cát | **FIXED** | `automotive-crop0-front.jpg`: vòm trước có vách trong đen liền, phía sau lốp chỉ thấy lốp bên kia, không thấy cát |
| N3 | Pitch top-view quá cao, xe tràn mép dưới | **PARTIALLY** | camera xuống tối đa y 9,04 (vòng 3: 11,6). `automotive-orb100-dragDown.jpg`: đáy xe y≈815 < thanh 848 — OK. `automotive-orb0-dragDown.jpg`: cản trước y≈840 chạm thanh tiến độ, chữ "SCROLL" + vạch nằm đè lên capo (x≈712,y≈773). Bridge `orbit.pitch` vẫn báo 1,2 (kẹp ở tầng camera) |
| N4 | Mặt trước thô | **FIXED (cơ bản)** | `automotive-crop0-front.jpg`: lưới nan ngang, 3 projector mỗi bên, DRL ống sáng chạy ngang mép capo, cản thép + 2 móc kéo cam |
| N5 | Cạnh vát không đọc được | **PARTIALLY** | `automotive-crop0-side.jpg`: một vệt sáng mảnh dọc vai và mép mái; mép capo có highlight; vẫn mảnh 1–2 px ở 1920 — không có "cạnh dao" F |
| N6 | Tay nắm/khe cửa là vạch dán | **FIXED** | `automotive-crop0-side.jpg`: tay nắm là hốc tối có viền sáng; khe cửa đọc được là rãnh |
| N7 | Mobile 0% trời trống ~30% | **PARTIALLY** | `automotive-390x844-0.jpg`: xe ở y≈475–575, khoảng trống tagline→nóc xe ≈ 265 px (~31% chiều cao) |
| — | Đuôi xe (diffuser, phản quang, hốc biển, hốc đèn) | **FIXED** | `automotive-1920-75.jpg`: dải đèn đỏ trong hốc, chữ AXIOM dập, hốc biển, 2 phản quang hồng, diffuser đen |
| — | Kính tint / nhựa nhám / bóng lốp | **FIXED** | `automotive-1920x1080-0.jpg`: kính xanh-xám có phản chiếu, vòm nhựa nhám, bóng tiếp xúc dưới lốp rõ |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **N1 — Hình khối cấp 1 vẫn là hộp ghép** — mọi góc (`automotive-1920x1080-0.jpg`, `automotive-orb0-right.jpg`, `automotive-orb100-dragDown.jpg`). Cabin hộp kính đứng, thùng hộp, capo nêm có gờ prism, vòm bánh là các tấm vát gắn vào. Ở góc 3/4 sau (`automotive-1920-75.jpg`) đọc như pickup Nhật cũ. **Sửa (giá trị cao nhất):** thay thân bằng GLB có giấy phép (generic/concept electric pickup, 80–200k tri, Draco/Meshopt + KTX2, tách node body/glass/wheels/lights/chassis để giữ hover + exploded + `primary`), ghi `ASSET_LICENSES.md`. Nếu bắt buộc procedural: dựng thân bằng **một** ExtrudeGeometry theo profile một nét (mũi thấp → kính chắn gió nghiêng ~25° liền với mái → mái dốc xuống tới đuôi, kiểu "sail"), kính là mặt đồng phẳng với thân, bỏ hộp cabin riêng.
2. **N3 — Top-view 0%: xe chạm progress bar, "SCROLL" đè capo** — `automotive-orb0-dragDown.jpg`. **Sửa:** khi pitch > 0,45 rad nội suy target y +0,6 và dolly ×1,15 để đáy xe ≤ 88% chiều cao khung; ẩn gợi ý "SCROLL" khi người dùng đang orbit (opacity 0 sau pointerdown đầu tiên). Đồng bộ `orbit.pitch` trong bridge với pitch thực.
3. **N5 — Cạnh vát vẫn mảnh** — `automotive-crop0-side.jpg`. **Sửa:** đặt 1 Lightformer dải dài (scale 18×0,4, intensity 3) ngang ngay trên xe để mặt phẳng lớn cửa/thùng có một gradient phản chiếu mạnh dọc thân như F; bevel vai/mái ≥ 6 cm.
4. **N8 (mới) — 50% exploded: thép chải ra màu be phẳng** — `automotive-fwd-50.jpg`: ở camera cao thân "Brushed stainless" phản chiếu toàn cát, đọc như sơn be, mất tính thép; cạnh ánh cam của shut-line lại nổi. **Sửa:** ở pha .02 tăng env xoay/lightformer phía trên (trời) để mặt trên phản chiếu trời xanh-trắng, hoặc giảm saturation env ground cho thép.
5. **N7 — Mobile 0% trời trống** — `automotive-390x844-0.jpg`. **Sửa:** `aspect < 0.6` ⇒ dịch target y −0,5 và tăng scale xe ×1,1 để xe vào vùng 40–62% chiều cao.
6. **N6 — Hover kính không ổn định** — 0/50/75/100%: điểm quét báo `hoverPart: glass` nhưng ghé lại `hover.value` = 0 (`automotive-hov0-1-axiom_t1_glass.jpg`). **Sửa:** raycast kính (transparent) được lọc bởi `raycast` của mesh phía sau — đặt `glass.raycast` ưu tiên hoặc gộp hover kính vào `body`.
7. **N9 (mới, nhỏ) — Biển số là chữ nhật trắng trơn** — `automotive-1920-75.jpg`. **Sửa:** texture biển "AXIOM T1" mono xám, viền khung tối.

## Xe giờ "premium" hay vẫn hộp low-poly?
**Vẫn hộp low-poly — bản hộp chi tiết nhất từ trước tới giờ.** Chi tiết cấp 2–3 (mặt trước, đuôi, tay nắm âm, vòm có vách, thép chải) đã đạt mức asset game tầm trung, nhưng silhouette cabin-hộp + thùng-hộp + nêm capo quyết định cảm nhận và không hề "premium" như F.
**Một thay đổi giá trị nhất:** thay thân bằng **GLB có giấy phép** (hoặc tối thiểu: một thân liền một nét mũi→mái→đuôi với kính đồng phẳng). Không đổi silhouette thì trần thực tế ~85.

## Độ giống mẫu (F)
- HUD/chương/tiến độ/bảng số/typography: ~90%.
- Nhịp camera hero 3/4 → .01 ngang → .02 3/4 cao exploded bánh ghost → .03 3/4 sau dải đỏ → FIN: đúng F (`automotive-fwd-*.jpg` vs `F-contact.jpg`).
- Hình khối/vật liệu: ~58% (vòng 3: 55%) — F là khối thép đơn mảnh cạnh dao, mặt lớn phản trời; ta là nhiều hộp, phản chiếu nhỏ vụn.

## Có đạt ≥ 90? — **Chưa (83).** Sửa tối thiểu:
1. N1 (silhouette: GLB có giấy phép hoặc thân một nét) → +5–7.
2. N3 + N6 (top-view không chạm HUD, hover kính) → +1–2.
3. N5 + N8 (dải lightformer lớn để thép có mặt phản chiếu, exploded không ra be) → +1–2.
