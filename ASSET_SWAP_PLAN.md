# ASSET_SWAP_PLAN — nâng 3 demo lên photorealistic luxury (giữ nguyên chuyển động v1)

> Phạm vi (quyết định của Founder, 05/11/2026): **Automotive, Beauty, Real Estate**. **Fashion và F&B tạm dừng** (đóng băng ở v1).
> Nguyên tắc: **không làm lại từ đầu**, không backend. UI, animation, scroll, hover, camera choreography của v1 là **chuẩn tham chiếu chuyển động**; mẫu Founder cung cấp là **chuẩn tham chiếu hình ảnh** (model, vật liệu, ánh sáng, độ chân thực). Chưa tự chọn và chưa thay sản phẩm nào cho tới khi Founder xác nhận mẫu và nguồn model.

## 0. Bảo toàn bản v1 (đã làm)
| Hạng mục | Vị trí | Ghi chú |
|---|---|---|
| Branch đóng băng | `showcase/baseline-v1` (commit `96dcaf4`) + tag `showcase-v1-baseline` | Toàn bộ mã 5 demo, thư viện chung, bộ QC, tài liệu, báo cáo giám khảo. Đã kiểm: 111/111 file mã trong branch **trùng byte** với cây làm việc. Ảnh QC nặng (330 MB) giữ local, không commit |
| Gói baseline (ảnh + thông số) | `baseline/v1/<id>/` | `desktop/scroll-*.jpg` (9 mốc 0→100 %), `orbit-*.jpg` (8 góc × 45°), `variant-*.jpg`, `hover-on/off.jpg`, `mobile/scroll-*.jpg`; `baseline.json` = pose camera từng mốc, **đường camera dày 41 mẫu (mỗi 2,5 %)**, số đọc orbit, thông số vật liệu `primary` từng biến thể, giá trị hover, GPU/FPS, console error — đọc thật qua `window.__baha3d` |
| Video tương tác thật | `baseline/v1/<id>/<id>.mp4` | `scripts/record-demo.mjs` (CDP screencast + ffmpeg): hover → orbit 360° → đổi màu → cuộn 0→100 % → cuộn ngược |
| Đặc tả chuyển động từ mã | `baseline/v1/<id>/MOTION_SPEC.md` | PoseStop chính xác, hàm theo scroll (range/smoothstep), cây đối tượng & **điểm gắn (mount point)**, vật liệu/biến thể, hover, ánh sáng, "swap points" |
| Hiệu năng v1 (production, máy rảnh) | `qc-evidence/perf-production*.md` | cuộn 60,1–72,2 fps @1440×900, idle ~75, 0 console error (Intel HD 530) |
| Điểm giám khảo v1 (vòng 6) | `qc-evidence/judge/round6/` | beauty 92 · real-estate 91 · automotive 88 · (fnb 90 · fashion 90 — tạm dừng) |

⚠ Fashion/F&B: vòng 7 bị dừng giữa chừng; mã dở dang nằm trong branch; build/tsc qua nhưng bộ QC chưa chạy lại trên mã đó.

## 1. Mẫu tham chiếu v2 Founder vừa gửi (lưu local: `reference/v2/*.webp`, gitignored)
| Demo | Mẫu | Đặc điểm hình ảnh cần đạt | Lưu ý bản quyền |
|---|---|---|---|
| Automotive | Xe thể thao điện 4 cửa màu trắng ngọc trên đường đèo lúc hoàng hôn, góc 3/4 trước thấp | Bề mặt cong liền mạch (không mặt phẳng ghép), sơn trắng ngọc + clearcoat phản chiếu trời cam, mâm đen, cụm đèn LED 4 điểm, kính mái tối, nền núi nhiều lớp mù sương, ngược sáng ấm, nhựa đường có bóng đổ tiếp đất | Mẫu là **xe thương hiệu thật có logo** ⇒ không dùng model/logo/hình dáng nhận diện của hãng; cần model **xe điện sang trọng không thương hiệu** có giấy phép thương mại |
| Beauty | Chai serum thủy tinh hổ phách 30 ml, nắp bóp nhỏ giọt trắng có gân, nhãn giấy kem, lát cam + nước bắn tung, nền trắng ấm | Thủy tinh dày có khúc xạ + màu hổ phách theo độ dày, chất lỏng bên trong, nhãn in sắc nét, cam có thịt quả trong mờ, giọt/tia nước bóng | Nhãn mẫu là thương hiệu thật ⇒ dùng nhãn BAHA. **Đổi sản phẩm từ hũ kem (v1) sang chai serum dropper** — cần Founder xác nhận |
| Real Estate | Biệt thự hiện đại 2 tầng mái bằng, sàn đua công-xôn, ốp đá + gỗ, lan can kính, nội thất sáng ấm, đèn âm trần, bãi cỏ phía trước, trời chạng vạng | Vật liệu PBR thật (đá, gỗ, bê tông) có texture độ phân giải cao, kính phản chiếu trời, ánh sáng toàn cục mềm (GI/AO), cỏ có chiều sâu, bóng đổ dài | Kiến trúc chung, rủi ro thấp; vẫn dùng mô hình/texture có giấy phép |

## 2. Nguồn model 3D — phải chọn trước khi thay (quyết định của Founder)
Mức photoreal ở 3 ảnh trên **không đạt được bằng hình khối dựng bằng code** (đã chứng minh: automotive dừng ở 88/100 sau 6 vòng, giám khảo vẫn đánh giá "low-poly kiểu tài sản game"). Cần tài sản thật:
| Phương án | Ưu | Nhược | Cần Founder |
|---|---|---|---|
| **A. Founder cung cấp GLB/glTF/FBX có giấy phép** (khuyến nghị) | Chất lượng & pháp lý chủ động | Cần nguồn | File + bằng chứng giấy phép |
| B. Thư viện miễn phí giấy phép CC0/CC-BY (model, **texture**, **HDRI**) | Không tốn phí | Model xe/serum photoreal CC0 hiếm; texture/HDRI CC0 thì dồi dào | Duyệt từng file tải (tên, nguồn, dung lượng) |
| C. Mua trên marketplace | Chất lượng cao | Phát sinh chi phí | Duyệt mua (tôi không tự mua) |
| D. Thuê 3D artist / dựng trong Blender | Đúng thiết kế BAHA | Thời gian; máy hiện **không có Blender** | Duyệt thuê/cài |
Đề xuất thực tế: **Automotive → A hoặc C** (bắt buộc model chất lượng cao, không thương hiệu). **Beauty → A, hoặc dựng lại bằng code + texture/HDRI CC0** (chai serum là hình tròn xoay — Lathe + vật liệu vật lý có thể đạt gần photoreal khi có HDRI thật). **Real Estate → giữ khối kiến trúc v1 (đã sát mẫu), thay vật liệu bằng texture PBR CC0 + HDRI chạng vạng + AO/GI baked**; model ngoài chỉ khi Founder muốn đổi hẳn kiến trúc.

## 3. Đặc tả file model cần nhận (để giữ được chuyển động v1)
- Định dạng: **GLB (glTF 2.0)** ưu tiên; FBX/OBJ sẽ chuyển đổi. Đơn vị mét, trục Y lên, mặt trước nhìn +Z. Có giấy phép thương mại; không logo/thương hiệu bên thứ ba.
- Ngân sách cho GPU tích hợp (Intel HD 530): ≤ ~300k tam giác/demo sau tối ưu (hero ≤ 200k), texture 2K (4K chỉ cho bề mặt hero), tổng tải ≤ ~25 MB nén.
- **Tên node/vật liệu bắt buộc** (để đổi màu, hover, tách lớp hoạt động — chi tiết theo `MOTION_SPEC.md` mục 7):
  - Automotive: `paint` (thân — biến thể màu), `glass`, `tyre`, `rim`, `brake`, `light_front`, `light_rear` (emissive), `trim_black`, `chrome`; **tách được** `body_upper` / `body_lower` / `chassis` + 4 `wheel_*` riêng (cho cảnh exoskeleton/tách lớp và bánh quay).
  - Beauty: `bottle_glass`, `liquid`, `dropper_cap` (+ `dropper_bulb`, `pipette`), `label`; tách được nắp/ống hút khỏi chai (cảnh mở nắp/tách lớp); cam/giọt nước có thể dựng bằng code.
  - Real Estate: `facade_stone` (biến thể vật liệu), `glass_wall`, `roof`, `timber_fins`, `pool_water`, `interior_*`; hoặc giữ hình khối v1 và chỉ thay vật liệu/texture.

## 4. Quy trình kỹ thuật khi thay (giữ chuyển động)
1. **Nhập & tối ưu**: `@gltf-transform/cli` (dedup, weld, Draco/Meshopt, resize + nén texture WebP/KTX2). Decoder Draco/Meshopt/KTX2 **tự host** trong `public/` (không gọi CDN — drei `useGLTF` mặc định tải Draco từ CDN, phải đổi).
2. **Chuẩn hóa**: tính bounding box → scale về kích thước của model v1 (xe ~5,3 m; chai/hũ theo `MOTION_SPEC`), đặt lại pivot về đúng điểm xoay v1, gắn vào **mount point** (group đang được timeline điều khiển) ⇒ PoseStop camera, orbit, hover, scroll tiếp tục chạy không đổi.
3. **Vật liệu photoreal**: sơn xe = MeshPhysical (clearcoat 1, clearcoatRoughness thấp, flake normal tinh), kính = transmission/IOR/attenuation (beauty: hổ phách theo độ dày), cao su/nhựa/kim loại tách bạch; **HDRI thật** (chạng vạng/hoàng hôn, CC0, ~2–4 MB .hdr tự host) + Lightformer giữ highlight thương hiệu của v1; ContactShadows/AO baked.
4. **Hậu kỳ có kiểm soát**: SMAA/FXAA, N8AO (AO), bloom nhẹ cho đèn, tone mapping AgX/ACES; **3 mức chất lượng** tự động theo FPS (giữ ≥ 55 fps cuộn trên HD 530).
5. **Biến thể & hover**: ánh xạ theo tên vật liệu (`paint`/`bottle_glass`/`facade_stone` = khóa bridge `primary`); hover raycast theo node; giữ nguyên chip màu, thời gian chuyển màu và rim như v1.
6. **Điều chỉnh cho phép**: camera, kích thước, pivot, keyframe được tinh chỉnh để vừa model mới, nhưng giữ thứ tự 5 mốc, hướng/nhịp chuyển động, các "beat" (hero → reveal → transformation → detail → final) đã ghi trong `MOTION_SPEC.md`.
7. **Thay từng demo trên branch `showcase/v2-photoreal`**; có công tắc `?v=1` để mở lại bản v1 tức thì khi so sánh.

## 5. Kiểm thử trước/sau (bắt buộc sau mỗi lần thay)
- `node scripts/capture-baseline.mjs <id> --tag v2` ⇒ ghép **cặp ảnh v1 | v2** cùng mốc scroll, cùng góc orbit, cùng biến thể ⇒ `baseline/compare/<id>/`; so đường camera v1/v2 (sai lệch pose theo `baseline.json`).
- Bộ `tests/qc` đủ 10 test/demo (orbit 360°, đổi màu đo trên vật liệu thật, hover, scroll xuôi/ngược, resize 3 cỡ, cảm ứng, FPS) + `scripts/measure-prod.mjs` trên máy rảnh + `record-demo.mjs` quay video mới.
- Giám khảo độc lập chấm theo thang 100 với **mẫu v2 làm chuẩn hình ảnh** và **v1 làm chuẩn chuyển động**.

## 6. Việc cần Founder quyết định
1. Ba ảnh vừa gửi có phải là **mẫu chuẩn mới** cho 3 demo không? (Beauty đổi từ hũ kem sang chai serum dropper.)
2. Nguồn model: Founder gửi file (A), hay cho phép tôi tìm tài sản miễn phí giấy phép rõ ràng (B — tôi sẽ nêu tên, nguồn, giấy phép, dung lượng từng file để duyệt trước khi tải), hay duyệt mua (C)?
3. Cho phép tải **HDRI + texture PBR CC0** (dự kiến 2–6 file, mỗi file 2–20 MB) — sẽ liệt kê cụ thể trước khi tải.
