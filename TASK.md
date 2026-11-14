# TASK – build plan (one phase per Claude Code session)

Status marks: `[ ]` todo · `[~]` in progress (resume it) · `[x]` done · `[!]` blocked (needs the owner – read the note).
Rules for every phase: read `CLAUDE.md` + the SPEC sections listed; take "before" screenshots if the phase changes existing visuals;
finish with screenshots (desktop + phone), zero console errors, commit(s) in Vietnamese, push, deploy check, then tick the boxes
and append one line to the **Log** at the bottom.

## Phase 0 – Khung ứng dụng + deploy  `[x]`
SPEC: §4, §5, §6.
- [x] Install checker once: `cd tools && npm i && npx playwright install chromium` (skip if already works).
- [x] `index.html` (lang="vi", viewport, theme-color #d7191f, preload Be Vietnam Pro 700), `css/style.css` ported from `legacy/css/style.css` (keep @font-face, tokens, header, `.brk`, `.seg`, `.chip`, `.tg`, sliders, metric cards; drop 3D/lesson/tour/coach CSS).
- [x] Header exactly as SPEC §4 (title "THÍ NGHIỆM MÔ PHỎNG SÓNG", school card right, icon toolbar left), mode tabs bar, empty left/right panels (`data-noscroll`), centre canvas with graph-paper grid, Play/Restart buttons.
- [x] `js/main.js` loop + resize + DPR cap + pause on hidden; `js/state.js` (port from legacy, trimmed); `window.__app` {play,pause,setMode}; `#mode=` routing; 4 stub modes that draw their title text.
- [x] Phone layout skeleton (bottom sheet, 4 icon tabs, 1-row metrics).
- [x] `version.json`, push, confirm Pages deploy works (enable Pages → GitHub Actions if needed; if you cannot, mark `[!]` with the click path for the owner).

## Phase 1 – Sóng dọc: vật lí + phần tử không khí  `[x]`
SPEC: §2 (Bài 8, Bài 9), §3.1 (air, ruler, controls), §6.
- [x] `js/physics.js`: u(x,t) with propagating front, −∂u/∂x, SPEED, visLambda clamp, describe pitch (port from legacy).
- [x] Air dot grid displaced along x, 3 flat shade classes from −∂u/∂x, tracked red particle with VTCB tick + ↔ arrow, outlined layer column.
- [x] λ ruler between compression centres (real λ label), labels "Vùng nén"/"Vùng giãn", badges (làm chậm, biên độ phóng đại, rút gọn).
- [x] Left-panel controls (f log slider + chips, độ to, môi trường, làm chậm); right-panel metrics + Đặc điểm card.
- [x] `js/audio.js` ported (tone + voice timbres, starts on tap, mute button works); placeholder rectangles for source and ear.
- [x] Check: dots visibly crowd exactly where "Vùng nén" is labelled; at 440 Hz in air λ shows 78,0 cm (343/440 = 0,7795 m).

## Phase 2 – Sóng dọc: hình vẽ loa, người nói, tai (giải phẫu)  `[x]`
SPEC: §3.1 (source + ear), §5 (anatomy palette, accuracy). Reference: `docs/ref/ear-voice-reference.png`.
This is the hardest drawing phase. Work section by section and screenshot after each: loa → người nói → tai ngoài → tai giữa → tai trong.
- [x] `js/art/speaker.js`: flat side-view loudspeaker, cone moving with u(0,t).
- [x] `js/art/talker.js`: sagittal head cross-section (lips, teeth, tongue, oral cavity, nasal cavity outline, pharynx, larynx + vibrating dây thanh âm, vertebrae); source toggle Loa | Người nói.
- [x] `js/art/ear.js`: ear cross-section in correct anatomical order; màng nhĩ + 3 xương con move with the arriving pressure; nerve pulses to "não".
- [x] Click a part → highlight + 1-line caption; click empty / Esc → clear. Max 7 labels visible; labels never overlap each other (simple vertical de-collision).
- [x] Portrait phone composition works (source top, ear bottom or scaled), nothing clipped.
- [x] Self-review against the reference: list 3 differences in the commit message body and fix the worst one before finishing.

## Phase 3 – Sóng ngang (dây)  `[x]`
SPEC: §2, §3.2.
- [x] Rope of beads + vibrator, propagating front, đỉnh/hõm labels, ↕ vs → arrows, λ between crests, in-phase pair.
- [x] u–x graph and scrolling u–t graph (Canvas 2D, axes labelled in Vietnamese, mono numbers), "Dừng hình".
- [x] Controls (f, A, v, làm chậm), metrics, Đặc điểm card.

## Phase 4 – Sóng mặt (surface wave)  `[x]`
SPEC: §2 (Sóng mặt), §3.3. Refs: `docs/ref/surface-wave-*.png`.
- [x] Particle-grid cross-section with Airy motion (deep: circles, shallow: ellipses), surface line through top-row particles, stepped flat blues by depth.
- [x] Tracked particles at 2–3 depths with orbit outlines + rotation arrows (clockwise for a wave moving right), VTCB ticks, phao on the surface (no drift).
- [x] Labels (đỉnh/hõm, phương truyền, λ), toggles (quỹ đạo, nước sâu/nông), controls, metrics, Đặc điểm card.
- [x] Check: top particle moves forward at the crest and backward in the trough; orbit radius at depth λ/2 ≈ 4 % of surface (e^(−π)).

## Phase 5 – Sóng điện từ  `[x]`
SPEC: §2 (Bài 11 table – verbatim), §3.4.
- [x] Oblique axes, E (orange) and B (blue) arrow trains in phase, tip curves, legend "E ⟂ B ⟂ v → sóng ngang", "v = c = 3·10⁸ m/s".
- [x] Spectrum scale of 7 flat blocks (visible light = 7 solid stripes), tap to select, shows λ range, f range, example, λ = c/f readout.
- [x] Toggles E / B / mũi tên, làm chậm; metrics (f, T, λ, v = c) and Đặc điểm card.

## Phase 6 – Hoàn thiện giao diện + điện thoại + Zalo  `[x]`
SPEC: §4, §6.
- [x] Help modal (≤ 6 bullets), screenshot button, mute, fullscreen hidden when unsupported, keyboard: Space play/pause, 1–4 modes, Esc.
- [x] Run `node tools/shot.mjs final-<mode> mode=<mode> --all` for all 4 modes; fix every clipping/overlap/scroll problem; landscape phone usable.
- [x] Performance: no per-frame allocations in hot loops, offscreen cache for static art, check fps with `performance.now()` logging (remove logs after).
- [x] Before/after comparison of each mode; revert anything not clearly better.

## Phase 7 – Dọn dẹp + bàn giao  `[x]`
- [x] Delete `legacy/` (and old refs not used), update `CLAUDE.md` code map to the final files, write a short Vietnamese `README.md` (cách dùng, link).
- [x] Final `--all` screenshots of 4 modes, zero errors, deploy check, set `version.json` phase "final".
- [x] Report: link + 3 lines + anything the owner should test on a real phone / in Zalo.

## Phase 8 – Vẽ lại Người nói (Art v2)  `[x]`
SPEC: §7 (Người nói), §5 palette. Recommended model: **Opus** (drawing). Before screenshot first: `node tools/shot.mjs before8` with source = Người nói.
- [x] Download the §7 references into `docs/ref/web/` and look at them; write 3 bullet "what makes it recognisable" notes in the Log.
- [x] Rebuild `js/art/talker.js`: proportioned side profile + sagittal vocal tract, vibrating vocal folds, air-flow arrow, ≤ 5 de-collided labels.
- [x] Works at desktop and phone sizes (Path2D cached per size, no per-frame allocation).
- [x] Side-by-side check vs `docs/ref/v1-talker.png` and the references: must be clearly better, else iterate (max 3 rounds).

## Phase 9 – Vẽ lại Tai người nghe với kính lúp (Art v2)  `[ ]`
SPEC: §7 (Tai). Recommended model: **Opus** (drawing).
- [ ] Small listener head (same style as Phase 8) + magnifier callout + large coronal ear cross-section in correct anatomical order.
- [ ] Motion: eardrum, ossicles, nerve pulses synced to the arriving wave; click part → highlight + caption; empty click/Esc clears.
- [ ] ≤ 7 labels, no overlaps, phone layout works.
- [ ] Side-by-side check vs `docs/ref/v1-ear.png`: a non-expert must instantly see "an ear"; iterate (max 3 rounds).

## Phase 10 – Đánh bóng: rõ, đẹp, cuốn hút (không nặng máy)  `[ ]`
SPEC: §4, §5. Model: Sonnet (High).
- [ ] Physics spot-checks: Sóng điện từ – E and B maxima at the same x (in phase); Sóng mặt – clockwise orbits, no gap at stage edges; Sóng ngang – u–x/u–t graphs consistent with the rope.
- [ ] Toggle buttons (`.tg`) labels never wrap to 2 lines (shorter Vietnamese words or wider grid); school name stays on one line at every width.
- [ ] Cheap "wow" polish, each must pass before/after: (a) on mode switch the wave visibly starts from the source (t = 0) with a 0.4 s fade-in of labels;
  (b) hover/tap highlight on labelled parts; (c) consistent label pills and leader lines across modes; (d) phone layout re-check for all 4 modes.
- [ ] Sound stays **muted by default** (owner request); the mute button shows clearly that sound is off.
- [ ] Final `--all` screenshots for 4 modes, zero errors, deploy check.

## Log
<!-- one line per session: date · phase · what was done · commit hash -->
2026-11-14 · Phase 0 · khung ứng dụng (header, 4 tab, panel, canvas giấy kẻ ô, vòng lặp, bố cục điện thoại), 4 chế độ giữ chỗ; f=440 Hz/khí → T=2,27 ms, λ=78,0 cm; FM 100 MHz → λ=3 m · 8c74cf5
2026-11-14 · Phase 1 · sóng dọc: u=A·sin(ωt−kx) (pha đầu −π/2 để mặt sóng liên tục), lưới chấm không khí 3 màu từ −∂u/∂x, nhãn nén/giãn, thước λ, phần tử đỏ + VTCB, điều khiển f/độ to/môi trường/làm chậm, âm thanh WebAudio; kiểm: khí 440 Hz → λ=78,0 cm, nước 440 Hz → 3,37 m, thép 4 kHz → 1,49 m; điện thoại ngang còn chật (để Phase 6) · d207202
2026-11-14 · Phase 2 · hình vẽ phẳng loa (màng loa dao động theo u(0,t)), người nói (cắt dọc: dây thanh âm rung, họng, miệng, lưỡi, mũi, cột sống), tai (vành tai→ống tai→màng nhĩ→búa–đe–bàn đạp→cửa sổ bầu dục→ốc tai→dây thần kinh, xung thần kinh chạy lên não); chạm bộ phận → viền đỏ + chú thích, Esc/chạm trống để bỏ; điện thoại dọc xếp loa/người nói trên, tai dưới; kiểm: khí 440 Hz → λ=78,0 cm · 1fd991b
2026-11-14 · Phase 3 · sóng ngang: dây 24–48 hạt + cần rung, u=A·sin(ωt−kx) có mặt sóng, nhãn đỉnh/hõm, thước λ giữa 2 đỉnh, 2 phần tử cách λ cùng pha (đường đứt cùng độ cao), đồ thị u–x và u–t cuộn (trục cm/s), Dừng hình; kiểm: f=1 Hz, v=2 m/s → T=1 s, λ=2 m; điện thoại ngang chỉ hiện dây · a8a9f06
2026-11-14 · Phase 4 · sóng mặt: lưới 30×10 chấm chuyển động ξ=−a·sinφ, η=b·cosφ (thuận chiều kim đồng hồ), mặt nước vẽ qua hàng chấm trên (đỉnh nhọn, hõm phẳng), 3 dải xanh, phần tử đỏ 3 độ sâu + quỹ đạo, phao không trôi, nước sâu (tròn) | nông (elip, đáy); kiểm: bán kính ở độ sâu λ/2 = 4,32 % = e^(−π); đỉnh tiến, hõm lùi; v=1,56 m/s, f=1 Hz → λ=1,56 m · d42b4bd
2026-11-14 · Phase 5 · sóng điện từ: E (cam, dọc) và B (lam, theo z chiếu xiên 30°) cùng pha u=cos(ωt−kx) có mặt sóng, đường nối đầu mũi tên, thước λ thật, thang 7 khối Bảng 11.1 (ánh sáng nhìn thấy = 7 sọc đặc), chạm khối để chọn, thẻ λ=c/f; kiểm: FM 100 MHz → λ=3 m, 5·10¹⁴ Hz → 600 nm, 2,45 GHz → 12,2 cm, 3·10²⁰ Hz → 1 pm; điện thoại ngang chỉ hiện sóng (Phase 6) · ec7530c
2026-11-14 · Phase 6 · hoàn thiện: điện thoại nằm ngang có cột trái (tab 2×2, số liệu 2×2, nút nhóm mở khay bên cạnh) nên sân khấu cao gần hết màn hình; phím Space (phát/dừng) và 1–4 (chọn sóng); hướng dẫn 6 ý; kiểm 4 chế độ × 5 khung hình không lỗi/không cuộn; hiệu năng giả lập CPU chậm 4× trên 390×844 vẫn 60 fps cả 4 chế độ; kiểm: khí 440 Hz → λ=78,0 cm, FM 100 MHz → λ=3 m · d7d3451
2026-11-14 · Phase 7 · dọn dẹp: xóa legacy/stub/ảnh 3D cũ, README tiếng Việt, bản đồ mã trong CLAUDE.md, kiểm 4 chế độ × 5 khung không lỗi; kiểm: khí 440 Hz → λ=78,0 cm, FM 100 MHz → λ=3 m · ad821d3
2026-11-14 · Phase 8 · vẽ lại Người nói: mặt nghiêng tỉ lệ chuẩn (mắt ở giữa đầu, tai từ lông mày tới đáy mũi, miệng ở 1/3 mũi–cằm), mặt cắt đường thở liền khối (khoang mũi, vòm cứng + vòm mềm/lưỡi gà, khoang miệng, lưỡi, nắp thanh quản, họng, thanh quản, khí quản, 7 đốt sống cổ), dây thanh âm rung theo u(0,t), mũi tên luồng khí phổi → miệng, 5 nhãn không cắt nhau, vùng chọn tô đỏ; nhận diện (ảnh docs/ref/web): (1) đường viền trán–mũi–môi–cằm–cổ + mắt + tai là thấy ngay "người"; (2) đường thở là một kênh trống liền từ khí quản tới môi, viền hồng, như "Places of articulation"; (3) mốc: vòm miệng ngăn mũi/miệng, lưỡi vòm lớn, lưỡi gà, nắp thanh quản, cột sống sau họng (Gray 994); thêm #src=talker; kiểm: khí 440 Hz → λ=78,0 cm · bac94ec
