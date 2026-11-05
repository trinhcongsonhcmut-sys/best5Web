# QC JUDGE vòng 2 — `/fnb` · Ember & Bean → Vermiglio

Ngày: 05/11/2026 · Giám khảo độc lập (không viết code demo này) · Skill `3d-visual-qc` đã load, checklist 1–8 áp dụng.
Điều kiện đo: dev server riêng `npx vite --port 5199 --strictPort` (DEV, không phải build), Chrome headed qua Playwright MCP, GPU `ANGLE Intel HD Graphics 530 D3D11`, DPR 1, 1440×900 trừ khi ghi khác. **Một builder khác chạy song song trên cùng GPU/CPU và cùng phiên trình duyệt (đang mở 5198/beauty, 5198/fashion)** — mọi số FPS bên dưới bị ảnh hưởng bởi tranh chấp này.
Ảnh: `qc-evidence/judge/round2/shots/fnb-*.jpg` (66 ảnh).

## Điểm: **84 / 100** (vòng 1: 78) — CHƯA đạt 90

| Hạng mục | Điểm | Lý do (1 dòng) |
|---|---|---|
| Chất lượng 3D (30) | **25** | Nĩa+mì 50% và đĩa mì 100% giờ đẹp, helix có thể tích; còn: vũng sốt viền răng cưa phẳng, vỏ vẹm là ellipsoid đen bóng trơn, mặt dưới đĩa/đĩa lót tối nâu đục khi nhìn từ dưới. |
| Animation & tương tác (30) | **26** | Orbit 360°/reset/biến thể/scroll xuôi-ngược khớp số; hover theo từng bộ phận nhìn rõ; còn callout bị nguyên liệu/sợi mì đè, pitch cho phép chui xuống dưới đĩa (1,2 rad). |
| Bám tinh thần mẫu (20) | **17** | 50% giờ là "nĩa xoắn mì" hero kiểu C, 75% ballet có callout, 100% món trên đĩa — sát C; hạt quanh ly ở 25% đúng B; còn thiếu mì kéo dài xuyên section, sốt không bóng ướt như C. |
| Thiết kế frontend (10) | **8** | Desktop sạch, va chạm UI mobile cũ đã hết; nhưng 390×844 ở 75% nhãn "Spaghetti/Gamberi" nằm trên sợi mì không đọc được, ở 100% đĩa bị cắt hai mép. |
| Hiệu suất & ổn định (10) | **8** | 0 console error/pageerror/HTTP lỗi; ready lạnh 3,0 s; idle 71–75 fps nhưng khi cuộn chỉ 35–37 fps, p95 53–66 ms (có tranh chấp GPU). |

## Mục bắt buộc (không bù bằng điểm)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 3D tương tác thật | **PASS** | `fnb-orb0-dragDown.jpg` (nhìn từ trên thấy latte art), `fnb-orb100-dragUp.jpg` (mặt dưới đĩa) |
| Orbit 360° | **PASS** — 4×271 px ⇒ `yawTotal −6,287` ở 0%, 50%, 100%; `resetView()` ⇒ `[0,0.18,5.4]` / `[0.15,0.95,4.3]` / `[0,2.05,3.55]` | `fnb-orb{0,50,100}-{front,right,back,left}.jpg` |
| Đổi màu/vật liệu | **PASS** — `primary` `#efe3d0` (r .32, cc 1) → `#2b2623` (r .62, cc .25) → `#b5523a` (r .48, cc .6), giống nhau ở 0% và 100% (đổi men đĩa) | `fnb-var0-*.jpg`, `fnb-var100-*.jpg` |
| Hover có phản hồi | **PASS** — 0%: `cup`, `saucer` riêng; 75%: `mussel`, `shrimp`, `tomato`, `plate`; 100%: `plate`, `mussel`, `shrimp`, `tomato`; `hover.value` = 1, rời ⇒ 0; nhìn thấy rõ (ly sáng lên, vẹm ánh xanh-xám, cà chua hồng) | `fnb-hov0-off.jpg` vs `fnb-hov0-0-cup.jpg`, `fnb-hov0-1-saucer.jpg`; `fnb-hov75-0-mussel.jpg` |
| Scroll mượt / khôi phục | **PASS** — camera 0/25/50/75/100 xuôi = ngược (lệch FOV ≤ 0,006°); nhảy 1→0,3 hội tụ ~450 ms không pop; wheel 15×900 rồi 10×−900 ⇒ về 0 trong ~300 ms (scrub theo tiến độ) | `fnb-fwd-*.jpg`, `fnb-back-*.jpg` |
| Không trắng/crash | **PASS** — 0 error, 1 warning | — |
| Không sai lệch nghiêm trọng | **PASS** | — |
| Không ảnh/video giả 3D | **PASS** | — |

## Bảng lỗi vòng 1

| # | Lỗi vòng 1 | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Bão hạt che 50%, nĩa nhỏ | **FIXED** | `fnb-fwd-50.jpg`: ~25 hạt nhỏ phía phải, không hạt đè chữ; nĩa+mì cao ~45% khung, cán không chạm logo |
| 2 | Helix là ruy-băng phẳng | **PARTIAL** | `fnb-fwd-75.jpg`: có thể tích và twist; nhưng 60 sợi song song đều tăm tắp, hai đầu xòe như chổi (x≈840,y≈100) |
| 3 | Callout đè/chỉ sai | **PARTIAL** | Cozze/Basilico/Gamberi neo đúng vật; nhưng "ALLA CHITARRA" vẫn bị quả cà chua che (x≈1180,y≈405 ở 1440; x≈1733,y≈795 ở 1920), "Pomodorini" nằm trên sợi mì |
| 4 | Va chạm UI mobile | **FIXED** (va chạm cũ) / **REGRESSED** nhẹ ở 75% | `fnb-390x844-0.jpg` sạch; `fnb-390x844-75.jpg` nhãn "Spaghetti", "Gamberi" vẽ đè lên sợi mì |
| 5 | Sốt là decal phẳng | **PARTIAL** | `fnb-fwd-100.jpg` x≈600–800,y≈530–580: vũng đỏ có chút độ dày nhưng viền gãy răng cưa, không bóng ướt |
| 6 | Seam lathe đĩa lót | **FIXED** | `fnb-fwd-0.jpg`, `fnb-hov0-1-saucer.jpg`: không còn khía |
| 7 | Hover yếu, 1 vật/cảnh | **FIXED** | 2 bộ phận ở cảnh A, 4 ở cảnh B, thấy bằng mắt |
| 8 | Chữ bóng ma 50→75 | **FIXED** | `fnb-fwd-75.jpg`, `fnb-back-50.jpg` không còn chữ chồng |
| 9 | Vẹm thô | **PARTIAL** | Có ruột cam + mép, nhưng vỏ vẫn là ellipsoid đen bóng trơn không vân; ở 75% một con vẹm cắm qua mép đĩa (`fnb-fwd-75.jpg` x≈720–840,y≈690–800) |
| 10 | Hạt cam phát sáng | **NOT FIXED** | `fnb-1920x1080-0.jpg` x≈670,y≈148 và `fnb-fwd-0.jpg` x≈1258,y≈112: viên cam sáng như viên thuốc |

## Lỗi mới / còn mở (theo mức nghiêm trọng)

1. **Callout 75% vẫn bị che / đè lên mì (desktop + mobile)** — 1440: phụ đề "ALLA CHITARRA" bị cà chua che, "Pomodorini · CÀ CHUA BI CONFIT" nằm trên sợi mì (`fnb-fwd-75.jpg`); 390×844: "Spaghetti", "Gamberi" vẽ thẳng lên helix, không đọc được (`fnb-390x844-75.jpg`). **Sửa:** đặt nhãn vào hai cột cố định ngoài bbox màn hình của helix (tính `Box3` helix → project → nhãn trái ở `bbox.minX − 24px`, phải ở `bbox.maxX + 24px`, giãn dọc tối thiểu 44 px), thêm nền `rgba(245,236,220,.85)` + padding 4/8 px sau chữ; mobile chỉ hiện tên (không phụ đề) và xếp thành hàng chip dưới đĩa thay vì leader line.
2. **Vũng sốt 100% viền răng cưa, không bóng** — `fnb-fwd-100.jpg`, `fnb-orb100-front.jpg`. **Sửa:** dựng sốt bằng `CircleGeometry(r, 64)` có displacement noise mượt (2 octave, biên độ ≤ 0,01) + alphaMap mép mềm, `MeshPhysicalMaterial({color:'#9f1d13', roughness:.12, clearcoat:1, clearcoatRoughness:.05})`; thêm 6–10 giọt sốt nhỏ bám trên sợi mì phía trên.
3. **Orbit dọc không giới hạn — nhìn từ dưới đĩa/đĩa lót thành khối nâu tối che chữ** — kéo dọc ⇒ `pitch −1,2 rad`, camera y = −1,8 (0%) / −1,3 (50%) / −1,8 (100%): mặt dưới đĩa nâu đục chiếm giữa khung và đè phụ đề (`fnb-orb100-dragUp.jpg`, `fnb-orb50-dragUp.jpg`); 50% góc trái nĩa thành bóng đen cắt mép trên và đè logo "Vermiglio" (`fnb-orb50-left.jpg`). **Sửa:** clamp pitch về `[−0,15 ; +0,9]` rad; thêm hemisphere/fill light từ dưới (intensity .35, màu kem) để mặt dưới gốm không đen; với nĩa ở 50% đặt envMap intensity ≥ 1 cho mặt lưng để không thành bóng đen.
4. **Mobile 100%: đĩa bị cắt hai mép** — `fnb-390x844-100.jpg`: vành đĩa chạm/tràn mép trái-phải. **Sửa:** khi `aspect < 0.7` tăng khoảng cách camera chặng 100% ×1,25 hoặc FOV +8°, đặt đĩa ở 40–70% chiều cao (hiện có khoảng trống lớn bên dưới).
5. **Hiệu năng khi cuộn** — rAF đo 35–37 fps khi scrub, p95 53–66 ms, khung tệ nhất 80–400 ms (idle 71–75 fps); có tranh chấp GPU với builder khác. **Sửa:** tắt bóng/đổ bóng động của hạt khi `sceneMix>0`, giảm `InstancedMesh.count` theo pha (hạt không thấy ⇒ count=0), dùng 1 shadow map 1024 và `shadowMap.autoUpdate=false` ngoài lúc đổi cảnh.
6. **25%: hạt che mô tả và lòng ly** — `fnb-fwd-25.jpg`, `fnb-1920x1080-25.jpg`: hạt nằm trên chữ "Hương caramel…" và che miệng ly; một hạt xám nhạt lơ lửng trong hơi nước (x≈697,y≈193). **Sửa:** loại hạt có toạ độ màn hình trong hộp chữ mô tả và trong elip miệng ly (đẩy z ra sau ly), bỏ tint xám cho hạt trong vùng hơi nước.
7. **Hạt cam phát sáng** (lỗi cũ #10) — xem bảng. **Sửa:** clamp vertex color hạt về `#3a1f12`–`#6b3b1f`, bỏ emissive/rim cam cho instance xa.
8. **Biến thể "Matte Black" ở cảnh B ra màu taupe xám, không đen** — `fnb-var100-1.jpg`: đĩa xám nâu nhạt. **Sửa:** ở cảnh kem giảm envMapIntensity cho men đen (≤ .6) và giữ `color #2b2623`, kiểm tra tone mapping exposure không đẩy sáng.
9. **Helix quá đều, đầu sợi xòe chổi** — `fnb-fwd-75.jpg` đỉnh helix. **Sửa:** jitter bán kính ±0,03 và pha θ theo từng sợi, bo đầu sợi (taper bán kính về 0 trong 5% cuối) và cho đầu sợi uốn vào trong.

## Độ giống mẫu (B, C)
- B: "RICH | AROMA" kẹp hai bên ly, nền nâu→caramel, hạt bay có chiều sâu và DOF ở 25% — sát B. Ly cao ~30% khung (B ~35–40%).
- C: 50% nĩa xoắn mì + tôm + húng trên nền burgundy, motion-blur ngang — giờ rất gần frame "LOVE AT FIRST TWIRL"; 75% "A little bit of everything." + helix + callout serif nghiêng — đúng bố cục C; 100% "Your table is waiting." + đĩa nhìn xuống ~33° — đúng; đĩa rộng ~64% khung (C ~87%).
- Khác biệt còn lại: chất liệu mì/sốt kém "ăn được" hơn C (C ướt, bóng, nhiều sốt bám), vẹm thô, không có cảnh mì kéo dài xuyên ranh giới section.
- Đánh giá trung thực: tinh thần và bố cục ~85% giống; chất lượng vật liệu thực phẩm ~65% so với render của C.

## Kết luận
84/100 — chưa đạt 90. Bộ sửa tối thiểu để ≥ 90: **#1** (callout không bị che, mobile đọc được) +2, **#2 + #9** (sốt bóng + helix bớt đều) +2, **#3** (clamp pitch + fill dưới) +2, **#4 + #5** (đĩa mobile, scrub ≥ 50 fps cùng máy) +2.
