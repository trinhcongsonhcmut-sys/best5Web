# BUILDER_BRIEF — hợp đồng cho mọi agent dựng demo

Bạn dựng **một** demo trong `src/demos/<id>/`. Spec gốc: `../MASTER_PROMPT.md` (PHẦN V–VII). Nghiên cứu mẫu: `REFERENCE_INDEX.md`, `reference/<id>-analysis.md`, `reference/PALETTES.md`. Bộ skill `threejs-*`, `frontend-design`, `impeccable` đã cài — dùng chúng.

## Luật cứng
1. **Chỉ ghi trong `src/demos/<id>/**`** (và `src/demos/<id>/LIB_REQUESTS.md` nếu cần đổi `src/lib`). KHÔNG sửa `src/lib/**`, `src/App.tsx`, `package.json`, `tests/**`, file của demo khác. Không chạy `npm install` — nếu cần gói mới, ghi vào `LIB_REQUESTS.md`. (Có sẵn: three, @react-three/fiber, drei, postprocessing, gsap, react-router, font `@fontsource*` — xem `package.json`.)
2. **Mô hình phải là 3D thật, đủ đẹp để nghiệm thu** — không placeholder, không ảnh/video thay trải nghiệm. Không có Blender: dựng bằng code (LatheGeometry theo profile điểm, ExtrudeGeometry, TubeGeometry/CatmullRom, RoundedBox, instancing, noise displacement, ghép nhiều mesh có chi tiết: vát cạnh, khe, ốc, logo tự vẽ…). Không dùng logo/asset có bản quyền; asset ngoài chỉ khi license sạch + ghi `ASSET_LICENSES.md` (nói với điều phối viên).
3. **Không tải gì từ mạng lúc chạy** (không HDR CDN, không Google Fonts). Env bằng `<Environment frames={1}><Lightformer/>…</Environment>`; font bằng `import '@fontsource/…'`/`@fontsource-variable/…` trong CSS/TS của demo.
4. Mỗi demo **khác hẳn** 4 demo còn lại: phong cách nghệ thuật, camera, ánh sáng, typography, bố cục, nhịp timeline. Không dựng "template" chung.
5. Không backend, không nội dung dài, không tính năng thương mại (giỏ hàng, đặt bàn, đại lý…).

## API đã có (`src/lib`, đóng băng)
```tsx
import { ShowcasePage, VariantPicker, useStageIndex, type DemoMeta } from '../../lib/ui';
import { Stage } from '../../lib/Stage';                       // <Canvas> chuẩn: dpr, tone mapping, Suspense, probe FPS/ready
import { CameraRig, orbit, hasUserInputRecently } from '../../lib/CameraRig'; // camera = đường Catmull-Rom theo scroll + offset orbit
import { scrollState } from '../../lib/scroll';                // scrollState.smooth = tiến độ 0..1 đã scrub bằng GSAP ScrollTrigger
import { addRim, useHoverRim } from '../../lib/rim';           // hover lighting trong shader vật liệu
import { bridge } from '../../lib/bridge';                     // cầu nối QC
import { variantStore } from '../../lib/store';                // variantStore.use(s=>s.index)
import { damp, range, smoothstep, easeInOutCubic, lerp, clamp, type PoseStop } from '../../lib/math';
```
- Trang: `<ShowcasePage meta={META} scene={<Stage …>…</Stage>} overlay={<DOM layers/>} />`. `META.scrollVh` quyết định độ dài cuộn (timeline trải trên `scrollVh-100` vh). CSS `var(--p)` (0..1) có trên root để DOM layer chạy theo scroll; `useStageIndex()` (0..4) để đổi nội dung chữ ở các mốc.
- **Timeline ≥ 5 mốc** 0/25/50/75/100%: `CameraRig stops={[{t:0,pos,target,fov},…]}` + animation vật thể/ánh sáng/vật liệu viết trong `useFrame` đọc `scrollState.smooth` (dùng `range(a,b,p)`, `smoothstep`). Cuộn ngược phải khôi phục đúng (hàm thuần của p ⇒ tự nhiên đúng; đừng tích lũy trạng thái theo thời gian cho thứ phụ thuộc scroll).
- **Orbit 360°**: do `CameraRig` lo (kéo chuột; chạm: chỉ vuốt ngang; nút zoom/reset trong HUD; double-click reset). Truyền `limits={{ elevMin, elevMax, dollyMin, dollyMax, yawRange }}` nếu tài sản không hoàn chỉnh. `fitAspect` để chỉnh khoảng lùi khi màn hình dọc (mobile 390×844 — vật không được bị cắt).
- **Hover lighting**: tạo vật liệu `MeshPhysicalMaterial`/`MeshStandardMaterial`, bọc `addRim(mat,{color,power})` ⇒ `{material, uniforms}`; trong component `const {bind} = useHoverRim(() => [uniforms…], 'id', strength)` rồi `<group {...bind}>`. Có thể cộng thêm emissive/intensity ánh sáng riêng, nhưng **không** CSS filter lên canvas.
- **Biến thể màu** ≥ 3: đổi trực tiếp màu/vật liệu 3D (lerp trong `useFrame` bằng `damp`), giữ clearcoat/roughness/phản chiếu. UI dùng `<VariantPicker variants={META.variants}/>` hoặc tự làm nhưng giữ `data-testid="variant-<i>"` trên từng nút.
- **Cầu nối QC (bắt buộc)** — để bộ QC đo được trạng thái thật:
  - `bridge.registerMaterial('primary', material, uniforms.uRim)` cho vật liệu chính **đổi theo biến thể** (unregister khi unmount). Có thể đăng ký thêm khóa khác.
  - Hover vào vật thể chính ở **mốc 0%** (hero, vật nằm quanh giữa khung hình) phải lên `bridge.state.hover.value > 0.4` (dùng `useHoverRim` là đủ).
  - `bridge.state.extra.<khoá> = …` cho trạng thái riêng (vd `scene:'cafe'|'restaurant'`, `exploded:0..1`).
  - `bridge.state.ready` do `Stage` bật khi asset xong; đừng chặn nó.
- Ánh sáng/shadow riêng cho ngành; postprocessing (bloom/DOF/vignette…) **chỉ khi tạo khác biệt rõ** — máy test là iGPU (Intel HD 530): tránh nhiều pass nặng, transmission nhiều lớp, >300k tam giác, DPR cao. Mục tiêu desktop ~60 fps, mobile ~30.

## Thước đo chất lượng (người chấm sẽ soi)
Không: vật bị cắt khung · texture mờ/vỡ/sai tỷ lệ · ánh sáng cháy/mất chi tiết · camera quá gần · particle rối · scroll quá nhạy/chậm · UI giống template AI phổ thông · mô hình chỉ đẹp một góc (xoay 360° phải ổn ở mọi hướng, không lộ lỗ/mặt trong/mép nhọn) · hover nhấp nháy · giật khi scroll/đổi mốc.
Chữ: ngắn, có chủ đích (tiêu đề + 1–2 dòng/mốc), typography đặc trưng ngành, đủ tương phản trên nền cảnh 3D, không chồng lên vật thể chính, mobile 390×844 đọc được.

## Tự kiểm tra trước khi báo xong
```
npx tsc --noEmit
QC_MODE=dev QC_PORT=<cổng riêng của bạn> QC_ID=<id> npx playwright test -g "<id>"      # 9 test desktop + 1 mobile
```
(Cổng riêng: beauty 5191, fnb 5192, real-estate 5193, fashion 5194, automotive 5195.) Đọc ảnh trong `qc-evidence/shots/<id>/` bằng mắt: so với `reference/<id>-analysis.md`, sửa đến khi đẹp. Báo cáo cuối (≤ 250 từ, tiếng Việt): đã dựng gì, kỹ thuật chính, kết quả test **thật** (pass/fail từng test + FPS kèm điều kiện), điểm yếu còn lại, file đã tạo. Không tự tuyên bố "PASS" thay Visual QC Judge.
