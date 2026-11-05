# QC_REPORT — BAHA 3D SHOWCASE V2

> ## V2 (photoreal) — đo bản production trên máy rảnh, 05/11/2026 05:33 UTC (`qc-evidence/perf-production.md`; bản v1 cùng lúc lưu ở `perf-production-run2-v1.*`)
> Chrome 156 headless · Intel HD 530 (D3D11) · 1440×900 · DPR 1 · cuộn script 8 s 0→100 %.
> | Demo v2 | Cold ready | Idle fps | Cuộn fps | p95 | Frame xấu nhất | Console error | Đánh giá |
> |---|---|---|---|---|---|---|---|
> | automotive | 3,6 s | 68,3 | 62,2 | 26,7 ms | 53,6 ms | 0 | đạt (≥ 55) |
> | beauty | 7,5 s | 75,3 | 72,7 | 13,5 ms | 133,4 ms | 0 | đạt; ready lạnh dài hơn v1 (4,3 s) |
> | real-estate | 6,7 s | 67,6 | **44,0** | 26,8 ms | **2106,5 ms** | 0 | **KHÔNG ĐẠT** — có lần đứng hình ~2,1 s khi cuộn ⇒ builder sửa: nguyên nhân = bật/tắt `visible` đèn viền giữa lúc cuộn làm biên dịch lại shader; đã bỏ đèn đó, thêm `Warmup` biên dịch mọi shader + upload texture trước `ready`, cỏ 90k → 48k. **Builder tự đo production sau sửa: cuộn 60,1 / 58,6 fps, frame xấu nhất 53 / 80 ms, ready lạnh 1–2 s** (chờ orchestrator đo lại) |
> **Giám khảo độc lập V2 lượt 1** (`qc-evidence/judge/v2/`, ~150 ảnh): **automotive 70/100** (3D 18 · tương tác 25 · bám mẫu 11 · FE 8 · hiệu năng 8) — sơn lì có hạt, không phản chiếu; ốp sườn/cản sau đen như lỗ; núi procedural loang lổ, có vết nối ở orbit 135°. **beauty 78/100** (22 · 26 · 15 · 8 · 7) — nước bắn như ribbon nilon; ánh sáng phẳng thiếu backlight xuyên chai; callout 50 % chen nhau + vệt phản chiếu hình lá trên vai chai; ready lạnh 7,5 s. Cả hai PASS mọi mục bắt buộc (orbit, ≥3 biến thể đổi vật liệu thật, hover, cuộn xuôi/ngược khớp camera Δ=0, 0 console error, cảm ứng). **Kết luận giám khảo: chưa đủ chuẩn giới thiệu khách hàng.** Đã giao builder sửa lượt 3.
> Mobile giả lập 390×844 DPR 2: 72,8–75,1 fps cuộn, 0 lỗi (real-estate frame xấu nhất 240 ms). Ảnh so sánh v1|v2 cùng khung: `baseline/compare/<id>/*.jpg` (lưu ý: ảnh cuộn v1 chụp khi con trỏ đang hover sản phẩm; v2 không hover).
>
> **Mục tiêu hiện hành: `../CURRENT_GOAL.md`** (05/11/2026). Các vòng giám khảo dưới đây là kết quả **giai đoạn v1** (5 demo). Fashion + F&B **tạm dừng** — điểm cuối giữ ở vòng 6. QC giai đoạn v2 (photoreal) chỉ áp dụng cho Automotive, Beauty, Real Estate và sẽ ghi thành mục riêng "V2".

> Báo cáo trung thực: chỉ ghi PASS khi có bằng chứng đo/chụp. **Chưa demo nào đạt nghiệm thu.**
> Cập nhật: 04/11/2026 — vòng 1.

## 1. Hạ tầng QC / framework (chạy trên placeholder torus-knot của `/beauty`)
Lệnh: `npx playwright test -g "beauty"` · Chrome thật (kênh `chrome`), GPU `ANGLE (Intel HD Graphics 530, Direct3D11)`, DPR 1, viewport 1440×900 (mobile: iPhone 13 emulation, touch).

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| Route tải, bridge `ready`, frame > 8, không console/page/request error | PASS | |
| Orbit: kéo 3×400px ⇒ `yawTotal` ≥ 2π·0.9; kéo một phần ⇒ camera dịch > 0.4; Reset view ⇒ yaw ≈ 0, camera về vị trí gốc | PASS | đọc camera thật qua bridge |
| Biến thể màu: 3 chip ⇒ ≥ 3 màu khác nhau trên vật liệu `primary` (đọc từ `MeshPhysicalMaterial`) | PASS | PBR (roughness…) vẫn còn |
| Hover: quét lưới điểm ⇒ `hover.value` > 0.4 và `rim` uniform > 0.05; rời chuột ⇒ < 0.08 | PASS | rim Fresnel trong shader vật liệu |
| Scroll 0/25/50/75/100 xuôi rồi ngược: camera khác nhau giữa các mốc; quay lại 50% / 0% khôi phục pose | PASS | |
| Resize 1920×1080 / 1440×900 / 390×844, không tràn ngang | PASS | |
| FPS có điều kiện | **idle 70.4 · cuộn 74.3 fps** (placeholder, Intel HD 530, DPR 1) | Chỉ có giá trị cho placeholder — đo lại với cảnh thật |
| Mobile touch: vuốt ngang xoay, vuốt dọc cuộn trang | PASS | CDP touch events |

Kết luận §1: **harness và framework hoạt động**. Đây KHÔNG phải kết quả của một demo nghiệm thu.
Lỗi harness phát hiện & sửa trong vòng 1: (a) bridge báo yaw bị "gói" về 0 sau 360° ⇒ thêm `yawTotal` không gói; (b) hover test nhắm trúng lỗ giữa khối ⇒ quét lưới điểm.

## 2. Từng demo
| Demo | Mô hình thật | Orbit | Màu | Hover | Scroll | Desktop | Mobile | FPS đo | Điểm QC E | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|
| beauty | ✓ (builder) | PASS (judge: yawTotal −6,287) | ✓ 3 "thế giới màu" | PASS yếu | ✓ | judge | judge | judge đo: ~60 FPS sau khi ready | **78/100** (giám khảo) | **FAIL < 90** — mục bắt buộc PASS (hover rất yếu); sửa vòng 2 |
| fnb | ✓ (builder) | builder: 10/10 test | ✓ 3 men gốm | ✓ | ✓ | builder-run | builder-run | idle 74,5 · cuộn 51,1 · min 44,6 (dev, GPU dùng chung) | **78/100** (giám khảo) | **FAIL < 90** — các mục bắt buộc đều PASS; sửa vòng 2 |
| real-estate | ✓ (builder) | **FAIL** (judge) — orbit ra sau ở 0% đưa camera vào trong đồi ⇒ khung đen ở 180° | ✓ 3 mặt tiền | ✓ theo bộ phận | ✓ | builder-run | builder-run | judge đo: idle 44 · cuộn 38; ready 10,5 s lần đầu / 5,5 s lần sau (dev) | **67/100** (giám khảo) | **FAIL** — vi phạm mục bắt buộc "orbit"; sửa vòng 2 |
| fashion | ✓ (builder) áo phao CUMULUS 01 ~150k tam giác | PASS (judge: yawTotal −6,287) | ✓ 4 colourway (đổi vải + nền shader + rim + bóng + chữ) | ✓ | ✓ | judge | judge | judge đo: ~66 FPS | **81/100** (giám khảo) | **FAIL < 90** — mục bắt buộc đều PASS; sửa vòng 2 |
| automotive | ✓ (builder) | builder: 10/10 test | ✓ 4 màu sơn | ✓ theo bộ phận | ✓ | builder-run | builder-run | idle 65,5 · cuộn 68,8 · min 66,7 (dev) | **75/100** (giám khảo) | **FAIL < 90** — mục bắt buộc PASS nhưng "trông low-poly" do thiếu phản chiếu; sửa vòng 2 |

> "builder-run 10/10" = bộ `tests/qc` do chính builder chạy ở chế độ `QC_MODE=dev` (số FPS dev, GPU dùng chung với agent khác ⇒ KHÔNG phải số nghiệm thu). Nghiệm thu cần: chấm độc lập (Agent 05) + chạy lại trên bản build production, GPU rảnh.

## 2b. Giám khảo độc lập (Agent 05, dev server :5199, Intel HD 530, DPR 1, 1440×900, không có console error)
Báo cáo đầy đủ + 141 ảnh: `qc-evidence/judge/{fnb,automotive,real-estate}.md`, `qc-evidence/judge/shots/`. Skill nội bộ `3d-visual-qc` **đã nạp và dùng được** trong phiên.
| Demo | Điểm | Việc phải sửa hàng đầu (trích báo cáo giám khảo) |
|---|---|---|
| beauty | 78 (3D 23 · tương tác 24 · bám mẫu 16 · frontend 7 · hiệu suất 8) | (1) hover gần như không thấy và chỉ hover được thân hũ; (2) hũ mint đục như nhựa, lệch xanh lục sâu `#04381a` của A1; (3) chữ mô tả đè lên "SOOTHE", callout đè nguyên liệu ở 50% và mobile. Ready cold 17,3 s / warm 1,8–2,9 s (dev); FPS ~41 trong 3 s đầu rồi ~60 (judge đo, :5198) |
| fashion | 81 (3D 24 · tương tác 25 · bám mẫu 16 · frontend 7 · hiệu suất 9) | (1) nylon cận cảnh 75% loang như nhựa chảy; (2) đổi colourway không có chuyển cảnh trượt/dissolve, nền đổi chậm hơn áo; (3) thiếu áo kế tiếp dạng 3D ở góc dưới-phải như E2. Ready cold 11,2 s / warm 2,2 s (dev); FPS ~66 (judge đo) |
| fnb | 78 | (1) cảnh chuyển 50% bị hạt cà phê che — phóng to nĩa+mì; (2) xoắn mì ở 75% giống dải phẳng — thêm khối; (3) callout đặt sai nguyên liệu, UI mobile va chạm |
| automotive | 75 | (1) thép/kính gần như không phản chiếu ⇒ trông low-poly — thêm lightformer env + thép dị hướng; (2) thành thùng xe bên trong nâu không sáng, tấm sau "trôi" khi exploded; (3) thiếu chất liệu đất sét ở .02, bụi/bánh quay ở .01, hover chưa rõ |
| real-estate | 67 | (1) **orbit FAIL**: camera lọt vào đồi (khung đen ở 180°) — thêm va chạm camera + giới hạn yaw; (2) cọ đen/nhọn — dùng lá thật; (3) chữ đè lên mặt tiền ở 50%, rào tiền cảnh lấn 0%, "LEVEL 1" bị font số kiểu cũ đọc thành "I"; (4) hiệu năng/ready (xem bảng) |

### Vòng 2 (giám khảo chấm lại sau đợt sửa; `qc-evidence/judge/round2/`)
| Demo | Vòng 1 → vòng 2 | Mục bắt buộc | Số đo của giám khảo (dev :5199, Intel HD 530, DPR 1, 1440×900, GPU dùng chung với agent khác) | Việc còn lại hàng đầu |
|---|---|---|---|---|
| fnb | 78 → **84** | tất cả PASS | ready cold 3,0 s · idle 71–75 · cuộn 35–37 fps | nhãn ở 75% bị cà chua che/vẽ đè mì, không đọc được trên mobile; vũng sốt viền răng cưa, không bóng; kéo dọc không giới hạn (±1,2 rad) nhìn được dưới đĩa |
| automotive | 75 → **79** | tất cả PASS | ready cold 3,1 s · idle 70–75 · cuộn 43–45 fps | **vẫn "hộp/low-poly", chưa cao cấp** (giám khảo: đường đáng tin là GLB asset có giấy phép; code thuần là phương án dự phòng); tấm đuôi cháy trắng; vệt đỏ rơi xuống cát xa cản |
| real-estate | 67 → **79** | tất cả PASS (orbit đã PASS — không còn khung đen) | ready cold 4,2 s · idle 38,6 · **cuộn 27,6 fps (frame xấu nhất 160 ms)** | nhãn hover dính khi cuộn ("GLASS WALL" hiện trên hồ bơi); FPS thấp; thân cọ tiền cảnh chẻ khung |

| beauty | 78 → **89** | tất cả PASS | ready cold 9,9 s / warm 1,4–1,7 s · 54–68 fps @1440, ~50 @1920, ~67 @390 (dev :5198, Intel HD 530, DPR 1, GPU/trình duyệt dùng chung với giám khảo khác — chỉ mang tính tham khảo) | callout va chạm ở 50% (ở 1920 lát lô hội che nhãn "Aloe gel"; xoay ra sau nhãn Squalane đè viên vitamin E) — mới sửa một phần; quầng hover làm nhòe mép hũ/nắp; gốc lá bị cắt hiện ở mobile 0%; giám khảo chưa kiểm được hitch FPS sau ready và chưa kiểm khẳng định "texture nhỏ hơn" |
| fashion | 81 → **87** | tất cả PASS (repo QC 10/10 chạy lại độc lập, :5196) | ready cold 5,5 s / warm 2,6–3,9 s · 31/43/74 fps (3 lần chạy @1440), ~33 @1920, ~57 @390 (dev, GPU dùng chung — không ổn định) | chuyển cảnh colourway: vệt xám mờ lớn ở ~360 ms và dissolve vỡ thành mảng kem; áo còn giống đồ phao bơm/latex, tay áo "xúc xích" chưa có khuỷu (builder báo đã làm — giám khảo thấy chưa); FPS không ổn định |

> Chưa demo nào ≥ 90. Vòng sửa 3 đang giao cho fnb/automotive/real-estate (riêng automotive: nâng chất lượng mô hình thật sự, không tải model ngoài); beauty (89) và fashion (87) chờ slot (giới hạn 3 agent nặng) rồi sửa vòng 3.

### Vòng 3 (`qc-evidence/judge/round3/`; 220+ ảnh; mọi mục bắt buộc PASS ở cả 5 demo; không có console/page/HTTP error)
| Demo | V1 → V2 → **V3** | Lỗi hàng đầu còn lại (giám khảo) |
|---|---|---|
| beauty | 78 → 89 → **91** ✅ (đầu tiên ≥ 90; kính vẫn PARTIAL) | chỉ 3/5 nguyên liệu có nhãn ở 50% mặc định; "bóng bóng xám phẳng" trước hũ; hũ chưa đọc rõ là thủy tinh |
| fashion | 81 → 87 → **88** | wipe 250 ms đầu là hình bất định + quầng xám (không phải vòng tròn sắc), khung giữa trống ~200 ms ở 0%; rim hover ở Carbon làm mọi đường may trắng như X-quang (phải theo màu colourway); nylon còn bóng như nhựa → cần normal map crinkle tần số cao |
| fnb | 78 → 84 → **86** | vẹm/tôm/húng chưa giống đồ ăn thật; nhãn callout nhảy ~205 px khi di chuột, leader chéo nhau; Matte Black/Terracotta ở 100% ra taupe/hồng; hạt đè chữ mô tả |
| real-estate | 67 → 79 → **82** | **đèn đường cách camera ~4 m cắt giữa khung 0%** (đầu đèn thành thanh kem sáng; `Landscape.tsx`, `lampPos` x=22.5); thân cọ còn cắt mặt tiền khi orbit ở 0% và 100% góc thấp (nên mờ dần khi chắn camera); **draw call đo 99 chứ không phải 79 như builder báo**; auto-DPR có hiệu lực (1425×900 → 1140×720) |
| automotive | 75 → 79 → **80** | vẫn "hộp/low-poly"; vòm bánh trước nhìn xuyên; **hồi quy**: pitch lên ~62° làm xe tràn khung, đè thanh tiến độ (cần ≤ ~0,65 rad) |

### Vòng 6 — kết quả đã có (`qc-evidence/judge/round6/`; giám khảo dùng cổng 5197)
| Demo | V5 → **V6** | Ghi chú giám khảo |
|---|---|---|
| fnb | 89 → **90** ✅ (vừa chạm) | giám khảo đo pixel hover độc lập, khớp builder: đĩa 100% off → on — Black `#191513` → `#1e1815` · Terracotta `#bd563f` → `#c05a41` · Cream `#e3dacd` → `#e5dcce` (rim 0,35 trên Cream, thấp hơn trên men tối); ly 0% Black `#030100` → `#0d0502`; hover xóa đúng sau kéo xoay + cuộn; chạm không bao giờ để hover kẹt. **Bug mới:** sau cuộn/kéo, hover "chết" khi di chuột TRONG đĩa/ly, chỉ trở lại sau khi rời vật rồi vào lại; nguyên liệu 75% vẫn dính cụm (cà chua+tôm, cà chua+vẹm+tôm từ phía sau); leader còn cắt vật; mì vẫn crossfade giữa các section thay vì kéo dài |
| automotive | 84 → **88** | thép: pixel cháy 0,31 / 0 / 0 / 0 / 0,21% ở 5 mốc (khớp builder) nhưng còn dải trắng phẳng ở capo/cowl kể cả Graphite (cowl `#fcf7ed`); hover kính 0/80 ô chết, kính chắn gió 25,5°; **phán quyết: vẫn là low-poly kiểu tài sản game (loại tốt)**; việc đáng giá nhất: gộp capo + mặt trước thành một nêm mũi liền; 2–11 ô/mốc hover không có tên bộ phận (chết) và lần hover đầu rơi về null ở 25% |
| real-estate | 89 → **91** ✅ (26/29/17/9/10) | **chạm cảm ứng đã sửa** (iPhone 13 giả lập, CDP touch): nhãn hiện sau ~125 ms, còn ở 1,15 s, xóa ~2,13 s; chạm chỗ trống xóa; vuốt ngang xoay, vuốt dọc cuộn; không hover "ma"; draw call 55 idle · 64,7 TB khi cuộn; hết cảnh báo PCFSoft; mobile 390@0% không chạm mép. **Lỗi mới:** nhãn chạm bị cắt/ra ngoài màn hình khi chạm ở nửa phải màn hình mobile; sàn LEVEL 1 phản chiếu + rèm chưa rõ; thiếu bloom/LED ban đêm ở 100% |
| fashion | 90 → **90** (25/29/17/9/10; vừa chạm ngưỡng) | bấm 3 lần: **12/12 tổ hợp** (0/50/100% × 60/150/300/450 ms) đều tới Crimson, khớp áo/nhãn/tông chữ/bridge; spam 8 nhấp đúng; cuộn lúc đang chuyển nhất quán; khoảng trống (slow-mo ×0,06): 50% không còn, **0% còn 35–45 ms, 100% còn 20–30 ms**; áo hết giống vinyl nhưng **giờ mờ và sần như da nhàu, hết highlight ciré** (roughness .47–.52, clearcoat .18–.26 ngoài khoảng SPEC .28–.4 / .3–.6); **chữ CUMULUS bị cắt ở mobile** |

### Vòng 5 — kết quả đã có (`qc-evidence/judge/round5/`)
| Demo | V4 → **V5** | Ghi chú giám khảo |
|---|---|---|
| fnb | 89 → **89** (3D 27 · tương tác 27 · bám mẫu 17 · FE 9 · ổn định 9) | **giám khảo đo pixel độc lập, khớp số builder** (chuột ngoài canvas): ly 0% — Cream `#e4d8cb` · Black `#020100` · Terracotta `#6c1007`; đĩa 50% — `#e5dbd0` · `#16110e` · `#b64833`; đĩa 100% — `#e3dacd` · `#191614` · `#bd5740`. Nhưng **rê chuột lên đĩa làm Matte Black thành `#baa896` (taupe)** (rim hover quá mạnh, bạc cả đĩa) và trạng thái hover **kẹt sau khi kéo xoay**; ở 75% các nguyên liệu bay xuyên vào nhau |
| automotive | 83 → **84** (24 · 26 · 16 · 9 · 9) | thép **cháy trắng** (vách cabin `#fcf8ef`, ~50% pixel capo bị cháy) và kính hông là tấm xám phẳng `#454749`; hover kính = 0 ở 25–100% và kính chắn gió không phản hồi; nhận xét của orchestrator về góc ngang 0% được xác nhận; "vẫn là asset game low-poly, dù nhìn từ sau/3-4 đã ra dáng pickup"; đề xuất: một đường nêm liền mũi→mái, vách cabin nghiêng vào |
| fashion | 88 → **90** (3D 26 · Animation 28 · Bám mẫu 18 · Frontend 9 · Ổn định 9; sát ngưỡng) | chuyển cảnh kiểm từng frame (7–13 ms thời gian ảo, đồng hồ chậm ×0,06 + CDP playback): hết dissolve lần hai/rim trắng, áo bay dưới headline — **sửa thật**; nhưng áo **vẫn đọc như vinyl/cao su bơm** (chỉ tiến nhẹ); còn: hero trống ~100 ms ở 50% và áo bay chui dưới bộ chọn màu, tâm trống ~60 ms ở 0%; **bấm nhanh 3 lần chỉ đổi được 2 bước** |
| real-estate | 85 → **89** (26 · 28 · 17 · 9 · 9) | hover "ma" đã hết (kiểm 1440 và 1920, không pointer); draw call khớp builder: idle 55–66 · TB cuộn 66 · đỉnh 129; **bug cảm ứng thật**: chạm hiện nhãn rồi bị xóa sau 2 ms vì `pointerleave` của touch gọi `clearHover`; nội thất còn thiếu trần phát sáng/sàn phản chiếu/rèm; tre/cọ quá bão hòa, tre còn chạm cánh thấp góc trái |

### Vòng 4 — kết quả đã có (`qc-evidence/judge/round4/`)
| Demo | V3 → **V4** | Lỗi hàng đầu còn lại |
|---|---|---|
| beauty | 91 → **92** ✅ (đạt) | thân hũ vẫn đọc như nhựa bóng chưa ra thủy tinh; mobile 50% lát aloe bị cắt mép phải; giọt squalane đè vai hũ, hạt shea có quầng trắng khi nhìn từ sau. Đủ 5/5 nhãn, hết bọt xám, tiêu đề 2 dòng |
| fnb | 86 → **89** | **men Matte Black/Terracotta ở 100% vẫn sai màu dù builder báo đã sửa** (đo pixel đĩa: đen ra `#c0af9e` be, đất nung ra `#e2beac` hồng); nhãn "Gamberi" ở 75% chỉ vào con vẹm; sốt vẫn đỏ nhựa, râu vẹm như cái lược, đầu helix xòe. Đã xác nhận sửa thật: callout không còn chạy theo chuột, leader không cắt nhau, hạt không đè chữ, nĩa mobile gọn |
| automotive | 80 → **83** | vẫn "hộp/low-poly" dù là bản chi tiết nhất; việc đáng giá nhất: đổi silhouette (thân liền một nét mũi→mái→đuôi, hoặc GLB có giấy phép); top-view 0%: cản chạm thanh tiến độ, chữ SCROLL đè capo; thép chải ra màu be ở 50% — cần dải lightformer lớn. Đã sửa thật: mặt trước, đuôi, vách vòm bánh, tay nắm âm |
| real-estate | 82 → **85** | nhãn hover "GLASS WALL" hiện sẵn giữa hero khi chưa có sự kiện chuột (hover "ma"); nội thất 50% vẫn phẳng, không phát sáng ấm như mẫu D; cụm tre che 30–40% mặt tiền ở góc bên/sau. Đã xác nhận: đèn đường, cọ (yaw 0/90/180/270 × cao/thấp), phụ đề đã sửa; draw call đếm ở tầng GL khớp builder (idle 53 · cuộn TB 63,8 · p95 93 · đỉnh 95) |
| fashion | 88 → **88** | bấm preview: bản sao bay vào có rim trắng X-quang và ~780–860 ms dissolve lấm tấm lần hai khi trao cho mesh chính (mọi lần bấm); ở 100% đường bay xuyên qua headline; tâm khung trống ~140 ms; áo vẫn như cao su bơm. Đã xác nhận: wipe tròn sắc ngay frame đầu, rim áo chính theo màu vải, stress test đạt |

**Số FPS giám khảo đo (dev, Intel HD 530, DPR 1, 1440×900, GPU bị nhiều agent dùng chung ⇒ KHÔNG có giá trị nghiệm thu):** fnb idle 75 / cuộn 20,9 (frame xấu nhất 947 ms) · automotive 42,6 / 10,5 · beauty 47,9 / 20,1 (48,2 ngay sau ready, không khựng) · real-estate 34,4 / 8,9 (mobile DPR 2: 38,6) · fashion 37,7 / 26,2 (mobile DPR 2: 29,3). Ready cold/warm (dev): real-estate 12,2/5,6 s · fashion 7,6/3,7 s · fnb 12,8 s · automotive 4,5 s · beauty 3,4 s. **Việc bắt buộc còn lại:** đo FPS/ready trên bản build production khi máy rảnh.

### Hiệu năng BẢN PRODUCTION — đo thật trên máy rảnh (`scripts/measure-prod.mjs` → `qc-evidence/perf-production.{json,md}`)
**Điều kiện:** 04/11/2026 19:38 UTC · Chrome 156.0.8078.80 headless (kênh `chrome`) · Intel Core i5-6500T, 4 luồng, 16 GB · GPU `ANGLE (Intel HD Graphics 530, Direct3D11)` · `vite preview` của bản `vite build` · không builder/giám khảo nào chạy lúc đo · 1 lượt/ demo/ viewport · FPS = đếm `requestAnimationFrame` (idle 3 s; cuộn script 8 s quét 0→100%).
| Viewport | Demo | Cold ready | Warm ready | Idle fps | Cuộn fps | p95 frame cuộn | Frame xấu nhất | Console error |
|---|---|---|---|---|---|---|---|---|
| 1440×900 | beauty | 4,9 s | 1,2 s | 71,1 | 66,3 | 26,7 ms | 106,8 ms | 0 |
| 1440×900 | fnb | 2,3 s | 1,2 s | 75,3 | 69,7 | 26,6 ms | 53,3 ms | 0 |
| 1440×900 | real-estate | 5,8 s | 1,8 s | 69,6 | **58,6** | 26,8 ms | 66,7 ms | 0 |
| 1440×900 | fashion | 3,7 s | 1,4 s | 75,2 | 69,2 | 26,7 ms | 40,2 ms | 0 |
| 1440×900 | automotive | 2,2 s | 1,1 s | 75,1 | 70,2 | 26,6 ms | 40,0 ms | 0 |
| 390×844 (cảm ứng giả lập, DPR 2) | beauty / fnb / real-estate / fashion / automotive | 1,4 / 1,2 / 1,9 / 1,6 / 1,2 s | 1,2–1,7 s | 70,5–75,2 | 71,3–74,8 | 13,5–14,1 ms | ≤ 40,9 ms | 0 |

**Lượt đo thứ 2 — sau vòng sửa 6 (05/11/2026 02:11 UTC; cùng điều kiện, máy rảnh; `perf-production.md`; lượt 1 giữ ở `perf-production-run1.*`):** không có hồi quy.
| 1440×900 | Cold ready | Warm ready | Idle fps | Cuộn fps | p95 frame cuộn | Frame xấu nhất | Console error |
|---|---|---|---|---|---|---|---|
| beauty | 4,3 s | 1,2 s | 75,3 | 71,3 | 13,7 ms | 93,3 ms | 0 |
| fnb | 2,2 s | 1,1 s | 75,1 | 72,2 | 13,6 ms | 53,4 ms | 0 |
| real-estate | 5,6 s | 1,7 s | 75,1 | **60,1** | 27,0 ms | 79,9 ms | 0 |
| fashion | 4,1 s | 1,5 s | 74,9 | 70,7 | 26,6 ms | 40,1 ms | 0 |
| automotive | 2,3 s | 1,2 s | 75,3 | 71,6 | 13,7 ms | 53,2 ms | 0 |
Mobile giả lập (390×844, DPR 2, cùng GPU desktop): idle 70,9–75,2 · cuộn 70,4–75,1 · cold ready 1,2–1,9 s · 0 console error. (Các số FPS "dev" thấp do builder báo trước đó là do 3–4 builder chạy song song trên cùng GPU — bản production trên máy rảnh không tái hiện.)

**Kết luận đo được:** trên GPU này, bản production đạt ~58–75 fps ở desktop và khởi động lạnh 2,2–5,8 s, không có console error; mục tiêu "hướng tới 60 fps desktop" đạt (real-estate lúc cuộn 58,6 sát ngưỡng). **Giới hạn trung thực:** (a) hàng "mobile" là viewport/cảm ứng giả lập chạy trên cùng GPU desktop — **KHÔNG chứng minh được FPS trên điện thoại thật** (chưa có thiết bị thật; mục tiêu 30 fps mobile chưa kiểm); (b) 1 lượt mỗi ô, chưa có thống kê nhiều lượt; (c) frame xấu nhất 40–107 ms xuất hiện lẻ tẻ (beauty 106,8 ms cao nhất) — chưa phân tích nguyên nhân; (d) chưa đo rò rỉ bộ nhớ khi chuyển route nhiều lần (QC D) — việc còn lại.

## 3. Lỗi mở / BLOCKED
- Toàn bộ 5 demo: chưa dựng cảnh thật.
- Impeccable chưa cài; Superpowers/Skill Creator plugin cần Founder chạy `/plugin install` trong UI.
- Reference Analyst (Agent 01) chưa trả kết quả — chưa có so sánh với mẫu.
