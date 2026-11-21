# TASK – v4: ảnh minh hoạ thật (one phase per session; routine = CLAUDE.md "Session routine")
Status: `[ ]` todo · `[~]` in progress (resume) · `[x]` done · `[!]` blocked (note says why). Older phases: `docs/history.md` (do not read).
Read only this header and YOUR phase section. Phase-local rule: touch only what the phase lists.
**Art is already prepared** in `img/` (WebP with alpha, cut out, measured): do NOT open the PNG sources, do NOT re-cut images.
All positions are in `img/anchors.json` (image pixels of each WebP). First thing in a phase that uses it: add a temporary debug
draw of the anchors it needs (small red dots), take ONE screenshot, fix any anchor off by > 6 px directly in the JSON, remove the debug draw.

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

## Phase 3 – Vịt cao su + zoom bằng lăn chuột + màn đo nhỏ bên trái  `[ ]`  · Sonnet (Medium)
SPEC §3.3 (duck), §4 (Left panel v4, Zoom v4). Files: `js/main.js`, `js/ui.js`, `css/style.css` (left column), `js/modes/surface.js` (grep `phao|buoy|float`), each mode's red-particle code (grep `track`).
- [ ] `art/duck.svg` (small cute yellow rubber duck, shaded, orange beak) replaces the phao: follows the top particle's orbit, tilts with the slope.
- [ ] Zoom in `main.js` (wheel + pinch 1–4×, drag pan, double-click / "1:1" resets, mode switch resets); EM band tap and magnifier tap still hit correctly.
- [ ] Controls card shrinks to content; "Phần tử đỏ" mini-scope card below (`probe()` per mode, ring buffer, no per-frame allocation); hidden on phones.
- [ ] Check `--all --paused` 4 modes; ≥ 50 fps `--perf`. Then final light cleanup of dead code (grep only).

## Log
<!-- one line per session: date · phase · what · numbers checked · hash -->
