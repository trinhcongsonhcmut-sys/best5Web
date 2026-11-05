# QC JUDGE vòng 2 — `/beauty` · BAHA Botanica

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này). Chấm theo những gì nhìn thấy ở vòng này, không neo theo điểm vòng 1.
Skill `3d-visual-qc`: đã load, checklist 1–8 áp dụng.

**Điều kiện đo:** dev server riêng `npx vite --port 5198 --strictPort` (DEV, không phải build). Chrome qua Playwright MCP, GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1. **Máy, GPU và cả phiên trình duyệt MCP dùng chung với judge khác (port 5199) và với bộ QC của repo chạy song song**, nên số FPS chỉ là tham khảo.
Ảnh: `qc-evidence/judge/round2/shots/beauty-*.jpg`. Script tái lập: `.playwright-mcp/r2_beauty.js`.

## QC của repo (tôi tự chạy)
`QC_MODE=dev QC_PORT=5197 QC_ID=judge-beauty npx playwright test -g "beauty"` ⇒ **10/10 PASS** (2,7 phút): load/no-error, orbit 360 + reset, ≥3 biến thể, hover in/out, scroll 0–100 xuôi/ngược, resize 1920/1440/390, đo FPS, mobile touch (vuốt ngang xoay, vuốt dọc cuộn, không tràn ngang). Log: chỉ có warning `THREE.Clock deprecated`.

## Điểm: **89 / 100**, chưa đạt 90 (thiếu 1 điểm)

| Hạng mục | Điểm | Lý do |
|---|---|---|
| Chất lượng 3D (30) | **27** | Hũ lục sâu satin, nắp 72 gân + logo foil, nhãn sau đầy đủ, 5 nguyên liệu đã ra hình (hạt shea, lá trà có gân, viên vitamin E, giọt squalane, lát lô hội có vỏ + ruột), bục 2 tầng viền vàng. Bị trừ vì quầng hover làm mép hũ/nắp nhòe như ảnh chồng, giọt squalane cắm xuyên miệng hũ, và hũ ở 100% chìa ra ngoài mép bục. |
| Animation & tương tác (30) | **27** | Lắp ráp bay vào theo thời gian sau `ready`; 6 đích hover; orbit, scroll xuôi = ngược, jitter đều đạt. Bị trừ vì callout va nhau và va vật thể khi orbit ở 50%. |
| Bám tinh thần mẫu (20) | **18** | Khớp A1: hũ lục sâu trên nền xanh băng, lá tiền cảnh rẽ ra, nắp và thân bay vào lắp ráp, callout 5 thành phần, chữ Didone sau hũ. A2 (đổi cả thế giới màu) đạt. Lệch: thân hũ đọc như nhựa/sứ bóng hơn là thủy tinh frosted; khung cuối dùng bục + serum thay cho vòng mint + bàn tay (spec cho phép). |
| Thiết kế frontend (10) | **8** | Typography và khoảng trắng tốt, hero không còn đè chữ. Bị trừ vì callout 1920 ở 50% bị lát lô hội che, nhãn Squalane chồng lên viên vitamin E khi xoay ra sau, và mobile ở 0% lộ chân lá bị cắt. |
| Hiệu suất & ổn định (10) | **9** | 0 console error, pageerror hay request 4xx. Ready 1,4–1,7 s (warm), cold 9,9 s (DEV). rAF 1440 ≈ 54–68 fps, 1920 ≈ 50 fps, 390 ≈ 67 fps, trong điều kiện GPU dùng chung. |

## Mục bắt buộc (không bù bằng điểm)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mô hình 3D tương tác thật | **PASS** | `beauty-orb0-high.jpg` (nhìn đỉnh nắp, logo foil), `beauty-orb0-back.jpg` (nhãn sau) |
| Orbit 360° | **PASS**: 4×271 px ⇒ `yawTotal −6,287` (0%), −12,49 (50%), −18,85 (100%); pitch ±1,2 rad; `resetView()` về đúng camera của mốc | `beauty-orb{0,50,100}-{front,right,back,left,high,low}.jpg` |
| Đổi màu/vật liệu | **PASS**: `primary` `#1b4b2c` → `#c87589` → `#a7561b`; transmission .45, clearcoat .6 giữ nguyên; nền, nắp và từ khóa (SOOTHE/BLOOM/GLOW) đổi theo | `beauty-variant-0/1/2.jpg`, đang chuyển: `beauty-variant-1-t150.jpg` |
| Hover có phản hồi | **PASS**: các id `jar`, `ingredient-0..4`, `hover.value` 0,99–1,0; rời chuột ⇒ 0. Quầng sáng thấy rõ | `beauty-hov0-0-jar.jpg` so với `beauty-hov0-off.jpg`; `beauty-hov50-3-ingredient_1.jpg` |
| Scroll mượt và khôi phục | **PASS**: camera ở 0/25/50/75/100 khi cuộn xuôi = khi cuộn ngược (FOV lệch ≤ 0,005°). Nhảy 1→0,3 hội tụ trơn trong ~0,6 s, không pop. Wheel thật 6×300 px ⇒ progress 0,323 (scrub theo tiến độ) | `beauty-fwd-*.jpg`, `beauty-back-*.jpg`, `beauty-jitter-settled-30.jpg` |
| Không trắng/crash | **PASS**: 0 error | log phiên đo |
| Không sai lệch nghiêm trọng với mẫu | **PASS** | xem phần so mẫu |
| Không dùng ảnh/video thay 3D | **PASS** | toàn bộ là mesh và shader |

## Lỗi vòng 1: trạng thái

| # vòng 1 | Lỗi | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| 1 | Hover vô hình, chỉ 1 đích | **FIXED** | 6 đích (jar + 5 nguyên liệu). Quầng cyan và nhãn đậm lên thấy rõ (`beauty-hov0-0-jar.jpg`, `beauty-hov50-3-ingredient_1.jpg`). Riêng chất lượng quầng thành lỗi mới N2. |
| 2 | Hũ mint nhạt, lệch A1 | **FIXED** | Đo `#1b4b2c`, transmission .45, roughness .32 (`beauty-fwd-0.jpg`). Builder ghi `#0f4a2a`; giá trị đọc qua getHexString khác một chút, nhưng nhìn ra lục sâu đúng tinh thần A1. |
| 3 | Mô tả hero đè chữ S; hint đè lá | **FIXED** | Khối intro kết thúc ở y≈255, SOOTHE bắt đầu ở y≈370 (`beauty-back-0.jpg`). Hint nằm trong pill nền mờ. |
| 4 | Callout đè vật thể (desktop + mobile) | **PARTIAL** | Mobile đã đổi sang chấm số + danh sách, sạch (`beauty-390x844-50.jpg`). Desktop chính diện 1440 sạch (`beauty-fwd-50.jpg`). Còn lỗi ở 1920 và khi orbit (N1). |
| 5 | Nguyên liệu thô | **FIXED** | `beauty-fwd-50.jpg`, `beauty-orb50-back.jpg`: lá trà có gân, lát lô hội có vỏ và ruột, giọt squalane trong, viên E bóng. |
| 6 | Thiếu lắp ráp bay vào | **FIXED** | Chạy theo thời gian sau `ready`, scroll vẫn = 0: `beauty-intro-0.jpg` chưa có hũ, `beauty-intro-600.jpg` nắp ở trên và thân đang vào, `beauty-intro-2600.jpg` đã lắp xong. Cuộn về 0 không phát lại (`beauty-back-0.jpg`). |
| 7 | Lá lộ đầu cắt khi nhìn từ trên | **FIXED** trên desktop | `beauty-orb0-high.jpg`: lá đã rẽ hết. Mobile còn lộ chân lá ở góc mặc định (N3). |
| 8 | Mobile mất từ khóa | **FIXED** | `beauty-390x844-0.jpg`: "SOO / THE" xếp 2 dòng sau hũ. |
| 9 | Khựng fps sau ready | **PARTIAL** (không tách riêng được) | Ready warm 1,4–1,7 s; rAF 54 fps trong 3 s đầu khi GPU dùng chung, 68 khi nhàn. Không đo được trong điều kiện sạch. |
| claim | Texture nhỏ hơn | **Chưa kiểm chứng** | Không đo bộ nhớ texture. |

## Lỗi mới (xếp theo mức nghiêm trọng)

**N1. Callout va vật thể và va nhau ở 50%**
- 1920×1080, 50%, góc mặc định: mũi lát lô hội che chữ "A" của nhãn "Aloe gel" (`beauty-1920x1080-50.jpg`, x≈1290, y≈670).
- 1440, 50%, orbit ra sau (yaw π): nhãn "Squalane / KHÓA ẨM" nằm đè lên viên vitamin E, và sát nhãn "Vitamin E" bên trái (`beauty-orb50-back.jpg`, x≈340–490, y≈380–410).

Sửa: mỗi frame chiếu bbox màn hình của từng nguyên liệu (8 góc AABB → NDC) rồi đẩy nhãn ra khỏi mọi bbox theo hướng từ tâm hũ, cộng khoảng cách tối thiểu 24 px. Giải chồng nhãn–nhãn bằng 2–3 vòng relax trục y (khoảng cách ≥ 34 px). Nếu sau relax vẫn chồng thì ẩn nhãn nào có độ sâu xa hơn (opacity 0,25 như nhãn đang bị khuất).

**N2. Quầng hover làm hũ nhòe như ảnh chồng** (0%, 1440, rê vào hũ)
- Viền nắp và thân có dải trắng-cyan mờ dày 8–15 px, gân nắp bị kéo vệt, nhìn như ảnh lệch tiêu cự (`beauty-hov0-0-jar.jpg` so với `beauty-hov0-off.jpg`). Cùng hiện tượng khi chuột dừng trên hũ sau thao tác kéo (`beauty-orb100-back.jpg`).
- Hover thì thấy rõ, nhưng nhìn rẻ hơn mức "premium" của A1.

Sửa: giới hạn shell/halo ở độ dày ≤ 0,012 đơn vị (khoảng 3–4 px ở khung 0%), đặt `depthWrite:false` và vẽ sau thân, dùng Fresnel power 3 thay cho halo đặc. Giữ phần nâng `envMapIntensity` và vệt sweep trên nắp.

**N3. Mobile 390×844 ở 0% lộ chân lá bị cắt** (`beauty-390x844-0.jpg`)
- Lá trái kết thúc lơ lửng ở y≈775, lá phải ở y≈710: thấy rõ đáy lá phẳng giữa màn hình.

Sửa: trên viewport dọc (aspect < 0,8), dịch cụm lá xuống −0,6 đơn vị và scale y ×1,25 để gốc lá nằm dưới mép dưới khung, hoặc fade gốc lá bằng alpha theo chiều cao.

**N4. Giọt squalane cắm xuyên miệng hũ ở 50%**
- Giọt vàng nhô ra từ miệng hũ như bị kẹt (`beauty-fwd-50.jpg` x≈760, y≈360; `beauty-1920x1080-50.jpg`).

Sửa: đặt bán kính quỹ đạo của squalane ≥ bán kính hũ + 0,25, hoặc kiểm tra giao cắt và đẩy y lên trên vành.

**N5. Hũ ở 100% chìa ra ngoài mép bục**
- 1440 nhìn chính diện, đáy hũ đè lên mép trước tầng trên của bục, trông như sắp rơi (`beauty-fwd-100.jpg`). Mobile còn rõ hơn: hũ tràn qua mép trái bục (`beauty-390x844-100.jpg`).

Sửa: dời hũ về phía tâm bục (x −0,15 → 0, z +0,1 → −0,1) hoặc tăng bán kính tầng trên 10%.

**N6. Thân hũ đọc như nhựa/sứ bóng, chưa ra thủy tinh**
- Không thấy độ dày thành hay khúc xạ ở mép (`beauty-fwd-25.jpg`). Đây là đánh bóng.

Sửa: thêm `thickness 0.8`, `attenuationDistance 0.35`, `roughness 0.22` ở dải mép (dùng roughnessMap theo Fresnel), và một sọc specular đứng mảnh từ Lightformer dải bên.

## Độ giống mẫu
- **A1:** khớp tốt hơn rõ rệt so với vòng 1. Hũ lục sâu, nắp than chì, lá tiền cảnh rẽ ra, nắp và thân bay vào lắp ráp, chữ Didone khổng lồ sau hũ, callout 5 thành phần quanh hũ.
- **Tỉ lệ:** hũ ≈ 37% bề rộng (1440) so với ≈ 44% ở A1, gần hơn vòng 1 (29%).
- **Lệch còn lại:** vật liệu đọc như nhựa bóng; A1 có một nhịp "ingredient list + bàn tay" ở cuối mà ta thay bằng bục + serum (spec cho phép).
- **A2:** đổi đồng thời nền, vật liệu, nắp và từ khóa, có crossfade; đúng cơ chế.
- **Đánh giá chung:** khoảng 80–85% tinh thần A1 trong trải nghiệm WebGL thật.

## Kết luận
**89/100, chưa đạt ≥ 90 (thiếu sát nút).** Ba sửa tối thiểu để lên ≥ 90:
1. N1: tránh va callout (khoảng +1 đến +2).
2. N2: quầng hover gọn (khoảng +1).
3. N3: chân lá trên mobile (khoảng +0,5).

N4–N6 là đánh bóng, đưa lên khoảng 92–93.
