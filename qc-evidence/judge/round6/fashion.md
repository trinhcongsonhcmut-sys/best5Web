# QC JUDGE vòng 6: `/fashion` · CUMULUS 01

Ngày 05/11/2026. Giám khảo độc lập, không viết code demo này. Đã load skill `3d-visual-qc` và áp checklist 1–8. Đã đọc MASTER_PROMPT phần VI, VII, IX, `SPEC.md`, E1/E2-analysis, PALETTES, xem `E1-contact.jpg`, `E2-contact.jpg` và báo cáo vòng 5. Chấm theo những gì thấy ở vòng này, không neo vào điểm vòng 5 (90).

## Điều kiện đo
- **Server:** dev server riêng `npx vite --port 5197 --strictPort`. Port 5198 đang bị PID 16436 (node) chiếm sẵn, không phải tiến trình của tôi nên tôi không đụng vào; 5199 là của judge kia. Đã tắt server của mình sau khi đo.
- **Trình duyệt:** Chrome riêng (thư viện Playwright 1.64, `channel: chrome`, headless, `--use-angle=d3d11`). GPU: *ANGLE Intel HD Graphics 530 D3D11*. Mỗi phép đo chạy trong một context riêng, 1440×900, DPR 1 (ảnh macro DPR 2). Không dùng trang Playwright MCP dùng chung.
- **Chuyển cảnh chậm:** init script cho `performance.now()` và timestamp rAF chạy với hệ số 0,06, cùng CDP `Animation.setPlaybackRate(0.06)`. Chụp liên tục: 143 frame ở 0% (trung bình 8,1 ms ảo/frame), 170 frame ở 50% (6,8 ms), 191 frame ở 100% (6,0 ms). Mỗi bước đều dày hơn 1 frame 60 fps. Contact sheet đủ mọi frame: `shots/fashion-sheet-tr{0,50,100}-N.jpg`; tổng quan `fashion-tr{0,50,100}-overview.jpg`; crop vùng tâm `fashion-tr0-centre-crops.jpg`, `fashion-tr50-centre-crops.jpg`.
- Script đo nằm ở scratchpad (`j6fr/fa_gen.js`, `fa_var.js`, `fa_slow.js`, `fa_macro.js`). FPS không dùng làm bằng chứng nghiệm thu (orchestrator đo bản production: 70,7 fps khi cuộn).

## Điểm: **90 / 100**, vừa chạm ngưỡng (không tăng so với vòng 5)

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **25** | Hình khối tốt hơn: vai nhỏ, cổ tay mảnh, áo rộng 28% khung (vòng 5: 33%). Nhưng vật liệu bị đẩy quá tay sang **mờ, sần như da nhàu/đất sét**. Mất hẳn highlight bóng dọc baffle kiểu ciré của E2. Thông số hiện tại roughness .47–.52, clearcoat .18–.26 nằm **ngoài khoảng SPEC** (roughness .28–.4, clearcoat .3–.6). |
| Animation & tương tác (30) | **29** | Nhấp ba lần cho đúng 3 bước ở 12/12 tổ hợp. Ở 50% vị trí hero không còn trống. Cuộn trong lúc đang chuyển vẫn nhất quán. Còn khoảng trống tâm khung 35–45 ms ở 0% và 20–30 ms ở 100%. |
| Bám tinh thần mẫu (20) | **17** | Cơ chế E2 đủ và đẹp (nền đổi, preview, áo cũ bay đi, wipe tròn). Tỷ lệ áo đã gần E2 hơn. Nhưng chất liệu giờ trái hướng E2: E2 là nylon bóng ướt có vệt sáng sắc, còn áo ta mờ và sần. |
| Thiết kế frontend (10) | **9** | Panel "Closer." ở 75% không còn đè vai (panel kết thúc x 276, áo bắt đầu khoảng x 290, sát nhưng không chạm). Mobile sạch, không tràn ngang. Trừ nhẹ: ở 0%, áo cam trên nền cam tương phản thấp, chữ CUMULUS ở 390 bị cắt. |
| Hiệu suất & ổn định (10) | **10** | 0 console error / pageerror / HTTP ≥ 400 / requestfailed ở 3 viewport và mọi bài stress. Chỉ có warning deprecation `THREE.Clock`. Spam 8 nhấp kết thúc sạch. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `fashion-orb{0,50,100}-sheet.jpg` (6 góc mỗi mốc, kể cả nhìn từ trên vào lòng cổ áo) |
| Orbit 360° | **PASS** | q = 271 px/90°. `yawTotal` sau 4 lần kéo: 0% −6,287; 50% −12,570; 100% −18,854 (cộng dồn). Pitch ±1,20. Reset về đúng [0,22; −0,34; 7,0], [−0,46; 0,5; 4,95], [1,2; −0,55; 5,55]. |
| Đổi màu/vật liệu | **PASS** | Chip DOM: ember `#ec6a17` r .48 cc .22; carbon `#262523` r .47 cc .26; glacier `#c3c9ce` r .52 cc .18; crimson `#b3080c` r .48 cc .24. Ảnh: `fashion-var0-sheet.jpg` |
| Hover có phản hồi | **PASS** | `jacket` = 1,00, rim 1,5 ở cả 4 màu; rời chuột về null/0. Preview: `next` = 1,00, cursor = pointer. Diff ảnh vùng áo (mean abs/255): 9,0 / 7,3 / 10,9 / 9,6, **thấp hơn vòng 5** (5,9–18) nhưng vẫn thấy được. Ảnh: `fashion-hov-sheet.jpg` |
| Scroll mượt, khôi phục được | **PASS** | 5 mốc xuôi và ngược cho camera lệch 0,000. Nhảy 1 → 0,3 hội tụ trong khoảng 520 ms, không vọt quá. Wheel 15×900 xuống, 12×900 lên trả về s = 0 và camera đúng gốc. Ảnh: `fashion-scroll-sheet.jpg` |
| Không trắng/crash; không dùng ảnh thay 3D | **PASS** | 0 lỗi |

## Kiểm các điểm builder tuyên bố

| Tuyên bố | Kết luận | Bằng chứng |
|---|---|---|
| 3 lần nhấp nhanh lên preview = đúng 3 colourway; áo, nhãn, tông chữ và index bridge khớp nhau | **ĐÚNG** | Ở 0/50/100%, khoảng cách giữa các nhấp 60, 150, 300, 450 ms: **12/12** lần kết thúc ở index 3 (Crimson). Màu `primary` = `#b3080c`, nhãn "Crimson Red", `data-tone=light`, bridge `variant.index` = 3. Theo dõi 60 ms/mẫu: không lần nào lùi bước. Ổn định sau khoảng 0,5–1,5 s kể từ lần nhấp cuối. Spam 8 nhấp (40 ms) quay về đúng ember (8 mod 4 = 0). Ảnh: `fashion-triple-{0,50,100}.jpg`, `fashion-stress-sheet.jpg`. Lưu ý: trong lúc chuyển, tông chữ trễ hơn nhãn khoảng 0,1–0,25 s (ví dụ "Crimson Red" mà tông vẫn `dark` của glacier). Đây là chủ đích (tông đổi khi wipe đạt 45%) và không tính lỗi. |
| Ở 50%, áo cũ ở lại lâu hơn và áo mới bay vòng qua phía trên picker | **ĐÚNG** | `fashion-tr50-centre-crops.jpg`: từ 236 đến 292 ms áo cũ tan dần **ngay tại vị trí hero** trong khi áo mới đã chồng lên mép phải. Từ 299 ms áo mới phủ vị trí hero. Không có frame nào hero trống, và áo bay không chui dưới picker. Còn thấy dáng nhìn nghiêng (như ống) khoảng 290–320 ms, ở mức chấp nhận được. |
| Ở 0% có thể còn khe nhỏ | **ĐÚNG, khe đã ngắn hơn** | `fashion-tr0-centre-crops.jpg`: ở 291 ms áo cũ chỉ còn mảnh vụn bay lên-trái, mép trái áo mới ở khoảng x 820, nên tâm hero (khoảng 663, 430) trống từ khoảng 291 đến 326 ms, **khoảng 35–45 ms (2–3 frame)**. Vòng 5 là khoảng 60 ms. Ở 100% khe tương tự khoảng 20–30 ms (`fashion-tr100-overview.jpg`, frame 052–056). |
| Rework áo: nếp nhăn hình học, vai nhỏ, cổ tay mảnh, nhám hơn | **ĐÚNG về hình, nhưng tạo ra lỗi chất liệu mới** | `fashion-macro-hero-sheet.jpg` so với `fashion-E2-jacket-crops.jpg`. Vai, cổ tay và gấu đã đúng tỷ lệ hơn. Nhưng bề mặt giờ lổn nhổn đều khắp như vết búa gõ, và không còn highlight phản chiếu dài. Carbon đọc như da thuộc nhàu; ember và crimson như đất sét/cao su mờ. |

## Câu hỏi then chốt: puffer bóng sắc nét, hay vẫn là vinyl/cao su bơm?
**Không còn là vinyl/cao su bơm bóng nữa, nhưng cũng chưa phải puffer ciré bóng.** Builder đã sửa lố sang phía ngược lại.
- E2 (`E2-contact.jpg`): mặt vải trơn, căng, với **vệt sáng trắng sắc chạy dọc mỗi baffle** và phản chiếu mạnh ở cam/đỏ.
- Áo ta: mờ (roughness .47–.52), sần đều khắp mặt (noise biên độ lớn, tần số thấp), chỉ có sheen mềm.
- Ở khoảng cách hero, glacier gần puffer nhất (`fashion-var0-sheet.jpg`). Carbon giống áo da; ember/crimson giống đất nặn.
- Ở macro 75% (`fashion-fwd-75.jpg`), bề mặt như vỏ cam/da sần, không phải nylon.

## Bảng lỗi vòng 5

| # | Lỗi vòng 5 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Chất liệu/hình khối như cao su/vinyl bơm | **PARTIALLY**: hình khối đã sửa, chất liệu chuyển thành lỗi khác (mờ, sần, hết bóng) | `fashion-macro-hero-sheet.jpg`, `fashion-fwd-75.jpg`, `fashion-orb100-sheet.jpg` |
| 2 | Hero trống khoảng 100 ms ở 50%, áo bay chui dưới picker | **FIXED** | `fashion-tr50-centre-crops.jpg` |
| 3 | Tâm khung trống khoảng 60 ms ở 0% | **PARTIALLY** (còn 35–45 ms; builder đã báo trước) | `fashion-tr0-centre-crops.jpg` frame 025–028 |
| 4 | Nhấp ba lần chỉ ăn hai | **FIXED** | 12/12 tổ hợp đúng, `fa_var.json` |
| 5 | Panel "Closer." đè vai ở 75%; preview đè cổ tay ở 50% | **FIXED** (sát nhưng không chạm) | `fashion-fwd-75.jpg`, `fashion-fwd-50.jpg` |
| 6a | Áo quá to (33%) | **FIXED** (khoảng 28%, camera z 6,2 → 7,0) | `fashion-fwd-0.jpg`: x 460–866 / 1440 |
| 6b | Bridge giữ hover `next` = 1 suốt chuyến bay | **FIXED** (`bind.onPointerOut()` khi swap bắt đầu) | trace `fa_var.json` |

## Lỗi mới / còn mở (xếp theo mức nghiêm trọng)

**1. Vật liệu shell mờ và sần, mất highlight ciré: lệch SPEC và lệch E2** (mọi mốc, mọi màu; rõ nhất ở 0% hero, 75% macro, 100%)
- **Bằng chứng:** `fashion-macro-hero-sheet.jpg` đặt cạnh `fashion-E2-jacket-crops.jpg`; `fashion-fwd-75.jpg`; `fashion-orb100-sheet.jpg` (100% front/high nhìn như vỏ cam). Readout: roughness .47–.52, clearcoat .18–.26.
- **Sửa (`palette.ts`, `materials.ts`, `geometry.ts`):**
  - Trả về khoảng SPEC: roughness .30–.36 (glacier .40), clearcoat .45–.6, clearcoatRoughness .18–.22.
  - Giảm biên độ nếp nhăn hình học khoảng 50%, chỉ giữ ở dải ±25% quanh đường may baffle (mask theo khoảng cách tới rãnh). Mặt giữa baffle phải căng và trơn để highlight kéo thành vệt dài.
  - Normal map crinkle: tăng tần số khoảng 2× và giảm cường độ khoảng 0,15 để vi nhăn chỉ bẻ highlight chứ không làm đục.
  - Giữ Lightformer dải đứng (`intensity` 2,2 → 3) để tạo vệt sáng dọc như E2.
  - Mục tiêu: ở 0%, mỗi baffle cam/đỏ có 1 vệt sáng gần trắng dài ≥ 40% bề ngang baffle.

**2. Tâm khung còn trống 35–45 ms ở 0% và 20–30 ms ở 100%** (1440×900, nhấp preview)
- **Bằng chứng:** `fashion-tr0-centre-crops.jpg` frame 025-291ms → 028-326ms; `fashion-tr100-overview.jpg` frame 052–056.
- **Sửa:** ở chế độ fly ngoài khoảng mid-scroll, kéo dissolve-out của áo cũ thêm khoảng 0,05 swap (giữ phần thân giữa còn ít nhất 30% mật độ tới khi áo mới vào khoảng 0,1 H của hero), hoặc dời `FLY_START` 0,06 → 0,03.

**3. Phản hồi hover yếu hơn vòng 5** (diff vùng áo 7,3–10,9 so với 5,9–18 trước đó; carbon 7,3)
- **Bằng chứng:** `fashion-hov-sheet.jpg`.
- **Sửa:** khi bề mặt bóng trở lại theo lỗi #1, rim 1,5 sẽ đọc rõ hơn. Nếu không, nâng `uRim` của carbon lên 2,0.

**4. Nhỏ**
- Ở 0%, áo ember trên nền ember tương phản thấp (`fashion-fwd-0.jpg`). Đây là đặc tính E2, nhưng có thể tăng `bgOut`-vignette hoặc bóng blob .45 → .55 để tách áo.
- Ở 390, chữ nền "CUMULUS" bị cắt hai đầu (`fashion-390-sheet.jpg`), đọc như lỗi. Nên co theo viewport hoặc ẩn ở portrait.
- Dáng nhìn nghiêng như ống khi bay ở 50% (khoảng 290–320 ms). Nên slerp sớm hơn (`sqrt(k)*1.15` → `sqrt(k)*1.5`).

## Độ giống mẫu
- **E2:** khoảng 82% (vòng 5 khoảng 84%).
  - Bố cục, nền 4 màu, preview góc phải dưới, áo cũ bay lên-trái, áo mới bung từ preview, wipe tròn và nhấp liên tục đều tốt và nay ổn định tuyệt đối.
  - Tỷ lệ áo gần E2 hơn.
  - Nhưng E2 là áo bóng ướt có vệt sáng sắc, còn áo ta mờ và sần, nên mất điểm giống chất liệu.
- **E1:** đúng mức SPEC yêu cầu (thanh ray và hai áo treo mờ ở 0%).

## Có đạt ≥ 90 không? Sửa tối thiểu
**Vừa đạt 90, ở mức biên. Lý do khác vòng 5:** animation và tương tác giờ gần hoàn hảo (+1), nhưng 3D và mức bám mẫu mất điểm vì vật liệu lệch SPEC. Muốn chắc chắn trên 90:
1. Lỗi #1: trả shell về ciré bóng, giảm nếp sần (+2 3D, +1 bám mẫu). Đây là việc quan trọng nhất.
2. Lỗi #2: xóa khe 35–45 ms ở 0% (+0,5).
3. Lỗi #4: xử lý chữ CUMULUS ở mobile (+0,5 frontend).
