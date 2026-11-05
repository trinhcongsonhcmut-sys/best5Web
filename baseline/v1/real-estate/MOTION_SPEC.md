# HALCYON HOUSE — MOTION_SPEC (baseline v1)

Tài liệu chốt chuyển động + trình bày của demo Real-estate ở v1 (biệt thự 3 tầng procedural, hồ tràn trên mái), làm chuẩn khi thay bằng GLB photoreal. Đường dẫn tính từ `BAHA_3D_SHOWCASE/src/`. Đơn vị mét; mặt đất y = 0, mặt plinth 0.5, mặt tiền hướng **+Z** (`demos/real-estate/architecture.ts:1-7`).

## 1. Dòng thời gian cuộn

### 1.1 Khung chung
- `META.scrollVh = 900` (`demos/real-estate/index.tsx:16`); `p = scrollState.smooth` (GSAP scrub 0.7, `lib/scroll.ts:20-51`). Stage DOM = `round(p·4)` (`lib/math.ts:58`).
- Biệt thự **đứng yên hoàn toàn** — không group nào của nhà bị scroll biến đổi transform. Câu chuyện cuộn = bay camera + chuyển ngày→đêm + overlay.
- Đêm: `n = nightOf(p) = smoothstep(0.06, 0.92, p)` (`demos/real-estate/state.ts:5`).

### 1.2 CameraRig PoseStop — `demos/real-estate/Scene.tsx:19-26`
| t | pos | target | fov | khung |
|---|---|---|---|---|
| 0 | [25, 6.4, 38] | [−3.4, 6.4, 0] | 34 | aerial dusk hero |
| 0.25 | [9.6, 1.75, 19.5] | [1.6, 2.5, 5] | 44 | sân đến (Ground) |
| 0.5 | [0.4, 7.0, 29.5] | [−3.6, 7.0, 3] | 38 | kính phòng khách (L1) |
| 0.62 | [−11.5, 10.9, 19.5] | [−4.6, 10.4, 2] | 35 | lam teak suite (L2) |
| 0.75 | [9.8, 16.4, 13.2] | [−3.6, 13.0, 1.8] | 40 | hồ tràn (Rooftop) |
| 1 | [−31, 17.5, 37] | [1, 6.4, 0] | 38 | overview đêm |
(Storyboard `Scene.tsx:15-18`.)

- **Props**: `limits = { elevMin: −0.05, elevMax: 1.2, dollyMin: 0.62, dollyMax: 1.5 }` (`Scene.tsx:27`), `fitAspect 1.45`, `defaultFov 36`, `relaxOnScroll` mặc định true, `onAfter = cameraGuard` (`Scene.tsx:203`, `lib/CameraRig.tsx:67,146,155`).
- **Không có bộ stops portrait riêng**; `cameraGuard` (chạy sau rig mỗi frame, `Scene.tsx:133-180`):
  1. Giới hạn yaw `w = lerp(π, 0.75, smoothstep(0.06,0.14,p)·(1−smoothstep(0.86,0.94,p)))` → ±0.75 rad ở các mốc cận cảnh, 360° ở 0 % và 100 % (`:136,140-143`).
  2. Sàn pitch `lerp(−1.2, −0.02, smoothstep(0.86,0.95,p))` (`:138-139`).
  3. Portrait (`aspect < 1`): kéo vào ×0.99 về target, rồi `translateY((1−aspect)·0.13·d)`, `translateX((1−aspect)·0.05·d)` (`:147,175-179`).
  4. Va chạm: đẩy ống kính ra khỏi cầu cây (`colliders.spheres`) và AABB khối nhà với khoảng hở `CLEAR = 0.7` m, không đẩy xuống, y ≥ 0.9 (`:125,148-174`). AABB chứa target bị bỏ qua (`:161`).

### 1.3 Các hàm theo cuộn
- **Ánh sáng** (`Scene.tsx:66-84`): hemi màu `#8d9cbc→#24304d`, ground `#3a332c→#0a0a0d`, intensity `1.2 − 0.6n`; key directional màu `#ffd0ac→#8ea6df`, intensity `1.7 − 1.15n`; fog `#55678e→#0d1526`; `scene.environmentIntensity = 0.95 − 0.55n` (`Scene.tsx:30-35,72-81`).
- **Bầu trời** (`demos/real-estate/Sky.tsx:73-111`): zenith/mid/horizon/ground/cloud lerp dusk→night theo n, glow theo `min(1, 1.15n)`, `uGlowAmt = 1 − 0.75n`, sao + trăng × n. Dusk: zenith `#1d3462`, mid `#3a6795`, horizon `#c89a8a`, glow `#ffa968`; night: `#03060d`, `#0b1528`, `#1f2c48`, `#3a4565`.
- **Nội thất/LED** (`Villa.tsx:170`, `materials.ts:110-122`): `emissiveIntensity = dusk + (night−dusk)·n` cho interiorWall 0.3→0.95, ceiling 0.32→0.75, interiorFloor 0.12→0.4, fabric 0.16→0.5, fabricDark 0.05→0.14, curtain 0.5→1.15, glow 2.2→5, led 1.4→4.2, glowCool 1.2→3.6, mosaic 0.08→0.55, water 0.05→0.4.
- **Kính** `opacity = 0.38 − 0.13n + 0.1·hover.glass`; **wash** (vệt sáng cộng) `opacity = 0.45 + 0.4n` (`Villa.tsx:205-207`).
- **Hologram** wireframe các khối (cyan `#9fdcff`, additive, no depth test): `opacity = smoothstep(0.66,0.75,p)·(1−range(0.82,0.92,p))·0.32` (`Villa.tsx:131-147,223-224`).
- **Sân đá ướt** (Reflector 256 px): chỉ hiện khi `p < 0.44 || p > 0.84` (`demos/real-estate/WetCourt.tsx:101-104`).
- **Cảnh quan** (`Landscape.tsx:465-472`): đèn đường `1.2 + 3.5n`, cửa sổ thành phố `0.14 + 0.55n`, glow đèn `0.25 + 0.6n`, màu đồi tối dần, vạch đường `0.05 + 0.25n`.
- **Nước**: normal map trôi `offset = (t·0.012, t·0.02)` (theo thời gian) (`Villa.tsx:218-219`).
- **HUD/DOM**:
  - Copy 5 stage (`demos/real-estate/Hud.tsx:7-13`): 0 "Halcyon House · Private Villa — Ánh chiều giữ lại trong đá."; 1 "Ground · Arrival"; 2 "Level 1 – 2 · Living & Suite"; 3 "Rooftop · Infinity"; 4 "Overview · Night". Section remount theo `key={idx}` (`Hud.tsx:104`) → animation `re-in` 0.9 s `cubic-bezier(0.2,0.7,0.1,1)` từ opacity 0 / translateY 16 px (`real-estate.css:53,65`).
  - Level rail: `railOf(p)` nội suy smoothstep qua `[p,rail]` = [0,0] [0.06,0] [0.25,4] [0.36,4] [0.5,3] [0.62,2] [0.75,1] [0.84,1] [1,0] (0 Overview … 4 Ground) (`state.ts:20-31`); marker `top: calc(var(--rail)/4·100%)` (`real-estate.css:79`); nhãn lớn đổi theo `round(rail)`; nút nhảy tới `LEVELS[i].p` = 1 / 0.75 / 0.62 / 0.5 / 0.25 (`state.ts:8-14`, `Hud.tsx:28-73`).
  - Đồng hồ hoàng hôn `18:05 → 21:40` = `18·60 + 5 + round(p·215)` phút (`state.ts:34-37`).
  - Bridge extra: `level`, `night`, `facade` (`Scene.tsx:82-83`, `Villa.tsx:128,215`).

## 2. Cấu trúc đối tượng chính

Kiến trúc dựng bằng `Kit`: mọi hộp/geometry gom theo bucket `"part:mat"` rồi merge thành MỘT `BufferGeometry` mỗi bucket (`demos/real-estate/kit.ts:1-4,42-131`). Cây (`demos/real-estate/Villa.tsx:275-302`), tất cả ở toạ độ thế giới, **không transform**:
```
<group>
├ <group hoverGroup onPointerMove onPointerOut>              Villa.tsx:277
│   N × <mesh geometry=bucket material=lib.get(part,mat)      Villa.tsx:278-294
│         userData.part = part|null, raycast tắt nếu part='none',
│         castShadow nếu không trong suốt/emissive/interiorWall, renderOrder 2 nếu trong suốt>
│   <mesh water> plane 11.0×4.5 tại [−3.7, Y.water=13.22, 3.26] rot-x −π/2, part 'pool'   Villa.tsx:296-298
└ <lineSegments holo> (12 cạnh × mỗi khối `vol`)              Villa.tsx:300
```
- Part (`kit.ts:9`): `mass | glass | roof | fins | pool | none`. Bucket thực tế:
  - `mass`: `stone` (plinth + bậc, tường đá các tầng, lõi thang, planter tầng 2) và `plaster` (sàn/sàn đua) — vd `architecture.ts:169-171,176-190,239-240,247-250,329,334-335,423-431`.
  - `glass`: `glass` + `steel` (khung từ `glazing()`, `kit.ts:97-116`) — `architecture.ts:181-191,251,262,268,281,344,349,355-359,427`.
  - `roof`: `plaster` (mái sảnh 198, sàn mái 385), `steel` cột/dầm pergola (411-413), `wood` lam pergola (414).
  - `fins`: `wood` lam teak (`finsZ/finsX` 151-156; cửa trục xoay 195; garage 237; sau L1 270; tây GF 275-276; L2 trước 345; L2 tây 350) và `steel` dải trên/dưới (346-347).
  - `pool`: `mosaic` (đáy + vách 388-391), `darkStone` mép tràn (392), `plaster` vỏ + coping (393-397), `glowCool` đèn dưới nước (398) + mesh water.
  - `none`: nội thất, LED, wash, balustrade, deck, cây trong chậu… (không hover, không rim).
- Cao độ `Y = { plinth 0.5, l1 4.5, l2 8.5, roof 12.55, deck 13.1, water 13.22 }` (`architecture.ts:24`); GF 0.5→4.1, L1 4.5→8.1, L2 8.5→12.1 (`:2-3`).
- Bao: plinth x −12.5…13.6, z −8.6…9.5 (`:169`), bậc tới z ≈ 10.7 (`:171`); cao tối đa ≈ 16.17 (lam pergola, `:414`), lõi thang 15.25 (`:426`). ≈ 26.1 × 18.1 × 16.2 m. Pivot = gốc thế giới (không xoay).
- Khối `vol()` (AABB, `architecture.ts:166`): GF `[−11,0.5,−6]→[5,4.1,5]`, garage `[5,0.5,−6]→[12,4.1,4]`, L1 `[−7,4.5,−5]→[13,8.1,7]`, L2 `[−10,8.5,−5.5]→[3,12.1,4.5]`, lõi thang `[−1,0.5,−8.2]→[2.6,15,−5.5]` (`:174,229,246,341,422`). Dùng cho collider camera + hologram (`Villa.tsx:22-27,131-146`).
- **Mount point**: chỉ có `hoverGroup` (`Villa.tsx:277`) — mọi mesh của nhà phải là con của group này (raycast hover). Không có pivot chuyển động.

## 3. Vật liệu & variant
Variants = `FACADES` (`demos/real-estate/materials.ts:10-14`):
| idx | id / label | swatch | tint | roughness | bumpScale | bộ texture |
|---|---|---|---|---|---|---|
| 0 | travertine / Travertine | #d9ccb4 | #e7dcc6 | 0.95 | 0.9 | `stoneSet(0)` |
| 1 | basalt / Basalt · Teak | #3d4144 | #4b5053 | 0.82 | 1.4 | `stoneSet(1)` |
| 2 | terracotta / Terracotta | #b5623f | #c46e48 | 1.0 | 1.1 | `stoneSet(2)` |
- Đổi variant: thay ngay `map`, `roughnessMap`, `bumpMap` (= rough) bằng texture procedural của loại đá (`Villa.tsx:121-129`, `textures.ts:89-90,117`); rồi mỗi frame `color.lerp(tint, 1−e^(−7dt))`, `roughness/bumpScale damp 7` (`Villa.tsx:161-167`). Áp lên **mọi** material `stone` (`lib.stones`: `mass:stone`, `none:stone` của planter + tường rào `Landscape.tsx:475,487`) (`materials.ts:150`). Texture được làm nóng sau 2.5 s (`Villa.tsx:30-33`). UV hộp theo mét / `TILE = 2.4` (`kit.ts:27-40`, `textures.ts:8`).
- Base stone: MeshStandard, metalness 0, env 0.55 (`materials.ts:45-48`). Các vật liệu khác cố định: plaster `#ece4d6` r0.88; steel `#121316` r0.36 m0.75 env 1.1; glass Physical `#1e2b33` r0.03 opacity 0.38 env 3.2 ior 1.5 depthWrite false; wood `#d9a77a` (texture gỗ) bump 0.6; mosaic `#7fd0d6` emissive `#2fc6d6`; water Physical `#0a5262` r0.02 opacity 0.8 normalMap (scale 0.35, repeat 3) env 3.2 emissive `#0b8fa3` (`materials.ts:49-106,128`).
- Bridge: `'primary'` = `mass:stone` (+ rim uRim; emissive đặt `#3a2610`), `'glass'` = `glass:glass`, `'water'` = `pool:water` (`Villa.tsx:108-118`, `materials.ts:148`).

## 4. Hover
- Mỗi material của part ≠ `none` có instance riêng + `addRim(RIM_COLOR #ffd9a3, power 1.6 cho glass/water, 2.2 còn lại)` (`materials.ts:16,137-149`).
- Chọn phần: desktop `onPointerMove` trên `hoverGroup` → `setHover(resolve(userData.part))`; bỏ qua khi camera đang bay (`camDirty`) (`Villa.tsx:263-269`). `resolve`: `pool` nhìn từ dưới `camera.y < 12.6` → `roof` (`:228-230`).
- Giá trị: `hv[part] = damp(…, 9)`; rim `uRim = v·STRENGTH[part]` với `STRENGTH = { mass 0.9, glass 1.6, roof 1.1, fins 1.2, pool 0.7 }`; `mass` luôn sáng nhẹ `max(hv.mass, any·0.45)` khi trỏ vào bất kỳ phần nào (`Villa.tsx:14-16,186-204`). Lift: stone emissive `max(hv.mass, any·0.45)·0.35`; glass opacity +0.1; water emissive +0.25 (`:206-211`). Bridge `hover.id/value` = phần mạnh nhất (`:212-214`).
- Nhãn DOM `.re-hover` (fixed, theo con trỏ +18/+14 px, lật khi chạm mép) với 5 thẻ `PART_LABEL`: Stone Mass / Glass Wall / Roof & Pergola / Teak Fins / Infinity Pool (`Hud.tsx:15-21,75-93`, `Villa.tsx:237-257`); fade 0.25 s (`real-estate.css:110-122`).
- Xoá hover: `onPointerOut`, `pointerleave` canvas, `mouseout` khỏi document, và **bất cứ khi nào camera di chuyển** (> 1e-4); khi camera dừng thì pick lại dưới con trỏ (`Villa.tsx:59-67,172-184,270-273`).
- Touch: tap < 220 ms và < 8 px → raycast một lần, giữ nhãn 2 s; tap vùng trống thì xoá (`Villa.tsx:68-87`).

## 5. Ánh sáng / môi trường / nền
- Stage: `background #0e1626`, fov 34, exposure 1.0, tone `aces`, `dprMax 1.5`, shadows mặc định **true** (`index.tsx:28`, `lib/Stage.tsx:62`). Không post-processing. `AdaptiveDpr` hạ 0.8× khi FPS < 40 (`Scene.tsx:183-196`).
- Key `directionalLight [−30,34,28]` castShadow, map 2048², frustum L −34 R 34 T 30 B −26, near 5 far 110, bias −0.0004, normalBias 0.04, `PCFShadowMap` (`Scene.tsx:46-52,89-102`). **Shadow map đóng băng sau frame 4** (`autoUpdate = false`) (`Scene.tsx:68-70`).
- Fog tuyến tính 55 → 265 (`Scene.tsx:41`). Camera bật layer 1 (cảnh xa, bị phản chiếu bỏ qua) (`Scene.tsx:53-56`).
- Environment (res 256, frames 1, chỉ để phản chiếu) — `Scene.tsx:104-115`: sphere `#1c2f57`; rect trên `[0,30,0]` 80×80 int 1.6 `#7b97cf`; afterglow tây `[−40,2,−50]` 90×8 int 3.2 `#ffb27a`; `[40,6,40]` 80×14 int 1.2 `#9fb6e6`; đáy `[0,−10,0]` 80×80 int 0.8 `#3b4a6b`; 2 circle "đèn thành phố" `[30,4,−60]` s4 và `[−60,3,20]` s3, int 6 `#ffd9a0`.
- Sky dome r = 300 theo camera, vẽ ở far plane (`Sky.tsx:11-18,110-115`). Sân ướt Reflector `[1,0.016,15.6]` 30×13 (`Landscape.tsx:27-28,483`, `WetCourt.tsx:62-99`). AO decal mặt đất 110 m bake theo footprint nhà `[−12.5,−8.6]→[13.6,9.5]` (`Landscape.tsx:301-308`).

## 6. Tương tác & chuyển động theo thời gian
- Orbit CameraRig chuẩn (kéo, touch ngang, dblclick, ←/→, zoom) (`lib/CameraRig.tsx:84-139`) + giới hạn yaw/pitch & va chạm của `cameraGuard` (mục 1.2).
- Cây cọ/tre che chủ thể mờ dần (dither theo instance, `k = 1−e^(−6dt)`): trong vòng 7 m (tre 6 m) hoặc thân chiếu rơi vào footprint nhà phía trước (`Landscape.tsx:113-125,409-464`).
- Theo thời gian: normal map nước trôi (`Villa.tsx:218-219`); không intro, không idle spin.

## 7. Swap points (thay bằng GLB photoreal)

Vị trí code phải đổi:
1. `Villa.tsx:19-29` — `buildVilla()` (`architecture.ts:163-436`) là nguồn geometry; thay bằng scene GLB nhưng vẫn xuất ra danh sách `{ part, mat, geometry }` hoặc các mesh có `userData.part`.
2. `Villa.tsx:277-298` — mọi mesh GLB phải nằm trong `hoverGroup`; mesh nội thất/trang trí gán `part = null` + tắt raycast; giữ quy tắc castShadow/receiveShadow/renderOrder cho vật trong suốt.
3. `Villa.tsx:278-279`, `materials.ts:124-170` — material phải lấy qua `lib.get(part, matKey)` (để có rim riêng theo part, ramp đêm, danh sách `stones`, `primary`); hoặc map material GLB → `MatKey` theo tên.
4. `Villa.tsx:121-129,161-167` — variant ghi đè `map/roughnessMap/bumpMap` của material stone: GLB stone cần UV theo mét/2.4 (hoặc thay bằng bộ texture PBR riêng cho 3 loại đá).
5. `Villa.tsx:296-298` — mặt nước procedural `[−3.7, 13.22, 3.26]` 11×4.5; `Villa.tsx:229` ngưỡng y 12.6 cho pool→roof.
6. Hằng số gắn hình học: `colliders.boxes` (`Villa.tsx:22-27` + `vol()` trong `architecture.ts`), hologram từ `edges` (`Villa.tsx:131-146`), `VILLA_CORNERS` + tâm `(0.5,6,0.5)` cho fade cây (`Landscape.tsx:124,418`), AO footprint (`Landscape.tsx:304`), `Y` (`architecture.ts:24`).
7. `Scene.tsx:68-70` — shadow map chỉ render 4 frame đầu: GLB tải bất đồng bộ phải xong trước đó hoặc đặt `gl.shadowMap.needsUpdate = true` sau khi load.
8. `Scene.tsx:19-26` — stops nhắm từng tầng (target y 2.5 / 7.0 / 10.4 / 13.0); GLB phải giữ cao độ tầng và hướng mặt tiền +Z, hoặc chỉnh stops.

Tính năng PHỤ THUỘC cấu trúc procedural (GLB phải cung cấp):
- **Hover theo phần**: node/mesh tách theo 5 nhóm, tên gợi ý `Mass_Stone*`, `Mass_Slab*` → `mass`; `Glass_Pane*`, `Glass_Frame*` → `glass`; `Roof_Slab`, `Roof_Pergola*`, `Canopy_Entry` → `roof`; `Fins_Teak*`, `Fins_Band*` → `fins`; `Pool_Basin`, `Pool_Lip`, `Pool_Coping`, `Pool_Light*`, `Pool_Water` → `pool`; còn lại `None_*`. Một material instance riêng cho mỗi (part, material).
- **Variant mặt tiền**: material `Stone_Facade` dùng chung cho mọi bề mặt đá (cả tường rào nếu muốn đổi theo), UV liên tục theo mét.
- **Ngày→đêm**: material emissive tách riêng cho `Interior_Wall`, `Ceiling`, `Interior_Floor`, `Fabric`, `Fabric_Dark`, `Curtain`, `Light_Glow`, `LED_Strip`, `Pool_Light` (glowCool), `Mosaic`, `Water` để ramp `materials.ts:110-122` chạy; `Glass` trong suốt (opacity được điều khiển); `Wash` additive.
- **Hologram/collider**: cần AABB các khối tầng (GF, garage, L1, L2, lõi thang) — hoặc node hộp ẩn `Volume_*` trong GLB.
