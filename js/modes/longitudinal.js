// Sóng dọc – Sóng âm: air layers (dot grid) displaced along x by u(x,t); colours from −∂u/∂x (vùng nén / vùng giãn).
import {state, set} from '../state.js';
import {h, seg, chip, toggle, slider, group, lab, slowControl} from '../ui.js';
import {lenParts, freqParts} from '../fmt.js';
import {SPEED, MEDIUM, HEARING, clamp, describePitch, niceSlow, makeWave} from '../physics.js';
import {C, font, pill, text, arrow, ruler, roundRect, textW} from '../draw/ink.js';

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

function layout(w, hh) {
  const phone = w < 600;
  L.w = w; L.h = hh; L.phone = phone;
  L.fs = phone ? 11 : 12.5;
  L.cols = phone ? 28 : 40; L.rows = phone ? 10 : 12;
  const side = phone ? Math.max(44, w * 0.12) : clamp(w * 0.14, 86, 150);
  L.srcR = side; L.earL = w - side - (phone ? 4 : 6);
  L.airL = L.srcR + (phone ? 8 : 16); L.airR = L.earL - (phone ? 8 : 16);
  L.airW = L.airR - L.airL;
  L.dx = L.airW / L.cols;
  // compact = short stage (phone with the control sheet open): only labels + field
  L.compact = hh < 440; L.tiny = hh < 240;          // tiny = landscape phone: field only
  const top = L.tiny ? 4 : L.compact ? 8 : phone ? 78 : 46, bottom = L.compact ? 66 : phone ? 72 : 76;
  const above = L.tiny ? 16 : L.compact ? 62 : phone ? 80 : 88, below = L.compact ? 6 : phone ? 118 : 112;
  const avail = hh - top - bottom - above - below;
  L.dy = clamp(avail / L.rows, 8, Math.min(26, L.dx * (phone ? 2.4 : 1.9)));
  const block = above + L.rows * L.dy + below;
  L.fieldTop = top + Math.max(0, (hh - top - bottom - block) / 2) + above;
  L.fieldBot = L.fieldTop + L.rows * L.dy;
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
  syncWave();
  const {airL, airW, dx, dy, fieldTop, fieldBot, cols, rows, r, fs} = L;
  const lam = wave.lamPx, cyc = wave.cycles(), front = wave.front;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // --- propagation direction
  const ay = fieldTop - (L.phone ? 70 : 76);
  if (!L.compact) arrow(ctx, airL, ay, L.airR, ay, {width: 2, size: 9, color: C.ink2});
  if (state.labels && !L.compact) pill(ctx, 'Phương truyền sóng', airL + airW / 2, ay, {size: fs, fill: C.paper, stroke: null, color: C.ink2});

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
    const wN = textW(ctx, 'Vùng giãn') + 14, ly = by - 17;
    const oneRow = lam / 2 >= wN + 6, every = lam >= wN + 6 ? 1 : 2;
    const showG = oneRow || lam / 2 >= wN / 2 + 6, gy = oneRow ? ly : ly - 23;
    for (let n = Math.ceil(cyc - airW / lam - 0.5); n <= Math.floor(cyc) + 1; n++) {
      if (n % every) continue;                                 // parity keeps each label attached to its own centre
      const xc = lam * (cyc - n);
      if (n >= 1 && xc > 16 && xc < airW - 16) pill(ctx, 'Vùng nén', airL + xc, ly, {size: fs, fill: C.comp, stroke: C.comp, color: '#fff'});
      const xg = xc - lam / 2;                                 // n = 0 is the front itself (half a compression): no label
      if (showG && n >= 0 && xg > 16 && xg < airW - 16 && xg <= front) {
        if (!oneRow) { ctx.strokeStyle = C.rare; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(airL + xg, gy + 8); ctx.lineTo(airL + xg, by - 4); ctx.stroke(); }
        pill(ctx, 'Vùng giãn', airL + xg, gy, {size: fs, fill: C.rare, stroke: C.rare, color: '#fff'});
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
      rx = airL + xAt(rulerN); const gl = L.compact ? 0 : 64;
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
      const t = L.phone ? 'Lớp không khí' : 'Một lớp không khí: dao động quanh VTCB';
      ctx.font = font(fs - 0.5, 600);
      pill(ctx, t, x0 + dx * 0.6 + a + 8 + textW(ctx, t) / 2 + 3, ty, {size: fs - 0.5, weight: 600, color: C.ink2, fill: C.paper, stroke: null, pad: 3});
    }
  }

  // --- λ ruler bracket under the field (label shows the REAL wavelength)
  if (rx >= 0 && !L.compact) {
    const [n, u] = lenParts(wave.lam);
    ruler(ctx, rx, rx + lam, fieldBot + 56, 'λ = ' + n + ' ' + u, {size: fs + 0.5, color: C.ink});
  }

  // --- legend + caption
  const gy = fieldBot + (L.phone ? 84 : 86);
  if (!L.compact) legend(ctx, gy);
  if (state.labels && !L.compact) text(ctx, L.phone ? 'Phần tử chỉ dao động quanh VTCB; năng lượng được truyền đi.' : 'Các phần tử không khí chỉ dao động quanh VTCB – năng lượng sóng truyền đi, không khí không bị đẩy theo.',
    L.w / 2, gy + (L.phone ? 22 : 24), {size: fs - 0.5, weight: 600, color: C.muted});

  drawSource(ctx);
  drawEar(ctx);
}

function legend(ctx, y) {
  const fs = L.fs - 0.5, items = [[C.comp, 'Vùng nén'], [C.neutral, 'Bình thường'], [C.rare, 'Vùng giãn']];
  if (state.track) items.push([C.track, 'Phần tử theo dõi']);
  ctx.font = font(fs, 600);
  let w = 0; for (const [, t] of items) w += 14 + textW(ctx, t) + 16;
  let x = L.w / 2 - (w - 16) / 2;
  for (const [col, t] of items) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 5, y, 5, 0, 6.2832); ctx.fill();
    text(ctx, t, x + 14, y, {size: fs, weight: 600, color: C.ink2, align: 'left'});
    x += 14 + textW(ctx, t) + 16;
  }
}

// Placeholder source (replaced by flat loudspeaker / talker art in Phase 2): the cone face moves with u(0,t).
function drawSource(ctx) {
  const {fieldTop, fieldBot, airL} = L, cy = (fieldTop + fieldBot) / 2, hh = Math.min(fieldBot - fieldTop, 150);
  const u0 = wave.u(0) * 0.8, x0 = 8, face = airL - 6 + u0;
  ctx.lineWidth = 2; ctx.strokeStyle = C.ink2;
  if (state.source === 'speaker') {
    const bw = Math.min(34, (L.srcR - 8) * 0.4), bh = hh * 0.36;
    ctx.fillStyle = '#868e96'; ctx.beginPath(); roundRect(ctx, x0 + 4, cy - bh / 2, bw, bh, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ced4da'; ctx.beginPath();
    ctx.moveTo(x0 + 4 + bw, cy - bh * 0.32); ctx.lineTo(face, cy - hh / 2); ctx.lineTo(face, cy + hh / 2); ctx.lineTo(x0 + 4 + bw, cy + bh * 0.32); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(face, cy - hh / 2); ctx.lineTo(face, cy + hh / 2); ctx.stroke();
    text(ctx, 'Loa', (x0 + face) / 2, cy + hh / 2 + 16, {size: L.fs, weight: 800});
  } else {
    ctx.fillStyle = '#f3c9b1'; ctx.strokeStyle = '#9c5b43';
    ctx.beginPath(); roundRect(ctx, x0, cy - hh / 2, face - x0, hh, 14); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = '#c2255c'; ctx.beginPath(); ctx.moveTo(face, cy - 12); ctx.lineTo(face, cy + 12); ctx.stroke();
    text(ctx, 'Người nói', Math.max((x0 + face) / 2, L.phone ? 30 : 0), cy + hh / 2 + 16, {size: L.fs, weight: 800});
  }
}
// Placeholder ear (Phase 2 draws the anatomy): the eardrum moves with the arriving wave u(x_ear, t).
function drawEar(ctx) {
  const {fieldTop, fieldBot, earL, w} = L, cy = (fieldTop + fieldBot) / 2, hh = Math.min(fieldBot - fieldTop, 150);
  const ue = wave.u(L.airR - L.airL + 6) * 0.8, x = earL + 4 + ue;
  ctx.fillStyle = '#f3c9b1'; ctx.strokeStyle = '#9c5b43'; ctx.lineWidth = 2;
  ctx.beginPath(); roundRect(ctx, earL, cy - hh / 2, w - 8 - earL, hh, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f4b183'; ctx.strokeStyle = '#9c5b43';
  ctx.beginPath(); ctx.ellipse(x + 3, cy, 4, Math.min(22, hh * 0.18), 0, 0, 6.2832); ctx.fill(); ctx.stroke();
  text(ctx, 'Tai', (earL + w - 8) / 2, cy + hh / 2 + 16, {size: L.fs, weight: 800});
  if (!L.phone) text(ctx, 'Màng nhĩ', x + 10, cy - Math.min(22, hh * 0.18) - 10, {size: L.fs - 1.5, weight: 600, color: C.ink2, align: 'left'});
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
        toggle('target', 'Theo dõi phần tử', () => state.track, v => set('track', v)),
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
  update() {}, reset() { rulerN = -1; }
};
