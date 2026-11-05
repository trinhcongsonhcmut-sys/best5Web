# QC JUDGE (Agent 05) — `/beauty` · BAHA Botanica (Beauty 3D)

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này).
Skill `3d-visual-qc`: **đã load**, checklist 1–8 áp dụng bên dưới.
Điều kiện đo: dev server riêng `npx vite --port 5198 --strictPort` (DEV, không phải build), Chrome qua Playwright MCP, GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, viewport 1440×900 (trừ khi ghi khác; trang có thanh cuộn dọc ~15 px).
Ảnh của tôi: `qc-evidence/judge/shots/beauty-*.jpg` · Script tái lập: `qc-evidence/judge/scripts/judge_beauty.js`.
Ảnh builder đã xem: toàn bộ 21 ảnh `qc-evidence/shots/beauty/*.jpg`. Mẫu đã xem: `reference/shots/A1-contact.jpg`, `A2-contact.jpg`.

## Điểm: **78 / 100** — CHƯA đạt mục tiêu 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **23** | Hũ lathe, nắp 72 gân, nhãn, kem xoáy, chai dropper đẹp; nhưng thủy tinh đọc như nhựa mint đục (không phải lục sâu frosted của A1), nguyên liệu là khối nguyên thủy thô (“Aloe gel” là thanh hộp như cục tẩy), lá nha đam nhìn từ trên lộ đầu cắt phẳng. |
| Animation & tương tác (30) | **24** | Orbit 360°/reset/scroll xuôi-ngược/jitter đều đúng số đo; nhưng hover gần như không nhìn thấy, chỉ có 1 vùng hover (jar), không có pha “nắp + thân bay vào lắp ráp” của A1. |
| Bám tinh thần mẫu (20) | **16** | Chữ Didone khổng lồ sau hũ + lá tiền cảnh + callout 5 thành phần + đổi “thế giới màu” đúng cơ chế; lệch màu hũ (mint nhạt vs lục sâu `#04381a`), hũ nhỏ hơn (≈29% vs 44% bề rộng), thiếu lắp ráp bay vào. |
| Thiết kế frontend (10) | **7** | Typography serif/sans đẹp, khoảng trắng tốt; nhưng mô tả hero đè lên chữ “S” của SOOTHE, nhãn callout đè vật thể (desktop 50% và mobile), từ khóa lớn bị cắt gần hết trên mobile. |
| Hiệu suất & ổn định (10) | **8** | 0 console error/pageerror/request fail; warm ready 1,8–2,9 s; nhưng 3 s đầu sau ready rAF chỉ 41 fps, cold ready 17,3 s (DEV). |

## Lỗi bắt buộc sửa (không bù bằng điểm)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mô hình 3D tương tác thật | **PASS** | `judge/shots/beauty-orbit-low.jpg` (nhìn từ trên thấy logo nắp), `beauty-orbit-high.jpg`, `beauty-orbit-at100-back.jpg` |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal = −6,287`; pitch đạt ±1,2 rad; `resetView()` ⇒ camera `[0,0.80,4.75]` đúng gốc | `beauty-orbit-front/right/back/left/full360.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary`: `#c2d5c9` → `#f3d7dc` → `#e9ccbe` (transmission .92, clearcoat 1 giữ nguyên); nền WebGL (ShaderMaterial) đổi xanh → hồng → đào; nắp đổi than → trắng; từ khóa SOOTHE/BLOOM/GLOW đổi | `beauty-variant-0/1/2.jpg`, `beauty-variant-transition-120ms.jpg` |
| Hover có phản hồi | **PASS (rất yếu)** — `hover.value 0,9998`, rim 1,10; rời ⇒ 0. Bằng mắt khác biệt gần như bằng 0 | `beauty-hover-0-jar.jpg` vs `beauty-hover-off.jpg` |
| Scroll mượt / khôi phục | **PASS** — camera 0/25/50/75/100 xuôi = ngược (lệch FOV ≤ 0,005°); jitter 0→1→0,3 hội tụ trơn ~300 ms không pop; wheel thật 1000 px ⇒ progress 0,179 (scrub theo tiến độ) | `beauty-scroll-fwd-*.jpg`, `beauty-scroll-back-*.jpg`, `beauty-jitter-settled-30.jpg` |
| Không trắng/crash | **PASS** — 0 error; chỉ warning `THREE.Clock deprecated` | log phiên đo |
| Không sai lệch nghiêm trọng với mẫu | **PASS** (sai lệch vừa, xem dưới) | — |
| Không dùng ảnh/video giả 3D | **PASS** — mọi vật thể là mesh, nền là shader | `beauty-orbit-at50-low.jpg` |

## Danh sách lỗi (xếp theo mức nghiêm trọng)

1. **Hover gần như vô hình và chỉ có một đích** — 0%, 1440×900: so `judge/shots/beauty-hover-0-jar.jpg` với `beauty-hover-off.jpg` chỉ khác một vệt sáng mảnh ở mép nắp; quét lưới 30 px ở 50% không tìm thấy hover nào trên 5 nguyên liệu (chỉ `jar`); builder `qc-evidence/shots/beauty/hover-on.jpg` vs `timeline-0.jpg` cũng gần trùng. Spec: “rim sáng trên thân hũ + thủy tinh sáng nhẹ, nắp lóe highlight”.
   **Sửa:** tăng rim Fresnel lên mức thấy rõ (rim intensity ≥ 2, power 2–2,5, màu `#eaffff`) + `envMapIntensity` thân hũ 1 → 1,6 khi hover + quét một dải highlight dọc qua nắp (uniform `uSweep` 0→1 trong 0,6 s); đăng ký hover riêng `cap`, `jar`, `serum`, và mỗi nguyên liệu (scale 1→1,12 spring + nhãn callout đậm lên).
2. **Màu/vật liệu hũ lệch mẫu A1 đã xác minh** — mọi ảnh 0–100%: thân hũ mint nhạt `#c2d5c9`, đục như nhựa, nhãn chữ ngà thấp tương phản (`qc-evidence/shots/beauty/timeline-0.jpg`); A1 đo `#04381a`–`#165a37` lục sâu satin, nhãn `#cfe3d0` rõ (`reference/shots/A1-contact.jpg` khung 3–5). Transmission .92 vượt spec (≤ 0,6) làm hũ “bạc màu” theo nền.
   **Sửa:** biến thể “Aloe” đặt `color #0f4a2a`, `transmission 0.45`, `thickness 0.6`, `roughness 0.32`, `attenuationColor #0a3a1f`, `attenuationDistance 0.4`; giữ Rose/Amber nhưng hạ transmission tương tự để hũ có thân sâu màu; tăng độ tương phản nhãn (alpha 0,95).
3. **Va chạm chữ ở hero và final** — 1440×900 & 1920×1080, 0% và 100%: dòng mô tả “mát, nhẹ, tan ngay trên da.” / “cả thế giới đổi theo.” nằm đè đỉnh chữ “S” của SOOTHE (`qc-evidence/shots/beauty/timeline-0.jpg` y≈300, `1920x1080-100.jpg` y≈340); dòng hướng dẫn “…CHẠM ĐÚP ĐỂ VỀ GÓC NHÌN GỐC” đè lên lá nha đam ở góc phải dưới (`timeline-0.jpg`).
   **Sửa:** đặt khối intro `max-height` sao cho đáy ≤ `top(wordmark) − 24px` (hoặc dịch từ khóa lớn xuống `top: 38vh`); cho dòng hint nền pill mờ `rgba(255,255,255,.55)` hoặc ẩn hint sau 4 s.
4. **Callout đè vật thể** — desktop 50%: chữ “Aloe gel / LÀM DỊU” đè lên thanh aloe (`qc-evidence/shots/beauty/timeline-50.jpg` x≈990–1140,y≈530); mobile 390×844 50%: “Shea butter”, “Vitamin E”, “Green tea”, “Aloe gel” đều chồng lên chính nguyên liệu và thân hũ (`qc-evidence/shots/beauty/390x844-50.jpg`).
   **Sửa:** đặt nhãn ở phía ngoài anchor (hướng từ tâm hũ ra, offset ≥ 70 px), clamp trong `[16px, vw−16px]`; mobile: hiện nhãn dạng danh sách dưới hũ (y > 62%) với đường nối, hoặc chỉ hiện chấm + tên ngắn.
5. **Nguyên liệu dựng quá thô** — 50%: “Aloe gel” là hộp chữ nhật hai đầu xanh như cục tẩy, lá trà là mặt phẳng mỏng, squalane là giọt phẳng (`judge/shots/beauty-orbit-at50-back.jpg`, `beauty-orbit-at50-low.jpg`).
   **Sửa:** lát lô hội = mặt cắt hình chữ V/lưỡi liềm (Shape extrude, vỏ xanh `#1a6b34` dày 0,02 + ruột gel trong suốt nhẹ `#dff5d8` transmission 0,3); lá trà = lá có gân (displaced plane + uốn cong); squalane = giọt dầu `MeshPhysical` transmission 0,6, ior 1,47.
6. **Thiếu nhịp “nắp + thân bay vào lắp ráp” của A1** — A1 0,5–1,2 s: nắp từ trên, thân từ dưới, lắp tại ~25% (`reference/shots/A1-contact.jpg` khung 2); ta: hũ đã đầy đủ ở 0% (`timeline-0.jpg`), 25% chỉ nâng nắp.
   **Sửa:** 0–0,18: thân ở y −2,4 và nắp ở y +2,6 ngoài khung, lá che chữ; 0,18–0,25 bay vào (power3.out) lắp lại; sau đó 0,25–0,35 mới mở nắp như hiện tại.
7. **Lá nha đam lộ đầu cắt phẳng khi orbit lên cao** — nhìn từ trên (pitch +1,2 rad): các lá thành mảnh rời có mặt cắt phẳng như giấy xé (`judge/shots/beauty-orbit-low.jpg` góc trái dưới).
   **Sửa:** giới hạn pitch ở 0% về [−0,35, +0,55] rad khi lá còn hiện (`leafMix > 0.1`), hoặc kéo dài gốc lá xuống dưới khung + đóng nắp đáy mesh.
8. **Mobile mất từ khóa lớn** — 390×844 0%/100%: SOOTHE chỉ còn “S…E” hai bên hũ (`qc-evidence/shots/beauty/390x844-0.jpg`, `mobile-touch.jpg`).
   **Sửa:** mobile `font-size: 34vw` xếp 2 dòng (“SOO / THE”) phía sau hũ, hoặc đặt từ khóa trên hũ (y 20–34%).
9. **Khựng fps sau khi ready** — 3 s đầu sau `ready` rAF đo 41 fps, sau đó ~60 (ổn định khi scrub ~67). Cold ready 17,3 s (DEV có biên dịch lần đầu), warm 1,8–2,9 s.
   **Sửa:** precompile shader (`gl.compile(scene, camera)`) trước khi bật `ready`, khởi tạo PMREM/transmission render target trong lúc loader.

## Độ giống mẫu (so contact sheet A1, A2)
- **Vị trí/tỉ lệ hero:** A1 hũ ≈44% rộng, tâm (51%,55%); ta hũ ≈29% rộng (1440×900), tâm (50%,52%) — đúng chỗ, **nhỏ hơn** ~1/3.
- **Góc camera:** A1 ngang tầm nắp, nhìn xuống 5–8°, tele; ta `pos [0,.8,4.75] → target [0,.47,0]`, FOV 30 ⇒ ≈4° nhìn xuống — khớp.
- **Màu:** nền xanh trời gradient khớp `#7ab9e6→#cdeeff`; **hũ mint nhạt lệch nặng so với lục sâu** của A1; nắp than chì `#19202e`-ish khớp.
- **Typography:** Didone siêu lớn phía sau hũ (hũ che chữ) và lá phía trước chữ — đúng phân lớp A1 (A1: “NOURISH”, ta: “SOOTHE”); về sau chữ mờ ~25% (A1 ~12%).
- **Cơ chế chuyển động:** lá rẽ ra ✓; xoay + nghiêng ✓ (50%); 5 callout ✓; thiếu bay vào lắp ráp; A1 kết thúc với vòng mint + bàn tay → ta dùng bục tròn + chai serum (được spec cho phép).
- **A2 (thế giới màu):** đổi nền + vật liệu + chữ đồng bộ ✓, crossfade ~400 ms; không có carousel trượt chai (không bắt buộc).

## Kết luận
**78/100 — chưa đạt ≥90.** Bộ sửa tối thiểu: **#1** hover rõ + nhiều đích (≈+4), **#2** màu/vật liệu hũ lục sâu (≈+3), **#3 + #4** va chạm chữ/callout (≈+3), **#5** nguyên liệu tử tế (≈+2), **#6** lắp ráp bay vào (≈+2). Mục 7–9 là đánh bóng.
