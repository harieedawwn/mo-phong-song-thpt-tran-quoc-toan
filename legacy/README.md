# legacy/ – từ dự án 3D cũ (song-am-simulator-vat-ly-11)

Reference only. **Do not import these files from the new app**; port the useful parts into `js/` / `css/` and adapt.
They depend on three.js / `layout.js`, which the 2D app must not use. Delete this folder in Phase 7.

| File | Port what |
|---|---|
| `css/style.css` | @font-face block, design tokens (`:root`), header (`#title`, `#school`), `.panel`, `.brk` corner marks, `.seg`, `.chip`, `.tg`, range sliders, metric cards, phone media queries. Drop 3D labels, coach, tour, lesson CSS. |
| `js/ui.js` | `PATHS` icon set + `icon()`, `h()` DOM helper, `chip/toggle/slider` builders, `APP_TITLE`/`SCHOOL` pattern, dock-tab logic for phones, live metric `put()` + number formatting (`num`, `lenParts`, `timeParts`, Vietnamese decimal comma). |
| `js/state.js` | tiny `state` + `bus` + `set()` store. |
| `js/physics.js` | `SPEED`, `HEARING`, `waveParams` idea (real λ vs clamped `visLambda`), `describePitch`, `levelToGain`. |
| `js/audio.js` | WebAudio tone/voice timbres, smooth gain, mute/volume. Remove 3D-specific bits (`live.env` coupling can stay). |
| `js/scope.js` | Canvas-2D oscilloscope (waveform / spectrum / pressure at ear) – reuse for the right panel. |
| `js/content.js` | Only for wording of ear parts (`PARTS_INFO`) – short Vietnamese captions. Lessons/quiz/tour are **not** wanted anymore. |
| `index.html` | loader markup, meta tags. |
| `OLD-CLAUDE.md` | old rules, for context. |
