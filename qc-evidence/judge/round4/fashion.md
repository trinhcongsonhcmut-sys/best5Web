# QC JUDGE vòng 4: `/fashion` · CUMULUS 01

Ngày 05/11/2026. Giám khảo độc lập, không viết code demo này. Đã load skill `3d-visual-qc` và áp checklist 1–8. Điểm chấm theo những gì thấy ở vòng này, không neo vào điểm vòng 3 (88).

## Điều kiện đo
- **Server:** dev server riêng `npx vite --port 5197 --strictPort`. Port 5198 đã bị PID 16436 chiếm từ trước, không phải tiến trình của tôi.
- **Trình duyệt:** Chrome qua Playwright MCP, mỗi phép đo trong một browser context riêng.
- **Cách bắt từng frame chuyển cảnh:** một init script nhân thời gian `performance.now()` và timestamp rAF với hệ số 0,05–0,06. Nhờ đó chuyển cảnh 1,0 s kéo dài ra khoảng 17–20 s thực, và tôi chụp được khoảng 125 frame, mỗi frame cách nhau khoảng 9 ms thời gian ảo, tức từng frame một. Logic demo không bị thay đổi, chỉ đồng hồ chậm lại.
- **Ảnh:** `qc-evidence/judge/round4/shots/fashion-*.jpg`. Chuỗi chuyển cảnh lưu dạng `fashion-tr{0,50,100}-NN-<ms ảo>.jpg`; đã bỏ bớt, giữ khoảng 1/4 frame cùng các frame được dẫn trong báo cáo.
- **FPS:** không dùng làm bằng chứng. Orchestrator đã đo bản production: 58–75 fps.

## Điểm: **88 / 100**, chưa đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **26** | Macro 75% có crinkle rõ, highlight đã vỡ vệt nhỏ; rim hover trên áo chính đã nhuộm theo màu vải. Còn trừ: tổng thể vẫn đọc như vinyl/cao su bơm (vai tròn kiểu "Michelin"); mép mảnh dissolve trên ember vẫn trắng kem. |
| Animation & tương tác (30) | **27** | Wipe tròn sắc ngay từ frame đầu, nhấp 3 lần, cuộn khi đang chuyển và spam API đều ổn. Bị trừ vì **mỗi lần bấm preview, bản sao bay vào mang rim trắng kiểu X-quang trong khoảng 350 ms, rồi ở khoảng 780–860 ms lại "lấm tấm" dissolve lần hai khi trao cho mesh chính**. Ngoài ra, ở 100% bản sao bay xuyên qua headline. |
| Bám tinh thần mẫu (20) | **18** | Nền 4 màu, preview 3D góc phải dưới, áo cũ bay lên-trái, áo mới bung ra từ preview: đúng E2. Lệch: áo vẫn to (khoảng 32% chiều rộng, E2 khoảng 23%); chất liệu bóng nhựa hơn render của E2. |
| Thiết kế frontend (10) | **9** | Mobile sạch ở cả 5 mốc; nhãn colourway đổi đúng lúc. Trừ nhẹ: ở 1920, "WEATHER." chỉ cách thước 25 px; orbit ở 50% và 100% đẩy áo vào dưới headline. |
| Hiệu suất & ổn định (10) | **8** | 0 lỗi console, pageerror hoặc HTTP ≥ 400 trên 3 viewport. FPS theo số của orchestrator. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `fashion-orb0-high.jpg` (nhìn từ trên vào lòng cổ áo), `fashion-orb50-low.jpg` |
| Orbit 360° | **PASS**: kéo 4×271 px cho `yawTotal` 6,287 / 12,57 / 18,85 ở 0 / 50 / 100%; pitch ±1,2. Reset trả camera đúng về [0,22; −0,32; 6,2], [−0,6; 0,5; 4,95], [1,2; −0,55; 5,55]. | `fashion-orb{0,50,100}-{right,back,left,high,low}.jpg` |
| Đổi màu/vật liệu | **PASS** | `#ec6a17` r .40 cc .28 → `#262523` r .38 cc .40 → `#c3c9ce` r .46 cc .24 → `#b3080c` r .42 cc .30. Ảnh: `fashion-var-0..3.jpg` |
| Hover có phản hồi | **PASS**: hover áo cho `jacket` = 1,0, uniform rim 1,5, màu rim nhuộm theo vải; rời chuột về 0. Hover preview cho `next` = 1,0. | `fashion-hov-0..3.jpg` so với `fashion-var-0..3.jpg` |
| Scroll mượt và khôi phục | **PASS**: 5 mốc xuôi và ngược khớp nhau (camera giống hệt, FOV lệch ≤ 0,005°). Wheel giật trả về đúng 0. | `fashion-fwd-*.jpg`, `fashion-back-*.jpg`, `fashion-wheel-jitter-settled.jpg` |
| Không trắng/crash; không dùng ảnh thay 3D | **PASS** | 0 lỗi |

## Kiểm các điểm builder tuyên bố

| Tuyên bố | Kết luận | Bằng chứng |
|---|---|---|
| Wipe tròn sắc từ preview, viền khoảng 1 px, không quầng xám | **ĐÚNG** | Wipe là hình tròn hoàn chỉnh, tâm ở preview, ngay từ frame đầu tiên nhìn thấy (155 ms): `fashion-tr0-16-155ms.jpg`, `tr0-18-173ms.jpg`. Phóng ×6 (`tr0-21-199ms`, `tr0-35-325ms`) thấy viền rộng 1–2 px, gồm một vệt sáng mảnh và một vệt tối mảnh, không có quầng mờ. |
| Áo mới xuất hiện khi áo cũ còn đang tan, không có khung giữa trống | **PHẦN LỚN ĐÚNG** | Ở 199–257 ms cả hai cùng hiện (`tr0-21`, `tr0-28-257ms`), nên khung hình không lúc nào trống. Tuy vậy, **vùng tâm** trống khoảng 140 ms (khoảng 290–430 ms) vì bản sao vẫn đang ở góc phải dưới: `fashion-tr0-35-325ms.jpg`. |
| Rim hover chỉ trên silhouette, nhuộm theo vải (.8 / .45 / .35) | **ĐÚNG trên áo chính, SAI trên bản sao bay** | Áo chính: `fashion-hov-1.jpg` (carbon) có rim nâu-xám mờ, không còn X-quang; glacier gần như không thấy (`fashion-hov-2.jpg`). Bản sao preview dùng `world.cur.rim` (palette: carbon `#d8d2c8`, glacier `#ffffff`) chứ không dùng `RIM_K`, nên khi bấm preview nó bay vào với viền trắng/hồng toàn thân: `tr0-70` (carbon), `tr50-56` (crimson), `tr100-42` (glacier), `fashion-stress-triple-0.jpg`. |
| Crinkle mịn hơn, clearcoat normal riêng, roughness biến thiên | **ĐÚNG ở macro** | `fashion-fwd-75.jpg`: highlight vỡ hạt, có nếp nhăn nhỏ. Ở khoảng cách hero, áo vẫn đọc như cao su bóng (`fashion-fwd-0.jpg`). |
| Áo dời trái và nhỏ hơn | **ĐÚNG một phần** | 0% tại 1440: áo x 418–880 (rộng khoảng 32%, tâm khoảng 45%). Vòng 3 là khoảng 34% và nằm giữa. |
| Builder tự nhận: áo chạm chữ nhỏ ở 100%; "WEATHER." cách thước khoảng 25 px ở 1920 | Chạm chữ: **không tái hiện** ở pose mặc định (1440: cổ tay x 745, chữ bắt đầu x 820; 1920: 995 so với 1243). Chỉ tái hiện khi orbit. Khoảng 25 px: **xác nhận**, "WEATHER." kết thúc ở x 1795, vạch thước bắt đầu ở x 1820. | `fashion-fwd-100.jpg`, `fashion-1920x1080-100.jpg`, `fashion-orb100-back.jpg` |
| Stress | **PASS** | Nhấp 3 lần cách 100 ms: ember → crimson (đúng 3 bước), khung cuối sạch, nhãn "Crimson Red" (`fashion-stress-triple-*.jpg`). Nhấp rồi wheel 8×250: kết thúc ở scroll .337, variant ember sạch (`fashion-stress-scroll-mid.jpg`, `-final.jpg`). Spam `setVariant` 1,2,3,0,2 cách 60 ms: dừng ở glacier `#c3c9ce` (`fashion-stress-spam-final.jpg`). |

## Bảng lỗi vòng 3

| # | Lỗi vòng 3 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Khung đầu của wipe là blob méo có quầng xám | **FIXED** | `fashion-tr0-16-155ms.jpg`, `tr0-18-173ms.jpg`, `tr50-21-220ms.jpg` |
| 2 | Khung giữa trống khoảng 200 ms ở 0% | **PARTIAL** | Khung không còn trống, nhưng tâm vẫn trống khoảng 140 ms (`tr0-35-325ms.jpg`) |
| 3 | Ở 100%, áo mới bay xuyên headline | **NOT FIXED** | `fashion-tr100-42-371ms.jpg`: bản sao glacier đi qua dưới "WEATHER." |
| 4 | Rim Carbon kiểu X-quang | **PARTIAL** | Đã sửa trên áo chính (`fashion-hov-1.jpg`). Vẫn còn trên bản sao bay (`tr0-70-643ms.jpg`) |
| 5 | Highlight nylon kiểu nhựa liền | **PARTIAL** | Macro tốt (`fashion-fwd-75.jpg`); toàn thân vẫn bóng cao su |
| 6 | Bố cục so với E2 (áo to, ở giữa) | **PARTIAL** | Rộng khoảng 32%, tâm khoảng 45% |
| 7 | 1920 @100: "WEATHER." chạm thước | **PARTIAL** | Hở 25 px |
| 8 | FPS | Theo orchestrator (58–75 fps, production) | — |
| 9 | Nhãn colourway đổi trễ | **FIXED** | Nhãn đổi ở khoảng 60 ms, trước khi wipe hiện (`tr0-12-116ms.jpg`) |
| N1b (v2) | Mép dissolve màu kem | **NOT FIXED** | `fashion-tr0-21-199ms.jpg`: mép mảnh trắng kem trên ember |

## Lỗi mới / còn mở (xếp theo mức nghiêm trọng)

**1. Bản sao preview bay vào với rim trắng toàn thân, rồi dissolve lại lần hai khi trao cho mesh chính** (mọi mốc ở chế độ fly và fade, mọi lần bấm preview)
- **Bằng chứng, bấm preview:** `fashion-tr0-49-451ms.jpg` và `tr0-70-643ms.jpg` (carbon viền trắng kiểu X-quang), `tr0-91-826ms.jpg` (cùng chiếc áo đã đáp lại lấm tấm dissolve), `tr50-56-537ms.jpg` (crimson viền hồng-trắng), `tr50-91-843ms.jpg`, `tr100-91-828ms.jpg`.
- **Đối chứng, gọi API khi chuột ở xa:** `fashion-api0-601ms.jpg` không có rim trắng, nhưng `api0-780ms` và `api0-830ms` vẫn có đợt lấm tấm thứ hai. Kết luận: rim do hover preview còn bám suốt chuyến bay, còn đợt dissolve thứ hai là do cơ chế trao bản sao → mesh chính.
- **Sửa:**
  - Trong `NextPreview.tsx`, khi bắt đầu bay (swap ≥ `FLY_START`), ép hover rim của bản sao về 0 trong 120 ms. Dùng màu rim giống `Jacket.tsx` (`RIM_K[id]` × hue của vải), không dùng `world.cur.rim`.
  - Bỏ đợt dissolve-in thứ hai của mesh chính khi bản sao đã đáp (`swap ≥ FLY_LAND`). Thay bằng hoán đổi tức thời trong cùng một frame: bản sao và mesh chính có cùng pose (`heroPos`, `heroRotY`), scale và vật liệu, nên đổi `visible` là đủ. Nếu buộc phải giữ crossfade thì làm bằng opacity ≤ 80 ms, không dùng noise discard.

**2. Ở 100%, đường bay đi xuyên qua headline** (`fashion-tr100-42-371ms.jpg`)
- **Sửa:** cho quỹ đạo từ preview về tâm cong xuống dưới, theo một control point dưới đường thẳng (ví dụ `mid = lerp(start, end, .5) + (0, −0.45, 0)`), để né khối chữ bên phải.

**3. Tâm khung trống khoảng 140 ms** (`fashion-tr0-35-325ms.jpg`)
- **Sửa:** dời `FLY_START` từ .22 về .12, hoặc cho dissolve-out của áo cũ kết thúc muộn hơn (đến .34). Khi đó áo cũ ở tâm và bản sao vào nửa khung phải sẽ cùng hiện một lúc, đúng pha hai áo của E2.

**4. Orbit ở 50% và 100% đẩy áo vào dưới headline** (`fashion-orb100-back.jpg`: chữ trắng trên áo cam, độ tương phản thấp; `fashion-orb100-right.jpg`; `fashion-orb50-back.jpg`: "TURN AROUND." đè lên thân áo)
- **Sửa:** khi `|yaw| > 0.6`, lerp camera target sang phía đối diện khối chữ (thêm khoảng ±0,35 vào target.x). Hoặc giảm opacity khối headline xuống .35 trong lúc kéo orbit.

**5. Áo tổng thể vẫn như cao su bơm** (`fashion-fwd-0.jpg`, `fashion-1920x1080-0.jpg`)
- **Sửa:**
  - Giảm độ phồng baffle khoảng 15%, nhất là vai và bắp tay.
  - Tăng `sheen` lên .5 với `sheenRoughness` .35, để highlight rộng và mềm hơn.
  - Giảm `envMapIntensity` thân áo khoảng 20%.
  - Mép dissolve lấy `mix(shell, accent, .5)` thay cho trắng kem.

**6. 1920 @100: khoảng hở 25 px giữa "WEATHER." và thước** (`fashion-1920x1080-100.jpg`)
- **Sửa:** khối headline đặt `max-width: calc(100vw - 300px)`, hoặc `right: 140px` ở mốc cuối.

**7. Nhỏ**
- Preview ở 100% là áo carbon nhìn ngang, silhouette như một ống, đọc kém (`fashion-1920x1080-100.jpg`). Sửa: preview luôn quay 3/4 mặt trước.
- Hover trên glacier gần như không thấy (`fashion-hov-2.jpg`). Sửa: tăng `RIM_K.glacier` lên .5.

## Độ giống mẫu
- **E2:** khoảng 82%. Đúng E2 ở nền bão hòa 4 màu đo sát E2; áo nổi có bóng elip; preview 3D góc phải dưới có hover và click; áo cũ bay lên-trái, áo mới bung ra từ preview; wipe tròn nay sạch. Lệch: áo to hơn và không lệch trái như E2; chất liệu kiểu cao su; còn lỗi trao bản sao (rim trắng + dissolve lần hai) mà E2 không có.
- **E1:** rail ngang và áo treo ở 0%, đúng mức "mượn cơ chế" mà SPEC yêu cầu.

## Có đạt ≥ 90 không? Sửa tối thiểu
**Chưa (88).** Cần khoảng +2:
1. Lỗi #1: tắt hover rim trên bản sao bay và bỏ dissolve lần hai khi trao (+1,5 Animation). Đây là lỗi người dùng thấy ở **mọi** lần bấm preview.
2. Lỗi #2 và #3: quỹ đạo né chữ ở 100% và cho hai áo chồng pha (+0,5–1).
3. Lỗi #5: giảm phồng, sheen mềm hơn (+1 3D).
