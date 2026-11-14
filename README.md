# Mô phỏng sóng 2D – THPT Trần Quốc Toản (Đồng Tháp)

Thí nghiệm mô phỏng sóng cho Vật lí 11 (Kết nối tri thức). Chạy trực tiếp trên trình duyệt, không cần cài đặt.

**Mở:** https://harieedawwn.github.io/mo-phong-song-thpt-tran-quoc-toan/

## Cách dùng
- Chọn loại sóng ở thanh tab: **Sóng dọc – Sóng âm**, **Sóng ngang**, **Sóng mặt**, **Sóng điện từ** (hoặc bấm phím 1–4).
- Bên trái: chỉnh tần số, biên độ, môi trường, tốc độ làm chậm. Bên phải: số liệu thật và thẻ "Đặc điểm".
- **Space** = phát/dừng. Nút Làm lại, chụp ảnh, tắt/bật tiếng ở thanh trên. Dấu **?** mở hướng dẫn.
- Chạm vào bộ phận của tai/miệng để xem chú thích; chạm khối trên thang phổ điện từ để chọn vùng sóng.
- Hoạt ảnh được làm chậm và biên độ được phóng đại để dễ nhìn; các số liệu hiển thị là giá trị thật.

## Cho người phát triển
Trang tĩnh: HTML + CSS + ES modules, chỉ dùng Canvas 2D/SVG, không thư viện. Xem `CLAUDE.md`, `SPEC.md`, `TASK.md`.
Chạy thử: `node tools/serve.mjs` rồi mở http://localhost:8765/mo-phong-song-thpt-tran-quoc-toan/
