# V2_BUILDER_BRIEF — nâng cấp photoreal (automotive · beauty · real-estate)

Đọc trước tiên: `../CURRENT_GOAL.md` (mục tiêu hiện hành, thắng mọi tài liệu cũ). Đọc cùng: `ASSET_SWAP_PLAN.md`, `BUILDER_BRIEF.md` (hợp đồng API cũ vẫn áp dụng), `baseline/v1/<id>/MOTION_SPEC.md`, `baseline/v1/<id>/baseline.json` + ảnh `baseline/v1/<id>/desktop|mobile/*.jpg`, ảnh mẫu mới `reference/v2/<id>-ref-1.webp` (xem bằng Read).

## Mục tiêu
Thay **sản phẩm 3D + vật liệu + ánh sáng** lên mức **photorealistic luxury** theo ảnh mẫu v2, **giữ phong cách chuyển động v1**: cùng 5 mốc (0/25/50/75/100 %), cùng thứ tự "beat", cùng HUD/UI/typography/bố cục, cùng cơ chế orbit 360°, đổi màu, hover, scroll xuôi/ngược. Được chỉnh camera, kích thước, pivot, keyframe cho vừa sản phẩm mới, miễn giữ tinh thần chuyển động. **KHÔNG làm lại từ đầu** UI/HUD; không đụng `src/lib/**`, `tests/**`, `package.json`, demo khác; không backend.

## Tài sản đã duyệt (local, không tải thêm gì từ mạng)
- `public/assets/models/CarConcept.glb` — CC-BY 4.0 (phải hiện dòng ghi công trên trang automotive: "Car model: CarConcept © 2024 Eric Chadwick / Darmstadt Graphics Group — CC BY 4.0"; **gỡ/ẩn logo Khronos**: mesh `License Plate` (thay bằng biển BAHA tự vẽ) và `InteriorSteeringEmblem`).
- `public/assets/hdri/{evening_road_01_puresky,belfast_sunset_puresky,studio_small_09}_2k.hdr` — CC0 (drei `<Environment files="/assets/hdri/…">`, cũng dùng làm nền/background nếu hợp).
- `public/assets/textures/<id>/<id>_{diff,nor_gl,arm}_2k.jpg` — CC0: `sandstone_blocks_05`, `brown_planks_03`, `concrete_floor_02`, `leafy_grass`, `asphalt_02`. ARM = R:AO, G:roughness, B:metalness. Diffuse dùng `SRGBColorSpace`, normal/arm dùng Linear. Được phép tạo bản thu nhỏ/nén (1K, WebP/KTX2) **bằng script trong repo** (`npx gltf-transform …` hoặc sharp/canvas) đặt cạnh bản gốc; ghi lại cách làm.
- Không dùng tài sản nào khác. Cần thêm tài sản ⇒ ghi `src/demos/<id>/LIB_REQUESTS.md`, không tự tải.

## Chuẩn chất lượng
Không low-poly lộ cạnh, không vật liệu hoạt hình. Bề mặt cong mượt, PBR đúng (màu sRGB, roughness/metalness hợp lý, clearcoat cho sơn, transmission/IOR/attenuation cho kính và chất lỏng), HDRI thật cho phản chiếu, bóng tiếp đất (ContactShadows/AO), tone mapping hợp (AgX/ACES/Neutral qua prop `tone` của `Stage`), không cháy sáng (đo: ≤ 2 % pixel cháy trên sản phẩm ở mọi mốc). Hậu kỳ chỉ khi đáng giá và rẻ (drei/postprocessing có sẵn; bloom nhẹ, SMAA, N8AO nếu đủ FPS).
**Ngân sách GPU (Intel HD 530):** bản production phải giữ **≥ 55 fps khi cuộn @1440×900** (v1: 60–72). Có thể thêm mức chất lượng tự động (giảm DPR/hậu kỳ khi chậm).

## Hợp đồng QC giữ nguyên
`bridge.registerMaterial('primary', …)` = vật liệu đổi theo biến thể (≥ 3 biến thể, đổi trực tiếp trên vật liệu 3D); hover vào sản phẩm ở mốc 0 % phải đạt `hover.value > 0.4`; `bridge.state.ready` chỉ bật khi model + HDRI + texture đã tải và shader đã biên dịch (dùng `useProgress`/Suspense — Stage đã chờ `useProgress().active`); không console error.

## Tự kiểm (bắt buộc, theo đúng thứ tự)
1. `npx tsc --noEmit` (chỉ sửa lỗi của mình).
2. `QC_MODE=dev QC_PORT=<cổng> QC_ID=<id> npx playwright test -g "<id>"` ⇒ 9 desktop + 1 mobile phải pass; không sửa test.
3. Chụp v2 cùng khung với v1: chạy dev server riêng `npx vite --port <cổng>` rồi `node scripts/capture-baseline.mjs <id> --base http://localhost:<cổng> --tag v2` ⇒ `baseline/v2/<id>/`; đặt cạnh ảnh `baseline/v1/<id>/` cùng tên file và **so sánh bằng mắt** từng cặp (scroll 0…100 %, orbit 8 góc, biến thể, hover, mobile) — chuyển động/khung hình phải cùng tinh thần, chất lượng hình phải vượt rõ và gần ảnh mẫu v2.
4. **KHÔNG chạy `npm run build` / `vite preview` / cổng 5181** (orchestrator dùng để quay video và đo hiệu năng).
Cổng riêng: automotive 5195, beauty 5191, real-estate 5193.

## Báo cáo cuối (tiếng Việt, ≤ 250 từ)
Đã thay gì, kỹ thuật chính, kết quả 10 test thật, nhận xét so sánh v1/v2 có dẫn ảnh (đường dẫn), số đo pixel cháy, FPS dev kèm điều kiện, điểm yếu còn lại, file đã sửa/tạo. Không tự chấm "PASS" chất lượng hình.
