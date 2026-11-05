# QC JUDGE vòng 2 — `/automotive` · AXIOM T1

Ngày: 05/11/2026 · Giám khảo độc lập · Skill `3d-visual-qc` đã load.
Điều kiện đo: dev server riêng port 5199 (DEV), Chrome headed (Playwright MCP), `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác. **Builder khác chạy song song trên cùng GPU/CPU và cùng phiên trình duyệt** — FPS bị ảnh hưởng.
Ảnh: `qc-evidence/judge/round2/shots/automotive-*.jpg`.

## Điểm: **79 / 100** (vòng 1: 75) — CHƯA đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **20** | Kính giờ phản trời, thân có gradient phản chiếu, clay `.02` và khung/pin đẹp; nhưng khối xe vẫn đọc là **low-poly hộp**: mặt phẳng lớn không có dải highlight sắc, vòm bánh hộp đen dày, gương hộp, tấm hậu trắng cháy, quầng đỏ tách rời xe. |
| Animation & tương tác (30) | **26** | Orbit 360°, reset, 4 biến thể, hover 5 bộ phận (body/glass/wheels/chassis/lights) giờ thấy rõ, exploded + clay + bụi + đèn hậu theo scroll, pitch giới hạn ~35°; còn top-view xe đè tagline. |
| Bám tinh thần mẫu (20) | **16** | Chương `.01/.02/.03`, bảng số, progress gạch chéo, trời→cát, exploded với bánh ghost, đèn đỏ sau — rất sát F về cơ chế; vật liệu thép F (cạnh sắc, highlight dài) vẫn chưa tới. |
| Thiết kế frontend (10) | **8** | HUD sạch ở 3 viewport; mobile xe ~85% bề ngang; tagline mobile ngắt dòng xấu ("ELECTRIC UTILITY · / FOLDED STEEL · ZERO / COMPROMISE"). |
| Hiệu suất & ổn định (10) | **9** | 0 error; ready lạnh 3,1 s; idle 70–75 fps, scrub 43–45 fps (p95 40 ms) có tranh chấp GPU. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `automotive-orb0-dragDown.jpg`, `automotive-orb50-*.jpg` |
| Orbit 360° | **PASS** — `yawTotal −6,287` ở 0/50/100%; reset ⇒ `[6.7,1.6,11.5]`; kéo dọc ⇒ camera nâng tối đa ~35° (y 9,3 ở bán kính 13,4), kéo lên không xuống dưới mặt cát | `automotive-orb{0,50,100}-*.jpg` |
| Đổi màu/vật liệu | **PASS** — `#d9dbdc` metal 1 r .14 / `#333538` metal .40 r .42 cc .60 / `#b39f7f` metal .55 cc 1 / `#6f8e9a` metal .60 cc 1 | `automotive-var0-0..3.jpg` |
| Hover có phản hồi | **PASS** — `extra.hoverPart` = glass/body/wheels/chassis (0%), + lights (75%), `hover.value` ≈ 1, rời ⇒ 0; body có viền cam, kính sáng xanh, mâm sáng | `automotive-hov0-off.jpg` vs `automotive-hov0-0-axiom_t1_glass.jpg`, `-1-axiom_t1_body.jpg`, `-3-axiom_t1_wheels.jpg` |
| Scroll mượt / khôi phục | **PASS** — 5 mốc xuôi = ngược; `exploded` 0→1→0, `rearLight` 0→1→.5; nhảy 1→0,3 hội tụ ~300 ms | `automotive-fwd-*.jpg`, `automotive-back-*.jpg` |
| Không trắng/crash | **PASS** | 0 error |
| Không sai lệch nghiêm trọng | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Bảng lỗi vòng 1

| # | Lỗi vòng 1 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Inox không phản chiếu | **PARTIAL** | `automotive-1920x1080-0.jpg`: nắp capo/mái phản xanh trời, hông có gradient ấm-lạnh; không thấy dải lightformer/softbox sắc chạy dọc thân như F, roughness .14 nhưng mặt vẫn "xám nhựa" |
| 2 | Kính phẳng + đốm cháy | **FIXED** | kính chắn gió phản trời (`automotive-fwd-0.jpg`), không còn đốm trắng (`automotive-orb0-left.jpg`) |
| 3 | Mặt trong thùng nâu ô-liu | **FIXED** | `automotive-orb50-back.jpg`: vách thùng cùng vật liệu, sàn thùng có thanh đen |
| 4 | Sail bay lơ lửng | **FIXED** | `automotive-orb50-*.jpg` không còn tấm tam giác |
| 5 | Thiếu clay `.02`, bụi `.01` | **FIXED** (clay, bụi) | `automotive-fwd-50.jpg` thân be clay + viền cam; `automotive-fwd-25.jpg` bụi trắng sau bánh sau (x≈1110–1200,y≈400–440 trong sheet). Bánh quay: không đo được bằng ảnh tĩnh — chưa xác nhận |
| 6 | Pitch cao: xe đè tiêu đề | **PARTIAL** | pitch hiệu dụng ~35° (đúng .62 rad), không còn cắt đáy; nhưng top view xe vẫn đè tagline "ELECTRIC UTILITY…" (`automotive-orb0-dragDown.jpg`) |
| 7 | Gương hộp, chi tiết thiếu | **NOT FIXED** | `automotive-1920x1080-0.jpg` x≈1010–1045,y≈565–590 và x≈1180–1210,y≈560–580: gương vẫn là hộp, không chân; mâm 5 chấu phẳng |
| 8 | Quầng đỏ tách rời xe `.03` | **NOT FIXED** | `automotive-fwd-75.jpg` (crop): vệt đỏ trên cát cách cản sau ~90 px về phía dưới-trái |
| 9 | Hover khó thấy | **FIXED** | xem bảng bắt buộc |
| 10 | Mobile xe nhỏ | **FIXED** | `automotive-390x844-0.jpg`, `-25.jpg`: xe ~85–88% bề ngang; còn ~33% trời trống giữa tiêu đề và xe |
| 11 | IP gợi Cybertruck | (ghi chú) | Nay đọc như pickup cabin kép hộp kiểu thập niên 90 + đèn LED ngang; ít gợi Cybertruck hơn |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **Xe vẫn đọc là low-poly hộp, không "premium"** — mọi góc (`automotive-1920x1080-0.jpg`, `automotive-orb0-*.jpg`, `automotive-orb100-*.jpg`): thân là 6–8 mặt phẳng lớn, cạnh không có bevel bắt sáng, vòm bánh là khung hộp đen dày 15 cm, gầm là thanh đen thẳng, khe cửa là vạch vẽ. **Sửa:** xem mục "Đường đi khả tín" bên dưới.
2. **Tấm hậu (tailgate) dưới trắng cháy, phẳng** — `automotive-fwd-75.jpg` x≈250–520,y≈520–640 (1440): mảng trắng `~#f4f4f4` không có phản chiếu, khác hẳn thép thân. **Sửa:** gán cùng `primary` cho tấm hậu (hiện có vẻ dùng vật liệu riêng/UV hỏng), hoặc nếu là vật liệu riêng: `metalness 1, roughness .2`, tối hơn thân 10%; kiểm tra normal hướng ra ngoài.
3. **Quầng đỏ trên cát tách rời** — xem bảng #8. **Sửa:** đặt decal glow ngay dưới mép cản sau: `position = rearBumperWorld + (0, 0.01, −0.25)`, scale ≤ 1,6×0,6 m, opacity = `rearLight*.55`, falloff radial; hoặc dùng RectAreaLight hướng xuống từ dải đèn.
4. **Khe sáng trắng mảnh trong vòm bánh sau** — `automotive-fwd-75.jpg` (crop) x≈600,y≈240–310: sợi trắng dọc mép trong vòm bánh, đọc như khe hở geometry. **Sửa:** đóng mặt trong vòm (liner) bằng mesh đen nhám, hoặc lùi panel thân 2 cm cho trùng mép liner.
5. **Top view: xe đè tagline** — `automotive-orb0-dragDown.jpg`, `automotive-orb100-dragDown.jpg`. **Sửa:** khi pitch > 0,3 rad, dịch target y −0,6 và dolly ×1,15 để nóc xe nằm dưới mép dưới khối tiêu đề (ở 1440: y > 330 px).
6. **Gương/mâm/tay nắm thô** — bảng #7. **Sửa:** gương = Extrude hình thang vát + chân trụ 2 cm nối chân cột A; mâm = Extrude 6 chấu có chiều sâu 3 cm + đĩa phanh lathe 32 seg; tay nắm âm = boolean lõm hoặc 2 mesh (hốc đen + thanh inox).
7. **Mobile 0%: tagline ngắt dòng xấu và trời trống ~33%** — `automotive-390x844-0.jpg`. **Sửa:** mobile dùng tagline 2 dòng cố định (`ELECTRIC UTILITY` / `FOLDED STEEL · ZERO COMPROMISE`), dời xe lên 45–55% chiều cao.

## Xe giờ "premium" hay vẫn hộp low-poly?
**Vẫn hộp low-poly.** Vật liệu đã khá hơn (kính phản trời, thân có gradient môi trường, clay đẹp ở `.02`), nhưng hình khối không có độ tinh: không bevel, không đường gân, panel không cong, chi tiết nhỏ (gương, mâm, tay nắm, đèn) là primitive. Ở khoảng cách hero nó đọc như xe trong game mobile, không phải sản phẩm ô tô cao cấp như F.

**Đường đi khả tín nhất:**
1. **Ưu tiên: GLB có giấy phép** (Sketchfab/CGTrader/TurboSquid, giấy phép thương mại cho web, KHÔNG phải model xe thương hiệu — chọn "concept electric pickup" hoặc "generic pickup"), 80–200k tam giác, nén Draco/Meshopt + KTX2, tách node body/glass/wheels/lights để giữ hover-theo-bộ-phận, exploded và biến thể `primary`. Ghi vào `ASSET_LICENSES.md`. Đây là cách duy nhất đạt "premium" trong một vòng sửa.
2. **Nếu bắt buộc procedural:** dựng lại thân bằng mặt cắt nhiều tiết diện (≥ 12 profile) + `ExtrudeGeometry` có `bevelSegments ≥ 3, bevelSize .02–.03`, gân vai bằng bevel lõm, vòm bánh là Tube cong theo cung tròn (không hộp), chamfer mọi cạnh, normal smoothing theo nhóm góc < 30°; thêm 3 Lightformer dải dài (scale 14×0,4) để mỗi cạnh vát bắt một vệt sáng. Ước tính 2–3 ngày công và vẫn khó vượt mức "tạm" — không khuyến nghị.

## Độ giống mẫu (F)
- Bố cục/HUD/chương/tiến độ: ~90% giống F (wordmark "AXIOM T1" thay graffiti — hợp lệ).
- Camera: hero 3/4 trước, `.01` profile ngang, `.02` 3/4 cao exploded, `.03` 3/4 sau + đèn đỏ — đúng nhịp F.
- Vật liệu/hình khối: ~50% — F là thép phẳng nhưng có cạnh sắc bắt highlight, panel lớn phản trời-cát mạnh; ta phản chiếu yếu, cạnh mềm/không bắt sáng.

## Kết luận
79/100 — chưa đạt 90. Bộ sửa tối thiểu: **#1** (GLB có giấy phép hoặc thân procedural có bevel + lightformer dải) +6–8, **#2 + #3 + #4** (tailgate, quầng đỏ, khe vòm) +2, **#5 + #6** (top-view, chi tiết nhỏ) +1–2. Không có #1 thì trần thực tế ~84.
