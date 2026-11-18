// Sóng mặt: cross-section of water as a grid of particles. Each particle moves on a circle (nước sâu) or ellipse (nước nông):
//   φ = k·x₀ − ωt ;  ξ = −a·sin φ (ngang),  η = b·cos φ (đứng)  → clockwise on screen for a wave moving right.
//   deep:    a = b = A·e^(−k·d)            shallow: a = A·cosh(k(h−d))/sinh(kh), b = A·sinh(k(h−d))/sinh(kh)
// The surface line is drawn through the (displaced) top-row particles, so sharper crests / flatter troughs come out by themselves.
import {state, set, bus} from '../state.js';
import {h, chip, toggle, slider, group, lab, seg, slowControl} from '../ui.js';
import {lenParts, freqParts, slowText} from '../fmt.js';
import {clamp, TAU} from '../physics.js';
import {C, font, pill, text, arrow, ruler, head, textW} from '../draw/ink.js';
import {ball, drawBall, BALL, ballDpr} from '../draw/ball.js';
import {loadArt} from '../art/sprite.js';

const duck = loadArt('duck');      // rubber duck riding the surface (replaces the old phao)
duck.ready.then(() => { bus.emit('change', {key: 'art'}); });

const F_MIN = 0.2, F_MAX = 2, V_MIN = 0.5, V_MAX = 4, A_MAX = 10;
const SHOW_M = 6;
const WINK = '#1864ab', BED = '#e9dfc3';
let wGrad = null, wKey = '', bGrad = null, bKey = '', spr = null;   // cached gradients (rebuilt only when the geometry changes) + sphere sprites
function waterGrad(ctx, y0, y1) {
  const k = y0.toFixed(1) + '|' + y1.toFixed(1);
  if (k !== wKey || !wGrad) { wKey = k; wGrad = ctx.createLinearGradient(0, y0 - 30, 0, y1); wGrad.addColorStop(0, '#d0ebff'); wGrad.addColorStop(0.5, '#a5d8ff'); wGrad.addColorStop(1, '#74c0fc'); }
  return wGrad;
}
function bedGrad(ctx, y0, y1) {
  const k = y0.toFixed(1) + '|' + y1.toFixed(1);
  if (k !== bKey || !bGrad) { bKey = k; bGrad = ctx.createLinearGradient(0, y0, 0, y1); bGrad.addColorStop(0, '#eadfc0'); bGrad.addColorStop(1, '#c9b78a'); }
  return bGrad;
}
const L = {};
const dec = (x, d = 3) => String(+x.toPrecision(d)).replace('.', ',');
const fPos = f => Math.round(1000 * Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN));
let sx = new Float32Array(0), sy0 = new Float32Array(0);          // dense curve buffers
let ptsX = new Float32Array(0), ptsY = new Float32Array(0);

// wave parameters for the current frame (px units)
const Z = {cols: 0, rows: 0, dx: 0, dz: 0, tx0: 0, tr: [], xp: 0};   // per-frame geometry shared with annotate()
const P = {y0: 100, lam: 100, k: 0.06, w: TAU, front: 0, A: 10, deep: true, hd: 100, kh: 1, t: 0, clamped: 0};

function layout(w, hh) {
  const phone = w < 600;
  L.w = w; L.h = hh; L.phone = phone; L.fs = phone ? 11 : 12.5;
  L.micro = hh < 300;
  L.cols = phone ? 20 : 30; L.rows = phone ? 8 : 10;
  L.dx = w / (L.cols - 0.5);
  L.r = phone ? 3.5 : 4.2; spr = null;
  L.ds = (phone ? 38 : 50) / 64; duck.render(L.ds, ballDpr());
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
  ctx.setLineDash([5, 4]);                                       // dashed outline (orbit is a path, not a solid object)
  ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(a, 0.6), Math.max(b, 0.6), 0, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);
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
  // deep water continues below the picture: fill to the stage bottom (no gap); shallow water ends on the bed
  const yBed = P.deep ? L.h + 2 : y0 + P.hd + 6;

  // --- water body: one vertical gradient under the surface curve
  ctx.fillStyle = waterGrad(ctx, y0, yBed); ctx.beginPath(); curve(0, n); pathCurve(ctx, n, true);
  ctx.lineTo(sx[n - 1], yBed); ctx.lineTo(sx[0], yBed); ctx.closePath(); ctx.fill();
  // seabed / tank bottom
  if (!P.deep) {
    ctx.fillStyle = bedGrad(ctx, yBed, L.h); ctx.fillRect(0, yBed, w, L.h - yBed + 2);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, yBed); ctx.lineTo(w, yBed); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#a08a62'; ctx.beginPath();
    for (let x = 14; x < w; x += 26) { ctx.moveTo(x, yBed + 6); ctx.lineTo(x - 7, yBed + 14); }
    ctx.stroke();
  }
  // --- particles (batched: one path for all neutral dots)
  const tc = Math.max(2, Math.round(cols * 0.3)), tx0 = tc * dx;            // tracked column
  const rowsT = P.deep ? [0, Math.round(P.lam / 4 / dz), Math.round(P.lam / 2 / dz)] : [0, Math.round((rows - 1) / 2), rows - 1];
  const tr = [];
  for (const r of rowsT) { const rr = Math.min(rows - 1, r); if (tr.indexOf(rr) < 0) tr.push(rr); }
  Z.cols = cols; Z.rows = rows; Z.dx = dx; Z.dz = dz; Z.tx0 = tx0; Z.tr = tr; Z.xp = Math.round(cols * 0.7) * dx;
  const isT = (i, j) => state.track && i === tc && tr.indexOf(j) >= 0;
  if (!spr) spr = [ball(BALL.blue, L.r), ball(BALL.red, L.r + 1.8)];
  const sb = spr[0];
  for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) {
    if (isT(i, j)) continue;
    particle(i * dx, j * dz);
    drawBall(ctx, sb, ox, oy);
  }

  // --- surface line through the top-row particles (dense Lagrangian curve – same formula, more points)
  curve(0, n);
  ctx.strokeStyle = WINK; ctx.lineWidth = 3.4; ctx.beginPath(); pathCurve(ctx, n, true); ctx.stroke();
  ctx.save(); ctx.translate(0, -1.2); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.1; ctx.beginPath(); pathCurve(ctx, n, true); ctx.stroke(); ctx.restore();   // glossy highlight

  // --- tracked column: VTCB tick, orbit, red particle, rotation arrow
  if (state.track) {
    for (const j of tr) {
      const d = j * dz, cy = y0 + d, a = axA(d), b = axB(d);
      if (state.orbits) { ctx.strokeStyle = C.track; ctx.lineWidth = 1.6; orbit(ctx, tx0, cy, a, b, true); }
    }
    for (const j of tr) {
      particle(tx0, j * dz);
      drawBall(ctx, spr[1], ox, oy);
    }
  }

  // --- rubber duck: rides the surface point and its slope, returns to the same place
  const xp = Math.round(cols * 0.7) * dx;
  if (!L.micro) {
    particle(xp, 0); const px = ox, py = oy;
    particle(xp - 6, 0); const ax = ox, ay = oy; particle(xp + 6, 0);
    const ang = Math.atan2(oy - ay, ox - ax), wp = duck.pt('a-water') || {x: 30, y: 44};
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
    duck.draw(ctx, -wp.x * L.ds, -wp.y * L.ds);
    ctx.restore();
  }
}

function readout() {
  return 'Hình đã làm chậm ' + slowText(state.slow) + ' · biên độ phóng đại' + (P.clamped ? ' · λ vẽ rút gọn' : '');
}

// words, ruler, VTCB marks: only while paused (main.js calls it right after draw(); fx.a fades it in)
function annotate(ctx) {
  if (!L.w) return;
  const {w, fs} = L, y0 = P.y0, lam = P.lam, {dz, tx0, tr, xp} = Z;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // VTCB level of the surface
  ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(w, y0); ctx.stroke(); ctx.setLineDash([]);
  if (!P.deep && !L.micro) pill(ctx, 'Đáy nước nông', w / 2, y0 + P.hd + 34, {size: fs - 1, fill: '#fff', stroke: '#a08a62', color: '#6b5a3a'});
  // VTCB crosses of the tracked particles
  if (state.track) {
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.beginPath();
    for (const j of tr) { const cy = y0 + j * dz; ctx.moveTo(tx0 - 4, cy); ctx.lineTo(tx0 + 4, cy); ctx.moveTo(tx0, cy - 4); ctx.lineTo(tx0, cy + 4); }
    ctx.stroke();
  }
  if (L.micro) return;
  // phao
  particle(xp, 0); pill(ctx, 'Vịt cao su', ox, oy - 40, {size: fs - 1});
  // đỉnh sóng / hõm sóng
  const every = Math.max(1, Math.ceil(100 / lam));
  for (let m = 0; m < 40; m += every) {
    const xc = (P.w * P.t) / P.k - m * lam, xh = xc - lam / 2;
    if (xc < 20 && xh < 20) break;
    if (xc >= 30 && xc <= w - 40 && env(xc) > 0.5 && Math.abs(xc - xp) > 62) pill(ctx, 'Đỉnh sóng', xc, y0 - P.A - 16, {size: fs - 1, fill: C.comp, stroke: C.comp, color: '#fff'});
    if (xh >= 30 && xh <= w - 40 && env(xh) > 0.5 && Math.abs(xh - xp) > 62) pill(ctx, 'Hõm sóng', xh, y0 + P.A + 16, {size: fs - 1, fill: C.rare, stroke: C.rare, color: '#fff'});
  }
  // λ ruler (real value)
  if (P.front > 1.5 * lam) {
    const first = (P.w * P.t) / P.k;
    const nn = Math.max(0, Math.ceil((first - (w - 20)) / lam)), xb = first - nn * lam, xa = xb - lam;
    if (xa >= 6 && xb <= w - 6) {
      const [a, b] = lenParts(state.sv / state.sf);
      ruler(ctx, xa, xb, y0 - L.amax - 34, 'λ = ' + a + ' ' + b, {size: fs, maxX: w - 4});
    }
  }
  // direction + meaning of the orbit
  const ay = L.phone ? L.top0 - 36 : L.top0 - 40, ph = L.phone;
  arrow(ctx, w - (ph ? 34 : 120), ay, w - 10, ay, {width: 2, size: ph ? 7 : 9, color: C.ink2});
  const dir = ph ? 'Truyền sóng' : 'Phương truyền sóng';
  ctx.font = font(fs - (ph ? 1 : 0), 700);
  pill(ctx, dir, w - (ph ? 40 : 128) - textW(ctx, dir) / 2 - 14, ay, {size: fs - (ph ? 1 : 0), fill: C.paper, stroke: null, color: C.ink2});
  if (state.track && state.orbits) pill(ctx, ph ? 'Quỹ đạo = dao động dọc + ngang' : 'Quỹ đạo tròn = dao động dọc + dao động ngang', w / 2, L.h - (ph ? 72 : 78), {size: fs - 1, fill: C.paper, stroke: C.red, color: C.red});
  if (P.deep) pill(ctx, 'Càng sâu dao động càng yếu', Math.min(w - 90, tx0 + 120), y0 + P.hd * 0.5, {size: fs - 1, fill: C.paper, stroke: null, color: C.ink2});
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
        toggle('target', 'Phần tử đỏ', () => state.track, v => set('track', v), 'Theo dõi các phần tử màu đỏ'),
        toggle('surface', 'Quỹ đạo', () => state.orbits, v => set('orbits', v))))
  ];
}

// red top-row particle: orbit trace (ξ horizontal, ζ up), both ∈ [−1, 1] of its own amplitude
const SC_SURF = {kind: 'xy', colors: ['#e03131'], T: () => 1 / state.sf};
function probe(tt, out) {
  const x0 = Z.tx0 || 0, e = clamp((P.lam * state.sf * tt - x0) / (P.lam * 0.75 || 1), 0, 1), ph = P.k * x0 - P.w * tt;
  out[0] = -e * Math.sin(ph); out[1] = e * Math.cos(ph);
}
export default {
  probe, scope: () => SC_SURF,
  id: 'surface', title: 'Sóng mặt', short: 'Sóng mặt', icon: 'surface',
  defaults: {slow: 1},
  metrics: () => ({f: state.sf, v: state.sv}),
  readout, controls, layout, draw, annotate, update() {}, reset() {}
};
