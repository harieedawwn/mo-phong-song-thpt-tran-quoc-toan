# Mô phỏng sóng 2D – THPT Trần Quốc Toản (Đồng Tháp)

Thí nghiệm mô phỏng sóng cho Vật lí 11 (Kết nối tri thức). Chạy trực tiếp trên trình duyệt, không cần cài đặt.

**Mở:** https://harieedawwn.github.io/mo-phong-song-thpt-tran-quoc-toan/

## Cách dùng
- Chọn loại sóng ở thanh tab: **Sóng ngang – Sóng dọc**, **Sóng âm** (không khí, nước, thép; loa hoặc người nói; tai người nghe), **Sóng mặt**, **Sóng điện từ**.
- Bên trái (điện thoại: hai nút Sóng / Hiển thị ở dưới): chỉnh tần số, biên độ, tốc độ, môi trường, độ làm chậm.
- **Khi sóng đang chạy, trên màn hình không có chữ.** Bấm **Tạm dừng** (hoặc phím Space) để hiện nhãn, thước đo λ, vùng nén/giãn và số liệu thật.
- Nút Làm lại, chụp ảnh, tắt/bật tiếng ở thanh trên. Dấu **?** mở hướng dẫn.
- Trên thang phổ điện từ, chạm một đoạn để chọn vùng sóng (gamma → vô tuyến).
- Hoạt ảnh được làm chậm và biên độ được phóng đại để dễ nhìn; các số liệu hiển thị là giá trị thật.

## Cho người phát triển
Trang tĩnh: HTML + CSS + ES modules, chỉ dùng Canvas 2D/SVG, không thư viện. Xem `CLAUDE.md`, `SPEC.md`, `TASK.md`.
Kiểm tra: `node tools/shot.mjs <tên> mode=sound --all --paused` (ảnh + lỗi + thanh cuộn), `node tools/shot.mjs p --perf` (fps từng chế độ, giả lập điện thoại chậm ×4).
Chạy thử: `node tools/serve.mjs` rồi mở http://localhost:8765/mo-phong-song-thpt-tran-quoc-toan/
