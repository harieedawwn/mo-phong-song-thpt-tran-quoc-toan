// Sóng điện từ: oblique 2D projection – E (vertical, orange) and B (along z drawn at 30°, blue) in phase, u = cos(ωt − kx),
// plus the spectrum bar of Bảng 11.1 SGK KNTT (one rounded 7-segment bar, gamma → vô tuyến; visible light = rainbow). The on-screen wavelength is
// relative (geometric steps by band); readouts show the real values (λ = c/f with the band's representative frequency).
import {state, set} from '../state.js';
import {h, toggle, group, slowControl} from '../ui.js';
import {lenParts} from '../fmt.js';
import {clamp, TAU} from '../physics.js';
import {C, font, pill, text, arrow, ruler, roundRect, textW, fx} from '../draw/ink.js';

const CC = 3e8;
// verbatim from Bảng 11.1; f = representative frequency used for the readout
const BANDS = [
  {name: 'Tia gamma', short: 'Gamma', lam: '10⁻⁵ nm – 0,1 nm', fr: '3·10¹⁸ – 3·10²² Hz', ex: 'Phóng xạ', f: 3e20, fText: '3·10²⁰ Hz', col: '#9a9ea8'},
  {name: 'Tia X', short: 'Tia X', lam: '30 pm – 3 nm', fr: '10¹⁷ – 10¹⁹ Hz', ex: 'Chụp X-quang', f: 3e18, fText: '3·10¹⁸ Hz', col: '#8fb4dc'},
  {name: 'Tia tử ngoại', short: 'Tử ngoại', lam: '10 nm – 400 nm', fr: '7,5·10¹⁴ – 3·10¹⁶ Hz', ex: 'Mặt Trời, đèn diệt khuẩn', f: 1e15, fText: '10¹⁵ Hz', col: '#c3b1e8'},
  {name: 'Ánh sáng nhìn thấy', short: 'Nhìn thấy', lam: '0,38 µm – 0,76 µm', fr: '3,9·10¹⁴ – 7,9·10¹⁴ Hz', ex: 'Ánh sáng (đỏ → tím)', f: 5e14, fText: '5·10¹⁴ Hz', col: null},
  {name: 'Tia hồng ngoại', short: 'Hồng ngoại', lam: '0,76 µm – 1 mm', fr: '3·10¹¹ – 3,9·10¹⁴ Hz', ex: 'Điều khiển TV, thân nhiệt', f: 3e13, fText: '3·10¹³ Hz', col: '#f2a6a0'},
  {name: 'Sóng vi ba', short: 'Vi ba', lam: '1 mm – 1 m', fr: '3·10⁸ – 3·10¹¹ Hz', ex: 'Lò vi sóng 2,45 GHz', f: 2.45e9, fText: '2,45 GHz', col: '#a9d6c9'},
  {name: 'Sóng vô tuyến', short: 'Vô tuyến', lam: '1 m – 100 km', fr: '3·10³ – 3·10⁸ Hz', ex: 'Đài FM 100 MHz', f: 1e8, fText: '100 MHz', col: '#c5d0e0'}
];
const RAINBOW = ['#8e2bb5', '#4263eb', '#1c9bd6', '#40c057', '#fcc419', '#f76707', '#e03131'];   // tím → đỏ (λ increasing, left → right)
const BX = 0.55, BY = 0.32;               // z axis on screen: 30° up-right, foreshortened ×0.64 (cavalier)
const L = {};
let xs = new Float32Array(0);
const DARK_E = '#7a2f06', DARK_B = '#0c3f73';

function layout(w, hh) {
  const phone = w < 600;
  L.w = w; L.h = hh; L.phone = phone; L.fs = phone ? 11 : 12.5;
  L.mx = phone ? 8 : 18;
  L.short = !phone && hh < 470;
  L.bh = phone ? 26 : L.short ? 24 : 36;      // bar height
  L.nameH = phone ? 22 : L.short ? 18 : 24;
  L.pb = phone ? 58 : L.short ? 52 : 62;      // room for the Phát / Tạm dừng buttons
  L.botH = 16 + 6 + L.bh + 4 + L.nameH + 6 + L.pb;
  L.micro = hh < 300;
  if (L.micro) { L.botH = 0; L.top = 40; } else L.top = phone ? 86 : L.short ? 44 : 64;
  L.bw = (w - 2 * L.mx) / 7;
  L.yBlocks = hh - L.botH + 22;
  L.x0 = phone ? 30 : 52;
  L.vis = clamp(w * 0.14, 60, 150);
  const rh = hh - L.botH - L.top;
  L.rh = rh;
  const extra = L.micro ? 10 : L.short ? 40 : 86;
  L.emax = clamp((rh - extra) / 2, 18, phone ? 100 : 130);
  L.y0 = L.micro ? L.top + rh * 0.5 : L.short ? L.top + 8 + L.emax : L.top + (rh - (2 * L.emax + 68)) / 2 + 26 + L.emax;
  const n = Math.ceil(w / 3) + 2;
  if (xs.length < n) xs = new Float32Array(n);
}
// drawn λ grows with the band index (gamma shortest … vô tuyến longest)
const lamPx = i => {
  const hi = L.phone ? L.w * 0.5 : L.w * 0.36, lo = L.phone ? L.w * 0.14 : L.w * 0.075;
  return hi * Math.pow(lo / hi, (6 - i) / 6);
};
const amp = (xr, front, lam) => { const e = (front - xr) / (lam * 0.35); return e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e); };

// one arrow train; (dx, dy) = unit vector of the positive field axis on screen. Dark outline pass under the colour pass = depth.
function train(ctx, x0, y0, lam, front, ph0, len, dx, dy, color, dark, arrows, hd) {
  const k = TAU / lam, step = Math.max(lam / 12, 7), n = Math.floor((L.w - 4 - x0) / step);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (arrows) {
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = ctx.fillStyle = pass ? color : dark; ctx.lineWidth = pass ? 2 : 4;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const xr = i * step; if (xr > front) break;
        const l = len * amp(xr, front, lam) * Math.cos(ph0 - k * xr); if (Math.abs(l) < 2.5) continue;
        const bx = x0 + xr, by = y0, tx = bx + dx * l, ty = by + dy * l;
        const a = Math.atan2(ty - by, tx - bx), s = Math.min(hd, Math.abs(l) * 0.55);
        ctx.moveTo(bx, by); ctx.lineTo(tx - Math.cos(a) * s * 0.6, ty - Math.sin(a) * s * 0.6);
        ctx.moveTo(tx, ty); ctx.lineTo(tx - s * Math.cos(a - 0.45), ty - s * Math.sin(a - 0.45)); ctx.lineTo(tx - s * Math.cos(a + 0.45), ty - s * Math.sin(a + 0.45)); ctx.closePath();
      }
      ctx.stroke(); ctx.fill();
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass ? color : dark; ctx.lineWidth = pass ? 2.6 : 4.6; ctx.beginPath();
    let first = true;
    for (let xr = 0; xr <= Math.min(front, L.w - x0); xr += 3) {
      const l = len * amp(xr, front, lam) * Math.cos(ph0 - k * xr);
      const px = x0 + xr + dx * l, py = y0 + dy * l;
      first ? ctx.moveTo(px, py) : ctx.lineTo(px, py); first = false;
    }
    ctx.stroke();
  }
}

const geom = () => {
  const lam = lamPx(state.band), em = L.emax, bm = Math.min(em * 1.25, lam * 0.27), front = L.vis * state.t;
  return {lam, em, bm, front, ph0: TAU / lam * front};
};

function draw(ctx) {
  if (!L.w) return;
  const {w, phone} = L, {lam, em, bm, front, ph0} = geom(), x0 = L.x0, y0 = L.y0;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // faint tinted planes: E-plane (x–E) and B-plane (x–z) for 3D reading
  const xe = Math.min(x0 + front, w - 4);
  if (xe > x0 + 6) {
    if (state.emE) { ctx.fillStyle = 'rgba(232,89,12,.07)'; ctx.fillRect(x0, y0 - em - 4, xe - x0, 2 * em + 8); }
    if (state.emB) {
      const bx = BX * (bm + 6), by = BY * (bm + 6);
      ctx.fillStyle = 'rgba(28,126,214,.07)'; ctx.beginPath();
      ctx.moveTo(x0 - bx, y0 + by); ctx.lineTo(xe - bx, y0 + by); ctx.lineTo(xe + bx, y0 - by); ctx.lineTo(x0 + bx, y0 - by); ctx.closePath(); ctx.fill();
    }
  }
  // axes (thin ink): propagation x, E vertical, B along z
  ctx.lineWidth = 1.5;
  arrow(ctx, x0 - 12, y0, w - 6, y0, {width: 1.5, size: 7, color: C.ink2});
  arrow(ctx, x0, y0 + em * 0.15, x0, y0 - em - 12, {width: 1.5, size: 7, color: C.comp});
  const bz = bm + 14;
  arrow(ctx, x0, y0, x0 + BX * bz, y0 - BY * bz, {width: 1.5, size: 7, color: C.rare});

  // B (behind) then E (front)
  if (state.emB) train(ctx, x0, y0, lam, front, ph0, bm, BX, -BY, C.rare, DARK_B, state.emArrows, phone ? 6 : 8);
  if (state.emE) train(ctx, x0, y0, lam, front, ph0, em, 0, -1, C.comp, DARK_E, state.emArrows, phone ? 6 : 8);

  // source: antenna mast at x0
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0 - 5, y0 + em * 0.55); ctx.lineTo(x0 - 5, y0 - 4); ctx.lineTo(x0 + 5, y0 - 4); ctx.lineTo(x0 + 5, y0 + em * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();

  if (!L.micro) drawBar(ctx);
}

// paused only: every word, the λ ruler and the "cùng pha" marker
function annotate(ctx) {
  if (!L.w) return;
  const {w, fs, phone} = L, {lam, em, bm, front} = geom(), x0 = L.x0, y0 = L.y0, band = BANDS[state.band] || BANDS[6];
  const bz = bm + 14;
  pill(ctx, 'E', x0 - 14, y0 - em - 14, {size: fs, fill: C.comp, stroke: C.comp, color: '#fff', pad: 6});
  pill(ctx, 'B', x0 + BX * bz + 14, y0 - BY * bz - 8, {size: fs, fill: C.rare, stroke: C.rare, color: '#fff', pad: 6});
  if (L.micro) return;

  // λ ruler between two E crests
  const ry = y0 + em + 20;
  if (state.emE && front > 1.6 * lam) {
    let xb = x0 + front - 0.5 * lam;
    xb -= Math.max(0, Math.ceil((xb - (w - 24)) / lam)) * lam;
    const xa = xb - lam;
    if (xa >= x0 + 8) {
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(xa, y0 - em); ctx.lineTo(xa, ry - 7); ctx.moveTo(xb, y0 - em); ctx.lineTo(xb, ry - 7); ctx.stroke(); ctx.setLineDash([]);
      const [a, b] = lenParts(CC / band.f);
      ruler(ctx, xa, xb, ry, 'λ = ' + a + ' ' + b, {size: fs, maxX: w - 4});
    }
  }
  if (state.emE && state.emB) inPhase(ctx, x0, y0, lam, front, em, bm);

  // propagation arrow + speed
  if (L.short) text(ctx, 'v = c = 3·10⁸ m/s', w - 8, y0 + 14, {size: fs, weight: 700, align: 'right', color: C.ink2});
  else {
    const py = ry + 22;
    arrow(ctx, x0 - 12, py, x0 + (phone ? 28 : 40), py, {width: 2, size: 8, color: C.ink2});
    text(ctx, 'Phương truyền sóng (v = c = 3·10⁸ m/s)', x0 + (phone ? 36 : 48), py, {size: fs, weight: 700, align: 'left', color: C.ink2});
  }
  // legend
  const lx = phone ? 10 : w - 12, al = phone ? 'left' : 'right', ly = phone ? L.top - 28 : 16;
  text(ctx, 'E ⟂ B ⟂ v → sóng ngang', lx, ly, {size: fs + 1, weight: 800, align: al});
  if (!L.short) text(ctx, 'Truyền được trong chân không', lx, ly + 17, {size: fs, weight: 600, align: al, color: C.muted});

  // spectrum direction
  const ay = L.yBlocks - 14;
  arrow(ctx, L.mx, ay, w - L.mx, ay, {width: 1.6, size: 7, color: C.muted});
  pill(ctx, 'bước sóng tăng →', w / 2, ay, {size: fs - 1, fill: C.paper, stroke: null, color: C.muted});
  text(ctx, '← tần số tăng', L.mx + 4, ay - 11, {size: fs - 1.5, weight: 600, align: 'left', color: C.muted});
}

// "Cùng pha": one fully formed crest; the E arrow and the B arrow from the SAME axis point are both at maximum
function inPhase(ctx, x0, y0, lam, front, em, bm) {
  const span = Math.min(front - 0.4 * lam, L.w - 16 - x0);
  if (span < 0.6 * lam) return;
  const mid = span * (L.phone ? 0.5 : 0.55);
  const m = Math.max(1, Math.round((front - mid) / lam)), xr = front - m * lam;
  if (xr < 0.3 * lam || xr > span) return;
  const x = x0 + xr, yE = y0 - em, bx = x + BX * bm, by = y0 - BY * bm;
  ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(x, yE - 4); ctx.lineTo(x, y0 + 10); ctx.stroke(); ctx.setLineDash([]);
  arrow(ctx, x, y0, x, yE, {width: 7.5, size: 14, color: '#fff'});
  arrow(ctx, x, y0, x, yE, {width: 3.4, size: 10, color: '#c2410c'});
  arrow(ctx, x, y0, bx, by, {width: 7.5, size: 14, color: '#fff'});
  arrow(ctx, x, y0, bx, by, {width: 3.4, size: 10, color: '#1361ad'});
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y0, 3.6, 0, TAU); ctx.fill();
  const t = L.phone ? 'Cùng pha: E, B cùng cực đại' : 'Cùng pha: E và B cùng đạt cực đại tại một điểm';
  ctx.font = font(L.fs - 0.5, 700);
  const tw = textW(ctx, t) + 14, lx = clamp(x, tw / 2 + 4, L.w - tw / 2 - 4);
  pill(ctx, t, lx, yE - 16, {size: L.fs - 0.5});
}

// one rounded bar, 7 segments (gamma → vô tuyến) with soft vertical gradients; selected segment is raised with a red outline
function segFill(ctx, i, x, y, ww, bh) {
  const b = BANDS[i];
  if (b.col) ctx.fillStyle = b.col;
  else { const g = ctx.createLinearGradient(x, 0, x + ww, 0); RAINBOW.forEach((c, j) => g.addColorStop(j / 6, c)); ctx.fillStyle = g; }
  ctx.fillRect(x, y, ww, bh);
  const v = ctx.createLinearGradient(0, y, 0, y + bh);
  v.addColorStop(0, 'rgba(255,255,255,.38)'); v.addColorStop(0.45, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(0,0,0,.2)');
  ctx.fillStyle = v; ctx.fillRect(x, y, ww, bh);
}
function drawBar(ctx) {
  const {fs, phone, mx, bw, bh, yBlocks: y} = L, W = bw * 7;
  ctx.save(); ctx.beginPath(); roundRect(ctx, mx, y, W, bh, bh * 0.4); ctx.clip();
  for (let i = 0; i < 7; i++) segFill(ctx, i, mx + i * bw, y, bw + 0.5, bh);
  ctx.strokeStyle = 'rgba(21,24,29,.45)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 1; i < 7; i++) { ctx.moveTo(mx + i * bw, y); ctx.lineTo(mx + i * bw, y + bh); }
  ctx.stroke(); ctx.restore();
  ctx.beginPath(); roundRect(ctx, mx, y, W, bh, bh * 0.4); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.stroke();
  const si = state.band, sx = mx + si * bw, lift = 4;
  ctx.beginPath(); roundRect(ctx, sx - 1, y - lift + 3, bw + 2, bh + 2, 7); ctx.fillStyle = 'rgba(30,24,10,.28)'; ctx.fill();   // flat drop shadow (no shadowBlur per frame)
  ctx.save(); ctx.beginPath(); roundRect(ctx, sx - 1, y - lift, bw + 2, bh + 2, 7); ctx.clip();
  segFill(ctx, si, sx - 1, y - lift, bw + 2, bh + 2); ctx.restore();
  ctx.beginPath(); roundRect(ctx, sx - 1, y - lift, bw + 2, bh + 2, 7); ctx.strokeStyle = C.red; ctx.lineWidth = 2.8; ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const nm = phone || L.short ? BANDS[i].short : BANDS[i].name, sel = i === si, cx = mx + i * bw + bw / 2, ny = y + bh + 4 + L.nameH / 2;
    const col = sel ? C.red : C.ink, nsz = phone ? 9.5 : L.short ? fs - 1 : fs, wt = sel ? 800 : 700;
    ctx.font = font(nsz, wt);
    if (nm.indexOf(' ') > 0 && textW(ctx, nm) > bw - 4) {
      const parts = nm.split(' '), mid = Math.ceil(parts.length / 2);
      text(ctx, parts.slice(0, mid).join(' '), cx, ny - nsz * 0.6, {size: nsz, weight: wt, color: col});
      text(ctx, parts.slice(mid).join(' '), cx, ny + nsz * 0.6, {size: nsz, weight: wt, color: col});
    } else text(ctx, nm, cx, ny, {size: nsz, weight: wt, color: col});
  }
}

function pointer(x, y) {
  if (L.micro || y < L.yBlocks - 8 || y > L.yBlocks + L.bh + L.nameH + 6) return;
  const i = Math.floor((x - L.mx) / L.bw);
  if (i >= 0 && i < 7) set('band', i);
}

function controls() {
  return [
    group('wave', 'Làm chậm', ...slowControl()),
    group('show', 'Hiển thị',
      h('div', {class: 'tgs'},
        toggle('em', 'Điện trường E', () => state.emE, v => set('emE', v)),
        toggle('freq', 'Từ trường B', () => state.emB, v => set('emB', v)),
        toggle('transverse', 'Mũi tên', () => state.emArrows, v => set('emArrows', v))))
  ];
}

export default {
  id: 'em', title: 'Sóng điện từ', short: 'Sóng điện từ', icon: 'em',
  defaults: {slow: 1},
  metrics: () => ({f: BANDS[state.band].f, v: CC}),
  readout: () => { const b = BANDS[state.band]; return b.name + ' · λ ' + b.lam + ' · f ' + b.fr + ' · ' + b.ex; },
  controls,
  layout, draw, annotate, pointer, update() {}, reset() {}
};
