# TASK – v6: góp ý của thầy (one phase per session; routine = CLAUDE.md "Session routine")
Status: `[ ]` todo · `[~]` in progress (resume) · `[x]` done · `[!]` blocked (note says why). Older phases: `docs/history.md` (do not read).
Read only this header and YOUR phase section. Phase-local rule: touch only what the phase lists.
Lesson from v5: after any CSS change, also open a desk shot of the left panel of 2 modes (shared classes like `.seg`, `.tg`, `.chip` must still look right).

## Phase 1 – Thanh chọn chế độ: 2 nút chính, mục con chỉ hiện khi chọn Sóng cơ  `[ ]`  · Sonnet 5.5 (Medium)
SPEC §4 "Mode nav (v6)". Files: `js/ui.js` (grep `mode tabs|gMech|gEm|sub|setMode`), `css/style.css` (grep `#tabs` – every rule incl. the 3 media blocks), `index.html` only if needed.
- [ ] Markup in ui.js: `#tabs` = column; `.main` row (role=tablist, aria-label "Nhóm sóng") with `#gb-mech` (icon transverse + "Sóng cơ") and `#gb-em` (icon em + "Sóng điện từ"); `.sub` row (role=tablist, aria-label "Các loại sóng cơ") with the 4 mech sub-tabs as a separate row UNDER the main row (not inside a capsule). `tabs.dataset.g` = active group; `.sub` gets `hidden`/display:none when the group is em. Keep lastMech, keys 1–5, `m.short` labels on phones.
- [ ] Style: main buttons uppercase 800, equal width (desktop min-width 190 px), active = red fill `var(--red)` + white text, inactive = card background + red text + 1 px `var(--line)` border, radius 10 px. Sub row = the normal `.seg` look (#ebe7dd track, active ink fill, white text), centred, 6 px below. Sizes per SPEC §4 (desktop / ≤ 820 h / phone portrait / phone landscape). Delete the v5 capsule rules (`#tabs .sub` inside the ink capsule, `#gb-mech` 32 px trick, `.g-s` 2-line label) – no dead CSS.
- [ ] Verify: `shot.mjs after1 "mode=waves" --all`, `shot.mjs after1e "mode=em"`, `shot.mjs after1s "mode=sound"` must exit 0. Open: after1-desk, after1-desk720, after1-phone360, after1-phoneLand, after1e-desk (no sub row, stage taller), after1s-desk (left panel `.seg`/chips intact).
- Log:

## Phase 2 – Sóng âm: bỏ hình người nghe, thanh môn dựng đứng  `[ ]`  · Sonnet 5.5 (High)
SPEC §3.2, §7. Files: `js/modes/sound.js` (grep `iHead|HD\.|HX|CX|callout|tang|earBase|head|FW_|folds|drawDyn`), `img/anchors.json` (listener entry), `img/listener.webp`.
- [ ] Remove the listener head everywhere: `iHead` load + draw, the callout ring + two tangent lines, head-based labels/hints ("two short lines above the head", phone hint beside the head), `HD`/`HX` constants. Delete `img/listener.webp` and its anchors entry once unused. Keep the ear-section disc exactly as now (bezel, ear-base, drum, ossicles, canal spheres, nerve pulses, "phóng to").
- [ ] Re-place the disc: its left edge sits ~10 px right of the end of the outside air column, the column is vertically centred on the canal axis (EAR_AX) so the air visibly flows straight into the canal of the section. `earBase()` = wave x of the canal entrance in the disc (column end + the screen distance to the entrance), so the canal spheres continue the SAME u(x,t) without a jump. Paused: one pill "Tai người nghe (lát cắt)" above the disc (no overlap with the readout chip).
- [ ] Glottis vertical: the warp patch is currently a horizontal slit (rows moved in y). Swap axes: FW_RX = 18, FW_RY = 34 (half sizes), grid FW_NX = 12 columns × FW_NY = 8 rows; COLUMNS are moved in x by m(t) = t + c·sin(πt) (t = −1…1 across the patch width) and c tapers with cos² along y → a vertical slit that opens left–right, edges fixed, same c0 = 0,3·(0,5 + 0,5·v). If `folds` is off-centre on the visible fold pair, fix it in anchors.json (one debug-dot shot, see old v4 rule).
- [ ] Verify: `shot.mjs after2 "mode=sound" --paused`, `shot.mjs after2t "mode=sound&src=talker" --paused`, `shot.mjs after2z "mode=sound&zoom=1"`. Open after2-desk, after2-desk-paused, after2-phone, after2z-desk; for the glottis crop after2t-desk-paused around the folds anchor with PIL (×3) – slit must be vertical. `--perf` sound ≥ 50 fps.
- Log:

## Phase 3 – Sóng dừng: thể hiện phản xạ (quá trình hình thành) + làm chậm hợp lí + kiểm tra cuối  `[ ]`  · Opus 5.5 (Medium)
SPEC §3.5. Files: `js/modes/standing.js` (whole), `js/physics.js` (grep `niceSlow`), `js/main.js` (grep `restart|scopeClear|defaults`), `js/state.js` (stInc).
Physics (x = distance from the driver end in px, ℓ = lpx, K = 2π/λpx, ω = 2πf, c = λpx·f = wave speed in px per simulated s, t = state.t since restart; σ = −1 fixed end, +1 free end):
  u_t(x,t) = (A/2)·sin(ωt − Kx)            if x ≤ c·t, else 0          (incident, →)
  u_r(x,t) = σ·(A/2)·sin(ωt − K(2ℓ − x))   if 2ℓ − x ≤ c·t, else 0     (reflected at x = ℓ, ←)
  u = u_t + u_r (+ the existing tiny driver term e). For resonant ℓ (fixed ℓ = nλ/2, free ℓ = (2n−1)λ/4) this equals −A·cos(ωt)·sin(Kx) once t ≥ 2ℓ/c → nodes/antinodes exactly as now (|sin Kx| = |S|). Use u everywhere (draw, probe, arrows, annotate). The driver shaft follows u(0,t) + e term.
- [ ] Formation: restart (↻, mode enter, change of n / end / v / A) → t = 0 and scopeClear; the wave visibly travels right, reflects (fixed end: flips sign = ngược pha; free end: ring moves with it = cùng pha) and the standing pattern appears when the reflected front reaches the driver. No allocation per frame (preallocated arrays).
- [ ] Toggle "Sóng tới – phản xạ" (default ON, state stInc true): two thin lanes ABOVE the string, same x scale: lane 1 = u_t (orange #e8590c line 2 px + small orange beads every 2nd bead x), lane 2 = u_r (blue #1c7ed6). Each lane: own dashed rest line, centred at cy − amax − gap − …, lane half-height = A/2 drawn; a small arrowhead at each lane's current front (→ / ←) while the front is inside the string. Layout reserves the room (amax recomputed) when stInc is on; if the stage is too short (h < 380), fall back to thin dashed curves over the string. Off → current single-string view.
- [ ] Paused annotations: lane pills "Sóng tới →" / "Sóng phản xạ ←"; at the right end "Phản xạ ở đầu cố định: ngược pha" or "Phản xạ ở đầu tự do: cùng pha"; next to the string "Sóng dừng = sóng tới + sóng phản xạ". Before steady (t < 2ℓ/c): only "Đang hình thành sóng dừng" + the lane pills (no nút/bụng/λ/2). Steady: everything of v5 as now.
- [ ] Slow: replace `defaults: {slow: 0.1}` by a getter `niceSlow(fN(), 1.5)` (capped at 1) and re-apply it whenever stN, stEnd or stv change (target ≈ 1,5 Hz on screen; at defaults f = 7,5 Hz → ×5). Readout line 2 unchanged otherwise.
- [ ] Verify: `shot.mjs after3 "mode=standing" --all --paused`, `shot.mjs after3e "mode=standing&end=free" --paused` exit 0. Open after3-desk, after3-desk-paused, after3-phone-paused, after3-phoneLand, after3e-desk-paused. `node tools/shot.mjs p --perf` ≥ 50 fps all 5 modes. Final: also `shot.mjs final --all` (waves) exit 0. Full deploy check (5 retries).
- Log:

## Log
<!-- one line per session: date · phase · what · numbers checked · hash -->
