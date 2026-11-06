# Giám khảo độc lập — Automotive flagship V4 · Vòng 1 (J1 realtime + J2 still)

- Giám khảo: `automotive-luxury-judge` (Opus). Ngày 05/11/2026. Giám khảo không viết phần mã/render này, chỉ đọc mã nguồn và không sửa gì.
- **Điều kiện tự kiểm:**
  - Server riêng `npx vite --port 5196 --strictPort` (dev). Đã dừng sau khi đo, cổng 5196 đã giải phóng.
  - Chrome 156.0.8078.80, headless, `--use-angle=d3d11`, GPU **Intel HD 530** (ANGLE D3D11), DPR 1.
  - Lúc đo không có Blender chạy. **Chrome của người dùng vẫn mở (≈ 40 tiến trình)** nên FPS dưới đây không có thẩm quyền.
  - Script của giám khảo: `judge/judge-r1.mjs`, `judge/judge-r1-hover.mjs`, `judge/crops-r1.mjs`, `judge/sheets-r1.mjs`.
  - Log: `judge/r1/log-desk.json`, `log-vp.json`, `log-hover.json`.
  - Ảnh: `judge/r1/*.jpg|png`. Mọi đường dẫn bên dưới đều tính từ `automotive-flagship/`.
- **Chưa chạy lại:**
  - Bộ `tests/qc` 10/10 và `tsc` là số của builder, giám khảo chưa tự chạy.
  - ΔE2000 3,87/4,87/2,84 và IoU 1,0 cũng là số của builder. Giám khảo chỉ xem ảnh `renders/match/*` và thấy khớp hình học bằng mắt.
  - FPS production: **BLOCKED**, việc này thuộc điều phối.
- **Về Phần E (V4):** repo không có văn bản V4 gốc (REFERENCE_MATRIX cũng ghi như vậy). Bảng 7 tiêu chí dưới đây được dựng lại từ các mục bắt buộc của `CURRENT_GOAL.md` (Kế thừa), skill `3d-visual-qc` và nghiệm thu Stage 2/3 trong `AUTOMOTIVE_EXECUTION_PLAN.md`. Điều phối cần đối chiếu lại với bản V4 gốc.
- **Phạm vi chấm:** logo thương hiệu bị cấm. Việc không có logo không bị tính là lỗi. Biển số "BAHA·GT 01" đạt yêu cầu.

---

## 1. Kết luận

| | |
|---|---|
| **Điểm route realtime (thang 100)** | **76 / 100** (v2 vòng 1: 70 · vòng 2: 73 · mục tiêu ≥ 88 ở Stage 2, ≥ 90 ở Stage 4) |
| **Phán quyết** | **FAIL**, chưa đủ chuẩn trình Founder như một flagship. Phần tương tác vẫn rất chắc. Phần hình ảnh đã tiến bộ rõ: trời và mặt đường là ảnh thật, Carmine đọc ra màu đỏ, bóng tiếp xúc tốt. Nhưng vẫn còn lỗi "CG lộ" ở .02/.03 và chưa ra chất ảnh quảng cáo. |
| **Bộ still H1–H4 (nghệ thuật)** | H1 73 · H2 76 · H3 70 · H4 77. Nghiệm thu Stage 3 yêu cầu ≥ 88 ⇒ **FAIL** |
| **Có still nào đã đủ đưa vào pitch-deck?** | **Chưa có.** Gần nhất là **H4**: mood ánh sáng và phản chiếu capo đẹp nhất. Nhưng H4 lộ cần gạt dạng lưới, phản chiếu cửa bị gợn sóng "chất lỏng" và moay-ơ sao crôm kiểu đồ chơi. Đứng thứ hai là **H2** (Carmine), nhưng bố cục và nền vẫn trống. Mỗi ảnh còn ít nhất 3 lỗi mà người xem thông thường cũng nhận ra. |

## 2. Bảy tiêu chí bắt buộc (V4 · Phần E, bản dựng lại)

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| E1 | 3D tương tác thật, không dùng ảnh/video thay | **PASS** | Camera thay đổi thật theo cuộn: 0 % `[4.75,0.9,8.15]` → 50 % `[5.3,3.95,6.85]` → 75 % `[-6.05,1.55,4.95]` (`r1/log-desk.json` scroll.fwd). Có 119 draw call và 437 k tam giác. Prerender chưa được tích hợp (đúng theo PIPELINE §6). |
| E2 | Orbit 360° ở 0/50/100 % | **PASS** | Mỗi mốc gồm 8 bước × 135 px, mỗi bước −0,783 rad. Sau 8 bước, yawTotal −6,264 (0 %) / −12,547 (50 %) / −18,83 (100 %), tức mỗi vòng ≈ 2π. Pitch ±1,2. `resetView` cho Δcam = 0 ở cả 3 mốc. Ảnh: `r1/S-orbit-p0.jpg`, `S-orbit-p50.jpg`, `S-orbit-p100.jpg`. Không lộ lỗ hay mặt trong ở 24 góc. |
| E3 | ≥ 3 biến thể vật liệu thật | **PASS** | `primary`: pearl #d9d6d0 (m 0,04, r 0,08) / carmine #b3131f (m 0,35) / graphite #2c2e33 (m 0,75) / bronze #7d5a3a (m 0,72), đều có clearcoat 1. Đã kiểm ở mốc 0 % và 75 %. Ảnh: `r1/S-variants.jpg`. |
| E4 | Hover có ánh sáng thấy được, không dùng CSS filter | **PASS (yếu ở body)** | 5 bộ phận: body / glass / wheels / chassis / lights. `hover.value` = 1,00, rời chuột về 0. rim: paint 1,15 (body), glass 1,02, rearLight 1,0 (lights). Chênh pixel cục bộ 440×320: body 2,52 · glass 2,96 · wheels 3,05 · chassis 0,84 · lights 1,26 (/255). Ảnh: `r1/S-hover.jpg`. Hover body gần như không nhìn thấy. Hover bánh làm mâm chuyển màu đồng (xem lỗi #10). |
| E5 | Cuộn 5 mốc, ngược lại khôi phục, không giật | **PASS** | Δcam cuộn ngược so với cuộn xuôi = 0 ở 0,75/0,5/0,25/0. Jitter qua bridge (1 → 0,3) hội tụ đơn điệu, settleΔ = 0. Burst 20 nhịp wheel: 0 lần đổi chiều, quay về 0 thì Δ = 0. Ảnh: `r1/S-scroll-1440.jpg`. |
| E6 | Ổn định, responsive, cảm ứng | **PASS** | 0 console error, 0 pageerror, 0 HTTP ≥ 400, 0 `webglcontextlost`. Chỉ có 1 warning `THREE.Clock deprecated` mỗi lần tải. Không tràn ngang ở 1920/1440/390. Vuốt ngang trên 390: yaw 0 → −1,392, scroll giữ 0. Vuốt dọc: scroll 0 → 0,083, yaw không đổi. Heap 96,7 MB. Ảnh: `r1/S-1920.jpg`, `r1/S-390.jpg`, `r1/m-touch-orbit.jpg`. |
| E7 | Photoreal ultra-luxury ngang tầm tham chiếu, không còn chất toy/cartoon; still và realtime nhất quán | **FAIL** | Xem §3–§5. Ba lỗi nặng: (a) nền đất chiếu bị kéo giãn, các facet tam giác của dome lộ rõ ở .03; (b) sơn Pearl không có vệt chân trời sắc, thay vào đó là "vòng" oval trên cửa; (c) bánh/moay-ơ, cần gạt và cây bụi đọc như mô hình. Ở tất cả 4 still, ánh sáng hoàng hôn đọc như chiều nhạt trời âm u. |

**Nghiệm thu Stage 2 (EXECUTION_PLAN):**

| Mục | Kết quả |
|---|---|
| QC 10/10 | Theo builder (giám khảo chưa chạy lại) |
| Hiệu năng production | **BLOCKED** |
| 0 lỗi console | **PASS** |
| ΔE ≤ 6 | Theo builder |
| Vệt chân trời sắc trên Pearl ở yaw 0/90/180 | **FAIL**: chỉ có gradient mềm, vệt oval ở .03 (`r1/d-hero-car-crop.jpg`, `r1/d-fwd-75.jpg`) |
| Nửa dưới xe không đen bệt | **PASS**: mâm có specular, nhưng vẫn tối xanh than |
| Mobile 0 % | **PASS**: không còn vật chắn, xe trọn khung, hết đĩa cam (`r1/vp-390x844-0.jpg`) |
| Giám khảo ≥ 25/30, ≥ 16/20, ≥ 88 | **FAIL** (22 / 12 / 76) |

**Nghiệm thu Stage 3:**

| Mục | Kết quả |
|---|---|
| Không firefly, không vệt denoise ở crop 100 % | **PASS**: 13 crop trong `r1/c-*.jpg` không thấy |
| Không logo | **PASS** |
| Thời gian render có trong log | **PASS**: `renders/test/run-heroes.log` ghi 243,7 / 211,5 / 308,6 / 378,7 s |
| Nghệ thuật ≥ 88 | **FAIL** |

## 3. Điểm 100 (route realtime)

| Hạng mục | Điểm | Lý do |
|---|---|---|
| 3D / photoreal | **22/30** | Tiến bộ thật so với v2-golden-before (`r1/S-before-after.jpg`, hàng 2 → hàng 3). Trời là ảnh chụp, asphalt có vết nứt, bóng và AO bake bằng Cycles giúp xe "đè" xuống đất, Carmine đỏ sạch. Bị trừ vì: Pearl vẫn "trắng sữa" và không có vệt chân trời; dome đất lộ facet tam giác (.03); nền .02 là đất nâu phẳng bị kéo giãn, có các "đĩa" AO tối dưới bụi cây; thành lốp còn viền cam; cần gạt dạng lưới; moay-ơ sao crôm. |
| Animation & tương tác | **26/30** | Orbit, biến thể, cuộn và cảm ứng đều hoàn hảo, có số đo. Bị trừ vì hover body gần như vô hình (Δ 2,5/255), hover bánh làm mâm thành màu đồng rẻ tiền, và quầng đèn hậu nổi ra ngoài thân xe ở .03. |
| Bám tham chiếu | **12/20** | So với `hero_01_front`: tham chiếu có phản chiếu trời liền và sắc, tương phản vật liệu (sơn / carbon có vân / mâm sáng / lốp có chữ), kính thấy nội thất, camera cao nhìn xuống. Route có: phản chiếu mờ, mâm và lốp cùng một khối tối, kính tối (nội thất chỉ thấy ở .02), không có ngôn ngữ ống kính trừ vignette. Hướng "hoàng hôn" cũng yếu đi: trời kem-xanh nhạt, không thấy mặt trời thấp hay rim vàng. |
| Frontend | **8/10** | Hero, .01 và FIN rõ ràng. Đoạn mô tả .03 ("Dải đèn hậu…") **không đọc được** trên dải đất (`r1/d-fwd-75.jpg`). Gợi ý góc phải dưới có tương phản thấp. |
| Hiệu suất & ổn định | **8/10** | 0 lỗi. Dev 1440: idle 75,2 fps (p95 13,5 ms); cuộn 70,5 fps (p95 26,6, worst 40 ms, 0 khung > 50 ms). Dev 1920: idle **48,0** (p95 27,4); cuộn **44,1** (p95 28,7, worst 66,6, **4 khung > 50 ms**). Ready dev 7,0–7,5 s, vượt mục tiêu 5 s (lần tải nóng 3,4–3,7 s). Không có thẩm quyền vì Chrome người dùng chạy song song. Chờ số production. |
| **Tổng** | **76/100** | |

## 4. Nghệ thuật — 4 still Cycles (đánh giá như ảnh hero quảng cáo độc lập)

Ảnh: `renders/test/H1…H4-*-comp.jpg`. Crop 100 %: `judge/r1/c-*.jpg`.

| Still | Điểm | Mạnh | Yếu (lý do không đưa vào pitch-deck) |
|---|---|---|---|
| **H1** Pearl 3/4 trước | 73 | Asphalt rất thật. Bóng tiếp xúc và AO đúng. Sơn có phản chiếu trời mềm. Không có firefly. | **Camera thấp gần ngang thân, gần như chụp ngang**, không phải 3/4 cao 1,7–2 m / 50 mm như REFERENCE_MATRIX. Xe chỉ chiếm ≈ 56 % bề ngang, trời trống chiếm ≈ 45 % khung. **Góc trái dưới là mặt phẳng nâu lì có mép cứng** cắt chéo khung (`c-H1-bottom-left.jpg`), đọc như mép bàn CG. Cỏ nền bị kéo vệt ngang như motion blur, trong khi bụi cây lại sắc nét (lệch DOF, `c-H1-bg-left.jpg`). Bụi cây là vài cành lẻ như cây cắm. Cần gạt dạng lưới hiện trên capo (`c-H1-cowl-wiper.jpg`). Hoàng hôn không ra: trời xám kem, ánh nắng trực tiếp chỉ thấy thành **vệt vàng bão hòa dưới gầm** (`c-H1-underbumper.jpg`). |
| **H2** Carmine cùng pose | 76 | Đỏ sạch, có chiều sâu, thấy được phản chiếu trên cửa (`c-H2-door.jpg`). Đây là ảnh đọc "xe sang" nhất ở khoảng cách xa. | Cùng mọi lỗi bố cục và nền của H1. Đỏ hơi phẳng, chưa đạt độ "candy" sâu như `hero_02_front`: thiếu highlight nóng và phản chiếu gương sắc. |
| **H3** Pearl 3/4 sau, đèn hậu | 70 | Pose đuôi đẹp, dải đèn hậu mảnh đọc ra, biển BAHA ổn. | **Vòng oval sáng trên cửa** do dải chân trời trong IBL tạo ra (`c-H3-door-ring.jpg`). Glare comp làm **mờ sữa** mảng trên-trái đuôi xe, cháy sáng (`c-H3-rear-glow.jpg`). Nền là dải cỏ nhòe kèm đất nâu phẳng trống. Cây bụi là hàng que lẻ (`c-H3-shrubs.jpg`). Mâm và lốp tối đen chìm vào gầm. |
| **H4** vai + bánh trước, 85 mm | 77 | **Đẹp nhất bộ:** DOF, phản chiếu ấm chạy dọc capo, khung ảnh cận có mood. | **Cần gạt lộ cấu trúc lưới** (`c-H4-wiper.jpg`). **Phản chiếu trên cửa và vè gợn sóng như chất lỏng**, đọc như tấm tôn móp (`c-H4-door-ripple.jpg`), do normal mesh thấp poly. **Moay-ơ là ngôi sao crôm nhọn có ốc lục giác**, mang chất đồ chơi / mâm aftermarket (`c-H4-hub.jpg`). Caliper màu cam phẳng. Thành lốp trơn, không chữ. Có vệt vàng dưới lip trước (`c-H4-under-lip.jpg`). |

**So với tham chiếu, nói thẳng:** các ảnh tham chiếu (`hero_01_front`, `hero_02_front`, `hero_03_rear`, video showroom) ở mức CG thương mại cao cấp. Chúng có phản chiếu môi trường sắc như gương, tương phản vật liệu rõ (carbon có vân, mâm bạc, lốp có chữ), kính thấy nội thất và ánh sáng có chủ đích (softbox/line-light). Bộ still hiện tại ở mức **"render showroom sạch sẽ của một model miễn phí"**:
- đúng vật lý;
- nhưng chưa có thiết kế ánh sáng;
- bố cục chưa được dàn dựng;
- model CarConcept lộ giới hạn ngay khi chụp cận (cần gạt, normal cửa, moay-ơ).

Khoảng cách này **không thể vá bằng grade**. Phải sửa ánh sáng, bố cục và chi tiết model (§6).

## 5. Realtime ↔ still: nhất quán và "kéo chất lượng xuống"?

- **Hình học:** khớp tuyệt đối (`renders/match/cmp-H1-…`, `cmp-H3-…`; trái = realtime, phải = Cycles).
- **Khác biệt còn lại:**
  - **Realtime tệ hơn:**
    - dome đất **lộ facet tam giác** ở .03 (`cmp-H3` trái, `r1/d-fwd-75.jpg`, `r1/vp-390x844-75.jpg`);
    - có vài vết nối dọc ở hàng cây trên trời .03 (x ≈ 580 và 835 px trong `d-fwd-75.jpg`);
    - thành lốp có viền cam/vàng (`r1/d-hero-car-crop.jpg`, cạnh phải dưới của cả hai lốp);
    - quầng đèn hậu đỏ nổi ra ngoài silhouette (`d-fwd-75.jpg`, bên trái đuôi xe);
    - vệt cam dưới đầu xe ở .02 (`d-fwd-50.jpg`).
  - **Still tốt hơn rõ:** AO dưới gầm và độ sâu của bóng.
- **Đánh giá:** khoảng cách giữa still và realtime **nhỏ**, xét cả mặt tốt lẫn mặt xấu. Realtime không kéo chất lượng xuống quá nhiều ở hero và .01. Nhưng **.02 (nhìn từ trên thấy toàn đất chiếu bị kéo giãn + các "đĩa" AO) và .03 (facet + chữ không đọc được) kéo cả route xuống** rõ rệt. Ngược lại, still cũng chưa đủ vượt trội để "nâng" route nếu bây giờ đem chèn vào làm opener.

## 6. Danh sách sửa (ưu tiên giảm dần)

Mức độ: [Cao] chặn PASS · [TB] cần cho ≥ 88 · [Thấp] hoàn thiện. Lớp: **RT** = realtime, **BL** = still Blender, **M** = model/asset (ảnh hưởng cả hai).

1. **[Cao][RT] Dome đất lộ facet tam giác + vết nối trên trời ở .03.**
   - Ở đâu: `World.tsx` (GroundedSkybox, dome 96 → 64 segment ở Stage 2).
   - Bằng chứng: `r1/d-fwd-75.jpg`, `r1/vp-390x844-75.jpg`, `renders/match/cmp-H3-…` (trái).
   - Cách sửa:
     - Trả dome về ≥ 128 segment chỉ cho vành gần mặt đất (chia không đều, dày ở góc thấp). Hoặc thay vành 20–150 m bằng **mesh địa hình thật**: plane có heightmap nhẹ, texture cỏ/đất CC0 đã duyệt, fog phủ mép.
     - Kiểm 8 góc orbit ở .03.
     - Vết nối dọc trên hàng cây: kiểm chỗ "vá biển báo" trong `GRADE`.
2. **[Cao][RT+BL] Nền đất chiếu bị kéo giãn ở .02 (nhìn từ trên), H1 và H3.**
   - Biểu hiện: vệt mờ kéo dài, đất nâu phẳng, đĩa AO tối dưới cây bụi.
   - Bằng chứng: `r1/d-fwd-50.jpg`, `r1/S-orbit-p50.jpg`, `c-H1-bg-left.jpg`, `H3-comp`.
   - Cách sửa:
     - **RT:** vai đường 3D rộng 30–60 m với vật liệu sỏi/đất có normal map. AO cây bụi dùng blob mềm, bán kính nhỏ hơn và đậm ở tâm, không dùng đĩa đều. Gom bụi thành cụm dày 15–30 cây, cao thấp khác nhau.
     - **BL:** dùng cùng mesh đó cho still, DOF mạnh hơn cho nền và cây bụi.
     - Nếu không kịp: hạ góc nhìn của camera .02 để chân trời và đường lấp khung.
3. **[Cao][RT+BL] Sơn Pearl không có "đường chân trời" sắc; dải IBL tạo vòng oval.**
   - Bằng chứng: `c-H3-door-ring.jpg`, `r1/d-hero-car-crop.jpg`, `d-fwd-75.jpg` (cửa).
   - Cách sửa:
     - Bỏ dải chân trời 360° mảnh.
     - Thêm **1–2 thẻ sáng hình chữ nhật dài** (light card / area light, cao 3–8°, rộng 40–60°, đặt lệch phía mặt trời) vào IBL realtime và Cycles. Đặt dải đất tối ngay dưới chân trời để tạo một vệt thẳng chạy dọc cửa và capo.
     - Kiểm ở yaw 0/90/180 cho cả RT và BL.
4. **[Cao][BL] Bố cục và camera của still hero chưa theo chuẩn quảng cáo.**
   - Bằng chứng: H1/H2 (camera ngang thân, trời trống ≈ 45 %, mép mặt phẳng nâu ở góc trái dưới `c-H1-bottom-left.jpg`).
   - Cách sửa:
     - Dựng lại H1 theo REFERENCE_MATRIX: camera cao 1,7–2 m, nhìn xuống 12–15°, 50 mm, xe chiếm 80–85 % bề ngang. Thêm một bản low-hero 35 mm cao 0,5 m.
     - Cắt khung 2,39:1, hoặc đưa đường chân trời lên 1/3 trên.
     - Thay mặt phẳng nâu bằng vai sỏi có texture.
     - Mỗi lần render ≤ 15 phút, vẫn nằm trong ngân sách còn ≈ 35 phút.
5. **[Cao][RT+BL] Hoàng hôn không ra hoàng hôn.**
   - Biểu hiện: trời kem/xanh nhạt; nắng trực tiếp chỉ xuất hiện thành vệt vàng bão hòa dưới gầm.
   - Bằng chứng: `c-H1-underbumper.jpg`, `c-H4-under-lip.jpg`, `r1/S-orbit-p0.jpg` (180°: trời xanh xám).
   - Cách sửa:
     - Hạ độ cao mặt trời 2–4° để có **rim vàng mảnh dọc mui và vai** ở góc 3/4.
     - Tăng tỉ lệ nắng / trời.
     - Giảm bão hòa màu sun lamp (1,47/0,93/0,29 lệch xa trời) để nắng hòa với trời.
     - Warm grade trời phía mặt trời +10–15 %.
     - Với still, cân nhắc đưa đĩa mặt trời hoặc quầng sáng vào khung (bloom/glare có ngưỡng).
6. **[TB][M] Cần gạt dạng lưới (alpha cut) lộ ở capo.**
   - Bằng chứng: `c-H4-wiper.jpg`, `c-H1-cowl-wiper.jpg`, `r1/d-hero.jpg`.
   - Cách sửa: ẩn node cần gạt ở cả RT và BL, hoặc thay bằng một lưỡi gạt đặc đơn giản màu đen mờ.
7. **[TB][M→BL trước] Phản chiếu cửa/vè gợn sóng như chất lỏng.**
   - Bằng chứng: `c-H4-door-ripple.jpg`.
   - Cách sửa:
     - **BL:** Weighted Normal + Subdivision 1 cấp **chỉ cho tấm cửa và vè trong still cận**. Plan cấm Subdivision, nhưng với still cận thì đây là lựa chọn đúng; cần Founder hoặc architect cho phép.
     - **RT:** tính lại normal mượt có ngưỡng góc cho mesh thân xe (build-car), hoặc bake normal map từ bản subdivide.
8. **[TB][M] Bánh/mâm/lốp kém sang.**
   - Biểu hiện: moay-ơ sao crôm nhọn trông như đồ chơi; mâm đen hòa vào lốp; lốp trơn không chữ; caliper cam phẳng.
   - Bằng chứng: `c-H4-hub.jpg`, `c-H1-wheel-front.jpg`.
   - Cách sửa:
     - Moay-ơ dùng gunmetal satin thay crôm.
     - Mâm có **vành ngoài bạc / phay sáng** (plan ghi "vành bạc" nhưng trong ảnh không thấy).
     - Lốp thêm biến thiên roughness và normal ở thành lốp (chữ / chi tiết dập nổi trơn).
     - Caliper đỏ sâu hơn, có clearcoat.
9. **[TB][RT] Viền cam/vàng trên thành lốp vẫn còn** (lỗi #5 từ v2 vòng 2 chưa hết).
   - Bằng chứng: `r1/d-hero-car-crop.jpg` (cạnh phải dưới của hai lốp), `r1/d-hero.jpg`.
   - Cách sửa: kiểm nguồn sáng (sun directional spec, fill, bake shadow tint). Loại lốp khỏi phần đóng góp sunRim/fill, hoặc tăng roughness thành lốp lên 0,9 và giảm env tại vùng thành lốp.
10. **[TB][RT] Hover body vô hình; hover bánh chuyển mâm sang màu đồng.**
    - Bằng chứng: `r1/S-hover.jpg` (hàng 1–2 gần như giống hệt; hàng 3 mâm thành nâu đồng), `r1/log-hover.json`.
    - Cách sửa:
      - Body: tăng env/clearcoat intensity +25–30 % kèm một vệt specular chạy theo con trỏ, thay cho rim cộng màu.
      - Bánh: highlight trắng lạnh ở vành, không tint đồng.
      - Mục tiêu: Δ cục bộ ≥ 6/255.
11. **[TB][RT+BL] Quầng đèn hậu và glare.**
    - Biểu hiện: halo đỏ nổi ra ngoài silhouette ở .03; glare comp H3 làm mờ sữa mảng đuôi.
    - Bằng chứng: `r1/d-fwd-75.jpg`, `c-H3-rear-glow.jpg`.
    - Cách sửa:
      - **RT:** giới hạn sprite `halo` trong bề rộng dải đèn, che bởi depth.
      - **BL:** tăng ngưỡng glare (chỉ đèn và mặt trời), giảm size, mix 0,45 → 0,2.
12. **[TB][RT] Vệt cam dưới đầu xe ở .02 đọc như rò sáng** (skate seam / pool).
    - Bằng chứng: `r1/d-fwd-50.jpg` (dưới cản trước), `r1/S-1920.jpg` (ô .02).
    - Cách sửa: đổi màu seam sang trắng ấm, cường độ giảm một nửa, chỉ hiện ở khe giữa vỏ và khung.
13. **[Thấp][RT] Chữ .03 không đọc được; gợi ý góc phải dưới có tương phản thấp.**
    - Bằng chứng: `r1/d-fwd-75.jpg`, `r1/d-hero.jpg`.
    - Cách sửa: thêm scrim cho khối chữ .03 (giống final) và cho cụm gợi ý.
14. **[Thấp][RT] Hiệu năng 1920 (dev).**
    - Số đo: idle 48 fps, cuộn 44 fps, 4 khung > 50 ms. Ready dev 7,0–7,5 s, mục tiêu ≤ 5 s.
    - Cách sửa: điều phối đo production trước. Nếu production 1920 < 55 fps, đặt DPR cap / `resolutionScale` 0,85 cho viewport ≥ 1800 px và preload HDRI sớm.
15. **[Thấp][BL] Cây bụi trong still sắc trong khi nền nhòe, lại thưa như que cắm.**
    - Bằng chứng: `c-H1-bg-left.jpg`, `c-H3-shrubs.jpg`.
    - Cách sửa: đặt cây bụi vào vùng DOF đúng khoảng cách, gom cụm dày hơn, hoặc bỏ hẳn khỏi khung hero.

**Thứ tự đề nghị:**
- **RT:** 1 → 2 → 3 → 9 → 10 → 12 → 13.
- **BL**, chỉ khi Founder muốn render lại still: 4 → 5 → 6 → 7 → 8 → 11.

Các lỗi 3, 5, 6, 8 dùng chung cho cả hai lớp, nên sửa ở contract và material trước khi render lại.

## 7. Before/after

`r1/S-before-after.jpg` có 3 hàng: v1 / v2-golden-before / flagship, mỗi hàng ở 0 / 50 / 75 %.
- **Flagship tốt hơn v2-golden-before ở:** mặt đường thật, trời ảnh thật, đã bỏ núi giấy cắt, Pearl sạch hơn và hết nâu cam toàn khung.
- **Flagship kém hơn ở:** cảm giác "hoàng hôn" (v2 ấm và có mood hơn), và nền .02 (giờ là đất chiếu bị kéo giãn).

## 8. Cuối phiên
- Đã dừng server 5196; không còn tiến trình nào lắng nghe ở cổng 5196.
- Không sửa mã nguồn, không commit.
