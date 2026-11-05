# AXIOM T1 — MOTION_SPEC (baseline v1)

Tài liệu chốt chuyển động + trình bày của demo Automotive ở phiên bản v1 (xe tải điện procedural), để khi thay bằng GLB photoreal vẫn giữ nguyên "tinh thần" chuyển động. Mọi đường dẫn tính từ `BAHA_3D_SHOWCASE/src/`. Đơn vị: mét; xe hướng mũi về **+X**, lên trên **+Y**, bề ngang theo **Z** (sườn phải ở +Z) — `demos/automotive/geometry.ts:3`.

## 1. Dòng thời gian cuộn

### 1.1 Khung chung
- `META.scrollVh = 720` → timeline trải trên 620 vh cuộn — `demos/automotive/index.tsx:13`, `lib/ui.tsx:19-20`.
- Tiến độ `p` = `scrollState.smooth` (GSAP ScrollTrigger scrub 0.7, `ease: 'none'`) — `lib/scroll.ts:20-51`. Mọi giá trị dưới đây đọc `scrollState.smooth` (`demos/automotive/Truck.tsx:273`).
- Stage HUD (0…4) = `Math.round(p*4)` → đổi copy ở p = 0.125 / 0.375 / 0.625 / 0.875 — `lib/math.ts:58`, `lib/ui.tsx:29-42`.
- `smoothstep(a,b,v)` = Hermite clamp; `range` = tuyến tính clamp — `lib/math.ts:7-12`.

### 1.2 CameraRig PoseStop (desktop, aspect ≥ 1.05) — `demos/automotive/Scene.tsx:16-24`
| t | pos | target | fov |
|---|---|---|---|
| 0 | [6.7, 1.6, 11.5] | [0.15, 1.62, 0] | 27 |
| 0.25 | [0.25, 1.2, 12.8] | [0.2, 1.45, 0] | 27 |
| 0.5 | [7.3, 5.4, 9.4] | [0.1, 1.65, 0] | 30 |
| 0.625 | [-2.4, 3.6, 11.8] | [-0.3, 1.38, 0] | 29 |
| 0.75 | [-8.4, 2.4, 6.8] | [-0.45, 1.28, 0] | 27 |
| 0.875 | [-0.6, 1.45, 12.4] | [0, 1.28, 0] | 28 |
| 1 | [8.5, 1.0, 8.7] | [0.2, 1.38, 0] | 29 |

Storyboard: 3/4 trước thấp → profile bên → 3/4 cao (exploded) → 3/4 sau → final (`Scene.tsx:15`). Spline Catmull-Rom centripetal qua pos/target/fov, tham số hoá tuyến tính theo khoảng giữa các `t` (`lib/math.ts:31-56`).

**Portrait** (`aspect < 1.05`) — `Scene.tsx:27-37`: giữ nguyên hướng nhìn, `k = aspect<0.7 ? 1.04 : 1.08`, `lift = aspect<0.7 ? 0.8 : 0.55`; `target.y += lift`; `pos = target + (pos_gốc − target_gốc)·k`, riêng `pos.y` trừ thêm `lift·0.4`. Stops chỉ tính lại khi đổi bucket portrait / `<0.7` (`Scene.tsx:291-292`).

**Props CameraRig** — `Scene.tsx:312,317`: `limits = { elevMin: 0.02, elevMax: 0.5, dollyMin: 0.62, dollyMax: 1.45 }` (yawRange/sensitivity mặc định `Infinity`/`0.0058`, `lib/CameraRig.tsx:27`), `defaultFov = 28`, `fitAspect = 1.5` (aspect < 1.5 → bán kính × `clamp((1.5/aspect)^0.75, 1, 2.2)`, `lib/CameraRig.tsx:155`), `relaxOnScroll` mặc định `true` (orbit về 0 khi cuộn lệch > 0.035, `lib/CameraRig.tsx:146`). `onAfter = topViewSafe`: `k = smoothstep(0.12, 0.5, orbit.pitch)`, lùi camera 3.0·k dọc trục +Z của camera — `Scene.tsx:299-310`.

### 1.3 Các hàm theo cuộn (tất cả trong `Truck.tsx` useFrame, `Truck.tsx:271-346`)
| Biến | Công thức | Dòng |
|---|---|---|
| `anim.explode` (e) | `smoothstep(0.34,0.47,p)·(1−smoothstep(0.58,0.68,p))` | `Truck.tsx:282` |
| `ee` (ease lần 2) | `e²(3−2e)` | `Truck.tsx:292` |
| `anim.drive` | `smoothstep(0.1,0.2,p)·(1−smoothstep(0.31,0.4,p))` | `Truck.tsx:285-286` |
| `driveAcc` | `+= dt·7.5·drive` (tích luỹ theo thời gian, KHÔNG thuần p) | `Truck.tsx:287` |
| `anim.roll` (m) | `p·26 + driveAcc` | `Truck.tsx:288` |
| `anim.rear` | `smoothstep(0.6,0.73,p)·(1−0.5·smoothstep(0.88,1,p))` | `Truck.tsx:289` |
| `anim.glow` | `0.12 + 0.88·smoothstep(0.08,0.2,p)·(1−smoothstep(0.32,0.42,p))` | `Truck.tsx:290` |

Phân đoạn 0→100 %:
- **0 – 8 %** Hero: xe đứng yên, `glow` = 0.12, đèn hậu 0.45 emissive (`Truck.tsx:337`). Copy `ax-hero` (kicker "BAHA motion lab — concept 05", "AXIOM T1", tag) — `demos/automotive/hud.tsx:72-83`.
- **8 – 42 %** Underglow sườn: `mats.glow.emissiveIntensity = (glow·2.4 + …)` (`Truck.tsx:338`) + 2 decal `GlowPool` cộng màu `#6fb7ff` tại z = ±1.18, kích thước 2.7×0.75, opacity `uA = glow` (`Scene.tsx:327-328`, shader `Scene.tsx:220-243`).
- **10 – 40 %** "Driving beat" .01: bánh xe quay `spin.rotation.z = side·(−roll)/wheelR` (`demos/automotive/Wheel.tsx:72`); texture cát trượt `tex.offset.x = roll/(320/46)` (`Scene.tsx:85`); bụi bánh `DustTrail` 240 điểm sau 4 lốp, alpha × `drive·0.32`, ẩn khi `drive ≤ 0.01` (`Scene.tsx:246-286`); bụi nền `Dust` dịch theo `roll·0.9` (`Scene.tsx:131`). Copy stage 1 `.01 Performance & range` + 3 spec (`hud.tsx:25-34`).
- **34 – 68 %** Exploded/exoskeleton .02 (đỉnh e = 1 trong 47–58 %):
  - `slabGroup.position.y = ee·0.78`, `cabGroup.position.y = ee·1.0`, `chassisGroup.position.y = ee·0.05` (`Truck.tsx:293-295`).
  - Bánh trượt ra ngoài: `root.position.z = side·(DIM.trackZ + e·0.62)` (`Wheel.tsx:75`); giảm xóc/trục co giãn theo `hub = trackZ + e·0.62 − 0.12`, lò xo `z = side·(0.6 + e·0.36)` (`Truck.tsx:190-201`).
  - Vật liệu: lốp/mâm/khung lerp về `CLAY #e7e1d4` theo e·0.82 / e·0.7 / e·0.75 (`Truck.tsx:216,327-329`); đường cạnh `edges` (đỏ `#e2431e`) opacity `max(e·0.9, hover)` (`Truck.tsx:331`, `materials.ts:129`); cell pin emissive `e·1.1` (`Truck.tsx:332`); clearcoat thân × `(1−0.4e)`; nếu variant 0 (stainless) thân pha về `CLAY_BODY #cfcfcb` với `c = e·0.4` (`Truck.tsx:315-324`).
  - Bóng nền baked: `opacity = 0.95 − explode·0.45` (`Scene.tsx:99`).
  - Copy stage 2 `.02 Exo-skeleton` (`hud.tsx:35-44`).
- **60 – 100 %** Đèn hậu .03: `rear.emissiveIntensity = (0.45 + rear·5.5)·(1+lh) + lh·2.5` (`Truck.tsx:337`); halo cộng màu `#ff3b3f` plane 1.9×0.22 tại `[TAIL_X−0.03, 1.27, 0]`, `uA = rear` (`Truck.tsx:340,348-360,446-448`); decal đỏ trên cát `poolMat.uA = rear` nhưng mesh `visible={false}` (`Truck.tsx:339,449`). Sau 88 % giảm còn 50 %. Copy stage 3 `.03 Versatile utility` (list) (`hud.tsx:45-50`), stage 4 `ax-final` "Built for the long way round." (`hud.tsx:125-132`).
- DOM luôn có: thanh tiến độ `.ax-fill scaleX(var(--p))`, thumb `left: calc(var(--p)·88%)` (`automotive.css:91-94`); nhãn Intro/.01/.02/.03/Fin bấm → `scrollToProgress(i/4)` (`hud.tsx:134-148`). Hiệu ứng vào: opacity 0.45 s + translateY 16 px 0.7 s `cubic-bezier(0.2,0.8,0.2,1)`, trễ 0.08/0.16/0.2 s; rời 0.22/0.3 s (`automotive.css:31-41`).
- Mỗi lần p đổi > 0.0005 gọi `events.update()` để hover tự re-raycast khi cảnh trôi dưới con trỏ (`Truck.tsx:278-281`).
- QC bridge extra: `exploded`, `rearLight`, `hoverPart` (`Truck.tsx:342-345`).

## 2. Cấu trúc đối tượng chính

Cây trong `Truck()` (`Truck.tsx:384-473`), group gốc **không có transform** (đặt tại gốc toạ độ, mặt đất y = 0):
```
<group onPointerOver/Move/Out>                Truck.tsx:385-400   (hover gốc)
├─ slabGroup  (ref)  ← position.y = ee·0.78   Truck.tsx:402
│   ├─ group userData.part='body'             Truck.tsx:403-422  G.lower, bodyExtras, slats, mirrors (mats.body);
│   │                                           lens (glass); handles/lips/skid (disc); plate + plateMat; flares/trim (trim);
│   │                                           hooks (caliper); liners (liner); gaps (gap); portDoor (body)
│   ├─ group userData.part='lights'           Truck.tsx:423-427  front DRL (front), rocker + portRing (glow)
│   └─ lineSegments G.edges (mats.edges)      Truck.tsx:428
├─ cabGroup   (ref)  ← position.y = ee·1.0    Truck.tsx:432
│   ├─ part='body': G.upper (body), bedLiner (trim)          Truck.tsx:433-436
│   ├─ cabinShell (cabin, BackSide), seats (trim)  no-ray    Truck.tsx:437-438
│   ├─ part='glass': gaskets (trim), glass (glass)            Truck.tsx:439-442
│   ├─ part='lights': G.rear (rear)                           Truck.tsx:443-445
│   ├─ halo plane, pool plane (ẩn), badge plane               Truck.tsx:446-454
│   └─ lineSegments G.cabEdges                                Truck.tsx:455
├─ chassisGroup (ref) part='chassis' ← position.y = ee·0.05  Truck.tsx:459-467
│   frame, pack (chassis), cells (battery), motors (disc), 4× <Corner x side>
└─ group part='wheels'                                        Truck.tsx:469-471
    4× <Wheel x=±1.85 side=±1>
       root group [x, wheelR, side·trackZ] ← position.z = side·(trackZ + e·0.62)   Wheel.tsx:75,81
       └ group rotation-y = side===1 ? 0 : π                                       Wheel.tsx:84
          ├ spin group ← rotation.z = side·(−roll)/wheelR                          Wheel.tsx:72,85-97
          │   tyre + tread instanced (tyre), barrel, face (rim), cap, badge, lugs, disc, hat
          └ caliper (không quay)                                                   Wheel.tsx:99
       spot shadow plane 0.78×0.5 tại y = −wheelR+0.006                           Wheel.tsx:22,82
```
- Tách lớp thân: loft ring đoạn 0–5 → `lower` (thân dưới), 6–8 → `upper` (vỏ trên: nắp capo, greenhouse, mái, thành thùng) — dùng chung belt ring nên khi nghỉ không thấy khe (`demos/automotive/loft.ts:8-9,213-216`).
- Kích thước (`geometry.ts:13-28`, `loft.ts:23-29`): trục bánh x = ±1.85 (chiều dài cơ sở 3.70), bán kính bánh 0.46, vệt bánh z = ±0.86, nửa bề ngang thân 0.98, mũi `NOSE_X = 2.98`, đuôi `TAIL_X = −2.92`, sàn thùng `FLOOR_Y = 1.12`, nóc 1.99 (`loft.ts:28`). Tổng thể ước tính: dài ≈ 6.15 m (móc kéo −3.11 `Truck.tsx:122` → móc trước 3.04 `Truck.tsx:129`), rộng ≈ 2.0 m (thân ±0.98, gương/lốp nhô thêm vài cm), cao ≈ 1.99 m. Khi exploded: nóc lên ≈ 2.99 m, bánh ra z ≈ ±1.48.
- Pivot: các group lớp chỉ tịnh tiến Y (không xoay); bánh quay quanh trục Z cục bộ tại tâm bánh `[±1.85, 0.46, ±0.86]`.
- **Mount points** cho model thay thế: `slabGroup` (thân dưới + phụ kiện gắn thân), `cabGroup` (vỏ trên + kính + đèn hậu), `chassisGroup` (khung skateboard + pin + mô-tơ), và 4 `Wheel` root (bánh, cần node bánh riêng có tâm tại tâm trục để gắn vào `spin`).

## 3. Vật liệu & variant

Variants (`index.tsx:17-22`) ↔ `FINISHES` (`demos/automotive/materials.ts:17-22`):
| idx | id / label | swatch | color | metal | rough | clearcoat | ccRough | anisotropy | env |
|---|---|---|---|---|---|---|---|---|---|
| 0 | stainless / Brushed Stainless | #eef0f0→#9a9d9f | #cfd1d2 | 1 | 0.32 | 0 | 0.2 | 0.2 | 0.85 |
| 1 | graphite / Graphite Matte | #3a3b3e→#1d1e20 | #2f3134 | 0.4 | 0.42 | 0.6 | 0.18 | 0 | 1.0 |
| 2 | dune / Dune Metallic | #cbb895→#8f7b5c | #b39f7f | 0.55 | 0.34 | 1 | 0.04 | 0 | 0.95 |
| 3 | mist / Mist Blue | #9ab4bf→#56717c | #6f8e9a | 0.6 | 0.3 | 1 | 0.04 | 0 | 0.95 |

- Chỉ đổi `mats.body` (MeshPhysicalMaterial, roughnessMap brushed, clearcoatNormalMap orange-peel scale 0.12) — `materials.ts:57-69`. Animation: `color.lerp(target, 1−e^(−6dt))`, các tham số `damp(…, 6, dt)` (`Truck.tsx:316-324`). Kết hợp hiệu ứng clay khi explode (mục 1.3).
- `mats.body` có shader AO theo **toạ độ object** (y 0.55→1, vòm bánh |x|−1.85, y−0.5) + tăng roughness mặt hướng lên — `materials.ts:73-94`.
- Vật liệu khác cố định: glass `#0d1418` rough 0.03 clearcoat 1 env 1.6 opacity 0.86 (`materials.ts:96-99`); trim `#1d1e1f` rough 0.74 + grain normal (`:110`); tyre `#181816` rough 0.93 (`:113`); rim `#a7abb0` metal 0.95 (`:100`); chassis `#3a3936` (`:101`); front emissive `#f4f8ff` (`:102`); rear emissive `#e8383d` (`:103`); battery emissive `#5fb4ff` (`:123`); glow emissive `#6fb7ff` (`:128`).
- Bridge: `'primary'` = `mats.body` + `bodyRim.uRim`; `'glass'` = glass; `'rearLight'` = rear — `Truck.tsx:249-258`.

## 4. Hover
- Toàn bộ group xe là một vùng hover (`Truck.tsx:385-400`); id bridge `'axiom-t1'`, master rim max 1, speed 8 (`Truck.tsx:235-236`). Over/Move gọi `pickPart` + kích hoạt hover không stopPropagation; Out → `hovered = null` + ease-out (`Truck.tsx:388-399`).
- Phần được chọn = intersection gần nhất, leo lên tới ancestor có `userData.part` ∈ `body | glass | lights | wheels | chassis`, mặc định `body` (`Truck.tsx:17,240-244`). Trọng số phần `pa[k]` damp 8 (`Truck.tsx:298-299`).
- Rim (Fresnel `addRim`, `lib/rim.ts:18-41`), giá trị theo `h` = hover master:
  - body: `uRim = h·(0.55+0.65·pa.body)`, màu `#ffc690` power 1.7 (`Truck.tsx:301`, `materials.ts:52,70`); edges opacity `h·pa.body·0.7` (`Truck.tsx:331`).
  - glass: `h·(0.2+1.0·pa.glass)`, `#bfe3ff` power 1.8; envMapIntensity `1.6 + 1.8·h·pa.glass` (`Truck.tsx:302-303`, `materials.ts:98`).
  - wheels: rim `h·(0.2+1.0·pa.wheels)` (`#ffc690` p2), rim emissive `0.35·h·pa`, caliper emissive `1.6·h·pa` (`Truck.tsx:304-306`).
  - chassis: `h·(0.1+0.9·pa.chassis)`, `#9fd0ff` p2 (`Truck.tsx:307`, `materials.ts:101`).
  - lights: front/rear rim `h·pa.lights`; front emissive `1.8·(1+lh)`, glow `+lh·1.5` (`Truck.tsx:308-309,335-338`).
- Không có nhãn DOM cho hover ở demo này.

## 5. Ánh sáng / môi trường / nền
- Stage: `background #e4dccb`, `fov 28`, tone `neutral`, `exposure 1.0`, `shadows false`, `dprMax 1.75` (`index.tsx:30`). Không có post-processing.
- Fog `#e4dccb` 30→120 (`Scene.tsx:13,316`). `hemisphereLight('#eef4f7','#b59a70',0.55)`; `directionalLight [-6,11,7] 1.25 #fff2df` (không shadow) (`Scene.tsx:319-320`).
- Environment (`resolution 512, frames 1`) — `Scene.tsx:161-217`: sphere gradient (top `#6f93a8`, sky `#c6d8df`, hor `#e2dfd8`, sand `#9e9b95`, deep `#585652`); 6 dải cylinder R=30 tại góc ngẩng −0.15…−0.8°, −1.5…−1.75°, −2.7…−3.4°, −5…−6°, −10…−12°, +2.5…+4.5° với intensity 1.0/1.0/0.95/1.0/0.7/1.15 (`:190-195`); 4 softbox rect 2.6×16 ở góc 30/125/215/300°, r=22, y=1.5, intensity 1.0/0.7 xen kẽ (`:197-205`); strip sườn `[0,3.6,±13]` 40×0.7 int 1.1/1.0 (`:207-208`); rail 45° `[0,8,±8]` 30×0.9 int 0.8/0.7 và `[9,8,0]` 0.5×20 int 0.9 (`:210-212`); overhead `[0,10,0]` rot-x π/2 28×3.4 int 0.75 (`:214`).
- Bầu trời: sphere r=180 shader (top `#a9c8d6`, mid `#c1d7db`, horizon `#e4dccb`, sand `#cfc3ae`, mây mờ) (`Scene.tsx:13,39-73`). Nền cát: circle r=160, `#c8b99f`, sandTexture repeat 46 (`Scene.tsx:75-92`).
- Bóng: không shadow map; bóng thân baked plane 7.2×3.2 `#2e2418` (`Scene.tsx:95-106`) + bóng mỗi bánh (`Wheel.tsx:24,82`). FX layer 1 cho bụi/decal (`demos/automotive/layers.ts:2`, `Scene.tsx:294-296`).

## 6. Tương tác & chuyển động theo thời gian
- Orbit (`lib/CameraRig.tsx`): kéo chuột yaw+pitch, sensitivity 0.0058 rad/px; touch chỉ kéo ngang (khoá trục sau 6 px, tỉ lệ 1.15) (`:93-110`); double-click reset (`:115`); phím ←/→ ±0.18 rad (`:116-121`); damp yaw 9, pitch/dolly 8 (`:148-150`); nút zoom ×0.86 (`lib/ui.tsx:92-94`). Pitch ở đây bị chặn bởi `elevMax 0.5` (~29°) (`Scene.tsx:311-312`).
- Lần đầu pointerdown trên canvas → thêm class `ax-orbited`, ẩn "Scroll" hint (`hud.tsx:56-63`, `automotive.css:152`).
- Theo thời gian: `driveAcc` (bánh quay + cát trượt chỉ trong beat .01) (`Truck.tsx:287`); `Dust` 140 hạt trôi `t·0.35`, nhấp nhô `sin(t·0.6+i)·0.04` (`Scene.tsx:109-141`); `DustTrail` chu kỳ `t·0.55` (`Scene.tsx:275`). Không có intro assemble, không idle spin.

## 7. Swap points (thay bằng GLB photoreal)

Vị trí code phải đổi:
1. `Truck.tsx:24-151` (`useGeometries`) và `:154-183` (`useChassisGeo`) — nguồn hình học procedural; thay bằng node từ GLB.
2. `Truck.tsx:402-467` — gắn node GLB vào đúng 3 group `slabGroup` / `cabGroup` / `chassisGroup` (giữ ref, vì `:293-295` điều khiển Y của chúng).
3. `Wheel.tsx:80-102` — mỗi bánh phải là node riêng, pivot tại tâm trục, gắn vào `spin` (quay Z) bên trong root có `position.z` theo explode; bánh trái quay π quanh Y (`Wheel.tsx:84`) nên mặt ngoài GLB phải hướng +Z cục bộ. Caliper đặt ngoài `spin`.
4. `Truck.tsx:185-213` (`Corner`) — tay đòn/giảm xóc co giãn theo `scale.z` giữa thân và bánh; GLB cần giảm xóc tách riêng hoặc bỏ tính năng này.
5. `materials.ts:54-132` — thân GLB phải dùng (hoặc được gán) `mats.body` để variant + clay + rim chạy; các vật liệu `glass`, `rear`, `front`, `glow`, `battery`, `tyre`, `rim`, `chassis`, `caliper` đều bị `Truck.tsx:301-338` ghi đè mỗi frame.
6. `materials.ts:73-94` — shader AO dựa trên toạ độ object của thân procedural (ngưỡng y 0.55/1.0, |x|−1.85, y−0.5): phải gỡ hoặc hiệu chỉnh theo GLB (GLB thường có AO bake sẵn).
7. `Truck.tsx:146-147,428,455` — `EdgesGeometry(lower/upper, 25°)` cho đường exoskeleton; GLB mật độ cao sẽ cho quá nhiều cạnh → cần mesh/line riêng cho "structure lines".
8. Hằng số vị trí gắn với kích thước procedural: halo đèn hậu `[TAIL_X−0.03, 1.27, 0]` 1.9×0.22 (`Truck.tsx:446-447`), badge/plate (`:412,452`), GlowPool z = ±1.18 2.7×0.75 (`Scene.tsx:327-328`), BodyShadow 7.2×3.2 (`Scene.tsx:102-104`), DustTrail emitter x = ±1.85−0.38, z = ±0.95 (`Scene.tsx:273-274`), spot bánh (`Wheel.tsx:22`), `DIM` (`geometry.ts:13-28`), `NOSE_X/TAIL_X/FLOOR_Y` (`loft.ts:24-26`).
9. Camera stops `Scene.tsx:16-24` giả định xe dài ~6 m, nóc ~2 m, tâm tại gốc; GLB phải được scale/đặt cùng khung (mũi +X, mặt đất y = 0) hoặc chỉnh lại stops.

Tính năng PHỤ THUỘC cấu trúc procedural (GLB phải cung cấp):
- **Exploded 3 lớp** (34–68 %): cần node tách được `Body_Lower` (sườn, cửa, vòm bánh, cản, mũi/đuôi dưới), `Body_Upper` (capo, greenhouse, mái, thành thùng, mặt tailgate — gồm cả kính và đèn hậu), `Chassis` (khung, pin, mô-tơ) — mép nối giữa lower/upper phải trùng belt line để khi nghỉ không lộ khe.
- **Bánh quay + trượt ra**: 4 node `Wheel_FL/FR/RL/RR` (pivot tâm trục, trục quay = Z), tách khỏi caliper/hub cố định.
- **Hover theo phần**: mỗi node phải gán `userData.part` ∈ {`body`,`glass`,`lights`,`wheels`,`chassis`} (hoặc map theo tên) — `Truck.tsx:240-244`.
- **Vật liệu theo tên** (gợi ý tên material trong GLB): `Body_Paint` (→ primary/finish), `Glass`, `Light_Front_DRL`, `Light_Rear_Bar`, `Light_Rocker_Glow`, `Battery_Cells`, `Tyre`, `Rim`, `Chassis`, `Caliper`, `Trim`.
