# QC JUDGE vòng 3 — `/beauty` · BAHA Botanica

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này). Chấm theo cái nhìn thấy ở vòng này. Skill `3d-visual-qc` đã load, checklist 1–8 áp dụng.
Điều kiện đo: dev server riêng `npx vite --port 5199 --strictPort` (DEV), Chrome qua Playwright MCP, GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác. **Các agent khác dùng cùng GPU/CPU cùng lúc** — FPS chỉ tham khảo, orchestrator đo lại trên máy yên tĩnh (production build).
Ảnh: `qc-evidence/judge/round3/shots/beauty-*.jpg`. Script: `.playwright-mcp/r3_beauty_A.js`, `_B.js`.

## Điểm: **91 / 100** (vòng 2: 89) — ĐẠT ngưỡng 90 (sát nút)

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **27** | Hũ lục sâu có gờ miệng dày, nắp 72 gân + logo foil, nhãn trước/sau, 5 nguyên liệu có hình rõ, bục 2 tầng viền vàng, serum dropper trong; trừ vì thân hũ vẫn đọc là nhựa/sứ bóng đục (không thấy độ dày thủy tinh), và một bọt khí xám phẳng nằm trước thân hũ ở 50% trông như vết bẩn. |
| Animation & tương tác (30) | **28** | Lắp ráp bay vào sau ready, orbit/reset/3 biến thể/scroll xuôi = ngược/jitter đều đạt; hover gọn; callout có leader line và ẩn khi bị che; trừ vì ở góc mặc định 50% chỉ 3/5 nguyên liệu có nhãn (Shea, Squalane bị ẩn). |
| Bám tinh thần mẫu (20) | **18** | Rất sát A1 (hũ lục, lá tiền cảnh, chữ Didone khổng lồ sau hũ, nắp tách – lõi kem, callout thành phần) và A2 (đổi cả thế giới màu + từ khóa SOOTHE/BLOOM/GLOW); thiếu nhịp "bàn tay + vòng mint" cuối (spec cho phép thay bằng bục). |
| Thiết kế frontend (10) | **9** | Typography/khoảng trắng tốt ở 3 viewport, mobile dùng chip số sạch; trừ nhẹ: 50% để trống ~35% dưới khung, tiêu đề 1920 ngắt 3 dòng ("Calm, / held in / glass."). |
| Hiệu suất & ổn định (10) | **9** | 0 console error/pageerror/HTTP lỗi; ready lạnh 3,4 s / ấm 2,7 s; fps 2 s ngay sau ready 48,2 ≈ idle 47,9 (không thấy hitch sau ready); scrub 20 fps p95 175 ms dưới tranh chấp GPU nặng — không quyết định. |

## Mục bắt buộc (không bù bằng điểm)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mô hình 3D tương tác thật | **PASS** | `beauty-orb0-dragDown.jpg` (đỉnh nắp logo B foil), `beauty-orb0-back.jpg` (nhãn sau) |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal −6,287` (tích lũy −12,57 / −18,85); `resetView()` ⇒ `[0,0.9,4.65]` / `[-1.19,1.31,7]` / `[1.25,1.5,7.9]` đúng pose mốc | `beauty-orb{0,50,100}-*.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary` `#0f4a2a` → `#c8768a` → `#a8561c` (transmission .45, clearcoat .6, r .24 giữ nguyên); nền, nắp, từ khóa đổi theo (SOOTHE/BLOOM/GLOW) ở cả 0% và 100% | `beauty-var0-0..2.jpg`, `beauty-var100-0..2.jpg` |
| Hover có phản hồi | **PASS** — `jar` (0/25/75/100%), `ingredient-0/3/4` (50%), `serum` (100%); `hover.value` = 1, rời ⇒ 0. Ở 75% quét lưới lần đầu báo 0 (điểm rơi mép), kiểm lại tại thân/lõi/nắp ⇒ `jar` = 1 cả ba | `beauty-hov0-off.jpg` vs `beauty-hov0-0-jar.jpg`; `beauty-hov75-body.jpg`; `beauty-hov100-0-serum.jpg` |
| Scroll mượt và khôi phục | **PASS** — 5 mốc xuôi = ngược (FOV lệch ≤ 0,005°); nhảy 1→0,3 hội tụ ~420 ms không pop; wheel 15×900/10×−900 ⇒ về 0 trong ~250 ms | `beauty-fwd-*.jpg`, `beauty-back-*.jpg` |
| Không trắng/crash | **PASS** — 0 error | log phiên |
| Không sai lệch nghiêm trọng với mẫu | **PASS** | — |
| Không dùng ảnh/video thay 3D | **PASS** | — |

## Lỗi vòng 2 → trạng thái vòng 3

| # | Lỗi vòng 2 | Trạng thái | Bằng chứng |
|---|---|---|---|
| N1 | Callout va vật/va nhau ở 50% (1920 + orbit) | **FIXED** | `beauty-1920x1080-50.jpg`: Green tea / Vitamin E / Aloe gel không bị vật che; `beauty-orb50-back.jpg`, `-left.jpg`, `-right.jpg`: nhãn tách nhau, nhãn bị che mờ đi (Green tea mờ ở góc sau). Lỗi phụ mới: xem M1 |
| N2 | Quầng hover nhòe như ảnh chồng | **FIXED** | `beauty-hov0-0-jar.jpg` (crop so `-off`): viền nắp/gân sắc, chỉ còn lớp fresnel cyan mỏng phủ thân, không còn dải mờ 8–15 px |
| N3 | Mobile 0% lộ chân lá cắt | **FIXED** | `beauty-390x844-0.jpg`: gốc lá chạy ra ngoài mép dưới |
| N4 | Giọt squalane cắm xuyên miệng hũ | **FIXED** | `beauty-fwd-50.jpg`: không còn giọt ở miệng hũ; `beauty-orb50-right.jpg` giọt nằm riêng bên trái |
| N5 | Hũ 100% chìa ra mép bục | **FIXED** | `beauty-fwd-100.jpg`, `beauty-390x844-100.jpg`, `beauty-orb100-*.jpg`: hũ nằm trọn trên tầng trên |
| N6 | Thân hũ đọc như nhựa, chưa ra thủy tinh | **PARTIAL** | `beauty-fwd-0.jpg`: gờ miệng dày hơn, dải specular ngang ở vai; nhưng không thấy khúc xạ/độ dày thành — vẫn đục bóng (A1 cũng là hũ lục đục mờ, nên mức lệch nhỏ) |
| v1-#9 | Khựng fps sau ready | **FIXED (tạm)** | rAF 2 s ngay sau ready 48,2 fps vs idle 47,9 fps (cùng điều kiện tranh chấp); không có khung > 54 ms trong cửa sổ đó |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **M1 — Góc mặc định 50% chỉ ghi nhãn 3/5 nguyên liệu** — 1440 & 1920, 50%, góc reset (`beauty-fwd-50.jpg`, `beauty-1920x1080-50.jpg`): Shea butter (nằm sau lá trà) và Squalane (sau hũ) bị logic che-ẩn tắt nhãn, trong khi tiêu đề là "Five quiet actives". **Sửa:** đặt lại quỹ đạo ở pose mặc định để cả 5 vật đều lộ ≥ 60% (Shea dời ra trái-trên lá trà ~0,35 đơn vị, Squalane ra trước-phải hũ ở z +0,4); hoặc khi bị che, giữ nhãn ở opacity .55 và vẽ leader tới mép vật thể thay vì ẩn hẳn.
2. **M2 — Bọt khí xám phẳng nằm trước thân hũ** — 50%, 1440 (`beauty-fwd-50.jpg` x≈612,y≈462; crop thấy đĩa xám đục). **Sửa:** bọt khí dùng `MeshPhysicalMaterial` transmission 1 + rim Fresnel (hoặc sprite có viền sáng, tâm trong suốt), và loại bọt nằm trong hình chiếu thân hũ.
3. **M3 — Thân hũ chưa đọc là thủy tinh** (N6 cũ). **Sửa:** `thickness .8`, `attenuationColor` = primary, `attenuationDistance .35`, thêm một Lightformer dải đứng mảnh bên trái để có sọc specular dọc; tăng `ior 1.5` và để lộ bóng kem bên trong qua mép trên.
4. **M4 — 50%: đáy khung trống ~35%** — `beauty-fwd-50.jpg` y≈620–900. **Sửa:** hạ target y −0,25 hoặc đẩy cụm nguyên liệu xuống quỹ đạo thấp hơn (Shea/Squalane dưới hũ) như A1 (nhãn ở cả 4 góc).
5. **M5 — 1920: tiêu đề hero ngắt 3 dòng** — `beauty-1920x1080-0.jpg` ("Calm, / held in / glass."). **Sửa:** `max-width` khối intro theo `ch` (≥ 18ch) thay vì px cố định.

## Độ giống mẫu (A1, A2)
- **A1:** hũ lục sâu nắp than chì trên nền xanh băng, lá tiền cảnh rẽ ra, chữ Didone khổng lồ sau hũ (NOURISH → SOOTHE), nắp bay lên lộ kem, callout thành phần quanh hũ — ~85% bố cục và nhịp. Hũ ≈ 37% bề rộng ở 1440 (A1 ≈ 44%).
- **A2:** đổi đồng thời nền, vật liệu thân, nắp và từ khóa với crossfade (`beauty-var0-0..2.jpg`) — đúng cơ chế "đổi cả thế giới màu".
- Lệch: thiếu nhịp bàn tay/vòng mint cuối (thay bằng bục + serum, spec cho phép); A1 hiện 5 icon thành phần cùng lúc, ta chỉ 3 ở góc mặc định.

## Kết luận
**91/100 — đạt ≥ 90 nhưng sát nút.** Để giữ biên an toàn (≥ 93): M1 (5/5 nhãn ở góc mặc định) +1, M2 + M3 (bọt khí, chất thủy tinh) +1, M4 (bố cục 50%) +0,5.
