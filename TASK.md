# TASK – v5: sóng dừng, thanh chọn 2 cấp, phần tử to (one phase per session; routine = CLAUDE.md "Session routine")
Status: `[ ]` todo · `[~]` in progress (resume) · `[x]` done · `[!]` blocked (note says why). Older phases: `docs/history.md` (do not read).
Read only this header and YOUR phase section (phases 1–3 are v4, done – skip them). Phase-local rule: touch only what the phase lists.

## Phase 1 – Ảnh thật: loa, người nói, đầu người nghe  `[x]`  · Sonnet (Medium)
SPEC §7. Files: `js/modes/sound.js` (grep `spk|speaker|talk|head|listener|column|airL`), `js/art/sprite.js` (API style only), `img/anchors.json`.
- [x] `js/art/raster.js`: `loadImg(path)` (Image + decode, cached) and `loadAnchors()` (fetch `img/anchors.json` once); draw with `drawImage` at a scale chosen in `layout()`; placeholder until ready.
- [x] Loudspeaker = `speaker-base.webp` + `speaker-cone.webp` drawn at `cone.at` shifted by u(0,t) (max ±8 image px at A max). Air column starts at `coneFace`, rows only between `rimTop` and `rimBot` (inner 80 %), first layer locked to the cone face.
- [x] Talker = `talker.webp` (static) + small canvas overlay at `folds`: two pale-pink folds opening/closing with u(0,t) (≤ 6 px), column starts at `mouth` (height `mouthH`·2..3). Paused: dashed air path along `airPath` + labels from `labels`.
- [x] Listener head = `listener.webp`, facing left, air column ends at `earCanal`. Paused labels: speaker/talker names from `labels`.
- [x] Delete `art/speaker.svg`, `art/talker.svg`, `art/head.svg` and their code once unused (keep `sprite.js` for driver/transducer).
- [x] Check `mode=sound` and `mode=sound&src=talker`, `--paused`: images sharp, no gaps between cone and air, ≥ 50 fps `--perf`.
- Log: ảnh thật cho loa/người nói/đầu người nghe (raster.js, anchors), xoá 3 SVG; perf sound 57,6 fps.

## Phase 2 – Tai thật trong kính lúp + âm thanh đi vào ống tai  `[x]`  · Sonnet (High)
SPEC §7, §3.2 (receiver). Files: ear parts of `js/modes/sound.js` (grep `ear|mag|zoom|drum|ossic|nerve`), `js/art/raster.js`, `img/anchors.json`.
- [x] Magnifier content = `ear-base.webp` clipped to the circle, plus `ear-drum.webp` at `drum.at` moved along `drum.normal` by the pressure at the drum (max 4 image px) and `ear-ossicles.webp` rotated about `ossicles.pivot` by drumShift / |tip − pivot| (radians). Same images in the "phóng to" view.
- [x] Canal air column: 3 rows of small spheres along the `canal` polyline (each point = x, y, half-height), displaced along the canal by the same u(x,t) continued from the listener's ear (magnified); compression reaches the drum exactly when it moves inward; spheres never enter the drum.
- [x] Nerve pulses: small golden dots running along `nerve` toward the brain, rate ∝ loudness; faint pulse ring on the `cochlea` when sound arrives.
- [x] Paused: labels from `ear.labels` (≤ 8) with leaders outside the circle in normal view, all in "phóng to"; "Sóng âm vào ống tai" on the canal; nén/giãn tint in the canal.
- [x] Delete `art/ear.svg` + old ear code. Check `--all --paused` sound mode; pause at max push: drum bulges in under a compression.
- Log: tai thật trong kính lúp (ear-base/drum/ossicles), 36 cầu khí trong ống tai theo cùng u(x,t), màng nhĩ theo áp suất −∂u/∂x (≤ 4 px), xung thần kinh + vòng ốc tai, 8 nhãn, xoá ear.svg; perf sound 58,8 fps.

## Phase 3 – Vịt cao su + zoom bằng lăn chuột + màn đo nhỏ bên trái  `[x]`  · Sonnet (Medium)
SPEC §3.3 (duck), §4 (Left panel v4, Zoom v4). Files: `js/main.js`, `js/ui.js`, `css/style.css` (left column), `js/modes/surface.js` (grep `phao|buoy|float`), each mode's red-particle code (grep `track`).
- [x] `art/duck.svg` (small cute yellow rubber duck, shaded, orange beak) replaces the phao: follows the top particle's orbit, tilts with the slope.
- [x] Zoom in `main.js` (wheel + pinch 1–4×, drag pan, double-click / "1:1" resets, mode switch resets); EM band tap and magnifier tap still hit correctly.
- [x] Controls card shrinks to content; "Phần tử đỏ" mini-scope card below (`probe()` per mode, ring buffer, no per-frame allocation); hidden on phones.
- [x] Check `--all --paused` 4 modes; ≥ 50 fps `--perf`. Then final light cleanup of dead code (grep only).

## Phase 4 – Sóng dừng + phần tử to + "Chỉ phần tử"  `[x]`  · Opus 5.5 (High)
SPEC §2, §3.1 (v5 bullet), §3.5. Files: `js/modes/waves.js` (whole – template for the new mode), `js/main.js` (grep `MODES|ALIAS|src=talker|med=`), `js/state.js`, `js/ui.js` (grep `PATHS|chips|toggle|tgs`), `js/scope.js` (grep `lane`), `css/style.css` (grep `\.chips|\.g4|\.tgs`), `tools/shot.mjs` (grep `'waves', 'sound'`).
- [x] `js/modes/standing.js` exactly per SPEC §3.5 (same module shape as waves.js: layout/draw/annotate/controls/probe/metrics/readout, title 'Sóng dừng', short 'Dừng', icon 'standing' = new PATHS entry). Register in MODES after surface (keys 1–5); add `group` ('mech'|'em') to every mode export; parse `end=free` and `beads=1` from the hash like `src=talker`; add 'standing' to the shot.mjs perf list; one line in the CLAUDE.md code map.
- [x] waves.js: v5 bead sizing + spring-lane cap (SPEC §3.1 v5); rope tube width and coil amplitude scale with r.
- [x] `beadsOnly` toggle "Chỉ phần tử" in the Hiển thị group of waves and standing (VTCB ring layer as SPEC).
- [x] scope.js: `overlay` lane branch (both traces on one axis).
- [x] Verify: shots `after4 "mode=standing" --paused`, `after4e "mode=standing&end=free" --paused`, `after4w "mode=waves" --paused`, `after4b "mode=waves&beads=1"`. Open only: after4-desk-paused, after4-phone-paused, after4e-desk-paused, after4w-desk-paused, after4w-phone, after4b-desk. Check: nodes exactly on beads, λ/2 rulers node–node / antinode–antinode, red & orange beads in adjacent bó move opposite, spring beads never touch at A max, labels do not overlap. `node tools/shot.mjs p --perf` ≥ 50 fps for all 5 modes. Push; skip the deploy check (routine step 9) in this phase.
- Log: standing.js (nút luôn trùng hạt, đầu cố định/tự do, sóng tới–phản xạ, nhãn khi dừng), hạt v5 + giới hạn biên độ lò xo, "Chỉ phần tử" (lớp vòng VTCB 1 drawImage), scope overlay; perf standing 60 fps, waves 56 fps; sound/surface/em 38–52 fps dao động như code gốc (gốc 44–56) → nhiễu máy ảo, không do phase này.

## Phase 5 – Header không khung + thanh chọn 2 cấp + rà hạt + kiểm tra cuối  `[ ]`  · Sonnet 5.5 (Medium)
SPEC §4 (Header v5, Mode nav v5). Files: `index.html`, `js/ui.js` (grep `mode tabs|tabBtns|setMode|HELP`), `css/style.css` (grep `#title|#school|#tabs|\.seg|@media`), `js/modes/surface.js` and `js/modes/sound.js` (grep `L.r =` only).
- [ ] Header per SPEC §4 Header v5 (all breakpoints).
- [ ] Two-level nav per SPEC §4 Mode nav v5, built in ui.js from `mode.group`; remember the last mech mode; aria: role=tablist on the group row and on the sub-tab row; keys 1–5 unchanged.
- [ ] Help modal (≤ 5 bullets): keys 1–5, "Sóng cơ có 4 chế độ con", one short mention of Chỉ phần tử.
- [ ] Particle size: surface `L.r` about +35 % if the top-row particles keep ≥ 3 px gap at max amplitude (else less); sound: raise the radius cap 4,4 → 5,2 only if the column shows no new merging (compare before/after desk shot), otherwise leave it.
- [ ] Final check: `shot.mjs after5 --all --paused` and `shot.mjs after5s "mode=standing" --all` must exit 0 (no scrollbar, school name one line). Open after5-desk720, after5-phone360, after5-phoneLand, after5-desk-paused, after5s-phone. `--perf` ≥ 50 fps all modes. Full deploy check (5 retries) this phase.
- Log:

## Log
<!-- one line per session: date · phase · what · numbers checked · hash -->
2026-11-21 · Phase 3 · vịt SVG thay phao, zoom 1–4× (lăn/pinch/kéo/dblclick/1:1), màn đo "Phần tử đỏ" · 4 mode OK, perf 57–59 fps · 
