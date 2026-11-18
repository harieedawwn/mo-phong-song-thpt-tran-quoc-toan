# Mô phỏng sóng 2D – THPT Trần Quốc Toản (Đồng Tháp)

2D wave simulator for Vietnamese grade-11 physics (Vật lí 11, *Kết nối tri thức*). Static site: plain HTML + CSS + ES modules,
**Canvas 2D + SVG art files, no libraries, no build step**. Deployed by GitHub Pages on every push to `main`
(`.github/workflows/pages.yml` uploads the whole folder). Live: https://harieedawwn.github.io/mo-phong-song-thpt-tran-quoc-toan/

v3 rebuild = **finished (Phase 19)**; any new work = new phase in `TASK.md`. Was: **v3 rebuild** (big clean stage, labels only when paused, 3D-looking spheres and shaded SVG art).
`SPEC.md` = what to build, `TASK.md` = phases. Work on exactly **one phase per session**.

## Session routine (the owner pastes a short prompt; this is the full procedure)
1. `git pull --ff-only origin main`. CLAUDE.md is already in your context – do not re-read it.
2. Find the phase: `grep -n '^## Phase' TASK.md` → first `[~]`, else first `[ ]`; read the TASK header + that section only. None left → report "Đã xong v3".
3. **Model gate:** if the phase names another model than yours, change nothing and reply only:
   "Phase N cần <model> – gõ /clear, /model <model> rồi dán lại prompt."
4. Mark `[~]`. Read only the SPEC sections the phase lists (`grep -n '^#' SPEC.md`, partial reads) and the listed files (grep inside big ones).
5. `node tools/serve.mjs &`. Visual phase → `node tools/shot.mjs before<N> <hash> --paused` (do not open these yet).
6. Do the checkboxes of this ONE phase.
7. Verify once at the end (not after every small edit): `node --check` on changed JS, `shot.mjs after<N> … --paused` (+`--all` if the phase says)
   must exit 0; open desk, phone, desk-paused (+ before-desk-paused to compare, + any viewport the checker flagged). One fix round, then re-shoot once.
8. Tick boxes, `[x]` (or `[!]` + one-line note), one Log line, `version.json`, Vietnamese commit(s), `git push origin main`.
9. Deploy check (light): wait 60 s, fetch `version.json` once (one retry after 30 s). Full 5-retry check only in Phase 19.
10. Report in Vietnamese, ≤ 5 lines: phase + kết quả, số liệu đã kiểm, commit + deploy, phase tiếp theo + model, "Gõ /clear rồi dán lại prompt."

## Save tokens (important)
- **No subagents / Task / Explore agents**, no web search, no package installs beyond `tools/` (Playwright is already set up).
- Never read `fonts/`, `docs/history.md`, `node_modules/`, `shots/` (except the PNGs from step 7), reference PNGs unless the phase names them.
- Edit in place; never rewrite or print whole files that only need a few changes. No refactors outside the phase.
- While drawing SVG art, iterate with `--page=art/<file>.svg` shots (1 image) instead of full-app shots (several images).

## Code map (v3 – finished)
- `index.html`, `css/style.css` (phone layouts at the end), `fonts/` – shell, header, left panel, stage.
- `js/main.js` – loop, resize/DPR, mode routing (`#mode=` + aliases), calls `draw` every frame and `annotate` only when paused, `window.__app`.
- `js/state.js` – store + bus. `js/ui.js` – DOM helpers, controls, tabs, toolbar, help, play button. `js/fmt.js` – Vietnamese numbers.
- `js/physics.js` – `makeWave()`, speeds, pitch text. `js/audio.js` – WebAudio (muted by default).
- `js/modes/` – `waves.js` (sóng ngang + sóng dọc), `sound.js` (sóng âm), `surface.js` (sóng mặt), `em.js` (sóng điện từ).
- `js/draw/` – `grid.js` (paper background), `ink.js` (pills, arrows, rulers, `fx.a`), `ball.js` (3D sphere sprites).
- `js/art/sprite.js` – loads `art/*.svg`, splits `data-move` layers, rasterises once per resize and crops each layer to its painted box (per frame = small drawImage only). `art/` – driver, speaker, speaker-out, transducer, head, talker, ear SVGs.
- `tools/` – `serve.mjs`, `shot.mjs` (checker; `--perf` = 4× CPU throttle, 390×844, fps of each mode, must be ≥ 50).

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
node tools/shot.mjs p --perf                     # fps per mode on a throttled phone, exit 1 if < 50
node tools/shot.mjs <name> --page=art/ear.svg   # one SVG (or any repo file) alone, 900×700
# first time: cd tools && npm i && npx playwright install chromium   (if the download fails, shot.mjs falls back to any installed Chromium; or CHROME=/path)
find js -name '*.js' -exec node --check {} \;   # syntax check
```
Never claim something works without opening the screenshot that shows it.
`window.__app` exposes `play()`, `pause()`, `restart()`, `setMode(id)`, `mode`, `state`.

## Deploy check
`https://harieedawwn.github.io/mo-phong-song-thpt-tran-quoc-toan/version.json` must show the `{"phase":"<N>","build":"<YYYY-MM-DD HH:MM>"}`
written in the phase's last commit (routine step 9). If `gh` is installed, `gh run list -L 1` showing `success` is enough.
