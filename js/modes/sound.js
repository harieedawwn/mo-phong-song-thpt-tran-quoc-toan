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
const spkArt = loadArt('speaker');                                      // cut-away view only (v4)
spkArt.ready.then(() => { labelKey = ''; bus.emit('change', {key: 'art'}); });
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
    if (spkArt.scale !== s || spkArt.dpr !== dpr) spkArt.render(s, dpr);
    spkArt.draw(ctx, this.x, this.y, {cone: {dx: dd}});
    if (!spkArt.layers.length) return;
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
const spkLabels = () => SPK_LAB_IN
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
// Composite (design units = px at s = 1): small listener head on the left, big magnifier disc (ear.svg scaled by ES) on the right.
const ES = 2.05, RB = 113.2 * ES;                                       // ES = ear.svg → composite scale; RB = bezel outer radius
const HD = {s: 0.38, x: 0, y: 0, w: 232, ex: 99.2, ey: 123.5};          // head.svg in the composite (mirrored); ex/ey = its ear (a-ear)
const HX = (HD.w - HD.ex) * HD.s;                                        // head's ear x (mirrored)
const CX = HX + 8 + 113 * ES;                                           // disc centre x: its left edge sits just right of the head's ear
const EAR_AX = RB + 4;                                                  // disc centre y = canal axis = centre line of the air column
HD.y = EAR_AX - 188 * HD.s;                                             // the air column meets the face at nose / mouth level
const EAR_W = CX + RB + 3, EAR_H = EAR_AX + 125 * ES + 6;
const EX = CX - 148 * ES, EY = EAR_AX - 116 * ES;                       // ear.svg origin in the composite (disc centre 148,116)
const earPt = (id, fx, fy) => { const p = earArt.pt(id) || {x: fx, y: fy}; return {x: EX + p.x * ES, y: EY + p.y * ES}; };
// lens callout: small ring round the head's ear + the two outer tangents to the bezel (composite units, computed once)
const CALL = (() => {
  const ex = HX, ey = HD.y + HD.ey * HD.s, cx = CX, cy = EAR_AX, r1 = 5, r2 = 113 * ES;
  const phi = Math.atan2(cy - ey, cx - ex), be = Math.acos((r1 - r2) / Math.hypot(cx - ex, cy - ey));
  return {ex, ey, r1, t: [phi + be, phi - be].map(a => [ex + r1 * Math.cos(a), ey + r1 * Math.sin(a), cx + r2 * Math.cos(a), cy + r2 * Math.sin(a)])};
})();
const EAR_MV = {drum: {dx: 0}, malleus: {rot: 0}, incus: {rot: 0}, stapes: {dx: 0}};   // reused every frame (no allocation)
const NV = new Float32Array([216, 145, 230, 139, 244, 133.4, 254, 129.6]);          // nerve centre line a-n0…a-n3 (ear.svg units)
earArt.ready.then(() => { for (let i = 0; i < 4; i++) { const p = earArt.pt('a-n' + i); if (p) { NV[i * 2] = p.x; NV[i * 2 + 1] = p.y; } } });

// Ear-canal air column (ear.svg units): rows of small spheres from the canal entrance to the eardrum, moved by the SAME u(x,t) continued from the
// outside column (magnified: one canal wavelength LAMC). They stop CL short of the drum so k·A_c ≤ 0,8 keeps them from ever touching it.
const CAN = {x0: 89, x1: 141, cy: 116.5, hIn: 13, hDr: 19, yTopIn: 103.5, yBotIn: 129.5, yTopDr: 99, yBotDr: 136, xDrT: 136.5, xDrB: 145.5};
const LAMC = 64, AC = 6, RC = 1.9, CCOLS = 6, CGAP = RC + AC + 2.5;     // ear-units: canal wavelength, amplitude, sphere radius, columns, clearance to drum
const syncCanal = () => {
  const P = id => earArt.pt(id); let p;
  if ((p = P('a-canal-in'))) { CAN.x0 = p.x; CAN.cy = p.y; }
  if ((p = P('a-canal-drum'))) CAN.x1 = p.x;
  if ((p = P('a-canal-in-top'))) CAN.yTopIn = p.y;
  if ((p = P('a-canal-in-bot'))) CAN.yBotIn = p.y;
  if ((p = P('a-canal-dr-top'))) { CAN.yTopDr = p.y; CAN.xDrT = p.x; }
  if ((p = P('a-canal-dr-bot'))) { CAN.yBotDr = p.y; CAN.xDrB = p.x; }
};
earArt.ready.then(syncCanal);
const CROWS = [-0.66, -0.22, 0.22, 0.66];
// "phóng to": the disc alone fills the stage (air column + source hidden; the wave keeps driving the eardrum)
let zoom = false;
try { zoom = /zoom=1/.test(location.hash); } catch (e) { /* in-app browsers may refuse */ }   // #zoom=1 opens the big view (checker)
let cSpr = null, cSprR = 0;
// canal spheres in composite px: ox/oy = ear.svg origin, k = px per ear unit. Same sprites / colour rule as the outside column.
function drawCanal(ctx, ox, oy, k) {
  const amp = Math.max(wave.A, 1), ear0 = L.airR - L.airL + 6, mag = wave.lamPx / LAMC, still = !state.playing;
  const rp = Math.max(1.5, Math.round(RC * k * 4) / 4);
  if (!cSpr || cSprR !== rp) { cSprR = rp; cSpr = [ball(BALL.blue, rp), ball(BALL.orange, rp), ball(BALL.pale, rp)]; }
  const n = L.phone && !zoom ? 3 : 4, r0 = n === 4 ? 0 : 1;
  const hm = (CAN.hIn + CAN.hDr) * 0.5 - 0.5, dsl = (CAN.xDrB - CAN.xDrT) / (CAN.yBotDr - CAN.yTopDr);
  const xs = CAN.x0 + 6;
  if (still) {                                                          // faint nén / giãn column bands inside the canal
    const yA = oy + (CAN.cy - hm * 0.9) * k, hh = hm * 1.8 * k;
    for (const [band, sign] of [['rgba(232,89,12,.16)', 1], ['rgba(28,126,214,.14)', -1]]) {
      ctx.fillStyle = band; ctx.beginPath();
      for (let i = 0; i < CCOLS; i++) {
        const xe = CAN.xDrT + (CAN.cy - CAN.yTopDr) * dsl - CGAP, xr = xs + i * (xe - xs) / (CCOLS - 1);
        if (wave.s(ear0 + (xr - CAN.x0) * mag) * sign > TH) ctx.rect(ox + (xr - (xe - xs) / (CCOLS - 1) / 2) * k, yA, (xe - xs) / (CCOLS - 1) * k, hh);
      }
      ctx.fill();
    }
  }
  for (let pass = 0; pass < (still ? 3 : 1); pass++) {
    const sp = cSpr[pass];
    for (let jj = 0; jj < n; jj++) {
      const f = n === 4 ? CROWS[jj] : (jj - 1) * 0.6, y = CAN.cy + f * hm;
      const xe = CAN.xDrT + (y - CAN.yTopDr) * dsl - CGAP, dxr = (xe - xs) / (CCOLS - 1);
      for (let i = 0; i < CCOLS; i++) {
        const xr = xs + i * dxr, xw = ear0 + (xr - CAN.x0) * mag;
        if (still) { const sv = wave.s(xw), cls = sv > TH ? 1 : sv < -TH ? 2 : 0; if (cls !== pass) continue; }
        drawBall(ctx, sp, ox + (xr + AC * wave.u(xw) / amp) * k, oy + y * k);
      }
    }
  }
}
const ear = {
  w: EAR_W, h: EAR_H, x: 0, y: 0, s: 1, nrm: {x: 0, y: 0, s: 1}, zm: {x: 0, y: 0, s: 1, side: true},
  place(x, y, bw, bh, ax = 0.5, ay = 0.5) { const s = Math.min(bw / EAR_W, bh / EAR_H); this.nrm = {x: x + (bw - EAR_W * s) * ax, y: y + (bh - EAR_H * s) * ay, s}; this.use(); },
  use() { const p = zoom ? this.zm : this.nrm; this.x = p.x; this.y = p.y; this.s = p.s; },
  px(dx, dy) { return [this.x + dx * this.s, this.y + dy * this.s]; },
  disc() { return {x: this.x + CX * this.s, y: this.y + EAR_AX * this.s, r: RB * this.s}; },
  // d = umbo displacement in ear.svg units (+ = into the middle ear, same sign as the air displacement u at the canal);
  // phase = nerve-pulse phase 0…1, −1 while the wave has not reached the ear
  draw(ctx, d, phase) {
    const s = this.s, dpr = ballDpr(), X = this.x, Y = this.y;
    if (!zoom && (headArt.scale !== s * HD.s || headArt.dpr !== dpr)) headArt.render(s * HD.s, dpr);
    if (earArt.scale !== s * ES || earArt.dpr !== dpr) earArt.render(s * ES, dpr);
    if (!zoom) {
      ctx.save(); ctx.translate(X + (HD.x + HD.w * HD.s) * s, Y + HD.y * s); ctx.scale(-1, 1); headArt.draw(ctx, 0, 0); ctx.restore();
      ctx.strokeStyle = 'rgba(52,58,66,.5)'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.arc(X + CALL.ex * s, Y + CALL.ey * s, CALL.r1 * s, 0, 6.2832);
      for (let i = 0; i < 2; i++) { const t = CALL.t[i]; ctx.moveTo(X + t[0] * s, Y + t[1] * s); ctx.lineTo(X + t[2] * s, Y + t[3] * s); }
      ctx.stroke();
    }
    // the malleus handle is fixed to the drum (umbo 37 units below the ossicle axis); malleus + incus rock as one lever about that axis,
    // so the incus tip (26 units below it) pushes the stapes footplate in and out of the oval window
    const th = -d / 37;
    EAR_MV.drum.dx = d; EAR_MV.malleus.rot = th; EAR_MV.incus.rot = th; EAR_MV.stapes.dx = -th * 26;
    earArt.draw(ctx, X + EX * s, Y + EY * s, EAR_MV);
    if (earArt.layers.length) drawCanal(ctx, X + EX * s, Y + EY * s, ES * s);
    if (phase >= 0 && earArt.layers.length) {
      // nerve impulses run from the cochlea toward the brain (not text: also while running)
      ctx.fillStyle = '#fffbe6'; ctx.strokeStyle = '#d9480f'; ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        const q = ((phase + k / 3) % 1) * 3, i = Math.min(2, q | 0), u = q - i, j = i * 2;
        const px = NV[j] + (NV[j + 2] - NV[j]) * u, py = NV[j + 1] + (NV[j + 3] - NV[j + 1]) * u;
        ctx.beginPath(); ctx.ellipse(X + (EX + px * ES) * s, Y + (EY + py * ES) * s, 2.6 * ES * s, 1.8 * ES * s, -0.42, 0, 6.2832); ctx.fill(); ctx.stroke();
      }
    }
    // round "phóng to" / "thu nhỏ" button on the bezel (icon only: magnifier + / −)
    const g = this.disc(), a = -0.78, br = Math.max(15, g.r * 0.075), bx = g.x + Math.cos(a) * g.r * 0.985, by = g.y + Math.sin(a) * g.r * 0.985;
    this.btn.x = bx; this.btn.y = by; this.btn.r = br;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#15181d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath();
    const lr = br * 0.38, lx = bx - br * 0.08, ly = by - br * 0.08;
    ctx.arc(lx, ly, lr, 0, 6.2832); ctx.moveTo(lx + lr * 0.72, ly + lr * 0.72); ctx.lineTo(bx + br * 0.52, by + br * 0.52);
    ctx.moveTo(lx - lr * 0.5, ly); ctx.lineTo(lx + lr * 0.5, ly);
    if (!zoom) { ctx.moveTo(lx, ly - lr * 0.5); ctx.lineTo(lx, ly + lr * 0.5); }
    ctx.stroke();
  },
  btn: {x: -99, y: -99, r: 0}
};
function setZoom(v) {
  v = !!v && state.medium === 'air' && L.layout !== 'bars';
  if (v === zoom) return;
  zoom = v; ear.use(); labelKey = ''; bus.emit('change', {key: 'zoom'});
}
function pointer(x, y) {
  if (state.medium !== 'air' || L.layout === 'bars') return;
  const b = ear.btn, g = ear.disc();
  if (Math.hypot(x - b.x, y - b.y) <= Math.max(22, b.r + 6) || Math.hypot(x - g.x, y - g.y) <= g.r) setZoom(!zoom);
}
addEventListener('keydown', e => { if (e.key === 'Escape' && zoom) setZoom(false); });
const EAR_LAB = [['pinna', 'Vành tai', 'a-pinna', 57, 76, 'top'], ['canal', 'Ống tai', 'a-canal', 106, 117, 'bottom'], ['drum', 'Màng nhĩ', 'a-drum', 142, 108, 'bottom'],
  ['ossicles', 'Xương búa – đe – bàn đạp', 'a-ossicles', 157, 81, 'top', 1], ['canals', 'Ống bán khuyên', 'a-canals', 238, 94, 'top'],
  ['cwave', 'Sóng âm vào ống tai', 'a-canal-in-top', 100, 103, 'top', 1], ['cochlea', 'Ốc tai', 'a-cochlea', 200, 162, 'bottom'], ['nerve', 'Dây thần kinh thính giác', 'a-nerve', 250, 131, 'bottom', 1]];
const BRAIN_LAB = ['brain', 'Não', 'a-brain', 176, 33, 'top'];
const ZOOM_SIDE = {cwave: 'left', pinna: 'left', canal: 'left', drum: 'left', ossicles: 'left', canals: 'right', cochlea: 'right', nerve: 'right', brain: 'right'};
const earLabels = () => (zoom ? EAR_LAB.concat([BRAIN_LAB]) : EAR_LAB).map(([id, t, a, fx, fy, side, row]) => { const p = earPt(a, fx, fy); return [id, t, p.x, p.y, side, row]; });
// Water scene: the same art/transducer.svg is the source (left) and, mirrored, the receiver (right); its moving layer "face" follows u.
const trd = loadArt('transducer');
trd.ready.then(() => { bus.emit('change', {key: 'art'}); });
const TR = {W: 150, FACE_X: 136, FACE_Y: 50, FACE_H: 60};      // design units of art/transducer.svg: face plane x, centre y, height
const solid = () => state.medium === 'water' && L.layout !== 'bars';
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
  if (state.medium === 'water' && L.layout !== 'bars') layoutSolid(w, hh);
  else if (L.layout === 'stack') {
    L.cols = 26;
    L.airL = 12; L.airR = w - 12; L.airW = L.airR - L.airL; L.dx = L.airW / (L.cols + 1);
    const top0 = 74, avail = hh - top0 - 70;
    L.rows = avail < 400 ? 4 : 6;                                    // short phone: fewer rows keep room for the ear
    L.bandA = talker ? clamp(avail * 0.2, 90, 112) : clamp(avail * 0.12, 54, 76);
    L.above = 42; L.below = avail < 340 ? 54 : 50;
    L.bandB = clamp(avail - L.bandA - L.above - L.below - L.rows * 8, 120, EAR_H * (w - 12) / EAR_W);   // the magnifier is the main receiver: it takes what is left
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
    // the magnifier disc is the main receiver: ≈ 75 % of the stage height, but source + air column keep ≥ 45 % of the width (landscape phone: ear = right half)
    const srcW = talker ? clamp(w * 0.24, 140, 235) : clamp(w * 0.2, 120, 245);
    const top = L.tiny ? 4 : L.compact ? 8 : 46, bottom = L.compact ? 66 : 76;
    const eTop = L.compact ? 8 : 60, eBot = L.compact ? 70 : 100;                        // room above / below the disc for the label rows and the play button
    const se = Math.max(0.3, Math.min(w * (L.compact ? 0.5 : 0.38) / EAR_W, (hh - eTop - eBot) / (2 * RB) * (L.compact ? 1 : 0.72)));
    const earW = EAR_W * se, earCy = (eTop + hh - eBot) / 2;
    L.airL = srcW + 12; L.airR = w - earW - 8; L.airW = L.airR - L.airL;
    L.cols = clamp(Math.round(L.airW / 9), 24, 40); L.rows = 12; L.dx = L.airW / (L.cols + 1);
    L.above = L.tiny ? 16 : L.compact ? 62 : 88; L.below = L.compact ? 6 : 112;
    const avail = hh - top - bottom - L.above - L.below;
    L.dy = clamp(avail / L.rows, 8, Math.min(26, L.dx * 1.9));
    const block = L.above + L.rows * L.dy + L.below;
    L.fieldTop = top + Math.max(0, (hh - top - bottom - block) / 2) + L.above; L.fieldBot = L.fieldTop + L.rows * L.dy;
    const cy = earCy, rowsH = L.compact ? 0 : 56;        // room for 2 label rows above / below a figure
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
    ear.nrm = {x: L.airR + 4, y: cy - EAR_AX * se, s: se};
  }
  zoomPlace(w, hh);
  L.r = clamp(Math.min(L.dx, L.dy) * 0.3, 3, 4.4);
  L.trackCol = Math.round(L.cols * 0.27);
  restX = new Float32Array(L.cols);
  for (let i = 0; i < L.cols; i++) restX[i] = (i + 1) * L.dx;          // first layer = one dx in front of the cone face (x = 0)
  rulerN = -1; spr = null;
}

// Water tank: transducer (left) → column of particles → receiver (right); the faces are at airL / airR.
// "phóng to" placement: the disc alone, as big as the stage allows; labels in two side columns (wide stage) or in rows above / below
function zoomPlace(w, hh) {
  const top = L.layout === 'stack' ? 66 : L.compact ? 36 : 34, bot = 72, availH = hh - top - bot, col = L.phone ? 190 : 205, ph = (L.phone ? 12 : 13) + 9;
  const sideD = Math.min(availH, w - 2 * col), rowsD = Math.min(availH - 4 * (ph + 5), w - 14);
  const side = sideD >= rowsD, D = Math.max(150, side ? sideD : rowsD), s = D / (2 * RB);
  ear.zm = {x: w / 2 - CX * s, y: top + availH / 2 - EAR_AX * s, s, side};
  ear.use();
}

function layoutSolid(w, hh) {
  const stack = L.layout === 'stack', m = stack ? 12 : 30;
  const srcW = stack ? clamp(w * 0.2, 60, 108) : clamp(w * 0.235, 120, 230);           // face plane − left margin
  L.airL = m + srcW; L.airR = w - m - srcW; L.airW = L.airR - L.airL;
  L.cols = clamp(Math.round(L.airW / 9), stack ? 18 : 24, 40); L.dx = L.airW / (L.cols + 1);
  const top = stack ? 150 : L.compact ? 40 : 76, bottom = stack ? 120 : L.compact ? 60 : 108;
  const F = Math.max(26, Math.min(srcW / TR.FACE_X * TR.FACE_H, (hh - top - bottom) / 2.1, 130));   // face height (px) = height of the particle column
  const dyT = clamp(L.dx * 1.5, 9, 17), rowsPx = F;
  L.rows = clamp(Math.round(rowsPx / dyT), 3, 12); L.dy = rowsPx / L.rows; L.F = F;
  const cy = stack ? Math.max(top + F * 0.6, hh * 0.36) : top + Math.max(F * 1.05, (hh - top - bottom) / 2);
  L.fieldTop = cy - L.rows * L.dy / 2; L.fieldBot = cy + L.rows * L.dy / 2; L.cy = cy;
  const s = F / TR.FACE_H;
  L.tr = {s, x: L.airL - TR.FACE_X * s, y: cy - TR.FACE_Y * s, rx: L.airR + TR.FACE_X * s};
  L.above = 88; L.below = 70;
}

// width (px) of the air column the AIR scene would have at this stage size (reference scale for the water scene)
function airSpan(w, hh) {
  const phone = w < 600, lay = !phone ? 'side' : hh >= 420 ? 'stack' : 'bars', compact = lay === 'stack' ? false : hh < 440;
  if (lay === 'stack') return w - 24;
  if (lay === 'bars') return w - 28;
  const srcW = clamp(w * 0.2, 120, 245), eTop = compact ? 8 : 60, eBot = compact ? 70 : 100;
  const se = Math.max(0.3, Math.min(w * (compact ? 0.5 : 0.38) / EAR_W, (hh - eTop - eBot) / (2 * RB) * (compact ? 1 : 0.72)));
  return w - EAR_W * se - 8 - srcW - 12;
}

// recompute the drawn wave from the state (cheap, no allocation)
function syncWave() {
  const v = SPEED[state.medium] || SPEED.air;
  const g = clamp((state.level - DB_MIN) / (DB_MAX - DB_MIN), 0, 1);
  // water uses the SAME px per metre as air (λ_water = 4,32 λ_air on screen, front 4,32× faster); clamp only if λ < 14 px
  const water = state.medium === 'water', minPx = water ? Math.max(14, 2.2 * L.dx) : Math.max(7 * L.dx, 60), maxPx = water ? 1e6 : L.airW * 0.56;
  wave.set(state.f, v, (water ? airSpan(L.w, L.h) : L.airW) / SHOW_M, minPx, maxPx, 0);
  wave.A = Math.min((0.28 + 0.32 * g) * wave.lamPx / (2 * Math.PI), 1.05 * L.dx);   // k·A ≤ 0,6 (< 0,8): layers never cross and never touch the cone face
  wave.at(state.t);
}

function draw(ctx) {
  if (!L.w) return;
  if (L.srcKey !== state.source || L.medKey !== state.medium) layout(L.w, L.h);
  syncWave();
  if (zoom && state.medium !== 'air') setZoom(false);
  if (zoomOn()) { buildLabels(ctx); const dr = earDrive(); ear.draw(ctx, dr.d, dr.phase); return; }
  const {airL, airW, dx, dy, fieldTop, fieldBot, cols, rows, r, fs} = L;
  const lam = wave.lamPx, cyc = wave.cycles(), front = wave.front;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const isSolid = solid();
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
  if (!spr) spr = [ball(BALL.blue, r), ball(BALL.orange, r), ball(BALL.pale, r), ball(BALL.red, r + 1.8)];
  const sprites = spr;
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

// ---- water tank scene (baked once per layout; per frame drawImage only) ----
function mkCanvas(w, hh) {
  const dpr = ballDpr(), c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * dpr)); c.height = Math.max(1, Math.ceil(hh * dpr));
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  return {c, g};
}
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) gr.addColorStop(o, col); return gr; }
function bakeScene() {
  const {cy, F, w} = L, tr = L.tr;
  {                                                          // glass tank + water with depth gradient
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
  }
}
function drawSolidBack(ctx) {
  if (!L.scene) bakeScene();
  const sc = L.scene;
  ctx.drawImage(sc.c, sc.x, sc.y, sc.w, sc.h);
}
// transducer membrane: edges fixed flush with the housing front, centre bulges by dd (design units, same u as the first particle layer)
function drawMembrane(ctx, s, dd) {
  const fx = TR.FACE_X, h2 = TR.FACE_H / 2 - 2, y0 = TR.FACE_Y - h2, y1 = TR.FACE_Y + h2, cx = fx + 2 * dd;
  ctx.beginPath(); ctx.moveTo(fx, y0); ctx.quadraticCurveTo(cx, TR.FACE_Y, fx, y1);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2f343a'; ctx.lineWidth = 4.2; ctx.stroke();
  ctx.strokeStyle = '#d9dee3'; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.9; ctx.stroke();
}
function drawSolidFront(ctx) {
  const tr = L.tr, s = tr.s, dpr = ballDpr(), u0 = wave.u(0), ue = wave.u(L.airW);
  if (trd.scale !== s || trd.dpr !== dpr) trd.render(s, dpr);
  trd.draw(ctx, tr.x, tr.y);
  ctx.save(); ctx.translate(tr.x, tr.y); ctx.scale(s, s); drawMembrane(ctx, s, u0 / s); ctx.restore();
  ctx.save(); ctx.translate(tr.rx, tr.y); ctx.scale(-1, 1); trd.draw(ctx, 0, 0); ctx.scale(s, s); drawMembrane(ctx, s, -ue / s); ctx.restore();
}

const SRC = {speaker: {get labels() { return spkLabels(); }, title: 'Loa'}, talker: {get labels() { return talkLabels(); }, title: 'Người nói'}};
const srcFig = () => state.source === 'talker' ? talk : spk;
const clampB = x => Math.max(-1, Math.min(1, x));

function buildLabels(ctx) {
  const key = L.w + 'x' + L.h + state.source + L.layout + L.compact + zoom;
  if (key === labelKey) return;
  labelKey = key;
  const lab = {src: [], ear: [], tops: {src: 1e9, ear: 1e9}};
  L.lab = lab; L.artBottom = 0;
  const sf = srcFig(), S = SRC[state.source];
  const mk = (tbl, ids, side) => tbl.filter(t => !ids || ids.includes(t[0])).map(t => ({id: t[0], text: t[1], tx: t[2], ty: t[3], side: side || t[4], row: t[5]}));
  for (const f of [sf, ear]) L.artBottom = Math.max(L.artBottom, f.y + f.h * f.s);
  if (L.layout === 'bars') return;
  const g = ear.disc();
  if (zoom) {                                    // all 7 parts + Não around the big disc: two side columns, or rows above / below on a narrow stage
    const side = ear.zm.side, fz = L.phone ? 12 : 13, rowOf = {cwave: 'top', pinna: 'top', ossicles: 'top', canals: 'top', brain: 'top', canal: 'bottom', drum: 'bottom', cochlea: 'bottom', nerve: 'bottom'};
    const zl = earLabels().map(t => ({id: t[0], text: t[1], tx: t[2], ty: t[3], side: side ? ZOOM_SIDE[t[0]] : rowOf[t[0]], row: t[5]}));
    lab.ear = side ? layoutLabels(ctx, ear, zl, {mode: 'side', size: fz, xR: g.x + g.r + 20, xL: g.x - g.r - 20, ymin: g.y - g.r + 12, ymax: g.y + g.r - 12})
      : layoutLabels(ctx, ear, zl, {mode: 'rows', size: fz, xmin: 4, xmax: L.w - 4, yTop: g.y - g.r - 5, yBot: g.y + g.r * 1.09 + 4});
    return;
  }
  if (L.compact) return;
  if (L.layout === 'stack') {
    lab.src = layoutLabels(ctx, sf, mk(S.labels, fitN(PHONE_LABELS[state.source], L.bandA), 'right'), {mode: 'side', size: 11, xR: sf.x + sf.w * sf.s + 10, xL: 0, ymin: sf.y + 26, ymax: sf.y + sf.h * sf.s - 12});
    // phone: the part names are in "phóng to" (the disc takes the room the pills would need)
    return;
  }
  const fsz = 13;
  lab.src = layoutLabels(ctx, sf, mk(S.labels), {mode: 'rows', size: 12, xmin: 2, xmax: L.airL - 2, yTop: sf.y - 4, yBot: sf.y + sf.h * sf.s + 4});
  lab.ear = layoutLabels(ctx, ear, mk(earLabels()), {mode: 'rows', size: fsz, xmin: g.x - g.r + 4, xmax: L.w - 2, yTop: g.y - g.r - 5, yBot: g.y + g.r * 1.09 + 4});
  for (const [k, f] of [['src', sf], ['ear', ear]]) {
    for (const l of lab[k]) { lab.tops[k] = Math.min(lab.tops[k], l.y - l.h / 2); L.artBottom = Math.max(L.artBottom, l.y + l.h / 2); }
    if (lab.tops[k] > 1e8) lab.tops[k] = f.y;
  }
}

// eardrum displacement (ear.svg units) and nerve-pulse phase from the wave arriving at the canal
function earDrive() {
  const ear0 = L.airR - L.airL + 6, drumX = ear0 + (CAN.x1 - CAN.x0) * wave.lamPx / LAMC;
  // eardrum bulge ∝ −∂u/∂x at the drum = pressure: it goes in exactly when a compression reaches it
  return {d: wave.s(drumX) * 2.4, phase: wave.front >= ear0 ? (((wave.cycles() - ear0 / wave.lamPx) % 1) + 1) % 1 : -1};
}
// pressure at the eardrum ∝ −∂u/∂x: simulated time tt → value / (kA)
const SC_SOUND = {kind: 't', colors: ['#1c7ed6'], names: ['Áp suất tại màng nhĩ'], T: () => 1 / state.f};
function probe(tt, out) {
  const ear0 = L.airR - L.airL + 6, x = state.medium === 'air' ? ear0 + (CAN.x1 - CAN.x0) * wave.lamPx / LAMC : ear0;
  out[0] = tt * wave.lamPx * wave.f >= x ? Math.cos(wave.w * tt - wave.k * x) : 0;
}
const zoomOn = () => zoom && state.medium === 'air' && L.layout !== 'bars';

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
  const dr = earDrive();
  ear.draw(ctx, dr.d, dr.phase);
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
  if (zoomOn()) { if (L.lab) drawLabels(ctx, L.lab.ear, null, L.phone ? 12 : 13, null); return; }
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
  // --- water: names of the two devices and of the medium
  if (solid()) {
    if (L.compact) return;
    const tr = L.tr, s = tr.s, yb = tr.y + 13 * s;
    for (const [x, t] of [[tr.x + 72 * s, 'Đầu phát'], [tr.rx - 72 * s, 'Máy thu']]) {
      const ly = yb - 22;
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, ly + 9); ctx.lineTo(x, yb + 3); ctx.stroke();
      pill(ctx, t, x, ly, {size: fs, fill: C.paper, stroke: C.ink2, color: C.ink});
    }
    const yn = Math.max(L.scene.ybot + 16, L.fieldBot + 82);
    if (yn < L.h - 12) pill(ctx, 'Bể nước', airL + airW / 2, yn, {size: fs, weight: 800, fill: C.paper, stroke: null, color: C.ink2});
    return;
  }
  // --- part labels + headings
  if (L.layout === 'bars' || L.compact) return;
  const lab = L.lab; if (!lab) return;
  const sf = srcFig(), g = ear.disc();
  drawLabels(ctx, lab.src, null, L.layout === 'stack' ? 11 : 12, null);
  drawLabels(ctx, lab.ear, null, L.layout === 'stack' ? 11 : 13, null);
  const hs = L.fs + 1;
  if (L.layout === 'side') {
    text(ctx, SRC[state.source].title, (sf.x + L.airL) / 2 + (state.source === 'talker' ? -20 : 0), Math.min(lab.tops.src, sf.y) - 14, {size: hs, weight: 800});
    const hx = ear.x + HD.w * HD.s * 0.42 * ear.s, hy = ear.y + HD.y * ear.s - 8;      // two short lines above the head (clear of the disc and the air column)
    text(ctx, 'Tai người', hx, hy - 16, {size: hs, weight: 800}); text(ctx, 'nghe', hx, hy, {size: hs, weight: 800});
  } else {
    text(ctx, SRC[state.source].title, sf.x + sf.w * sf.s + 10, sf.y + 8, {size: hs - 1, weight: 800, align: 'left'});
    // phone: the names live in "phóng to" – one hint beside the head
    const hx = 8, hy = ear.y + HD.y * ear.s - 22;
    text(ctx, 'Chạm kính lúp', hx, hy - 14, {size: 11.5, weight: 700, align: 'left', color: C.ink2});
    text(ctx, 'để xem tên', hx, hy, {size: 11.5, weight: 700, align: 'left', color: C.ink2});
  }
}

// source chips / loudspeaker view exist only in air (in water the source touches the medium)
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
    airOnly(group('wave', 'Nguồn âm',
      seg([['speaker', 'Loa'], ['talker', 'Người nói']], () => state.source, v => set('source', v), 'Nguồn âm'))),
    group('wave', 'Sóng âm',
      lab('freq', 'Tần số f', fVal), fSlider,
      h('div', {class: 'chips g5'}, ...[100, 262, 440, 1000, 4000].map(f => chip(f >= 1000 ? f / 1000 + 'k' : String(f), () => state.f === f, () => setF(f), 'sm'))),
      fNote,
      lab('vol', 'Độ to', dbVal), dbSlider,
      lab('medium', 'Môi trường'),
      h('div', {class: 'chips g2'}, ...Object.keys(MEDIUM).map(k => chip(MEDIUM[k], () => state.medium === k, () => set('medium', k)))),
      ...slowControl()),
    group('show', 'Hiển thị',
      h('div', {class: 'tgs'},
        toggle('target', 'Phần tử đỏ', () => state.track, v => set('track', v), 'Theo dõi một phần tử (màu đỏ)')))
  ];
}

export default {
  id: 'sound', title: 'Sóng âm', short: 'Sóng âm', icon: 'vol',
  defaults: {get slow() { return niceSlow(state.f); }},
  metrics: () => ({f: state.f, v: SPEED[state.medium] || SPEED.air}),
  readout: () => readout(),
  probe, scope: () => SC_SOUND, controls, layout, draw, annotate, pointer,
  update() {}, reset() { rulerN = -1; }, leave() { setZoom(false); }
};
