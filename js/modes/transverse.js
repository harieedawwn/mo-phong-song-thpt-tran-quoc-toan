// Sóng ngang – dây: beads on a rope driven by a vibrator at the left end. u(x,t) = A·sin(ωt − kx) for x ≤ front (same model as sóng dọc).
// Bottom strip: u–x snapshot and scrolling u–t trace of the tracked bead (Canvas 2D).
import {state, set} from '../state.js';
import {h, chip, toggle, slider, group, lab, slowControl} from '../ui.js';
import {lenParts, freqParts} from '../fmt.js';
import {clamp, makeWave, TAU} from '../physics.js';
import {C, font, pill, text, arrow, ruler, roundRect, textW} from '../draw/ink.js';

const F_MIN = 0.2, F_MAX = 5, A_MIN = 1, A_MAX = 10, V_MIN = 0.5, V_MAX = 4;
const SHOW_M = 6;                       // the rope region represents 6 m (scale for the drawn λ)
const wave = makeWave();
const L = {};
let ys = new Float32Array(0);
let rulerKey = '', rulerTxt = '';

const fPos = f => Math.round(1000 * Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN));
const dec = (x, d = 3) => String(+x.toPrecision(d)).replace('.', ',');
function niceStep(range, n) {
  const raw = range / n, e = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / e;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * e;
}

function layout(w, hh) {
  const phone = w < 600;
  L.w = w; L.h = hh; L.phone = phone; L.fs = phone ? 11 : 12.5;
  L.tiny = hh < 300;                                   // landscape phone: rope only
  L.graphs = !L.tiny;
  L.micro = hh < 200;                                  // very short stage: rope only, no labels
  const bottom = 64;
  L.band = L.graphs ? clamp((hh - bottom) * (phone ? 0.58 : 0.56), 190, 330) : hh - 8;
  L.top0 = L.tiny ? 36 : phone ? 52 : 42;
  L.ropeL = phone ? 56 : 82; L.ropeR = w - 4; L.ropeW = L.ropeR - L.ropeL;
  L.N = clamp(Math.round(L.ropeW / (phone ? 9 : 14)), 24, 48);
  L.dx = L.ropeW / (L.N - 1);
  L.r = phone ? 3.4 : 4.4;
  const fixed = L.top0 + (phone ? 22 + 26 + 26 + 22 : 28 + 30 + 30 + 24 + 24);   // ruler, label, label, legend (+ arrow row)
  L.amax = L.micro ? clamp((hh - 80) / 2, 6, 30) : clamp((L.band - fixed) / 2, 12, 64);
  L.ppc = L.amax / A_MAX;                              // px per cm of amplitude (enlarged)
  L.cy = L.micro ? hh * 0.52 : L.top0 + (phone ? 22 + 26 : 28 + 30) + L.amax + Math.max(0, (L.band - fixed - 2 * L.amax) / 2);
  L.tI = Math.max(2, Math.round(L.N * 0.2));
  L.gy = L.band + 8; L.gh = hh - bottom - L.gy;
  if (L.gh < 90) L.graphs = false;
  ys = new Float32Array(L.N);
}

function syncWave() {
  const lamReal = clamp(state.tv / state.tf, 0.01, 1000);
  wave.set(state.tf, state.tv, L.ropeW / SHOW_M, 7 * L.dx, L.ropeW * 0.7, state.tA * L.ppc);
  wave.at(state.t);
  L.pxPerM = wave.lamPx / lamReal;                     // effective scale (consistent with the real λ even when clamped)
  L.ropeCm = L.ropeW / L.pxPerM * 100;
}
// normalised displacement sin(ωt − kx) at rest position x (px) and time tt, with the front condition
const sinAt = (x, tt) => (tt <= 0 || x > wave.lamPx * wave.f * tt) ? 0 : Math.sin(wave.w * tt - wave.k * x);

function drawGraph(ctx, g, kind) {
  const {x, y, w, h} = g, fs = L.phone ? 10 : 11.5;
  ctx.beginPath(); roundRect(ctx, x, y, w, h, 8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.ink2; ctx.stroke();
  text(ctx, kind === 'x' ? (L.phone ? 'u–x' : 'Li độ – quãng đường (u–x)') : (L.phone ? 'u–t' : 'Li độ – thời gian (u–t), phần tử đỏ'), x + 10, y + 12, {size: fs + 0.5, weight: 700, align: 'left', color: C.ink});
  const pl = x + 40, pr = x + w - 12, pt = y + 26, pb = y + h - 34, pw = pr - pl, ph = pb - pt, cy = (pt + pb) / 2;
  const A = state.tA, ys0 = niceStep(2 * A * 1.2, 4), ymax = Math.ceil(A * 1.1 / ys0) * ys0;
  const X0 = kind === 'x' ? 0 : state.t - 3 / wave.f, X1 = kind === 'x' ? L.ropeCm : state.t;
  const px = v => pl + (v - X0) / (X1 - X0) * pw, py = v => cy - v / ymax * (ph / 2);
  ctx.lineWidth = 1; ctx.strokeStyle = C.line; ctx.beginPath();
  for (let v = -ymax; v <= ymax + 1e-9; v += ys0) { const yy = Math.round(py(v)) + 0.5; ctx.moveTo(pl, yy); ctx.lineTo(pr, yy); }
  const xs = niceStep(X1 - X0, L.phone ? 3 : 5);
  for (let v = Math.ceil(X0 / xs) * xs; v <= X1 + 1e-9; v += xs) { const xx = Math.round(px(v)) + 0.5; ctx.moveTo(xx, pt); ctx.lineTo(xx, pb); }
  ctx.stroke();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pl, cy); ctx.lineTo(pr, cy); ctx.moveTo(pl, pt); ctx.lineTo(pl, pb); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.font = font(fs, 700, true);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let v = -ymax; v <= ymax + 1e-9; v += ys0) ctx.fillText(dec(v, 2), pl - 4, py(v) + 0.5);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let v = Math.ceil(X0 / xs) * xs; v <= X1 + 1e-9; v += xs) ctx.fillText(dec(v, 3), px(v), pb + 4);
  text(ctx, kind === 'x' ? 'x (cm)' : 't (s)', pl + pw / 2, y + h - 9, {size: fs, weight: 700, color: C.muted, mono: true});
  ctx.save(); ctx.translate(x + 11, cy); ctx.rotate(-Math.PI / 2); text(ctx, 'u (cm)', 0, 0, {size: fs, weight: 700, color: C.muted, mono: true}); ctx.restore();
  // curve
  ctx.strokeStyle = C.rare; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
  const n = Math.max(20, Math.round(pw / 2)), xt = L.tI * L.dx;
  for (let j = 0; j <= n; j++) {
    const f = j / n, u = kind === 'x' ? sinAt(f * L.ropeW, state.t) : sinAt(xt, X0 + f * (X1 - X0));
    const yy = py(u * A), xx = pl + f * pw; j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
  }
  ctx.stroke();
  if (state.track) {
    ctx.fillStyle = C.track; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
    const dot = (f, u) => { ctx.beginPath(); ctx.arc(pl + f * pw, py(u * A), 4, 0, TAU); ctx.fill(); ctx.stroke(); };
    if (kind === 'x') { dot(xt / L.ropeW, sinAt(xt, state.t)); if (L.x2 != null) dot(L.x2 / L.ropeW, sinAt(L.x2, state.t)); }
    else dot(1, sinAt(xt, state.t));
  }
}

function draw(ctx) {
  if (!L.w) return;
  syncWave();
  const {ropeL, ropeR, ropeW, N, dx, cy, fs, r} = L;
  const lbl = state.labels && !L.micro;
  const lam = wave.lamPx, front = wave.front, apx = state.tA * L.ppc;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (let i = 0; i < N; i++) ys[i] = cy - wave.u(i * dx);
  const xt = L.tI * dx;
  // second bead one λ away (in phase with the tracked one)
  L.x2 = xt + lam <= ropeW - 8 ? xt + lam : xt - lam >= 8 ? xt - lam : null;

  // --- VTCB line
  ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(ropeL, cy); ctx.lineTo(L.w, cy); ctx.stroke(); ctx.setLineDash([]);
  if (lbl && !L.phone) text(ctx, 'VTCB', L.w - 28, cy + 12, {size: 10.5, weight: 700, color: C.muted});

  // --- oscillation direction of the tracked bead
  if (state.track) arrow(ctx, ropeL + xt, cy - apx - 12, ropeL + xt, cy + apx + 12, {color: C.track, width: 1.5, size: 7, both: true});

  // --- rope + beads
  ctx.strokeStyle = C.ink2; ctx.lineWidth = 2.2; ctx.beginPath();
  ctx.moveTo(ropeL - 4, ys[0]);
  for (let i = 0; i < N; i++) ctx.lineTo(ropeL + i * dx, ys[i]);
  ctx.lineTo(L.w, ys[N - 1]); ctx.stroke();
  ctx.fillStyle = C.neutral; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < N; i++) { if (state.track && i === L.tI) continue; ctx.moveTo(ropeL + i * dx + r, ys[i]); ctx.arc(ropeL + i * dx, ys[i], r, 0, TAU); }
  ctx.fill(); ctx.stroke();
  if (state.track) {
    ctx.fillStyle = C.track; ctx.beginPath(); ctx.arc(ropeL + xt, ys[L.tI], r + 1.2, 0, TAU); ctx.fill(); ctx.stroke();
    if (L.x2 != null) {
      const y2 = cy - wave.u(L.x2), a = Math.min(xt, L.x2) + ropeL, b = Math.max(xt, L.x2) + ropeL;
      ctx.strokeStyle = C.track; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(a, ys[L.tI]); ctx.lineTo(b, y2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.track; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ropeL + L.x2, y2, r + 1.2, 0, TAU); ctx.fill(); ctx.stroke();
    }
  }

  // --- vibrator (cần rung): body + slot + rod to the first bead
  const bh = Math.min(L.band - L.top0 - 20, 2 * L.amax + 30), bw = L.phone ? 30 : 40, bx = 6;
  ctx.beginPath(); roundRect(ctx, bx, cy - bh / 2, bw, bh, 6); ctx.fillStyle = '#dfe3e8'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.fillStyle = C.ink2; ctx.fillRect(bx + bw - 8, cy - bh / 2 + 8, 5, bh - 16);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx + bw - 6, ys[0]); ctx.lineTo(ropeL, ys[0]); ctx.stroke();
  if (lbl && cy + bh / 2 + 12 < L.band - 36) text(ctx, 'Cần rung', L.phone ? 3 : bx, cy + bh / 2 + 12, {size: L.phone ? 10 : 11, weight: 700, align: 'left', color: C.ink2});

  // --- đỉnh sóng / hõm sóng labels (positions from the same sin(ωt − kx) → crests at front − λ/4 − nλ)
  if (lbl) {
    const every = Math.max(1, Math.ceil(92 / lam));
    for (let n = 0; n < 40; n += every) {
      const xc = front - lam / 4 - n * lam, xh = front - 3 * lam / 4 - n * lam;
      if (xc < 14 && xh < 14) break;
      if (xc >= 14 && xc <= ropeW - 24) pill(ctx, 'Đỉnh sóng', ropeL + xc, cy - apx - 18, {size: fs - 1, fill: C.comp, stroke: C.comp, color: '#fff'});
      if (xh >= 14 && xh <= ropeW - 24) pill(ctx, 'Hõm sóng', ropeL + xh, cy + apx + 18, {size: fs - 1, fill: C.rare, stroke: C.rare, color: '#fff'});
    }
  }

  // --- λ ruler between two consecutive crests (the pair jumps back by one λ when the first crest leaves the rope)
  if (state.ruler && !L.micro && front > 5 * lam / 4 + 4) {
    const n = Math.max(0, Math.ceil((front - lam / 4 - (ropeW - 20)) / lam)), x1 = front - lam / 4 - (n + 1) * lam, x2 = front - lam / 4 - n * lam;
    if (x1 >= 4 && x2 <= ropeW - 4) {
      const key = String(state.tv) + '|' + state.tf;
      if (key !== rulerKey) { rulerKey = key; const [a, b] = lenParts(state.tv / state.tf); rulerTxt = 'λ = ' + a + ' ' + b; }
      ruler(ctx, ropeL + x1, ropeL + x2, cy - apx - (L.phone ? 44 : 50), rulerTxt, {size: fs, color: C.ink, maxX: L.w - 4});
    }
  }

  // --- legend row (propagation arrow, oscillation arrow, in-phase pair)
  const ly = L.band - 16, ay = L.phone ? ly : ly - 26;
  if (!L.phone && !L.micro) {
    arrow(ctx, ropeL, ay, L.w - 12, ay, {width: 2, size: 9, color: C.ink2});
    if (state.labels) pill(ctx, 'Phương truyền sóng', ropeL + ropeW / 2, ay, {size: fs, fill: C.paper, stroke: null, color: C.ink2});
  }
  if (lbl) {
    ctx.font = font(fs, 700);
    const items = [['v', 'Phương dao động'], ['h', 'Phương truyền sóng'], ['p', 'Cùng pha (cách nhau λ)']];
    const keep = L.phone ? items : [items[0], items[2]];
    let total = 0; for (const it of keep) total += textW(ctx, it[1]) + 36;
    let xx = L.phone && total > L.w - 12 ? 8 : Math.max(8, (L.w - total) / 2);
    for (const [k, t] of keep) {
      const tw = textW(ctx, t);
      if (xx + tw + 28 > L.w - 4) break;
      if (k === 'v') arrow(ctx, xx + 6, ly - 8, xx + 6, ly + 8, {width: 1.8, size: 6, color: C.track, both: true});
      else if (k === 'h') arrow(ctx, xx, ly, xx + 14, ly, {width: 1.8, size: 6, color: C.ink2});
      else { ctx.fillStyle = C.track; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; for (const o of [0, 11]) { ctx.beginPath(); ctx.arc(xx + 3 + o, ly, 4, 0, TAU); ctx.fill(); ctx.stroke(); } }
      text(ctx, t, xx + (k === 'p' ? 24 : 20), ly, {size: fs, weight: 700, align: 'left', color: C.ink2});
      xx += tw + 36;
    }
  }

  // --- graphs
  if (L.graphs) {
    const gap = 10, gw = (L.w - 24 - gap) / 2;
    drawGraph(ctx, {x: 12, y: L.gy, w: gw, h: L.gh}, 'x');
    drawGraph(ctx, {x: 12 + gw + gap, y: L.gy, w: gw, h: L.gh}, 't');
  }
}

function controls() {
  const fVal = h('span', {class: 'val'}), aVal = h('span', {class: 'val'}), vVal = h('span', {class: 'val'});
  const fS = slider({min: 0, max: 1000, label: 'Tần số',
    pos: () => fPos(state.tf),
    apply: p => { const f = F_MIN * Math.pow(F_MAX / F_MIN, p / 1000); set('tf', f < 1 ? Math.round(f * 10) / 10 : Math.round(f * 2) / 2); },
    sync: () => { const [n, u] = freqParts(state.tf); fVal.replaceChildren(dec(state.tf, 2), h('small', {text: u})); }});
  const aS = slider({min: A_MIN, max: A_MAX, step: 0.5, label: 'Biên độ', pos: () => state.tA, apply: v => set('tA', v),
    sync: () => { aVal.replaceChildren(dec(state.tA, 2), h('small', {text: 'cm'})); }});
  const vS = slider({min: V_MIN * 10, max: V_MAX * 10, step: 1, label: 'Tốc độ truyền sóng', pos: () => Math.round(state.tv * 10), apply: p => set('tv', p / 10),
    sync: () => { vVal.replaceChildren(dec(state.tv, 2), h('small', {text: 'm/s'})); }});
  return [
    group('wave', 'Sóng trên dây',
      lab('freq', 'Tần số f', fVal), fS,
      h('div', {class: 'chips g4'}, ...[0.5, 1, 2, 4].map(f => chip(dec(f), () => state.tf === f, () => set('tf', f), 'sm'))),
      lab('transverse', 'Biên độ A', aVal), aS,
      lab('medium', 'Tốc độ truyền v', vVal), vS,
      ...slowControl()),
    group('show', 'Hiển thị',
      h('div', {class: 'tgs'},
        toggle('pause', 'Dừng hình', () => !state.playing, v => set('playing', !v)),
        toggle('ruler', 'Thước λ', () => state.ruler, v => set('ruler', v)),
        toggle('target', 'Theo dõi phần tử', () => state.track, v => set('track', v)),
        toggle('tag', 'Nhãn', () => state.labels, v => set('labels', v))))
  ];
}

function badges() {
  const out = ['Biên độ được phóng đại'];
  if (L.w) { syncWave(); if (wave.clamped) out.push('λ thực quá ' + (wave.clamped < 0 ? 'nhỏ' : 'lớn') + ' – hình rút gọn'); }
  return out;
}

export default {
  id: 'transverse', title: 'Sóng ngang', short: 'Sóng ngang', icon: 'transverse',
  defaults: {slow: 1},
  metrics: () => ({f: state.tf, v: state.tv}),
  features: () => [
    ['Phương dao động', 'Vuông góc phương truyền sóng'],
    ['Phương truyền', 'Dọc theo sợi dây →'],
    ['Môi trường', 'Chất rắn, mặt chất lỏng'],
    ['Ví dụ', 'Sóng trên sợi dây']],
  controls, badges, layout, draw, update() {}, reset() {}
};
