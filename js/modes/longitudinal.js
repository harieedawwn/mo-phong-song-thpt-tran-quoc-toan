// Sóng dọc – Sóng âm: air layers (dot grid) displaced along x by u(x,t); colours from −∂u/∂x (vùng nén / vùng giãn).
import {state, set, bus} from '../state.js';
import {h, seg, chip, toggle, slider, group, lab, slowControl} from '../ui.js';
import {lenParts, freqParts} from '../fmt.js';
import {SPEED, MEDIUM, HEARING, clamp, describePitch, niceSlow, makeWave} from '../physics.js';
import {C, font, pill, text, arrow, ruler, roundRect, textW} from '../draw/ink.js';
import {layoutLabels, drawLabels, pickLabel} from '../art/figure.js';
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
const PHONE_LABELS = {ear: ['drum', 'cochlea', 'nerve', 'malleus', 'pinna'], talker: ['cords', 'mouth', 'throat', 'tongue'], speaker: ['cone', 'coil', 'magnet']};
const fitN = (ids, band) => ids.slice(0, Math.max(1, Math.min(ids.length, Math.floor((band - 30) / 23))));
let sel = null, selWho = '', labelKey = '';

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
  L.r = clamp(Math.min(L.dx, L.dy) * 0.24, 1.6, 3.4);
  L.trackCol = Math.round(L.cols * 0.27);
  restX = new Float32Array(L.cols);
  for (let i = 0; i < L.cols; i++) restX[i] = (i + 0.5) * L.dx;
  rulerN = -1;
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
  if (L.srcKey !== state.source) { layout(L.w, L.h); if (sel && selWho === 'src') setSel(null, ''); }
  syncWave();
  const {airL, airW, dx, dy, fieldTop, fieldBot, cols, rows, r, fs} = L;
  const lam = wave.lamPx, cyc = wave.cycles(), front = wave.front;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // --- propagation direction
  const ay = fieldTop - 76, arrowOn = L.layout === 'side' && !L.compact;
  if (arrowOn) arrow(ctx, airL, ay, L.airR, ay, {width: 2, size: 9, color: C.ink2});
  if (state.labels && arrowOn) pill(ctx, 'Phương truyền sóng', airL + airW / 2, ay, {size: fs, fill: C.paper, stroke: null, color: C.ink2});

  // --- thin bar above the field: vùng nén (orange) / vùng giãn (blue), same formula as the dots
  const by = fieldTop - 12;
  for (const [col, sign] of [[C.comp, 1], [C.rare, -1]]) {
    ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < cols; i++) { const s = wave.s(restX[i]) * sign; if (s > TH) ctx.rect(airL + restX[i] - dx / 2, by - 3, dx + 0.5, 6); }
    ctx.fill();
  }

  // --- labels "Vùng nén" / "Vùng giãn" at the centres (cos = +1 / −1); centres travel with the wave.
  // One row if both fit side by side, else giãn goes to an upper row with a thin leader to its bar.
  if (state.labels && !L.tiny) {
    ctx.font = font(fs, 700);
    const short = L.layout === 'stack', tN = short ? 'Nén' : 'Vùng nén', tG = short ? 'Giãn' : 'Vùng giãn';
    const wN = textW(ctx, tG) + 14, ly = by - 17;
    const oneRow = lam / 2 >= wN + 6, every = lam >= wN + 6 ? 1 : 2;
    const showG = oneRow || lam / 2 >= wN / 2 + 6, gy = oneRow ? ly : ly - 23;
    for (let n = Math.ceil(cyc - airW / lam - 0.5); n <= Math.floor(cyc) + 1; n++) {
      if (n % every) continue;                                 // parity keeps each label attached to its own centre
      const xc = lam * (cyc - n);
      if (n >= 1 && xc > 16 && xc < airW - 16) pill(ctx, tN, airL + xc, ly, {size: fs, fill: C.comp, stroke: C.comp, color: '#fff'});
      const xg = xc - lam / 2;                                 // n = 0 is the front itself (half a compression): no label
      if (showG && n >= 0 && xg > 16 && xg < airW - 16 && xg <= front) {
        if (!oneRow) { ctx.strokeStyle = C.rare; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(airL + xg, gy + 8); ctx.lineTo(airL + xg, by - 4); ctx.stroke(); }
        pill(ctx, tG, airL + xg, gy, {size: fs, fill: C.rare, stroke: C.rare, color: '#fff'});
      }
    }
  }

  // --- λ ruler between two consecutive compression centres (kept in place for several periods: no jitter).
  // rulerN counts half-periods: even = compression centres, odd = rarefaction centres (used only while no compression pair fits).
  const xAt = m => lam * (cyc - m / 2);
  const ok = m => { const x = xAt(m); return m >= 2 && x >= dx * 0.5 && x + lam <= Math.min(front, airW - dx * 0.5); };
  let rx = -1;
  if (state.ruler) {
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
  }

  // --- air dots: three flat colour batches (nén / bình thường / giãn)
  for (let pass = 0; pass < 3; pass++) {
    ctx.fillStyle = pass === 0 ? C.neutral : pass === 1 ? C.comp : C.rare;
    ctx.beginPath();
    for (let i = 0; i < cols; i++) {
      const s = wave.s(restX[i]), cls = s > TH ? 1 : s < -TH ? 2 : 0;
      if (cls !== pass) continue;
      const x = airL + restX[i] + wave.u(restX[i]);
      for (let j = 0; j < rows; j++) {
        if (state.track && i === L.trackCol && j === rows - 1) continue;
        const y = fieldTop + (j + 0.5) * dy;
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832);
      }
    }
    ctx.fill();
  }

  // --- one air layer outlined + tracked particle (red) with VTCB tick and ↔ arrow
  if (state.track) {
    const x0 = airL + restX[L.trackCol], x = x0 + wave.u(restX[L.trackCol]);
    ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5;
    ctx.beginPath(); roundRect(ctx, x - dx * 0.46, fieldTop + 1, dx * 0.92, rows * dy - 2, 4); ctx.stroke();
    const yd = fieldTop + (rows - 0.5) * dy;
    ctx.fillStyle = C.track; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, yd, r + 1.6, 0, 6.2832); ctx.fill(); ctx.stroke();
    const ty = fieldBot + 12;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, fieldBot + 3); ctx.lineTo(x0, fieldBot + 20); ctx.stroke();
    const a = Math.max(wave.A, 6);
    arrow(ctx, x0 - a - 5, ty, x0 + a + 5, ty, {color: C.track, width: 2, size: 7, both: true});
    if (state.labels && !L.compact) {
      pill(ctx, 'VTCB', x0, fieldBot + 31, {size: fs - 1, weight: 700, color: C.ink, fill: C.paper, stroke: null, pad: 3});
      const t = L.layout === 'side' && L.airW > 330 ? 'Một lớp không khí: dao động quanh VTCB' : 'Một lớp không khí';
      ctx.font = font(fs - 0.5, 600);
      pill(ctx, t, x0 + dx * 0.6 + a + 8 + textW(ctx, t) / 2 + 3, ty, {size: fs - 0.5, weight: 600, color: C.ink2, fill: C.paper, stroke: null, pad: 3});
    }
  }

  // --- λ ruler bracket under the field (label shows the REAL wavelength)
  if (rx >= 0 && !L.compact) {
    const [n, u] = lenParts(wave.lam);
    ruler(ctx, rx, rx + lam, fieldBot + (L.layout === 'side' ? 56 : 46), 'λ = ' + n + ' ' + u, {size: fs + 0.5, color: C.ink, maxX: L.w - 4});
  }

  // --- figures (source, ear) + legend / caption
  drawArt(ctx);
  if (L.layout === 'side' && !L.compact) {
    const gy = Math.max(fieldBot + 86, L.artBottom + 18);
    legend(ctx, gy);
    if (sel) drawCaption(ctx, L.w / 2, gy + 26, L.w - 24);
    else if (state.labels) {
      text(ctx, 'Các phần tử không khí chỉ dao động quanh VTCB – năng lượng sóng truyền đi, không khí không bị đẩy theo.', L.w / 2, gy + 24, {size: fs - 0.5, weight: 600, color: C.muted});
      text(ctx, 'Chạm vào loa / người nói / tai để xem tên và chức năng từng bộ phận', L.w / 2, gy + 44, {size: fs - 1, weight: 600, color: C.muted});
    }
  }
  if (L.layout === 'stack') drawCaption(ctx, L.w / 2, 51, L.w - 20);
}

function legend(ctx, y) {
  const items = [[C.comp, 'Vùng nén'], [C.neutral, 'Bình thường'], [C.rare, 'Vùng giãn']];
  if (state.track) items.push([C.track, L.phone ? 'Theo dõi' : 'Phần tử theo dõi']);
  let fs = L.fs - 0.5, w = 0;
  for (; fs > 8; fs -= 0.5) {
    ctx.font = font(fs, 600); w = 0;
    for (const [, t] of items) w += 14 + textW(ctx, t) + 16;
    if (w - 16 <= L.w - 12) break;
  }
  let x = L.w / 2 - (w - 16) / 2;
  for (const [col, t] of items) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 5, y, 5, 0, 6.2832); ctx.fill();
    text(ctx, t, x + 14, y, {size: fs, weight: 600, color: C.ink2, align: 'left'});
    x += 14 + textW(ctx, t) + 16;
  }
}

const SRC = {speaker: {names: SPK_NAMES, caps: SPK_CAPS, labels: SPK_LABELS, title: 'Loa'}, talker: {names: TALK_NAMES, caps: TALK_CAPS, labels: TALK_LABELS, title: 'Người nói'}};
const srcFig = () => state.source === 'talker' ? talk : spk;
const clampB = x => Math.max(-1, Math.min(1, x));

function setSel(id, who) {
  sel = id; selWho = id ? who : '';
  spk.sel = talk.sel = ear.sel = null;
  if (id) (who === 'ear' ? ear : srcFig()).sel = id;
  bus.emit('change', {key: 'sel'});
}

function buildLabels(ctx) {
  const key = L.w + 'x' + L.h + state.source + L.layout + state.labels + L.compact;
  if (key === labelKey) return;
  labelKey = key;
  const lab = {src: [], ear: [], tops: {src: 1e9, ear: 1e9}};
  L.lab = lab; L.artBottom = 0;
  const sf = srcFig(), S = SRC[state.source];
  const mk = (tbl, ids, side) => tbl.filter(t => !ids || ids.includes(t[0])).map(t => ({id: t[0], text: t[1], tx: t[2], ty: t[3], side: side || t[4], row: t[5]}));
  for (const f of [sf, ear]) L.artBottom = Math.max(L.artBottom, f.y + f.h * f.s);
  if (L.layout === 'bars' || L.compact || !state.labels) return;
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
  const {fieldTop, fieldBot} = L, sf = srcFig(), show = state.labels && L.layout !== 'bars' && !L.compact;
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
  ear.drawDyn(ctx, clampB(ue / amp) * 4.2, phase, show);
  if (L.layout === 'stack') {                                           // small markers where the air meets source / ear
    ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(L.airL - 6 + u0, fieldTop); ctx.lineTo(L.airL - 6 + u0, fieldBot); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(L.airR + 6 + ue * 0.8, fieldTop); ctx.lineTo(L.airR + 6 + ue * 0.8, fieldBot); ctx.stroke();
  }
  if (!show) return;
  const lab = L.lab; if (!lab) return;
  drawLabels(ctx, lab.src, selWho === 'src' ? sel : null, L.layout === 'stack' ? 10.5 : 11);
  drawLabels(ctx, lab.ear, selWho === 'ear' ? sel : null, L.layout === 'stack' ? 10.5 : 11);
  // headings
  const fs = L.fs + 1;
  if (L.layout === 'side') {
    text(ctx, SRC[state.source].title, (sf.x + L.airL) / 2 + (state.source === 'talker' ? -20 : 0), Math.min(lab.tops.src, sf.y) - 14, {size: fs, weight: 800});
    text(ctx, 'Tai người nghe', (L.airR + L.w) / 2, Math.min(lab.tops.ear, ear.y) - 14, {size: fs, weight: 800});
  } else {
    text(ctx, SRC[state.source].title, sf.x + sf.w * sf.s + 10, sf.y + 8, {size: fs - 1, weight: 800, align: 'left'});
    if (L.h >= 520) text(ctx, 'Tai người nghe', ear.x - 8, ear.y + 8, {size: fs - 1, weight: 800, align: 'right'});
  }
}

// one-line caption of the selected part (shrinks, then wraps onto two lines); a muted hint when nothing is selected (phones)
function drawCaption(ctx, cx, cy, maxW) {
  const caps = selWho === 'ear' ? EAR_CAPS : SRC[state.source].caps;
  const msg = sel && caps[sel];
  if (!msg) { if (L.layout === 'stack') text(ctx, 'Chạm vào hình để xem tên và chức năng', cx, cy, {size: 11, weight: 600, color: C.muted}); return; }
  let fs = L.phone ? 11 : 12.5, lines = [msg];
  ctx.font = font(fs, 700);
  if (textW(ctx, msg) + 24 > maxW) {
    fs = L.phone ? 10.5 : 11.5; ctx.font = font(fs, 700);
    if (textW(ctx, msg) + 24 > maxW) {
      const words = msg.split(' '); let a = '', i = 0;
      while (i < words.length && textW(ctx, a + words[i]) + 24 < maxW * (words.length > 10 ? 0.62 : 1) && textW(ctx, a + words[i]) < textW(ctx, msg) * 0.55 + 20) a += words[i++] + ' ';
      lines = [a.trim(), words.slice(i).join(' ')];
    }
  }
  const lh = fs + 4, w = Math.min(maxW, Math.max(...lines.map(l => textW(ctx, l))) + 24), h = lines.length * lh + 8;
  ctx.beginPath(); roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 8); ctx.fillStyle = C.ink; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, k) => ctx.fillText(l, cx, cy - h / 2 + 4 + lh * (k + 0.5) + 0.5));
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
        toggle('ruler', 'Thước λ', () => state.ruler, v => set('ruler', v)),
        toggle('target', 'Phần tử đỏ', () => state.track, v => set('track', v), 'Theo dõi một phần tử (màu đỏ)'),
        toggle('tag', 'Nhãn', () => state.labels, v => set('labels', v))))
  ];
}

function badges() {
  const out = ['Biên độ được phóng đại'];
  if (L.w) { syncWave(); if (wave.clamped) out.push('λ thực quá ' + (wave.clamped < 0 ? 'nhỏ' : 'lớn') + ' – hình rút gọn'); }
  if (state.f < HEARING.min) out.push('Hạ âm – tai không nghe được');
  else if (state.f > HEARING.max) out.push('Siêu âm – tai không nghe được');
  return out;
}

export default {
  id: 'longitudinal', title: 'Sóng dọc – Sóng âm', short: 'Sóng dọc', icon: 'longitudinal',
  defaults: {get slow() { return niceSlow(state.f); }},
  metrics: () => ({f: state.f, v: SPEED[state.medium] || SPEED.air}),
  features: () => [
    ['Phương dao động', 'Trùng phương truyền sóng (dọc trục x)'],
    ['Phương truyền', 'Từ nguồn âm đến tai người nghe'],
    ['Môi trường', 'Rắn, lỏng, khí – không truyền trong chân không'],
    ['Ví dụ', 'Âm thanh truyền trong không khí']],
  controls, badges, layout, draw,
  update() {}, reset() { rulerN = -1; },
  pointer(x, y) {
    if (L.layout === 'bars' || L.compact) return;
    const lab = L.lab || {src: [], ear: []};
    let id = pickLabel(lab.src, x, y), who = 'src';
    if (!id) { id = pickLabel(lab.ear, x, y); who = 'ear'; }
    if (!id) { id = ear.pick(x, y); who = 'ear'; }
    if (!id) { id = srcFig().pick(x, y); who = 'src'; }
    setSel(id, who);
  },
  escape() { if (sel) setSel(null, ''); }
};
