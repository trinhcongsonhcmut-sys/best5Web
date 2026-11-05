# A2 — "Chroma Juice" (chai + "thế giới màu" đổi theo vị) — phân tích kỹ thuật

- URL: https://www.pinterest.com/pin/959477895685570118/
- Trạng thái: **VERIFIED (media)** · Loại: video 14,00 s, 720×1280, không loop · 209,3 nghìn lượt xem, 326 repin (JSON-LD/og)
- **Lệch nhóm**: Founder xếp vào "Làm đẹp/mỹ phẩm" nhưng nội dung là landing page **thương hiệu nước ép** "Chroma Juice" (chữ Nga: "Вкус в каждом цвете" = "Hương vị trong từng sắc màu"). Cơ chế (đổi màu cả thế giới theo biến thể, chai khổng lồ xuyên khung) vẫn rất hợp **Color Variants** của Beauty.
- Nguồn công khai: tác giả "Harshit (Raise MY Business)" — Pinterest `harrywebdeveloper`, bảng "website-design"; `og:see_also`/`pinterestapp:source` → https://www.instagram.com/webdeveloper_us/ (trang IG công khai: "High-end websites for founders…"). Đăng 11/03/2026. Tiêu đề pin: "Landing page of a smoothie brand [Video]".
- Bản chất: **video render/composite sẵn** (chai thủy tinh + chất lỏng + tắc kè hoa quang học thật; có khả năng là CGI/AI), tỉ lệ 9:16 với **khung trình duyệt phẳng** cắt ngang giữa khung hình. Không có camera quay laptop.
- Bằng chứng: `shots/A2-page.jpg`, `A2-contact.jpg` (12 khung: t = 0; 1,27; 2,55; 3,82; 5,09; 6,36; 7,64; 8,91; 10,18; 11,46; 12,73; 13,95 s), `A2-v000…v100.jpg`.

## Timeline quan sát (giây video)

| t (s) | Quan sát |
|---|---|
| 0–1,3 | **Thế giới 1 – việt quất–mâm xôi** (nền teal): chai khổng lồ nước ép tím mận ở trung tâm; tắc kè hoa tím hồng ở bên phải, cả trong khung trình duyệt (cỡ nhỏ) lẫn ngoài (cỡ khổng lồ) |
| 1,3–2,6 | Chai berry **trượt ra trái**; tắc kè (khổng lồ) đi vào giữa-trái; nền chuyển qua trung tính xám-xanh rồi đào |
| 2,6–6,4 | **Thế giới 2 – cam** (nền đào `#e3aa75`): chai cam khổng lồ vào từ phải, đứng bên phải; tắc kè cam bước từ trái; chữ trên nhãn đổi "АПЕЛЬСИН" |
| 6,4–9,5 | **Chuyển** qua tông tím `#a98aac` (6,4 s) rồi xám-xanh `#587865` (8,9 s); chai cam trượt ra trái; tắc kè chuyển xanh lục |
| 9,5–14,0 | **Thế giới 3 – kiwi-rau bina** (nền `#437b5a`): chai xanh vào từ phải rồi đứng giữa-phải ở cuối; tắc kè xanh đi về trái; nhãn "КИВИ ШПИНАТ" |

## 10 điểm kỹ thuật

1. **Vị trí & tỉ lệ**: khung dọc 9:16. Khung trình duyệt chiếm ~95% bề rộng, y ≈ 28%–63% chiều cao. **Chai khổng lồ** xuyên "sau" khung trình duyệt: cổ chai + miệng ren phía trên khung (y ≈ 15%–28%), thân chai phía dưới (y ≈ 63%–93%); thân rộng ~52% bề rộng (0 s) dịch tới ~50–60% ở các thế giới sau. Cũng có **bản thu nhỏ** của chai + tắc kè bên trong khung ("Droste effect"): chai nhỏ cao ~25% chiều cao khung (y 33–77% trong khung).
2. **Camera** (render sẵn): chính diện, ngang tầm thân chai, nhìn xuống ~8–10° (thấy ellipse miệng chai), tele FOV ≈ 18–25° (ít méo); target = tâm chai; camera tịnh tiến ngang (parallax): chai lớn đi nhanh hơn chai trong khung.
3. **Nền/ánh sáng**: nền là gradient/seamless đổi theo thế giới — đo: teal `#015b75`; đào `#e3aa75` → hồng-nâu `#bb967a`; tím `#a98aac`; xám-xanh `#587865`; lục `#437b5a` (đo). Sàn studio có vệt sáng/horizon mờ, **bóng đổ mềm dưới chai** màu đồng tông. Key: softbox lớn trên-trái; rim sáng mép kính chai (đường sáng dọc hai bên thân); không có tia nắng cứng.
4. **Vật liệu**: *chai*: thủy tinh trong, dày (thành ~4% đường kính), ren cổ rõ, IOR ≈ 1,5, roughness ≈ 0,03–0,08 (khúc xạ rõ ở cổ); *chất lỏng*: đục như smoothie, hơi sần/hạt (berry có hạt li ti tối) — đo thân berry `#682b46` (tối `#391733`, sáng `#b87788`), cam `#f37803`/`#d74c01`, lục `#034605`/`#6aa386` → opacity cao, subsurface nhẹ, roughness ≈ 0,3–0,4; *nhãn*: chữ trắng bán trong in thẳng lên thân; *tắc kè*: da vảy hạt mịn, hơi bóng, tông ăn theo thế giới.
5. **Typography & UI**: "Chroma Juice" sans hình học đậm (kiểu Gilroy/Aeonik/Satoshi Black), chữ trắng, 2 dòng, cỡ ~9% chiều cao khung/cap; tagline Cyrillic nhỏ; nav `Магазин ▾ / Компания / Отзывы / Контакты`, số điện thoại, **nút lime `#afd058`** ("Корзина"/"Купить") là điểm nhấn duy nhất; thẻ sản phẩm kính mờ phải ("Смузи"). Chữ trắng trên nền đào hơi thiếu tương phản (nên dùng chữ tối ở thế giới sáng).
6. **Chuyển động**: (a) carousel ngang: chai cũ trượt ra trái, chai mới vào từ phải (ease-in-out ~1,2–1,8 s); (b) **crossfade nền + liquid + da tắc kè đồng bộ màu** qua tông trung gian xám; (c) tắc kè bước liên tục (walk cycle) trái→phải rồi quay đầu; (d) chữ nhãn trong khung đổi bằng fade; (e) parallax 2 lớp (chai lớn nhanh – chai nhỏ chậm).
7. **Mốc thời gian**: thế giới 1: 0–1,3 s; chuyển 1: 1,3–2,6 s; thế giới 2: 2,6–6,4 s; chuyển 2: 6,4–9,5 s (chậm hơn, ~3 s qua tím/xám); thế giới 3: 9,5–14,0 s. (Ước lượng ±0,4 s.)
8. **Mapping scroll**: **not observable** — video không cho thấy scroll/cursor; có thể là timeline thời gian hoặc scrub, không phân biệt được.
9. **Hover/chuột**: **not observable**.
10. **Phải là WebGL thật**: chai thủy tinh + chất lỏng (đổi màu 3 biến thể, giữ phản chiếu), ren cổ, hạt trong smoothie (tuỳ chọn), nền gradient shader/CSS đồng bộ, parallax. **Không dựng/lấy**: tắc kè hoa (sinh vật quang học, tài sản của người khác) — thay bằng "dải màu" dạng ribbon/metaball hoặc bỏ. Khung trình duyệt nhỏ chứa bản sao = đồ họa DOM/texture plane; **không** dùng video làm chai.

## Dựng bằng Three.js

- **Chai**: `LatheGeometry` 2 profile: *ngoài* (0→0,5 r; cổ thu về 0,24 r ở y=0,95; miệng ren: 6 vòng torus nhỏ hoặc normalMap sọc ngang) và *trong* (offset −0,04). Hợp bằng 2 mesh: thủy tinh (ngoài+trong, `side: DoubleSide`) và **chất lỏng** lathe riêng (cao tới 78% thân, mặt trên phẳng có meniscus nhẹ).
- **Thủy tinh**: `MeshPhysicalMaterial({ color:'#ffffff', roughness:0.04, metalness:0, transmission:1, thickness:0.5, ior:1.5, attenuationColor:'#e8f4f0', attenuationDistance:3, envMapIntensity:1.2 })` hoặc drei `MeshTransmissionMaterial` (`samples:8, resolution:512, chromaticAberration:0.03, anisotropicBlur:0.1, distortion:0.1`). **Chất lỏng**: `MeshPhysicalMaterial({ color:variant, roughness:0.35, transmission:0.15, thickness:1, sheen:0.4, sheenColor: lighten(variant) })` + noise normalMap (hạt).
- **3 biến thể** (đo từ video): `berry {liquid:'#682b46', world:'#015b75'}`, `orange {liquid:'#f37803', world:'#e3aa75'}`, `kiwi {liquid:'#1f7a2a'(suy ra), world:'#437b5a'}`; tween màu liquid + `scene.background`/CSS var + light colour bằng GSAP `duration:1.6, ease:'power2.inOut'`.
- **Env**: `Lightformer` softbox trên (`[0,5,3] scale [8,2]` intensity 3), 2 dải đứng làm viền sáng thân kính (`[±3,0.5,0] scale [0.4,6]` intensity 2.5), nền sàn mờ bằng `MeshReflectorMaterial` rất nhẹ (`blur:[300,100] mixStrength:0.4`) hoặc chỉ `ContactShadows` (`opacity:0.35, blur:3, color` theo thế giới).
- **Tắc kè thay thế**: một `TubeGeometry` ribbon uốn lượn đổi màu theo biến thể (shader noise), hoặc hạt bay; tránh tạo sinh vật giả quá thô.

### Storyboard camera/scroll (0/25/50/75/100%)

| % | Camera | Cảnh |
|---|---|---|
| 0 | pos [0,0.4,9], target [0,0.2,0], FOV 22 | chai berry giữa-trái, nền teal, khung trình duyệt DOM phía trước chai (z-order DOM giữa 2 canvas) |
| 25 | pan sang phải x +1,5 | chai berry trượt ra trái; nền → xám; ribbon đi qua; chai cam vào từ phải |
| 50 | pos [0.8,0.3,8.5] | chai cam đứng phải, nền đào, liquid sáng rực; thử hover → tăng `envMapIntensity` |
| 75 | pan x −0,5, dolly 7,5 | chuyển tím → xám-xanh; chai cam trượt trái; chai kiwi vào |
| 100 | pos [0.6,0.2,8.8] | chai kiwi chính giữa-phải, nền lục; nhìn xuống 8°; orbit tự do |
