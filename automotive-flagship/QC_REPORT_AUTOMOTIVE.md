# QC_REPORT_AUTOMOTIVE — Automotive flagship (Master Prompt V4)

## Giám khảo — Vòng 1 (J1 realtime + J2 still) · 05/11/2026

- Báo cáo đầy đủ: `judge/judge-round1.md`. Bằng chứng: `judge/r1/`.
- **Route realtime: 76/100 ⇒ FAIL.** Mục tiêu ≥ 88 ở Stage 2 và ≥ 90 ở Stage 4.
  - Điểm thành phần: 3D 22/30 · Tương tác 26/30 · Bám mẫu 12/20 · Frontend 8/10 · Hiệu năng 8/10.
- **Still H1–H4:** 73 / 76 / 70 / 77 ⇒ FAIL (yêu cầu ≥ 88). Chưa có still nào đủ đưa vào pitch-deck; H4 gần nhất.

| Tiêu chí | Kết quả | Ghi chú |
|---|---|---|
| E1 3D thật | PASS | |
| E2 Orbit 360° | PASS | |
| E3 ≥ 3 biến thể | PASS | |
| E4 Hover | PASS | yếu ở body |
| E5 Scroll | PASS | |
| E6 Ổn định/responsive | PASS | |
| E7 Photoreal luxury | **FAIL** | |
| FPS production | BLOCKED | điều phối đo |

**Lỗi mức Cao:**
1. Dome đất lộ facet ở .03.
2. Đất chiếu bị kéo giãn ở .02 và trong still.
3. Pearl không có vệt chân trời sắc; có vòng oval trên cửa.
4. Bố cục và camera của still.
5. Ánh sáng hoàng hôn không ra.

Chưa được báo `AUTOMOTIVE_FLAGSHIP_READY_FOR_FOUNDER_REVIEW`.
