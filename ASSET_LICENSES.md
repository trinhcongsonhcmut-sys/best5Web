# ASSET_LICENSES — BAHA 3D SHOWCASE V2

Nguyên tắc: không dùng logo/model/ảnh/video bản quyền của bên thứ ba. Ảnh chụp màn hình từ link tham khảo chỉ là **bằng chứng quan sát cục bộ** (`reference/shots/`, đã `.gitignore`), không nằm trong sản phẩm.

## Mô hình & texture
| Asset | Nguồn | Giấy phép | Dùng ở | Ghi chú |
|---|---|---|---|---|
| Geometry/vật liệu v1 | Tự dựng bằng code (three.js procedural) | Sở hữu BAHA GROUP | 5 demo (v1); beauty v2 (chai serum, cam, giọt nước dựng bằng code) | |
| **CarConcept.glb** (`public/assets/models/`) | Khronos glTF-Sample-Assets — https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept (gốc: "Free Concept Car 004" của Unity Fan, CC0) | **CC-BY 4.0** — Eric Chadwick / Darmstadt Graphics Group GmbH, 2024 — **bắt buộc ghi công** (ghi trên trang /automotive + file này) | automotive v2 | Logo Khronos / 3D Commerce là nhãn hiệu Khronos ⇒ **phải gỡ/ẩn** (biển số `License`, `InteriorSteeringEmblem`); tải 05/11/2026, 11,8 MB, Founder duyệt |
| HDRI `evening_road_01_puresky_2k.hdr`, `belfast_sunset_puresky_2k.hdr`, `studio_small_09_2k.hdr` (`public/assets/hdri/`) | Poly Haven — https://polyhaven.com/hdris | **CC0** | automotive / real-estate / beauty v2 | tải 05/11/2026, 4,6–6,3 MB/file, Founder duyệt |
| Texture PBR 2K `sandstone_blocks_05`, `brown_planks_03`, `concrete_floor_02`, `leafy_grass`, `asphalt_02` (diff + nor_gl + arm) (`public/assets/textures/`) | Poly Haven — https://polyhaven.com/textures | **CC0** | real-estate (đá, gỗ, bê tông, cỏ) / automotive (mặt đường) v2 | tải 05/11/2026, tổng ~40 MB, Founder duyệt |

| Model glTF 1K `Sofa_01`, `sofa_03`, `modern_arm_chair_01`, `modern_ceiling_lamp_01`, `potted_plant_02`, `shrub_03`, `shrub_04` (`public/assets/models/polyhaven/<id>/`) | Poly Haven — https://polyhaven.com/models | **CC0** | real-estate v2 (nội thất, cây chậu, bụi cây) | tải 05/11/2026, tổng ~10,4 MB, Founder duyệt |

| HDRI `evening_road_01_2k.hdr` (bản có địa hình) (`public/assets/hdri/`) | Poly Haven — https://polyhaven.com/a/evening_road_01 | **CC0** | automotive v2 (nền địa hình + phản chiếu); `shrub_03`/`shrub_04` dùng lại ở automotive | tải 05/11/2026, 6,3 MB, Founder duyệt |

Ảnh mẫu v2 của Founder (`reference/v2/*.webp`) chỉ là chuẩn tham chiếu hình ảnh, không nằm trong sản phẩm, không dùng logo/thương hiệu trong ảnh (xe trong ảnh mẫu là xe thương hiệu thật; nhãn serum trong ảnh mẫu là thương hiệu thật).

## Phần mềm / font (self-host, đóng gói trong `node_modules` → `dist/`)
| Gói | Giấy phép |
|---|---|
| three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, postprocessing | MIT |
| gsap (ScrollTrigger) | GSAP Standard License (miễn phí, kể cả thương mại — không được dùng để dựng sản phẩm cạnh tranh với Webflow) |
| react, react-dom, react-router-dom, vite | MIT |
| @fontsource/* và @fontsource-variable/* (Inter, Fraunces, Cormorant Garamond, Bodoni Moda, Syne, Unbounded, Instrument Serif, Space Grotesk, Playfair Display, Manrope, Outfit, Bricolage Grotesque, Italiana, Marcellus, Tenor Sans, JetBrains Mono) | SIL OFL 1.1 (font), MIT (đóng gói) |
| threejs-skills (cesartevisual) | MIT — chỉ là chỉ dẫn cho agent, không nằm trong sản phẩm |
