# QC JUDGE (Agent 05) — `/real-estate` · HALCYON Luxury Villa 3D

Ngày: 04/11/2026 · Giám khảo độc lập (bổ sung phạm vi theo yêu cầu điều phối).
Skill `3d-visual-qc`: **đã load và dùng được**.
Điều kiện đo: dev server `vite --port 5199` (DEV), Chrome (Playwright MCP, headed), `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác.
Ảnh của tôi: `qc-evidence/judge/shots/real-estate-*.jpg` · Script: `qc-evidence/judge/scripts/judge_real-estate.js`.
Ảnh builder đã xem: toàn bộ `qc-evidence/shots/real-estate/*.jpg`.

## Điểm: **67 / 100** — CHƯA đạt 90; có 1 lỗi bắt buộc sửa FAIL

| Hạng mục | Điểm | Lý do |
|---|---|---|
| Chất lượng 3D (30) | **19** | Khối kiến trúc, kính nhìn xuyên nội thất, hồ bơi, lam gỗ, skyline thuyết phục; nhưng lá cọ đen gai như lược, bụi cây là khối đa giác thô, nội thất hộp vuông, và camera chui vào đồi/đá khi xoay ra sau. |
| Animation & tương tác (30) | **20** | Scroll 5 chặng + hoàng hôn→đêm + khôi phục pose đúng; hover nhiều bộ phận có nhãn; 3 vật liệu mặt tiền; **orbit ra phía sau ở 0% cho khung hình đen/che kín**, ở 50% orbit dí camera vào tường sau. |
| Bám tinh thần mẫu (20) | **16** | Rail tầng bên phải, nhãn LEVEL lớn, serif nhẹ, dusk→night, hologram wireframe ở hồ bơi, toàn cảnh đêm — đúng cơ chế D (lệch tháp→villa có chủ đích, đã ghi trong spec). |
| Thiết kế frontend (10) | **6** | Chữ đè mặt tiền ở 50%, số "1" kiểu old-style đọc thành "LEVEL I", nhãn rail chìm trong cây ở 0%, hàng rào tiền cảnh chiếm 1/3 khung hero. |
| Hiệu suất & ổn định (10) | **6** | 0 error, nhưng ready 10,5 s (lần đầu) / 5,5 s (lần sau) ở dev; rAF ~44 fps idle, ~38 fps khi scrub, khung chậm nhất 147 ms — thấp nhất trong 3 demo. |

## Lỗi bắt buộc sửa

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mô hình 3D tương tác thật | **PASS** | `judge/shots/real-estate-orbit-low.jpg` (nhìn từ trên thấy mái, hồ, pergola thật) |
| Orbit 360° quan sát được | **FAIL** — cơ chế quay đủ (`yawTotal −6,287`, reset ⇒ `[27,4.2,40]`), nhưng ở 0% bán kính orbit ~50 m quét qua đồi/đá cảnh quan: yaw 180° khung hình **đen gần toàn bộ**, 150° và 210° bị khối đá che 50–60% khung. Không quan sát được mặt sau công trình. | `real-estate-orbit-back.jpg`, `real-estate-yaw150-at0.jpg`, `real-estate-yaw210-at0.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary`: `#e7dcc6` r .95 / `#4b5053` r .82 / `#c46e48` r 1.0, đổi trực tiếp trên ốp mặt tiền | `real-estate-variant-0..2.jpg`, builder `variant-1.jpg` |
| Hover có phản hồi | **PASS** — quét lưới tìm được `pool, roof, mass, fins, glass`, mỗi cái `hover.value ≈ 1`, có nhãn DOM ("GLASS WALL – Kính sàn-trần…"), rời ⇒ 0 | `real-estate-hover-*.jpg`, builder `hover-on.jpg` |
| Scroll mượt / khôi phục | **PASS** — 0/25/50/75/100 xuôi = ngược (level overview→ground→level1→rooftop→overview, `night` 0→.125→.517→.898→1); nhảy 1→0,3 hội tụ ~450 ms không pop | `real-estate-scroll-fwd-*.jpg`, `-back-*.jpg` |
| Không trắng/crash | **PASS (có điều kiện)** — không crash/0 error; nhưng khung đen khi orbit ra sau (đã tính ở mục orbit) | — |
| Không sai lệch nghiêm trọng | **PASS** — lệch tháp→villa là chủ đích, ghi trong SPEC | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Kiểm chứng các nghi vấn của điều phối
- **Lá cọ đen/gai:** **XÁC NHẬN.** Lá cọ render thành chùm nét đen mảnh như lược/răng cưa, gần như không có màu lá ở góc ngược sáng (`shots/real-estate/timeline-0.jpg` góc phải trên; `judge/shots/real-estate-orbit-right.jpg` toàn bộ nửa trên; `timeline-100.jpg`).
- **Khối chữ đè mặt kính ở ~50%:** **XÁC NHẬN.** "Tường kính, lam gỗ teak." + mô tả nằm trên kính tầng trệt và sofa; kicker "LEVEL 1 — 2 · LIVING & SUITE" gần như không đọc được (`judge/shots/real-estate-scroll-fwd-50.jpg`, `real-estate-1920x1080-50.jpg`).
- **"LEVEL I" bị cắt mép phải:** **XÁC NHẬN MỘT PHẦN, nguyên nhân khác.** Không bị viewport cắt; ở 1440×900 chữ "L" chồng đúng lên dải LED sáng dọc mép mặt tiền (x≈1282) nên đọc thành "ĿEVEL" (`real-estate-scroll-fwd-50.jpg`); ở 1920 đọc được. Ngoài ra số "1" dùng chữ số old-style của serif nên hiện như "I" (La Mã) — lệch với rail sans "LEVEL 1".
- **Hàng rào tiền cảnh lấn át ở 0%:** **XÁC NHẬN.** Tường rào + trụ đá chiếm ~30% dưới khung ở 1440×900, trụ đá cắt ngang dòng headline thứ 2 (`shots/real-estate/timeline-0.jpg`).
- **Thời gian ready 12–19 s:** **KHÔNG tái lập đúng con số, nhưng xác nhận chậm.** Tôi đo `getState().ready` từ `goto`: **10,5 s** lần tải đầu, **5,5 s** hai lần tải sau (dev server, cache module ấm). fnb/automotive cùng điều kiện: 1,2–4,0 s.
- **FPS ~30 idle (dev):** tôi đo bằng đếm `requestAnimationFrame` 5 s: **44,2–44,3 fps idle, 38,0–38,8 fps khi scrub 0→1**, p95 40 ms, khung tệ nhất 147 ms (Intel HD 530, DPR 1, 1440×900, DEV, headed Chrome). Không đo ở build production.

## Danh sách lỗi (theo mức nghiêm trọng)

1. **Orbit đưa camera vào trong đồi/đá — mặt sau không xem được (BLOCKER)** — ở 0%, yaw 150–210° camera `[-33,4.2,-40]` nằm trong/sau khối đồi; 180° gần như đen kín (`real-estate-orbit-back.jpg`, `yaw150-at0.jpg`, `yaw210-at0.jpg`). Ở 50% yaw 180° camera dí vào tường sau, chỉ thấy đá ốp + lá tre đen khổng lồ (`real-estate-yaw180-at50.jpg`). **Sửa:** (a) dời các khối đồi/đá/ cây lớn ra ngoài bán kính orbit + 10 m hoặc đặt chúng chỉ ở phía "background" theo góc hero; (b) thêm kiểm tra va chạm camera: raycast từ target→camera, nếu chạm mesh cảnh quan thì kéo camera lại gần target tới điểm chạm − 1 m; (c) ở các chặng cận cảnh (25/50/75) giới hạn yaw ±60° quanh pose chặng, chỉ cho 360° ở 0% và 100%.
2. **Lá cọ đen gai** — xem trên. **Sửa:** lá dùng mesh dải (frond strip) có `alphaMap` lá + màu `#2f4a2a`–`#4c6b3a`, `side: DoubleSide`, normal hướng lên (không lấy normal geometry mảnh), thêm `emissive` rất nhẹ hoặc hemisphere light để mặt dưới không đen tuyền; giảm số "kim" mỗi tàu lá, tăng bề rộng lá chét.
3. **Hiệu năng/khởi động** — ready 5,5–10,5 s, 38–44 fps trên HD 530 (thấp nhất trong 3 demo), spike 147 ms khi scrub. **Sửa:** sinh texture canvas (travertine, gỗ…) một lần và cache (hoặc bake ra PNG/KTX2 tĩnh), sinh trong worker/`requestIdleCallback` và hiện cảnh với texture tạm; instancing cho tre/cọ/cửa sổ skyline; shadow map ≤ 2048 một nguồn, tắt `castShadow` cho cây nhỏ; DPR cap 1,5.
4. **Chữ đè mặt tiền ở 50% + kicker chìm** — xem trên. **Sửa:** đặt khối chữ trong panel có nền gradient tối (`linear-gradient(90deg, rgba(10,14,28,.75), transparent)` rộng 40% trái) hoặc lệch camera chặng 50% sang phải để mặt kính nằm ở 45–100% bề ngang; kicker tăng độ tương phản (màu `#e8d9b5`, opacity 1).
5. **"LEVEL I"** — **Sửa:** `font-variant-numeric: lining-nums` cho nhãn tầng; thêm `text-shadow`/nền mờ sau nhãn lớn hoặc dời nhãn sang trái 40 px để không trùng dải LED mặt tiền ở 1440.
6. **Hàng rào tiền cảnh lấn át hero 0%** — **Sửa:** hạ camera hero ra sau tường rào hoặc nâng camera lên +2 m và nhích target lên để tường chỉ chiếm ≤ 12% đáy khung; bỏ trụ đá chắn headline (dời trụ sang x > 45%).
7. **Nhãn rail tầng chìm trong cây ở 0%** — "ROOFTOP", "LEVEL 2" nằm trên bụi tre/cọ, gần như không đọc được (`shots/real-estate/timeline-0.jpg` x≈1310–1380,y≈350–420). **Sửa:** rail có nền mờ (backdrop `rgba(12,16,30,.45)` + blur 6 px) hoặc chữ có `text-shadow 0 0 6px rgba(0,0,0,.6)`.
8. **Cây bụi và nội thất thô** — bụi tròn là khối đa giác 20–30 mặt màu đen-xanh phẳng (`real-estate-orbit-right.jpg` x≈430–650,y≈500–630), sofa/ghế là hộp vuông. **Sửa:** bụi = cụm instanced sphere nhỏ có noise + màu biến thiên; sofa thêm bevel/đệm (RoundedBox), ghế có chân mảnh.
9. **Mobile 0%: biệt thự quá nhỏ, nửa trên trống** — 390×844: công trình chỉ cao ~22% màn hình ở nửa dưới, nửa trên là trời trống (`shots/real-estate/390x844-0.jpg`). **Sửa:** mobile dùng FOV dọc rộng hơn và camera gần hơn ~35% cho chặng 0%, đặt villa ở 35–75% chiều cao.
10. **Ánh trắng lạ mép trái hero** — một khối trắng sáng nhô ở mép trái (x≈0–35,y≈265–290) đọc như billboard lỗi (`shots/real-estate/timeline-0.jpg`). **Sửa:** xác định mesh (đèn đường?) và dời khỏi mép khung hoặc giảm emissive.

## Độ giống mẫu (contact sheet D)
- **Vị trí/tỉ lệ hero:** D: tháp cao ~75% khung lệch phải, headline trái. Ta: villa ~55% khung giữa-phải, headline trái-dưới — đúng tinh thần, nhưng tiền cảnh rào chiếm nhiều hơn D.
- **Camera:** D hero nhìn từ dưới lên (pitch +15°); ta pos `[27,4.2,40]` nhìn hơi lên tới target y 6,8 — khớp. Chặng sảnh 25% ngang tầm mắt (pos y 1,75) — khớp D "GROUND FLOOR". Chặng tầng 50% nhìn thẳng song song kính — khớp D "LEVEL 34". 75% hồ bơi + hologram wireframe — khớp D 8,2–9,1 s. 100% toàn cảnh đêm cao — khớp.
- **Màu:** trời tím-hồng hoàng hôn → navy đêm; D xanh `#365987` hơn, ta tím-hồng hơn ở 0% — chấp nhận. Thiếu dải LED vàng chạy dọc công trình nổi bật như tháp D ở cảnh cuối (ta có dải mảnh trắng).
- **Typography/UI:** serif nhẹ (Cormorant), rail dọc phải, nhãn tầng lớn + giờ trong ngày (18:05→21:40) — rất sát D. Nút vàng "BOOK A VIEWING" không có (đúng phạm vi, không cần).
- **Phân lớp:** D chữ luôn trên ảnh full-bleed có vùng tối; ta chữ đè lên vùng sáng/chi tiết ở 50% — lệch.

## Kết luận
Chưa đạt (67) và có 1 mục bắt buộc **FAIL** (orbit mặt sau). Bộ sửa tối thiểu để ≥ 90: **#1** (va chạm camera/cảnh quan + giới hạn yaw ở chặng cận) — bắt buộc; **#2** (lá cọ); **#3** (texture cache/bake + instancing để ready < 4 s và ≥ 55 fps cùng máy); **#4–#7** (lớp chữ/nhãn đọc được, hero không bị rào lấn). Mục 8–10 là đánh bóng.
