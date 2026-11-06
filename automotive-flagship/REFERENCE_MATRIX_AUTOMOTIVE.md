# REFERENCE_MATRIX_AUTOMOTIVE — Automotive flagship (Master Prompt V4)

- Tác giả: automotive-architect (Opus).
- Ngày: 05/11/2026. **Bản sửa theo quyết định của Founder cùng ngày.**
- Nguồn tham chiếu: `references/automotive/`.
- Frame trích từ video: `automotive-flagship/ref-frames/` (`contact_1fps.jpg`, `contact_shots.jpg`, `shot_XX_t*.jpg`). Chỉ dùng local.
- Đề nghị thêm `ref-frames/` vào `.gitignore` vì đây là hình của thương hiệu thật.

> **Quy tắc pháp lý:** cả 5 tham chiếu đều là một hypercar của thương hiệu thật.
> - Chỉ học: **vật liệu (sơn/kính/kim loại), camera, mức độ luxury**.
> - Không dùng:
>   - logo, khiên, biển số có tên, cờ;
>   - silhouette và đồ họa thân xe;
>   - đèn hậu tròn, cụm ống xả, mâm 5 chấu kép;
>   - caliper vàng.

> **Layer 1:** repo không có văn bản V4 gốc. Tôi dùng 5 nhóm sau, orchestrator đối chiếu lại nếu cần:
> - L1-A Product hero
> - L1-B Material/finish
> - L1-C Light & set
> - L1-D Camera & composition
> - L1-E Motion & edit rhythm

## 1. Ma trận từng tham chiếu

Hướng nghệ thuật đã chốt là **hoàng hôn đường đèo** (mục 3). Vì vậy:
- phần "set/ánh sáng" của các tham chiếu **không dùng nguyên**;
- chỉ chuyển ý của nó sang ánh nắng chiều.

| Tham chiếu | Loại | Ưu tiên | Học (chuyển sang hoàng hôn) | Không học |
|---|---|---|---|---|
| `hero_01_front.jpg` (1920×1080). CG render trên backplate bê tông, trời âm u | L1-A, L1-B | **P1** | • Camera 3/4 trước cao khoảng 1,7–2 m, nhìn xuống 12–15°, khoảng 50 mm, xe chiếm khoảng 85 % bề ngang (dùng cho still hero).<br>• Phản chiếu trời lớn, liền, không cháy.<br>• AO đậm dưới lốp, xe "đè" xuống đất.<br>• Tương phản vật liệu: sơn bóng / carbon có vân / mâm sáng / lốp xám than có texture.<br>• Kính trong, thấy nội thất. | Bê tông và trời âm u (thế giới khác). Silhouette, đèn, logo, mâm, caliper vàng |
| `hero_01_up.jpg`. Top-down, cửa dihedral mở, phông đỏ | L1-A, L1-D | P3 | Vệt specular mảnh chạy dọc đường gân thân xe. Ở hoàng hôn, vệt này là **đường chân trời và rim nắng dọc vai xe**. | Phông đỏ monochrome, silhouette cabin, logo, sọc capo |
| `hero_02_front.jpg`. Cận mũi xe, cửa mở, sa mạc nắng | L1-B | **P1** (sơn) | • Hành vi **candy red dưới nắng gắt**: lõi sâu, highlight nóng, phản chiếu môi trường sắc như gương (áp cho biến thể Carmine dưới nắng thấp).<br>• Crop sát dọc. | Phông HDRI nhòe (lỗi của ảnh), logo |
| `hero_03_rear.jpg.jpg`. Đuôi đối xứng, studio đỏ | L1-A, L1-D | P2 | • Đuôi đối xứng tele (still/khung .03).<br>• Vệt specular dọc mép boong sau.<br>• Đèn hậu có quầng. | **Biển số mang tên thương hiệu**, logo, đèn hậu tròn, ống xả, phông đỏ |
| `automotive_reference.mp4`. 586×980, 30 fps, 17,7 s; quay màn hình clip 9:16 | L1-E, L1-D | P3 (để sau) | • Nhịp wide ↔ macro, khoảng 1,3 s/shot (14 shot).<br>• Khoảnh khắc "reveal".<br>• Macro DOF nông, push chậm.<br>Chỉ dùng khi Founder mở lại phần cinematic. | Showroom, nội thất có logo, cờ, nén kém, taskbar |

## 2. Áp vào hoàng hôn

| Bài học | Cách làm trong thế giới hoàng hôn |
|---|---|
| Phản chiếu sắc trên sơn (lỗi số 1 của giám khảo 70/73) | Dùng **ảnh trời thật** của HDRI làm IBL, không dùng gradient tự vẽ. Giữ tách bạch trời sáng / đất tối ⇒ có một **đường chân trời sắc chạy dọc cửa và capo**. Mặt trời thấp tạo rim mảnh dọc vai và mép mui. |
| Xe nổi khỏi nền | Nền và sương mờ dần về xa. Xe là vùng tương phản cao nhất khung hình. Nửa dưới xe không bị đen bệt. |
| Tiếp xúc đất | Bóng dài theo hướng nắng + AO dưới lốp, bake bằng Cycles |
| Tương phản vật liệu | Mâm gunmetal/bạc có env, lốp có texture, carbon có vân, kính thấy nội thất |
| Camera | Giữ storyboard realtime. Still dùng 3/4 trước cao 50 mm và đuôi tele |

## 3. Xung đột và hướng đã chốt (Founder quyết định 05/11/2026)

| Thế giới | Phán quyết |
|---|---|
| (a) Bê tông overcast | **Không dùng.** Chỉ lấy camera và tương phản vật liệu |
| (b) Studio đỏ monochrome | **Không dùng.** Chỉ lấy ý "line-light", thực hiện bằng rim nắng / đường chân trời |
| (c) Sa mạc nắng | **Không dùng phông.** Chỉ lấy hành vi sơn candy dưới nắng |
| (d) Showroom xám (video) | **Không dùng.** Nhịp dựng để sau |
| (e) Graphite Studio (đề xuất trước của architect) | **Founder bác.** Không làm |
| **Hoàng hôn đường đèo** (v2 hiện có) | ✅ **CHỐT** |

**Hướng đã chốt: "SUNSET MOUNTAIN ROAD · PEARL".**
- Tài sản đã duyệt:
  - `evening_road_01_2k.hdr` (có địa hình): nền + IBL;
  - `evening_road_01_puresky_2k.hdr`: trời sạch cho Blender;
  - `asphalt_02`;
  - `shrub_03/04`.
- Ánh sáng: nắng thấp **ngược sáng/chéo sau** (giữ `SUN` hiện tại), có **fill từ trời phía camera** để mặt trước xe không tối.
- Tone mapping: realtime dùng `NeutralToneMapping`, Blender dùng **Khronos PBR Neutral** (đã kiểm có trong Blender 5.2.3). Mục đích: không làm đỏ/trắng ngả nâu như ACES.
- **Màu mặc định: Pearl White.**
  - Khớp mẫu v2 Founder đã duyệt (xe trắng ngọc lúc hoàng hôn).
  - Trắng nhận gradient trời ấm và đường chân trời rõ nhất, đúng chất luxury lúc hoàng hôn.
  - Đo ở `gap-shots/crop-carmine-hero.jpg`: candy `#7a0a12` dưới ánh ấm hiện ra **đỏ nâu mận**.
  - **Carmine Candy giữ làm biến thể thứ 2**, chỉnh sáng và bão hòa hơn để vẫn đọc là đỏ dưới nắng ấm.
  - Graphite và Bronze giữ nguyên.
