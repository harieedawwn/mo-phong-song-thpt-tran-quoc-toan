# SPEC – Thí nghiệm mô phỏng sóng (2D)

Audience: Vietnamese high-school students and teachers (THPT Trần Quốc Toản, Đồng Tháp). Used on a classroom projector
(1366×768 / 1280×720), on phones, and inside the **Zalo in-app browser**. Goal: the *best demonstration tool* for waves —
simple to operate, rich in what it shows, never childish. **No lessons, no quizzes, no long texts** (teacher feedback:
"bỏ phần bài học, đơn giản hoá nhưng tối ưu chức năng biểu diễn"). Short captions and labels only.

## 1. Modes (one app, four tabs)
| id (`#mode=`) | Tab label (VI) | What it shows |
|---|---|---|
| `longitudinal` (default) | Sóng dọc – Sóng âm | Loudspeaker (or speaking person) → air layers → listener's ear, compressions/rarefactions |
| `transverse` | Sóng ngang | Wave on a rope/string of beads driven at one end |
| `surface` | Sóng mặt nước | Ripples on water: top view + side cross-section with water particles' motion |
| `em` | Sóng điện từ | E and B fields perpendicular to each other and to the propagation direction + KNTT spectrum scale |

All modes share: Play/Pause, **slow-motion** factor, frequency f, amplitude A, "show λ ruler", "track one particle",
"labels on/off", and the live readouts f, T, λ, v. The wave starts at the source and **propagates** (front at x = v·t,
medium ahead of the front is still) — then keeps running. A "Bắt đầu lại" (restart) button resets t = 0.

## 2. Physics (must match Vật lí 11 KNTT, Chương II "Sóng")
Use textbook vocabulary: *phần tử môi trường*, *vị trí cân bằng (VTCB)*, *li độ u*, *biên độ A*, *chu kì T*, *tần số f*,
*bước sóng λ*, *tốc độ truyền sóng v*, *phương dao động*, *phương truyền sóng*, *vùng nén*, *vùng giãn*, *đỉnh sóng*, *hõm sóng*.
Core relations shown on screen: **λ = v·T = v/f**, **f = 1/T**.
- **Bài 8 (Mô tả sóng):** progressive wave u(x,t) = A·cos(ωt − kx), ω = 2πf, k = 2π/λ, for x ≤ v·t (u = 0 beyond the front).
  Two particles one λ apart oscillate in phase. Offer an **đồ thị li độ – quãng đường (u–x)** snapshot and a **u–t** trace of the tracked particle.
- **Bài 9 (Sóng ngang, sóng dọc, truyền năng lượng):**
  - *Sóng ngang*: phương dao động ⟂ phương truyền sóng (rope).
  - *Sóng dọc*: phương dao động trùng phương truyền sóng; sound in air is a longitudinal wave. Particles oscillate **only around
    their VTCB**; energy travels, matter does not.
  - Longitudinal model: each air layer at rest position x moves to x + u(x,t) along the propagation axis.
    Pressure/density excess ∝ −∂u/∂x → **vùng nén** where −∂u/∂x > 0, **vùng giãn** where < 0. Colour/labels must come from this
    same formula so they always sit where the dots are actually crowded.
  - Speeds (m/s): không khí 343, nước 1482, thép 5960 (port `SPEED` from `legacy/js/physics.js`). Hearing range 20 Hz – 20 kHz:
    warn outside it ("hạ âm" < 20 Hz, "siêu âm" > 20 kHz).
- **Sóng mặt nước (teacher request "sóng mặt"):** KNTT treats water-surface waves as approximately transverse (surface elements
  move up and down). Show that, plus an honest side view: near the surface, water particles move on **circles** of radius
  A·e^(−k·depth) (deep-water model), shrinking with depth, so students see why it is "approximately" transverse.
  One-line caption: "SGK coi gần đúng sóng mặt nước là sóng ngang; thực tế phần tử nước chuyển động gần tròn."
- **Bài 11 (Sóng điện từ):** EM wave = coupled oscillating **E** and **B**, in phase, **E ⟂ B ⟂ phương truyền** → it is a
  *sóng ngang*; travels in vacuum at **c = 3·10⁸ m/s**; λ = c/f. Spectrum scale = **Bảng 11.1 SGK KNTT** (use these values verbatim):

  | Loại bức xạ | Bước sóng (chân không) | Tần số (Hz) | Example to show |
  |---|---|---|---|
  | Sóng vô tuyến | 1 m – 100 km | 3·10³ – 3·10⁸ | Đài FM 100 MHz |
  | Sóng vi ba | 1 mm – 1 m | 3·10⁸ – 3·10¹¹ | Lò vi sóng 2,45 GHz |
  | Tia hồng ngoại | 0,76 µm – 1 mm | 3·10¹¹ – 3,9·10¹⁴ | Điều khiển TV, thân nhiệt |
  | Ánh sáng nhìn thấy | 0,38 µm – 0,76 µm | 3,9·10¹⁴ – 7,9·10¹⁴ | Ánh sáng (đỏ → tím) |
  | Tia tử ngoại | 10 nm – 400 nm | 7,5·10¹⁴ – 3·10¹⁶ | Mặt Trời, đèn diệt khuẩn |
  | Tia X | 30 pm – 3 nm | 10¹⁷ – 10¹⁹ | Chụp X-quang |
  | Tia gamma | 10⁻⁵ nm – 0,1 nm | 3·10¹⁸ – 3·10²² | Phóng xạ |

  The scale is a row of 7 flat blocks ordered by wavelength (long → short, label "bước sóng giảm, tần số tăng"). Tapping a block
  selects it; the animation then uses a *relative* on-screen wavelength and shows the real λ range, f range and example. The
  visible-light block is drawn as 7 **solid** stripes (đỏ, cam, vàng, lục, lam, chàm, tím) — never a gradient.
- **Honesty about scale:** animations are slowed down and amplitudes enlarged. Show small badges when relevant:
  "Đã làm chậm ×N", "Biên độ được phóng đại", "λ thực quá nhỏ/lớn – hình vẽ rút gọn" (old app's `visLambda` clamp idea).
  Readouts always show the **real** values (f, T, λ = v/f, v).

## 3. Mode details
### 3.1 Sóng dọc – Sóng âm (default)
Layout of the canvas, left → right: **source** · air region · **listener's ear**. Match `docs/ref/ear-voice-reference.png`
(composition: speaking person in cross-section on the left, waves through air, ear cross-section on the right) but redrawn flat.
- Source toggle (chips): **Loa** (default, owner's decision) | **Người nói**.
  - Loa: flat loudspeaker drawn side-on, cone face toward the air; the cone moves with u(0,t).
  - Người nói: head-and-neck **sagittal cross-section** like the reference: oral cavity, tongue, teeth/lips, nasal cavity outline,
    pharynx (họng), larynx with **dây thanh âm** vibrating, vertebrae column. Lips open toward the air. Labels: "Dây thanh âm (nguồn dao động)",
    "Khoang miệng", "Họng".
- Air: ~40×12 grid of dots (desktop) / ~28×9 (phone), each displaced by u(x,t) along x. Shade by the sign/size of −∂u/∂x using
  **3 discrete flat colours** (nén = orange, bình thường = slate, giãn = blue). One **tracked particle** in red with its VTCB tick and a
  "↔" arrow; one column of dots outlined to show a "lớp không khí". Optional thin bars above showing vùng nén / vùng giãn labels.
- λ ruler: bracket between two consecutive compression centres, label "λ = 78,0 cm" (real value).
- Ear (right, cross-section, matches reference): vành tai (pinna), ống tai, **màng nhĩ** (vibrates with the arriving wave),
  **xương búa – xương đe – xương bàn đạp** (rock slightly), cửa sổ bầu dục, **ốc tai** (snail spiral, purple), ống bán khuyên (purple loops),
  **dây thần kinh thính giác** (yellow, with small pulses travelling to "não" when the wave arrives), vòi nhĩ. Show at most 7 labels at a time;
  clicking a part highlights it with a thick outline + 1-line caption; clicking empty space (or Esc) clears the selection.
- Controls: nguồn (Loa/Người nói), loại âm (Âm đơn / Giọng nói – reuse `legacy/js/audio.js` WebAudio, sound starts only after a tap),
  f (log slider 20 Hz – 20 kHz + chips 100/262/440/1000/4000), độ to (dB, maps to A), môi trường (Không khí/Nước/Thép), làm chậm.
- Right panel extras: mini **oscilloscope** of pressure at the ear (port `legacy/js/scope.js`, Canvas 2D already).

### 3.2 Sóng ngang – dây
- A horizontal rope of ~40 beads (thin ink line through them) driven by a vibrator/hand at the left; far end free-looking (fade out by
  ending the rope at the panel edge, no reflection). Beads move only vertically.
- Labels: "Đỉnh sóng", "Hõm sóng", arrows "phương dao động ↕" vs "phương truyền sóng →", λ between two crests, two in-phase beads marked.
- Bottom strip: **u–x graph** (live snapshot with axis labels "x (cm)", "u (cm)") and **u–t graph** of the tracked bead (scrolling).
- Controls: f (0,2 – 5 Hz visual), A, v (tốc độ truyền, e.g. 0,5 – 4 m/s), làm chậm, "Dừng hình" (freeze to read the graph).

### 3.3 Sóng mặt nước
- Top view (left ~60%): point source S (a small vibrating stylus) making circular ripples; crests drawn as **flat concentric rings**
  in 2–3 stepped blues (no gradient), amplitude falling with distance (∝ 1/√r). A floating **phao/vịt** at distance d bobs up and down
  without drifting away (energy travels, matter does not).
- Side view (right ~40% or below on phones): water surface profile with ~6×4 tracked water particles moving on circles that shrink with depth,
  the phao bobbing on the surface, wavelength ruler.
- Controls: f, A, v (or "độ sâu" simplified to v), làm chậm, toggle "quỹ đạo phần tử".

### 3.4 Sóng điện từ
- Oblique 2D projection (x → right, y ↑, z drawn at −30° "into the page"). Draw E as vertical arrows (sampled every λ/12) in one colour
  and B as arrows along z in another colour, both u = cos(ωt − kx), same phase; outline curves joining arrow tips; axis labels
  "E", "B", "phương truyền sóng (v = c)". Small legend: "E ⟂ B ⟂ v → sóng ngang", "truyền được trong chân không".
- Bottom: the spectrum scale (§2 table). Selected block shows λ range, f range, example; λ = c/f readout uses the block's
  representative value (e.g. FM 100 MHz → λ = 3 m).
- Controls: chọn dải (the scale itself), làm chậm, toggles E / B / mũi tên.

## 4. Layout & UI (keep the school's house style – see `docs/ref/school-style-*.png`)
- **Header** (unchanged identity from the old app):
  - Centre: white pill, red uppercase bold title **"THÍ NGHIỆM MÔ PHỎNG SÓNG"**.
  - Right: **"TRƯỜNG THPT TRẦN QUỐC TOẢN (ĐỒNG THÁP)"**, red uppercase, white card with a red left bar.
  - Left: icon toolbar in a bracket-corner panel: help (short modal: how to use, 6 bullets max), mute, fullscreen (hide if unsupported),
    screenshot (canvas → PNG download), restart.
- **Mode tabs**: a segmented pill centred under the title (like the "Làm nổi bật | Tất cả | 1 Sơ cấp…" bar in
  `school-style-nuclear.png`): 4 options with small icons, active = black fill, white text.
- **Left panel** (≈ 280 px, bracket corners, cream): controls of the current mode, grouped with small uppercase headings,
  icon + label rows, sliders with red fill, chips (active = red fill), segmented (active = black). Never scrolls on desktop.
- **Right panel** (≈ 260 px): "SỐ LIỆU" 2×2 metric cards (f, T, λ, v; JetBrains Mono values, unit small), formula chip
  "λ = v·T = v/f", a 4-row **Đặc điểm** card (Phương dao động, Phương truyền, Môi trường, Ví dụ) for the current mode, and the mode's graph/scope.
- **Centre**: the canvas stage. Bottom-centre: big red **Phát / Tạm dừng** pill button + "Bắt đầu lại" icon button + speed chip.
- **Phones (< 820 px)**: header shrinks (title pill full width, school name small under it), mode tabs become a horizontal row of 4 icon tabs,
  metrics become one row of 4 mini cards, controls move to a bottom sheet with 2–3 icon tabs (collapsed by default), canvas fills the rest.
  Canvas content must re-layout for portrait (e.g. source top-left, ear bottom-right, or stack top/side views vertically).
- Port tokens/components from `legacy/css/style.css` (`.brk` corners, `.seg`, `.chip`, `.tg`, sliders, metric cards, header) and the
  icon set (`PATHS`) + `h()` helper from `legacy/js/ui.js`. Remove all old 3D/lesson/tour CSS.

## 5. Visual system
- **Flat**: solid fills, 1.5–2 px ink outlines (`#2b2f36`), round line joins. **No gradients** (including CSS `linear-gradient` backgrounds,
  canvas `createLinearGradient/RadialGradient`), **no shadows on canvas drawings, no glow/blur/filters, no neon colours**.
  (A subtle UI panel box-shadow is allowed.) Exception: the `.brk` corner marks use `linear-gradient` only as a technique to draw solid lines — keep that.
- Stage background: warm paper `#fbfaf6` with a faint **graph-paper grid** (1 px `#ece7dc`, major every 5 cells `#e2dccd`) — the lab-notebook
  look is the app's signature. Ink `#15181d`, muted `#5d6470`, line `#ddd8cc`, UI red `#d7191f` (UI accents only).
- Data colours (consistent across modes): nén / E-field `#e8590c`, giãn / B-field `#1c7ed6`, neutral particle `#495057`,
  tracked particle `#d7191f`, water `#a5d8ff` / `#74c0fc` / `#4dabf7` (stepped) with outline `#1864ab`.
- Anatomy palette (flat, from the reference, de-saturated a little): skin `#f3c9b1` outline `#9c5b43`; inner mouth/pharynx `#e98f93`;
  tongue `#d9727a`; teeth/bone `#f4ecd8` outline `#a08a62`; vertebrae `#efe3c6`; vocal folds `#c2255c`; ear canal `#eaa58e`;
  eardrum `#f4b183`; ossicles `#f1e3c4` outline `#8a6d3b`; cochlea + semicircular canals `#b197fc` outline `#5f3dc4`;
  auditory nerve `#fcc419` outline `#b08900`; temporal-bone area light stipple `#efe6d2` (dots pattern, not gradient).
- Typography: **Be Vietnam Pro** (400/600/700/800) for UI, **JetBrains Mono** (500/700) for numbers – both already in `fonts/`.
  Canvas text uses the same families (wait for `document.fonts.ready` before first draw).
- Anatomy accuracy: use the reference image for composition and `https://commons.wikimedia.org/wiki/File:Anatomy_of_the_Human_Ear.svg`
  (CC BY 2.5, Chittka & Brockmann) for correct relative positions (pinna → canal → eardrum → malleus/incus/stapes → oval window → cochlea,
  semicircular canals above the cochlea, nerve leaving medially, Eustachian tube going down-forward). Draw it yourself as vector paths; do not embed the file.

## 6. Engineering
- Files: `index.html`, `css/style.css`, `js/main.js` (boot, loop, resize, `window.__app`), `js/state.js`, `js/ui.js`, `js/physics.js`,
  `js/audio.js`, `js/draw/*.js` (shared helpers: grid, arrows, labels, ruler), `js/modes/{longitudinal,transverse,surface,em}.js`
  each exporting `{id, title, controls(), metrics(), features(), layout(w,h), update(dt), draw(ctx)}`, `js/art/{speaker,talker,ear}.js`
  (anatomy as `Path2D` built once per size).
- One `requestAnimationFrame` loop; pause when `document.hidden`; DPR capped at 2 (1.5 on phones); redraw static art into an offscreen
  canvas on resize only; batch particles by colour (one `beginPath()` per colour). Budget: ≥ 50 fps on a mid-range Android phone.
- Zalo/in-app browser safety: no reliance on Fullscreen API, `localStorage` wrapped in try/catch, AudioContext created on first tap,
  `100dvh` with `100vh` fallback, `env(safe-area-inset-*)` padding, touch targets ≥ 40 px, no hover-only features, `touch-action` set on the canvas.
- Accessibility: buttons have Vietnamese `aria-label`s, focus rings visible, `prefers-reduced-motion` starts paused.
- Page weight without fonts < 200 KB. No external requests at runtime.
