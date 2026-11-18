// Sóng dọc – Sóng âm: air layers (dot grid) displaced along x by u(x,t); colours from −∂u/∂x (vùng nén / vùng giãn).
import {state, set, bus} from '../state.js';
import {h, seg, chip, toggle, slider, group, lab, slowControl, bind} from '../ui.js';
import {lenParts, freqParts, slowText} from '../fmt.js';
import {SPEED, MEDIUM, HEARING, clamp, describePitch, niceSlow, makeWave} from '../physics.js';
import {C, font, pill, text, arrow, ruler, roundRect, textW} from '../draw/ink.js';
import {ball, drawBall, BALL, ballDpr} from '../draw/ball.js';
import {loadArt, layoutLabels, drawLabels} from '../art/sprite.js';

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

// Loudspeaker = art/speaker.svg (static cabinet / basket / magnet + moving layer "cone": cone, dust cap, voice coil).
// Surround + spider are canvas curves from a static anchor to the moving rim / coil, so they stretch with u(0,t).
const spkIn = loadArt('speaker'), spkOut = loadArt('speaker-out');      // cut-away | closed cabinet seen from outside (toggle "Xem bên trong loa")
for (const a of [spkIn, spkOut]) a.ready.then(() => { labelKey = ''; bus.emit('change', {key: 'art'}); });
let spkArt = spkOut;
const SPK_W = 156, SPK_H = 200;
const spkPt = (id, fx, fy) => spkArt.pt(id) || {x: fx, y: fy};
const spk = {
  w: SPK_W, h: SPK_H, x: 0, y: 0, s: 1,
  place(x, y, bw, bh, ax = 0.5, ay = 0.5) { const s = Math.min(bw / SPK_W, bh / SPK_H); this.s = s; this.x = x + (bw - SPK_W * s) * ax; this.y = y + (bh - SPK_H * s) * ay; },
  px(dx, dy) { return [this.x + dx * this.s, this.y + dy * this.s]; },
  rimH() { return spkPt('a-rimbot', 146, 156).y - spkPt('a-rimtop', 146, 44).y; },
  rimX() { return spkPt('a-rimtop', 146, 44).x; },
  rimCy() { return (spkPt('a-rimbot', 146, 156).y + spkPt('a-rimtop', 146, 44).y) / 2; },
  drawStatic() {},
  // dd = cone displacement in design units (+ toward the air) = u(0,t)/s, the same u as the first air layer
  drawDyn(ctx, dd) {
    const s = this.s, dpr = ballDpr();
    spkArt = state.inside ? spkIn : spkOut;
    if (spkArt.scale !== s || spkArt.dpr !== dpr) spkArt.render(s, dpr);
    spkArt.draw(ctx, this.x, this.y, {cone: {dx: dd}});
    if (!spkArt.layers.length || !state.inside) return;
    const X = (u) => this.x + u * s, Y = (v) => this.y + v * s;
    const rt = spkPt('a-rimtop', 146, 44), rb = spkPt('a-rimbot', 146, 156), ft = spkPt('a-fl-top', 139, 40), fb = spkPt('a-fl-bot', 139, 160);
    const st = spkPt('a-sp-top', 84, 76), sb = spkPt('a-sp-bot', 84, 124), cl = spkPt('a-coil', 84, 85);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // surround (gờ treo): rubber half-roll from the fixed basket flange to the moving cone rim
    for (const [f, r, k] of [[ft, rt, -1], [fb, rb, 1]]) {
      ctx.beginPath(); ctx.moveTo(X(f.x), Y(f.y)); ctx.quadraticCurveTo(X((f.x + r.x) / 2 + 2 + dd * 0.5), Y((f.y + r.y) / 2 + k * 8), X(r.x + dd), Y(r.y));
      ctx.strokeStyle = '#16181b'; ctx.lineWidth = 2.8 * s; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 0.8 * s; ctx.stroke();
    }
    // spider: corrugated cloth from the fixed basket to the moving voice coil
    for (const [a, k] of [[st, 1], [sb, -1]]) {
      const cy = cl.y + (k > 0 ? 0 : 30), x1 = X(cl.x - 2 + dd);
      ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y));
      ctx.bezierCurveTo(X(a.x + 4 + dd * 0.3), Y(a.y + k * 3), X(a.x - 5 + dd * 0.6), Y(a.y + k * 5), x1, Y(cy));
      ctx.strokeStyle = '#b9965f'; ctx.lineWidth = 1.8 * s; ctx.stroke();
    }
  }
};
const SPK_LAB_IN = [['cone', 'Màng loa', 'a-cone', 122, 65, 'top'], ['basket', 'Khung loa', 'a-basket', 108, 54, 'top', 1], ['coil', 'Cuộn dây', 'a-coil', 84, 85, 'bottom'], ['magnet', 'Nam châm', 'a-magnet', 42, 75, 'bottom']];
const SPK_LAB_OUT = [['cone', 'Màng loa', 'a-cone', 142, 70, 'top'], ['box', 'Thùng loa', 'a-box', 70, 150, 'bottom']];
const spkLabels = () => (state.inside ? SPK_LAB_IN : SPK_LAB_OUT)
  .map(([id, t, a, fx, fy, side, row]) => { const p = spkPt(a, fx, fy); return [id, t, p.x, p.y, side, row]; });
// Talker = art/talker.svg (head + sagittal cut of the vocal tract); moving layer "folds" (vocal folds) vibrates with u(0,t).
// The air column starts at the lips (anchor a-mouth) and is a bit narrower than the loudspeaker's (TALK_COL design units).
const tkArt = loadArt('talker');
tkArt.ready.then(() => { labelKey = ''; bus.emit('change', {key: 'art'}); });
const TALK_W = 232, TALK_H = 300, TALK_COL = 108;
const tkPt = (id, fx, fy) => tkArt.pt(id) || {x: fx, y: fy};
const talk = {
  w: TALK_W, h: TALK_H, x: 0, y: 0, s: 1,
  place(x, y, bw, bh, ax = 0.5, ay = 0.5) { const s = Math.min(bw / TALK_W, bh / TALK_H); this.s = s; this.x = x + (bw - TALK_W * s) * ax; this.y = y + (bh - TALK_H * s) * ay; },
  px(dx, dy) { return [this.x + dx * this.s, this.y + dy * this.s]; },
  mouth() { return tkPt('a-mouth', 211, 165.8); },
  drawStatic() {},
  // v = u(0,t) / A in −1…1: the folds move up/down and thicken/thin with the same oscillation that pushes the first air layer
  drawDyn(ctx, v) {
    const s = this.s, dpr = ballDpr();
    if (tkArt.scale !== s || tkArt.dpr !== dpr) tkArt.render(s, dpr);
    tkArt.draw(ctx, this.x, this.y, {folds: {dy: -1.3 * v, sy: 1 + 0.32 * v}});
  }
};
const TALK_LAB = [['nasal', 'Khoang mũi', 'a-nasal', 170, 143, 'top'], ['mouth', 'Khoang miệng', 'a-oral', 180, 154, 'top', 1], ['tongue', 'Lưỡi', 'a-tongue', 170, 178, 'bottom'],
  ['throat', 'Họng', 'a-throat', 127, 196, 'bottom'], ['cords', 'Dây thanh âm', 'a-cords', 139, 255, 'bottom']];
const talkLabels = () => TALK_LAB.map(([id, t, a, fx, fy, side, row]) => { const p = tkPt(a, fx, fy); return [id, t, p.x, p.y, side, row]; });
// Listener = art/head.svg mirrored (faces the source) + magnifier art/ear.svg (coronal cut: pinna, S-canal, eardrum, ossicles,
// cochlea, semicircular canals, nerve). Composite design box EAR_W × EAR_H; the canal axis (y = EAR_AX) is the air column's centre line.
const headArt = loadArt('head'), earArt = loadArt('ear');
for (const a of [headArt, earArt]) a.ready.then(() => { labelKey = ''; bus.emit('change', {key: 'art'}); });
const EAR_W = 300, EAR_H = 262, EAR_AX = 134;
const HD = {s: 0.5, x: 0, y: 40, w: 232, ex: 99.2, ey: 123.5};          // head.svg in the composite (mirrored); ex/ey = its ear (a-ear)
const ES = 0.98, EX = 188 - 148 * ES, EY = EAR_AX - 116 * ES;          // ear.svg disc centre (148,116) → composite (188, EAR_AX)
const earPt = (id, fx, fy) => { const p = earArt.pt(id) || {x: fx, y: fy}; return {x: EX + p.x * ES, y: EY + p.y * ES}; };
// lens callout: small ring round the head's ear + the two outer tangents to the bezel (composite units, computed once)
const CALL = (() => {
  const ex = HD.x + (HD.w - HD.ex) * HD.s, ey = HD.y + HD.ey * HD.s, cx = 188, cy = EAR_AX, r1 = 7, r2 = 113 * ES;
  const phi = Math.atan2(cy - ey, cx - ex), be = Math.acos((r1 - r2) / Math.hypot(cx - ex, cy - ey));
  return {ex, ey, r1, t: [phi + be, phi - be].map(a => [ex + r1 * Math.cos(a), ey + r1 * Math.sin(a), cx + r2 * Math.cos(a), cy + r2 * Math.sin(a)])};
})();
const EAR_MV = {drum: {dx: 0}, malleus: {rot: 0}, incus: {rot: 0}, stapes: {dx: 0}};   // reused every frame (no allocation)
const NV = new Float32Array([216, 145, 230, 139, 244, 133.4, 254, 129.6]);          // nerve centre line a-n0…a-n3 (ear.svg units)
earArt.ready.then(() => { for (let i = 0; i < 4; i++) { const p = earArt.pt('a-n' + i); if (p) { NV[i * 2] = p.x; NV[i * 2 + 1] = p.y; } } });
const ear = {
  w: EAR_W, h: EAR_H, x: 0, y: 0, s: 1,
  place(x, y, bw, bh, ax = 0.5, ay = 0.5) { const s = Math.min(bw / EAR_W, bh / EAR_H); this.s = s; this.x = x + (bw - EAR_W * s) * ax; this.y = y + (bh - EAR_H * s) * ay; },
  px(dx, dy) { return [this.x + dx * this.s, this.y + dy * this.s]; },
  // d = umbo displacement in ear.svg units (+ = into the middle ear, same sign as the air displacement u at the canal);
  // phase = nerve-pulse phase 0…1, −1 while the wave has not reached the ear
  draw(ctx, d, phase) {
    const s = this.s, dpr = ballDpr(), X = this.x, Y = this.y;
    if (headArt.scale !== s * HD.s || headArt.dpr !== dpr) headArt.render(s * HD.s, dpr);
    if (earArt.scale !== s * ES || earArt.dpr !== dpr) earArt.render(s * ES, dpr);
    ctx.save(); ctx.translate(X + (HD.x + HD.w * HD.s) * s, Y + HD.y * s); ctx.scale(-1, 1); headArt.draw(ctx, 0, 0); ctx.restore();
    ctx.strokeStyle = 'rgba(52,58,66,.5)'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.arc(X + CALL.ex * s, Y + CALL.ey * s, CALL.r1 * s, 0, 6.2832);
    for (let i = 0; i < 2; i++) { const t = CALL.t[i]; ctx.moveTo(X + t[0] * s, Y + t[1] * s); ctx.lineTo(X + t[2] * s, Y + t[3] * s); }
    ctx.stroke();
    // the malleus handle is fixed to the drum (umbo 37 units below the ossicle axis); malleus + incus rock as one lever about that axis,
    // so the incus tip (26 units below it) pushes the stapes footplate in and out of the oval window
    const th = -d / 37;
    EAR_MV.drum.dx = d; EAR_MV.malleus.rot = th; EAR_MV.incus.rot = th; EAR_MV.stapes.dx = -th * 26;
    earArt.draw(ctx, X + EX * s, Y + EY * s, EAR_MV);
    if (phase < 0 || !earArt.layers.length) return;
    // nerve impulses run from the cochlea toward the brain (not text: also while running)
    ctx.fillStyle = '#fffbe6'; ctx.strokeStyle = '#d9480f'; ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const q = ((phase + k / 3) % 1) * 3, i = Math.min(2, q | 0), u = q - i, j = i * 2;
      const px = NV[j] + (NV[j + 2] - NV[j]) * u, py = NV[j + 1] + (NV[j + 3] - NV[j + 1]) * u;
      ctx.beginPath(); ctx.ellipse(X + (EX + px * ES) * s, Y + (EY + py * ES) * s, 2.7 * s, 1.9 * s, -0.42, 0, 6.2832); ctx.fill(); ctx.stroke();
    }
  }
};
const EAR_LAB = [['pinna', 'Vành tai', 'a-pinna', 57, 76, 'top'], ['canal', 'Ống tai', 'a-canal', 106, 117, 'bottom'], ['drum', 'Màng nhĩ', 'a-drum', 142, 108, 'bottom'],
  ['ossicles', 'Xương búa – đe – bàn đạp', 'a-ossicles', 157, 81, 'top', 1], ['canals', 'Ống bán khuyên', 'a-canals', 238, 94, 'top'],
  ['cochlea', 'Ốc tai', 'a-cochlea', 200, 162, 'bottom'], ['nerve', 'Dây thần kinh thính giác', 'a-nerve', 250, 131, 'bottom', 1]];
const earLabels = () => EAR_LAB.map(([id, t, a, fx, fy, side, row]) => { const p = earPt(a, fx, fy); return [id, t, p.x, p.y, side, row]; });
// Water / steel scenes: the same art/transducer.svg is the source (left) and, mirrored, the receiver (right); its moving layer "face" follows u.
const trd = loadArt('transducer');
trd.ready.then(() => { bus.emit('change', {key: 'art'}); });
const TR = {W: 150, FACE_X: 136, FACE_Y: 50, FACE_H: 60};      // design units of art/transducer.svg: face plane x, centre y, height
const solid = () => state.medium !== 'air' && L.layout !== 'bars';
// phone: labels in priority order – as many as fit beside the figure
const PHONE_LABELS = {ear: ['drum', 'cochlea', 'pinna', 'canal', 'canals'], talker: ['cords', 'mouth', 'tongue'], speaker: ['cone', 'coil', 'magnet']};
const fitN = (ids, band) => ids.slice(0, Math.max(1, Math.min(ids.length, Math.floor((band - 30) / 23))));
let labelKey = '';

let spr = null;   // sphere sprites (blue, orange, pale, red), rebuilt after every layout / resize
function layout(w, hh) {
  const phone = w < 600;
  L.w = w; L.h = hh; L.phone = phone; L.srcKey = state.source; L.medKey = state.medium; L.scene = null; L.bar = null;
  L.fs = phone ? 11 : 12.5;
  // compact = short stage (phone with the control sheet open): only labels + field
  L.tiny = hh < 240;                                  // tiny = landscape phone: field only
  L.layout = !phone ? 'side' : hh >= 420 ? 'stack' : 'bars';   // side: figures left/right of the field · stack: figure above / below (portrait phone) · bars: markers only
  L.compact = L.layout === 'stack' ? false : hh < 440;
  const talker = state.source === 'talker';
  labelKey = '';
  if (state.medium !== 'air' && L.layout !== 'bars') layoutSolid(w, hh);
  else if (L.layout === 'stack') {
    L.cols = 26;
    L.airL = 12; L.airR = w - 12; L.airW = L.airR - L.airL; L.dx = L.airW / (L.cols + 1);
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
    L.airL = 14; L.airR = w - 14; L.airW = L.airR - L.airL; L.dx = L.airW / (L.cols + 1);
    L.above = L.tiny ? 16 : 62; L.below = 6;
    const top = 8, bottom = 66, avail = hh - top - bottom - L.above - L.below;
    L.dy = clamp(avail / L.rows, 8, 20);
    const block = L.above + L.rows * L.dy + L.below;
    L.fieldTop = top + Math.max(0, (hh - top - bottom - block) / 2) + L.above; L.fieldBot = L.fieldTop + L.rows * L.dy;
  } else {
    const srcW = talker ? clamp(w * 0.27, 140, 235) : clamp(w * 0.255, 130, 245), earW = clamp(w * 0.36, 190, 300);
    L.airL = srcW + 12; L.airR = w - earW - 8; L.airW = L.airR - L.airL;
    L.cols = clamp(Math.round(L.airW / 9), 24, 40); L.rows = 12; L.dx = L.airW / (L.cols + 1);
    const top = L.tiny ? 4 : L.compact ? 8 : 46, bottom = L.compact ? 66 : 76;
    L.above = L.tiny ? 16 : L.compact ? 62 : 88; L.below = L.compact ? 6 : 112;
    const avail = hh - top - bottom - L.above - L.below;
    L.dy = clamp(avail / L.rows, 8, Math.min(26, L.dx * 1.9));
    const block = L.above + L.rows * L.dy + L.below;
    L.fieldTop = top + Math.max(0, (hh - top - bottom - block) / 2) + L.above; L.fieldBot = L.fieldTop + L.rows * L.dy;
    const cy = (L.fieldTop + L.fieldBot) / 2, rowsH = L.compact ? 0 : 56;        // room for 2 label rows above / below a figure
    const fitS = (sw, up, dn) => Math.max(0.3, Math.min(sw, (cy - 38 - rowsH) / up, (hh - bottom - rowsH - cy) / dn));
    if (talker) {
      // column in front of the lips: TALK_COL design units tall, centred on the mouth; rows re-fitted to it
      const m = talk.mouth();
      // the head is tall above the mouth: keep 2 label rows + the heading below the readout chip (≈ 70 px above the hair)
      const s = Math.min(fitS((L.airL - 4) / (m.x + 2), m.y, TALK_H - m.y), L.compact ? 9 : (cy - 136) / m.y), colPx = TALK_COL * s;
      L.rows = clamp(Math.round(colPx / Math.min(L.dy, L.dx * 1.35)), 5, 10); L.dy = colPx / L.rows;
      L.fieldTop = cy - colPx / 2; L.fieldBot = cy + colPx / 2;
      talk.s = s; talk.x = L.airL - (m.x + 2) * s; talk.y = cy - m.y * s;
    } else {
      // the air column is exactly as tall as the cone rim: s from the rim height, rows re-fitted to it
      const rimC = spk.rimCy(), s = fitS((srcW - 4) / SPK_W, rimC, SPK_H - rimC), rimPx = spk.rimH() * s;
      L.rows = clamp(Math.round(rimPx / L.dy), 4, 12); L.dy = rimPx / L.rows;
      L.fieldTop = cy - rimPx / 2; L.fieldBot = cy + rimPx / 2;
      spk.s = s; spk.x = L.airL - spk.rimX() * s; spk.y = cy - rimC * s;
    }
    const se = fitS(earW / EAR_W, EAR_AX, EAR_H - EAR_AX);
    ear.s = se; ear.x = L.airR + 4; ear.y = cy - EAR_AX * se;
  }
  L.r = clamp(Math.min(L.dx, L.dy) * 0.3, 3, 4.4);
  L.trackCol = Math.round(L.cols * 0.27);
  restX = new Float32Array(L.cols);
  for (let i = 0; i < L.cols; i++) restX[i] = (i + 1) * L.dx;          // first layer = one dx in front of the cone face (x = 0)
  rulerN = -1; spr = null;
}

// Water tank / steel bar: transducer (left) → column of particles → receiver (right); the faces are at airL / airR.
function layoutSolid(w, hh) {
  const stack = L.layout === 'stack', steel = state.medium === 'steel', m = stack ? 12 : 30;
  const srcW = stack ? clamp(w * 0.2, 60, 108) : clamp(w * 0.235, 120, 230);           // face plane − left margin
  L.airL = m + srcW; L.airR = w - m - srcW; L.airW = L.airR - L.airL;
  L.cols = clamp(Math.round(L.airW / 9), stack ? 18 : 24, 40); L.dx = L.airW / (L.cols + 1);
  const top = stack ? 150 : L.compact ? 40 : 76, bottom = stack ? 120 : L.compact ? 60 : 108;
  const F = Math.max(26, Math.min(srcW / TR.FACE_X * TR.FACE_H, (hh - top - bottom) / 2.1, 130));   // face height (px) = height of the particle column (+ one row in steel)
  const dyT = clamp(L.dx * 1.5, 9, 17), rowsPx = F - (steel ? dyT : 0);
  L.rows = clamp(Math.round(rowsPx / dyT), 3, 12); L.dy = rowsPx / L.rows; L.F = F;
  const cy = stack ? Math.max(top + F * 0.6, hh * 0.36) : top + Math.max(F * 1.05, (hh - top - bottom) / 2);
  L.fieldTop = cy - L.rows * L.dy / 2; L.fieldBot = cy + L.rows * L.dy / 2; L.cy = cy;
  const s = F / TR.FACE_H;
  L.tr = {s, x: L.airL - TR.FACE_X * s, y: cy - TR.FACE_Y * s, rx: L.airR + TR.FACE_X * s};
  L.above = 88; L.below = 70;
}

// recompute the drawn wave from the state (cheap, no allocation)
function syncWave() {
  const v = SPEED[state.medium] || SPEED.air;
  const g = clamp((state.level - DB_MIN) / (DB_MAX - DB_MIN), 0, 1);
  const minPx = Math.max(7 * L.dx, 60), maxPx = L.airW * 0.56;
  wave.set(state.f, v, L.airW / SHOW_M, minPx, maxPx, 0);
  wave.A = Math.min((0.28 + 0.32 * g) * wave.lamPx / (2 * Math.PI), 1.05 * L.dx);   // k·A ≤ 0,6 (< 0,8): layers never cross and never touch the cone face
  wave.at(state.t);
}

function draw(ctx) {
  if (!L.w) return;
  if (L.srcKey !== state.source || L.medKey !== state.medium) layout(L.w, L.h);
  syncWave();
  const {airL, airW, dx, dy, fieldTop, fieldBot, cols, rows, r, fs} = L;
  const lam = wave.lamPx, cyc = wave.cycles(), front = wave.front;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const isSolid = solid(), steel = state.medium === 'steel';
  if (isSolid) drawSolidBack(ctx);

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
  if (!spr) spr = [ball(steel ? BALL.steel : BALL.blue, r), ball(BALL.orange, r), ball(BALL.pale, r), ball(BALL.red, r + 1.8)];
  const sprites = spr;
  if (steel && isSolid) {                    // lattice: thin bonds between neighbouring atoms (one path, stroked once)
    ctx.beginPath();
    for (let j = 0; j < rows; j++) {
      const y = fieldTop + (j + 0.5) * dy;
      ctx.moveTo(airL + restX[0] + wave.u(restX[0]), y);
      for (let i = 1; i < cols; i++) ctx.lineTo(airL + restX[i] + wave.u(restX[i]), y);
    }
    for (let i = 0; i < cols; i++) { const x = airL + restX[i] + wave.u(restX[i]); ctx.moveTo(x, fieldTop + dy * 0.5); ctx.lineTo(x, fieldBot - dy * 0.5); }
    ctx.strokeStyle = 'rgba(52,58,64,.38)'; ctx.lineWidth = 1.1; ctx.stroke();
  }
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

  if (isSolid) drawSolidFront(ctx); else drawArt(ctx);
}

// ---- water tank / steel bar scenes (baked once per layout; per frame drawImage only) ----
function mkCanvas(w, hh) {
  const dpr = ballDpr(), c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * dpr)); c.height = Math.max(1, Math.ceil(hh * dpr));
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  return {c, g};
}
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) gr.addColorStop(o, col); return gr; }
function bakeScene() {
  const steel = state.medium === 'steel', {cy, F, airL, airR, w} = L, tr = L.tr, dpr = ballDpr();
  if (!steel) {                                              // glass tank + water with depth gradient
    const x0 = 4, x1 = w - 4, y0 = cy - F * 1.08, y1 = cy + F * 1.08, pad = 24, W = x1 - x0, H = y1 - y0;
    const {c, g} = mkCanvas(W + 2 * pad, H + 2 * pad + 22); g.translate(pad - x0, pad - y0);
    const sh = g.createRadialGradient((x0 + x1) / 2, y1 + 8, 10, (x0 + x1) / 2, y1 + 8, W / 2);
    sh.addColorStop(0, 'rgba(40,30,10,.20)'); sh.addColorStop(1, 'rgba(40,30,10,0)');
    g.save(); g.translate((x0 + x1) / 2, y1 + 8); g.scale(1, 0.07); g.translate(-(x0 + x1) / 2, -(y1 + 8)); g.fillStyle = sh; g.fillRect(x0 - 30, y1 - 300, W + 60, 600); g.restore();
    const top = y0 + H * 0.1;                                // water level
    g.fillStyle = lin(g, 0, top, 0, y1, [[0, '#d3efff'], [0.35, '#9fd5f5'], [0.75, '#5db0e8'], [1, '#3b8fd0']]);
    g.beginPath(); roundRect(g, x0 + 3, top, W - 6, y1 - top - 3, 6); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x0 + 3, top, W - 6, 2.2);          // surface
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x0 + 3, top + 2.2, W - 6, 7);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); roundRect(g, x0 + 8, top + 14, 9, (y1 - top) * 0.62, 4); g.fill();   // glass sheen
    g.strokeStyle = 'rgba(96,125,150,.95)'; g.lineWidth = 3; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1 - 6); g.quadraticCurveTo(x0, y1, x0 + 6, y1); g.lineTo(x1 - 6, y1); g.quadraticCurveTo(x1, y1, x1, y1 - 6); g.lineTo(x1, y0); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + 2, y0 + 4); g.lineTo(x0 + 2, y1 - 8); g.stroke();
    g.strokeStyle = 'rgba(70,95,120,.9)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0 + 4, y1); g.lineTo(x1 - 4, y1); g.stroke();
    g.strokeStyle = '#2b2f36'; g.lineWidth = 3.4; g.lineCap = 'round';                       // cables leave the tank through the open top
    for (const [px, dir] of [[tr.x, -1], [tr.rx, 1]]) {
      const ax = px + dir * 1 * tr.s, ay = tr.y + TR.FACE_Y * tr.s;
      g.beginPath(); g.moveTo(ax, ay); g.bezierCurveTo(ax + dir * 12, ay, ax + dir * 12, y0 + 10, ax + dir * 12, y0 - 14); g.stroke();
    }
    L.scene = {c, x: x0 - pad, y: y0 - pad, w: W + 2 * pad, h: H + 2 * pad + 22, ytop: y0, ybot: y1};
  } else {                                                   // bench + two C-clamps + brushed steel bar
    const bh = F, by0 = cy - bh / 2, by1 = cy + bh / 2, bx0 = airL - L.dx * 1.4, bx1 = airR + L.dx * 1.4, bw = bx1 - bx0;
    const bar = mkCanvas(bw, bh), g = bar.g;
    g.fillStyle = lin(g, 0, 0, 0, bh, [[0, '#eef0f2'], [0.18, '#cdd2d7'], [0.55, '#9aa1a9'], [0.85, '#7a828a'], [1, '#5c636b']]);
    g.fillRect(0, 0, bw, bh);
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 0.7;                              // brushed lines
    for (let y = 2; y < bh - 1; y += 2.6) { g.beginPath(); g.moveTo(0, y + (y * 7 % 3) * 0.2); g.lineTo(bw, y + (y * 7 % 3) * 0.2); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 2, bw, 2);
    g.fillStyle = 'rgba(30,34,40,.45)'; g.fillRect(0, bh - 2.5, bw, 2.5);
    g.strokeStyle = '#3d4349'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 0.7); g.lineTo(bw, 0.7); g.moveTo(0, bh - 0.7); g.lineTo(bw, bh - 0.7); g.stroke();
    L.bar = {c: bar.c, x: bx0, y: by0, w: bw, h: bh};
    const pad = 20, ytab = by1 + 40, x0 = 6, x1 = w - 6, sc = mkCanvas(w, ytab + 24 - by0 + pad), s2 = sc.g;
    s2.translate(0, pad - by0);
    // bench
    s2.fillStyle = lin(s2, 0, ytab, 0, ytab + 12, [[0, '#d8c7a6'], [1, '#b9a47c']]); s2.beginPath(); roundRect(s2, x0, ytab, x1 - x0, 12, 3); s2.fill();
    s2.strokeStyle = '#8b7a56'; s2.lineWidth = 1; s2.stroke();
    s2.fillStyle = 'rgba(40,30,10,.16)'; s2.fillRect(x0 + 6, ytab + 12, x1 - x0 - 12, 5);
    // C-clamps at 22 % and 78 % of the bar
    for (const fx of [0.12, 0.88]) {
      const x = airL + L.airW * fx, jaw = Math.max(6, F * 0.08), sp = 9;
      s2.fillStyle = lin(s2, x - 16, 0, x + 18, 0, [[0, '#e9ecef'], [0.4, '#868e96'], [1, '#3d4349']]); s2.strokeStyle = '#2b3036'; s2.lineWidth = 1;
      s2.beginPath(); s2.rect(x - 22, by1 + 0.5, 44, jaw); s2.fill(); s2.stroke();                       // lower jaw under the bar
      s2.beginPath(); s2.rect(x - 22, by0 - jaw - 8, 44, jaw); s2.fill(); s2.stroke();                   // upper arm over the bar
      s2.beginPath(); s2.rect(x + 12, by0 - jaw - 8, sp, by1 - by0 + 2 * jaw + 8); s2.fill(); s2.stroke();   // spine
      s2.fillStyle = lin(s2, x - 3, 0, x + 3, 0, [[0, '#6c747d'], [0.4, '#f4f6f8'], [1, '#6c747d']]);
      s2.beginPath(); s2.rect(x - 3, by0 - 8, 6, 8); s2.fill(); s2.stroke();                              // screw pressing the bar
      s2.beginPath(); s2.rect(x - 9, by0 - jaw - 13, 18, 5); s2.fill(); s2.stroke();                        // handle
      s2.fillStyle = lin(s2, x - 12, 0, x + 12, 0, [[0, '#adb5bd'], [1, '#495057']]);
      s2.beginPath(); s2.rect(x - 11, by1 + jaw + 0.5, 22 + sp + 8, ytab - by1 - jaw - 0.5); s2.fill(); s2.stroke();   // foot
    }
    L.scene = {c: sc.c, x: 0, y: by0 - pad, w, h: ytab + 24 - by0 + pad};
  }
}
function drawSolidBack(ctx) {
  if (!L.scene) bakeScene();
  const sc = L.scene;
  ctx.drawImage(sc.c, sc.x, sc.y, sc.w, sc.h);
  if (state.medium === 'steel') {                              // bar ends follow the two vibrating faces, so no gap ever opens
    const u0 = wave.u(0), ue = wave.u(L.airW), b = L.bar, dpr = ballDpr();
    const xl = L.airL + u0 - b.x, xr = L.airR + ue - b.x;
    ctx.drawImage(b.c, xl * dpr, 0, (xr - xl) * dpr, b.h * dpr, b.x + xl, b.y, xr - xl, b.h);
  }
}
function drawSolidFront(ctx) {
  const tr = L.tr, s = tr.s, dpr = ballDpr(), u0 = wave.u(0), ue = wave.u(L.airW);
  if (trd.scale !== s || trd.dpr !== dpr) trd.render(s, dpr);
  trd.draw(ctx, tr.x, tr.y, {face: {dx: u0 / s}});
  ctx.save(); ctx.translate(tr.rx, tr.y); ctx.scale(-1, 1);
  trd.draw(ctx, 0, 0, {face: {dx: -ue / s}});
  ctx.restore();
}

const SRC = {speaker: {get labels() { return spkLabels(); }, title: 'Loa'}, talker: {get labels() { return talkLabels(); }, title: 'Người nói'}};
const srcFig = () => state.source === 'talker' ? talk : spk;
const clampB = x => Math.max(-1, Math.min(1, x));

function buildLabels(ctx) {
  const key = L.w + 'x' + L.h + state.source + L.layout + L.compact + state.inside;
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
    lab.ear = layoutLabels(ctx, ear, mk(earLabels(), fitN(PHONE_LABELS.ear, L.bandB), 'left'), {mode: 'side', size: 10.5, xR: 0, xL: ear.x - 8, ymin: ear.y + 26, ymax: ear.y + ear.h * ear.s - 10});
    return;
  }
  const fsz = 11;
  lab.src = layoutLabels(ctx, sf, mk(S.labels), {mode: 'rows', size: fsz, xmin: 2, xmax: L.airL - 2, yTop: sf.y - 4, yBot: sf.y + sf.h * sf.s + 4});
  lab.ear = layoutLabels(ctx, ear, mk(earLabels()), {mode: 'rows', size: fsz, xmin: L.airR + 4, xmax: L.w - 2, yTop: ear.y - 4, yBot: ear.y + ear.h * ear.s + 4});
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
  else {
    sf.drawDyn(ctx, wave.u(0) / sf.s);                                  // cone follows exactly u(0,t), like the first air layer
    if (L.layout === 'side') {                                          // cone face: the plane the first layer is pushed by
      const fx = L.airL + wave.u(0);
      ctx.strokeStyle = 'rgba(54,60,68,.75)'; ctx.lineWidth = 2.2; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(fx, fieldTop); ctx.lineTo(fx, fieldBot); ctx.stroke();
    }
  }
  // ear: the eardrum moves with the air layer at the canal (driven by the arriving pressure); nerve pulses start when the wave front has reached the ear
  const phase = wave.front >= ear0 ? (((wave.cycles() - ear0 / wave.lamPx) % 1) + 1) % 1 : -1;
  ear.draw(ctx, clampB(ue / amp) * 2.4, phase);
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
  // --- water / steel: names of the two devices and of the medium
  if (solid()) {
    if (L.compact) return;
    const tr = L.tr, s = tr.s, steel = state.medium === 'steel', yb = tr.y + 13 * s;
    for (const [x, t] of [[tr.x + 72 * s, 'Đầu phát'], [tr.rx - 72 * s, 'Máy thu']]) {
      const ly = yb - 22 - (steel ? 10 : 0);
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, ly + 9); ctx.lineTo(x, yb + 3); ctx.stroke();
      pill(ctx, t, x, ly, {size: fs, fill: C.paper, stroke: C.ink2, color: C.ink});
    }
    const yn = steel ? L.fieldBot + 82 : Math.max(L.scene.ybot + 16, L.fieldBot + 82);
    if (yn < L.h - 12) pill(ctx, steel ? 'Thanh thép được kẹp chặt' : 'Bể nước', airL + airW / 2, yn, {size: fs, weight: 800, fill: C.paper, stroke: null, color: C.ink2});
    return;
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

// source chips / loudspeaker view exist only in air (in water and steel the source touches the medium)
function airOnly(el) { bind(() => { el.hidden = state.medium !== 'air'; }); return el; }

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
      airOnly(seg([['speaker', 'Loa'], ['talker', 'Người nói']], () => state.source, v => set('source', v), 'Nguồn âm')),
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
        toggle('target', 'Phần tử đỏ', () => state.track, v => set('track', v), 'Theo dõi một phần tử (màu đỏ)'),
        airOnly(toggle('eye', 'Xem bên trong loa', () => state.inside, v => set('inside', v), 'Hiện mặt cắt bên trong loa: màng, cuộn dây, nam châm, khung'))))
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
