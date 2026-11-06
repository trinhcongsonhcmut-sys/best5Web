# AUTOMOTIVE_VISUAL_GAP_REPORT — route `/automotive` (AXIOM GT) so với tham chiếu V4

> **CẬP NHẬT 05/11/2026:** Founder giữ hướng **hoàng hôn đường đèo** (không chuyển sang studio).
> - §1–§3 vẫn đúng: là chẩn đoán vì sao trông "cartoon".
> - Cột "lớp xử lý" ở §4 và dự báo ở §6 viết theo hướng studio cũ, **đã được thay** bằng `AUTOMOTIVE_HYBRID_PIPELINE.md` §3, gồm 10 điểm sửa trong thế giới hoàng hôn.
> - Dự báo mới:
>   - khoảng 86–90 nếu đạt các nghiệm thu ở Stage 2 của EXECUTION_PLAN;
>   - trần của thế giới này thấp hơn studio, chủ yếu do HDRI 2K và mặt đất chiếu.

- Tác giả: automotive-architect (Opus). Ngày 05/11/2026.
- Không sửa mã. Ảnh do tôi tự chụp.

## 0. Điều kiện đo và bằng chứng

- **Server:** `npx vite --port 5197 --strictPort` (dev), đã dừng sau khi chụp. Port 5197 đã được giải phóng.
- **Công cụ chụp:** `src/demos/automotive/tools/shots.mjs`, Chrome headless `--use-angle=d3d11`, Intel HD 530, DPR 1.
- **Ảnh desktop 1440×900:** `automotive-flagship/gap-shots/desktop/`
  - `p0000, p0125, p0250, p0500, p0625, p0750, p1000.jpg`
  - `variant-0..3.jpg`
  - sheet: `gap-shots/sheet-desktop.jpg`
  - crop: `gap-shots/crop-carmine-hero.jpg`, `gap-shots/crop-rear-075.jpg`
- **Ảnh mobile 390×844:** `gap-shots/mobile/p0000.jpg`, `p0500.jpg`.
- **Số đo dev**, chỉ để tham khảo, không phải số production:

| | ready | FPS theo mốc |
|---|---|---|
| Desktop 1440×900 | 7,8 s | 0 %: 58,1 · 12,5 %: 59,5 · 25 %: 61,6 · 50 %: 50,0 · 62,5 %: 54,3 · 75 %: 52,8 · 100 %: 60,1 |
| Mobile 390 | 6,8 s | 73–74 |

- **Lỗi:** 0 error. Chỉ có 1 warning `THREE.Clock deprecated`.
- **Trạng thái mã:** `npx tsc --noEmit` qua (exit 0). Vòng sửa "terrain HDRI" bị dừng giữa chừng nhưng mã vẫn nhất quán: `World.tsx` đã dùng `evening_road_01_2k.hdr` + `GroundedSkybox`.
- **Bộ QC 10/10 chưa được chạy lại** trên mã hiện tại ⇒ trạng thái test **chưa xác nhận**.
- **Điểm giám khảo trước:** v2 vòng 1 = 70, v2 vòng 2 = 73 (`qc-evidence/judge/v2/…`).

## 1. Kết luận nhanh

Phần **tương tác/chuyển động** đạt chuẩn và phải giữ nguyên: orbit 360°, 4 biến thể, hover, cuộn xuôi/ngược Δ = 0, cảm ứng.

Phần **hình ảnh** đọc như "CG thời gian thực / minh họa", không ra "ảnh quảng cáo". Gốc rễ không nằm ở một vài tham số. Nó nằm ở **thế giới ánh sáng** đã chọn: hoàng hôn ấm, tương phản thấp, phông dựng bằng shader/skybox chiếu. Thế giới này:
- không tạo được phản chiếu sắc;
- nhuộm cam toàn khung;
- không có tiếp xúc mặt đất thật.

Model CarConcept là trần thứ hai, nhưng **chưa phải nút thắt** ở khung trung/xa.

## 2. Vì sao trông "cartoon" — 10 nguyên nhân cụ thể (xếp theo mức ảnh hưởng)

| # | Nguyên nhân | Bằng chứng | Cơ chế trong mã |
|---|---|---|---|
| 1 | **Không có phản chiếu sắc trên sơn.** Pearl và carmine chỉ có gradient mềm, không có "đường" phản chiếu nào chạy dọc cửa/capo như ở `hero_01_front` hay video. | `p0000.jpg`, `crop-carmine-hero.jpg` | Môi trường IBL là ảnh toàn cảnh hoàng hôn đã "grade" (`World.tsx` GRADE_FRAG). Trời là gradient ấm tương phản thấp, không có nguồn sáng hình học nào để phản chiếu. |
| 2 | **Toàn khung một tông cam/nâu**, giống bộ lọc màu. Xe không phải mảng màu nổi bật duy nhất (ngược với video). | sheet desktop | `HAZE #dc9f6c`, fog 55–360 m, grade ấm cả trời lẫn đất, ACES + exposure 0,88 làm giảm bão hòa và kéo đỏ về nâu. Đo: carmine `#7a0a12` hiển thị ra nâu mận. |
| 3 | **Nửa dưới xe "đen chết"**: lốp, mâm, ốp sườn, gầm gần như #100c0a, không có cấu trúc specular. Silhouette đọc như hình cắt giấy. | `crop-carmine-hero.jpg`, `crop-rear-075.jpg` | `rimDark #0d0e10` metalness 0,1; lốp roughness 1 và env 0,3; nguồn sáng chính ngược sáng (SUN ở −Z, sau xe). Mặt hướng camera không có key light. |
| 4 | **Không có tiếp xúc mặt đất thật.** Bóng xe là một vệt mờ bake bằng blur 2 lần. Không có AO tối ngay dưới lốp, không có phản chiếu xe trên sàn ⇒ xe "trôi". | `p0000.jpg` (vùng dưới lốp), `p0750.jpg` | `useShadowBake` (Car.tsx): depth → blur 3,2/1,4 → alpha. Đường không có reflection. |
| 5 | **Phông nền minh họa.** Ảnh HDRI 2K chiếu lên mặt đất bị kéo giãn và nhòe. Dãy núi là shader dải màu. Bụi cây là model "lite" đứng lẻ như bìa các-tông. | `p0000.jpg` (cây hai bên), `p0500.jpg` (bụi cây "bay" ở chân trời) | `GroundedSkybox` (radius 380, height 1,9), `Ridges` (2 dải sóng sin), `Shrubs` (14 cụm). |
| 6 | **Kính tối như tấm nhựa đen**, không thấy nội thất. Ở mọi tham chiếu, nội thất đọc được qua kính. | `p0000.jpg`, `p0750.jpg` | Kính `#050608`, opacity 0,86, không có transmission. |
| 7 | **Hiệu ứng "fake" chồng lên PBR**: rim nắng Fresnel cam (`sunRim`), hue shift ngọc trai, dải sweep screen-space, hạt bụi vàng, vệt đèn pha vẽ trên đường. Mỗi thứ nhỏ, nhưng cộng lại làm vật liệu trông "được tô". | `materials.ts` paintShader; `Scene.tsx` Dust/DustTrail | Shader chèn vào `opaque_fragment`, cộng thẳng vào `outgoingLight`. |
| 8 | **Không có ngôn ngữ ống kính**: không DOF, không bloom thật cho DRL/đèn hậu, không vignette, không grain. Ảnh "quá sạch" kiểu realtime. | mọi ảnh | Không có pipeline postprocessing ở automotive. |
| 9 | **Giới hạn của model** (xem ASSET_DECISION). Tổng ~213 k vertex, đèn pha `BodyHeadlights` chỉ 288 vertex, cửa ~2,6 k vertex, lốp là ống + normal map, nội thất đơn giản, mép cửa không có độ dày. Ở khung xa thì ổn. Khi cận cảnh hoặc ở cảnh .02 thì lộ "mô hình tháo rời". | `p0500.jpg` (cửa mở, khe hở, nội thất nâu) | Asset đã qua RapidPipeline (README Khronos: bánh giảm từ 10 260 xuống 324 vertex, bỏ chi tiết < 3 cm). |
| 10 | **Beat .01 "lái xe" trong studio thiếu tham chiếu thật**: đường cuộn, bụi bốc sau lốp. Trên nền nhòe, chuyển động này trông như game. | `p0250.jpg` (vệt sáng trên đường ở 25 %) | `Road` cuộn UV, `DustTrail` 220 hạt. |

## 3. Lỗi hiển thị riêng (cần sửa, độc lập với hướng nghệ thuật)

- **[Cao] Mobile 0 %:**
  - Một bụi cây đứng ngay trước camera, che nửa xe.
  - Xe bị cắt ở mép trái.
  - Phía sau tiêu đề có một **đĩa/bán nguyệt cam cực lớn**. Nhiều khả năng đây là phần trời quanh mặt trời trong ảnh skybox chiếu, nhìn qua FOV dọc (chưa xác minh nguyên nhân).
  - Bằng chứng: `gap-shots/mobile/p0000.jpg`.
  - Nếu chuyển sang studio như đề xuất, lỗi này tự biến mất.
- **[Trung bình] Desktop 50 %:** cửa trái xoay lên gần thẳng đứng và đè vào nền trời; bụi cây lơ lửng ở chân trời (`p0500.jpg`).
- **[Thấp] Chữ:**
  - Nhãn "PEARL WHITE" trắng nằm trên nền sáng.
  - Dòng gợi ý góc phải dưới gần như không đọc được.
  - Tiêu đề hero AXIOM chồng lên dải núi.
  - Các lỗi này giám khảo đã nêu và vẫn còn.

## 4. Bảng khoảng cách so với tham chiếu (theo hướng đã chốt "Graphite Studio · Candy Red")

| Hạng mục | Tham chiếu (mục tiêu) | Hiện tại | Khoảng cách | Lớp xử lý |
|---|---|---|---|---|
| Phản chiếu sơn | Hình thang softbox + line-light sắc chạy dọc thân | Gradient mềm, không có đường | **Rất lớn** | Lightformer env (realtime) / area light (Cycles) |
| Màu sơn | Candy red sâu, highlight nóng | Đỏ nâu, xám hóa | Lớn | NeutralToneMapping + vật liệu candy |
| Set/phông | Showroom xám, sàn bóng tối | Đồi pastel + đất nâu | **Rất lớn** | Đổi thế giới |
| Tiếp xúc đất | AO đậm dưới lốp, phản chiếu mờ | Vệt blur | Lớn | Bake từ Blender + reflector có điều kiện |
| Bánh/lốp | Mâm sáng tương phản, lốp có texture | Đen bệt | Lớn | Vật liệu + key light phía camera |
| Kính | Trong, thấy nội thất | Đen 86 % | Trung bình | Vật liệu |
| Đèn | DRL/đèn hậu có quầng (bloom) | Emissive phẳng | Trung bình | Bloom có ngưỡng |
| Ngôn ngữ ống kính | DOF macro, vignette, grain | Không có | Trung bình | Prerender (macro) + post nhẹ |
| Nhịp dựng | wide ↔ macro, lights-on | Chỉ có camera realtime liên tục | Lớn | Editorial insert + opener prerender |
| Chi tiết model | Đèn pha projector, mép cửa dày | Đèn 288 vertex, mép mỏng | Trung bình (chỉ khi cận cảnh) | Chọn góc máy + mesh gốc CC0 (xem ASSET_DECISION) |

## 5. Phải giữ nguyên (không được hồi quy)

- 7 PoseStop camera (`Scene.tsx` BASE), quy tắc portrait `stopsFor`, `limits`, `fitAspect 1.5`, `topViewSafe`.
- 5 mốc 0/25/50/75/100, HUD chapter `.01/.02/.03`, progress bar, typography Barlow Condensed / IBM Plex Mono, dòng ghi công CC BY 4.0.
- Biến thể đổi **vật liệu thật** (`bridge.registerMaterial('primary'…)`), hover theo bộ phận (proxy `HIT_*`), cuộn là hàm thuần của p, reveal .02 có thứ tự cửa → bánh → vỏ.
- `holdReady/releaseReady` (cổng ready chỉ mở khi xe đã bake và compile xong).

## 6. Dự báo

| Cách tiếp cận | Điểm photoreal dự kiến |
|---|---|
| Chỉ chỉnh tham số trên thế giới golden-hour | 75–80 (6+ vòng đã chứng minh trần này) |
| Chuyển sang Graphite Studio realtime + lớp prerender | **88–92** nếu đạt các acceptance trong EXECUTION_PLAN |
| Thêm mesh gốc CC0 cho prerender | thêm khoảng 1–2 điểm ở cảnh cận |
