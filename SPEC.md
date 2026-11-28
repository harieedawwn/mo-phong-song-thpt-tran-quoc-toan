# SPEC v3 – Thí nghiệm mô phỏng sóng (2D, có chiều sâu)

Audience: Vietnamese grade-11 students and teachers (THPT Trần Quốc Toản, Đồng Tháp). Used on a classroom projector
(1366×768 / 1280×720), on phones and inside the **Zalo in-app browser**. The teacher explains the theory; the app only
**shows** the phenomenon. v3 goal (owner feedback on v2: "giao diện rối, nhiều chữ thừa, hình quá phẳng, vài chỗ sai bản chất"):
**big clean stage, no text while the wave runs, everything explained only when paused, objects with real depth.**

## 1. Principles (apply to every mode)
1. **Stage first.** Only two columns: controls (left) + stage (centre/right). No right panel, no metric cards, no "Đặc điểm" card,
   no formula chip, no badge row, no legend or explanatory sentences under the stage, no tap-to-caption texts.
2. **Running = no text on the stage.** While playing, the stage shows only physical objects: source, medium particles, the red tracked
   particle, axes (thin lines + the letters O, x, u only). No labels, no λ ruler, no arrows with words.
3. **Paused = analysis view.** Pressing **Tạm dừng** freezes the frame and fades in (0,25 s) all annotations of the mode (§3):
   labels (Đỉnh sóng, Hõm sóng, Vùng nén, Vùng giãn, part names…), λ ruler with the **real** value, VTCB ticks, "Phương truyền sóng" /
   "Phương dao động" arrows, and one **readout chip** (top-left of the stage): `f = 440 Hz · T = 2,27 ms · λ = 78,0 cm · v = 343 m/s`
   plus one muted second line `Hình đã làm chậm ×200 · biên độ phóng đại` (only the parts that apply). Pressing **Phát** hides them at once.
   Changing a slider while paused redraws the frozen frame with updated annotations.
4. **Depth, not flatness.** Gradients are allowed again (v2's "no gradient" rule is cancelled). Particles are glossy 3D-looking spheres,
   devices and anatomy are layered SVG with light/shade (§5). Still light enough for a cheap Android phone and Zalo.
5. **Physics is never faked** (§2). If an option cannot be shown correctly, redesign it or remove it.

## 2. Physics (Vật lí 11 KNTT, Chương II "Sóng")
Vocabulary: *phần tử môi trường, vị trí cân bằng (VTCB), li độ u, biên độ A, chu kì T, tần số f, bước sóng λ, tốc độ truyền sóng v,
phương dao động, phương truyền sóng, vùng nén, vùng giãn, đỉnh sóng, hõm sóng*. Relations: **λ = v·T = v/f, f = 1/T**.
- Progressive wave from the source at x = 0, started at t = 0: u(x,t) = A·sin(ωt − kx) for x ≤ v·t, u = 0 beyond the front
  (`makeWave()` in `js/physics.js` – keep it). Particles only oscillate around their VTCB; energy travels, matter does not.
- **Sóng ngang:** u ⟂ Ox (rope beads move only vertically). **Sóng dọc:** u along Ox (each layer/bead at rest position x is drawn at
  x + u(x,t)). Compression ∝ −∂u/∂x: **vùng nén** where cos(ωt − kx) > 0 (`wave.s(x) > 0`), **vùng giãn** where < 0 – annotations must use
  this same formula so they sit exactly where the particles are crowded.
- **No crossing:** keep k·A_px ≤ 0,8 in every longitudinal drawing (strain < 1), so layers never pass each other and the first layer
  never enters the source.
- Sound speeds (m/s): không khí 343, nước 1482, thép 5960. Hearing 20 Hz – 20 kHz (hạ âm < 20 Hz, siêu âm > 20 kHz).
- **Sóng mặt** (keep v2 physics): Airy theory, ξ = −a(d)·sin(kx₀ − ωt), ζ = b(d)·cos(kx₀ − ωt); deep: a = b = A·e^(−kd) (circles);
  shallow: a = A·cosh(k(h−d))/sinh(kh), b = A·sinh(k(h−d))/sinh(kh) (ellipses → line at the bottom). Clockwise for a wave moving right;
  no drift; surface line drawn through the top-row particles.
- **Sóng điện từ:** E and B in phase, E ⟂ B ⟂ phương truyền → sóng ngang, c = 3·10⁸ m/s, λ = c/f. Spectrum = Bảng 11.1 SGK KNTT,
  shown **short λ → long λ, left to right** (the usual chart order):

  | # | Loại bức xạ | Bước sóng (chân không) | Tần số (Hz) | Example (pause chip) |
  |---|---|---|---|---|
  | 0 | Tia gamma | 10⁻⁵ nm – 0,1 nm | 3·10¹⁸ – 3·10²² | Phóng xạ (3·10²⁰ Hz → 1 pm) |
  | 1 | Tia X | 30 pm – 3 nm | 10¹⁷ – 10¹⁹ | Chụp X-quang |
  | 2 | Tia tử ngoại | 10 nm – 400 nm | 7,5·10¹⁴ – 3·10¹⁶ | Mặt Trời, đèn diệt khuẩn |
  | 3 | Ánh sáng nhìn thấy | 0,38 µm – 0,76 µm | 3,9·10¹⁴ – 7,9·10¹⁴ | 5·10¹⁴ Hz → 600 nm |
  | 4 | Tia hồng ngoại | 0,76 µm – 1 mm | 3·10¹¹ – 3,9·10¹⁴ | Điều khiển TV, thân nhiệt |
  | 5 | Sóng vi ba | 1 mm – 1 m | 3·10⁸ – 3·10¹¹ | Lò vi sóng 2,45 GHz → 12,2 cm |
  | 6 | Sóng vô tuyến | 1 m – 100 km | 3·10³ – 3·10⁸ | Đài FM 100 MHz → 3 m (default band) |
- Honesty: animations are slowed and amplitudes enlarged → said once, on the pause chip line 2. Readouts always show **real** values.

## 3. Modes (5, two-level nav)
| id (`#mode=`) | Tab (desktop / phone) | Old ids kept as aliases |
|---|---|---|
| `waves` (default) | Sóng ngang – Sóng dọc / Ngang – Dọc | `transverse` |
| `sound` | Sóng âm / Sóng âm | `longitudinal` |
| `surface` | Sóng mặt / Sóng mặt | – |
| `standing` | Sóng dừng / Dừng | – |
| `em` | Sóng điện từ / Điện từ | – |
Keys 1–5 select modes (waves, sound, surface, standing, em). `#mode=standing&end=free` selects the free end; `&beads=1` turns on Chỉ phần tử (checker links). `#mode=sound&src=talker` and `&med=water|steel` select source/medium (checker + teacher links).

### 3.1 `waves` – Sóng ngang và sóng dọc song song
Two lanes stacked, **same f, A, v, t and the same x scale**, so λ and the propagation are visibly identical and only the
direction of oscillation differs. Seg control "Cả hai | Sóng ngang | Sóng dọc" (default Cả hai; one lane alone uses the whole height).
- **Top lane – sóng ngang trên dây:** ~36–44 bead spheres on a rope (rope = shaded tube through the beads). Left end clamped to the
  top of the **máy rung** drive shaft (like a lab wave driver: dark box with a vertical shaft; the body stays still, only the shaft moves
  up/down by u(0,t) and drags the rope end). Axes: Ox along the rest line (arrow + "x" at the right, "O" at the clamp), vertical u axis at O
  (short double arrow + "u") so up/down displacement is obvious. Rope ends at the stage edge (no reflection).
- **Bottom lane – sóng dọc trên lò xo:** the same number of bead spheres at the same rest x, joined by thin **coil springs** (zigzag, drawn
  cheaply), driven by the **same máy rung lying on its side** (shaft moves left/right by u(0,t), pushing the first bead). Axis Ox along the
  chain, "u" shown as a horizontal double arrow at O.
- The same bead index is the red tracked particle in both lanes.
- **Paused:** top – Đỉnh sóng / Hõm sóng pills, VTCB dashed line, ↕ "Phương dao động"; bottom – Vùng nén / Vùng giãn pills + soft
  orange/blue tinted bands behind those zones, ↔ "Phương dao động"; one shared "Phương truyền sóng →" arrow; λ rulers on both lanes
  aligned (same length) with the real value; a thin vertical dashed guide through the two red beads; readout chip.
- **No graphs** (the old u–x and u–t graphs are deleted).
- Controls: f (0,2 – 5 Hz, log slider + chips 0,5/1/2/4), A, v (0,5 – 4 m/s), làm chậm, lane seg, toggle "Phần tử đỏ".
- **v5 – bigger beads:** spacing target dxT = 28 px desk / 17 px phone (N = clamp(round(ropeW/dxT), 18, 40)), bead r = clamp(0,25·dx, 4,4, 8,5), red bead r + 2; rope tube width and coil zigzag amplitude scale with r. The rope keeps the slider amplitude; the spring lane may draw a smaller one: k·A_spring ≤ min(0,8; 1 − (2r+3)/dx) so neighbouring beads never touch (this replaces "same drawn amplitude in both lanes"). Toggle **Chỉ phần tử** (state `beadsOnly`, shared with `standing`): hides the rope tube and the coil springs; each bead gets a faint grey VTCB ring at its rest position (all rings pre-rendered once per layout into one offscreen canvas → one drawImage per frame). Driver unchanged.

### 3.2 `sound` – Sóng âm
Layout left → right: source · medium · receiver. Medium seg **Không khí | Nước** (v4: Thép removed by the owner; physically honest scenes):
- **Không khí:** source chips **Loa | Người nói**; receiver = the ear cross-section disc only (v6: **no listener head / no person** in front of it, no callout ring/tangents); the air column runs straight into the canal shown in the disc.
- **Nước:** the scene becomes a **bể nước** (glass tank, water with depth gradient). Source = **đầu phát âm dưới nước** (piezo
  transducer, `art/transducer.svg`) immersed and touching the water; receiver = **máy thu âm dưới nước** (the same SVG mirrored).
  Particles = water (blue spheres). No loudspeaker, no ear in this scene.
- Air vs water must look **different and honest**: the same px-per-metre for both media, so at the same f the water λ is 4,32× longer
  and the wave front runs 4,32× faster on screen (clamp only if λ < 14 px; then say so on the pause line 2).
- Help bullet: a loudspeaker in air cannot push sound into water well, so water uses an underwater transducer in contact with it.
- **Transducer (v4 fix):** the moving part is a **membrane flush with the housing front** (flexes/bulges a few px, like a drum skin),
  never a separate bar sliding in and out in front of the device.
- **Air column (fixes v2):** particles exist only in the column directly in front of the cone mouth: rows span the cone rim height,
  columns from the cone face to the receiver. No particles behind or around the speaker. The first layer's rest position is the cone
  face's rest position, and the cone uses the same u(0,t), so they move together and never overlap. Same rule for the talker (column
  in front of the lips, a bit narrower) and the transducer face.
- **Loudspeaker (v4):** only the cut-away view exists (the closed-cabinet "outside" view `speaker-out.svg` and its toggle are deleted). Cabinet drawn in section (wall thickness, rounded wood/black finish, front baffle) + driver in side cut-away. **Static:** cabinet, frame/basket (khung loa),
  magnet, top plate, pole piece. **Moving (translate x by u(0,t)):** cone (màng loa) + dust cap + voice coil (cuộn dây). The surround (gờ
  treo) and spider are short canvas curves connecting the static frame to the moving cone rim, so they stretch instead of sliding.
- Particles: uniform blue spheres while running (crowding alone shows the wave); paused → tinted nén/giãn bands + labels.
- **Sound enters the ear (v4):** inside the magnifier, the ear canal holds its own small air column (2–4 rows of spheres from the canal
  entrance to the eardrum) moved by the **same u(x,t)** continued from the outside column (x of the head's canal entrance → eardrum,
  magnified), so compressions are seen travelling down the canal and hitting the eardrum exactly when it bulges in.
- Receiver motion: eardrum bulges with the arriving pressure, ossicles rock, nerve pulses run toward "Não" (pulses also while running –
  they are not text). Sensor: a small cone/needle moves with the arriving u.
- **Paused:** Vùng nén / Vùng giãn, λ ruler, red particle VTCB tick + ↔, part names (≤ 4 speaker: Màng loa, Cuộn dây, Nam châm, Khung loa;
  ≤ 5 talker: Dây thanh âm, Họng, Khoang miệng, Khoang mũi, Lưỡi; ≤ 7 ear: Vành tai, Ống tai, Màng nhĩ, Xương búa – đe – bàn đạp, Ốc tai,
  Ống bán khuyên, Dây thần kinh thính giác; water: Đầu phát, Máy thu), de-collided leaders, readout chip
  (adds "Âm trung · tai nghe được" / "Siêu âm · tai không nghe được").
- Controls: môi trường, nguồn (only in air), f (tone only – "Giọng nói" removed in v4) (log 10 Hz – 40 kHz + chips 100/262/440/1k/4k), độ to (dB),
  làm chậm, toggle "Phần tử đỏ". Sound is **muted by default**; AudioContext starts on the first tap.

### 3.3 `surface` – Sóng mặt
v2 behaviour kept (grid of ~30×10 particles, a small cute **rubber duck** (`art/duck.svg`, v4) instead of the phao, 2–3 red tracked particles with orbit outlines, Nước sâu | Nước nông).
v3: spheres, water filled with a vertical gradient (light at the surface → deep blue), glossy surface line, sand bed with gradient
in shallow mode. Orbit outlines are **dashed** red lines (v4) and may stay while running (they are geometry, not text). **Paused:** Đỉnh/Hõm sóng, λ ruler,
"Phương truyền sóng →", "Quỹ đạo tròn = dao động dọc + dao động ngang" (one pill), "Càng sâu dao động càng yếu", Vịt (phần tử mặt nước), readout chip.

### 3.4 `em` – Sóng điện từ
- Oblique view as v2 (E vertical, orange; B along z at 30°, blue; in phase), arrows with depth (darker outline, slightly thicker),
  optional very faint tinted E-plane and B-plane quads for 3D reading.
- **Spectrum bar** at the bottom: one rounded bar of 7 segments ordered as §2 (gamma left → vô tuyến right), arrow under it
  "bước sóng tăng →" and "← tần số tăng". Each segment has a soft vertical gradient; visible light is a real rainbow gradient (tím → đỏ,
  left → right, matching λ increasing). Short names under the segments (Gamma, Tia X, Tử ngoại, Nhìn thấy, Hồng ngoại, Vi ba, Vô tuyến).
  Tapping a segment selects it (raised + red outline). **No info card under the bar** and no band chips in the left panel.
- Paused: "E", "B", "Phương truyền sóng (v = c)", "E ⟂ B ⟂ v → sóng ngang", "Cùng pha" marker, λ ruler, readout chip with the selected
  band's real λ range, f range and example.
- Controls: làm chậm, toggles Điện trường E / Từ trường B / Mũi tên.

### 3.5 `standing` – Sóng dừng trên dây (v5)
Physics (KNTT, bài Sóng dừng). String length ℓ = 1,20 m (real), X = ℓ − x = distance from the reflecting (right) end, K = 2π/λ, λ = v/f.
- Hai đầu cố định: ℓ = k·λ/2 (k = số bó = số bụng n); u = A·sin(KX)·cos(ωt); f_n = n·v/(2ℓ).
- Một đầu tự do (right end = ring sliding on a smooth vertical rod): ℓ = (2k+1)·λ/4 with k = n − 1 (n = số bụng); u = A·cos(KX)·sin(ωt); f_n = (2n−1)·v/(4ℓ).
- Only resonant states (n = 1…6) are offered. **v6 – formation by reflection:** after every restart / change of n, end or v the incident wave starts at the driver, reflects at the right end and comes back; u = u_t + u_r (formulas in TASK Phase 3) equals the steady standing wave exactly once t ≥ 2ℓ/v.
- Left end: the same máy rung as `waves`, upright; its shaft moves with tiny amplitude e = min(2 px, 0,05·A_px) and the string uses u + e·(X/ℓ)·(same time factor) → the driver end is ≈ a node.
- Nodes every λ/2, antinodes halfway (node–antinode λ/4); amplitude at X = A·|sin KX| (fixed) or A·|cos KX| (free); all points of one bó (between two adjacent nodes) oscillate in phase, adjacent bó in antiphase.
- Incident + reflected (toggle **Sóng tới – phản xạ**, v6 default ON): drawn as two thin separate lanes above the string (not over it). Fixed end: reflected wave ngược pha at the end; free end: cùng pha.
Stage: one string, vertically centred, axes O, x, u like the rope lane. Beads: fixed → m = max(2, round(ℓpx/n/dxT)) per bó, N = n·m + 1; free → m = max(1, round(ℓpx/(2n−1)/dxT)) per quarter-λ, N = (2n−1)·m + 1 → every node falls exactly on a bead. dxT as §3.1 v5, r = clamp(0,27·dx, 4,4, 8,5). Arrays preallocated at max N (no per-frame allocation). Right end: fixed = steel clamp post (canvas, cached gradient); free = vertical rod + ring carrying the last bead.
Running (no text): string tube + beads (or beads + VTCB rings when Chỉ phần tử), red bead at the first antinode from the left, orange bead at the next antinode (n ≥ 2; for fixed n = 1 only the red). Toggle on → incident (orange, →) and reflected (blue, ←) lanes above the string.
Paused: dashed envelope ±A·|S(X)|; pills "Nút sóng"/"Nút" at nodes and "Bụng sóng"/"Bụng" at antinodes (tag() overlap rule of waves.js); λ/2 ruler between two adjacent nodes (below) and between two adjacent antinodes (above), real values ("λ/2 = 40,0 cm"); small arrows on beads whose envelope > 0,4·A showing their velocity direction (same in one bó, opposite in neighbours); one "Cùng pha" pill under one bó and one "Ngược pha" pill between the red and orange beads; "Đầu gắn cần rung ≈ nút"; free end: "Đầu tự do = bụng". Chip line 2 (readout()): "ℓ = 1,20 m = 3·λ/2 · hai đầu cố định" or "ℓ = 1,20 m = 5·λ/4 · một đầu tự do", plus the slow/amplitude note.
Controls: group "Sóng dừng trên dây": seg Đầu dây (Hai đầu cố định | Một đầu tự do); chips "Số bụng sóng" 1–6 (label value shows f, e.g. "n = 3 · f = 7,5 Hz"); Biên độ bụng A (cm); Tốc độ truyền v (2–12 m/s, default 6); Làm chậm (v6: auto slow = niceSlow(f, 1,5); slider range ×1 … ×20 → about 1,5 Hz on screen, re-applied when n, end or v changes). Group "Hiển thị": toggles Phần tử đỏ, Chỉ phần tử, Sóng tới – phản xạ (default on). State keys: stN 3, stEnd 'fixed', stA, stv 6, stInc true, beadsOnly false.
Mini-scope: probe() returns lane 'overlay' → red bead (red) and orange bead (orange) on ONE axis, showing antiphase (scope.js gets an `overlay` branch).

## 4. Layout & UI
- **Header (v5):** no boxes – `#title` and `#school` have no background, border, red left bar, radius, shadow or box padding (desktop and phones; the phone red underline is removed too). Text stays red uppercase 800, title may grow 1–2 px; school name always one line (nowrap + clamp). Left: icon toolbar unchanged.
- **Mode nav (v6, two levels, two rows):** row 1 = exactly two main buttons **SÓNG CƠ** | **SÓNG ĐIỆN TỪ** (equal width, centred under the title). Row 2 = the 4 sub-tabs of Sóng cơ (Sóng ngang – Sóng dọc · Sóng âm · Sóng mặt · Sóng dừng), shown **only while Sóng cơ is active** (EM active → row 2 is not rendered and the stage gets the height). Clicking SÓNG CƠ from EM returns to the last mech mode (default waves). Modes carry `group: 'mech' | 'em'`. Sizes: desktop main 34 px (30 when height ≤ 820), sub 30 px (28); phone portrait main 36 px + sub 42 px (icon + short label); phone landscape main 28 px + sub 32 px. No scrollbar at any checker size.
- **Desktop grid:** `top` row, then tabs, then `ctrl | stage`. Columns `var(--ctrl-w) minmax(0,1fr)` – the old `#info` column is
  removed and the stage takes all the width. Bottom-centre of the stage: restart icon button, big red **Phát / Tạm dừng** pill (the speed chip is deleted in v4; speed lives on the slider).
- **Phones (< 1000 px or height ≤ 520 px):** title, school line, 4 icon tabs, stage, bottom dock (2 groups max: "Sóng", "Hiển thị").
  No metrics row.
- **No scrollbar anywhere** (page, panels) on all checker viewports: `html,body{overflow:hidden}`, `#app` 100dvh (100vh fallback),
  safe-area padding. The checker fails on any page scroll or wrapped/overflowing school name.
- Help modal ≤ 5 short bullets (how to play/pause, pause shows labels, sliders, keys, the water note, zoom).
- Controls style kept: `.brk` corners, `.seg` (active black), `.chip` (active red), `.tg`, red-filled sliders. Toggle labels one line.

- **Left panel (v6):** controls card only – the "Phần tử đỏ" mini-scope was removed at the teacher's request (old text kept for history): live li độ u of
  the red particle vs time (waves: both lanes, ngang = orange, dọc = blue; sound: pressure at the eardrum; surface: the red top particle's
  orbit trace ξ–ζ; em: E and B at one point). Canvas, only axis letters while running; paused → value ticks (A, T) appear. Hidden on phones.
- **Zoom (v4):** mouse wheel (and pinch on touch) zooms the stage content 1×–4× around the pointer, drag pans when zoomed, double-click /
  a small "1:1" button resets; mode switch resets. Implemented once in `main.js` as a canvas transform; pointer hits use the inverse transform.

## 5. Visual system v3
- **Stage background:** warm paper `#fbfaf6`, faint graph grid (minor `#efebe2`, major every 5 cells `#e4ddcf`) plus a very soft radial
  vignette – all baked once into the cached grid canvas.
- **Spheres (`js/draw/ball.js`):** one offscreen sprite per (colour, radius, dpr), built with a radial gradient whose centre is offset
  to the upper-left (≈ −0,35r, −0,4r): lighter tint → base colour → darker rim, a small white specular dot (α ≈ 0,85), a thin darker rim
  stroke for projector contrast and a baked soft contact shadow below-right. Per frame: `drawImage` only.
  Colours: medium particle blue `#1c7ed6` (bright, high contrast), steel atoms `#868e96`, tracked particle red `#e03131`, rope beads
  `#1971c2`. Radius ≥ 4 px desktop, ≥ 3,5 px phone.
- **Rope / springs:** tube = 3 strokes (dark core, mid tone, thin highlight offset −1 px). Springs: zigzag 1,5 px graphite.
- **Annotations:** white pills with 1 px border and a soft shadow (shadowBlur is fine – annotations are drawn only on paused frames),
  data colours nén / E `#e8590c`, giãn / B `#1c7ed6`, ink `#15181d`, muted `#5d6470`, UI red `#d7191f`.
- **Devices & anatomy = layered SVG files in `art/`** (see §6), drawn with linear/radial gradients for form (metal, plastic, skin, bone,
  mucosa), soft inner shading, thin darker outlines, consistent light from the upper-left. Style target: clean textbook / medical
  illustration, calm and realistic, not cartoon. Palette anchors: skin `#f1c4a8`→`#d99a7c`, mucosa `#e98f93`, bone `#f4ecd8`,
  cochlea/canals `#9775fa`, nerve `#fcc419`, metal `#adb5bd`→`#495057`, speaker cone `#3b3f45`, magnet `#212529`.
  References in `docs/ref/web/` (ear-anatomy.png, gray994.png, places-of-articulation.png) and `docs/ref/ear-voice-reference.png`:
  look at them for proportions; draw your own paths.
- Still forbidden: neon colours, glow/bloom halos, CSS `filter`/`backdrop-filter`, `shadowBlur` inside per-frame loops, WebGL, libraries,
  network fonts. Fonts: Be Vietnam Pro (UI), JetBrains Mono (numbers), already in `fonts/`.

## 6. Engineering
- Static site, ES modules, no build, no libraries, relative URLs. One `requestAnimationFrame` loop; pause when `document.hidden`;
  DPR cap 2 (1,5 on phones).
- **Mode interface:** `{id, title, short, icon, defaults, controls(), metrics() → {f, v}, readout() → [line1, line2], layout(w,h),
  update(dt), draw(ctx), annotate(ctx), reset?(), pointer?(x,y)}`. `main.js` calls `draw` every frame and `annotate` only when
  paused, with `fx.a` ramping 0 → 1 over 0,25 s. Delete `features()`, `badges()`, `hover()`, `escape()` and the label/ruler/track
  state toggles except `track` ("Phần tử đỏ").
- **`js/draw/ball.js`:** `ball(color, r)` → cached sprite `{c, s}` (canvas + half size, device pixels); `drawBall(ctx, sp, x, y)`;
  cache cleared on resize. Batch: one sprite lookup per colour, then a loop of `drawImage`.
- **`js/art/sprite.js` – SVG layer loader (the art pipeline):** `loadArt(name)` fetches `art/<name>.svg` once (text). Every top-level
  `<g id="…" data-move>` becomes its own layer; everything else is the static layer. `<circle class="anchor" id="a-…" r="0">` marks
  label anchors and pivots (read once, then removed). For each layer a copy of the SVG with only that layer kept is turned into a
  data-URL `Image`, decoded, and rasterised into an offscreen canvas at `scale·dpr` on resize only. API:
  `art.ready` (Promise), `art.w/h` (viewBox), `art.render(scale, dpr)`, `art.draw(ctx, x, y, {layerId: {dx, dy, rot, sx}})`,
  `art.pt(id)` → design-unit anchor. Draw a placeholder rectangle until `ready`.
- **SVG file rules:** `viewBox` in design units + `width`/`height`; no `<text>`, no `<image>`, no external refs, no CSS files;
  gradient ids prefixed with the file name; `feGaussianBlur` allowed (rasterised once); ≤ 40 KB per file; moving parts are separate
  top-level `<g data-move>` with an `a-<id>-pivot` anchor when they rotate. Open the file alone with `node tools/shot.mjs <n> --page=art/<f>.svg`.
- Files after v3: `js/modes/{waves,sound,surface,em}.js`; `js/art/sprite.js`; `art/{driver,speaker,transducer,head,talker,ear}.svg` (`head.svg` = shared realistic side-profile head, used by the talker and, scaled/mirrored, by the listener);
  `js/draw/{grid,ink,ball}.js`. Old Path2D art (`js/art/figure.js, speaker.js, talker.js, ear.js`) is deleted once its SVG replacement works.
- Zalo/in-app safety: no reliance on Fullscreen API, `localStorage` in try/catch, AudioContext on first tap, `touch-action` on the canvas,
  touch targets ≥ 40 px, no hover-only features. `prefers-reduced-motion` starts paused (annotations visible).
- Budget: ≥ 50 fps on a mid-range Android phone (checker: CPU throttle ×4 at 390×844); page weight without fonts < 300 KB.

## 7. Raster art (v4 – replaces the SVG talker/head/ear/speaker)
Realistic illustrations (Gemini-generated, checked for anatomy) live in `img/` as WebP with alpha, already cut out:
`speaker-base` + `speaker-cone` (moving cone/dust cap/voice coil), `talker` (sagittal head, facing right), `ear-base` + `ear-drum` + `ear-ossicles` (coronal ear, opening on the left). `img/anchors.json` gives every anchor in image pixels
(cone position/face/rim, talker folds/mouth/air path, ear canal polyline, drum normal, ossicle pivot/tip, oval window,
cochlea, nerve path, Vietnamese label points). Moving parts are separate sprites over an inpainted base, so translating/rotating them
a few pixels never shows a ghost. Rules: draw with `drawImage` only (no per-frame filters), scale fixed per layout, keep every motion
small (cone ≤ 8, drum ≤ 4 image px), physics drives all motion (u(0,t) at the source, pressure −∂u/∂x at the drum). No text is baked into images;
all labels are canvas text from `labels` anchors, shown only when paused.
