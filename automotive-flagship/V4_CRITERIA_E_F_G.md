# Master Prompt V4: Phần E, F, G (nguyên văn, Founder giao ngày 05/11/2026)

> Trích nguyên văn từ prompt V4 trong chat. Giám khảo và builder phải dùng **file này** làm 7 tiêu chí bắt buộc.
> Vòng 1 của giám khảo đã dùng một bộ E1–E7 *dựng lại*, không khớp bản gốc. Bảng đối chiếu nằm ở cuối file.

## PHẦN E — NGUYÊN TẮC CHẤM ĐIỂM RẤT GẮT

Một route Automotive chỉ được coi là đạt khi:
1. Có ít nhất 1 hero frame đạt cấp “đưa vào hồ sơ giới thiệu khách”.
2. Frame mở đầu tạo cảm giác wow trong 2–3 giây đầu.
3. Phần realtime không kéo tụt chất lượng cảm nhận toàn bộ.
4. Giữ được tinh thần animation / UI / storytelling của route cũ.
5. Xe không còn cảm giác low-poly / hoạt hình / đồ chơi.
6. Chất liệu sơn, kính, kim loại, lốp và đèn phải thuyết phục.
7. So với reference mới, kết quả phải tiến gần rõ rệt và có bằng chứng đối chiếu.

## PHẦN F — CÁC ĐIỀU CẤM

1. Không báo hoàn thành chỉ vì build pass.
2. Không đánh tráo khái niệm giữa “web chạy được” và “đẹp đủ pitch khách”.
3. Không tiếp tục vòng sửa vô hạn nếu phương pháp gốc sai.
4. Nếu cách làm hiện tại không thể đạt chất lượng, phải đổi pipeline, không cố vá.
5. Không tự thêm nhiều task nền không kiểm soát.
6. Không mở rộng sang website khác.
7. Không làm lại từ đầu nếu không cần thiết.
8. Không tự commit nếu chưa được yêu cầu.
9. Không tự dùng tài sản trả phí nếu chưa được phê duyệt.
10. Không dùng logo thương hiệu bị hạn chế nếu chưa được phép.

## PHẦN G — CÁCH LÀM VIỆC

- Làm từng chặng rõ ràng
- Sau mỗi chặng lớn, cập nhật trạng thái
- Nếu dùng tác vụ nền, phải có checkpoint
- Không tạo loop vô tận
- Nếu 1 lỗi đã sửa 3 vòng mà chất lượng không tiến bộ rõ rệt, dừng và đổi chiến lược
- Ưu tiên chất lượng thực tế hơn là báo cáo đẹp

## Đối chiếu vòng 1 theo đúng Phần E gốc (điều phối viên, 05/11/2026)

Bảng này dùng lại bằng chứng của `judge/judge-round1.md`, chấm lại theo đúng 7 tiêu chí gốc ở trên. Không có phép đo mới.

| # | Tiêu chí gốc | Vòng 1 | Căn cứ |
|---|---|---|---|
| 1 | ≥ 1 hero frame đủ đưa vào hồ sơ khách | **FAIL** | Still H1–H4 được 73/76/70/77, ngưỡng là 88. Giám khảo: chưa still nào đủ đưa vào pitch-deck. |
| 2 | Mở đầu tạo cảm giác wow trong 2–3 s | **CHƯA ĐÁNH GIÁ ĐƯỢC** | Lớp prerender (opener) chưa được ghép vào web. |
| 3 | Realtime không kéo tụt chất lượng | **FAIL** | Dome nền đất lộ mặt tam giác ở .03; nền đất bị kéo giãn ở .02 (judge §5, §6 #1–2). |
| 4 | Giữ animation/UI/storytelling cũ | **PASS** | Orbit, biến thể, hover, scroll xuôi/ngược Δ = 0, mobile cảm ứng, 0 lỗi console (judge §2, các mục E1–E6 bản dựng lại). |
| 5 | Hết cảm giác low-poly/hoạt hình/đồ chơi | **FAIL** | Moay-ơ/bánh, cần gạt dạng lưới và cây bụi còn đọc như mô hình (judge §2 E7, §4). |
| 6 | Sơn/kính/kim loại/lốp/đèn thuyết phục | **FAIL** | Pearl không có vệt chân trời sắc, có vòng oval trên cửa; hover body gần như không thấy; mâm ngả đồng khi hover. |
| 7 | Tiến gần reference rõ rệt, có bằng chứng | **MỘT PHẦN** | Tiến bộ rõ so với v2 (`BEFORE_AFTER_AUTOMOTIVE.md`). Điểm bám mẫu 12/20; ánh sáng chưa ra hoàng hôn. |

Kết quả: 1/7 PASS, 1 một phần, 1 chưa đánh giá được ⇒ **FAIL**.
