# Thí nghiệm mô phỏng sóng âm 3D – Vật lí 11

Site tĩnh (three.js, ES modules + importmap, **không có bước build**). Deploy tự động lên GitHub Pages khi push `main`
(`.github/workflows/pages.yml`, upload cả thư mục). Link: https://harieedawwn.github.io/song-am-simulator-vat-ly-11/

Người dùng: học sinh, giáo viên THPT Trần Quốc Toản (Đồng Tháp). Chạy trên máy chiếu lớp (1366×768, 1280×720), điện thoại, **trình duyệt Zalo**.

## Quy tắc làm việc (bắt buộc)
- Trả lời **tiếng Việt**, ngắn gọn. Commit nhỏ, message tiếng Việt, push `main`. Luôn `git pull origin main` trước khi làm.
- **Vật lí đúng chương trình Vật lí 11 Kết nối tri thức** (Chương II Sóng: Bài 8 Mô tả sóng, Bài 9 Sóng ngang, sóng dọc, sự truyền năng lượng của sóng cơ, Bài 10 Thực hành đo tần số sóng âm). Dùng thuật ngữ SGK: "phần tử môi trường/phần tử không khí", "vị trí cân bằng", "vùng nén/vùng giãn", λ = v/f = vT. Ý tưởng của chủ repo/giáo viên là cố định: chỉ sửa cho đúng vật lí, không bỏ ý.
- **Đồ hoạ chỉ được đẹp hơn**: chụp ảnh trước–sau (desktop 1366×768 + điện thoại 390×844), chỗ nào không đẹp hơn rõ ràng thì hoàn tác.
- Nguồn âm mặc định là **Loa** bên trái; Miệng người là tuỳ chọn. Đầu người **không có chân chống** (lơ lửng).
- Không thêm hiệu ứng nặng (bloom/postprocessing đã bị bỏ có chủ đích), không thêm thư viện nếu không cần.
- Mọi đường dẫn phải **tương đối** (site chạy dưới `/song-am-simulator-vat-ly-11/`). Tên file phân biệt HOA/thường (Pages chạy Linux).
- Màn hình desktop **không được phải cuộn** bảng điều khiển ở 1366×768 và 1280×720.

## Chạy và kiểm tra
```bash
# phục vụ đúng đường dẫn con như Pages
mkdir -p /tmp/www && ln -sfn "$PWD" /tmp/www/song-am-simulator-vat-ly-11
cd /tmp/www && python3 -m http.server 8765
# mở http://localhost:8765/song-am-simulator-vat-ly-11/
for f in js/*.js; do node --check --input-type=module < "$f"; done   # kiểm cú pháp
```
Chụp ảnh bằng Playwright (Chromium, `--use-gl=angle --use-angle=swiftshader`): chờ ~12 s cho cảnh tải; bỏ hướng dẫn lần đầu bằng
`localStorage.setItem('soundlab3d.onboarding.done','1')`; điều khiển qua `import('./js/api.js').then(m=>m.api.togglePlay())`.
Không được có lỗi console (bỏ qua cảnh báo "GL Driver ... ReadPixels" của swiftshader) và không có request 404.

## Bản đồ code
| File | Vai trò |
|---|---|
| `index.html` | importmap (`three` → `lib/three.module.js`, `three/addons/` → `lib/addons/`), loader, các root DOM |
| `css/style.css` | toàn bộ giao diện + @font-face (Be Vietnam Pro, JetBrains Mono trong `fonts/`) |
| `js/main.js` | renderer (render thẳng, không composer), camera, OrbitControls, chất lượng (TIERS), chuyển cảnh, pick, vòng lặp, gắn `api` |
| `js/state.js` | `state`, `bus` (on/off/emit), `set(key,value)` → phát `change` |
| `js/layout.js` | `LAYOUT` (toạ độ nguồn `speaker.mouth`, tai `head.earRight`, preset camera), `COLORS` |
| `js/physics.js` | `waveParams`, `SPEED`, `describePitch`, `pressureAt`, `displacementAt`… – nguồn sự thật cho số liệu |
| `js/ui.js` | giao diện: tiêu đề, tên trường (`APP_TITLE`, `SCHOOL`), #tools, #ctrl (3 nhóm + dock điện thoại), #info, #btn-play, #sidebar |
| `js/stage-room.js` | phòng nghe, thước; chọn nguồn theo `state.emitter` ('speaker' mặc định \| 'mouth') |
| `js/talker.js` | người nói (dùng lại bản quét đầu, quay +90°), miệng đặt tại `LAYOUT.speaker.mouth` |
| `js/speaker.js` | loa 3D (khi `emitter='speaker'`) |
| `js/waves.js` | phần tử không khí (shader), hạt đánh dấu dao động dọc, mặt cắt áp suất, nhãn λ/nén/giãn |
| `js/head.js` | đầu người nghe (scan GLB), cắt nửa đầu, `HEAD_CONFIG`, `prepareScan` |
| `js/stage-ear.js`, `ear-model.js`, `ear-middle.js`, `ear-inner.js` | cảnh "Bên trong tai" |
| `js/content.js` | `LESSON`, `QUIZ`, `PARTS_INFO`, `TOUR` (9 bước), `CREDITS` – mọi chữ bài học |
| `js/learn.js`, `tour.js`, `scope.js`, `labels.js`, `onboarding.js`, `audio.js` | bài học, hành trình, máy hiện sóng, nhãn 3D, hướng dẫn lần đầu, âm thanh WebAudio/TTS |

## Không được làm hỏng
- `api` (gắn trong main.js): `togglePlay, play, stop, setView, setHeadMode, goTo({view,preset,duration}), focusPart, speak, stopSpeak, screenshot, anchorToScreen('speakerButton')`.
- Khoá `state`: `playing, emitter, source, timbre, frequency, level, medium, slow, spreading, layers{particles,slice,markers,ruler,labels,flow}, particleMode, headMode, view, earExplode, earCut, earUnroll, quality, volume, muted, live, earDrive`.
- Id DOM dùng ở module khác/hướng dẫn: `gl, loader, loader-fill, fade, ui-root, labels-root, overlay-root, btn-play, btn-view, btn-headcut, btn-learn, btn-tour, btn-help, btn-mute, btn-fullscreen, btn-shot, btn-settings, ctrl, info, metrics, scope-root, sidebar, sidebar-toggle, tab-learn, tab-tour, tab-sim, pane-*, ctl-*`.
- Pick id `'speakerButton'` (bấm người nói/loa = phát), `'earRegion'` (vào tai).
- Preset camera trong `LAYOUT.presets` (room: overview, speaker, path, head, headCut; ear: overview, canal, drum, ossicles, cochlea, nerve).
- Mô hình vật lí trong `physics.js` khớp shader `waves.js` – sửa một bên phải sửa bên kia.

## Phong cách giao diện (cố định)
Giống bộ mô phỏng của trường: tiêu đề **chữ đỏ in hoa trong khung trắng ở giữa trên**, **tên trường đỏ in hoa góc phải** (khung trắng, vạch đỏ trái),
panel kem có **góc khung** (`.brk`), nút chọn chính **nền đen** (`.seg`), lựa chọn đang bật **nền đỏ** (`.chip`), số liệu **font mono** trong thẻ.
Màu: `--red #d7191f`, `--ink #15181d`, nén `#e8590c`, giãn `#1c7ed6`. Font: Be Vietnam Pro (tự host).

## Việc lớn
Viết `TASK.md` chia phase có checklist `[ ]`; mỗi phase một phiên mới; đánh dấu `[x]`, commit, push sau mỗi phase.
