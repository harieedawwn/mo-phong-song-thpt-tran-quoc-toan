// Sóng mặt: cross-section of water as a grid of particles. Each particle moves on a circle (nước sâu) or ellipse (nước nông):
//   φ = k·x₀ − ωt ;  ξ = −a·sin φ (ngang),  η = b·cos φ (đứng)  → clockwise on screen for a wave moving right.
//   deep:    a = b = A·e^(−k·d)            shallow: a = A·cosh(k(h−d))/sinh(kh), b = A·sinh(k(h−d))/sinh(kh)
// The surface line is drawn through the (displaced) top-row particles, so sharper crests / flatter troughs come out by themselves.
import {state, set} from '../state.js';
import {h, chip, toggle, slider, group, lab, seg, slowControl} from '../ui.js';
import {lenParts, freqParts} from '../fmt.js';
import {clamp, TAU} from '../physics.js';
import {C, font, pill, text, arrow, ruler, head, textW} from '../draw/ink.js';

const F_MIN = 0.2, F_MAX = 2, V_MIN = 0.5, V_MAX = 4, A_MAX = 10;
const SHOW_M = 6;
const W1 = '#a5d8ff', W2 = '#74c0fc', W3 = '#4dabf7', WINK = '#1864ab', BED = '#e9dfc3';
const L = {};
const dec = (x, d = 3) => String(+x.toPrecision(d)).replace('.', ',');
const fPos = f => Math.round(1000 * Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN));
let sx = new Float32Array(0), sy0 = new Float32Array(0);          // dense curve buffers
let ptsX = new Float32Array(0), ptsY = new Float32Array(0);
let rulerKey = '', rulerTxt = '';

// wave parameters for the current frame (px units)
const P = {y0: 100, lam: 100, k: 0.06, w: TAU, front: 0, A: 10, deep: true, hd: 100, kh: 1, t: 0, clamped: 0};

function layout(w, hh) {
  const phone = w < 600;
  L.w = w; L.h = hh; L.phone = phone; L.fs = phone ? 11 : 12.5;
  L.micro = hh < 300;
  L.cols = phone ? 20 : 30; L.rows = phone ? 8 : 10;
  L.dx = w / (L.cols - 0.5);
  L.r = phone ? 3.2 : 3.8;
  L.amax = L.micro ? 14 : clamp(hh * 0.075, 14, 44);
  L.legend = L.micro ? 0 : 52;
  L.top0 = L.micro ? 10 : phone ? 100 : 78;           // room for ruler + crest labels
  L.y0 = L.top0 + L.amax + (L.micro ? 4 : 14);        // rest level of the surface
  L.depthMax = Math.max(60, hh - L.y0 - L.legend - 14);
  const n = Math.ceil(w / 5) + 2;
  if (sx.length < n) { sx = new Float32Array(n); sy0 = new Float32Array(n); }
  const np = L.cols * L.rows;
  if (ptsX.length < np) { ptsX = new Float32Array(np); ptsY = new Float32Array(np); }
}

function syncWave() {
  const lamReal = clamp(state.sv / state.sf, 0.01, 1000);
  const deep = state.deep;
  // drawn wavelength: deep keeps λ/2 inside the picture, shallow wants a long wave over a shallow bed
  const lo = deep ? L.w * 0.2 : L.w * 0.4, hi = deep ? Math.min(L.w * 0.4, 2 * L.depthMax) : L.w * 0.55;
  const raw = lamReal * L.w / SHOW_M;
  const lo2 = Math.min(lo, hi);
  P.lam = clamp(raw, lo2, hi);
  P.clamped = raw < lo2 ? -1 : raw > hi ? 1 : 0;
  P.k = TAU / P.lam; P.w = TAU * state.sf; P.deep = deep;
  P.front = P.lam * state.sf * state.t; P.t = state.t;
  P.hd = deep ? L.depthMax : Math.min(L.depthMax, 0.3 * P.lam);   // depth of the bottom particle row
  P.kh = P.k * P.hd;
  let ampMax = Math.min(P.lam * 0.13, L.amax);
  if (!deep) ampMax = Math.min(ampMax, P.hd * 0.22, 0.6 / P.k / (1 / Math.tanh(P.kh)));   // keep the bed visible and the orbits free of loops
  P.y0 = L.y0 + (deep ? 0 : (L.depthMax - P.hd) * 0.3);
  P.A = Math.max(2.5, state.sA / A_MAX * ampMax);
  L.pxPerM = P.lam / lamReal;
}
// orbit semi-axes (px) at depth d (px below the rest surface)
function axA(d) { return P.deep ? P.A * Math.exp(-P.k * d) : P.A * Math.cosh(P.k * (P.hd - d)) / Math.sinh(P.kh); }
function axB(d) { return P.deep ? P.A * Math.exp(-P.k * d) : P.A * Math.sinh(P.k * (P.hd - d)) / Math.sinh(P.kh); }
const env = x => { const e = (P.front - x) / (P.lam * 0.75); return e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e); };
// displaced position of the particle with rest position (x0, y0 + d)
let ox = 0, oy = 0;
function particle(x0, d) {
  const e = env(x0), ph = P.k * x0 - P.w * P.t;
  ox = x0 - e * axA(d) * Math.sin(ph);
  oy = P.y0 + d - e * axB(d) * Math.cos(ph);
}
function curve(d, n) {        // dense material line at depth d → sx/sy0
  // sample beyond both edges: horizontal particle motion (up to A) must never open a gap at the stage border
  const m = (P.A || 0) * 1.6 + 24, step = (L.w + 2 * m) / (n - 1);
  for (let i = 0; i < n; i++) { particle(-m + i * step, d); sx[i] = ox; sy0[i] = oy; }
}
function pathCurve(ctx, n, move) { for (let i = 0; i < n; i++) (i || !move) ? ctx.lineTo(sx[i], sy0[i]) : ctx.moveTo(sx[i], sy0[i]); }

function orbit(ctx, cx, cy, a, b, arrowOn) {
  ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(a, 0.6), Math.max(b, 0.6), 0, 0, TAU); ctx.stroke();
  if (arrowOn && a > 8) {                     // clockwise: at the right-hand point the motion is downward
    ctx.fillStyle = C.track; head(ctx, cx + a, cy + (b > 5 ? 3 : 0), Math.PI / 2, 7);
  }
}

function draw(ctx) {
  if (!L.w) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, L.w, L.h); ctx.clip();
  try { drawInner(ctx); } finally { ctx.restore(); }
}
function drawInner(ctx) {
  syncWave();
  const {w, fs} = L, y0 = P.y0;
  const cols = P.deep ? L.cols : Math.round(L.cols * 0.72), rows = P.deep ? L.rows : 6, dx = w / (cols - 0.5);
  const dz = P.hd / (rows - 1), n = Math.ceil(w / 5) + 2;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const yBed = y0 + P.hd + (P.deep ? dz * 0.7 : 6);

  // --- water body in 3 stepped blues (material lines at 1/3 and 2/3 of the depth)
  const x1 = w - 3;
  ctx.fillStyle = W1; ctx.beginPath(); curve(0, n); pathCurve(ctx, n, true);
  ctx.lineTo(sx[n - 1], yBed); ctx.lineTo(sx[0], yBed); ctx.closePath(); ctx.fill();
  for (const [f, col] of [[0.34, W2], [0.67, W3]]) {
    ctx.fillStyle = col; ctx.beginPath(); curve(f * P.hd, n); pathCurve(ctx, n, true);
    ctx.lineTo(sx[n - 1], yBed); ctx.lineTo(sx[0], yBed); ctx.closePath(); ctx.fill();
  }
  // seabed / tank bottom
  if (!P.deep) {
    ctx.fillStyle = BED; ctx.fillRect(0, yBed, w, L.h - yBed - L.legend + 6);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, yBed); ctx.lineTo(w, yBed); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#a08a62'; ctx.beginPath();
    for (let x = 14; x < w; x += 26) { ctx.moveTo(x, yBed + 6); ctx.lineTo(x - 7, yBed + 14); }
    ctx.stroke();
  } else {
    ctx.strokeStyle = WINK; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(0, yBed); ctx.lineTo(w, yBed); ctx.stroke(); ctx.setLineDash([]);
  }
  // VTCB level of the surface
  ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(w, y0); ctx.stroke(); ctx.setLineDash([]);

  // --- particles (batched: one path for all neutral dots)
  const tc = Math.max(2, Math.round(cols * 0.3)), tx0 = tc * dx;            // tracked column
  const rowsT = P.deep ? [0, Math.round(P.lam / 4 / dz), Math.round(P.lam / 2 / dz)] : [0, Math.round((rows - 1) / 2), rows - 1];
  const tr = [];
  for (const r of rowsT) { const rr = Math.min(rows - 1, r); if (tr.indexOf(rr) < 0) tr.push(rr); }
  const isT = (i, j) => state.track && i === tc && tr.indexOf(j) >= 0;
  ctx.fillStyle = '#1f2933'; ctx.beginPath();
  for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) {
    if (isT(i, j)) continue;
    particle(i * dx, j * dz);
    ctx.moveTo(ox + L.r, oy); ctx.arc(ox, oy, L.r, 0, TAU);
  }
  ctx.fill();

  // --- surface line through the top-row particles (dense Lagrangian curve – same formula, more points)
  curve(0, n);
  ctx.strokeStyle = WINK; ctx.lineWidth = 3; ctx.beginPath(); pathCurve(ctx, n, true); ctx.stroke();

  // --- tracked column: VTCB tick, orbit, red particle, rotation arrow
  if (state.track) {
    for (const j of tr) {
      const d = j * dz, cy = y0 + d, a = axA(d), b = axB(d);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(tx0 - 4, cy); ctx.lineTo(tx0 + 4, cy); ctx.moveTo(tx0, cy - 4); ctx.lineTo(tx0, cy + 4); ctx.stroke();
      if (state.orbits) { ctx.strokeStyle = C.track; ctx.lineWidth = 1.6; orbit(ctx, tx0, cy, a, b, true); }
    }
    for (const j of tr) {
      particle(tx0, j * dz);
      ctx.fillStyle = C.track; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ox, oy, L.r + 1.8, 0, TAU); ctx.fill(); ctx.stroke();
    }
  }

  // --- phao (float): rides the surface point and its slope, returns to the same place
  const xp = Math.round(cols * 0.7) * dx;
  if (!L.micro) {
    particle(xp, 0); const px = ox, py = oy;
    particle(xp - 6, 0); const ax = ox, ay = oy; particle(xp + 6, 0);
    const ang = Math.atan2(oy - ay, ox - ax);
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(14, -2); ctx.lineTo(10, -12); ctx.lineTo(-10, -12); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.fillStyle = C.red; ctx.fillRect(-6, -12, 12, 10); ctx.strokeRect(-6, -12, 12, 10);
    ctx.restore();
    if (state.labels) pill(ctx, 'Phao', px, py - 30, {size: fs - 1, fill: C.paper, stroke: C.ink2, color: C.ink2});
  }

  // --- labels: crest / trough, direction, λ ruler
  const lam = P.lam, lbl = state.labels && !L.micro;
  const labY = y0 - L.amax - 20;
  if (lbl) {
    const every = Math.max(1, Math.ceil(100 / lam));
    for (let m = 0; m < 40; m += every) {
      const xc = (P.w * P.t) / P.k - m * lam, xh = xc - lam / 2;
      if (xc < 20 && xh < 20) break;
      if (xc >= 30 && xc <= w - 40 && env(xc) > 0.5 && Math.abs(xc - xp) > 62) pill(ctx, 'Đỉnh sóng', xc, y0 - P.A - 16, {size: fs - 1, fill: C.comp, stroke: C.comp, color: '#fff'});
      if (xh >= 30 && xh <= w - 40 && env(xh) > 0.5 && Math.abs(xh - xp) > 62) pill(ctx, 'Hõm sóng', xh, y0 + P.A + 16, {size: fs - 1, fill: C.rare, stroke: C.rare, color: '#fff'});
    }
  }
  if (state.ruler && !L.micro && P.front > 1.5 * lam) {
    const first = (P.w * P.t) / P.k;
    const nn = Math.max(0, Math.ceil((first - (w - 20)) / lam)), xb = first - nn * lam, xa = xb - lam;
    if (xa >= 6 && xb <= w - 6) {
      const key = String(state.sv) + '|' + state.sf;
      if (key !== rulerKey) { rulerKey = key; const [a, b] = lenParts(state.sv / state.sf); rulerTxt = 'λ = ' + a + ' ' + b; }
      ruler(ctx, xa, xb, labY - 14, rulerTxt, {size: fs, maxX: w - 4});
    }
  }
  // legend row (top): propagation arrow + what the orbit means
  if (!L.micro) {
    const ay = L.phone ? 46 : L.top0 - 40;
    arrow(ctx, 10, ay, L.phone ? 34 : 120, ay, {width: 2, size: L.phone ? 7 : 9, color: C.ink2});
    text(ctx, 'Phương truyền sóng', L.phone ? 40 : 128, ay, {size: L.phone ? fs - 1 : fs, weight: 700, align: 'left', color: C.ink2});
    if (!L.phone) text(ctx, 'Quỹ đạo tròn/elip = dao động dọc + dao động ngang', w - 10, ay, {size: fs, weight: 700, align: 'right', color: C.ink2});
    else if (w > 330) text(ctx, 'Dao động dọc + ngang', w - 8, ay, {size: fs - 1, weight: 700, align: 'right', color: C.ink2});
  }
}

function controls() {
  const fVal = h('span', {class: 'val'}), aVal = h('span', {class: 'val'}), vVal = h('span', {class: 'val'});
  const fS = slider({min: 0, max: 1000, label: 'Tần số',
    pos: () => fPos(state.sf),
    apply: p => { const f = F_MIN * Math.pow(F_MAX / F_MIN, p / 1000); set('sf', Math.round(f * 20) / 20); },
    sync: () => { const [, u] = freqParts(state.sf); fVal.replaceChildren(dec(state.sf, 2), h('small', {text: u})); }});
  const aS = slider({min: 1, max: A_MAX, step: 0.5, label: 'Biên độ', pos: () => state.sA, apply: v => set('sA', v),
    sync: () => { aVal.replaceChildren(dec(state.sA, 2), h('small', {text: 'cm'})); }});
  const vS = slider({min: V_MIN * 10, max: V_MAX * 10, step: 1, label: 'Tốc độ truyền sóng', pos: () => Math.round(state.sv * 10), apply: p => set('sv', p / 10),
    sync: () => { vVal.replaceChildren(dec(state.sv, 2), h('small', {text: 'm/s'})); }});
  return [
    group('wave', 'Sóng trên mặt nước',
      h('div', {class: 'lab'}, h('span', {class: 'ic', text: 'Độ sâu'})),
      seg([[true, 'Nước sâu'], [false, 'Nước nông']], () => state.deep, v => set('deep', v), 'Độ sâu của nước'),
      lab('freq', 'Tần số f', fVal), fS,
      h('div', {class: 'chips g4'}, ...[0.5, 1, 1.5, 2].map(f => chip(dec(f), () => state.sf === f, () => set('sf', f), 'sm'))),
      lab('transverse', 'Biên độ A', aVal), aS,
      lab('medium', 'Tốc độ truyền v', vVal), vS,
      ...slowControl()),
    group('show', 'Hiển thị',
      h('div', {class: 'tgs'},
        toggle('pause', 'Dừng hình', () => !state.playing, v => set('playing', !v)),
        toggle('target', 'Theo dõi phần tử', () => state.track, v => set('track', v)),
        toggle('surface', 'Quỹ đạo phần tử', () => state.orbits, v => set('orbits', v)),
        toggle('ruler', 'Thước λ', () => state.ruler, v => set('ruler', v)),
        toggle('tag', 'Nhãn', () => state.labels, v => set('labels', v))))
  ];
}

function badges() {
  const out = ['Biên độ được phóng đại'];
  if (L.w) { syncWave(); if (P.clamped) out.push('λ thực quá ' + (P.clamped < 0 ? 'nhỏ' : 'lớn') + ' – hình rút gọn'); }
  return out;
}

export default {
  id: 'surface', title: 'Sóng mặt', short: 'Sóng mặt', icon: 'surface',
  defaults: {slow: 1},
  metrics: () => ({f: state.sf, v: state.sv}),
  features: () => [
    ['Phương dao động', 'Cả dọc và ngang (quỹ đạo tròn/elip)'],
    ['Phương truyền', 'Dọc theo mặt thoáng →'],
    ['Quỹ đạo', state.deep ? 'Tròn, nhỏ dần khi xuống sâu' : 'Elip, dẹt dần về đáy'],
    ['Ví dụ', 'Sóng trên mặt nước']],
  controls, badges, layout, draw, update() {}, reset() {}
};
