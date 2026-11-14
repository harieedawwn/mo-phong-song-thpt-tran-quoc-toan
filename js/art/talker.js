// Flat sagittal cross-section of a speaking person (head + neck, face to the right).
// Vocal tract from the source: dây thanh âm (larynx) → họng (pharynx) → khoang miệng → môi.
// Design units: 232 × 285, mouth opening at (212, 149).
import {Figure} from './figure.js';
import {C, roundRect} from '../draw/ink.js';

export const TALK_W = 232, TALK_H = 285, MOUTH = [213, 149];
const SKIN = '#f3c9b1', SKIN_L = '#9c5b43', IN = '#e98f93', TONGUE = '#d9727a', TOOTH = '#f4ecd8', BONE_L = '#a08a62', VERT = '#efe3c6', CORD = '#c2255c';

const SLIT_END = ' L 206 147.5 L 206 151.5 ';
const SILHOUETTE = 'M 176 -10 C 188 10 196 34 198 56 C 198 64 194 70 195 74 C 203 88 216 104 229 114 C 231 120 224 125 212 126 L 209 130 ' +
  'C 213 134 217 140 216 146 L 206 147.5 L 206 151.5 L 215 153 C 218 157 218 160 213 164 C 207 166 206 172 210 180 C 214 190 210 204 198 210 C 184 214 160 214 146 218 ' +
  'L 140 224 C 149 230 149 246 140 252 L 140 296 L 36 296 L 36 226 C 36 200 28 180 20 160 C 8 130 4 90 6 50 C 8 20 30 -10 70 -10 Z';

function vertebrae() {
  const p = new Path2D(), sp = new Path2D();
  for (let i = 0; i < 12; i++) {
    const y = 118 + i * 24, x = 66 + 4 * Math.sin(i * 0.5 + 0.4);
    roundRect(p, x, y, 22, 19, 4);
    // spinous process pointing back (to the left)
    sp.moveTo(x + 1, y + 6); sp.lineTo(x - 22, y + 12); sp.lineTo(x - 22, y + 16); sp.lineTo(x + 1, y + 15); sp.closePath();
  }
  p.addPath(sp);
  return p;
}

export const TALK_NAMES = {mouth: 'Khoang miệng', throat: 'Họng', tongue: 'Lưỡi', cords: 'Dây thanh âm', nasal: 'Khoang mũi', spine: 'Cột sống cổ', teeth: 'Răng', lips: 'Môi', larynx: 'Thanh quản', trachea: 'Khí quản', epi: 'Nắp thanh quản', jaw: 'Xương hàm dưới'};
export const TALK_CAPS = {
  cords: 'Dây thanh âm: rung lên khi nói, là nguồn dao động phát ra âm.',
  throat: 'Họng: dẫn sóng âm từ thanh quản lên khoang miệng.',
  mouth: 'Khoang miệng: định dạng âm thanh; sóng âm truyền ra không khí qua môi.',
  tongue: 'Lưỡi: thay đổi hình dạng khoang miệng nên thay đổi âm sắc của giọng.',
  nasal: 'Khoang mũi: khoang rỗng phía trên vòm miệng.',
  spine: 'Cột sống cổ: các đốt sống phía sau họng.',
  teeth: 'Răng: cùng với môi và lưỡi tạo ra các phụ âm.',
  lips: 'Môi: mở ra để sóng âm truyền ra không khí.',
  larynx: 'Thanh quản: sụn bao quanh dây thanh âm.',
  trachea: 'Khí quản: ống dẫn không khí từ phổi lên thanh quản.',
  epi: 'Nắp thanh quản: đóng lối vào khí quản khi nuốt.',
  jaw: 'Xương hàm dưới: nâng đỡ lưỡi và môi dưới.'
};
export const TALK_LABELS = [
  ['nasal', 'Khoang mũi', 150, 98, 'top'], ['mouth', 'Khoang miệng', 165, 137, 'top'], ['throat', 'Họng', 104, 170, 'top'],
  ['tongue', 'Lưỡi', 150, 172, 'bottom'], ['cords', 'Dây thanh âm (nguồn dao động)', 108, 228, 'bottom']
];

export function makeTalker() {
  const parts = [
    {id: 'skin', d: SILHOUETTE, fill: SKIN, pick: false},
    {id: 'hair', d: 'M 176 -10 L 70 -10 C 30 -10 8 20 6 50 C 4 90 8 130 20 160 L 28 164 C 26 140 22 118 22 94 C 22 56 42 28 78 14 C 112 6 150 8 182 22 Z', fill: '#5b4636', stroke: '#3b2c20', lw: 1.5, pick: false},
    {id: 'ear', d: 'M 56 76 C 44 72 40 86 46 100 C 50 110 60 114 66 110 C 72 104 70 86 66 78 C 64 74 60 74 56 76 Z', fill: '#eab69b', stroke: SKIN_L, lw: 1.4, pick: false},
    {id: 'nasal', d: 'M 212 120 C 206 104 198 92 188 86 C 166 82 136 90 118 100 C 108 106 100 112 98 124 L 98 142 L 108 142 C 114 132 120 124 130 118 C 152 108 188 114 207 132 Z', fill: '#f7c5c8', stroke: '#c2255c', lw: 1.3},
    {id: 'turb', d: 'M 142 97 C 158 95 172 99 180 105 M 128 107 C 150 104 168 110 178 116', fill: null, stroke: '#d9727a', lw: 1.5, pick: false},
    {id: 'maxilla', d: 'M 206 130 C 188 114 152 108 130 118 L 132 127 C 152 118 182 126 197 138 L 207 140 Z', fill: TOOTH, stroke: BONE_L, lw: 1.4, pick: false},
    {id: 'spine', d: null, path: vertebrae(), fill: VERT, stroke: BONE_L, lw: 1.5},
    {id: 'tract', d: 'M 212 147.4 L 199 147 L 197 138 C 182 126 152 118 132 127 C 122 132 114 144 110 156 C 106 162 98 158 97 150 L 96 296 L 116 296 L 116 232 C 116 218 119 206 120 198 C 119 190 117 184 117 178 C 118 168 126 158 140 153 C 160 148 180 154 197 156 L 199 152.4 L 212 152.6 Z', fill: IN, pick: false},
    {id: 'tractline', d: 'M 212 147.4 L 199 147 L 197 138 C 182 126 152 118 132 127 C 122 132 114 144 110 156 C 106 162 98 158 97 150 L 96 296 M 116 296 L 116 232 C 116 218 119 206 120 198 C 119 190 117 184 117 178 C 118 168 126 158 140 153 C 160 148 180 154 197 156 L 199 152.4 L 212 152.6', fill: null, stroke: '#a8424a', lw: 1.4, pick: false},
    {id: 'tongue', d: 'M 197 156 C 180 154 160 148 140 153 C 126 158 118 168 117 178 L 120 200 C 134 208 164 192 182 180 C 192 174 198 168 197 156 Z', fill: TONGUE, stroke: '#a8424a', lw: 1.5},
    {id: 'jaw', d: 'M 198 164 C 206 176 210 190 204 202 C 198 212 182 214 150 214 L 148 204 C 170 200 186 196 194 186 C 198 180 198 172 196 168 Z', fill: TOOTH, stroke: BONE_L, lw: 1.4},
    {id: 'epi', d: 'M 119 198 C 124 190 130 184 128 174 C 123 178 117 186 116 196 Z', fill: '#c9737d', stroke: '#a8424a', lw: 1.2, thin: true},
    {id: 'larynx', d: 'M 116 206 C 128 204 138 212 138 226 C 138 242 128 252 116 254 L 116 244 C 123 242 127 236 127 228 C 127 220 123 216 116 216 Z', fill: TOOTH, stroke: BONE_L, lw: 1.4},
    {id: 'trachea', d: 'M 116 264 h 9 v 6 h -9 z M 116 278 h 9 v 6 h -9 z M 116 290 h 9 v 6 h -9 z', fill: TOOTH, stroke: BONE_L, lw: 1.2, thin: true},
    {id: 'teeth', d: 'M 198.5 132 Q 198.5 130 201 130 L 205 130 Q 207 130 207 132 L 206.5 144 Q 206 147 203 147 L 200 147 Q 198.5 146.5 198.5 144 Z M 199 154 Q 199 152 201 152 L 205 152 Q 206.5 152 206.5 154 L 206.5 164 Q 206.5 166 204 166 L 201 166 Q 199 166 199 164 Z', fill: TOOTH, stroke: BONE_L, lw: 1.3, thin: true},
    {id: 'lips', d: 'M 207 129 L 209 130 C 213 134 217 140 216 146 L 206 147.5 Z M 206 151.5 L 215 153 C 218 157 218 160 213 164 L 207 166 Z', fill: '#e58a8c', stroke: SKIN_L, lw: 1.3, thin: true},
    {id: 'outline', d: SILHOUETTE.replace(SLIT_END.trim(), 'M 206 151.5').replace(/ Z$/, ' L 176 -10'), fill: null, stroke: SKIN_L, lw: 2, pick: false},
    {id: 'eye', d: 'M 177 73 Q 187 65 196 72 Q 187 79 177 73 Z', fill: '#fff', stroke: C.ink2, lw: 1.1, pick: false},
    {id: 'iris', d: 'M 184.4 72.4 a 3.6 3.6 0 1 0 7.2 0 a 3.6 3.6 0 1 0 -7.2 0 Z', fill: '#5b4636', pick: false},
    {id: 'brow', d: 'M 175 60 Q 187 53 199 59', fill: null, stroke: '#5b4636', lw: 2.6, pick: false},
    // sub-regions of the vocal tract (pick + highlight only)
    {id: 'mouth', ghost: true, src: 'tract', clip: 'M 126 100 L 230 100 L 230 160 L 126 160 Z'},
    {id: 'throat', ghost: true, src: 'tract', clip: 'M 90 140 L 126 140 L 126 205 L 90 205 Z'},
    {id: 'air1', d: 'M 104 224 L 104 190 L 99 190 L 106 176 L 113 190 L 108 190 L 108 224 Z', fill: '#fff', stroke: SKIN_L, lw: 0.9, pick: false},
    {id: 'air2', d: 'M 134 136.5 L 178 138.5 L 178 135 L 190 140 L 178 145 L 178 141.5 L 134 139.5 Z', fill: '#fff', stroke: SKIN_L, lw: 0.9, pick: false},
    {id: 'cords', dyn: true, thin: true, fill: CORD, stroke: '#7a1236', lw: 1.2, d: 'M 96 226 L 112 226'}
  ];
  const fig = new Figure(TALK_W, TALK_H, parts);
  for (const p of parts) if (p.ghost) { p.clipPath = new Path2D(p.clip); p.path = fig.by[p.src].path; }
  fig.mouth = MOUTH;
  const P = id => fig.by[id];
  // b ∈ [-1, 1]: opening of the vocal folds (follows u(0,t) – they open and close at the sound frequency)
  fig.drawDyn = (ctx, b) => {
    fig.begin(ctx);
    const h = 4.5 + 4 * b, s = fig.s, sel = fig.sel === 'cords';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const wedge = (x0, x1) => { ctx.beginPath(); ctx.moveTo(x0, 216); ctx.lineTo(x1, 226); ctx.lineTo(x0, 236); ctx.closePath(); };
    for (const [x0, x1] of [[116, 106 + h], [96, 106 - h]]) {
      wedge(x0, x1); ctx.fillStyle = CORD; ctx.fill();
      ctx.strokeStyle = sel ? C.red : '#7a1236'; ctx.lineWidth = sel ? 3.4 / s : 1.4; ctx.stroke();
    }
    // selected static part: red outline
    const sp = fig.sel && P(fig.sel);
    if (sp && !sp.dyn) {
      if (sp.ghost) { ctx.save(); ctx.clip(sp.clipPath); ctx.strokeStyle = C.red; ctx.lineWidth = 3.4 / s; ctx.stroke(sp.path); ctx.restore(); }
      else fig.mark(ctx, sp);
    }
    fig.end(ctx);
  };
  return fig;
}
