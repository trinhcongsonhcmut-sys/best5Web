# QC JUDGE vòng 4 — `/beauty` · BAHA Botanica

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này) · Skill `3d-visual-qc` đã load, checklist 1–8. Chấm theo cái nhìn thấy vòng này.
Điều kiện: dev server riêng port 5199 (DEV), Chrome qua Playwright MCP, `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác. Máy dùng chung ⇒ không dùng FPS làm bằng chứng (orchestrator đã đo production 58–75 fps).
Ảnh: `qc-evidence/judge/round4/shots/beauty-*.jpg`. Script: `.playwright-mcp/r4_beauty_A.js`, `_B.js` + đo nhãn theo orbit.

## Điểm: **92 / 100** (vòng 3: 91) — ĐẠT ngưỡng 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **27** | Hũ lục gờ dày, nắp 72 gân, nhãn trước/sau, kem xoáy, 5 nguyên liệu rõ hình, bục viền vàng, serum trong có khúc xạ chữ phía sau; giọt sương xám đã hết; nhưng thân hũ vẫn đọc là nhựa/sứ bóng đục (sọc specular dọc chỉ thoáng thấy), hạt shea có quầng trắng lạ ở góc sau. |
| Animation & tương tác (30) | **29** | Orbit/reset/3 biến thể/hover/scroll xuôi = ngược/jitter đạt; 5/5 nhãn ở góc mặc định 50%, khi orbit nhãn bị che thì ẩn, không chồng nhau. |
| Bám tinh thần mẫu (20) | **18** | Rất sát A1 (hũ lục, lá tiền cảnh, Didone khổng lồ sau hũ, nắp tách – lõi kem, 5 callout quanh hũ) và A2 (đổi cả thế giới màu + từ khóa); thiếu nhịp bàn tay/vòng mint (spec cho phép bục). |
| Thiết kế frontend (10) | **9** | Tiêu đề 1920 giờ 2 dòng, 50% đã hạ khung; trừ: mobile 50% lát aloe bị cắt mép phải, giọt squalane dính mép vai hũ ở góc mặc định. |
| Hiệu suất & ổn định (10) | **9** | 0 console error / pageerror / HTTP lỗi; ready ~3 s. |

## Mục bắt buộc

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mô hình 3D tương tác thật | **PASS** | `beauty-orb0-dragDown.jpg`, `beauty-orb50-back.jpg` (nhãn sau "RITUAL") |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal −6,287` (tích lũy −12,57 / −18,85); reset ⇒ `[0,0.9,4.65]` / `[-1.19,1.5,7]` / `[1.25,1.5,7.9]` | `beauty-orb{0,50,100}-*.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary` `#0f4a2a` → `#c9768a` → `#a8561b` (transmission .45, clearcoat .6, r .20 giữ); nền, nắp, từ khóa (SOOTHE/BLOOM/GLOW) đổi theo ở 0% và 100% | `beauty-var0-0..2.jpg`, `beauty-var100-0..2.jpg` |
| Hover có phản hồi | **PASS** — `jar` ở mọi mốc, `ingredient-1..4` (50%), `serum` (100%); `hover.value` = 1, rời ⇒ 0 (ingredient-0 ghé lại báo 0 — điểm rơi mép lát aloe, không phải lỗi chức năng) | `beauty-hov0-off.jpg` vs `beauty-hov0-0-jar.jpg`; `beauty-hov100-0-serum.jpg` |
| Scroll mượt và khôi phục | **PASS** — 5 mốc xuôi = ngược (FOV lệch ≤ 0,005°); nhảy 1→0,3 hội tụ ~420 ms; wheel-jitter về 0 | `beauty-fwd-*.jpg`, `beauty-back-*.jpg` |
| Không trắng/crash | **PASS** | 0 error |
| Không sai lệch nghiêm trọng với mẫu | **PASS** | — |
| Không ảnh/video thay 3D | **PASS** | — |

## Lỗi vòng 3 → trạng thái vòng 4

| # | Lỗi vòng 3 | Trạng thái | Bằng chứng |
|---|---|---|---|
| M1 | 50% chỉ 3/5 nhãn | **FIXED** | `beauty-fwd-50.jpg`: Squalane, Vitamin E, Shea butter, Aloe gel, Green tea đều hiện (opacity 1, đo DOM), không chồng; orbit 45/90/135/180°: 3–4 nhãn hiện, nhãn bị che ẩn mượt, không va nhau. Mobile 50%: 5 pill số `beauty-390x844-50.jpg` |
| M2 | Bọt khí xám phẳng trước thân hũ | **FIXED** | `beauty-crop50-jar.jpg`: chỉ còn giọt nhỏ tâm trong + viền sáng (x≈195,y≈135 trong crop), không còn đĩa xám đục |
| M3 | Thân hũ chưa đọc là thủy tinh | **PARTIALLY** | `beauty-crop0-jar.jpg`: có 2 sọc specular dọc mảnh (x≈425–440) + dải ngang ở vai, roughness thấp hơn; nhưng không thấy độ dày thành/khúc xạ — vẫn là nhựa bóng tối (A1 cũng là hũ đục, nên lệch nhỏ) |
| M4 | 50% đáy khung trống ~35% | **FIXED (cơ bản)** | `beauty-fwd-50.jpg`: Green tea ở y≈750, trống còn ~13% |
| M5 | Tiêu đề 1920 ngắt 3 dòng | **FIXED** | `beauty-1920x1080-0.jpg`: "Calm, / held in glass." 2 dòng |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **B1 — Thân hũ vẫn chưa ra thủy tinh** — 0% và 75%, 1440/1920 (`beauty-crop0-jar.jpg`, `beauty-fwd-75-b.jpg`). **Sửa:** để một khe sáng ở mép trên thân (rim lighten theo Fresnel, dày 3–4 px màu `primary` sáng ×1,8) cho cảm giác bề dày thủy tinh; ở 75% khi kem nhấc ra cho thấy thành trong của hũ sáng hơn thành ngoài (inner wall `side: BackSide` màu primary nhạt .5) — không cần thêm lớp transmission.
2. **B2 — Mobile 50%: lát aloe bị cắt mép phải** — `beauty-390x844-50.jpg` x≈290–390. **Sửa:** `aspect < 0.6` ⇒ thu bán kính quỹ đạo nguyên liệu ×0,82.
3. **B3 — Giọt squalane chạm/đè mép vai hũ ở góc mặc định 50%** — `beauty-crop50-jar.jpg` góc trái trên, `beauty-fwd-50.jpg` x≈550–595,y≈380–450. **Sửa:** đẩy squalane ra ngoài thêm 0,15 đơn vị theo x âm.
4. **B4 — Hạt shea có quầng trắng phát sáng khi nhìn từ sau** — `beauty-orb50-back.jpg` x≈935–1020,y≈420–490 (không có hover). **Sửa:** kiểm tra rim/sheen của shea khi backlit, giới hạn `sheen ≤ .3` hoặc rim theo hướng light chính chứ không theo view.
5. **B5 (nhỏ) — Lá trà xanh che nhãn "Aloe" ở 50%** — `beauty-fwd-50.jpg`. Có thể chấp nhận (tạo chiều sâu), nhưng nếu muốn sạch: dời lá trà xuống-phải 0,2.

## Độ giống mẫu (A1, A2)
- A1: hũ lục sâu nắp than chì trên nền xanh băng, lá tiền cảnh rẽ ra, Didone khổng lồ sau hũ, nắp tách – lõi kem, 5 thành phần có callout quanh hũ (giống frame A1 "Aloe Vera / Vitamin E / Squalane / Shea / Green Tea") — ~88% bố cục và nhịp.
- A2: đổi đồng thời nền, thân, nắp, từ khóa — đúng cơ chế.
- Lệch: không có nhịp bàn tay/vòng mint cuối (thay bằng bục + serum); hũ hơi bóng nhựa hơn A1 (A1 mờ satin).

## Có đạt ≥ 90? — **Có (92).** Để giữ biên an toàn ≥ 94: B1 (+1), B2 + B3 (+0,5–1), B4 (+0,5).
