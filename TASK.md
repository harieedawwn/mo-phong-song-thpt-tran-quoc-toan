# TASK – build plan (one phase per Claude Code session)

Status marks: `[ ]` todo · `[~]` in progress (resume it) · `[x]` done · `[!]` blocked (needs the owner – read the note).
Rules for every phase: read `CLAUDE.md` + the SPEC sections listed; take "before" screenshots if the phase changes existing visuals;
finish with screenshots (desktop + phone), zero console errors, commit(s) in Vietnamese, push, deploy check, then tick the boxes
and append one line to the **Log** at the bottom.

## Phase 0 – Khung ứng dụng + deploy  `[ ]`
SPEC: §4, §5, §6.
- [ ] Install checker once: `cd tools && npm i && npx playwright install chromium` (skip if already works).
- [ ] `index.html` (lang="vi", viewport, theme-color #d7191f, preload Be Vietnam Pro 700), `css/style.css` ported from `legacy/css/style.css` (keep @font-face, tokens, header, `.brk`, `.seg`, `.chip`, `.tg`, sliders, metric cards; drop 3D/lesson/tour/coach CSS).
- [ ] Header exactly as SPEC §4 (title "THÍ NGHIỆM MÔ PHỎNG SÓNG", school card right, icon toolbar left), mode tabs bar, empty left/right panels (`data-noscroll`), centre canvas with graph-paper grid, Play/Restart buttons.
- [ ] `js/main.js` loop + resize + DPR cap + pause on hidden; `js/state.js` (port from legacy, trimmed); `window.__app` {play,pause,setMode}; `#mode=` routing; 4 stub modes that draw their title text.
- [ ] Phone layout skeleton (bottom sheet, 4 icon tabs, 1-row metrics).
- [ ] `version.json`, push, confirm Pages deploy works (enable Pages → GitHub Actions if needed; if you cannot, mark `[!]` with the click path for the owner).

## Phase 1 – Sóng dọc: vật lí + phần tử không khí  `[ ]`
SPEC: §2 (Bài 8, Bài 9), §3.1 (air, ruler, controls), §6.
- [ ] `js/physics.js`: u(x,t) with propagating front, −∂u/∂x, SPEED, visLambda clamp, describe pitch (port from legacy).
- [ ] Air dot grid displaced along x, 3 flat shade classes from −∂u/∂x, tracked red particle with VTCB tick + ↔ arrow, outlined layer column.
- [ ] λ ruler between compression centres (real λ label), labels "Vùng nén"/"Vùng giãn", badges (làm chậm, biên độ phóng đại, rút gọn).
- [ ] Left-panel controls (f log slider + chips, độ to, môi trường, làm chậm); right-panel metrics + Đặc điểm card.
- [ ] `js/audio.js` ported (tone + voice timbres, starts on tap, mute button works); placeholder rectangles for source and ear.
- [ ] Check: dots visibly crowd exactly where "Vùng nén" is labelled; at 440 Hz in air λ shows 78,0 cm (343/440 = 0,7795 m).

## Phase 2 – Sóng dọc: hình vẽ loa, người nói, tai (giải phẫu)  `[ ]`
SPEC: §3.1 (source + ear), §5 (anatomy palette, accuracy). Reference: `docs/ref/ear-voice-reference.png`.
This is the hardest drawing phase. Work section by section and screenshot after each: loa → người nói → tai ngoài → tai giữa → tai trong.
- [ ] `js/art/speaker.js`: flat side-view loudspeaker, cone moving with u(0,t).
- [ ] `js/art/talker.js`: sagittal head cross-section (lips, teeth, tongue, oral cavity, nasal cavity outline, pharynx, larynx + vibrating dây thanh âm, vertebrae); source toggle Loa | Người nói.
- [ ] `js/art/ear.js`: ear cross-section in correct anatomical order; màng nhĩ + 3 xương con move with the arriving pressure; nerve pulses to "não".
- [ ] Click a part → highlight + 1-line caption; click empty / Esc → clear. Max 7 labels visible; labels never overlap each other (simple vertical de-collision).
- [ ] Portrait phone composition works (source top, ear bottom or scaled), nothing clipped.
- [ ] Self-review against the reference: list 3 differences in the commit message body and fix the worst one before finishing.

## Phase 3 – Sóng ngang (dây)  `[ ]`
SPEC: §2, §3.2.
- [ ] Rope of beads + vibrator, propagating front, đỉnh/hõm labels, ↕ vs → arrows, λ between crests, in-phase pair.
- [ ] u–x graph and scrolling u–t graph (Canvas 2D, axes labelled in Vietnamese, mono numbers), "Dừng hình".
- [ ] Controls (f, A, v, làm chậm), metrics, Đặc điểm card.

## Phase 4 – Sóng mặt (surface wave)  `[ ]`
SPEC: §2 (Sóng mặt), §3.3. Refs: `docs/ref/surface-wave-*.png`.
- [ ] Particle-grid cross-section with Airy motion (deep: circles, shallow: ellipses), surface line through top-row particles, stepped flat blues by depth.
- [ ] Tracked particles at 2–3 depths with orbit outlines + rotation arrows (clockwise for a wave moving right), VTCB ticks, phao on the surface (no drift).
- [ ] Labels (đỉnh/hõm, phương truyền, λ), toggles (quỹ đạo, nước sâu/nông), controls, metrics, Đặc điểm card.
- [ ] Check: top particle moves forward at the crest and backward in the trough; orbit radius at depth λ/2 ≈ 4 % of surface (e^(−π)).

## Phase 5 – Sóng điện từ  `[ ]`
SPEC: §2 (Bài 11 table – verbatim), §3.4.
- [ ] Oblique axes, E (orange) and B (blue) arrow trains in phase, tip curves, legend "E ⟂ B ⟂ v → sóng ngang", "v = c = 3·10⁸ m/s".
- [ ] Spectrum scale of 7 flat blocks (visible light = 7 solid stripes), tap to select, shows λ range, f range, example, λ = c/f readout.
- [ ] Toggles E / B / mũi tên, làm chậm; metrics (f, T, λ, v = c) and Đặc điểm card.

## Phase 6 – Hoàn thiện giao diện + điện thoại + Zalo  `[ ]`
SPEC: §4, §6.
- [ ] Help modal (≤ 6 bullets), screenshot button, mute, fullscreen hidden when unsupported, keyboard: Space play/pause, 1–4 modes, Esc.
- [ ] Run `node tools/shot.mjs final-<mode> mode=<mode> --all` for all 4 modes; fix every clipping/overlap/scroll problem; landscape phone usable.
- [ ] Performance: no per-frame allocations in hot loops, offscreen cache for static art, check fps with `performance.now()` logging (remove logs after).
- [ ] Before/after comparison of each mode; revert anything not clearly better.

## Phase 7 – Dọn dẹp + bàn giao  `[ ]`
- [ ] Delete `legacy/` (and old refs not used), update `CLAUDE.md` code map to the final files, write a short Vietnamese `README.md` (cách dùng, link).
- [ ] Final `--all` screenshots of 4 modes, zero errors, deploy check, set `version.json` phase "final".
- [ ] Report: link + 3 lines + anything the owner should test on a real phone / in Zalo.

## Log
<!-- one line per session: date · phase · what was done · commit hash -->
