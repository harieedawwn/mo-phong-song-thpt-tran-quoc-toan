// Sóng dọc – Sóng âm: air layers (dot grid) displaced along x by u(x,t); colours from −∂u/∂x (vùng nén / vùng giãn).
import {state, set} from '../state.js';
import {h, seg, chip, toggle, slider, group, lab, slowControl} from '../ui.js';
import {lenParts, freqParts, slowText} from '../fmt.js';
import {SPEED, MEDIUM, HEARING, clamp, describePitch, niceSlow, makeWave} from '../physics.js';
import {C, font, pill, text, arrow, ruler, roundRect, textW} from '../draw/ink.js';
import {ball, drawBall, BALL} from '../draw/ball.js';
import {layoutLabels, drawLabels} from '../art/figure.js';
import {makeSpeaker, SPK_RIM, SPK_NAMES, SPK_CAPS, SPK_LABELS} from '../art/speaker.js';
import {makeTalker, TALK_W, TALK_H, MOUTH, TALK_NAMES, TALK_CAPS, TALK_LABELS} from '../art/talker.js';
import {makeEar, EAR_W, EAR_H, EAR_NAMES, EAR_CAPS, EAR_LABELS} from '../art/ear.js';

const F_MIN = 10, F_MAX = 40000;           // slider reaches a little outside 20 Hz–20 kHz to show hạ âm / siêu âm
const DB_MIN = 40, DB_MAX = 100;
const SHOW_M = 2.3;                         // the air region represents about 2.3 m (scale for the drawn λ)
const TH = 0.38;                            // |−∂u/∂x| / (kA) above this → nén / giãn colour
const wave = makeWave();
const L = {};                               // layout (px), filled by layout()
let restX = new Float32Array(0), rulerN = -1;

const niceF = f => f < 100 ? Math.round(f) : Number(f.toPrecision(f < 1000 ? 2 : 3));
const fPos = f => Math.round(1000 * Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN));
function setF(f) { set('f', f); set('slow', niceSlow(f)); }

const spk = makeSpeaker(), talk = makeTalker(), ear = makeEar();
// phone: labels in priority order – as many as fit beside the figure
const PHONE_LABELS = {ear: ['drum', 'cochlea', 'pinna', 'canal', 'canals'], talker: ['cords', 'mouth', 'throat', 'tongue'], speaker: ['cone', 'coil', 'magnet']};
const fitN = (ids, band) => ids.slice(0, Math.max(1, Math.min(ids.length, Math.floor((band - 30) / 23))));
let labelKey = '';

let spr = null;   // sphere sprites (blue, orange, pale, red), rebuilt after every layout / resize
function layout(w, hh) {
  const phone = w < 600;
  L.w = w; L.h = hh; L.phone = phone; L.srcKey = state.source;
  L.fs = phone ? 11 : 12.5;
  // compact = short stage (phone with the control sheet open): only labels + field
  L.tiny = hh < 240;                                  // tiny = landscape phone: field only
  L.layout = !phone ? 'side' : hh >= 420 ? 'stack' : 'bars';   // side: figures left/right of the field · stack: figure above / below (portrait phone) · bars: markers only
  L.compact = L.layout === 'stack' ? false : hh < 440;
  const talker = state.source === 'talker';
  labelKey = '';
  if (L.layout === 'stack') {
    L.cols = 26;
    L.airL = 12; L.airR = w - 12; L.airW = L.airR - L.airL; L.dx = L.airW / L.cols;
    const top0 = 74, avail = hh - top0 - 70;
    L.rows = avail < 340 ? 4 : 6;                                    // short phone: fewer rows keep room for the ear
    L.bandA = talker ? clamp(avail * 0.27, 92, 130) : clamp(avail * 0.2, 62, 100); L.bandB = clamp(avail * 0.4, 128, 200) - (talker ? 8 : 0);   // the ear (head + magnifier) needs the most room
    L.above = 42; L.below = avail < 340 ? 54 : 52;
    L.dy = clamp((avail - L.bandA - L.bandB - L.above - L.below) / L.rows, 8, 17);
    L.fieldTop = top0 + L.bandA + L.above; L.fieldBot = L.fieldTop + L.rows * L.dy;
    // figures: source top-left, ear bottom-right
    (talker ? talk : spk).place(6, top0, w * 0.4, L.bandA - 4, 0, 0.5);
    ear.place(6, L.fieldBot + L.below, w - 12, L.bandB - 2, 1, 0.5);
  } else if (L.layout === 'bars') {
    L.cols = 24; L.rows = 8;
    L.airL = 14; L.airR = w - 14; L.airW = L.airR - L.airL; L.dx = L.airW / L.cols;
    L.above = L.tiny ? 16 : 62; L.below = 6;
    const top = 8, bottom = 66, avail = hh - top - bottom - L.above - L.below;
    L.dy = clamp(avail / L.rows, 8, 20);
    const block = L.above + L.rows * L.dy + L.below;
    L.fieldTop = top + Math.max(0, (hh - top - bottom - block) / 2) + L.above; L.fieldBot = L.fieldTop + L.rows * L.dy;
  } else {
    const srcW = talker ? clamp(w * 0.27, 140, 235) : clamp(w * 0.19, 100, 150), earW = clamp(w * 0.36, 190, 300);
    L.airL = srcW + 12; L.airR = w - earW - 8; L.airW = L.airR - L.airL;
    L.cols = clamp(Math.round(L.airW / 9), 24, 40); L.rows = 12; L.dx = L.airW / L.cols;
    const top = L.tiny ? 4 : L.compact ? 8 : 46, bottom = L.compact ? 66 : 76;
    L.above = L.tiny ? 16 : L.compact ? 62 : 88; L.below = L.compact ? 6 : 112;
    const avail = hh - top - bottom - L.above - L.below;
    L.dy = clamp(avail / L.rows, 8, Math.min(26, L.dx * 1.9));
    const block = L.above + L.rows * L.dy + L.below;
    L.fieldTop = top + Math.max(0, (hh - top - bottom - block) / 2) + L.above; L.fieldBot = L.fieldTop + L.rows * L.dy;
    const cy = (L.fieldTop + L.fieldBot) / 2, rowsH = L.compact ? 0 : 56;        // room for 2 label rows above / below a figure
    const fitS = (sw, up, dn) => Math.max(0.3, Math.min(sw, (cy - 38 - rowsH) / up, (hh - bottom - rowsH - cy) / dn));
    if (talker) {
      const s = fitS((srcW - 2) / TALK_W, MOUTH[1], TALK_H - MOUTH[1]);
      talk.s = s; talk.x = L.airL - 4 - TALK_W * s; talk.y = cy - MOUTH[1] * s;
    } else {
      const s = fitS((srcW - 6) / 124, 85, 85);
      spk.s = s; spk.x = L.airL - 6 - SPK_RIM * s; spk.y = cy - 85 * s;
    }
    const se = fitS(earW / EAR_W, 134, 116);
    ear.s = se; ear.x = L.airR + 4; ear.y = cy - 134 * se;
  }
  L.r = clamp(Math.min(L.dx, L.dy) * 0.3, 3, 4.4);
  L.trackCol = Math.round(L.cols * 0.27);
  restX = new Float32Array(L.cols);
  for (let i = 0; i < L.cols; i++) restX[i] = (i + 0.5) * L.dx;
  rulerN = -1; spr = null;
}

// recompute the drawn wave from the state (cheap, no allocation)
function syncWave() {
  const v = SPEED[state.medium] || SPEED.air;
  const g = clamp((state.level - DB_MIN) / (DB_MAX - DB_MIN), 0, 1);
  const minPx = Math.max(7 * L.dx, 60), maxPx = L.airW * 0.56;
  wave.set(state.f, v, L.airW / SHOW_M, minPx, maxPx, 0);
  wave.A = Math.min((0.28 + 0.47 * g) * wave.lamPx / (2 * Math.PI), 1.05 * L.dx);
  wave.at(state.t);
}

function draw(ctx) {
  if (!L.w) return;
  if (L.srcKey !== state.source) layout(L.w, L.h);
  syncWave();
  const {airL, airW, dx, dy, fieldTop, fieldBot, cols, rows, r, fs} = L;
  const lam = wave.lamPx, cyc = wave.cycles(), front = wave.front;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // --- paused only: faint nén / giãn column bands behind the particles + thin bar above the field (same formula as the particles)
  const still = !state.playing;
  if (still) {
    const by = fieldTop - 12;
    for (const [col, band, sign] of [[C.comp, 'rgba(232,89,12,.11)', 1], [C.rare, 'rgba(28,126,214,.09)', -1]]) {
      ctx.fillStyle = band; ctx.beginPath();
      for (let i = 0; i < cols; i++) { const s = wave.s(restX[i]) * sign; if (s > TH) ctx.rect(airL + restX[i] - dx / 2, fieldTop, dx, rows * dy); }
      ctx.fill();
      ctx.fillStyle = col; ctx.beginPath();
      for (let i = 0; i < cols; i++) { const s = wave.s(restX[i]) * sign; if (s > TH) ctx.rect(airL + restX[i] - dx / 2, by - 3, dx + 0.5, 6); }
      ctx.fill();
    }
  }

  // --- air spheres: uniform blue while running; paused → nén orange / giãn pale blue (one sprite per class, drawImage only)
  if (!spr) spr = [ball(BALL.blue, r), ball(BALL.orange, r), ball(BALL.pale, r), ball(BALL.red, r + 1.8)];
  const sprites = spr;
  for (let pass = 0; pass < (still ? 3 : 1); pass++) {
    const sp = sprites[pass];
    for (let i = 0; i < cols; i++) {
      if (still) { const s = wave.s(restX[i]), cls = s > TH ? 1 : s < -TH ? 2 : 0; if (cls !== pass) continue; }
      const x = airL + restX[i] + wave.u(restX[i]);
      for (let j = 0; j < rows; j++) {
        if (state.track && i === L.trackCol && j === rows - 1) continue;
        drawBall(ctx, sp, x, fieldTop + (j + 0.5) * dy);
      }
    }
  }

  // --- one air layer outlined + tracked particle (red) with VTCB tick and ↔ arrow
  if (state.track) {
    const x0 = airL + restX[L.trackCol], x = x0 + wave.u(restX[L.trackCol]);
    ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5;
    ctx.beginPath(); roundRect(ctx, x - dx * 0.46, fieldTop + 1, dx * 0.92, rows * dy - 2, 4); ctx.stroke();
    const yd = fieldTop + (rows - 0.5) * dy;
    drawBall(ctx, spr[3], x, yd);
  }

  drawArt(ctx);
}

const SRC = {speaker: {names: SPK_NAMES, caps: SPK_CAPS, labels: SPK_LABELS, title: 'Loa'}, talker: {names: TALK_NAMES, caps: TALK_CAPS, labels: TALK_LABELS, title: 'Người nói'}};
const srcFig = () => state.source === 'talker' ? talk : spk;
const clampB = x => Math.max(-1, Math.min(1, x));

function buildLabels(ctx) {
  const key = L.w + 'x' + L.h + state.source + L.layout + L.compact;
  if (key === labelKey) return;
  labelKey = key;
  const lab = {src: [], ear: [], tops: {src: 1e9, ear: 1e9}};
  L.lab = lab; L.artBottom = 0;
  const sf = srcFig(), S = SRC[state.source];
  const mk = (tbl, ids, side) => tbl.filter(t => !ids || ids.includes(t[0])).map(t => ({id: t[0], text: t[1], tx: t[2], ty: t[3], side: side || t[4], row: t[5]}));
  for (const f of [sf, ear]) L.artBottom = Math.max(L.artBottom, f.y + f.h * f.s);
  if (L.layout === 'bars' || L.compact) return;
  if (L.layout === 'stack') {
    lab.src = layoutLabels(ctx, sf, mk(S.labels, fitN(PHONE_LABELS[state.source], L.bandA), 'right'), {mode: 'side', size: 10.5, xR: sf.x + sf.w * sf.s + 10, xL: 0, ymin: sf.y + 26, ymax: sf.y + sf.h * sf.s - 12});
    lab.ear = layoutLabels(ctx, ear, mk(EAR_LABELS, fitN(PHONE_LABELS.ear, L.bandB), 'left'), {mode: 'side', size: 10.5, xR: 0, xL: ear.x - 8, ymin: ear.y + 26, ymax: ear.y + ear.h * ear.s - 10});
    return;
  }
  const fsz = 11;
  lab.src = layoutLabels(ctx, sf, mk(S.labels), {mode: 'rows', size: fsz, xmin: 2, xmax: L.airL - 2, yTop: sf.y - 4, yBot: sf.y + sf.h * sf.s + 4});
  lab.ear = layoutLabels(ctx, ear, mk(EAR_LABELS), {mode: 'rows', size: fsz, xmin: L.airR + 4, xmax: L.w - 2, yTop: ear.y - 4, yBot: ear.y + ear.h * ear.s + 4});
  for (const [k, f] of [['src', sf], ['ear', ear]]) {
    for (const l of lab[k]) { lab.tops[k] = Math.min(lab.tops[k], l.y - l.h / 2); L.artBottom = Math.max(L.artBottom, l.y + l.h / 2); }
    if (lab.tops[k] > 1e8) lab.tops[k] = f.y;
  }
}

function drawArt(ctx) {
  buildLabels(ctx);
  const {fieldTop, fieldBot} = L, sf = srcFig();
  const u0 = wave.u(0) * 0.8, ear0 = L.airR - L.airL + 6, ue = wave.u(ear0);
  const amp = Math.max(wave.A, 1);
  if (L.layout === 'bars') {
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(L.airL - 6 + u0, fieldTop); ctx.lineTo(L.airL - 6 + u0, fieldBot); ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(L.airR + 6 + ue * 0.8, fieldTop + 6); ctx.lineTo(L.airR + 6 + ue * 0.8, fieldBot - 6); ctx.stroke();
    ctx.strokeStyle = '#f4b183'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L.airR + 6 + ue * 0.8, fieldTop + 6); ctx.lineTo(L.airR + 6 + ue * 0.8, fieldBot - 6); ctx.stroke();
    return;
  }
  // source
  const dpr = ctx.canvas.width / L.w;
  sf.drawStatic(ctx, dpr);
  if (state.source === 'talker') sf.drawDyn(ctx, clampB(wave.u(0) / amp));
  else sf.drawDyn(ctx, u0 / sf.s);
  // ear: eardrum follows the arriving air displacement; nerve pulses start when the wave front has reached the ear
  ear.drawStatic(ctx, dpr);
  const phase = wave.front >= ear0 ? (((wave.cycles() - ear0 / wave.lamPx) % 1) + 1) % 1 : -1;
  ear.drawDyn(ctx, clampB(ue / amp) * 4.2, phase, false);
  if (L.layout === 'stack') {                                           // small markers where the air meets source / ear
    ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(L.airL - 6 + u0, fieldTop); ctx.lineTo(L.airL - 6 + u0, fieldBot); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(L.airR + 6 + ue * 0.8, fieldTop); ctx.lineTo(L.airR + 6 + ue * 0.8, fieldBot); ctx.stroke();
  }
}

// second (muted) line of the readout chip: only the parts that apply
function readout() {
  const pitch = state.f < HEARING.min ? 'Hạ âm · tai không nghe được' : state.f > HEARING.max ? 'Siêu âm · tai không nghe được' : 'Âm trung · tai nghe được';
  return 'Hình đã làm chậm ' + slowText(state.slow) + ' · biên độ phóng đại · ' + pitch;
}

// everything with words / rulers / guides: drawn only while paused (main.js calls it after draw(), fx.a fades it in)
function annotate(ctx) {
  if (!L.w) return;
  const {airL, airW, dx, dy, fieldTop, fieldBot, cols, rows, r, fs} = L;
  const lam = wave.lamPx, cyc = wave.cycles(), front = wave.front, by = fieldTop - 12;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const arrowOn = L.layout === 'side' && !L.compact;
  // --- "Phương truyền sóng →"
  if (arrowOn) {
    const ay = fieldTop - 76;
    arrow(ctx, airL, ay, L.airR, ay, {width: 2, size: 9, color: C.ink2});
    pill(ctx, 'Phương truyền sóng', airL + airW / 2, ay, {size: fs, fill: C.paper, stroke: null, color: C.ink2});
  }
  // --- "Vùng nén" / "Vùng giãn" at the centres (cos = +1 / −1)
  if (!L.tiny) {
    ctx.font = font(fs, 700);
    const short = L.layout === 'stack', tN = short ? 'Nén' : 'Vùng nén', tG = short ? 'Giãn' : 'Vùng giãn';
    const wN = textW(ctx, tG) + 14, ly = by - 17;
    const oneRow = lam / 2 >= wN + 6, every = lam >= wN + 6 ? 1 : 2;
    const showG = oneRow || lam / 2 >= wN / 2 + 6, gy = oneRow ? ly : ly - 23;
    for (let n = Math.ceil(cyc - airW / lam - 0.5); n <= Math.floor(cyc) + 1; n++) {
      if (n % every) continue;
      const xc = lam * (cyc - n);
      if (n >= 1 && xc > 16 && xc < airW - 16) pill(ctx, tN, airL + xc, ly, {size: fs, fill: C.comp, stroke: C.comp, color: '#fff'});
      const xg = xc - lam / 2;
      if (showG && n >= 0 && xg > 16 && xg < airW - 16 && xg <= front) {
        if (!oneRow) { ctx.strokeStyle = C.rare; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(airL + xg, gy + 8); ctx.lineTo(airL + xg, by - 4); ctx.stroke(); }
        pill(ctx, tG, airL + xg, gy, {size: fs, fill: C.rare, stroke: C.rare, color: '#fff'});
      }
    }
  }
  // --- λ ruler between two consecutive compression centres (frame is frozen, so the pair is stable)
  const xAt = m => lam * (cyc - m / 2);
  const ok = m => { const x = xAt(m); return m >= 2 && x >= dx * 0.5 && x + lam <= Math.min(front, airW - dx * 0.5); };
  let rx = -1;
  if (!ok(rulerN)) {
    const mc = 2 * Math.floor(cyc - dx * 0.5 / lam), mr = 2 * Math.floor(cyc - 0.5 - dx * 0.5 / lam) + 1;
    rulerN = ok(mc) ? mc : ok(mr) ? mr : -1;
  }
  if (rulerN >= 2) {
    rx = airL + xAt(rulerN); const gl = L.compact ? 0 : L.layout === 'side' ? 64 : 38;
    ctx.strokeStyle = 'rgba(21,24,29,.45)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(rx, by + 4); ctx.lineTo(rx, fieldBot + gl); ctx.moveTo(rx + lam, by + 4); ctx.lineTo(rx + lam, fieldBot + gl); ctx.stroke();
    ctx.setLineDash([]);
  }
  // --- tracked particle: VTCB tick, ↔ arrow, labels
  if (state.track) {
    const x0 = airL + restX[L.trackCol], ty = fieldBot + 12;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, fieldBot + 3); ctx.lineTo(x0, fieldBot + 20); ctx.stroke();
    const a = Math.max(wave.A, 6);
    arrow(ctx, x0 - a - 5, ty, x0 + a + 5, ty, {color: C.track, width: 2, size: 7, both: true});
    if (!L.compact) {
      pill(ctx, 'VTCB', x0, fieldBot + 28, {size: fs - 1, weight: 700, color: C.ink, fill: C.paper, stroke: null, pad: 3});
      const t = L.layout === 'side' && L.airW > 330 ? 'Phần tử khí dao động quanh VTCB' : 'Dao động quanh VTCB';
      ctx.font = font(fs - 0.5, 600);
      pill(ctx, t, x0 + dx * 0.6 + a + 8 + textW(ctx, t) / 2 + 3, ty, {size: fs - 0.5, weight: 600, color: C.ink2, fill: C.paper, stroke: null, pad: 3});
    }
  }
  // --- λ bracket under the field (REAL wavelength)
  if (rx >= 0 && !L.compact) {
    const [n, u] = lenParts(wave.lam);
    ruler(ctx, rx, rx + lam, fieldBot + (L.layout === 'side' ? 56 : 47), 'λ = ' + n + ' ' + u, {size: fs + 0.5, color: C.ink, maxX: L.w - 4});
  }
  // --- part labels + headings
  if (L.layout === 'bars' || L.compact) return;
  const lab = L.lab; if (!lab) return;
  const sf = srcFig(), lfs = L.layout === 'stack' ? 10.5 : 11;
  drawLabels(ctx, lab.src, null, lfs, null);
  drawLabels(ctx, lab.ear, null, lfs, null);
  const hs = L.fs + 1;
  if (L.layout === 'side') {
    text(ctx, SRC[state.source].title, (sf.x + L.airL) / 2 + (state.source === 'talker' ? -20 : 0), Math.min(lab.tops.src, sf.y) - 14, {size: hs, weight: 800});
    text(ctx, 'Tai người nghe', (L.airR + L.w) / 2, Math.min(lab.tops.ear, ear.y) - 14, {size: hs, weight: 800});
  } else {
    text(ctx, SRC[state.source].title, sf.x + sf.w * sf.s + 10, sf.y + 8, {size: hs - 1, weight: 800, align: 'left'});
    if (L.h >= 520) text(ctx, 'Tai người nghe', ear.x - 8, ear.y + 22, {size: hs - 1, weight: 800, align: 'right'});
  }
}

function controls() {
  const fVal = h('span', {class: 'val'}), fNote = h('p', {class: 'note'});
  const fSlider = slider({min: 0, max: 1000, label: 'Tần số',
    pos: () => fPos(state.f),
    apply: p => setF(niceF(F_MIN * Math.pow(F_MAX / F_MIN, p / 1000))),
    sync: () => {
      const [n, u] = freqParts(state.f); fVal.replaceChildren(n, h('small', {text: u}));
      const d = describePitch(state.f);
      fNote.textContent = d.audible ? d.label + ' · tai người nghe được' : d.label + (state.f < HEARING.min ? ' (< 20 Hz)' : ' (> 20 kHz)') + ' · tai người không nghe được';
      fNote.className = 'note' + (d.audible ? '' : ' warn');
    }});
  const dbVal = h('span', {class: 'val'});
  const dbSlider = slider({min: DB_MIN, max: DB_MAX, step: 5, label: 'Độ to',
    pos: () => state.level, apply: v => set('level', v),
    sync: () => { dbVal.replaceChildren(String(state.level), h('small', {text: 'dB'})); }});
  return [
    group('wave', 'Nguồn âm',
      seg([['speaker', 'Loa'], ['talker', 'Người nói']], () => state.source, v => set('source', v), 'Nguồn âm'),
      h('div', {class: 'chips g2'}, chip('Âm đơn', () => state.sound === 'tone', () => set('sound', 'tone')), chip('Giọng nói', () => state.sound === 'voice', () => set('sound', 'voice')))),
    group('wave', 'Sóng âm',
      lab('freq', 'Tần số f', fVal), fSlider,
      h('div', {class: 'chips g5'}, ...[100, 262, 440, 1000, 4000].map(f => chip(f >= 1000 ? f / 1000 + 'k' : String(f), () => state.f === f, () => setF(f), 'sm'))),
      fNote,
      lab('vol', 'Độ to', dbVal), dbSlider,
      lab('medium', 'Môi trường'),
      h('div', {class: 'chips g3'}, ...Object.keys(MEDIUM).map(k => chip(MEDIUM[k], () => state.medium === k, () => set('medium', k)))),
      ...slowControl()),
    group('show', 'Hiển thị',
      h('div', {class: 'tgs'},
        toggle('target', 'Phần tử đỏ', () => state.track, v => set('track', v), 'Theo dõi một phần tử (màu đỏ)')))
  ];
}

export default {
  id: 'sound', title: 'Sóng âm', short: 'Sóng âm', icon: 'vol',
  defaults: {get slow() { return niceSlow(state.f); }},
  metrics: () => ({f: state.f, v: SPEED[state.medium] || SPEED.air}),
  readout: () => readout(),
  controls, layout, draw, annotate,
  update() {}, reset() { rulerN = -1; }
};
