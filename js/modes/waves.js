// Sóng ngang – Sóng dọc song song. Two lanes with the SAME f, A, v, t and x scale: a rope (beads move ↕, driver upright) and a
// bead–spring chain (beads move ↔, the same driver lying on its side). u(x,t) = A·sin(ωt − kx) for x ≤ front (makeWave()).
// Running: only objects + the axis letters O, x, u. Paused: annotate() adds labels, λ rulers, VTCB guide (SPEC §3.1).
import {state, set, bus} from '../state.js';
import {h, chip, toggle, slider, seg, group, lab, slowControl} from '../ui.js';
import {freqParts, lenParts, slowText} from '../fmt.js';
import {clamp, makeWave} from '../physics.js';
import {C, font, pill, text, arrow, ruler, textW} from '../draw/ink.js';
import {ball, drawBall, BALL, ballDpr} from '../draw/ball.js';
import {loadArt} from '../art/sprite.js';

const F_MIN = 0.2, F_MAX = 5, A_MIN = 1, A_MAX = 10, V_MIN = 0.5, V_MAX = 4;
const SHOW_M = 6;                       // the lane width represents 6 m (scale for the drawn λ)
const AX = 'rgba(21,24,29,.62)';        // axis ink
const wave = makeWave();
const driver = loadArt('driver');
driver.ready.then(() => bus.emit('change', {key: 'art'}));
const L = {};
let xs = new Float32Array(0), ys = new Float32Array(0), spr = null, rings = null;
const DRV = {shaft: {dy: 0, clipY: 94}};

// "Chỉ phần tử": faint grey VTCB rings at the rest positions p = [x0, y0, x1, y1, …], drawn once into one offscreen canvas
// (per frame = one drawImage). Shared with standing.js.
export function ringLayer(w, hh, r, p) {
  const d = ballDpr(), c = document.createElement('canvas');
  c.width = Math.ceil(w * d); c.height = Math.ceil(hh * d);
  const g = c.getContext('2d'); g.scale(d, d);
  g.beginPath();
  for (let i = 0; i < p.length; i += 2) { g.moveTo(p[i] + r, p[i + 1]); g.arc(p[i], p[i + 1], r, 0, 6.2832); }
  g.fillStyle = 'rgba(73,80,87,.07)'; g.fill();
  g.strokeStyle = 'rgba(73,80,87,.45)'; g.lineWidth = 1.1; g.setLineDash([2.5, 2]); g.stroke();
  return c;
}
const occ = [];                         // label rectangles already placed (annotate only)

const fPos = f => Math.round(1000 * Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN));
const dec = (x, d = 3) => String(+x.toPrecision(d)).replace('.', ',');
const lamText = () => { const [a, b] = lenParts(state.tv / state.tf); return 'λ = ' + a + ' ' + b; };

function layout(w, hh) {
  const phone = w < 600, tiny = hh < 300, both = state.lane === 'both';
  L.w = w; L.h = hh; L.phone = phone; L.tiny = tiny; L.fs = phone ? 11 : 12.5; L.lane = state.lane;
  const short = hh < 420;                              // phone landscape: chip is one line, play pill is small
  const topR = tiny ? 34 : short ? 42 : phone ? 56 : 62, botR = tiny ? 46 : short ? 50 : phone ? 56 : 64, gap = 6;
  const topRow = tiny ? 26 : 48;                      // room above a lane for the ruler + crest/nén pills
  const lh = Math.max(70, (hh - topR - botR - (both ? gap : 0)) / (both ? 2 : 1));
  L.ruler = !tiny;
  // driver scale (clamp anchor = rope start; body hangs 132 units below it when upright, reaches 132 units to the left when lying)
  const s = clamp(Math.min((lh - topRow) / 178, 0.2 * w / 132), 0.25, both ? 1.0 : 1.15);
  L.s = s; L.amax = 46 * s;
  L.xc = Math.round(132 * s + 8); L.ropeR = w - 26; L.ropeW = L.ropeR - L.xc;
  L.N = clamp(Math.round(L.ropeW / (phone ? 17 : 28)), 18, 40);     // v5: bigger beads
  L.dx = L.ropeW / (L.N - 1);
  L.r = clamp(0.25 * L.dx, 4.4, 8.5);
  L.tI = Math.round(L.N * 0.3); L.xt = L.xc + L.tI * L.dx;
  L.lh = lh; L.topRow = topRow;
  const showR = state.lane !== 'spring', showS = state.lane !== 'rope';
  L.topS = both ? topR + lh + gap : topR;
  L.cyR = showR ? topR + topRow + L.amax + Math.max(0, lh - topRow - 178 * s) / 2 : null;
  L.cyS = showS ? L.topS + topRow + 20 + Math.max(0, lh - topRow - 60 * s - 60) / 2 : null;
  L.topR = topR;
  if (xs.length !== L.N) { xs = new Float32Array(L.N); ys = new Float32Array(L.N); }
  spr = null; rings = null;
  driver.render(s, ballDpr());
}

function syncWave() {
  wave.set(state.tf, state.tv, L.ropeW / SHOW_M, 6 * L.dx, L.ropeW * 0.7, 0);
  // rope = slider amplitude (k·A ≤ 0,8); spring lane may be drawn smaller: k·A_s ≤ min(0,8; 1 − (2r+3)/dx) → neighbouring beads never touch
  L.apx = Math.min(state.tA / A_MAX * L.amax, 0.8 / wave.k);
  L.aspr = Math.min(L.apx, Math.max(0, Math.min(0.8, 1 - (2 * L.r + 3) / L.dx)) / wave.k);
  L.ks = L.apx > 0 ? L.aspr / L.apx : 0;
  wave.A = L.apx; wave.at(state.t);
}

const anchor = () => driver.pt('a-clamp') || {x: 60, y: 18};
const topY = () => (driver.pt('a-top') || {y: 94}).y;

// axes: Ox arrow + letter x at its tip (a bead never reaches it: the lane ends at ropeR), O at the origin
function axisX(ctx, x0, y) {
  arrow(ctx, x0, y, L.w - 8, y, {color: AX, width: 1.2, size: 6});
  text(ctx, 'x', L.w - 13, y - 11, {size: 12.5, weight: 700, color: C.ink});
}

function drawRope(ctx) {
  const {xc, dx, N, r, cyR: cy, s, amax} = L, a = anchor();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const xu = xc - 12 * s - 12;
  axisX(ctx, xu, cy);
  arrow(ctx, xu, cy + amax + 12, xu, cy - amax - 12, {color: AX, width: 1.2, size: 6, both: true});
  text(ctx, 'u', xu - 9, cy - amax - 10, {size: 12.5, weight: 700, color: C.ink});
  text(ctx, 'O', xu - 9, cy + 11, {size: 12.5, weight: 700, color: C.ink});
  for (let i = 0; i < N; i++) { xs[i] = xc + i * dx; ys[i] = cy - wave.u(i * dx); }
  // rope = shaded tube: dark core, mid tone, thin highlight
  ctx.beginPath(); ctx.moveTo(xs[0], ys[0]);
  for (let i = 1; i < N - 1; i++) ctx.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
  ctx.lineTo(xs[N - 1], ys[N - 1]);
  if (!state.beadsOnly) {
    const k = r / 4.8;                                 // tube width scales with the bead size
    ctx.strokeStyle = '#2b2f36'; ctx.lineWidth = 5.4 * k; ctx.stroke();
    ctx.strokeStyle = '#7a828c'; ctx.lineWidth = 3.4 * k; ctx.stroke();
    ctx.save(); ctx.translate(0, -k); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = k; ctx.stroke(); ctx.restore();
  }
  if (!spr) spr = {bead: ball(BALL.bead, r), red: ball(BALL.red, r + 2)};
  for (let i = 0; i < N; i++) { if (state.track && i === L.tI) continue; drawBall(ctx, spr.bead, xs[i], ys[i]); }
  if (state.track) drawBall(ctx, spr.red, xs[L.tI], ys[L.tI]);
  // driver upright: body fixed, shaft slides by u(0,t) and carries the rope end
  DRV.shaft.dy = -wave.u(0) / s; DRV.shaft.clipY = topY();
  driver.draw(ctx, xc - a.x * s, cy - a.y * s, DRV);
}

function drawSpring(ctx) {
  const {xc, dx, N, r, cyS: cy, s} = L, a = anchor();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  axisX(ctx, xc + 6, cy);
  const ay = cy + 17;
  arrow(ctx, xc - L.amax - 12, ay, xc + L.amax + 12, ay, {color: AX, width: 1.2, size: 6, both: true});
  text(ctx, 'u', xc + L.amax + 22, ay, {size: 12.5, weight: 700, color: C.ink});
  text(ctx, 'O', xc, cy + 32, {size: 12.5, weight: 700, color: C.ink});
  const ks = L.ks;
  for (let i = 0; i < N; i++) xs[i] = xc + i * dx + ks * wave.u(i * dx);   // longitudinal: each bead at rest x + u (spring amplitude)
  // coil springs (zigzag): light under-stroke + graphite line; zigzag amplitude scales with the bead size
  const amp = 0.8 * r, TEETH = 5;
  if (!state.beadsOnly) {
    ctx.beginPath();
    for (let i = 0; i < N - 1; i++) {
      const x0 = xs[i], d = xs[i + 1] - x0, e = d * 0.14;
      ctx.moveTo(x0, cy); ctx.lineTo(x0 + e, cy);
      for (let k = 1; k < 2 * TEETH; k++) ctx.lineTo(x0 + e + (d - 2 * e) * k / (2 * TEETH), cy + (k & 1 ? -amp : amp));
      ctx.lineTo(x0 + d - e, cy); ctx.lineTo(x0 + d, cy);
    }
    ctx.strokeStyle = '#ced4da'; ctx.lineWidth = 3.2; ctx.stroke();
    ctx.strokeStyle = '#495057'; ctx.lineWidth = 1.3; ctx.stroke();
  }
  if (!spr) spr = {bead: ball(BALL.bead, r), red: ball(BALL.red, r + 2)};
  for (let i = 0; i < N; i++) { if (state.track && i === L.tI) continue; drawBall(ctx, spr.bead, xs[i], cy); }
  if (state.track) drawBall(ctx, spr.red, xs[L.tI], cy);
  // same driver lying on its side: shaft slides along x by u(0,t) and pushes the first bead
  ctx.save(); ctx.translate(xc, cy); ctx.rotate(Math.PI / 2);
  DRV.shaft.dy = -ks * wave.u(0) / s; DRV.shaft.clipY = topY();
  driver.draw(ctx, -a.x * s, -a.y * s, DRV);
  ctx.restore();
}

function draw(ctx) {
  if (!L.w) return;
  if (L.lane !== state.lane) layout(L.w, L.h);
  syncWave();
  if (state.beadsOnly) {
    if (!rings) {
      const p = [];
      for (const cy of [L.cyR, L.cyS]) if (cy != null) for (let i = 0; i < L.N; i++) p.push(L.xc + i * L.dx, cy);
      rings = ringLayer(L.w, L.h, L.r + 0.6, p);
    }
    ctx.drawImage(rings, 0, 0, L.w, L.h);
  }
  if (L.cyR != null) drawRope(ctx);
  if (L.cyS != null) drawSpring(ctx);
}

/* ---------------- annotations (paused only) ---------------- */
// draw a pill only if it fits on the stage and does not overlap one already placed
function tag(ctx, t, x, y, o) {
  ctx.font = font(o.size, 700);
  const w = textW(ctx, t) + 14, hh = o.size + 9, x0 = x - w / 2, x1 = x + w / 2, y0 = y - hh / 2, y1 = y + hh / 2;
  if (x0 < 4 || x1 > L.w - 22 || y0 < 2 || y1 > L.h - 2) return false;
  for (const q of occ) if (x0 < q[2] && x1 > q[0] && y0 < q[3] && y1 > q[1]) return false;
  occ.push([x0, y0, x1, y1]);
  pill(ctx, t, x, y, o);
  return true;
}
// pair of consecutive phase points λ apart, the right one as far right as fits; off = distance behind the front of the first point
function pairAt(off, nMin) {
  const {front, lamPx: lam} = wave, n = Math.max(nMin, Math.ceil((front - off - (L.ropeW - 20)) / lam));
  const x2 = front - off - n * lam, x1 = x2 - lam;
  return x1 >= 4 && x2 <= L.ropeW - 4 ? [x1, x2] : null;
}

function readout() {
  return state.slow >= 1 ? 'Biên độ đã phóng đại' : 'Hình đã làm chậm ' + slowText(state.slow) + ' · biên độ phóng đại';
}

function annotate(ctx) {
  if (!L.w) return;
  occ.length = 0;
  const {xc, ropeW, ropeR, fs, s, apx: A} = L, lam = wave.lamPx, front = wave.front, xt = L.xt;
  const o = (fill, color = '#fff') => ({size: fs - 1, fill, stroke: fill, color});
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const guide = (x, y0, y1) => { ctx.strokeStyle = 'rgba(21,24,29,.4)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); ctx.setLineDash([]); };

  // ---- top lane: sóng ngang
  if (L.cyR != null) {
    const cy = L.cyR, rowY = L.topR + 10;
    ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(xc, cy); ctx.lineTo(ropeR, cy); ctx.stroke(); ctx.setLineDash([]);
    const p = L.ruler && front > lam * 1.5 ? pairAt(lam / 4, 0) : null;
    if (p) {
      guide(xc + p[0], rowY + 8, cy - A); guide(xc + p[1], rowY + 8, cy - A);
      occ.push([xc + p[0], rowY - 8, xc + p[1], rowY + 8]);
      ruler(ctx, xc + p[0], xc + p[1], rowY, lamText(), {size: fs, color: C.ink, maxX: L.w - 4});
    }
    for (let n = 0; n < 60; n++) {
      const xc1 = front - lam / 4 - n * lam, xh = front - 3 * lam / 4 - n * lam;
      if (xc1 < 14 && xh < 14) break;
      if (xc1 >= 14 && xc1 <= ropeW - 14) tag(ctx, 'Đỉnh sóng', xc + xc1, cy - A - 15, o(C.comp));
      if (xh >= 14 && xh <= ropeW - 14 && xh > 60 * s + 24) tag(ctx, 'Hõm sóng', xc + xh, cy + A + 15, o(C.rare));
    }
    if (state.track) {
      arrow(ctx, xt, cy - A - 11, xt, cy + A + 11, {color: C.track, width: 1.6, size: 6, both: true});
      if (L.lh >= 170) tag(ctx, 'Phương dao động', xt, cy + A + 40, {size: fs - 1, fill: '#fff', stroke: C.track, color: C.track});
    }
  }

  // ---- bottom lane: sóng dọc
  if (L.cyS != null) {
    const cy = L.cyS, rowY = L.topS + 10, b = 17;
    // tinted nén (orange) / giãn (blue) bands, centred where wave.s = ±1 (the same formula that crowds the beads)
    for (const [col, off] of [['rgba(232,89,12,.14)', 0], ['rgba(28,126,214,.12)', lam / 2]]) {
      ctx.fillStyle = col; ctx.beginPath();
      for (let n = off ? 0 : 1; n < 60; n++) {
        const x = front - off - n * lam, a0 = Math.max(0, x - lam / 4), a1 = Math.min(ropeW, x + lam / 4, front);
        if (x < -lam / 4) break;
        if (a1 > a0) ctx.rect(xc + a0, cy - b, a1 - a0, 2 * b);
      }
      ctx.fill();
    }
    const p = L.ruler && front > lam * 2.5 ? pairAt(0, 1) : null;
    if (p) {
      guide(xc + p[0], rowY + 8, cy - b); guide(xc + p[1], rowY + 8, cy - b);
      occ.push([xc + p[0], rowY - 8, xc + p[1], rowY + 8]);
      ruler(ctx, xc + p[0], xc + p[1], rowY, lamText(), {size: fs, color: C.ink, maxX: L.w - 4});
    }
    ctx.font = font(fs - 1, 700);
    const short = lam / 2 < textW(ctx, 'Vùng giãn') + 18, tN = short ? 'Nén' : 'Vùng nén', tG = short ? 'Giãn' : 'Vùng giãn', py = cy - b - 15;
    for (let n = 0; n < 60; n++) {
      const xn = front - n * lam, xg = front - (n + 0.5) * lam;
      if (xg < 14 && xn < 14) break;
      if (n >= 1 && xn >= 14 && xn <= ropeW - 14) tag(ctx, tN, xc + xn, py, o(C.comp));
      if (xg >= 14 && xg <= ropeW - 14) tag(ctx, tG, xc + xg, py, o(C.rare));
    }
    if (state.track) {
      arrow(ctx, xt - L.aspr - 10, cy + 17, xt + L.aspr + 10, cy + 17, {color: C.track, width: 1.6, size: 6, both: true});
      tag(ctx, 'Phương dao động', xt, cy + 38, {size: fs - 1, fill: '#fff', stroke: C.track, color: C.track});
    }
  }

  // ---- red-bead guide through the rest position (VTCB) in both lanes
  if (state.track) {
    const y0 = L.cyR != null ? L.cyR - A - 28 : L.cyS - 17 - 10, y1 = L.cyS != null ? L.cyS + 26 : L.cyR + A + 28;
    guide(xt, y0, y1);
  }

  // ---- one shared propagation arrow (bottom of the first lane, right of the driver body)
  const ay = L.cyR != null ? L.topR + L.lh - 12 : L.topS + L.lh - 12, ax = L.cyR != null ? xc + 60 * s + 16 : xc + 14;
  arrow(ctx, ax, ay, L.w - 10, ay, {color: C.ink2, width: 2, size: 8});
  tag(ctx, 'Phương truyền sóng', ax + (L.w - 10 - ax) / 2, ay, {size: fs, fill: C.paper, stroke: null, color: C.ink2});
}

function controls() {
  const fVal = h('span', {class: 'val'}), aVal = h('span', {class: 'val'}), vVal = h('span', {class: 'val'});
  const fS = slider({min: 0, max: 1000, label: 'Tần số',
    pos: () => fPos(state.tf),
    apply: p => { const f = F_MIN * Math.pow(F_MAX / F_MIN, p / 1000); set('tf', f < 1 ? Math.round(f * 10) / 10 : Math.round(f * 2) / 2); },
    sync: () => { const [, u] = freqParts(state.tf); fVal.replaceChildren(dec(state.tf, 2), h('small', {text: u})); }});
  const aS = slider({min: A_MIN, max: A_MAX, step: 0.5, label: 'Biên độ', pos: () => state.tA, apply: v => set('tA', v),
    sync: () => { aVal.replaceChildren(dec(state.tA, 2), h('small', {text: 'cm'})); }});
  const vS = slider({min: V_MIN * 10, max: V_MAX * 10, step: 1, label: 'Tốc độ truyền sóng', pos: () => Math.round(state.tv * 10), apply: p => set('tv', p / 10),
    sync: () => { vVal.replaceChildren(dec(state.tv, 2), h('small', {text: 'm/s'})); }});
  return [
    group('wave', 'Sóng trên dây và lò xo',
      lab('freq', 'Tần số f', fVal), fS,
      h('div', {class: 'chips g4'}, ...[0.5, 1, 2, 4].map(f => chip(dec(f), () => state.tf === f, () => set('tf', f), 'sm'))),
      lab('transverse', 'Biên độ A', aVal), aS,
      lab('medium', 'Tốc độ truyền v', vVal), vS,
      ...slowControl()),
    group('show', 'Hiển thị',
      seg([['both', 'Cả hai'], ['rope', 'Sóng ngang'], ['spring', 'Sóng dọc']], () => state.lane, v => set('lane', v), 'Loại sóng hiển thị'),
      h('div', {class: 'tgs'},
        toggle('target', 'Phần tử đỏ', () => state.track, v => set('track', v), 'Theo dõi một phần tử (màu đỏ)'),
        toggle('beads', 'Chỉ phần tử', () => state.beadsOnly, v => set('beadsOnly', v), 'Chỉ vẽ các phần tử và vị trí cân bằng')))
  ];
}

// mini-scope sample: displacement of the red bead (u / A), same wave in both lanes
const PR = {xy: false, a: 0, b: 0, ca: '#e8590c', cb: '#1c7ed6'};
function probe() {
  const q = wave.A > 0.01 ? wave.u(L.tI * L.dx) / wave.A : 0;
  PR.a = q; PR.b = q; PR.lane = state.lane; return PR;
}

export default {
  probe, id: 'waves', group: 'mech', title: 'Sóng ngang – Sóng dọc', short: 'Ngang – Dọc', icon: 'transverse',
  defaults: {slow: 1},
  metrics: () => ({f: state.tf, v: state.tv}),
  readout, controls, layout, draw, annotate, update() {}, reset() {}
};
