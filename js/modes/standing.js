// Sóng dừng trên dây (KNTT, bài Sóng dừng) – SPEC §3.5. Real string ℓ = 1,20 m, X = ℓ − x (distance from the reflecting end), K = 2π/λ.
//   hai đầu cố định: ℓ = n·λ/2, u = A·sin(KX)·cos(ωt), f_n = n·v/(2ℓ)
//   một đầu tự do:   ℓ = (2n−1)·λ/4, u = A·cos(KX)·sin(ωt), f_n = (2n−1)·v/(4ℓ)
// v6 formation by reflection (x = distance from the driver, c = λ·f, σ = −1 fixed / +1 free, t since restart):
//   u = (A/2)·sin(ωt − Kx)·[x ≤ ct] + σ·(A/2)·sin(ωt − K(2ℓ − x))·[2ℓ − x ≤ ct]  →  = −A·cos(ωt)·sin(Kx) once ct ≥ 2ℓ.
// Only resonant states. Bead count is chosen so every node sits on a bead.
// Running: string + beads + incident/reflected lanes + axis letters only. Paused: annotate() adds pills, envelope, rulers.
import {state, set, bus} from '../state.js';
import {h, chip, toggle, slider, seg, group, lab, slowControl, bind} from '../ui.js';
import {num, slowText} from '../fmt.js';
import {clamp, TAU, niceSlow} from '../physics.js';
import {C, font, pill, text, arrow, ruler, textW} from '../draw/ink.js';
import {ball, drawBall, BALL, ballDpr} from '../draw/ball.js';
import {loadArt} from '../art/sprite.js';
import {ringLayer} from './waves.js';

const ELL = 1.2, A_MIN = 1, A_MAX = 6, V_MIN = 2, V_MAX = 12, NMAX = 512;
const AX = 'rgba(21,24,29,.62)';
const driver = loadArt('driver');
driver.ready.then(() => bus.emit('change', {key: 'art'}));
const L = {};
const xs = new Float32Array(NMAX), ys = new Float32Array(NMAX), S = new Float32Array(NMAX);
const DASH = [6, 5], DASH2 = [4, 4], NONE = [];
const DRV = {shaft: {dy: 0, clipY: 94}};
const occ = [];
let spr = null, rings = null, postG = null, rodG = null;

const free = () => state.stEnd === 'free';
const fN = () => free() ? (2 * state.stN - 1) * state.stv / (4 * ELL) : state.stN * state.stv / (2 * ELL);
const dec = (x, d = 3) => String(+x.toPrecision(d)).replace('.', ',');
const ORG = '#e8590c', BLU = '#1c7ed6';
const autoSlow = () => Math.min(1, niceSlow(fN(), 1.5));
// any change of n / end / v / A restarts the formation; n / end / v also re-apply the auto slow-motion
bus.on('change', e => {
  if (!e || state.mode !== 'standing') return;
  const k = e.key;
  if (k === 'stN' || k === 'stEnd' || k === 'stv') set('slow', autoSlow());
  if (k === 'stN' || k === 'stEnd' || k === 'stv' || k === 'stA') { state.t = 0; }
});

function layout(w, hh) {
  const phone = w < 600, tiny = hh < 300, short = hh < 420, n = state.stN, fr = free();
  L.w = w; L.h = hh; L.phone = phone; L.fs = phone ? 11 : 12.5; L.n = n; L.end = state.stEnd; L.inc = state.stInc;
  const topR = tiny ? 34 : short ? 42 : phone ? 56 : 62, botR = tiny ? 46 : short ? 50 : phone ? 56 : 64;
  const avail = hh - topR - botR;
  const s = clamp(Math.min((avail / 2 + botR - 20) / 165, 0.2 * w / 132), 0.25, 1.0);
  L.s = s; L.xc = Math.round(132 * s + 8); L.xR = w - 40; L.lpx = L.xR - L.xc;
  // incident / reflected lanes above the string (each band = amax + 14, curve half-height A/2 ≤ amax/2); too short → curves over the string
  L.lanes = state.stInc && hh >= 380 && (avail - 236) / 4 >= 20;
  if (L.lanes) {
    L.amax = clamp((avail - 236) / 4, 20, 70); L.lb = L.amax + 14;
    L.ly1 = Math.round(topR + L.lb / 2); L.ly2 = Math.round(L.ly1 + L.lb);
    L.cy = Math.round(topR + 2 * L.lb + L.amax + 88);
  } else {
    L.cy = Math.round(topR + avail / 2 - 16);
    L.amax = clamp(avail / 2 - 104, 16, 90);
  }
  // beads: fixed → m per bó (λ/2), free → m per λ/4; N − 1 segments → nodes land exactly on beads
  const dxT = phone ? 17 : 28, q = fr ? 2 * n - 1 : n;
  const m = fr ? Math.max(1, Math.round(L.lpx / q / dxT)) : Math.max(2, Math.round(L.lpx / q / dxT));
  L.m = m; L.N = Math.min(NMAX, q * m + 1); L.dx = L.lpx / (L.N - 1);
  L.r = clamp(0.27 * L.dx, 4.4, 8.5);
  L.lam = fr ? 4 * L.lpx / q : 2 * L.lpx / n; L.K = TAU / L.lam;
  for (let i = 0; i < L.N; i++) S[i] = Math.sin(L.K * i * L.dx);     // steady u = A·S·T, T = −cos ωt (both end types)
  // antinodes from the left (x px from the driver end): fixed x = λ/4 + jλ/2, free x = λ/4 + jλ/2 as well (X = ℓ − x)
  L.anti = []; L.nodes = [];
  for (let j = 0; j <= 2 * n; j++) { const x = L.lam / 4 + j * L.lam / 2; if (x <= L.lpx + 0.5) L.anti.push(x); }
  for (let j = 0; j <= 2 * n; j++) { const x = j * L.lam / 2; if (x <= L.lpx + 0.5) L.nodes.push(x); }
  L.iR = Math.round(L.anti[0] / L.dx); L.iO = L.anti.length > 1 ? Math.round(L.anti[1] / L.dx) : -1;
  spr = null; rings = null; postG = rodG = null;
  driver.render(s, ballDpr());
}

const anchor = () => driver.pt('a-clamp') || {x: 60, y: 18};
const topY = () => (driver.pt('a-top') || {y: 94}).y;

function sync() {
  L.apx = state.stA / A_MAX * L.amax;
  L.e = Math.min(2, 0.05 * L.apx);                 // driver shaft amplitude → the driver end is ≈ a node
  const f = fN(), wt = TAU * f * state.t;
  L.T = -Math.cos(wt);                              // steady time factor of u
  L.Td = Math.sin(wt);                              // its derivative / ω (velocity sign)
  L.wt = wt; L.sg = free() ? 1 : -1;
  L.ct = L.lam * f * state.t;                       // distance travelled by the incident front (px)
  L.steady = L.ct >= 2 * L.lpx - 0.01;
}
// u_t + u_r at x px from the driver (no driver term)
function uAt(x) {
  const {K, wt, ct, lpx} = L, half = L.apx / 2;
  return (x <= ct ? half * Math.sin(wt - K * x) : 0) + (2 * lpx - x <= ct ? L.sg * half * Math.sin(wt - K * (2 * lpx - x)) : 0);
}
function tri(ctx, x, y, dir, color) {               // small arrowhead at a wave front
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + dir * 8, y); ctx.lineTo(x, y - 4.5); ctx.lineTo(x, y + 4.5); ctx.closePath(); ctx.fill();
}
// incident (→, orange) and reflected (←, blue), drawn only where each wave has already arrived
function drawInc(ctx) {
  const {xc, lpx, K, wt, ct, sg, apx, N, dx} = L, half = apx / 2, lanes = L.lanes;
  const yT = lanes ? L.ly1 : L.cy, yR = lanes ? L.ly2 : L.cy;
  const xi1 = Math.min(ct, lpx), xr0 = Math.max(0, 2 * lpx - ct);
  if (lanes) {
    ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash(DASH); ctx.beginPath();
    ctx.moveTo(xc, yT); ctx.lineTo(xc + lpx, yT); ctx.moveTo(xc, yR); ctx.lineTo(xc + lpx, yR); ctx.stroke();
    ctx.setLineDash(NONE); ctx.lineWidth = 2;
  } else { ctx.setLineDash(DASH); ctx.lineWidth = 1.6; }
  if (xi1 > 0) {
    ctx.strokeStyle = ORG; ctx.beginPath();
    for (let x = 0; ; x += 4) { if (x > xi1) x = xi1; const y = yT - half * Math.sin(wt - K * x); x ? ctx.lineTo(xc + x, y) : ctx.moveTo(xc, y); if (x >= xi1) break; }
    ctx.stroke();
  }
  if (xr0 < lpx) {
    ctx.strokeStyle = BLU; ctx.beginPath();
    for (let x = xr0; ; x += 4) { if (x > lpx) x = lpx; const y = yR - sg * half * Math.sin(wt - K * (2 * lpx - x)); x === xr0 ? ctx.moveTo(xc + x, y) : ctx.lineTo(xc + x, y); if (x >= lpx) break; }
    ctx.stroke();
  }
  ctx.setLineDash(NONE);
  if (lanes) {   // small beads every 2nd bead x
    ctx.fillStyle = ORG; ctx.beginPath();
    for (let i = 0; i < N; i += 2) { const x = i * dx; if (x > xi1) break; const y = yT - half * Math.sin(wt - K * x); ctx.moveTo(xc + x + 2.8, y); ctx.arc(xc + x, y, 2.8, 0, TAU); }
    ctx.fill();
    ctx.fillStyle = BLU; ctx.beginPath();
    for (let i = 0; i < N; i += 2) { const x = i * dx; if (x < xr0) continue; const y = yR - sg * half * Math.sin(wt - K * (2 * lpx - x)); ctx.moveTo(xc + x + 2.8, y); ctx.arc(xc + x, y, 2.8, 0, TAU); }
    ctx.fill();
  }
  if (ct < lpx) tri(ctx, xc + ct, yT, 1, ORG);
  else if (ct < 2 * lpx) tri(ctx, xc + 2 * lpx - ct, yR, -1, BLU);
}

function drawEnd(ctx) {
  const {xR, cy, amax} = L;
  if (free()) {
    // smooth vertical rod + ring sliding on it (the ring carries the last bead)
    const y0 = cy - amax - 20, y1 = cy + amax + 20;
    if (!rodG) { rodG = ctx.createLinearGradient(xR - 3, 0, xR + 3, 0); rodG.addColorStop(0, '#6c747d'); rodG.addColorStop(0.35, '#f4f6f8'); rodG.addColorStop(1, '#495057'); }
    ctx.fillStyle = '#868e96'; ctx.fillRect(xR - 9, y1, 18, 4); ctx.fillRect(xR - 9, y0 - 4, 18, 4);
    ctx.fillStyle = rodG; ctx.fillRect(xR - 2.5, y0, 5, y1 - y0);
  } else {
    // steel clamp post: vertical bar to the right of the end, small jaw holding the string
    if (!postG) { postG = ctx.createLinearGradient(xR + 2, 0, xR + 14, 0); postG.addColorStop(0, '#5c636b'); postG.addColorStop(0.3, '#e9ecef'); postG.addColorStop(0.7, '#9aa1a9'); postG.addColorStop(1, '#3d4248'); }
    ctx.fillStyle = postG; ctx.fillRect(xR + 3, cy - amax * 0.6 - 18, 11, amax * 1.6 + 54);
    ctx.fillStyle = '#495057'; ctx.fillRect(xR - 1, cy + amax + 36, 19, 5);
    ctx.fillStyle = '#343a40'; ctx.fillRect(xR - 2, cy - 6, 8, 12);
  }
}

function draw(ctx) {
  if (!L.w) return;
  if (L.n !== state.stN || L.end !== state.stEnd || L.inc !== state.stInc) layout(L.w, L.h);
  sync();
  const {xc, dx, N, r, cy, s, amax, apx: A, e, T, lpx} = L, a = anchor();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // axes (as the rope lane of waves): Ox, u, O
  const xu = xc - 12 * s - 12;
  arrow(ctx, xu, cy, L.w - 8, cy, {color: AX, width: 1.2, size: 6});
  text(ctx, 'x', L.w - 13, cy - 11, {size: 12.5, weight: 700, color: C.ink});
  arrow(ctx, xu, cy + amax + 12, xu, cy - amax - 12, {color: AX, width: 1.2, size: 6, both: true});
  text(ctx, 'u', xu - 9, cy - amax - 10, {size: 12.5, weight: 700, color: C.ink});
  text(ctx, 'O', xu - 9, cy + 11, {size: 12.5, weight: 700, color: C.ink});
  drawEnd(ctx);
  for (let i = 0; i < N; i++) { const x = i * dx; xs[i] = xc + x; ys[i] = cy - uAt(x) - e * (lpx - x) / lpx * T; }
  if (state.beadsOnly) {
    if (!rings) { const p = []; for (let i = 0; i < N; i++) p.push(xc + i * dx, cy); rings = ringLayer(L.w, L.h, r + 0.6, p); }
    ctx.drawImage(rings, 0, 0, L.w, L.h);
  } else {
    const k = r / 4.8;
    ctx.beginPath(); ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < N - 1; i++) ctx.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
    ctx.lineTo(xs[N - 1], ys[N - 1]);
    ctx.strokeStyle = '#2b2f36'; ctx.lineWidth = 5.4 * k; ctx.stroke();
    ctx.strokeStyle = '#7a828c'; ctx.lineWidth = 3.4 * k; ctx.stroke();
    ctx.save(); ctx.translate(0, -k); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = k; ctx.stroke(); ctx.restore();
  }
  if (state.stInc) drawInc(ctx);
  if (!spr) spr = {bead: ball(BALL.bead, r), red: ball(BALL.red, r + 2), org: ball(BALL.orange, r + 2)};
  const tr = state.track, iR = L.iR, iO = L.iO;
  for (let i = 0; i < N; i++) { if (tr && (i === iR || i === iO)) continue; drawBall(ctx, spr.bead, xs[i], ys[i]); }
  if (free()) {    // ring around the rod at the last bead
    ctx.strokeStyle = '#495057'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(L.xR, ys[N - 1], 6, 2.6, 0, 0, TAU); ctx.stroke();
  }
  if (tr) { drawBall(ctx, spr.red, xs[iR], ys[iR]); if (iO >= 0) drawBall(ctx, spr.org, xs[iO], ys[iO]); }
  DRV.shaft.dy = -(uAt(0) + e * T) / s; DRV.shaft.clipY = topY();
  driver.draw(ctx, xc - a.x * s, cy - a.y * s, DRV);
}

/* ---------------- annotations (paused only) ---------------- */
function tag(ctx, t, x, y, o) {
  ctx.font = font(o.size, 700);
  const w = textW(ctx, t) + 14, hh = o.size + 9, x0 = x - w / 2, x1 = x + w / 2, y0 = y - hh / 2, y1 = y + hh / 2;
  if (x0 < 4 || x1 > L.w - 4 || y0 < 2 || y1 > L.h - 2) return false;
  for (const q of occ) if (x0 < q[2] && x1 > q[0] && y0 < q[3] && y1 > q[1]) return false;
  occ.push([x0, y0, x1, y1]);
  pill(ctx, t, x, y, o);
  return true;
}
const halfLam = () => 'λ/2 = ' + (100 * state.stv / fN() / 2).toFixed(1).replace('.', ',') + ' cm';

function readout() {
  const n = state.stN, k = free() ? 2 * n - 1 : n, f = free() ? 'λ/4' : 'λ/2';
  const note = state.slow >= 1 ? 'biên độ phóng đại' : 'làm chậm ' + slowText(state.slow) + ' · biên độ phóng đại';
  return 'ℓ = 1,20 m = ' + (k > 1 ? k + '·' : '') + f + ' · ' + (free() ? 'một đầu tự do' : 'hai đầu cố định') + ' · ' + note;
}

function annotate(ctx) {
  if (!L.w) return;
  occ.length = 0;
  const {xc, xR, cy, fs, s, apx: A, r, lpx, K, N, dx} = L, fr = free();
  const env = X => Math.abs(fr ? Math.cos(K * X) : Math.sin(K * X));
  const oP = (fill, color = '#fff') => ({size: fs - 1, fill, stroke: fill, color});
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // driver body is not free space for labels
  occ.push([xc - 66 * s, cy + 8, xc + 66 * s, cy + 168 * s]);
  // VTCB + dashed envelope ±A·|S(X)|
  ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash(DASH); ctx.beginPath(); ctx.moveTo(xc, cy); ctx.lineTo(xR, cy); ctx.stroke();
  ctx.setLineDash(NONE);
  // lane pills: left of the lane (beside the driver top) if there is room, else inside the lane at its left end
  const inc = state.stInc, lanes = inc && L.lanes;
  if (inc) {
    const lp = (t, y, c) => {
      ctx.font = font(fs - 1, 700);
      const w = textW(ctx, t) + 14, o = oP('#fff', c);
      o.stroke = c;
      if (!(xc - 6 - w >= 4 && tag(ctx, t, xc - 6 - w / 2, y, o))) tag(ctx, t, xc + w / 2 + 4, y, o);
    };
    if (lanes) { lp('Sóng tới →', L.ly1, ORG); lp('Sóng phản xạ ←', L.ly2, BLU); occ.push([xc, L.ly1 - L.lb / 2, xR, L.ly2 + L.lb / 2 - 4]); }
    else { lp('Sóng tới →', cy - A - r - 84, ORG); lp('Sóng phản xạ ←', cy - A - r - 110, BLU); }
  }
  if (!L.steady) {   // still forming: no nút / bụng / λ/2 yet
    tag(ctx, 'Đang hình thành sóng dừng', xc + lpx / 2, cy + A + r + 28, {size: fs, fill: '#fff', stroke: C.ink2, color: C.ink});
    return;
  }
  ctx.strokeStyle = 'rgba(21,24,29,.5)'; ctx.lineWidth = 1.2; ctx.setLineDash(DASH2);
  for (const sg of [-1, 1]) {
    ctx.beginPath();
    for (let x = 0; x <= lpx + 0.1; x += 3) { const y = cy + sg * A * env(lpx - x); x ? ctx.lineTo(xc + x, y) : ctx.moveTo(xc + x, y); }
    ctx.stroke();
  }
  ctx.setLineDash(NONE);
  const yB = cy - A - r - 28, yN = cy + A + r + 28, yRa = cy - A - r - 56, yRn = cy + A + r + 56, yC = cy + A + r + 84;   // clear of the velocity arrows
  const lam2 = L.lam / 2;
  ctx.font = font(fs - 1, 700);
  // short pills when a "Ngược pha" pill must fit between two bụng pills (λ/2 apart)
  const tN = lam2 < textW(ctx, 'Nút sóng') + 22 ? 'Nút' : 'Nút sóng', tB = lam2 < textW(ctx, 'Bụng sóng') + textW(ctx, 'Ngược pha') + 44 ? 'Bụng' : 'Bụng sóng';
  // ruler + reserve its line and its label (inside, or beside it as ink.ruler() places it)
  const rul = (x1, x2, y) => {
    ctx.font = font(fs, 700, true);
    const tw = textW(ctx, halfLam()) + 14, inside = x2 - x1 > tw + 26, right = x2 + 10 + tw <= L.w - 4;
    occ.push([x1, y - 10, x2, y + 10]);
    if (!inside) occ.push(right ? [x2, y - 11, x2 + 12 + tw, y + 11] : [x1 - 12 - tw, y - 11, x1, y + 11]);
    ruler(ctx, x1, x2, y, halfLam(), {size: fs, color: C.ink, maxX: L.w - 4});
  };
  const anti = L.anti, nodes = L.nodes;
  // λ/2 rulers: antinode–antinode above (red ↔ orange), node–node below (the bó of the orange bead, else of the red one)
  if (anti.length > 1) rul(xc + anti[0], xc + anti[1], yRa);
  const pick = anti.length > 1 ? anti[1] : anti[0];
  let b0 = -1;
  for (let j = 0; j + 1 < nodes.length; j++) if (nodes[j] < pick && nodes[j + 1] > pick) b0 = j;
  if (b0 >= 0) {
    const n0 = xc + nodes[b0], n1 = xc + nodes[b0 + 1];
    rul(n0, n1, yRn);
    tag(ctx, 'Cùng pha', (n0 + n1) / 2, yC, {size: fs - 1, fill: '#fff', stroke: C.ink2, color: C.ink2});
  }
  // free end = antinode (replaces that bụng pill), then bụng / nút pills
  if (fr) { ctx.font = font(fs - 1, 700); const fw = textW(ctx, 'Đầu tự do = bụng') + 14; tag(ctx, 'Đầu tự do = bụng', Math.min(xR, L.w - 6 - fw / 2), yB, oP(C.comp)); }
  for (const x of anti) tag(ctx, tB, xc + x, yB, oP(C.comp));
  for (const x of nodes) if (x > 1) tag(ctx, tN, xc + x, yN, oP(C.rare));
  // "Ngược pha" between the red and orange beads: on the bụng row over the node between them, else above the λ/2 ruler
  if (state.track && anti.length > 1) {
    const xm = xc + (anti[0] + anti[1]) / 2, o = {size: fs - 1, fill: '#fff', stroke: C.track, color: C.track};
    if (!tag(ctx, 'Ngược pha', xm, yB, o)) tag(ctx, 'Ngược pha', xm, yRa - 26, o);
  }
  // the driver end ≈ node: under the driver body (below the nút row), else right of the body
  const dn = 'Đầu gắn cần rung ≈ nút';
  ctx.font = font(fs - 1, 700);
  const dw = textW(ctx, dn) + 14;
  if (!tag(ctx, dn, Math.max(4 + dw / 2, xc), Math.max(cy + 168 * s + 16, yN + 24), oP('#fff', C.ink2))) tag(ctx, dn, xc + 66 * s + dw / 2 + 4, yN, oP('#fff', C.ink2));
  // velocity arrows on beads with envelope > 0,4·A: same direction in one bó, opposite in neighbouring bó
  let vt = L.Td;
  if (Math.abs(vt) < 0.05) vt = -L.T;                // at an extreme: the direction it is about to move (toward VTCB)
  const every = dx < 15 ? 2 : 1, al = Math.max(10, Math.min(18, A * 0.35));
  for (let i = 0; i < N; i += every) {
    const Si = S[i]; if (Math.abs(Si) <= 0.4) continue;
    const dir = Si * vt > 0 ? -1 : 1;               // screen y: up is negative
    const x = xs[i], y = ys[i] + dir * (r + 2);
    arrow(ctx, x, y, x, y + dir * al, {color: i === L.iR || i === L.iO ? C.track : C.ink2, width: 1.5, size: 5});
  }
  if (!inc) return;
  // reflection phase at the right end (between the lanes and the string, else high above it), and the superposition note
  const right = (t, ys, o) => {
    ctx.font = font(o.size, 700);
    const x = Math.min(xR, L.w - 6 - (textW(ctx, t) + 14) / 2);
    for (const y of ys) if (tag(ctx, t, x, y, o)) return true;
    return false;
  };
  const yE = lanes ? [L.ly2 + L.lb / 2 + 8, yRa - 26, L.ly1 + L.lb / 2] : [yRa - 26, yRa - 52];
  const oE = {size: fs - 1, fill: '#fff', stroke: BLU, color: BLU};
  if (!right(fr ? 'Phản xạ ở đầu tự do: cùng pha' : 'Phản xạ ở đầu cố định: ngược pha', yE, oE)) right(fr ? 'Đầu tự do: cùng pha' : 'Đầu cố định: ngược pha', yE, oE);
  right('Sóng dừng = sóng tới + sóng phản xạ', [yC, yC + 26], {size: fs - 1, fill: '#fff', stroke: C.ink2, color: C.ink});
}

function controls() {
  const nVal = h('span', {class: 'val'}), aVal = h('span', {class: 'val'}), vVal = h('span', {class: 'val'});
  const aS = slider({min: A_MIN * 2, max: A_MAX * 2, step: 1, label: 'Biên độ bụng', pos: () => Math.round(state.stA * 2), apply: v => set('stA', v / 2),
    sync: () => { aVal.replaceChildren(dec(state.stA, 2), h('small', {text: 'cm'})); }});
  const vS = slider({min: V_MIN * 2, max: V_MAX * 2, step: 1, label: 'Tốc độ truyền sóng', pos: () => Math.round(state.stv * 2), apply: p => set('stv', p / 2),
    sync: () => { vVal.replaceChildren(dec(state.stv, 3), h('small', {text: 'm/s'})); }});
  const nSync = () => { nVal.textContent = 'n = ' + state.stN + ' · f = ' + num(fN()) + ' Hz'; };
  bind(nSync);
  const nChips = h('div', {class: 'chips g6'}, ...[1, 2, 3, 4, 5, 6].map(k => chip(String(k), () => state.stN === k, () => set('stN', k), 'sm')));
  return [
    group('wave', 'Sóng dừng trên dây',
      seg([['fixed', 'Hai đầu cố định'], ['free', 'Một đầu tự do']], () => state.stEnd, v => set('stEnd', v), 'Đầu dây'),
      lab('freq', 'Số bụng sóng', nVal), nChips,
      lab('transverse', 'Biên độ bụng A', aVal), aS,
      lab('medium', 'Tốc độ truyền v', vVal), vS,
      ...slowControl(20)),
    group('show', 'Hiển thị',
      h('div', {class: 'tgs'},
        toggle('target', 'Phần tử đỏ', () => state.track, v => set('track', v), 'Theo dõi hai phần tử ở hai bụng kề nhau'),
        toggle('beads', 'Chỉ phần tử', () => state.beadsOnly, v => set('beadsOnly', v), 'Chỉ vẽ các phần tử và vị trí cân bằng'),
        toggle('medium', 'Sóng tới – phản xạ', () => state.stInc, v => set('stInc', v), 'Vẽ sóng tới và sóng phản xạ')))
  ];
}

// mini-scope: red (first antinode) and orange (next antinode) on ONE axis → antiphase
const PR = {xy: false, a: 0, b: 0, ca: '#d7191f', cb: '#e8590c', lane: 'overlay', two: true};
function probe() {
  sync();
  const k = 1 / (L.apx || 1);
  PR.a = uAt(L.iR * L.dx) * k; PR.two = L.iO >= 0; PR.b = PR.two ? uAt(L.iO * L.dx) * k : 0;
  return PR;
}

export default {
  probe, id: 'standing', group: 'mech', title: 'Sóng dừng', short: 'Dừng', icon: 'standing',
  defaults: {get slow() { return autoSlow(); }},
  metrics: () => ({f: fN(), v: state.stv}),
  readout, controls, layout, draw, annotate, update() {}, reset() {}
};
