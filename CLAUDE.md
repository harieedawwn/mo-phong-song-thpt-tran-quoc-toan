# Mô phỏng sóng 2D – THPT Trần Quốc Toản (Đồng Tháp)

2D wave simulator for Vietnamese grade-11 physics (Vật lí 11, *Kết nối tri thức*). Static site: plain HTML + CSS + ES modules,
**Canvas 2D + SVG art files, no libraries, no build step**. Deployed by GitHub Pages on every push to `main`
(`.github/workflows/pages.yml` uploads the whole folder). Live: https://harieedawwn.github.io/mo-phong-song-thpt-tran-quoc-toan/

Current work = **v3 rebuild** (big clean stage, labels only when paused, 3D-looking spheres and shaded SVG art).
`SPEC.md` = what to build, `TASK.md` = phases. Work on exactly **one phase per session**.

## Save tokens (important)
- Read only `CLAUDE.md`, `TASK.md` and the SPEC sections + files the phase lists. Use `grep -n` / partial reads for big files.
- Never read `fonts/`, `docs/history.md`, `node_modules/`, or reference PNGs unless the phase names them.
- Do not paste whole files back; edit in place. Do not refactor outside the phase.

## Code map (v3 target – some files appear during the phases)
- `index.html`, `css/style.css` (phone layouts at the end), `fonts/` – shell, header, left panel, stage.
- `js/main.js` – loop, resize/DPR, mode routing (`#mode=` + aliases), calls `draw` every frame and `annotate` only when paused, `window.__app`.
- `js/state.js` – store + bus. `js/ui.js` – DOM helpers, controls, tabs, toolbar, help, play button. `js/fmt.js` – Vietnamese numbers.
- `js/physics.js` – `makeWave()`, speeds, pitch text. `js/audio.js` – WebAudio (muted by default).
- `js/modes/` – `waves.js` (sóng ngang + sóng dọc), `sound.js` (sóng âm), `surface.js` (sóng mặt), `em.js` (sóng điện từ).
- `js/draw/` – `grid.js` (paper background), `ink.js` (pills, arrows, rulers, `fx.a`), `ball.js` (3D sphere sprites).
- `js/art/sprite.js` – loads `art/*.svg`, splits `data-move` layers, rasterises once per resize. `art/` – driver, speaker, transducer, ear, talker SVGs.
- `tools/` – `serve.mjs`, `shot.mjs` (checker).

## Hard rules
- **User-facing text is Vietnamese** (correct diacritics). Reports to the owner: Vietnamese, short. Code/comments: English.
- **Physics must match Vật lí 11 KNTT** (SPEC §2). Never fake motion; if an option would be physically wrong, redesign it (SPEC says how).
- **While the wave runs, no text on the stage** (axis letters O, x, u only). All labels/rulers/readouts appear only when paused (SPEC §1).
- **Depth is wanted:** gradients and baked shadows are allowed (v2's no-gradient rule is cancelled). Still forbidden: neon, glow/bloom,
  CSS `filter`/`backdrop-filter`, `shadowBlur` in per-frame loops, WebGL, any library, network fonts/requests.
- Keep the school identity: red title pill **THÍ NGHIỆM MÔ PHỎNG SÓNG**, school name **TRƯỜNG THPT TRẦN QUỐC TOẢN (ĐỒNG THÁP)** on one line.
- **No scrollbar** (page or panels) at any checker size. **Fast on phones and in the Zalo in-app browser** (≥ 50 fps, no per-frame allocation).
- All URLs **relative** (site lives under `/mo-phong-song-thpt-tran-quoc-toan/`). File names are case-sensitive.
- Graphics may only get better: compare before/after screenshots; revert anything not clearly better.
- Small commits, **Vietnamese commit messages**, push to `main` yourself (that deploys). Never force-push. Never commit `node_modules/` or `shots/`.

## Run & verify
```bash
node tools/serve.mjs &                          # http://localhost:8765/mo-phong-song-thpt-tran-quoc-toan/
node tools/shot.mjs <name> [hash] [--all] [--paused]   # shots/<name>-<vp>[-paused].png; exit 1 on errors / 404 / scrollbars / school name wrap
node tools/shot.mjs <name> --page=art/ear.svg   # one SVG (or any repo file) alone, 900×700
# first time: cd tools && npm i && npx playwright install chromium   (if the download fails, shot.mjs falls back to any installed Chromium; or CHROME=/path)
find js -name '*.js' -exec node --check {} \;   # syntax check
```
Open and look at the PNGs you rely on (desk, phone, desk-paused at least) before claiming something works.
`window.__app` exposes `play()`, `pause()`, `restart()`, `setMode(id)`, `mode`, `state`.

## Deploy check
After `git push`, wait ~60 s, fetch `https://harieedawwn.github.io/mo-phong-song-thpt-tran-quoc-toan/version.json` and confirm the
`phase`/`build` you wrote (last commit of each phase sets `{"phase":"<N>","build":"<YYYY-MM-DD HH:MM>"}`). Retry up to 5 times, 30 s apart.
If `gh` is installed, `gh run list -L 1` must show `success`.
