// Listener (Art v2): a small head in side profile facing the sound, a magnifier ring ("kính lúp") around its ear and a big
// circle showing the ear cross-section (coronal cut, after the Wikimedia "Anatomy of the Human Ear" diagram, redrawn flat).
// Sound path inside the circle, left → right: vành tai → ống tai → màng nhĩ → xương búa → xương đe → xương bàn đạp →
// cửa sổ bầu dục → ốc tai → dây thần kinh thính giác → não. Above the cochlea: three ống bán khuyên. Vòi nhĩ goes down-forward.
// Design units 300 × 250. The cross-section is authored in local units (0..224, circle centre (112,112), R 112) and placed at (OX, OY).
import {Figure, stipple} from './figure.js';
import {C} from '../draw/ink.js';

const SKIN = '#f3c9b1', SKIN_L = '#9c5b43', SKIN_D = '#e9b598', BONE_L = '#a08a62', OSS = '#f1e3c4', OSS_L = '#8a6d3b';
const PUR = '#b197fc', PUR_L = '#5f3dc4', NERVE = '#fcc419', NERVE_L = '#b08900', CANAL = '#eaa58e', DRUM = '#f4b183', CAV = '#fff9ef';
export const EAR_W = 300, EAR_H = 250;
export const OX = 76, OY = 22, CR = 112;                       // circle: centre (OX+112, OY+112), radius CR
export const EAR_CX = OX + 112, EAR_CY = OY + 112;

// old talker head outline (only for the small listener head until Phase 18 replaces it with art/head.svg)
const HAIR = '#4a3a2e', HAIR_L = '#2e241c';
const GAP = 'L 213 156.5 ';
const SILHOUETTE = 'M 118 4 C 160 2 192 22 200 52 C 203 64 202 76 206 85 C 207 90 203 93 203 97 ' +
  'C 210 108 222 119 230 127 C 234 131 231 137 225 137 C 220 137 216 136 213 138 C 213 141 216 144 217 147.5 ' +
  'C 217.5 150 216 151.5 213 151.5 ' + GAP + 'C 217 157 218 161 215 166 C 212 169 207 170 207 173 C 208 177 213 183 213 189 ' +
  'C 213 196 207 200 198 201 C 182 203 160 204 146 206 C 141 207 139 210 140 214 C 142 219 141 224 138 229 ' +
  'C 136 250 137 280 139 304 L 46 304 C 48 260 52 214 58 186 C 46 170 30 148 24 110 C 18 70 40 8 118 4 Z';

// One open airway: nasal cavity + nasopharynx + oral cavity + pharynx + larynx + trachea (palate and tongue are painted over it).
const HEAD = {
  skin: {id: 'skin', d: SILHOUETTE, fill: SKIN, pick: false},
  ear: {id: 'ear', d: 'M 97 92 C 92 86 80 86 75 94 C 70 102 71 116 76 126 C 79 133 84 138 90 138 C 94 138 96 133 96 128 C 96 123 100 120 100 114 C 100 106 98 100 97 92 Z', fill: SKIN_D, stroke: SKIN_L, lw: 1.4, pick: false},
  earIn: {id: 'earIn', d: 'M 93 97 C 86 94 79 99 79 108 C 79 117 83 125 88 128 M 93 108 C 88 106 85 111 88 116 C 90 118 93 118 94 115', fill: null, stroke: SKIN_L, lw: 1.2, pick: false},
  outline: {id: 'outline', d: SILHOUETTE.replace(GAP, 'M 213 156.5 ').replace(/ Z$/, ''), fill: null, stroke: SKIN_L, lw: 2, pick: false},
  hair: {id: 'hair', d: 'M 197 40 C 186 12 150 1 116 1.5 C 50 4 12 50 19 108 C 21 120 25 128 30 134 C 36 118 50 96 70 85 C 86 77 100 78 108 84 C 110 90 110 96 113 98 C 117 92 117 82 121 76 C 146 68 178 58 197 40 Z', fill: HAIR, stroke: HAIR_L, lw: 1.5, pick: false},
  nostril: {id: 'nostril', d: 'M 214 131 C 217 127 223 127 225 131', fill: null, stroke: SKIN_L, lw: 1.3, pick: false},
  eye: {id: 'eye', d: 'M 183 99 C 187 95 193 94.5 197 96.5 L 197.5 101 C 193 102.5 187 102 183 99 Z', fill: '#fff', stroke: C.ink2, lw: 1.1, pick: false},
  iris: {id: 'iris', d: 'M 191 98.6 a 2.8 2.8 0 1 0 5.6 0 a 2.8 2.8 0 1 0 -5.6 0 Z', fill: HAIR, pick: false},
  lid: {id: 'lid', d: 'M 182.5 99 C 187 94.5 193 93.5 197.5 96', fill: null, stroke: C.ink2, lw: 1.8, pick: false},
  brow: {id: 'brow', d: 'M 181 89 C 187 85.5 195 85 202 87.5', fill: null, stroke: HAIR, lw: 2.6, pick: false}
};

const T0 = new DOMMatrix([1, 0, 0, 1, OX, OY]);
const loc = d => { const p = new Path2D(); p.addPath(typeof d === 'string' ? new Path2D(d) : d, T0); return p; };

function spiral(cx, cy, r0, pitch, turns, a0) {
  const p = new Path2D(), n = Math.round(turns * 36);
  for (let i = 0; i <= n; i++) {
    const th = i / n * turns * 6.2832, r = r0 - pitch * th / 6.2832, a = a0 - th;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    i ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  return p;
}
function ring(cx, cy, rx, ry, rot) { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, rot, 0, 6.2832); return p; }

// small listener head: the talker's head mirrored to face the source (left)
const HK = 0.42, HX = 6, HY = 4;
const HM = new DOMMatrix([-HK, 0, 0, HK, HX + 236 * HK, HY]);
const hd = d => { const p = new Path2D(); p.addPath(new Path2D(d), HM); return p; };
const EARC = [HX + (236 - 85) * HK, HY + 112 * HK];            // ear centre on the small head (≈ 69, 51)
const RING_R = 19;

// nerve pulses run along this polyline (local units) to the brain
export const NERVE_PTS = [[181, 152], [193, 148], [205, 143], [216, 139], [223, 137]];

export const EAR_CAPS = {
  pinna: 'Vành tai: hứng sóng âm từ không khí và dẫn vào ống tai.',
  canal: 'Ống tai: dẫn sóng âm tới màng nhĩ.',
  drum: 'Màng nhĩ: dao động theo áp suất của sóng âm tới, cùng tần số f.',
  malleus: 'Xương búa: dính vào màng nhĩ, nhận dao động của màng nhĩ.',
  incus: 'Xương đe: truyền dao động từ xương búa sang xương bàn đạp.',
  stapes: 'Xương bàn đạp: đẩy vào cửa sổ bầu dục, đưa dao động vào tai trong.',
  oval: 'Cửa sổ bầu dục: màng kín lối vào ốc tai, truyền dao động vào chất lỏng.',
  cochlea: 'Ốc tai: chứa chất lỏng, biến dao động thành tín hiệu thần kinh.',
  canals: 'Ống bán khuyên: giữ thăng bằng cho cơ thể, không dùng để nghe.',
  nerve: 'Dây thần kinh thính giác: truyền tín hiệu từ ốc tai lên não.',
  eust: 'Vòi nhĩ: nối tai giữa với họng, cân bằng áp suất hai bên màng nhĩ.'
};
export const EAR_NAMES = {pinna: 'Vành tai', canal: 'Ống tai', drum: 'Màng nhĩ', malleus: 'Xương búa', incus: 'Xương đe', stapes: 'Xương bàn đạp',
  oval: 'Cửa sổ bầu dục', cochlea: 'Ốc tai', canals: 'Ống bán khuyên', nerve: 'Dây thần kinh thính giác', eust: 'Vòi nhĩ'};
// default labels (≤ 7): [part id, text, target x, y (design units), side]; target x increases with the order so leaders do not cross
const lab = (id, text, lx, ly, side, row) => [id, text, OX + lx, OY + ly, side, row];
export const EAR_LABELS = [
  lab('pinna', 'Vành tai', 20, 82, 'top'), lab('malleus', 'Xương búa – đe – bàn đạp', 118, 88, 'top', 1), lab('canals', 'Ống bán khuyên', 178, 52, 'top', 0),
  lab('canal', 'Ống tai', 66, 124, 'bottom'), lab('drum', 'Màng nhĩ', 106, 124, 'bottom'), lab('cochlea', 'Ốc tai', 176, 172, 'bottom'),
  lab('nerve', 'Dây thần kinh thính giác', 212, 141, 'bottom')
];

export function makeEar() {
  const bone = stipple('#e0d2b0', '#f6eedb');
  // magnifier geometry: external tangent lines between the ring on the ear and the big circle
  const dx = EAR_CX - EARC[0], dy = EAR_CY - EARC[1], d = Math.hypot(dx, dy), base = Math.atan2(dy, dx), al = Math.acos((CR - RING_R) / d);
  const tan = new Path2D();
  for (const sg of [-1, 1]) {
    const a = base + sg * al, ca = Math.cos(a), sa = Math.sin(a);
    tan.moveTo(EARC[0] + RING_R * ca, EARC[1] + RING_R * sa); tan.lineTo(EAR_CX + CR * ca, EAR_CY + CR * sa);
  }
  const circle = new Path2D(); circle.arc(EAR_CX, EAR_CY, CR, 0, 6.2832);
  const circleIn = new Path2D(); circleIn.arc(EAR_CX, EAR_CY, CR - 1, 0, 6.2832);

  const parts = [
    // --- listener head (context)
    {id: 'h-skin', path: hd(HEAD.skin.d), fill: SKIN, pick: false},
    {id: 'h-ear', path: hd(HEAD.ear.d), fill: SKIN_D, stroke: SKIN_L, lw: 1.1, pick: false},
    {id: 'h-earIn', path: hd(HEAD.earIn.d), fill: null, stroke: SKIN_L, lw: 0.9, pick: false},
    {id: 'h-outline', path: hd(HEAD.outline.d), fill: null, stroke: SKIN_L, lw: 1.5, pick: false},
    {id: 'h-hair', path: hd(HEAD.hair.d), fill: HEAD.hair.fill, stroke: HEAD.hair.stroke, lw: 1.1, pick: false},
    {id: 'h-nostril', path: hd(HEAD.nostril.d), fill: null, stroke: SKIN_L, lw: 1, pick: false},
    {id: 'h-eye', path: hd(HEAD.eye.d), fill: '#fff', stroke: C.ink2, lw: 0.9, pick: false},
    {id: 'h-iris', path: hd(HEAD.iris.d), fill: HEAD.iris.fill, pick: false},
    {id: 'h-brow', path: hd(HEAD.brow.d), fill: null, stroke: HEAD.brow.stroke, lw: 1.5, pick: false},
    // shirt hides the cut end of the neck
    {id: 'shirt', path: (() => { const p = new Path2D('M 44 106 C 40 118 14 120 3 142 L 3 160 L 118 160 L 100 112 C 92 108 90 106 86 106 Z'); return p; })(), fill: '#868e96', stroke: '#495057', lw: 1.5, pick: false},
    // --- magnifier: ring on the ear + two tangents to the circle
    {id: 'lens', path: tan, fill: null, stroke: C.ink2, lw: 1.3, pick: false},
    {id: 'ring', path: (() => { const p = new Path2D(); p.arc(EARC[0], EARC[1], RING_R, 0, 6.2832); return p; })(), fill: null, stroke: C.ink, lw: 2, pick: false},
    // --- cross-section, clipped to the circle
    {id: 'clipOn', path: circleIn, clipOn: true, pick: false},
    {id: 'paper', path: circle, fill: '#fffdf7', pick: false},
    {id: 'bone', path: loc('M 58 0 L 224 0 L 224 224 L 58 224 Z'), fill: bone, pick: false},
    {id: 'cavity', path: loc('M 100 104 L 98 92 C 98 82 108 77 118 77 L 140 77 C 148 77 152 83 152 91 L 152 150 C 152 158 146 162 138 162 L 124 160 C 116 158 112 150 111 138 Z'), fill: CAV, stroke: BONE_L, lw: 1.5, pick: false},
    {id: 'eust', items: [{path: loc('M 132 158 C 138 172 146 188 157 206'), w: 7}], fill: '#e98f93', stroke: SKIN_L, lw: 1.4},
    // pinna + head wall: two pieces, the ear canal passes between them
    {id: 'pinna', path: loc('M 62 22 C 44 22 20 38 14 62 C 9 84 18 90 28 94 L 42 107 L 62 110 Z M 62 130 L 42 130 L 28 142 C 12 150 8 168 14 184 C 20 200 42 206 62 202 Z'), fill: SKIN_D, stroke: SKIN_L, lw: 2},
    {id: 'pinnaIn', path: loc('M 62 33 C 48 33 31 45 25 64 C 21 80 26 85 34 89 L 44 99 L 62 101 Z M 62 139 L 46 139 L 36 148 C 24 156 20 168 24 180 C 28 192 44 195 62 193 Z'), fill: SKIN, pick: false},
    {id: 'helix', path: loc('M 56 48 C 41 51 34 63 37 77 M 56 183 C 43 182 35 175 34 165'), fill: null, stroke: SKIN_L, lw: 1.3, pick: false},
    {id: 'canal', path: loc('M 28 94 L 42 107 C 60 110 80 109 101 106 L 110 133 C 86 131 62 130 42 130 L 28 142 Z'), fill: CANAL, stroke: null, thin: true},
    {id: 'canalWall', path: loc('M 28 94 L 42 107 C 60 110 80 109 101 106 M 28 142 L 42 130 C 62 130 86 131 110 133'), fill: null, stroke: SKIN_L, lw: 1.8, pick: false},
    // inner ear
    {id: 'canals', items: [{path: loc(ring(159, 74, 7, 22, 0.12)), w: 4.2}, {path: loc(ring(178, 92, 21, 5.5, -0.08)), w: 4.2}, {path: loc(ring(187, 68, 17, 6.5, 1.15)), w: 4.2}], fill: PUR, stroke: PUR_L, lw: 1.5},
    {id: 'vest', path: loc(ring(166, 113, 11, 15, 0)), fill: PUR, stroke: PUR_L, lw: 1.6, pick: false},
    {id: 'cochlea', items: [{path: loc(spiral(181, 152, 23, 9.2, 2.35, 4.0)), w: 8}], fill: PUR, stroke: PUR_L, lw: 1.5},
    {id: 'round', path: loc(ring(155, 148, 3.6, 3.6, 0)), fill: '#d0bfff', stroke: PUR_L, lw: 1.1, pick: false},
    {id: 'nerve', items: [{path: loc('M 181 152 C 192 149 204 143 223 137 L 240 133'), w: 7}, {path: loc('M 172 118 C 188 122 204 130 216 136'), w: 3.4}], fill: NERVE, stroke: NERVE_L, lw: 1.4},
    {id: 'oval', fat: 5, items: [{path: loc('M 152.5 107 L 152.5 121'), w: 3}], fill: '#d0bfff', stroke: PUR_L, lw: 1.2, thin: true},
    {id: 'arcs', path: loc((() => { let d = ''; for (const r of [10, 17, 24]) { const a = 0.62; d += `M ${38 - r * Math.cos(a)} ${118 - r * Math.sin(a)} A ${r} ${r} 0 0 0 ${38 - r * Math.cos(a)} ${118 + r * Math.sin(a)} `; } return d; })()), fill: null, stroke: C.comp, lw: 1.8, pick: false},
    {id: 'beam', path: loc('M 44 117 L 64 117 L 64 112.5 L 76 120 L 64 127.5 L 64 123 L 44 123 Z'), fill: '#fff', stroke: SKIN_L, lw: 1.1, pick: false},
    {id: 'clipOff', path: circle, clipOff: true, pick: false},
    {id: 'rim', path: circle, fill: null, stroke: C.ink, lw: 2.6, pick: false},
    // moving parts (painted by drawDyn, in local units)
    {id: 'malleus', fat: 2, dyn: true, thin: true, fill: OSS, stroke: OSS_L, lw: 1.3, items: [{path: loc('M 106 111 L 109 127'), w: 3.2}, {path: loc('M 107 111 L 112 96'), w: 3.6}, {path: loc('M 112 91 L 114 88'), w: 10.5}]},
    {id: 'incus', fat: 5, dyn: true, thin: true, fill: OSS, stroke: OSS_L, lw: 1.3, items: [{path: loc('M 122 88 L 125 91'), w: 10.5}, {path: loc('M 126 94 L 132 112'), w: 3.4}, {path: loc('M 132 112 L 134 114'), w: 5}]},
    {id: 'stapes', fat: 5, dyn: true, thin: true, fill: OSS, stroke: OSS_L, lw: 1.3, items: [{path: loc('M 138 114 Q 144 105 151 108'), w: 2.2}, {path: loc('M 138 114 Q 144 123 151 120'), w: 2.2}, {path: loc('M 152 107 L 152 121'), w: 4.2}]},
    {id: 'drum', fat: 3, dyn: true, thin: true, fill: DRUM, stroke: SKIN_L, items: [{path: loc('M 101 104 L 110.5 133'), w: 3.2}]}
  ];
  const fig = new Figure(EAR_W, EAR_H, parts);
  const P = id => fig.by[id];

  // moving parts. d = eardrum displacement in design units (+ = inward, to the right); phase = nerve pulse phase 0..1 or -1 (none)
  fig.drawDyn = (ctx, d, phase, labelsOn) => {
    fig.begin(ctx);
    const s = fig.s;
    ctx.translate(OX, OY);                                           // → local units of the cross-section
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // eardrum: a bowed membrane fixed at both ends (control point moves along the membrane normal)
    const dsel = fig.sel === 'drum', cx = 105.5 + 2.1 * d, cy = 118.5 - 0.65 * d;
    for (const [col, lw] of dsel ? [[C.red, 3.2 + 7 / s], [DRUM, 3.2]] : [[SKIN_L, 3.2 + 2.6], [DRUM, 3.2]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(101, 104); ctx.quadraticCurveTo(cx, cy, 110.5, 133); ctx.stroke();
    }
    ctx.translate(-OX, -OY);
    // ossicles: levers about their pivots (small rotations), the stapes slides into the oval window
    const a1 = -d / 34, a2 = -0.9 * d / 30;
    ctx.save(); ctx.translate(OX + 114, OY + 88); ctx.rotate(a1); ctx.translate(-OX - 114, -OY - 88); fig.paint(ctx, P('malleus'), fig.sel === 'malleus'); ctx.restore();
    ctx.save(); ctx.translate(OX + 122, OY + 88); ctx.rotate(a2); ctx.translate(-OX - 122, -OY - 88); fig.paint(ctx, P('incus'), fig.sel === 'incus'); ctx.restore();
    ctx.save(); ctx.translate(0.8 * d, 0); fig.paint(ctx, P('stapes'), fig.sel === 'stapes'); ctx.restore();
    // static parts over the moving ones + selection mark of a static part
    const sp = fig.sel && P(fig.sel);
    if (sp && !sp.dyn) fig.mark(ctx, sp);
    fig.hoverMark(ctx);
    // nerve pulses (dark dots running to the brain)
    if (phase >= 0) {
      ctx.fillStyle = C.ink; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (let k = 0; k < 2; k++) {
        const q = (phase + k * 0.5) % 1, n = NERVE_PTS.length - 1, seg = q * n, i = Math.min(n - 1, Math.floor(seg)), f = seg - i;
        const a = NERVE_PTS[i], b = NERVE_PTS[i + 1];
        ctx.beginPath(); ctx.arc(OX + a[0] + (b[0] - a[0]) * f, OY + a[1] + (b[1] - a[1]) * f, 2.7, 0, 6.2832); ctx.fill(); ctx.stroke();
      }
    }
    if (labelsOn) { ctx.font = '700 ' + Math.max(9, 11 / s) + 'px "Be Vietnam Pro",system-ui,sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('não', OX + 206, OY + 125); }
    fig.end(ctx);
  };
  return fig;
}
