# QC JUDGE vòng 5: `/fashion` · CUMULUS 01

Ngày 05/11/2026. Giám khảo độc lập, không viết code demo này. Đã load skill `3d-visual-qc` và áp checklist 1–8. Đã đọc MASTER_PROMPT phần VI, VII, IX, `SPEC.md`, E1/E2-analysis, PALETTES, xem `E1-contact.jpg`, `E2-contact.jpg` và báo cáo vòng 4. Điểm chấm theo những gì thấy ở vòng này, không neo vào điểm vòng 4 (88).

## Điều kiện đo
- **Server:** dev server riêng `npx vite --port 5197 --strictPort`. Port 5198 đang bị PID 16436 (node) chiếm sẵn, không phải tiến trình của tôi nên tôi không đụng vào. Đã tắt server của mình sau khi đo.
- **Trình duyệt:** Chrome qua Playwright MCP. Mỗi phép đo chạy trong một `browser.newContext()` riêng, viewport 1440×900, DPR 1, trừ khi ghi khác.
- **Bắt từng frame chuyển cảnh:** dùng init script cho `performance.now()` và timestamp rAF chạy với hệ số 0,06, đồng thời đặt `Animation.setPlaybackRate(0.06)` qua CDP để transition CSS cũng chậm theo. Chuyển cảnh 1,0 s kéo ra khoảng 17 s thực. Tôi chụp liên tục, **cứ 7–13 ms thời gian ảo được một ảnh**, dày hơn một frame 60 fps (16,7 ms). Logic demo không bị sửa, chỉ đồng hồ chậm lại.
  - Đã chụp 127 frame ở mốc 0%, 95 frame ở 50%, 110 frame ở 100%.
  - Lưu lại khoảng 1/3 số frame cùng các frame được dẫn trong báo cáo: `shots/fashion-tr{0,50,100}-NNN-<ms ảo>.jpg`.
  - Contact sheet đủ mọi frame: `shots/fashion-sheet-tr{0,50,100}-{0..4}.jpg`.
- **Ảnh khác:** `qc-evidence/judge/round5/shots/fashion-*.jpg`. Các contact sheet nhóm: `fashion-orb0-sheet.jpg`, `fashion-orb50-sheet.jpg`, `fashion-orb100-sheet.jpg`, `fashion-var-sheet.jpg`, `fashion-hov-sheet.jpg`, `fashion-stress-sheet.jpg`, `fashion-1920-sheet.jpg`, `fashion-390-sheet.jpg`.
- **Ghi chú về tải máy:** lần chạy đầu bị lệch số do máy đang tải nặng (judge kia chạy song song, FPS tụt). Tôi đã chạy lại với thời gian chờ thích ứng (đợi camera đứng yên). Kết quả trong báo cáo lấy từ lần chạy lại. FPS không dùng làm bằng chứng nghiệm thu.

## Điểm: **90 / 100**, vừa chạm ngưỡng

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **26** | So với vòng 4, baffle phẳng hơn chút, đường may ép sắc hơn, gấu bo gân rõ, glacier đẹp gần E2. Nhưng tổng thể **vẫn đọc như vinyl/cao su bơm**: vai tròn phồng, ống tay như phao, cổ tay dày như vòng cao su, highlight ướt dạng nhựa. |
| Animation & tương tác (30) | **28** | Đã hết dissolve lần hai và rim trắng khi bay. Đường bay ở 100% đi dưới headline, chữ mờ đi khi áo bay qua. Còn trừ: tâm khung trống khoảng 60 ms ở 0%; ở 50% vị trí hero trống khoảng 100 ms và áo bay chui dưới bộ chọn màu DOM; nhấp ba lần chỉ ăn hai. |
| Bám tinh thần mẫu (20) | **18** | Cơ chế E2 đủ: nền 4 màu đo sát, preview góc phải dưới, áo cũ bay lên-trái, áo mới bung ra từ preview, wipe tròn. Lệch: áo rộng khoảng 33% khung (E2 khoảng 23%); chất liệu bóng nhựa hơn render E2. |
| Thiết kế frontend (10) | **9** | "WEATHER." cách thước khoảng 64 px ở 1920, đã đạt. Mobile sạch. Trừ nhẹ: panel "Closer." đè vai áo ở 75%; preview đè cổ tay áo ở 50%. |
| Hiệu suất & ổn định (10) | **9** | 0 console error / pageerror / HTTP ≥ 400 trên 3 viewport, chỉ có warning deprecation `THREE.Clock`. Stress (nhấp ba lần, cuộn khi đang chuyển, spam API) đều kết thúc sạch. FPS lấy theo số đo của orchestrator. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `fashion-orb100-low.jpg` (nhìn từ trên vào lòng cổ áo), `fashion-orb0-high.jpg` |
| Orbit 360° | **PASS**: q = 271 px/90°. 4 lần kéo cho `yawTotal` lần lượt −6,287, −12,570, −18,854 (cộng dồn) ở 0, 50 và 100%. Pitch ±1,20. Reset trả camera đúng về [0,22; −0,32; 6,2], [−0,6; 0,5; 4,95], [1,2; −0,55; 5,55]. | `fashion-orb{0,50,100}-{right,back,left,high,low}.jpg` |
| Đổi màu/vật liệu | **PASS** (bấm chip DOM ở 0, 50 và 100%) | carbon `#262523` r .42 cc .26, glacier `#c3c9ce` r .50 cc .18, crimson `#b3080c` r .44 cc .24, ember `#ec6a17` r .44 cc .22. Giống nhau ở cả 3 mốc. Ảnh: `fashion-var{0,50,100}-{0..3}.jpg` |
| Hover có phản hồi | **PASS** | Áo: `jacket` = 1,00, rim 1,5 ở cả 4 màu. Preview: `next` = 1,00. Rời chuột về null/0. Diff ảnh vùng áo hover so với không hover: ember 14,0, carbon 5,9, glacier 18,0, crimson 14,5 (mean abs/255). Ảnh: `fashion-hov-{0..3}.jpg`, `fashion-hov-next.jpg` |
| Scroll mượt, khôi phục được | **PASS** | 5 mốc xuôi và ngược cho camera giống hệt. Nhảy 1 → 0,3 hội tụ trong khoảng 400 ms, không vọt quá. Wheel giật 15×900 xuống rồi 10×900 lên trả về đúng 0. Ảnh: `fashion-fwd-*.jpg`, `fashion-back-*.jpg`, `fashion-wheel-settled.jpg` |
| Không trắng/crash; không dùng ảnh thay 3D | **PASS** | 0 lỗi |

## Kiểm các điểm builder tuyên bố

| Tuyên bố | Kết luận | Bằng chứng |
|---|---|---|
| Bản sao bay dùng cùng shell material, tắt rim khi bay, trao cho mesh chính trong 1 frame, không còn dissolve lần hai ở 780–860 ms | **ĐÚNG** | Ở 0%: áo carbon bay không có viền trắng (`fashion-tr0-037-306ms.jpg`). Lúc đáp (632 → 643 ms) không đổi hình (`tr0-076-632ms`, `tr0-077-643ms`). Ở 780–860 ms không còn lấm tấm (`fashion-sheet-tr0-3.jpg`, `tr0-095-824ms`). Ở 100% tương tự (`fashion-sheet-tr100-2.jpg`, `tr100-078-823ms`); ở 50% cũng vậy (`fashion-sheet-tr50-2.jpg`). Lưu ý: bridge vẫn báo `hover next = 1,0` suốt chuyến bay, nhưng trên ảnh không thấy rim. |
| Đường bay cong xuống dưới headline, chữ mờ khi áo bay qua (100%) | **ĐÚNG** | `fashion-tr100-031-313ms.jpg`: áo đi dưới "WEATHER.", chữ mờ khoảng .22. Lớp `.fx.dim` bật từ khoảng 96 ms đến khoảng 630 ms. |
| Hai áo chồng pha, tâm khung không bao giờ trống | **PHẦN LỚN ĐÚNG** | Ở 0%, khung luôn có áo, nhưng tại 280–340 ms áo cũ chỉ còn mảnh vụn còn áo mới ở x 815–1125, nên điểm tâm (720, 450) trống khoảng 60 ms, tức 3–4 frame (`fashion-tr0-034-285ms.jpg`, `tr0-037-306ms.jpg`). Ở 50%, khoảng 300–380 ms vị trí hero hoàn toàn trống, chỉ còn áo đang bay nhìn ngang ở góc phải dưới (`fashion-tr50-023-303ms.jpg`, `tr50-026-340ms.jpg`). |
| Rework áo: baffle phẳng, vai thấp, đường ép sắc, base nhám hơn, sheen mềm, gấu/cổ tay gân mảnh hơn, bartack | **MỘT PHẦN** | So `round4/shots/fashion-fwd-0.jpg` với `round5/shots/fashion-fwd-0.jpg`: baffle bớt tròn, khe ép hẹp và sắc hơn, gấu gân rõ, highlight vỡ hơn. Nhưng vai vẫn là khối cầu phồng, cổ tay vẫn là vòng dày lộ lòng đen (`fashion-hov-2.jpg`), nhìn từ trên thì tay áo như phao bơm (`fashion-orb100-low.jpg`). Bartack quá nhỏ, không thấy ở khoảng cách hero. |
| Chữ mờ khi orbit | **ĐÚNG** | `dim` = true giữa lúc kéo và sau khi thả ở cả 3 mốc (`fashion-orb{0,50,100}-dragging.jpg`, `orb100-back.jpg`) |
| Rim glacier .5 | **ĐÚNG, thấy được nhưng nhẹ** | `fashion-hov-2.jpg`: viền sáng mảnh ở mép tay và thân. Diff 18,0. |
| Khoảng cách "WEATHER." với thước ở 1920 đã nới | **ĐÚNG** (tôi đo lại) | "WEATHER." kết thúc ở x = 1755, vạch thước dài nhất bắt đầu ở x ≈ 1819, nên hở khoảng 64 px (vòng 4 là 25 px). Ở 1440: 1264 so với khoảng 1340, hở khoảng 76 px. Ảnh: `fashion-1920x1080-100.jpg` |

## Bảng lỗi vòng 4

| # | Lỗi vòng 4 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Bản sao bay mang rim trắng, dissolve lần hai khi trao | **FIXED** | `fashion-tr0-037-306ms.jpg`, `fashion-sheet-tr0-3.jpg`, `fashion-sheet-tr100-2.jpg` |
| 2 | 100%: đường bay xuyên headline | **FIXED** | `fashion-tr100-031-313ms.jpg` |
| 3 | Tâm khung trống khoảng 140 ms | **PARTIAL** | 0%: còn khoảng 60 ms (`tr0-034-285ms`). 50%: hero trống khoảng 100 ms (`tr50-026-340ms`) |
| 4 | Orbit ở 50/100 đẩy áo xuống dưới headline | **FIXED (giảm nhẹ bằng làm mờ chữ)** | `fashion-orb100-back.jpg`, `orb50-dragging.jpg`: chữ mờ .22, không còn tranh chấp |
| 5 | Áo tổng thể như cao su bơm | **PARTIAL** | Có cải thiện nhỏ (`fashion-fwd-0.jpg` so với round4), vẫn đọc như vinyl (`fashion-fwd-75.jpg`, `orb100-low.jpg`) |
| 6 | 1920@100: "WEATHER." cách thước 25 px | **FIXED** | 64 px, `fashion-1920x1080-100.jpg` |
| 7a | Preview 100% nhìn ngang như ống | **FIXED** | Preview luôn quay 3/4 (`fashion-fwd-100.jpg`, `1920x1080-100.jpg`) |
| 7b | Hover glacier gần như vô hình | **FIXED (nhẹ)** | `fashion-hov-2.jpg` |
| N1b (v2) | Mép dissolve màu kem | **FIXED / không còn thấy** | `fashion-sheet-tr0-0.jpg` (157–251 ms): mép mảnh cùng tông cam |

## Lỗi mới / còn mở (xếp theo mức nghiêm trọng)

**1. Chất liệu và hình khối áo vẫn đọc như cao su/vinyl bơm** (mọi mốc, rõ nhất ở 75% macro và góc nhìn từ trên)
- **Bằng chứng:** `fashion-fwd-75.jpg` (gối baffle tròn trơn, highlight ướt kiểu da bóng), `fashion-orb100-low.jpg` (tay áo như phao), `fashion-hov-2.jpg` (cổ tay là vòng dày lộ lòng đen), `fashion-fwd-0.jpg` (vai phồng hình cầu). Đối chiếu `E2-contact.jpg`: áo E2 có baffle đầy nhưng mặt vải có nếp nhăn vi mô ngẫu nhiên, mép baffle gãy sắc, vai rủ theo đường may raglan, highlight vỡ thành mảng nhỏ.
- **Sửa:**
  - Vai: giảm bán kính phồng phần vai/đầu tay thêm 25–30% và cho độ phồng baffle đầu tay = 0,6 lần thân.
  - Thêm noise nếp nhăn hướng ngang **vào hình học**, không chỉ normal map: biên độ khoảng 0,004–0,006 m, tần số khoảng 18/m, tập trung gần đường may (mask `1 − smoothstep(0, .35, khoảngCáchĐếnRãnh)`), để silhouette không còn trơn tru.
  - Cổ tay và gấu: thu bán kính miệng tay khoảng 30%, độ dày viền gân ≤ 1,2 cm, lòng tay tối nhưng có vải lót (màu shell × .35) thay vì đen đặc.
  - Vật liệu: `clearcoatRoughness` .25 → .35, `roughness` thân .42 → .48, giữ `sheen` .5 / `sheenRoughness` .35. Riêng carbon cần thêm anisotropy nhẹ (`anisotropy` .3 dọc baffle) để highlight thành sọc vải chứ không thành mảng da bóng.

**2. Ở 50%, vị trí hero trống khoảng 100 ms; áo đang bay nhìn ngang và chui dưới bộ chọn màu DOM** (50%, 1440×900, bấm "Next" hoặc preview)
- **Bằng chứng:** `fashion-tr50-023-303ms.jpg`, `fashion-tr50-026-340ms.jpg`: áo carbon nằm ở x 1010–1230, y 495–880, ngay dưới nhãn "Carbon Black", các chip và nút NEXT, và trông như một thùng tròn khi nhìn ngang.
- **Sửa:**
  - Ở các mốc mà preview nằm sát bộ chọn (0,4 < p < 0,55), khởi hành chuyến bay từ điểm lệch lên trên preview khoảng 0,12 NDC theo trục y.
  - Hoặc kéo dissolve-out của áo cũ dài tới `swap` .40, để áo cũ còn ở vị trí hero cho tới khi áo mới vào nửa khung.
  - Slerp xoay của bản sao bắt đầu từ `heroRotY` của preview (3/4 mặt trước) chứ không đi qua góc nhìn ngang 90°.

**3. Tâm khung trống khoảng 60 ms ở 0%** (`fashion-tr0-034-285ms.jpg`, `tr0-037-306ms.jpg`)
- **Sửa:** dời `FLY_START` .10 → .06, hoặc dời mốc dissolve-out xong của áo cũ từ khoảng .30 sang .36.

**4. Nhấp nhanh ba lần lên preview chỉ đổi hai bước** (ember → glacier, không tới crimson: `fashion-stress-triple-final.jpg`). Lý do: preview đã bay đi nên lần nhấp thứ ba rơi vào khoảng trống.
- **Sửa:** khi `world.swap < 1`, đặt một hitbox vô hình cố định ở vị trí preview, hoặc đệm click (tăng `pendingSteps`) để mỗi lần nhấp đều được tính. Chuẩn E2 là người dùng bấm liên tục.

**5. Panel "Closer." ở 75% đè vai trái; preview ở 50% đè cổ tay phải** (`fashion-fwd-75.jpg`: panel 63–275 × 118–395 phủ lên vai; `fashion-fwd-50.jpg`: preview 1255–1385 chạm cổ tay ở x ≈ 1280)
- **Sửa:**
  - Ở 75%, dời target camera sang trái khoảng 0,12, hoặc đặt panel ở cạnh dưới trái.
  - Ở 50%, giảm `heroPos.x` khoảng 0,1, hoặc dời preview theo y xuống −0,5 NDC.

**6. Nhỏ**
- Áo vẫn to: rộng khoảng 33% khung ở 1440 (x 415–885), trong khi E2 khoảng 23%. Sửa: scale hero .85 ở mốc 0%.
- Bridge giữ `hover.id = "next"`, value 1,0 suốt chuyến bay dù uniform rim = 0. Sửa: reset hover state của preview khi `swap < 1`, để QC tự động không hiểu sai.

## Độ giống mẫu
- **E2:** khoảng 84%.
  - Bố cục và nhịp chuyển màu đúng tinh thần: nền bão hòa 4 màu đo sát, preview 3D góc phải dưới, áo cũ bay lên-trái và tan, áo mới bung từ preview, chữ đổi tông.
  - Chuyển cảnh nay sạch, không còn lỗi trao bản sao.
  - Lệch còn lại: áo to và gần tâm hơn E2; chất liệu kiểu vinyl bơm, trong khi E2 là nylon ciré có nếp nhăn vi mô.
- **E1:** mượn đúng mức SPEC yêu cầu (thanh ray và hai áo treo mờ ở 0%).
- **Câu hỏi then chốt: áo đọc như puffer bóng sắc nét hay vẫn như cao su/latex bơm?** Trả lời thẳng: **vẫn nghiêng về cao su/vinyl bơm**.
  - Glacier (`fashion-var0-2.jpg`) và crimson (`fashion-var0-3.jpg`) ở khoảng cách hero là gần puffer nhất.
  - Ember, carbon và mọi góc cận hoặc từ trên vẫn đọc như đồ bơm hơi bóng.
  - Đã tiến bộ so với vòng 4 nhưng chưa tới mức render E2.

## Có đạt ≥ 90 không? Sửa tối thiểu
**Vừa đạt (90), ở mức biên.** Điểm này dựa trên việc toàn bộ lỗi chuyển cảnh nặng của vòng 4 đã được sửa và kiểm chứng từng frame. Muốn chắc chắn trên 90 và để Founder không bác vì chất liệu:
1. Lỗi #1, làm lại vai/cổ tay và thêm nếp nhăn hình học (+2 điểm 3D). Đây là việc quan trọng nhất.
2. Lỗi #2 và #3, giữ áo cũ lâu hơn và đổi điểm khởi hành ở 50% (+1 Animation).
3. Lỗi #4, đệm click khi nhấp nhanh (+0,5).
