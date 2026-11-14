// Flat cross-section of the human ear (listener, facing the sound from the left).
// Order along the sound path: vành tai → ống tai → màng nhĩ → xương búa → xương đe → xương bàn đạp → cửa sổ bầu dục → ốc tai → dây thần kinh.
// Design units: 250 × 200, ear-canal axis at y = 100.
import {Figure, stipple} from './figure.js';
import {C} from '../draw/ink.js';

const SKIN = '#f3c9b1', SKIN_L = '#9c5b43', BONE_L = '#a08a62', OSS = '#f1e3c4', OSS_L = '#8a6d3b';
const PUR = '#b197fc', PUR_L = '#5f3dc4', NERVE = '#fcc419', NERVE_L = '#b08900';
export const EAR_W = 250, EAR_H = 200;

const SILHOUETTE = 'M 70 8 L 206 8 Q 224 8 224 26 L 224 174 Q 224 192 206 192 L 70 192 ' +
  'C 46 192 24 184 18 160 C 14 146 28 138 44 136 C 62 132 78 120 88 114 L 124 118 L 110 88 L 88 86 ' +
  'C 78 80 60 68 44 62 C 30 58 14 52 16 36 C 20 16 46 8 70 8 Z';

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

export const NERVE_PTS = [[184, 140], [196, 137], [210, 131], [224, 126], [240, 122]];

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
// default labels (≤ 7): [part id, text, target x, y, side]
export const EAR_LABELS = [
  ['pinna', 'Vành tai', 34, 40, 'top'], ['canal', 'Ống tai', 98, 100, 'top'], ['malleus', 'Xương búa – đe – bàn đạp', 139, 72, 'top'], ['canals', 'Ống bán khuyên', 192, 56, 'top'],
  ['drum', 'Màng nhĩ', 117, 106, 'bottom'], ['cochlea', 'Ốc tai', 186, 160, 'bottom'], ['nerve', 'Dây thần kinh thính giác', 214, 128, 'bottom']
];

export function makeEar() {
  const bone = stipple('#e0d2b0', '#f6eedb');
  const parts = [
    {id: 'skin', d: SILHOUETTE, fill: SKIN, pick: false},
    {id: 'pinna', d: 'M 70 8 C 46 8 20 16 16 36 C 14 52 30 58 44 62 C 60 68 78 80 88 86 L 88 8 Z M 88 114 C 78 120 62 132 44 136 C 28 138 14 146 18 160 C 24 184 46 192 70 192 L 88 192 Z', fill: SKIN},
    {id: 'bone', d: 'M 96 18 L 208 18 Q 216 18 216 26 L 216 174 Q 216 182 208 182 L 96 182 Q 92 182 92 178 L 92 22 Q 92 18 96 18 Z', fill: bone, stroke: BONE_L, lw: 1.3, pick: false},
    {id: 'canal', d: 'M 88 86 L 110 88 L 124 118 L 88 114 Z', fill: '#eaa58e', thin: true},
    {id: 'outline', d: SILHOUETTE, fill: null, stroke: SKIN_L, lw: 2, pick: false},
    {id: 'helix', d: 'M 52 20 C 32 24 26 42 40 52 M 48 180 C 30 176 28 152 44 146', fill: null, stroke: SKIN_L, lw: 1.5, pick: false},
    {id: 'eust', items: [{d: 'M 136 136 C 140 154 146 172 152 186', w: 7}], fill: '#e98f93', stroke: SKIN_L, lw: 1.4},
    {id: 'cavity', d: 'M 110 88 L 112 72 Q 114 62 126 62 L 146 62 Q 158 62 158 74 L 158 122 Q 158 134 146 136 L 134 138 Q 126 136 124 118 Z', fill: '#fff9ef', stroke: BONE_L, lw: 1.5, pick: false},
    {id: 'canals', items: [{path: ring(166, 80, 26, 10, -1.35), w: 4.4}, {path: ring(184, 84, 24, 10, -0.9), w: 4.4}, {path: ring(190, 104, 21, 9, -0.2), w: 4.4}], fill: PUR, stroke: PUR_L, lw: 1.5},
    {id: 'vest', d: 'M 161 106 a 9 13 0 1 0 18 0 a 9 13 0 1 0 -18 0 Z', fill: PUR, stroke: PUR_L, lw: 1.6, pick: false},
    {id: 'cochlea', items: [{path: spiral(184, 142, 23, 9.4, 2.35, 4.0), w: 8.2}], fill: PUR, stroke: PUR_L, lw: 1.5},
    {id: 'nerve', items: [{d: 'M 184 142 C 196 137 208 131 226 126 L 240 122', w: 7}, {d: 'M 176 98 C 190 102 198 112 204 128', w: 4.2}], fill: NERVE, stroke: NERVE_L, lw: 1.4},
    {id: 'oval', items: [{d: 'M 160 99 L 160 113', w: 3}], fill: '#d0bfff', stroke: PUR_L, lw: 1.2, thin: true},
    {id: 'beam', d: 'M 90 98.5 L 101 98.5 L 101 95 L 108 100.5 L 101 106 L 101 102.5 L 90 102.5 Z', fill: '#fff', stroke: SKIN_L, lw: 1, pick: false, after: true},
    // moving parts (painted by draw())
    {id: 'drum', dyn: true, d: 'M 110 88 L 124 118', fill: null, thin: true, items: [{d: 'M 110 88 L 124 118', w: 3.2}]},
    {id: 'malleus', dyn: true, thin: true, fill: OSS, stroke: OSS_L, lw: 1.3, items: [{d: 'M 117 103 L 121 82', w: 3.4}, {d: 'M 122 78 L 129 71', w: 7.5}]},
    {id: 'incus', dyn: true, thin: true, fill: OSS, stroke: OSS_L, lw: 1.3, items: [{d: 'M 135 72 L 139 75', w: 9}, {d: 'M 141 79 L 144 100', w: 3.4}, {d: 'M 144 100 L 146 105', w: 5}]},
    {id: 'stapes', dyn: true, thin: true, fill: OSS, stroke: OSS_L, lw: 1.3, items: [{d: 'M 146 106 Q 150 98 154 103', w: 2.2}, {d: 'M 146 106 Q 150 114 154 110', w: 2.2}, {d: 'M 155 98 L 155 114', w: 4.2}]}
  ];
  // the drum is a membrane: painted specially (bowed), the others as rigid tubes
  parts.find(p => p.id === 'drum').fill = '#f4b183'; parts.find(p => p.id === 'drum').stroke = SKIN_L;
  const fig = new Figure(EAR_W, EAR_H, parts);

  const P = id => fig.by[id];
  // draw the moving parts. d = eardrum displacement in design units (+ = inward, to the right); phase = nerve pulse phase 0..1 or -1 (none)
  fig.drawDyn = (ctx, d, phase, labelsOn) => {
    fig.begin(ctx);
    const s = fig.s;
    // eardrum (bowed membrane fixed at both ends)
    const dp = P('drum'), sel = fig.sel === 'drum';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [col, lw] of sel ? [[C.red, 3.4 + 7 / s], [dp.fill, 3.4]] : [[SKIN_L, 3.4 + 2 * 1.3], [dp.fill, 3.4]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(110, 88); ctx.quadraticCurveTo(117 + 2 * d, 103, 124, 118); ctx.stroke();
    }
    // ossicles: levers about their pivots, small rotations
    const a1 = -d / 25, a2 = -0.8 * d / 36;
    ctx.save(); ctx.translate(126, 76); ctx.rotate(a1); ctx.translate(-126, -76); fig.paint(ctx, P('malleus'), fig.sel === 'malleus'); ctx.restore();
    ctx.save(); ctx.translate(140, 66); ctx.rotate(a2); ctx.translate(-140, -66); fig.paint(ctx, P('incus'), fig.sel === 'incus'); ctx.restore();
    ctx.save(); ctx.translate(0.8 * d, 0); fig.paint(ctx, P('stapes'), fig.sel === 'stapes'); ctx.restore();
    // static parts that must lie over the moving ones + selection marks
    for (const p of parts) if (p.after) fig.paint(ctx, p, false);
    const sp = fig.sel && P(fig.sel);
    if (sp && !sp.dyn) fig.mark(ctx, sp);
    // nerve pulses (dark dots running to the brain)
    if (phase >= 0) {
      ctx.fillStyle = C.ink; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (let k = 0; k < 2; k++) {
        let q = (phase + k * 0.5) % 1, len = 0;
        const n = NERVE_PTS.length - 1, seg = q * n, i = Math.min(n - 1, Math.floor(seg)), f = seg - i;
        const a = NERVE_PTS[i], b = NERVE_PTS[i + 1];
        ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 2.7, 0, 6.2832); ctx.fill(); ctx.stroke();
      }
    }
    if (labelsOn) { ctx.font = '700 ' + Math.max(9, 11 / s) + 'px "Be Vietnam Pro",system-ui,sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('não', 238, 110); }
    fig.end(ctx);
  };
  return fig;
}
