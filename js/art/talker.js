// Speaking person (Art v2): calm adult side profile facing right, with a midline (sagittal) cut of the vocal tract
// as in the "Places of articulation" diagram: nasal cavity, hard + soft palate, tongue, teeth, lips, oral cavity,
// pharynx (họng), epiglottis, larynx with the vibrating vocal folds (dây thanh âm), trachea, cervical vertebrae.
// Air spaces are paper-coloured with a pink mucosa lining, so the airway reads as one open channel to the lips.
// Proportions: eye ≈ head mid-height, ear from brow to nose bottom, mouth at 1/3 between nose bottom and chin.
// Design units: 236 × 300, mouth opening at (216, 154).
import {Figure} from './figure.js';
import {C, roundRect} from '../draw/ink.js';

export const TALK_W = 236, TALK_H = 300, MOUTH = [216, 154];
const SKIN = '#f3c9b1', SKIN_L = '#9c5b43', SKIN_D = '#e9b598', LINING = '#e98f93', LINING_D = '#c46a72', AIR = '#fbf4ef';
const TONGUE = '#d9727a', TONGUE_L = '#a8424a', SOFT = '#e27f86', TOOTH = '#f4ecd8', BONE_L = '#a08a62', VERT = '#efe3c6', CORD = '#c2255c', CORD_L = '#7a1236';
const HAIR = '#4a3a2e', HAIR_L = '#2e241c', FLOW = '#3b6e9e';
const FY = 222, FX0 = 112, FX1 = 128.5;                      // vocal folds: level and the two side walls of the larynx

// Head + neck silhouette (clockwise from the crown). The mouth gap (y 151.5 – 156.5) stays open in the outline.
const GAP = 'L 213 156.5 ';
const SILHOUETTE = 'M 118 4 C 160 2 192 22 200 52 C 203 64 202 76 206 85 C 207 90 203 93 203 97 ' +
  'C 210 108 222 119 230 127 C 234 131 231 137 225 137 C 220 137 216 136 213 138 C 213 141 216 144 217 147.5 ' +
  'C 217.5 150 216 151.5 213 151.5 ' + GAP + 'C 217 157 218 161 215 166 C 212 169 207 170 207 173 C 208 177 213 183 213 189 ' +
  'C 213 196 207 200 198 201 C 182 203 160 204 146 206 C 141 207 139 210 140 214 C 142 219 141 224 138 229 ' +
  'C 136 250 137 280 139 304 L 46 304 C 48 260 52 214 58 186 C 46 170 30 148 24 110 C 18 70 40 8 118 4 Z';

// One open airway: nasal cavity + nasopharynx + oral cavity + pharynx + larynx + trachea (palate and tongue are painted over it).
const AIRWAY = 'M 215 151.5 L 207 151 L 205 140 L 206 134 L 209 128 C 211 119 205 108 193 104 C 174 100 148 102 130 107 ' +
  'C 116 111 105 120 104 134 L 104 200 C 104 208 110 211 112 216 L 112 304 L 128.5 304 L 128.5 232 ' +
  'C 128.5 222 131 214 131 206 C 131 198 128 192 124 188 L 160 200 L 200 176 L 204 168 L 206 158 L 215 156.5 Z';

function vertebrae() {
  const p = new Path2D();
  for (let i = 0; i < 7; i++) {
    const y = 142 + i * 24, x = 77 - 3 * Math.sin(i * 0.45 + 0.3);
    roundRect(p, x, y, 21, 20, 4);
    // spinous process pointing back (to the left)
    p.moveTo(x + 1, y + 6); p.lineTo(x - 12, y + 11); p.lineTo(x - 12, y + 15.5); p.lineTo(x + 1, y + 15); p.closePath();
  }
  return p;
}
function rings() {
  const p = new Path2D();
  for (let i = 0; i < 4; i++) roundRect(p, 128.5, 250 + i * 13, 5, 6.5, 2);
  return p;
}

export const TALK_NAMES = {mouth: 'Khoang miệng', throat: 'Họng', tongue: 'Lưỡi', cords: 'Dây thanh âm', nasal: 'Khoang mũi', spine: 'Cột sống cổ', teeth: 'Răng', lips: 'Môi', larynx: 'Thanh quản', trachea: 'Khí quản', epi: 'Nắp thanh quản', jaw: 'Xương hàm dưới', palate: 'Vòm miệng', velum: 'Vòm miệng mềm'};
export const TALK_CAPS = {
  cords: 'Dây thanh âm: luồng khí từ phổi làm chúng rung lên – đây là nguồn dao động phát ra âm.',
  throat: 'Họng: ống dẫn luồng khí và sóng âm từ thanh quản lên khoang miệng, khoang mũi.',
  mouth: 'Khoang miệng: định dạng âm thanh; sóng âm truyền ra không khí qua môi.',
  tongue: 'Lưỡi: thay đổi hình dạng khoang miệng nên thay đổi âm sắc của giọng.',
  nasal: 'Khoang mũi: khoang rỗng phía trên vòm miệng, cộng hưởng làm giọng vang hơn.',
  spine: 'Cột sống cổ: các đốt sống phía sau họng.',
  teeth: 'Răng: cùng với môi và lưỡi tạo ra các phụ âm.',
  lips: 'Môi: mở ra để sóng âm truyền ra không khí.',
  larynx: 'Thanh quản: sụn bao quanh và bảo vệ dây thanh âm.',
  trachea: 'Khí quản: ống dẫn không khí từ phổi lên thanh quản.',
  epi: 'Nắp thanh quản: đóng lối vào khí quản khi nuốt.',
  jaw: 'Xương hàm dưới: nâng đỡ lưỡi và răng dưới.',
  palate: 'Vòm miệng cứng: tấm xương ngăn khoang miệng với khoang mũi.',
  velum: 'Vòm miệng mềm (có lưỡi gà): nâng lên hay hạ xuống để đóng, mở đường lên khoang mũi.'
};
// [id, text, target x, target y, side] – ≤ 5 labels; targets spread in x so the leaders never cross
export const TALK_LABELS = [
  ['throat', 'Họng', 110, 168, 'top'], ['nasal', 'Khoang mũi', 146, 114, 'top'], ['mouth', 'Khoang miệng', 188, 148, 'top'],
  ['cords', 'Dây thanh âm (nguồn dao động)', 120, FY, 'bottom'], ['tongue', 'Lưỡi', 166, 176, 'bottom']
];

// Head shapes shared with the listener figure (ear.js): plain data; each Figure builds its own Path2D from them.
export const HEAD = {
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

export function makeTalker() {
  const parts = [
    HEAD.skin,
    HEAD.ear,
    HEAD.earIn,
    {id: 'spine', path: vertebrae(), fill: VERT, stroke: BONE_L, lw: 1.3},
    {id: 'air', d: AIRWAY, fill: AIR, stroke: LINING, lw: 4.5, lineFirst: true, pick: false},
    {id: 'turb', d: 'M 138 110 C 158 105 180 105 196 111 C 182 114 158 114 138 110 Z M 140 121 C 160 116 184 117 202 125 C 186 128 160 127 140 121 Z', fill: '#f2b3b5', stroke: LINING_D, lw: 1.1, pick: false},
    {id: 'palate', d: 'M 206 134 C 190 134.5 168 135.5 150 137.5 L 150 143.5 C 168 142.5 188 142.5 203 141.5 Z', fill: TOOTH, stroke: BONE_L, lw: 1.3, thin: true},
    {id: 'velum', d: 'M 150 137.5 C 140 138.5 132 141 128 146 C 125 150 124 154 126 157 C 128.5 157.5 130 153.5 132 151 C 137 147 144 144 150 143.5 Z', fill: SOFT, stroke: TONGUE_L, lw: 1.2, thin: true},
    {id: 'tongue', d: 'M 203 168 C 202 161 197 158 187 157.5 C 170 157 150 157 138 162 C 127 167 121 175 122 186 C 124 196 134 202 150 203 C 172 203 192 192 201 178 Z', fill: TONGUE, stroke: TONGUE_L, lw: 1.5},
    {id: 'tongueIn', d: 'M 140 170 C 156 166 176 166 192 170', fill: null, stroke: '#c45a63', lw: 1.1, pick: false},
    {id: 'epi', d: 'M 125.5 200 C 119 194 115 186 116 176 C 120 180 125 190 129 197 Z', fill: SOFT, stroke: TONGUE_L, lw: 1.1, thin: true},
    {id: 'hyoid', d: 'M 132 202.5 C 134 200 140 200 142 202.5 C 140 205 134 205 132 202.5 Z', fill: TOOTH, stroke: BONE_L, lw: 1, pick: false},
    {id: 'jaw', d: 'M 204 172 C 209 178 210 188 206 194 C 199 199 180 199 160 200 L 160 195 C 178 195 194 193 199 187 C 202 182 202 177 200 173 Z', fill: TOOTH, stroke: BONE_L, lw: 1.2, thin: true},
    {id: 'larynx', d: 'M 131 204 C 136 205 138.5 212 138 222 C 137.5 233 134.5 241 129 246 L 129 238 C 132 234 133.5 228 133.5 222 C 133.5 215 132.5 211 131 210 Z', fill: TOOTH, stroke: BONE_L, lw: 1.2, thin: true},
    {id: 'trachea', path: rings(), fill: TOOTH, stroke: BONE_L, lw: 1.1, thin: true},
    {id: 'teeth', d: 'M 202 140.5 L 206 140.5 C 208 143.5 209 147 208.6 150.6 C 206.5 151.4 204.8 151 204 150 C 203 147 202.2 143.5 202 140.5 Z M 205 170 L 201.2 170 C 201 166 202 160.5 204 157 C 206 156.4 207.5 156.6 208 157.6 C 208.2 161.5 207 166 205 170 Z', fill: '#fffaf0', stroke: BONE_L, lw: 1.1, thin: true},
    {id: 'lips', d: 'M 213 141 C 215 143 216.6 145 217 147.5 C 217.5 150 216 151.5 213 151.5 C 211 151.5 209.5 150.5 209 149 C 210 146 211.5 143 213 141 Z M 213 156.5 C 217 157 218 161 215 166 C 213 167.5 210.5 167.5 209 166 C 208.5 162 209.5 158.5 213 156.5 Z', fill: '#df8a86', stroke: SKIN_L, lw: 1.1, thin: true},
    HEAD.outline,
    HEAD.hair,
    HEAD.nostril,
    HEAD.eye,
    HEAD.iris,
    HEAD.lid,
    HEAD.brow,
    // air flow: lungs → trachea → vocal folds → pharynx → mouth → out through the lips
    {id: 'flow', d: 'M 120 297 L 120 246 M 109.5 205 L 109.5 178 C 109.5 162 116 154.5 133 154 L 192 152.8', fill: null, stroke: FLOW, lw: 1.7, pick: false},
    {id: 'flowHead', d: 'M 120 239 L 116.2 247 L 123.8 247 Z M 199 152.6 L 191 148.8 L 191 156.6 Z', fill: FLOW, stroke: FLOW, lw: 0.8, pick: false},
    // sub-regions of the airway (pick + highlight only, painted only when selected)
    {id: 'nasal', dyn: true, region: true, d: 'M 209 128 C 211 119 205 108 193 104 C 174 100 148 102 130 107 L 130 140.5 C 138 139 145 138 150 137.5 C 168 135.5 190 134.5 206 134 Z'},
    {id: 'mouth', dyn: true, region: true, d: 'M 214 152 L 207.5 151.2 L 203 141.5 C 188 142.5 168 142.5 150 143.5 C 144 144 137 147 132 151 C 130 153.5 128.5 157.5 126.5 157.5 C 127 160 131 161.5 138 162 C 150 157 170 157 187 157.5 C 197 158 202 161 204.5 157 L 214 156.5 Z'},
    {id: 'throat', dyn: true, region: true, d: 'M 130 107 C 116 111 105 120 104 134 L 104 200 C 104 208 110 211 112 214 L 130 214 C 131 206 131 198 124 188 C 121 178 122 168 128 160 C 125 154 126 148 130 142 Z'},
    {id: 'cords', dyn: true, thin: true, fill: CORD, stroke: CORD_L, lw: 1.2, d: `M ${FX0} ${FY - 9} L ${FX1} ${FY - 9} L ${FX1} ${FY + 9} L ${FX0} ${FY + 9} Z`}
  ];
  const fig = new Figure(TALK_W, TALK_H, parts);
  fig.mouth = MOUTH;
  // b ∈ [-1, 1]: opening of the vocal folds (follows u(0,t) – they open and close at the sound frequency). No allocation.
  fig.drawDyn = (ctx, b) => {
    fig.begin(ctx);
    const g = 2 + 1.8 * b, mid = (FX0 + FX1) / 2, s = fig.s, sel = fig.sel === 'cords';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();                                            // two folds from the side walls, the gap between them opens and closes
    ctx.moveTo(FX0 - 1, FY - 11); ctx.quadraticCurveTo(mid - g - 1.5, FY - 4, mid - g, FY + 1); ctx.lineTo(FX0 - 1, FY + 8); ctx.closePath();
    ctx.moveTo(FX1 + 1, FY - 11); ctx.quadraticCurveTo(mid + g + 1.5, FY - 4, mid + g, FY + 1); ctx.lineTo(FX1 + 1, FY + 8); ctx.closePath();
    ctx.fillStyle = CORD; ctx.fill();
    ctx.strokeStyle = sel ? C.red : CORD_L; ctx.lineWidth = sel ? 3.2 / s : 1.3; ctx.stroke();
    // selected static part: red outline
    const sp = fig.sel && fig.by[fig.sel];
    if (sp && (!sp.dyn || sp.region)) {
      if (sp.region) { ctx.fillStyle = 'rgba(215,25,31,0.16)'; ctx.fill(sp.path); }   // flat translucent tint, no glow
      fig.mark(ctx, sp);
    }
    fig.end(ctx);
  };
  return fig;
}
