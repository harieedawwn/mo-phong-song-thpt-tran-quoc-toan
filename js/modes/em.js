// Sóng điện từ: oblique 2D projection – E (vertical, orange) and B (along z drawn at 30°, blue) in phase, u = cos(ωt − kx),
// plus the spectrum scale of Bảng 11.1 SGK KNTT (7 flat blocks; visible light = 7 solid stripes). The on-screen wavelength is
// relative (geometric steps by band); readouts show the real values (λ = c/f with the band's representative frequency).
import {state, set} from '../state.js';
import {h, chip, toggle, group, lab, slowControl} from '../ui.js';
import {lenParts, sciOf, num} from '../fmt.js';
import {clamp, TAU} from '../physics.js';
import {C, font, pill, text, arrow, ruler, roundRect, textW} from '../draw/ink.js';

const CC = 3e8;
// verbatim from Bảng 11.1; f = representative frequency used for the readout
const BANDS = [
  {name: 'Sóng vô tuyến', short: 'Vô tuyến', lam: '1 m – 100 km', fr: '3·10³ – 3·10⁸ Hz', ex: 'Đài FM 100 MHz', f: 1e8, fText: '100 MHz', col: '#c5d0e0'},
  {name: 'Sóng vi ba', short: 'Vi ba', lam: '1 mm – 1 m', fr: '3·10⁸ – 3·10¹¹ Hz', ex: 'Lò vi sóng 2,45 GHz', f: 2.45e9, fText: '2,45 GHz', col: '#a9d6c9'},
  {name: 'Tia hồng ngoại', short: 'Hồng ngoại', lam: '0,76 µm – 1 mm', fr: '3·10¹¹ – 3,9·10¹⁴ Hz', ex: 'Điều khiển TV, thân nhiệt', f: 3e13, fText: '3·10¹³ Hz', col: '#f2a6a0'},
  {name: 'Ánh sáng nhìn thấy', short: 'Nhìn thấy', lam: '0,38 µm – 0,76 µm', fr: '3,9·10¹⁴ – 7,9·10¹⁴ Hz', ex: 'Ánh sáng (đỏ → tím)', f: 5e14, fText: '5·10¹⁴ Hz', col: null},
  {name: 'Tia tử ngoại', short: 'Tử ngoại', lam: '10 nm – 400 nm', fr: '7,5·10¹⁴ – 3·10¹⁶ Hz', ex: 'Mặt Trời, đèn diệt khuẩn', f: 1e15, fText: '10¹⁵ Hz', col: '#c3b1e8'},
  {name: 'Tia X', short: 'Tia X', lam: '30 pm – 3 nm', fr: '10¹⁷ – 10¹⁹ Hz', ex: 'Chụp X-quang', f: 3e18, fText: '3·10¹⁸ Hz', col: '#8fb4dc'},
  {name: 'Tia gamma', short: 'Gamma', lam: '10⁻⁵ nm – 0,1 nm', fr: '3·10¹⁸ – 3·10²² Hz', ex: 'Phóng xạ', f: 3e20, fText: '3·10²⁰ Hz', col: '#9a9ea8'}
];
const RAINBOW = ['#e03131', '#f76707', '#fcc419', '#40c057', '#339af0', '#4263eb', '#9c36b5'];
const BX = 0.55, BY = 0.32;               // z axis on screen: 30° up-right, foreshortened ×0.64 (cavalier) – keeps the B tip curve free of loops
const L = {};
let xs = new Float32Array(0);

function layout(w, hh) {
  const phone = w < 600;
  L.w = w; L.h = hh; L.phone = phone; L.fs = phone ? 11 : 12.5;
  L.mx = phone ? 8 : 18;
  L.bh = phone ? 30 : 44;                     // block height
  L.nameH = phone ? 24 : 30;
  L.infoH = phone ? 62 : 46;
  L.pb = phone ? 58 : 62;                     // room for the Phát / Tạm dừng buttons
  L.botH = 16 + 6 + L.bh + 4 + L.nameH + 6 + L.infoH + 6 + L.pb;
  L.micro = hh < 300;                         // phone landscape: wave only (full layout comes in the polish phase)
  if (L.micro) { L.botH = 0; L.top = 40; } else L.top = phone ? 86 : 64;
  L.bw = (w - 2 * L.mx) / 7;
  L.yBlocks = hh - L.botH + 22;
  L.yInfo = L.yBlocks + L.bh + 4 + L.nameH + 6;
  L.x0 = phone ? 30 : 52;
  L.vis = clamp(w * 0.14, 60, 150);           // drawn propagation speed (px/s) – same for every band, as in reality
  const rh = hh - L.botH - L.top;             // height of the wave region
  L.rh = rh;
  L.emax = clamp((rh - (L.micro ? 10 : 86)) / 2, 18, phone ? 100 : 130);
  L.y0 = L.micro ? L.top + rh * 0.5 : L.top + (rh - (2 * L.emax + 68)) / 2 + 26 + L.emax;
  const n = Math.ceil(w / 3) + 2;
  if (xs.length < n) xs = new Float32Array(n);
}
const lamPx = i => {
  const hi = L.phone ? L.w * 0.5 : L.w * 0.36, lo = L.phone ? L.w * 0.14 : L.w * 0.075;
  return hi * Math.pow(lo / hi, i / 6);
};

// one arrow train; field direction (dx, dy) is the unit vector of the positive field axis on screen
function train(ctx, x0, y0, lam, front, ph0, len, dx, dy, color, arrows, hd) {
  const k = TAU / lam, step = Math.max(lam / 12, 7), n = Math.floor((L.w - 4 - x0) / step);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (arrows) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const xr = i * step; if (xr > front) break;
      const u = amp(xr, front, lam) * Math.cos(ph0 - k * xr);
      const l = len * u; if (Math.abs(l) < 2.5) continue;
      const bx = x0 + xr, by = y0, tx = bx + dx * l, ty = by + dy * l;
      const a = Math.atan2(ty - by, tx - bx), s = Math.min(hd, Math.abs(l) * 0.55);
      ctx.moveTo(bx, by); ctx.lineTo(tx - Math.cos(a) * s * 0.6, ty - Math.sin(a) * s * 0.6);
      ctx.moveTo(tx, ty); ctx.lineTo(tx - s * Math.cos(a - 0.45), ty - s * Math.sin(a - 0.45)); ctx.lineTo(tx - s * Math.cos(a + 0.45), ty - s * Math.sin(a + 0.45)); ctx.closePath();
    }
    ctx.stroke(); ctx.fill();
  }
  // outline joining the arrow tips (dense)
  ctx.lineWidth = 2.6; ctx.beginPath();
  let first = true;
  for (let xr = 0; xr <= Math.min(front, L.w - x0); xr += 3) {
    const l = len * amp(xr, front, lam) * Math.cos(ph0 - k * xr);
    const px = x0 + xr + dx * l, py = y0 + dy * l;
    first ? ctx.moveTo(px, py) : ctx.lineTo(px, py); first = false;
  }
  ctx.stroke();
}
const amp = (xr, front, lam) => { const e = (front - xr) / (lam * 0.35); return e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e); };

function draw(ctx) {
  if (!L.w) return;
  const {w, fs, phone} = L, band = BANDS[state.band] || BANDS[0];
  const lam = lamPx(state.band), x0 = L.x0, y0 = L.y0, em = L.emax, bm = Math.min(em * 1.25, lam * 0.27);
  const front = L.vis * state.t, k = TAU / lam, ph0 = k * front;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // --- axes (thin ink): propagation x, E vertical, B along z (30° up-right = "into the page")
  ctx.strokeStyle = C.ink2; ctx.fillStyle = C.ink2; ctx.lineWidth = 1.5;
  arrow(ctx, x0 - 12, y0, w - 6, y0, {width: 1.5, size: 7, color: C.ink2});
  arrow(ctx, x0, y0 + em * 0.15, x0, y0 - em - 12, {width: 1.5, size: 7, color: C.comp});
  const bz = bm + 14;
  arrow(ctx, x0, y0, x0 + BX * bz, y0 - BY * bz, {width: 1.5, size: 7, color: C.rare});
  if (!L.micro) pill(ctx, 'E', x0 - 14, y0 - em - 14, {size: fs, fill: C.comp, stroke: C.comp, color: '#fff', pad: 6});
  if (!L.micro) pill(ctx, 'B', x0 + BX * bz + 14, y0 - BY * bz - 8, {size: fs, fill: C.rare, stroke: C.rare, color: '#fff', pad: 6});

  // --- B (behind) then E (front)
  if (state.emB) train(ctx, x0, y0, lam, front, ph0, bm, BX, -BY, C.rare, state.emArrows, phone ? 6 : 8);
  if (state.emE) train(ctx, x0, y0, lam, front, ph0, em, 0, -1, C.comp, state.emArrows, phone ? 6 : 8);

  // --- source: antenna mast at x0
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0 - 5, y0 + em * 0.55); ctx.lineTo(x0 - 5, y0 - 4); ctx.lineTo(x0 + 5, y0 - 4); ctx.lineTo(x0 + 5, y0 + em * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();

  // --- λ ruler between two E crests, at the bottom of the wave region
  const ry = y0 + em + 20;
  if (!L.micro && state.ruler !== false && state.emE && front > 1.6 * lam) {
    let xb = x0 + front - 0.5 * lam;                  // newest crest that has fully formed
    xb -= Math.max(0, Math.ceil((xb - (w - 24)) / lam)) * lam;
    const xa = xb - lam;
    if (xa >= x0 + 8) {
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(xa, y0 - em); ctx.lineTo(xa, ry - 7); ctx.moveTo(xb, y0 - em); ctx.lineTo(xb, ry - 7); ctx.stroke(); ctx.setLineDash([]);
      const [a, b] = lenParts(CC / band.f);
      ruler(ctx, xa, xb, ry, 'λ = ' + a + ' ' + b, {size: fs, maxX: w - 4});
    }
  }
  if (L.micro) return;
  // propagation arrow + speed
  const py = ry + 22;
  arrow(ctx, x0 - 12, py, x0 + (phone ? 28 : 40), py, {width: 2, size: 8, color: C.ink2});
  text(ctx, 'Phương truyền sóng (v = c = 3·10⁸ m/s)', x0 + (phone ? 36 : 48), py, {size: fs, weight: 700, align: 'left', color: C.ink2});

  // --- legend (top-right on desktop, under the badges on phones)
  const lx = phone ? 10 : w - 12, al = phone ? 'left' : 'right', ly = phone ? L.top - 28 : 16;
  text(ctx, 'E ⟂ B ⟂ v → sóng ngang', lx, ly, {size: fs + 1, weight: 800, align: al});
  text(ctx, 'Truyền được trong chân không', lx, ly + 17, {size: fs, weight: 600, align: al, color: C.muted});
  if (!phone) {
    ctx.fillStyle = C.comp; ctx.fillRect(lx - 244, ly + 31, 12, 12); ctx.fillStyle = C.rare; ctx.fillRect(lx - 122, ly + 31, 12, 12);
    text(ctx, 'E: điện trường', lx - 226, ly + 37, {size: fs, weight: 700, align: 'left'}); text(ctx, 'B: cảm ứng từ', lx - 104, ly + 37, {size: fs, weight: 700, align: 'left'});
  }

  drawScale(ctx, band);
}

function drawScale(ctx, band) {
  const {w, fs, phone, mx, bw, bh, yBlocks} = L;
  // direction arrow
  const ay = yBlocks - 14;
  arrow(ctx, mx, ay, w - mx, ay, {width: 1.6, size: 7, color: C.muted});
  pill(ctx, 'bước sóng giảm, tần số tăng', w / 2, ay, {size: fs - 1, fill: C.paper, stroke: null, color: C.muted});
  for (let i = 0; i < 7; i++) {
    const b = BANDS[i], x = mx + i * bw + 2, ww = bw - 4, sel = i === state.band;
    ctx.lineJoin = 'round';
    if (b.col) { ctx.fillStyle = b.col; ctx.fillRect(x, yBlocks, ww, bh); }
    else { const sw = ww / 7; for (let s = 0; s < 7; s++) { ctx.fillStyle = RAINBOW[s]; ctx.fillRect(x + s * sw, yBlocks, Math.ceil(sw) + (s < 6 ? 0.5 : 0), bh); } }
    ctx.strokeStyle = sel ? C.red : C.ink; ctx.lineWidth = sel ? 3.5 : 1.5; ctx.strokeRect(x, yBlocks, ww, bh);
    // name below the block
    const nm = phone ? b.short : b.name, cx = x + ww / 2, ny = yBlocks + bh + 4 + L.nameH / 2;
    const col = sel ? C.red : C.ink;
    const nsz = phone ? 9.5 : fs, wt = sel ? 800 : 700;
    ctx.font = font(nsz, wt);
    if (nm.indexOf(' ') > 0 && textW(ctx, nm) > ww - 4) {
      const parts = nm.split(' '), mid = Math.ceil(parts.length / 2);
      text(ctx, parts.slice(0, mid).join(' '), cx, ny - nsz * 0.6, {size: nsz, weight: wt, color: col});
      text(ctx, parts.slice(mid).join(' '), cx, ny + nsz * 0.6, {size: nsz, weight: wt, color: col});
    } else text(ctx, nm, cx, ny, {size: nsz, weight: wt, color: col});
  }
  // info card for the selected band
  const cx0 = mx, cw = w - 2 * mx, y = L.yInfo, hh = L.infoH, f = band.f;
  ctx.beginPath(); roundRect(ctx, cx0, y, cw, hh, 8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.fillStyle = C.red; ctx.fillRect(cx0 + 1, y + 8, 4, hh - 16);
  const [a, b] = lenParts(CC / f);
  const calc = 'λ = c/f = 3·10⁸ / ' + sciOf(f) + ' = ' + a + ' ' + b;
  const x = cx0 + 14;
  if (phone) {
    text(ctx, band.name + ' · ' + band.ex, x, y + 12, {size: 10.5, weight: 800, align: 'left', color: C.red});
    text(ctx, 'λ: ' + band.lam, x, y + 26, {size: 10, weight: 700, align: 'left', mono: true});
    text(ctx, 'f: ' + band.fr, x, y + 40, {size: 10, weight: 700, align: 'left', mono: true});
    text(ctx, calc, x, y + 54, {size: 10.5, weight: 800, align: 'left', mono: true, color: C.comp});
  } else {
    text(ctx, band.name + ' · ' + band.ex, x, y + 14, {size: fs + 1, weight: 800, align: 'left', color: C.red});
    text(ctx, 'λ: ' + band.lam + '     f: ' + band.fr, x, y + 32, {size: fs - 0.5, weight: 700, align: 'left', mono: true});
    text(ctx, calc, cx0 + cw - 14, y + hh / 2, {size: fs + 1.5, weight: 800, align: 'right', mono: true, color: C.comp});
  }
}

function pointer(x, y) {
  if (L.micro) return;
  if (y < L.yBlocks - 2 || y > L.yBlocks + L.bh + L.nameH + 6) return;
  const i = Math.floor((x - L.mx) / L.bw);
  if (i >= 0 && i < 7) set('band', i);
}

function controls() {
  return [
    group('wave', 'Chọn dải sóng',
      h('div', {class: 'chips g2'}, ...BANDS.map((b, i) => chip(b.short, () => state.band === i, () => set('band', i), 'sm'))),
      ...slowControl()),
    group('show', 'Hiển thị',
      h('div', {class: 'tgs'},
        toggle('pause', 'Dừng hình', () => !state.playing, v => set('playing', !v)),
        toggle('em', 'Điện trường E', () => state.emE, v => set('emE', v)),
        toggle('freq', 'Từ trường B', () => state.emB, v => set('emB', v)),
        toggle('transverse', 'Mũi tên', () => state.emArrows, v => set('emArrows', v)),
        toggle('ruler', 'Thước λ', () => state.ruler, v => set('ruler', v))))
  ];
}

export default {
  id: 'em', title: 'Sóng điện từ', short: 'Sóng điện từ', icon: 'em',
  defaults: {slow: 1},
  metrics: () => ({f: BANDS[state.band].f, v: CC}),
  features: () => [
    ['Phương dao động', 'E ⟂ B ⟂ phương truyền (sóng ngang)'],
    ['Phương truyền', 'Dọc theo trục x →'],
    ['Môi trường', 'Chân không và môi trường trong suốt'],
    ['Ví dụ', 'Sóng FM, lò vi sóng, ánh sáng, tia X']],
  controls,
  badges: () => L.phone ? ['Đã làm chậm rất nhiều', 'Biên độ phóng đại'] : ['Đã làm chậm rất nhiều', 'Biên độ phóng đại', 'λ vẽ theo tỉ lệ tương đối'],
  layout, draw, pointer, update() {}, reset() {}
};
