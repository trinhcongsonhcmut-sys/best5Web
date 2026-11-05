# Giám khảo độc lập — V2 Real Estate (`/real-estate`, HALCYON HOUSE)

- Ngày: 05/11/2026 · Giám khảo không viết code này · chỉ đọc mã nguồn, không sửa.
- Điều kiện tự kiểm: `vite` dev :5199 (process vite --port 5199 --strictPort của chính dự án đã chạy sẵn, PID 9452, giám khảo dùng lại, không tắt), Chrome (channel chrome, headless, `--use-angle=d3d11`), Intel HD 530, DPR 1. Ảnh zoom DPR 2. Script độc lập + log: `shots/real-estate-judge-log.json`.
- FPS chính thức do điều phối đo lại trên bản production. Builder báo scroll 60.1 / 58.6 fps, worst 53–80 ms. Số của giám khảo dưới đây chỉ là quan sát trên dev.
- Chuẩn hình ảnh: `reference/v2/real-estate-ref-1.webp`. Chuẩn chuyển động/UI: `baseline/v1/real-estate/MOTION_SPEC.md` và `baseline/compare/real-estate/*`.
- Bản chất build: biệt thự vẫn **dựng bằng code** (`architecture.ts` + `kit.ts`), phủ texture scan PBR CC0 (sandstone, concrete, planks, leafy_grass). Ánh sáng dùng HDRI `belfast_sunset_puresky_2k`. Cây là thẻ lá alpha. Không có GLB nhà.

## Điểm: **68 / 100** (mục tiêu ≥ 90 → KHÔNG ĐẠT)

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| 3D / photoreal | **16/30** | Vỏ nhà có scan đá/gỗ/bê tông thật, đèn âm trần, ánh nội thất ấm, nên cận cảnh 25% khá đẹp. Nhưng cây là thẻ lá cắt giấy, có vệt dither răng cưa và thân cây trơ trụi chĩa lên mái. Nội thất là khối hộp low-poly. Mặt sau là ô cửa cam phẳng. Cỏ tối và đều màu. Không có nắng vàng chiếu xiên. Tổng thể ở mức arch-viz realtime/game, chưa photoreal. |
| Animation & tương tác | **24/30** | Giữ đúng storyboard v1 (6 stop, rail, đồng hồ, hologram). Cuộn ngược Δ = 0. Orbit 360° ở 0%/100%. 3 biến thể, hover 5 phần có nhãn, tap cảm ứng có nhãn. Trừ điểm: hover đôi khi bị kẹt sau cú rê nhanh; hover mass/glass/fins rất nhạt; copy/rail lệch ở mốc 12,5% và 62,5%. |
| Bám mẫu v2 | **12/20** | Khối kiến trúc khớp tốt: 2 khối, sàn đua sẫm, trụ đá, ốp gỗ, lan can kính, ống khói, cửa garage gỗ, bãi cỏ, rừng cây. Lệch về mood: mẫu là hoàng hôn vàng trong trẻo, cỏ sáng có sọc cắt; v2 là sương xám tím, cây như bìa cứng xám, cỏ xanh tối, thiếu ánh nắng ấm trên nhà. |
| Frontend | **8/10** | UI v1 giữ nguyên, typography đẹp, không tràn ngang ở 1920/1440/390. Panel rail che cánh phải của nhà ở 1440. Chữ đè lên sofa ở mốc 50%. Copy không khớp hình ở 62,5%. |
| Hiệu năng & ổn định | **8/10** | 0 console error, 0 lỗi HTTP, chỉ có 1 warning `THREE.Clock deprecated`. Trên dev khi cuộn wheel: 59.1 fps trung bình, p95 27.3 ms, worst 93.4 ms, 20/855 khung > 50 ms → thấy vài cú khựng nhẹ. Ready 5.7–9.0 s (dev). |

## Hạng mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | PASS | Mesh WebGL thật, camera đổi theo cuộn và orbit (`fwd` trong log). |
| Orbit 360° (không chui vào khối, không khung đen) | PASS (có lỗi lớn) | Kéo 1,02 vòng → yawTotal −6.41. `resetView` → yaw ≈ 0, pos [21, 3.4, 40]. 8 hướng ở 0% và 100% đều quay thật. Ở 50% bị giới hạn ±0.75 rad, đúng thiết kế v1. Camera không chui vào khối nhà. Nhưng ở 0% các hướng 90°–180°, tán cây tiền cảnh che 30–45% khung, tô dither răng cưa, có mảng gần đen (xem lỗi 1). `shots/real-estate-sheet-orbit-p0/p50/p100.jpg` |
| ≥ 3 biến thể đổi vật liệu thật | PASS | `primary`: #f4ece0 r1.0 (Sandstone) / #70757d r0.78 (Basalt) / #e9e7e3 r0.95 (Board Concrete, đổi hẳn bộ scan). Bấm nút picker thật → `concrete`. `shots/real-estate-sheet-variants.jpg` |
| Hover có phản hồi, không hover ma | PASS (nhạt, có lỗi kẹt) | Trước mọi pointer event: hover `null`, `data-part=""`. Rê vào mass/glass/roof/fins (0%) và pool (75%): value = 1, đúng nhãn. Rời chuột dần dần → về 0 (24/24 lần). Rời bằng một cú nhảy pointer → kẹt 3/13 lần (lỗi 8). Chênh pixel trung bình: mass 1.76, glass 2.43, fins 1.99, roof 4.60 /255. `shots/real-estate-sheet-hover.jpg` |
| Nhãn khi tap cảm ứng (iPhone 13) | PASS | Tap (120,350) → `roof` value 0.95, thẻ "Cantilever Slabs". Sau 2.5 s tự xóa. Vuốt ngang → yaw +1.305, scroll không đổi. Vuốt dọc → scroll +0.068. `shots/real-estate-390-tap-label.jpg` |
| Scroll mượt + khôi phục | PASS | Cuộn ngược 0.75/0.5/0.25/0: Δpos = Δtarget = 0.0000. Jitter 40 nhịp wheel ngẫu nhiên rồi `scrollTo(0.3)` → Δ = 0. Wheel 0→1→0 về đúng 0. Có vài khung > 50 ms (khựng nhẹ, đo trên dev). `shots/real-estate-sheet-scroll.jpg`, `real-estate-jitter-restored-030.jpg` |
| Không crash/trắng | PASS | 0 error ở 1440, 1920 và iPhone 13. `scrollWidth` không vượt `innerWidth`. |
| Không dùng ảnh/video giả 3D | PASS | Vòm trời là HDRI. Nhà, cây, cỏ đều là hình học thật. |
| Không low-poly/cartoon làm sản phẩm cuối | **SÁT NGƯỠNG: vỏ nhà đạt / cây + nội thất không đạt** | Vỏ nhà dùng scan thật. Cây là thẻ cắt giấy, có dither răng cưa, thân trơ. Nội thất là sofa/giường/ghế dạng hộp (`real-estate-scroll-fwd-0500.jpg`, `real-estate-zoom-p25.png`). |

## Danh sách lỗi (theo mức nghiêm trọng)

1. **Cây tiền cảnh khi orbit trông như lỗi render.** Khi xoay ở mốc 0%, hướng 90°/135°/180°, tán cây chắn trước ống kính bị "làm mờ" bằng dither dạng sọc răng cưa thô. Khối tán gần đen che 30–45% khung, đè lên logo HALCYON. Bóng của cây đã mờ vẫn in trên cỏ như một vệt bóng trôi.
   - Bằng chứng: `shots/real-estate-orbit-p0-135.jpg`, `real-estate-orbit-p0-180.jpg`, `real-estate-sheet-orbit-p0.jpg`.
   - Cách sửa:
     - Thay ordered/zigzag dither bằng blue-noise hoặc IGN, kết hợp alpha-to-coverage + MSAA. Hoặc fade nhanh hẳn về 0 (ẩn instance) khi tán vào vùng 7 m.
     - Không đặt cây trong vòng bán kính orbit hero (≈ 46 m quanh tâm), hoặc đẩy camera ra ngoài cầu tán.
     - Cây đã fade thì loại khỏi shadow map (render lại shadow một lần, hoặc tách layer).
2. **Thân/cành cây trơ trụi chĩa lên trên mái ngay ở khung hero.** Trông như cột ăng-ten hoặc gạc nai, dễ thấy trên cả desktop và mobile. Nguyên nhân có vẻ là tán bị fade (vì che nhà) nhưng thân vẫn hiện.
   - Bằng chứng: `real-estate-hero-1440.jpg` (≈ x940,y290 và x1330,y270), `real-estate-zoom-p0.png`, `real-estate-390-tap-label.jpg` (3 chạc cây trên cánh phải), `real-estate-sheet-1920.jpg` ô 1.
   - Cách sửa: fade thân và tán cùng một alpha theo instance. Hoặc dời hoặc bỏ các cây phía sau nhà nằm trên trục ống kính hero.
3. **Cây nói chung giống bìa cứng.**
   - Hiện trạng: thông bên trái là silhouette xám phẳng; cây lá rộng là cụm thẻ lá lốm đốm; ban đêm chỉ còn khối đen. Mẫu có rặng cây mềm, ấm, có chiều sâu.
   - Bằng chứng: `real-estate-zoom-p0.png`, `real-estate-scroll-fwd-1000.jpg`.
   - Cách sửa:
     - Cần mô hình cây photoreal (GLB/scan), phải xin Founder duyệt trước.
     - Trong lúc chờ: dùng 3–4 lớp cây với aerial perspective ấm (sương màu hoàng hôn, không xám), normal hình cầu cho tán, translucency ngược sáng, biến thiên tint theo instance, và viền sáng vàng ở mép tán phía mặt trời.
4. **Ánh sáng chưa ra hoàng hôn vàng của mẫu.**
   - Hiện trạng: sương xám tím phủ toàn cảnh, mặt nhà không có nắng vàng chiếu xiên. Sàn đua và trụ đá chỉ được thắp bằng đèn trong nhà. Bầu trời thiếu dải chân trời cam rực.
   - Bằng chứng: `real-estate-hero-1440.jpg` so với `reference/v2/real-estate-ref-1.webp`.
   - Cách sửa:
     - Fog ấm hơn (#d8b08a gần chân trời) và loãng hơn ở cự ly gần.
     - Key light vàng cam ở góc thấp, chiếu xiên từ trái-sau để tạo viền sáng trên fascia và mép đá.
     - Tăng environmentIntensity cho kính để kính phản chiếu trời cam.
     - Thử tone mapping AgX/Neutral, exposure +0.2.
5. **Nội thất low-poly và có đốm sáng xanh lá lạ.**
   - Hiện trạng: sofa, giường, ghế ăn là khối hộp không bo cạnh. Tường trong nhà phát sáng cam phẳng. Phòng ngủ và phòng khách ở mốc 50% có quầng đèn xanh lá.
   - Bằng chứng: `real-estate-scroll-fwd-0500.jpg` (≈ x420,y440 và x420,y640), `real-estate-zoom-p25.png`.
   - Cách sửa: thêm bevel, vải có texture, contact shadow. Tìm và đổi màu nguồn sáng xanh. Nếu muốn thay bằng nội thất GLB thì phải xin duyệt tài sản.
6. **Mặt sau và mặt hông nghèo chi tiết.** Cửa sổ là tấm cam đục phẳng, không khung, không có phản chiếu kính. Hông tây gần như là một hộp đá trơn. Một khối "kính" mờ lơ lửng trên mái khi nhìn từ phía sau.
   - Bằng chứng: `real-estate-orbit-p0-180.jpg`, `real-estate-sheet-orbit-p100.jpg`.
   - Cách sửa: dùng `glazing()` cùng vật liệu kính + interior card (hoặc interior mapping) cho mọi ô cửa, và thêm lam/ốp gỗ để chia nhịp các mặt phụ.
7. **Cỏ tối và đều màu, ngọn cỏ thưa nhọn, không thấy sọc cắt ở hero.** Mẫu có cỏ sáng mượt, có sọc, được nắng chiếu ấm.
   - Bằng chứng: `real-estate-zoom-p0.png`, `real-estate-zoom-p25.png`.
   - Cách sửa: nâng albedo lên khoảng 15–25%, cho sọc cắt cỏ rõ hơn ở tầm xa, nhuộm ấm theo hướng nắng, giảm độ đen ở chân ngọn cỏ.
8. **Hover thỉnh thoảng bị kẹt.** Khi pointer nhảy một bước từ phần này ra trời, nhãn và giá trị vẫn giữ (pool ở mốc 75%, fins). Rê tiếp sang góc (5,5) vẫn không xóa, chỉ hết khi rê vào phần khác. Tỷ lệ 3/13 lần nhảy; rê dần dần thì 0/24.
   - Bằng chứng: `shots/real-estate-judge-log.json` → `extra2.hoverSeq75` (pool → sky → sky2 → corner vẫn là `pool`) và `desktop.hover["0.75"].pool.afterLeave`.
   - Cách sửa: không chỉ dựa vào R3F `onPointerOut`. Khi `pointerIn` và camera đứng yên, gọi `pick()` mỗi 3–4 khung và `clearHover()` nếu không trúng gì.
9. **Mức phản hồi hover không đều.** Mass/glass/fins rất nhạt (Δ 1.8–2.4/255). Roof lại đổi cả sàn đua sẫm thành mảng kem phẳng, trông như đổi sơn chứ không phải ánh sáng.
   - Bằng chứng: `real-estate-sheet-hover.jpg`, `real-estate-390-tap-label.jpg`.
   - Cách sửa: chỉ rim ở mép + một vệt sweep ấm (như beauty), cho roof dùng rim thay vì làm sáng albedo, và tăng STRENGTH cho glass/fins.
10. **Copy và rail mâu thuẫn.**
    - Ở 12,5%: copy ghi "Ground · Arrival" nhưng rail ghi to "ROOF" (`real-estate-scroll-fwd-0125.jpg`).
    - Ở 62,5%: copy ghi "Roof · Infinity / Hồ tràn bờ" trong khi camera đang nhìn suite tầng 1 (`real-estate-scroll-fwd-0625.jpg`).
    - Cách sửa: giữ nhãn rail ở Overview cho tới khoảng 0.2. Chọn copy theo `railOf()` thay vì `round(p·4)`, hoặc thêm copy riêng cho Suite.
11. **Panel rail che nhà ở 1440×900.** Panel kính mờ bên phải phủ lên cánh garage và cột đá. Chữ copy đè lên sofa ở mốc 50%.
    - Bằng chứng: `real-estate-hero-1440.jpg`, `real-estate-scroll-fwd-0125.jpg`, `real-estate-scroll-fwd-0500.jpg`.
    - Cách sửa: dịch target sang trái hoặc tăng `fitAspect` khi viewport ≤ 1440, thu hẹp rail, thêm scrim sau khối copy.
12. **Khựng nhẹ khi cuộn (dev).** p95 27.3 ms, worst 93.4 ms, 20 khung > 50 ms. Builder báo bản production còn worst 53–80 ms. Cách sửa: giảm overdraw của thẻ lá (cây gần ống kính) và cỏ 90k ngọn, kiểm tra lại PerformanceMonitor flip DPR khi đang cuộn.
13. **Biến thể Board Concrete trông loang như đá cẩm thạch xám ở các trụ** (`real-estate-variant-p25-2.jpg`). Cách sửa: giảm tương phản albedo, thêm vân ván khuôn ngang.

## Đủ chuẩn giới thiệu khách hàng?

**KHÔNG.** Cơ chế tương tác và scroll storytelling đã chắc và giữ trọn tinh thần v1. Khối kiến trúc cũng nhận ra ngay là ngôi nhà trong ảnh mẫu. Nhưng ở góc hero đã có thân cây trơ chĩa lên mái. Khi xoay quanh nhà thì gặp tán cây đen sọc răng cưa che gần nửa khung. Nội thất là khối hộp, cỏ và cây trông như game. Ánh sáng xám sương chứ không phải hoàng hôn vàng. Khách hàng nhìn sẽ thấy "render realtime đẹp", không thấy "ultra-luxury photoreal".

## So với ảnh mẫu (độ giống ≈ 55%)

- **Khớp:**
  - Bố cục 2 khối mái bằng, cánh garage lệch bên phải.
  - Sàn đua bê tông sẫm, đèn âm trần.
  - Trụ đá khối, ốp gỗ ấm, kính sàn-trần, lan can kính không khung.
  - Ống khói đá, lam đứng ở khe giữa, cửa garage gỗ ngang.
  - Hiên đá trước có sofa và bàn ăn; ánh nội thất ấm; bãi cỏ rộng phía trước; rừng cây phía sau.
- **Không khớp:**
  - Ánh sáng: mẫu có bầu trời trong, chân trời cam vàng và nắng chiếu nhẹ lên mặt nhà; v2 phủ sương xám tím, mặt nhà thiếu nắng.
  - Cây: mẫu là silhouette mềm, tối ấm; v2 là bìa cứng xám, thân trơ trên mái.
  - Cỏ: mẫu sáng mượt có sọc cắt; v2 xanh tối, ngọn thưa.
  - Kính: mẫu phản chiếu trời; v2 ít phản chiếu.
  - Khung hình: mẫu dọc, góc thấp sát cỏ, nhà chiếm khoảng 80% bề ngang; v2 ngang, rừng cây chiếm nhiều diện tích hơn. Chấp nhận được vì là website.
  - Hồ tràn trên mái và kịch bản đêm là phần kế thừa v1, không có trong mẫu, nên không trừ điểm.
