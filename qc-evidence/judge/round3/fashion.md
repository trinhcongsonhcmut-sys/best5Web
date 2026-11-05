# QC JUDGE vòng 3 — `/fashion` · CUMULUS 01

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này) · Skill `3d-visual-qc` đã load, checklist 1–8 áp dụng. Chấm theo những gì thấy ở vòng này, không neo theo điểm vòng 2.

**Điều kiện đo:**
- Dev server riêng: `npx vite --port 5197 --strictPort` (DEV). Port 5198 đã bị một tiến trình vite khác của cùng repo chiếm sẵn (không phải của tôi; tôi không đụng vào).
- Trình duyệt: Chrome qua Playwright MCP, mỗi phép đo chạy trong một browser context riêng để cách ly với tab của judge kia.
- Phần cứng: GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, viewport 1440×900.
- **⚠ GPU và CPU đang bị nhiều agent dùng chung, nên các số FPS dưới đây không có tính quyết định.**
- Ảnh: `qc-evidence/judge/round3/shots/fashion-*.jpg`. Script: `.playwright-mcp/r3j2_fa_A.js`, `r3j2_fa_B.js`, `r3j2_fa_C.js`.
- Nhịp chụp chuyển cảnh: khoảng 180–250 ms/khung (giới hạn của `page.screenshot` ở 1440 px). Không bắt được từng frame 16 ms.

## Điểm: **88 / 100** (vòng 2: 87) — chưa đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **26** | Đã cải thiện: baffle phẳng hơn, đường may nén rõ có chỉ khâu, macro 75% đẹp, tay áo có khuỷu và thon dần. Còn trừ vì: highlight vẫn kiểu nhựa/latex gợn sóng, nhất là khi hover; trên Carbon, rim hover thành viền trắng kiểu "X-quang"; thân áo nhìn ngang rất mỏng. |
| Animation & tương tác (30) | **28** | Chuyển colourway đã thành một cảnh có thiết kế: áo cũ vỡ theo hướng bay lên-trái, wipe mở từ preview, áo mới vào giữa. Nhấp 3 lần liên tiếp vẫn ổn định, cuộn trong lúc chuyển không lỗi; preview có hover. Trừ vì: wipe lúc đầu là blob méo có quầng xám mờ chứ không phải đường tròn sắc; ở 0% có khoảng ~200 ms giữa khung trống; ở 100%, áo mới bay xuyên qua headline. |
| Bám tinh thần mẫu (20) | **18** | Chuyển cảnh nay gần E2 hơn (áo cũ bay lên-trái, áo mới bung ra từ thumbnail); nền 4 màu đo sát E2. Lệch còn lại: áo ở giữa và to (khoảng 34% rộng so với 23% lệch trái ở E2); chất liệu bóng nhựa hơn E2. |
| Thiết kế frontend (10) | **9** | Mobile 75% đã sạch. Trừ nhẹ: ở 1920 tại 100%, dấu chấm của "WEATHER." chạm vạch tiến độ "100"; nhãn colourway đổi chậm hơn swatch khoảng 250 ms. |
| Hiệu suất & ổn định (10) | **7** | 0 lỗi console/pageerror/4xx. Ready: cold 7,6 s, warm 3,7 s (DEV). FPS: idle 37,7, macro 75% là 31,8, scrub 26,2 (p95 107 ms), mobile DPR2 29,3. Builder đã báo FPS không cải thiện. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `fashion-orb0-dragDown.jpg` (nhìn vào lòng cổ áo), `fashion-orb0-right.jpg` |
| Orbit 360° | **PASS**: 4×271 px ⇒ `yawTotal` −6,287 (0%), −12,57 (50%), −18,85 (100%); pitch ±1,2. `resetView()` đưa yaw về ~7e-7 và camera về đúng pose ở 0/50/100% | `fashion-orb{0,50,100}-{front,right,back,left,dragUp,dragDown}.jpg` |
| Đổi màu/vật liệu | **PASS**: `#ec6a17` r .40 cc .28 → `#262523` r .38 cc .40 → `#c3c9ce` r .46 cc .24 → `#b3080c` r .42 cc .30. Nền shader, rail và preview đổi theo | `fashion-var-0..3.jpg` |
| Hover có phản hồi | **PASS**: hover áo `jacket` = 1,0, rời ⇒ 0. Hover preview `next` = 1,0, cursor chuyển `pointer`, rời ⇒ 0 và cursor về `grab` | `fashion-hov0-jacket.jpg`, `fashion-hov0-next.jpg` so với `fashion-hov0-off.jpg` |
| Scroll mượt và khôi phục | **PASS**: 5 mốc xuôi và ngược khớp nhau (FOV lệch ≤ 0,006°); nhảy 1→0,3 hội tụ trong ~420 ms; wheel giật trả về 0 | `fashion-fwd-*.jpg`, `fashion-back-*.jpg`, `fashion-wheel-jitter-settled.jpg` |
| Cảm ứng | **PASS**: ở 390×844 touch, vuốt ngang ⇒ yaw +1,276 rad, scroll 0; vuốt dọc ⇒ scroll .069, yaw không đổi | — |
| Không trắng/crash; không ảnh giả 3D | **PASS** | 0 lỗi trong 4 phiên đo |

## Bảng lỗi vòng 2

| # | Lỗi vòng 2 | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| N1a | Vệt xám mờ lớn giữa chuyển cảnh | **FIXED (phần lớn)** | Không còn mảng xám mờ ở giữa khung (`fashion-trans0-02-472ms.jpg`, `fashion-trans50-02-508ms.jpg`). Tuy vậy, ngay khi wipe bắt đầu (~250–280 ms), vùng wipe là một **blob méo** (dạng ngũ giác/vuông bo) có quầng xám-trắng mờ rộng khoảng 15 px, chưa phải "đường tròn sắc, viền sáng mảnh" như builder mô tả: `fashion-trans0-01-244ms.jpg` (góc phải dưới), `fashion-trans50-01-284ms.jpg` (giữa khung). Từ ~470 ms trở đi viền mới tròn và gọn. |
| N1b | Dissolve "da bò", mép màu kem | **PARTIAL** | Áo nay tan theo hướng bay lên-trái, mảnh nhỏ (`fashion-trans0-01-244ms.jpg`, `fashion-trans100-01-252ms.jpg`). Mép mảnh vẫn trắng/kem (trên ember) và trắng (trên carbon), chưa thấy rõ màu của colourway. |
| N1c | Đốm sót trên áo mới | **PARTIAL** | Ở ~660–670 ms vẫn còn vụn sáng trên tay áo phải (`fashion-trans0-03-669ms.jpg`, `fashion-trans50-03-660ms.jpg`). Từ ~850 ms thì sạch. |
| N2 | Áo đọc như đồ bơm hơi/latex | **PARTIAL** | Baffle phẳng hơn, rãnh may nén rõ, có chỉ khâu, clearcoat giảm (.24–.40) (`fashion-fwd-75.jpg`, `fashion-fwd-0.jpg`). Highlight vẫn liền như nhựa, gợn sóng khi hover (`fashion-wheel-midscroll.jpg`). Carbon có rãnh ánh nâu/cam (`fashion-hov0-next.jpg`). |
| N3 | Tay áo xúc xích khi nhìn ngang | **FIXED (về cơ bản)** | `fashion-orb0-right.jpg`: khuỷu gập về trước, tay thon dần về cổ tay, baffle dài ngắn khác nhau. Thân áo nhìn ngang vẫn mỏng như một cột. |
| N4 | FPS thấp và dao động | **NOT FIXED** (builder cũng thừa nhận) | Idle 37,7 / 75%: 31,8 / scrub 26,2 / mobile DPR2: 29,3. Có tranh chấp GPU nên không quyết định. Draw call mỗi frame (đếm thực): 33 ở 0%, 19 ở 75%. Như vậy nút thắt là fill/shader, không phải số draw call. |
| N5 | Preview không có hover | **FIXED** | `hover.id = next`, value 1,0, `cursor: pointer`, rim + scale (`fashion-hov0-next.jpg`). Nhãn "Next look ↘" có sẵn trong overlay. |
| N6 | Mobile 75%: panel phủ cổ áo | **FIXED** | `fashion-390x844-75.jpg`: panel nâu đục hơn, kết thúc ở y≈180, còn cổ áo bắt đầu ở y≈210, không chồng nhau. |
| Stress | Nhấp nhanh và cuộn khi đang chuyển | **PASS** | Nhấp 3 lần cách nhau 100 ms: carbon(1) → ember(0), tức tiến đúng 3 bước, khung cuối sạch, màu `#ec6a17` khớp (`fashion-stress-triple-*.jpg`). Gọi API `setVariant` 5 lần cách 60 ms ⇒ dừng ở glacier, màu khớp. Nhấp rồi wheel 10×200 ⇒ scroll .337 và variant 0→1 sạch (`fashion-stress-scroll-final.jpg`). *Dải đen trên đầu các ảnh `stress-scroll-0x` là lỗi chụp lúc compositor đang scroll: canvas `top` đo bằng rAF luôn bằng 0. Đây KHÔNG phải lỗi.* |

## Lỗi mới / còn mở (xếp theo mức nghiêm trọng)

**1. Khung đầu của wipe chưa sạch** (mọi mốc; rõ nhất ở `fashion-trans50-01-284ms.jpg` và `fashion-trans0-01-244ms.jpg`)
- Hiện tượng: blob méo có quầng xám mờ.
- Ở 50%, wipe nở ra ngay giữa khung, nơi áo vừa biến mất, và trong khoảng 150 ms đọc như một "lỗ xám" hình đa giác.
- Sửa:
  - Mask phải là `length((uv − c) * vec2(aspect, 1)) < r(t)`, nhân aspect trước khi đo khoảng cách. Hiện có vẻ đang méo vì noise hoặc vì thiếu aspect.
  - Bỏ noise ở biên, hoặc giới hạn biên độ noise ≤ 0,004.
  - Viền: `smoothstep(r, r − 0.003, d)` cho mép, cộng một vòng sáng `exp(-abs(d − r) * 400.)` màu `mix(accent, white, .5)`. Bỏ quầng blur.
  - Tâm wipe luôn đặt ở preview, kể cả ở 50%, khi preview vẫn hiện tại (1310, 585).

**2. Khoảng trống giữa khung khoảng 200 ms ở 0%** (`fashion-trans0-02-472ms.jpg`: áo cũ đã tan hết, áo mới chưa tới)
- Sửa: cho hai đường cong chồng nhau. Áo mới bắt đầu bay ở `swap = .25`, không phải sau khi dissolve xong, để luôn có một áo trong khung. E2 có giai đoạn hai áo cùng hiện.

**3. Ở 100%, áo mới bay xuyên qua headline và làm chữ mất tương phản** (`fashion-trans100-02-514ms.jpg`)
- Hiện tượng: chữ trắng trên nền đang chuyển sang bạc và trùng với vụn áo.
- Sửa:
  - Đường bay từ preview về tâm uốn cong xuống dưới, theo control point `(0.6, −0.4)`, để né vùng chữ phía trên phải.
  - Đổi màu chữ ngay khi wipe đi qua vùng chữ, dùng mask của wipe, thay vì đổi khi swap kết thúc.

**4. Rim hover trên Carbon tạo viền trắng kiểu "X-quang"** (`fashion-stress-scroll-final.jpg`)
- Hiện tượng: mọi mép baffle sáng trắng, mất đọc vật liệu.
- Sửa:
  - Cường độ rim theo colourway: carbon .45, ember/crimson .8, glacier .35.
  - Màu rim lấy `accent` của colourway (carbon: `#8a8580`), không dùng trắng.

**5. Highlight nylon vẫn kiểu nhựa liền, gợn sóng** (`fashion-wheel-midscroll.jpg`, `fashion-fwd-75.jpg`)
- Sửa:
  - Crinkle normal map tần số cao (scale ×6, cường độ .25) để highlight vỡ thành vệt nhỏ như ciré thật.
  - `clearcoatRoughness` .18–.22.
  - Giảm biên độ noise displacement dọc baffle đang gây gợn lớn.

**6. Bố cục so với E2** (`fashion-fwd-0.jpg`): áo chiếm ~34% rộng ở tâm.
- Sửa: ở 0%, dời target camera sang phải +0,35 để áo lệch trái (tâm khoảng 43%); giảm scale áo 0,85.

**7. 1920 ở 100%: "WEATHER." chạm thước tiến độ** (`fashion-1920x1080-100.jpg`, x≈1815)
- Sửa: `max-width: calc(100vw − 260px)` cho khối headline, hoặc thêm `padding-right: 120px` ở mốc cuối.

**8. FPS** (không quyết định)
- Đo lại trên build production.
- Nếu vẫn dưới 50: preview render ở 1/2 tần suất; backdrop shader ở 0,5× độ phân giải; tắt rail ở 25–100% (rail đã ẩn nhưng có thể vẫn render).

**9. Nhỏ:** nhãn colourway ("Ember Orange") đổi chậm hơn swatch khoảng 250 ms (`fashion-trans0-01-244ms.jpg`). Nên đổi cùng lúc với wipe.

## Độ giống mẫu
- **E2 (chính):**
  - Cơ chế đủ và nay gần mẫu hơn: nền bão hòa 4 màu đo sát E2 (`#ec6a17`, `#262523`, `#c3c9ce`, `#b3080c`), áo kế tiếp 3D ở góc dưới phải có hover và click, áo cũ bay lên-trái, áo mới bung ra từ thumbnail, có bóng elip.
  - Lệch: áo ở tâm và to hơn; chất liệu bóng nhựa hơn puffer render của E2; E2 có pha hai áo cùng hiện, ta có ~200 ms trống ở giữa.
  - Ước khoảng 80% tinh thần E2.
- **E1:** rail ngang và áo treo ở 0%, ẩn khi xoay; đúng mức "mượn cơ chế" theo SPEC.

## Có đạt ≥ 90 không? Sửa tối thiểu
**Chưa (88).** Cần khoảng +2:
1. Lỗi #1 và #2: wipe tròn sắc từ khung đầu, không có khung trống (+1).
2. Lỗi #4 và #5: rim theo màu, highlight ciré vỡ (+1).
3. Đo FPS trên build production: ≥ 50 idle ở 1440 (+1).

Lỗi #3, #6, #7 là đánh bóng.
