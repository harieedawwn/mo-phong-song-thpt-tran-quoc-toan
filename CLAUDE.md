# Mô phỏng sóng 2D – THPT Trần Quốc Toản (Đồng Tháp)

2D wave simulator for Vietnamese grade-11 physics (Vật lí 11, *Kết nối tri thức*). Static site: plain HTML + CSS + ES modules,
**Canvas 2D / inline SVG only, no libraries, no build step**. Deployed by GitHub Pages on every push to `main`
(`.github/workflows/pages.yml` uploads the whole folder).
Live: https://harieedawwn.github.io/mo-phong-song-thpt-tran-quoc-toan/

Read `SPEC.md` (what to build) and `TASK.md` (phases + checklist) before working. Reference images: `docs/ref/`.

## Code map
- `index.html`, `css/style.css`, `fonts/` – shell, tokens, header, panels (phone layouts at the end of the CSS).
- `js/main.js` – loop, resize/DPR, mode routing (`#mode=`), `window.__app`. `js/state.js` – store + bus. `js/ui.js` – DOM helpers, controls, tabs, toolbar, help. `js/fmt.js` – Vietnamese number formatting.
- `js/physics.js` – speeds, λ, pitch text. `js/audio.js` – WebAudio tone/voice.
- `js/modes/` – `longitudinal.js` (sóng âm), `transverse.js` (sóng ngang), `surface.js` (sóng mặt), `em.js` (sóng điện từ).
- `js/art/` – `speaker.js`, `talker.js`, `ear.js`, `figure.js` (anatomy drawings). `js/draw/` – `grid.js` (graph paper), `ink.js` (outline helpers).
- `tools/` – `serve.mjs`, `shot.mjs` (checker).

## Hard rules
- **User-facing text is Vietnamese** (correct diacritics). Reports to the owner: Vietnamese, short. Code/comments: English.
- **Physics must match Vật lí 11 KNTT** (SPEC.md §Physics). Owner/teacher ideas are fixed requirements: make them physically correct, never drop them.
- **Visual style is fixed** (SPEC.md §Visual): school header (red title pill + red school name), flat colours, ink outlines.
  **No gradients, no glow, no bloom, no neon, no blur effects**, no 3D. Graphics may only get better: compare before/after screenshots and revert anything not clearly better.
- **Fast on phones and inside the Zalo in-app browser.** No heavy effects, no new libraries, no network fonts (fonts are self-hosted in `fonts/`).
- All URLs **relative** (site lives under `/mo-phong-song-thpt-tran-quoc-toan/`). File names are case-sensitive.
- Desktop panels must **not need scrolling** at 1366×768 and 1280×720 (mark fixed panels with the `data-noscroll` attribute so the checker can verify).
- Small commits, **Vietnamese commit messages**, push to `main` yourself (that deploys). Never force-push. Never commit `node_modules/` or `shots/`.

## Run & verify
```bash
node tools/serve.mjs                    # serves the repo at http://localhost:8765/mo-phong-song-thpt-tran-quoc-toan/
node tools/shot.mjs <name> [hash] [--all]   # screenshots to shots/, exit 1 on console errors / 404 / forced scrolling
# first time only: cd tools && npm i && npx playwright install chromium
find js -name '*.js' -exec node --check {} \;   # syntax check (root package.json has "type":"module")
```
Look at every screenshot you take (open the PNG) before claiming something works.
`window.__app` must expose `play()`, `pause()`, `setMode(id)` so the checker can drive the page; `#mode=<id>` in the URL selects a mode.

## Deploy check
After `git push`, wait ~60 s, then fetch `https://harieedawwn.github.io/mo-phong-song-thpt-tran-quoc-toan/version.json`
and confirm it shows the `phase` and `build` you just wrote. In the last commit of each phase, set
`version.json` to `{"phase":"<N>","build":"<YYYY-MM-DD HH:MM>"}`. Retry the fetch up to 5 times, 30 s apart.
If `gh` is installed, `gh run list -L 1` must also show `success`.
If Pages is not enabled yet: GitHub → Settings → Pages → Source = **GitHub Actions** (tell the owner the exact clicks if you cannot do it).
