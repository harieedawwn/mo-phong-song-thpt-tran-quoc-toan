# TASK – v3 rebuild plan (one phase per Claude Code session)

Status: `[ ]` todo · `[~]` in progress (resume it) · `[x]` done · `[!]` blocked (needs the owner – read the note).
Phases 0–10 (flat v2) are done; history is in `docs/history.md` (do not read it).
**Model:** each phase header names the model. If you are not that model, do no work: reply only
"Phase N cần <model> – gõ /model rồi dán lại prompt." (Sonnet = effort High.)

**Every phase:**
1. Read `CLAUDE.md`, this file, and only the SPEC sections + files listed under the phase (use `grep -n` to jump inside big files).
2. If the phase changes visuals: `node tools/shot.mjs before<N> <hash> --paused` first.
3. Finish: `find js -name '*.js' -exec node --check {} \;`, then `node tools/shot.mjs after<N> <hash> --paused` for every mode the
   phase touched (`--all` in phases 11, 13, 19) – exit code 0 and **open the PNGs** (desk, phone, desk-paused at least).
4. Compare before/after; anything not clearly better is fixed or reverted.
5. Tick boxes, append one Log line (date · phase · what · numbers checked · hash), set `version.json`, commit (Vietnamese), push, deploy check.

## Phase 11 – Gọn giao diện + cơ chế "dừng hình mới hiện nhãn"  `[ ]`  · Sonnet (High)
SPEC §1, §3 (pause lists), §4, §6 (mode interface). Files: `index.html`, `css/style.css`, `js/ui.js`, `js/main.js`, `js/draw/ink.js`,
`js/state.js`, all 4 `js/modes/*.js` (only the label/badge/feature/hover parts).
- [ ] Delete the right panel (`#info`, metrics, formula, Đặc điểm card) from HTML/CSS/JS; desktop grid becomes `ctrl | stage`; phone metrics row gone; dock keeps ≤ 2 groups.
- [ ] Delete `#badges`, legend lines and explanatory sentences drawn under the stage, tap-to-caption and hover highlight (keep EM band tap).
- [ ] Delete toggles "Nhãn", "Thước λ", "Dừng hình" (keep "Phần tử đỏ" and mode-specific ones like E/B/Mũi tên/Quỹ đạo); remove the u–x and u–t graphs from `transverse.js` and give the rope the freed height.
- [ ] Split every mode into `draw()` (objects only, axes letters allowed) and `annotate()` (all labels, rulers, arrows with words, VTCB ticks); `main.js` calls `annotate` only when paused with `fx.a` 0 → 1 over 0,25 s; play hides at once; slider changes while paused redraw.
- [ ] Readout chip (paused only, top-left of the stage, drawn on canvas so screenshots include it): line 1 real f · T · λ · v from `metrics()`, line 2 muted `readout()` extras (làm chậm ×N, biên độ phóng đại, pitch text).
- [ ] Header: school name one line at every checker size (`nowrap` + `clamp()` font); no page scrollbar anywhere (checker now enforces). Help modal ≤ 5 bullets (SPEC §4).
- [ ] Check: running frames have no text except axis letters; paused frames show all labels without overlaps; `--all` passes; 440 Hz air → λ = 78,0 cm on the chip.

## Phase 12 – Bộ đồ hoạ chiều sâu (hạt cầu 3D, ống dây, nền, nạp SVG)  `[ ]`  · Sonnet (High)
SPEC §5, §6 (ball.js, sprite.js, SVG rules). Files: `js/draw/*.js`, `js/main.js`, the particle-drawing parts of `js/modes/*.js`.
- [ ] `js/draw/ball.js` sphere sprite cache (offset radial gradient, specular dot, rim, baked contact shadow); cleared on resize.
- [ ] Use spheres for every particle in all modes (air, rope beads, surface grid, phao stays a float); rope as shaded tube; pills with soft shadow (paused only).
- [ ] Sound mode particles: uniform blue spheres while running; paused → soft orange/blue tinted bands behind nén/giãn zones (from `wave.s`).
- [ ] Surface: water vertical gradient + glossy surface line; shallow bed gradient. Grid canvas: lighter lines + soft vignette (baked).
- [ ] `js/art/sprite.js` loader exactly as SPEC §6 + a tiny `art/_probe.svg` (2 layers, one `data-move`) to prove it: draw it in a corner, screenshot, then delete the probe usage (keep the loader).
- [ ] Perf: no allocation in hot loops; 390×844 still smooth (log fps for 5 s with `performance.now()`, remove the log after).

## Phase 13 – Tab gộp "Sóng ngang – Sóng dọc" + máy rung + trục Ox  `[ ]`  · Sonnet (High)
SPEC §2, §3.1, §5, §6. Files: `js/modes/transverse.js` (source to reuse), `js/modes/longitudinal.js` (only `layout`/particles part),
`js/main.js`, `js/ui.js` (tabs), `js/art/sprite.js`, `js/physics.js`.
- [ ] `art/driver.svg`: lab wave driver (body static with gradient, shaft = `<g id="shaft" data-move>`, clamp anchor `a-clamp`). Check it alone with `--page`.
- [ ] `js/modes/waves.js`: two lanes (rope on top, bead–spring chain below), same wave object, same x scale; driver upright (shaft ↕) and lying (shaft ↔); shaft and first bead follow u(0,t) exactly; k·A ≤ 0,8 in the bottom lane.
- [ ] Axes O, x, u per lane (SPEC §3.1); lane seg "Cả hai | Sóng ngang | Sóng dọc"; shared red bead index.
- [ ] `annotate()`: đỉnh/hõm, nén/giãn + tinted bands, aligned λ rulers with the real value, vertical guide through the red beads, direction arrows, chip.
- [ ] Rename `longitudinal.js` → `sound.js` (id `sound`), delete `transverse.js`; tab order waves, sound, surface, em; aliases `transverse`→`waves`, `longitudinal`→`sound`; default mode `waves`.
- [ ] Check: f = 1 Hz, v = 2 m/s → λ = 2 m on both rulers; crowded beads exactly under "Vùng nén"; `--all` passes.

## Phase 14 – Sóng điện từ: thang phổ chuẩn, gọn  `[ ]`  · Sonnet (High)
SPEC §2 (table), §3.4. Files: `js/modes/em.js`, `js/state.js`.
- [ ] Re-order BANDS gamma → vô tuyến (left → right), default band = Sóng vô tuyến; rounded 7-segment bar with gradients, rainbow segment, short names, "bước sóng tăng →" / "← tần số tăng"; tap selects.
- [ ] Delete the info card under the bar and the band chips in the left panel; selected band data goes to the paused chip.
- [ ] Arrow depth + faint E/B planes; all words (E, B, legend, "Cùng pha", λ) only in `annotate()`.
- [ ] Check: FM 100 MHz → λ = 3 m, 2,45 GHz → 12,2 cm, 5·10¹⁴ Hz → 600 nm, 3·10²⁰ Hz → 1 pm; E and B maxima at the same x.

## Phase 15 – Sóng âm: cột không khí đúng, môi trường Nước/Thép đúng bản chất  `[ ]`  · Sonnet (High)
SPEC §2, §3.2 (except final art). Files: `js/modes/sound.js`, `js/art/speaker.js` (geometry only), `js/physics.js`, `js/main.js` (hash `med=`).
- [ ] Air column only in front of the cone mouth (rows = rim height, from the cone face to the receiver); first layer rest = cone face rest, both use u(0,t); nothing behind/around the speaker; k·A ≤ 0,8.
- [ ] Same column rule for the talker (in front of the lips).
- [ ] Nước scene: glass tank + water gradient, transducer placeholder (rounded rect + face plate) touching water on the left, mirrored receiver on the right, ear hidden. Thép scene: clamped steel bar (metal gradient), grey lattice atoms, transducer on the left end face, sensor on the right. Source chips only in air.
- [ ] Help bullet about water/steel (SPEC §3.2); `#mode=sound&med=steel` works.
- [ ] Check: air 440 Hz → 78,0 cm; water 440 Hz → 3,37 m; steel 4 kHz → 1,49 m; first layer never touches/crosses the cone at max A (pause at max push and look).

## Phase 16 – Vẽ lại Loa + đầu phát/máy thu (SVG có khối)  `[ ]`  · Sonnet (High)
SPEC §3.2 (Loudspeaker), §5, §6 (SVG rules). Files: `js/art/sprite.js`, `js/modes/sound.js` (art draw calls), old `js/art/speaker.js` (to delete).
Before: `node tools/shot.mjs before16 mode=sound --paused`.
- [ ] `art/speaker.svg`: cabinet front + driver cut-away; static: cabinet, basket, magnet, top plate, pole; `data-move` layers: cone+dust cap, voice coil; anchors for labels, cone rim (top/bottom) and cone face. Realistic shading, light from upper-left. Check alone with `--page`.
- [ ] Surround + spider drawn as canvas curves from static anchors to the moving cone rim (stretch, no gaps); the frame never moves.
- [ ] `art/transducer.svg` (piezo disc in a metal housing with a face plate; `data-move` face) used as source and mirrored as receiver in water/steel.
- [ ] Delete `js/art/speaker.js` if unused; labels on pause from SVG anchors (≤ 4).
- [ ] Side-by-side with before16: clearly more realistic, else iterate (max 2 rounds). If still weak after 2 rounds, mark `[!]` "cần Opus" and stop.

## Phase 17 – Vẽ lại Tai người nghe + kính lúp (giải phẫu chân thực)  `[ ]`  · **Opus**
SPEC §3.2 (receiver, ear labels), §5, §6. Files: `js/art/ear.js` (for anatomy order + motion logic only), `js/modes/sound.js` (ear calls),
`js/art/sprite.js`. Look at `docs/ref/web/ear-anatomy.png` and `docs/ref/ear-voice-reference.png` first.
Before: `node tools/shot.mjs before17 mode=sound --paused`.
- [ ] `art/ear.svg`: small listener head (side profile, realistic shading, facing the source) + magnifier ring + big circular coronal cut: skin, temporal bone, pinna, S-shaped canal, eardrum (`data-move`), malleus / incus / stapes (`data-move` each, pivot anchors), middle-ear cavity, Eustachian tube, cochlea 2,5 turns, 3 semicircular canals, vestibule, auditory nerve to "Não"; nerve-path anchors for pulses.
- [ ] Motion synced to the pressure arriving at the canal: eardrum in/out, ossicles rock, nerve pulses.
- [ ] Paused: ≤ 7 labels from anchors, leaders never cross; phone layout (magnifier may sit below the head).
- [ ] Delete old `js/art/ear.js` (and `figure.js` if nothing else uses it). A non-expert must see "a real ear" in 1 s; iterate ≤ 3 rounds.

## Phase 18 – Vẽ lại Người nói (mặt cắt dọc chân thực)  `[ ]`  · **Opus**
SPEC §3.2 (talker labels), §5, §6. Files: `js/art/talker.js` (anatomy order + motion only), `js/modes/sound.js`, `js/art/sprite.js`.
Look at `docs/ref/web/gray994.png` and `docs/ref/web/places-of-articulation.png` first. Before: `node tools/shot.mjs before18 "mode=sound&src=talker" --paused`.
- [ ] `art/talker.svg`: calm adult side profile with realistic skin shading + sagittal cut (nasal cavity, hard/soft palate, tongue, teeth, lips, oral cavity, pharynx, epiglottis, larynx, trachea, cervical vertebrae); vocal folds `data-move`; mouth anchor for the air column.
- [ ] Vocal folds vibrate with u(0,t); air-flow arrow lungs → mouth (paused only, it has words).
- [ ] Paused ≤ 5 labels; delete old `js/art/talker.js` and `figure.js` if unused. Iterate ≤ 3 rounds vs before18.

## Phase 19 – Sóng mặt hoàn thiện + kiểm điện thoại/Zalo + dọn dẹp  `[ ]`  · Sonnet (High)
SPEC all. Files: as needed (grep first).
- [ ] Surface mode final check vs SPEC §3.3 (clockwise, no drift, radius at depth λ/2 ≈ 4,3 %); paused annotations complete.
- [ ] Add `--perf` to `tools/shot.mjs` (CPU throttle ×4 via CDP `Emulation.setCPUThrottlingRate`, report average fps over 5 s per mode at 390×844); all 4 modes ≥ 50 fps.
- [ ] `--all --paused` for 4 modes, zero errors, no scrollbars, nothing clipped in phone portrait/landscape.
- [ ] Remove dead code/CSS (grep for `features`, `badges`, `hover`, `#info`, `metrics`), unused refs; update `CLAUDE.md` code map, `README.md` (Vietnamese, cách dùng mới).
- [ ] `version.json` phase "v3"; report to the owner: link + 3 lines + what to test in Zalo on a real phone.

## Log
<!-- one line per session: date · phase · what was done · numbers checked · commit hash -->
