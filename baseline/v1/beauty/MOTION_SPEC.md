# BAHA BOTANICA — MOTION_SPEC (baseline v1)

Tài liệu chốt chuyển động + trình bày của demo Beauty ở v1 (hũ kem thuỷ tinh mờ procedural "Aloe Cloud Cream"), làm chuẩn khi thay bằng GLB photoreal. Đường dẫn tính từ `BAHA_3D_SHOWCASE/src/`. Đơn vị hình học hũ ≈ decimét: hũ Ø 1.12, đáy tại y = 0, đỉnh nắp ≈ 0.9 (`demos/beauty/geometry.ts:3`); cả hũ được scale `JS = 1.25` (`demos/beauty/rig.ts:8`).

## 1. Dòng thời gian cuộn

### 1.1 Khung chung
- `META.scrollVh = 720` (`demos/beauty/index.tsx:15`); `p = scrollState.smooth` (GSAP scrub 0.7, `lib/scroll.ts:20-51`).
- Toàn bộ storyboard là hàm thuần `pose(p)` (`demos/beauty/anim.ts:33-58`); `ease = easeInOutCubic` (`anim.ts:11`, `lib/math.ts:13`); `bell(a,b,c,d,p) = ease(range(a,b,p))·(1−ease(range(c,d,p)))` (`anim.ts:12`).
- 5 mốc: 0 Hero · 0.25 Unveil · 0.50 Botanicals · 0.75 Craft · 1.00 Ritual (`anim.ts:2-7`). Stage DOM = `round(p·4)` (`lib/math.ts:58`).

### 1.2 CameraRig PoseStop (aspect ≥ 0.85) — `demos/beauty/Scene.tsx:24-31`
`sc(v) = v·JS` (`Scene.tsx:23`), giá trị đã nhân:
| t | pos | target | fov |
|---|---|---|---|
| 0 | [0, 0.9, 4.65] | [0, 0.6, 0] | 30 |
| 0.25 | sc[0.95,2.1,3.95] = [1.1875, 2.625, 4.9375] | sc[0,0.6,0] = [0, 0.75, 0] | 30 |
| 0.5 | sc[−0.95,1.2,5.6] = [−1.1875, 1.5, 7.0] | sc[0,0.76,0] = [0, 0.95, 0] | 32 |
| 0.75 | sc[1.9,1.55,4.05] = [2.375, 1.9375, 5.0625] | sc[0,1.0,0] = [0, 1.25, 0] | 31 |
| 1 | [1.25, 1.5, 7.9] | [0.5, 0.5, 0] | 28 |

**Portrait** (`aspect < 0.85`, bucket làm tròn 0.05) — `Scene.tsx:37-47,139-140`: `k = min(1.9, max(1, (0.85/aspect)^0.8))`; dịch target: t=0.75 `[0.34,−0.1,−0.16]`, t=1 `[−0.16,−0.12,0]`, còn lại `[0,−0.2,0]`; hệ số lùi `kk`: t=0.75 `k·1.14`, t=1 `k`, t=0 `k·1.3`, khác `k`; `pos = target + off·kk`.

**Props CameraRig** — `Scene.tsx:141,145`: `limits = { elevMin: −0.08, elevMax: 1.15, dollyMin: 0.68, dollyMax: 1.4 }`, `defaultFov 30`, `fitAspect = bucket<1 ? 0.2 : 1.5` (portrait đã có stops riêng nên tắt fit), `relaxOnScroll` mặc định true (`lib/CameraRig.tsx:67,146`).

### 1.3 Các kênh của `pose(p)` (`anim.ts:35-57`)
| Kênh | Công thức | Ý nghĩa |
|---|---|---|
| `reseat` | `1 − ease(range(0.8,0.94))` | nắp vặn lại |
| `lift` | `ease(range(0.09,0.26))·reseat` | nắp mở |
| `explode` | `bell(0.58,0.73,0.8,0.93)` | tách lớp |
| `tilt` | `bell(0.28,0.48,0.56,0.7)` | nghiêng hũ |
| `finalK` | `ease(range(0.8,0.97))` | về plinth |
| `leafPart` | `ease(range(0.015,0.21))` | lá tách ra |
| `capLift` | `lift·0.36 + explode·0.62` | |
| `capTwist` | `−lift·2.2 − explode·0.6` (rad) | |
| `jarYaw` | `−0.32 + ease(range(.25,.52))·0.95 − ease(range(.55,.75))·0.55 − finalK·0.18` | |
| `jarRoll / jarPitch / jarLift` | `−0.15·tilt / 0.1·tilt / 0.2·tilt` | |
| `jarX` | `−0.06·finalK` | |
| `ingredients` | `bell(0.3,0.44,0.6,0.69)` | |
| `orbitAngle` | `(p − 0.5)·2.6` | |
| `callouts` | `bell(0.4,0.46,0.57,0.63)` | |
| `details` | `bell(0.68,0.73,0.79,0.83)` | |
| `word` | `1 − 0.84·ease(range(.06,.24)) + 0.84·ease(range(.84,.98))` | |
| `plinth` | `finalK` | |
| `serum` | `ease(range(0.84,0.99))` | |

Áp dụng (`demos/beauty/Jar.tsx:211-246`):
- Root hũ: `position = (jarX, jarLift + bob, 0)`, `rotation = (jarPitch, jarYaw + sin(t·0.35)·0.02, jarRoll)`, `scale = JS` (`Jar.tsx:214-217`).
- Nắp: `y = JAR.capY + capLift + fly·2.3`, `rotation.y = capTwist + fly·2.2`, `rotation.z = sin(min(1, capLift·2.5)·π)·0.05` (lắc khi rời ren) (`Jar.tsx:229-232`).
- Lõi kem: `y = explode·0.5 − fly·2.1`, `rotation.y = explode·0.5` (`Jar.tsx:236-238`). Thân: `y = −fly·2.1` (`Jar.tsx:243`).

Phân đoạn 0→100 %:
- **0 – 21 %** Hero → lá lô hội tách sang hai bên (`leafPart`); chữ khổng lồ mờ dần 6–24 % về 16 % opacity (`word`). Copy stage 0 "Calm, held in glass." + kicker `{world.name} Cloud Cream · 50 ml` (`demos/beauty/hud.tsx:12,46`).
- **9 – 26 %** Nắp vặn mở: lên 0.36, xoay −2.2 rad. Copy stage 1 "01 — Unveil / Twist. Breathe." (`hud.tsx:13`).
- **25 – 75 %** Hũ xoay yaw (+0.95 rồi −0.55); **28 – 70 %** nghiêng (roll −0.15, pitch 0.1, nâng 0.2) → bóng blob nở/nhạt theo `jarLift` (`Scene.tsx:153`, `Backdrop.tsx:177-188`).
- **30 – 69 %** 5 thành phần + 18 giọt sương bay ra quỹ đạo quanh `rig.jarCenter`: bán kính `max(RING_R·(0.55+0.45k)·(portrait?0.8:1), (portrait?0.92:1)·JS·(0.6+0.4k))`, `RING_R = 1.12·JS`, mặt phẳng nghiêng `TILT 0.32`, góc `i/5·2π + orbitAngle + 1.085`, scale `k·1.75·JS` (`demos/beauty/Ingredients.tsx:16-18,100-121`). Callout DOM opacity = `callouts` (40–63 %), đặt bằng solver tránh hũ/vật thể (`Ingredients.tsx:136-244`); danh sách `.bt-inglist` hiện ở stage 2 (`beauty.css:73`). Copy "02 — Botanicals / Five quiet actives." (`hud.tsx:14,19-25`).
- **58 – 93 %** Tách lớp: nắp +0.62, kem +0.5 (xoay 0.5), thân đứng yên. Nhãn craft (`details`, 68–83 %) neo vào mép phải `capCenter/creamCenter/bodyCenter` với bán kính `0.6/0.46/0.58·JS` (`Ingredients.tsx:246-265`), nội dung `hud.tsx:27-31`. Copy "03 — Craft / Made in layers." (`hud.tsx:15`).
- **80 – 99 %** Ritual: nắp vặn lại (`reseat`), plinth trồi lên `y = −3.4·(1−k)` tại x = 0.42 (`demos/beauty/Serum.tsx:18,46`), hũ dịch x −0.06, chữ trở lại đủ đậm (84–98 %), serum xuất hiện 84–99 %: scale `0.4+0.6·easeOutCubic(k)`, y rơi `(1−k)·0.5`, yaw `−0.5 + (1−k)·1.2` (`Serum.tsx:92-97`). Copy "04 — Ritual / Skin, at rest." + `.bt-fine` (`hud.tsx:16`, `beauty.css:76`).
- Hiệu ứng copy: `.bt-copy` opacity 0.3 s (vào 0.9 s), con translateY 14 px → 0 trong 1.1 s, trễ 0.08/0.18 s (`beauty.css:33-39`). `hud-help` mờ theo `0.85 − p·6` (`beauty.css:16`).
- Bridge extra: `world`, `capLift`, `explode`, `ingredients` (`Scene.tsx:91-96`).

## 2. Cấu trúc đối tượng chính (`Jar.tsx:249-271`)
```
<sprite halo>  (renderOrder −5, no-ray)                         Jar.tsx:251
<group root>   ← pos/rot/scale theo pose, scale JS=1.25         Jar.tsx:252
└ <group steadyHover(bind)>   (vùng hover 'jar')                 Jar.tsx:253
   ├ <group body>  ← y = −fly·2.1                                Jar.tsx:254-259
   │   jarBody (glass)  · thread (glass) · label (y 0.3) · backLabel (y 0.3)
   ├ <group cream> ← y = explode·0.5 − fly·2.1, rotY = explode·0.5   Jar.tsx:260-263
   │   creamBody · creamTop (cream)
   └ <group cap position-y=JAR.capY> ← y, rotY, rotZ             Jar.tsx:264-267
       cap (cap, 72 gân) · foil disc (y 0.3045, rot-x −π/2)
```
- Hằng `JAR = { r 0.562, neckR 0.5, neckY0 0.61, neckY1 0.7, cavityR 0.43, floorY 0.18, creamY 0.6, capY 0.6 }` (`geometry.ts:20`). Thân lathe y 0.004 → 0.72 (`geometry.ts:22-35`); nắp lathe cục bộ y 0 → 0.304, R ngoài 0.58 (`geometry.ts:103-122`); kem y 0.181 → ≈0.73 (`geometry.ts:54-100`); nhãn trụ R 0.5705 cao 0.33, cung 1.96 rad hướng +Z (`geometry.ts:49-51`).
- Bao cục bộ ≈ Ø 1.16 × cao 0.904; thế giới (× JS) ≈ Ø 1.45 × cao 1.13. Pivot root = tâm đáy hũ (gốc toạ độ); mọi xoay/nghiêng quay quanh điểm này. Nắp xoay quanh trục Y qua tâm, gốc tại mép dưới nắp (y = 0.6 cục bộ).
- Điểm neo DOM/scene (`rig.ts:13-26`, cập nhật `Jar.tsx:219-245`): `jarCenter` = root·(0,0.5,0); `capCenter` = cap·(0,0.15,0); `creamCenter` = cream·(0,0.45,0); `bodyCenter` = body·(0,0.32,0). `rig.intro`, `rig.jarHover` cũng ghi tại đây.
- **Mount points**: `root` (pose toàn hũ), `body`, `cream`, `cap` — 3 group con là nơi gắn node tách lớp.
- Vật thể phụ: Ingredients (5 group + instanced dew, `Ingredients.tsx:272-303`), Plinth (`Serum.tsx:23-58`, đỉnh y = 0 khi k = 1, `geometry.ts:312-316`), Serum tại `SERUM_POS (1.08, 0, −0.3)` scale `1.35·JS` (`Serum.tsx:19,96`), 10 lá lô hội (`demos/beauty/Leaves.tsx:26-40`).

## 3. Vật liệu & variant
Variants = `WORLDS` (`demos/beauty/palette.ts:31-95`), swatch `[bgMid, glass]` (`index.tsx:19`):
| idx | id / label | word | glass | atten | cream | cap | labelInk | foil | bgTop/Mid/Bot |
|---|---|---|---|---|---|---|---|---|---|
| 0 | aloe / Aloe Mist | SOOTHE | #0f4a2a | #0a3a1f | #e4ecd9 | #1b2129 | #d8ecd9 | #d9c08a | #6aa9dc/#7ab9e6/#cdeeff |
| 1 | rose / Rose Quartz | BLOOM | #c9768a | #8e3550 | #f3dcd8 | #f2ebe7 | #fff0f2 | #c79a6c | #e6b2bd/#f3d2d6/#fcf0ec |
| 2 | amber / Amber Dew | GLOW | #a8561a | #5e2a08 | #f0dfbf | #2a1c14 | #fff3df | #e1c38c | #e0a067/#efc79b/#fcefdf |
(còn `glow, ink, leaf, plinth, serum, shadow` — `palette.ts:41-51,63-72,85-94`.)
- Cơ chế: một bảng `look` sống, mọi khoá màu lerp `1−e^(−4.2·dt)` mỗi frame (`palette.ts:101-112`, gọi tại `Scene.tsx:88-89`); hũ copy `look.*` vào vật liệu mỗi frame (`Jar.tsx:185-209`). Cả thế giới (nền, lá, plinth, serum, bóng, chữ) đổi theo.
- Glass (MeshPhysical, `Jar.tsx:62-78`): rough 0.2, **transmission 0.45**, thickness 0.8, ior 1.5, attenuationDistance 0.35, clearcoat 0.6/0.06, specularIntensity 1, env 1.0 — chỉ `color` và `attenuationColor` đổi theo variant. Cap: rough 0.52, metal 0.05, clearcoat 0.18/0.5, env 0.9 (`:79-89`). Cream: rough 0.62, clearcoat 0.25/0.4, env 0.7 (`:90-96`). Label: Standard trong suốt, emissive 0.22, polygonOffset (`:97-107`); foil metal 0.85 rough 0.3 (`:109`).
- Texture nhãn đổi tức thì theo `WORLDS[i].name` (vẽ canvas lười) — `Jar.tsx:118,142-149`. Chữ khổng lồ cross-fade: out `−4/s`, in `+2.2/s`, opacity = `word·swap` (`Backdrop.tsx:99-112`).
- Bridge: `'primary'` = glass (+ rim uRim), `'cap'` = cap (+ rim), `'cream'` = cream (`Jar.tsx:151-160`).

## 4. Hover
- **Hũ** (`'jar'`): `useHoverRim([glass, cap], 'jar', max 1.5)` speed 9 (`Jar.tsx:174-175`, `lib/rim.ts:47`); rim `#eaffff` power 3.4 (glass) / 4.5 (cap) (`Jar.tsx:38,77,88`). Lift: glass env `1.0 + 0.65h`, glass emissive `look.glass·0.3h`, cap emissive `look.cap·0.18h` (`Jar.tsx:187-189`). Light sweep một lần mỗi khi hover bắt đầu (h > 0.15), dài 0.75 s, dải sáng theo normal.x từ −1.6 → 1.6 (`Jar.tsx:23-36,191-195`). Halo sprite: đặt sau `jarCenter` 1.8 đơn vị theo hướng camera, scale `4.2·JS·(0.9+0.1h)`, opacity `0.5h` (`Jar.tsx:222-228`).
- **Ingredients** (`ingredient-0..4`): rim `#ffffff` p2, max 1.8, scale nảy `1 + 0.16v`, callout thêm class `hot` khi > 0.3 (`Ingredients.tsx:21-35,242-243`).
- **Serum** (`'serum'`): rim glass `#fff` p2, bulb `#fff` p2.2, collar `#fff3d6` p2, max 1.8; scale +5 %, liquid emissive `0.18 + 0.4h` (`Serum.tsx:77,87,96,100`).
- `steadyHover` lặp lại over trên mỗi move để không nháy (`rig.ts:36-38`). Xoá hover: `onPointerOut → target 0`, ease-out exp speed 9, về 0 khi < 0.002 (`lib/rim.ts:50-71`). Lá, nền, chữ: `raycast = null`.

## 5. Ánh sáng / môi trường / nền
- Stage: `background WORLDS[0].bgMid (#7ab9e6)`, fov 30, tone `neutral`, exposure 1, `shadows false`, dprMax 1.75 (`index.tsx:27`). Không post-processing.
- `ambientLight 0.35`; `directionalLight [-3,5,4] 1.5 #fffaf2`; `directionalLight [3.5,2,−4] 0.9 #e8f4ff` (`Scene.tsx:147-149`).
- Environment (res 256, frames 1) — `Scene.tsx:101-134`: sphere xám gradient; softbox trên `[0,6,1.5]` rot-x π/2 8×4 int 3.2; strip trái `[−4.5,1.2,2.5]` rotY π/2.6 0.7×6 int 4; strip hẹp `[−2.6,1.2,4.2]` rotY π/5 0.12×5 int 6; strip phải `[4.5,1,1.5]` rotY −π/2.4 0.5×5 int 2.2 `#fff3df`; rim sau `[0,2,−6]` 7×1.2 int 2.4 `#e3f2ff`; circle `[2.5,4,4]` scale 1.6 int 2.
- Nền: quad screen-space gradient `bgBot→bgMid→bgTop` + glow giữa + vignette + grain, màu theo `look` (`demos/beauty/Backdrop.tsx:18-61`). Chữ Didone billboard sau hũ, khoảng cách `|cam−jarCenter| + 2.3`, rộng `min(visW·0.88, visH·2.5)` (landscape) (`Backdrop.tsx:115-132`).
- Bóng: `BlobShadow` baked, theo `jarX`, nở `1+lift·1.1`, nhạt `/(1+lift·3.5)`, bán kính `0.72·JS`, strength 0.55; serum `0.42·JS`, 0.45 (`Scene.tsx:153-154`, `Backdrop.tsx:173-194`).

## 6. Tương tác & chuyển động theo thời gian
- Orbit chuẩn CameraRig (kéo, touch ngang, dblclick reset, ←/→) (`lib/CameraRig.tsx:84-139`). Lá còn tách thêm khi camera ngẩng > ~0.24 rad hoặc thấp < −0.02 rad: `lift = damp(smoothstep(0.24,0.5,elev) + smoothstep(−0.02,−0.12,elev), 6)`, `k = max(leafPart, lift)` (`Leaves.tsx:88-94`).
- Lá: `x += side·(behind?1.1:1.9)·k`, `y −= (behind?1.6:0.9)·k`, `z += (behind?0:0.5)·k`, `rotX −0.25k`, `rotZ −side·0.75k + sway`; ẩn khi k ≥ 0.999; portrait hạ 1.35, giãn Y 1.55, bỏ blade 1/3/5/7 (`Leaves.tsx:43,96-105`).
- **Intro assemble** (một lần khi `bridge.ready`): 1.25 s easeOutCubic; `fly = 1−e` → nắp từ +2.3 (xoay +2.2 rad), kem & thân từ −2.1 (`Jar.tsx:197-202`).
- Idle theo thời gian: bob `sin(t·0.9)·0.012·(1−plinth)`, yaw `sin(t·0.35)·0.02` (`Jar.tsx:214-216`); lá sway `sin(t·0.55+i·1.3)·0.018` (`Leaves.tsx:100`); ingredients bập bênh + nhấp nhô (`Ingredients.tsx:116-119`); dew quay `t·0.05·sp` (`:125`); serum yaw `sin(t·0.3)·0.03` (`Serum.tsx:97`); 140 motes trôi lên (`Backdrop.tsx:141-170`).
- Chuẩn bị: fonts + `compileAsync` được đăng ký như một load item trước `ready` (`Scene.tsx:49-82`).

## 7. Swap points (thay bằng GLB photoreal)

Vị trí code phải đổi:
1. `Jar.tsx:47-59` (geometry) và `:252-268` (JSX) — thay mesh procedural bằng node GLB nhưng giữ 4 group `root/body/cream/cap` (refs dùng ở `:211-246`).
2. `Jar.tsx:264` — group `cap` có `position-y = JAR.capY`; node nắp GLB phải có pivot ở mép dưới nắp, trên trục Y của hũ, để `capLift/capTwist` vặn đúng ren.
3. `Jar.tsx:217` + `rig.ts:8` — scale `JS = 1.25` áp lên GLB; GLB phải theo đơn vị hình học hiện tại (đáy y = 0, Ø ≈ 1.12, cao ≈ 0.9) hoặc đổi `JS`.
4. `Jar.tsx:219,233,239,244` — offset tâm cục bộ (0.5 / 0.15 / 0.45 / 0.32) cho `rig.*Center`; `Ingredients.tsx:16,113,152-158,247-251` — bán kính quỹ đạo và silhouette (`0.62·JS`, `0.6/0.46/0.58·JS`); `Scene.tsx:153` blob `0.72·JS` — phải chỉnh theo kích thước GLB.
5. `Jar.tsx:61-115` — vật liệu: glass GLB phải được gán `mats.glass` (transmission + rim + sweep) hoặc chép thông số; cap/cream/label/foil tương tự; `Jar.tsx:183-209` ghi màu mỗi frame.
6. `Jar.tsx:118,142-149` — texture nhãn canvas theo world: UV nhãn GLB phải khớp vùng nhãn trụ (cung 1.96 rad, cao 0.33, hướng +Z) hoặc thay cơ chế đổi nhãn.
7. `Scene.tsx:24-31` stops nhắm `target` y 0.6–1.25 theo chiều cao hũ hiện tại.
8. `Serum.tsx`, `Ingredients.tsx`, `Leaves.tsx` là vật thể procedural riêng — swap độc lập (Serum cần tách liquid/pipette/glass/collar/bulb cho rim + màu).

Tính năng PHỤ THUỘC cấu trúc procedural (GLB phải cung cấp):
- **Tách nắp / lõi kem / thân** (unveil 9–26 %, craft 58–93 %, intro): node riêng `Jar_Body` (thuỷ tinh + ren cổ `Jar_Thread`), `Jar_Label_Front`, `Jar_Label_Back`, `Cream_Core` (puck) + `Cream_Swirl` (bề mặt xoáy), `Cap` + `Cap_Foil`. Lõi kem phải là khối đặc nhấc ra được (thấy thành bên khi lift), không chỉ mặt trên.
- **Ren cổ hũ** lộ khi nắp mở (`geometry.ts:38-46`) — GLB cần neck thread thật.
- **Hover rim + sweep** chỉ chạy trên material đã `addRim`/`addSweep` (glass, cap) — GLB material `Glass_Frosted`, `Cap_SoftTouch` phải đi qua các hàm này.
- **Màu thế giới**: material `Glass_Frosted` (color + attenuationColor), `Cap_SoftTouch`, `Cream`, `Label_Ink`, `Foil` phải nhận màu từ `look` (không bake màu vào baseColor texture, hoặc dùng texture trung tính nhân màu).
