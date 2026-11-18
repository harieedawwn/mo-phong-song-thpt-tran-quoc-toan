# TASK – v3 rebuild plan (one phase per session; routine = CLAUDE.md "Session routine")
Status: `[ ]` todo · `[~]` in progress (resume) · `[x]` done · `[!]` blocked (note says why). Phases 0–10 = v2, done (`docs/history.md`, do not read).
Read only this header and YOUR phase section (`grep -n '^## Phase' TASK.md`, then a partial read).
Phase-local rule: touch only what the phase lists; files that a later phase rewrites get only the minimum edit so nothing breaks.

## Phase 11 – Khung gọn + "dừng hình mới hiện nhãn"  `[x]`  · Sonnet (High)
SPEC §1, §4, §6 (mode interface), §3.2/§3.3 pause lists. Files: `index.html`, `css/style.css`, `js/ui.js`, `js/main.js`, `js/draw/ink.js`,
`js/state.js`, `js/modes/longitudinal.js`, `js/modes/surface.js`. In `transverse.js` / `em.js` only delete what the shell stops calling (they are rewritten in 13/14).
- [x] Delete right panel (`#info`, metrics, formula, Đặc điểm), `#badges`, legend/help sentences on the stage, tap-caption + hover highlight, toggles Nhãn / Thước λ / Dừng hình. Grid = `ctrl | stage`; phone metrics row gone; dock ≤ 2 groups.
- [x] `main.js`: `draw()` every frame, `annotate()` only when paused (`fx.a` 0 → 1 in 0,25 s, play hides at once, slider change while paused redraws). Readout chip on canvas (line 1 real f · T · λ · v from `metrics()`, line 2 muted `readout()`).
- [x] longitudinal + surface: move every word/ruler/VTCB tick/arrow-with-text into `annotate()`.
- [x] School name one line at all sizes (`nowrap` + `clamp()`), no page scrollbar, help ≤ 5 bullets.
- [x] Check (`--all --paused`, modes longitudinal + surface): running = no text but axis letters; paused labels don't overlap; chip shows λ = 78,0 cm at 440 Hz air.

## Phase 12 – Hạt cầu 3D + nền + bộ nạp SVG  `[x]`  · Sonnet (High)
SPEC §5, §6 (ball.js, sprite.js, SVG rules). Files: `js/draw/*.js`, `js/main.js`, particle parts of `longitudinal.js`, `surface.js` (grep).
- [x] `js/draw/ball.js` sphere sprite cache; spheres for air + surface particles; pills soft shadow (paused only).
- [x] Sound particles uniform blue while running; paused → tinted nén/giãn bands from `wave.s`.
- [x] Surface: water vertical gradient, glossy surface line, shallow bed gradient. Grid canvas: lighter lines + baked vignette.
- [x] Write `js/art/sprite.js` per SPEC §6 (not used yet – verified in Phase 13; only `node --check` now).
- [x] Check before/after for both modes.

## Phase 13 – Tab "Sóng ngang – Sóng dọc" + máy rung + trục Ox  `[x]`  · Sonnet (High)
SPEC §2, §3.1, §6. Files: `js/modes/transverse.js` (reuse wave/rope logic), `js/main.js`, `js/ui.js` (tabs), `js/art/sprite.js`, `js/draw/ball.js`.
- [x] `art/driver.svg` (static body, `<g id="shaft" data-move>`, anchor `a-clamp`); check alone with `--page`. This also proves `sprite.js` – fix it if needed.
- [x] `js/modes/waves.js`: rope lane (driver upright, shaft ↕) + bead–spring lane (driver lying, shaft ↔), same wave + x scale, spheres, rope tube, k·A ≤ 0,8, axes O/x/u, lane seg, shared red bead; `annotate()` per SPEC §3.1. No graphs.
- [x] Delete `transverse.js`; `git mv longitudinal.js sound.js` (id `sound`); tabs waves, sound, surface, em; aliases `transverse`→`waves`, `longitudinal`→`sound`; default `waves`.
- [x] Check (`--all --paused`): f = 1 Hz, v = 2 m/s → λ = 2 m on both rulers; crowded beads exactly under "Vùng nén".

## Phase 14 – Sóng điện từ  `[x]`  · Sonnet (High)
SPEC §2 table, §3.4. Files: `js/modes/em.js`, `js/state.js`.
- [x] BANDS gamma → vô tuyến, default vô tuyến; rounded 7-segment gradient bar, rainbow segment, short names, "bước sóng tăng →"; tap selects. Delete info card + band chips.
- [x] Arrow depth + faint E/B planes; all words in `annotate()`; chip shows band λ/f range + example.
- [x] Check: 100 MHz → 3 m, 2,45 GHz → 12,2 cm, 5·10¹⁴ Hz → 600 nm, 3·10²⁰ Hz → 1 pm; E and B maxima at the same x.

## Phase 15 – Loa thật + cột không khí đúng  `[x]`  · Sonnet (High)
SPEC §2, §3.2 (Loudspeaker, Air column), §5, §6. Files: `js/modes/sound.js` (speaker + air parts, grep), `js/art/sprite.js`, old `js/art/speaker.js` (delete after).
- [x] `art/speaker.svg`: cabinet + driver cut-away; static cabinet/basket/magnet/plate/pole; `data-move` cone+dust cap, voice coil; anchors: labels, cone rim top/bottom, cone face. Check alone with `--page`.
- [x] Surround + spider = canvas curves static anchor → moving rim. Air column rows = rim height, starts at the cone face (same u(0,t)), nothing behind/around; talker column in front of the lips; k·A ≤ 0,8.
- [x] Paused labels ≤ 4 from anchors. Check: pause at max push – first layer never touches the cone; 440 Hz air → 78,0 cm.
- [x] If after 2 drawing rounds the speaker is not clearly more realistic than before15, keep the physics work, mark `[!] cần Opus cho hình loa`.

## Phase 16 – Nước / Thép đúng bản chất + đầu phát/máy thu  `[x]`  · Sonnet (High)
SPEC §3.2 (Nước, Thép). Files: `js/modes/sound.js` (medium/layout parts), `js/main.js` (hash `med=`), `js/ui.js` (help bullet).
- [x] `art/transducer.svg` (metal housing, piezo, `data-move` face plate), mirrored as receiver/sensor.
- [x] Nước: glass tank + water gradient, transducer immersed left, receiver right, no speaker/ear. Thép: clamped steel bar (metal gradient), grey lattice spheres, transducer + sensor on the end faces. Source chips only in air.
- [x] Check: water 440 Hz → 3,37 m; steel 4 kHz → 1,49 m; `#mode=sound&med=steel` works.

## Phase 17 – Đầu người chân thực + Người nói (mặt cắt dọc)  `[x]`  · **Opus**
SPEC §3.2 (talker), §5, §6. Look at `docs/ref/web/gray994.png`, `docs/ref/web/places-of-articulation.png` (once). Files: talker parts of
`js/modes/sound.js` (grep `talk`), `js/art/sprite.js`. Do NOT read old `js/art/talker.js` (SPEC has the anatomy list); delete it at the end.
- [x] `art/head.svg`: realistic adult side profile (skin shading, hair, ear) – reused by the listener in Phase 18.
- [x] `art/talker.svg` = head + sagittal cut (nasal cavity, palate, tongue, teeth, lips, oral cavity, pharynx, epiglottis, larynx, trachea, vertebrae); vocal folds `data-move`; mouth anchor for the air column. Folds vibrate with u(0,t).
- [x] Paused ≤ 5 labels. Max 2 drawing rounds (look at `--page` shots, not full-app shots, while iterating).

## Phase 18 – Tai người nghe + kính lúp  `[x]`  · **Opus**
SPEC §3.2 (receiver, ear labels), §5, §6. Look at `docs/ref/web/ear-anatomy.png` (once). Files: ear parts of `js/modes/sound.js` (grep `ear`),
`js/art/sprite.js`, `art/head.svg`. Do NOT read old `js/art/ear.js`; delete it and `js/art/figure.js` at the end.
- [x] `art/ear.svg`: magnifier ring + circular coronal cut (skin, temporal bone, pinna, S-canal, eardrum `data-move`, malleus/incus/stapes `data-move` + pivots, cavity, Eustachian tube, cochlea 2,5 turns, 3 canals, vestibule, nerve with pulse anchors); listener = `head.svg` mirrored/scaled.
- [x] Motion from the pressure at the canal; nerve pulses; paused ≤ 7 labels, leaders never cross; phone layout. Max 2 drawing rounds (`--page` shots).

## Phase 19 – Sóng mặt + điện thoại/Zalo + hiệu năng + dọn dẹp  `[x]`  · Sonnet (High)
SPEC §3.3, §6. Files: grep first.
- [x] Surface check (clockwise, no drift, radius at depth λ/2 ≈ 4,3 %), paused annotations complete.
- [x] `tools/shot.mjs --perf` (CDP `Emulation.setCPUThrottlingRate` 4, avg fps 5 s per mode at 390×844); all modes ≥ 50 fps.
- [x] `--all --paused` for 4 modes (open only flagged viewports + desk/phone/paused); dead code/CSS removed (grep `features|badges|hover|#info|metrics`).
- [x] Update `CLAUDE.md` code map + `README.md` (Vietnamese); `version.json` phase "v3"; full deploy check (5 retries). Report: link + 3 lines + what to test in Zalo.

## Phase 20 – Phóng to tai (kính lúp to, nhìn rõ từng bộ phận)  `[x]`  · Sonnet (High)
Owner: the ear cross-section is far too small to tell the parts apart; the listener head matters much less.
SPEC §3.2 (receiver), §6. Files: ear/receiver layout + draw parts of `js/modes/sound.js` (grep `ear`, `head`, `layout`), `js/art/sprite.js` (only if needed), `art/ear.svg` (only if a part looks bad when large).
Before: `node tools/shot.mjs before20 mode=sound --paused --all`.
- [x] Re-balance the stage in air mode: listener head becomes small (≈ 15–20 % of stage height, just a context cue next to the air column end); the magnifier circle becomes the main receiver: diameter ≈ 70–80 % of the stage height on desktop (cap so source + air column keep ≥ 45 % of the width), handle and ring scale with it. Air column still ends at the head's ear canal.
- [x] Rasterise `ear.svg` layers at the new large scale (`scale·dpr`, re-render on resize only) so it stays sharp; moving parts (eardrum, ossicles, nerve pulses) scale with it and stay synced.
- [x] Tap/click on the magnifier toggles **"phóng to"**: the ear cut fills the stage (air column and source hidden, wave keeps driving the eardrum), tap again / Esc / switching mode returns. One small round icon button (magnifier +/−) on the circle so touch users find it; no text while running.
- [x] Paused labels (≤ 7) re-laid out for the big circle: font ≥ 13 px desktop / 12 px phone, leaders outside the circle, never crossing; in "phóng to" all 7 + "Não".
- [x] Phone portrait: magnifier full stage width under the air column; phone landscape: right half of the stage. If a part is unclear at large size (e.g. ossicles, oval window, round window), refine that part in `ear.svg` (≤ 1 round, `--page` shot).
- [x] Check (`--all --paused`): at 1366×768 the circle diameter ≥ 450 px, each ossicle clearly distinguishable; 440 Hz air → λ = 78,0 cm; ≥ 50 fps with `--perf` in sound mode.

## Log
<!-- one line per session: date · phase · what · numbers checked · hash -->
2026-11-18 · P11 · bỏ panel phải/badges/chú thích/toggle, main.js annotate() chỉ khi dừng + chip số liệu, longitudinal+surface tách nhãn · --all --paused OK, λ=78,0 cm @440 Hz không khí, tên trường 1 dòng ở 5 cỡ · (hash ghi ở commit)
2026-11-18 · P12 · ball.js (cầu 3D), nền lưới nhạt + vignette, nước gradient + đường mặt bóng + đáy gradient, pill đổ bóng khi dừng, sprite.js (đã thử tải/xoay layer, chưa dùng) · shot --all longitudinal+surface exit 0, r=4,2px desk / 3,5px phone · (hash ở commit)
2026-11-18 · P13 · art/driver.svg (+ sprite.js: clipY, render trước khi tải), waves.js (dây + lò xo song song, máy rung đứng/nằm, trục O/x/u, k·A≤0,8), longitudinal→sound, bỏ transverse, tab waves/sound/surface/em + alias · shot --all --paused exit 0; f=1 Hz, v=2 m/s → λ=2 m cả hai thước, hạt dồn đúng dưới "Vùng nén"; lane rope/spring/both không lỗi · (hash ở commit)
2026-11-18 · P14 · em.js: BANDS gamma→vô tuyến (mặc định vô tuyến), thanh phổ bo tròn 7 đoạn + gradient + cầu vồng, mũi tên viền tối + mặt phẳng E/B mờ, toàn bộ chữ trong annotate(), chip dòng 2 = dải; bỏ thẻ info + chip dải · shot desk/phone(+paused) exit 0; 100 MHz→3 m, 2,45 GHz→12,2 cm, 5·10¹⁴→600 nm, 3·10²⁰→1 pm · (hash ở commit)
2026-11-18 · P15 · art/speaker.svg (hộp cắt dọc: thùng, khung, nam châm; lớp động: màng+nắp+cuộn dây), gờ treo + spider vẽ canvas co giãn, js/art/speaker.js xoá; cột khí = đúng chiều cao mép màng (rows refit), lớp đầu cách mặt màng 1 dx, cùng u(0,t), k·A≤0,6 · shot --all --paused exit 0 (desk, desk720, phone, phone360, phoneLand), 440 Hz → λ=78,0 cm, nhãn loa 4 · (hash ở commit)
2026-11-18 · P15b · loa mặc định nhìn bên ngoài (art/speaker-out.svg, màng nhô ra dao động theo u(0,t)), nút "Xem bên trong loa" bật mặt cắt (state.inside, #inside=1) · shot desk paused 2 chế độ OK · (hash ở commit)
2026-11-18 · P16 · art/transducer.svg (vỏ kim loại, gốm áp điện, lớp động `face`), bể nước kính + nước gradient / thanh thép kẹp 2 kẹp chữ C trên bàn (nướng sẵn thành canvas, thanh thép cắt theo mặt rung nên không hở), đầu phát trái + máy thu lật gương phải, hạt thép xám + liên kết mạng tinh thể, chip nguồn/“xem bên trong loa” chỉ hiện ở không khí, `#med=water|steel` (main.js), 1 bullet trợ giúp · shot --all --paused exit 0 (nước + thép: desk, desk720, phone, phone360, phoneLand); nước 440 Hz → λ=3,37 m, thép 440 Hz → 13,5 m (4 kHz → 1,49 m = 5960/4000) · (hash ở commit)
2026-11-18 · P17 · art/head.svg (đầu người nhìn nghiêng: da gradient, tóc, tai, mắt) + art/talker.svg (cửa sổ cắt dọc: khoang mũi + xoăn mũi, vòm cứng/mềm, lưỡi, răng, môi, khoang miệng, họng, nắp thanh quản, thanh quản + sụn, khí quản, đốt sống cổ, tuỷ; lớp động `folds` rung theo u(0,t) – sprite.js thêm `sy`), cột khí trước môi cao 108 đv (7 hàng desk, loa 8), nhãn 5 (phone 3); talker.js xoá (đầu cũ chuyển tạm vào ear.js đến P18) · shot --all --paused exit 0, λ=78,0 cm @440 Hz, loa không đổi · (hash ở commit)
2026-11-18 · P18 · art/ear.svg (kính lúp: viền kim loại + cán, mặt cắt đứng ngang: da, mô mỡ, cơ thái dương, não + màng cứng, xương thái dương có vân xương + tế bào chũm, vành tai + dái tai có sụn, ống tai chữ S + lông, màng nhĩ/xương búa/đe/bàn đạp `data-move` + trục, hòm nhĩ, vòi nhĩ, ốc tai 2,5 vòng, 3 ống bán khuyên, tiền đình, dây thần kinh + 4 neo xung), người nghe = head.svg lật gương + vòng chú thích; màng nhĩ theo u tại ống tai, búa–đe quay quanh 1 trục, bàn đạp = đòn bẩy 26/37; nhãn chuyển sang sprite.js + gỡ chéo đường dẫn; xoá ear.js, figure.js · shot --all --paused exit 0, 7 nhãn desk / 5 phone, không đường dẫn cắt, ear.svg 36 KB · (hash ở commit)
2026-11-18 · P19 · sprite.js cắt mỗi lớp SVG theo vùng có nét vẽ (sóng âm trên điện thoại 39→53 fps), shot.mjs --perf, sóng mặt kiểm bằng công thức (thuận chiều kim đồng hồ, không trôi, a(λ/2)=4,32 %), README/CLAUDE.md cập nhật; không còn mã chết (hover CSS chỉ là hiệu ứng, metrics() là giao diện mode) · --all --paused 4 chế độ exit 0, perf (CPU×4, 390×844) waves 58,9 · sound 53,1 · surface 51,9 · em 51,3 fps · (hash ở commit)
2026-11-18 · P20 · kính lúp tai to (đĩa Ø≈485 px ở 1366×768 = 75 % chiều cao sân khấu; đầu người nhỏ ≈ 18 %), ear.svg rasterise ở scale lớn, chạm đĩa / nút tròn kính lúp± / Esc / đổi chế độ = phóng to ↔ thu nhỏ (#zoom=1), nhãn 7 + Não (cột bên hoặc hàng trên/dưới), điện thoại dọc: đĩa dưới cột khí + gợi ý chạm, ngang: nửa phải · shot --all --paused exit 0, 440 Hz → λ=78,0 cm, --perf sound 56 fps · (hash ở commit)
